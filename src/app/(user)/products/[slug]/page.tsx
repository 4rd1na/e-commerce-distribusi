"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Variant {
    id: string;
    variant_name: string;
    base_price: number;
    inventory_stocks: {
        qty: number;
    }[];
}

export default function ProductDetailPage() {
    const params = useParams();
    const [product, setProduct] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchProduct();
    }, [params.slug]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from("products")
                .select(`
                    *,
                    product_categories (
                        name
                    ),
                    product_variants (
                        id,
                        variant_name,
                        base_price,
                        inventory_stocks (
                            qty
                        )
                    )
                `)
                .eq("slug", params.slug)
                .single();

            setProduct(data);

            if (data?.product_variants?.length) {
                setSelectedVariant(data.product_variants[0]);
            }
        } catch (error) {
            console.error("Gagal mengambil detail produk:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">
                Memuat detail produk...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">
                Produk tidak ditemukan atau sudah tidak aktif.
            </div>
        );
    }

    const stock = selectedVariant?.inventory_stocks?.reduce(
        (a, b) => a + b.qty,
        0
    ) || 0;

    return (
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">

                {/* IMAGE CONTAINER */}
                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/3] md:aspect-square w-full max-h-[400px] md:max-h-[480px] flex items-center justify-center">
                    <img
                        src={product.image_url || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* CONTENT CONTAINER */}
                <div className="space-y-4 md:pt-2">
                    <div>
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-[11px] text-emerald-600 font-semibold rounded-md mb-1.5 uppercase tracking-wider">
                            {product?.product_categories?.name}
                        </span>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                            {product.name}
                        </h1>
                    </div>

                    {/* PRICE & STOCK INFO */}
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div className="text-xl md:text-2xl font-extrabold text-emerald-600">
                            Rp {Number(selectedVariant?.base_price || 0).toLocaleString("id-ID")}
                        </div>
                        <div className={`text-xs mt-1 font-medium ${stock > 0 ? "text-slate-500" : "text-red-500"}`}>
                            {stock > 0 ? `Stok tersedia: ${stock} pcs` : "Stok Habis"}
                        </div>
                    </div>

                    {/* VARIANT SELECTION */}
                    {product.product_variants?.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Pilih Varian
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {product.product_variants.map((variant: Variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setSelectedVariant(variant)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${selectedVariant?.id === variant.id
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        {variant.variant_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DESCRIPTION */}
                    <div className="space-y-1 border-t border-b border-slate-100 py-3">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Deskripsi Produk
                        </h2>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex sm:flex-row gap-2 pt-1">
                        <button
                            disabled={stock === 0}
                            className="flex-1 flex items-center justify-center h-10 text-xs md:text-sm rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-4 h-4 mr-1.5" />
                            Keranjang
                        </button>

                        <Button
                            disabled={stock === 0}
                            className="flex-1 h-10 text-xs md:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag className="w-4 h-4 mr-1.5" />
                            Beli Sekarang
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}