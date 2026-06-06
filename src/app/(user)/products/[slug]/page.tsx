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
    const [loading, setLoading] = useState<boolean>(true); // State loading yang lebih jelas

    useEffect(() => {
        fetchProduct();
    }, [params.slug]); // Masukkan params.slug ke dependency array agar aman

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

    // Handler jika data sedang dimuat
    if (loading) {
        return (
            <div className="p-10 text-center text-slate-500 font-medium">
                Memuat detail produk...
            </div>
        );
    }

    // Handler jika produk tidak ditemukan di database
    if (!product) {
        return (
            <div className="p-10 text-center text-slate-500 font-medium">
                Produk tidak ditemukan atau sudah tidak aktif.
            </div>
        );
    }

    // Logika perhitungan stokmu sudah sangat bagus & benar!
    const stock = selectedVariant?.inventory_stocks?.reduce(
        (a, b) => a + b.qty,
        0
    ) || 0;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="grid md:grid-cols-2 gap-8">

                {/* IMAGE */}
                <div className="rounded-3xl overflow-hidden border bg-slate-100 aspect-square">
                    <img
                        src={product.image_url || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* CONTENT */}
                <div className="space-y-5">
                    <div>
                        <div className="text-sm text-emerald-600 font-medium mb-2">
                            {product?.product_categories?.name}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900">
                            {product.name}
                        </h1>
                    </div>

                    <p className="text-slate-600 leading-relaxed">
                        {product.description}
                    </p>

                    {/* VARIANT */}
                    {product.product_variants?.length > 0 && (
                        <div className="space-y-3">
                            <div className="font-semibold">
                                Pilih Variant
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Perbaikan penulisan tipe data di dalam map agar aman dari error build */}
                                {product.product_variants.map((variant: Variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setSelectedVariant(variant)}
                                        className={`px-4 py-2 rounded-xl border text-sm transition ${selectedVariant?.id === variant.id
                                                ? "bg-emerald-600 border-emerald-600 text-white"
                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                    >
                                        {variant.variant_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRICE */}
                    <div>
                        <div className="text-3xl font-black text-emerald-600">
                            Rp{" "}
                            {Number(selectedVariant?.base_price || 0).toLocaleString("id-ID")}
                        </div>

                        {/* Variasi warna teks berdasarkan ketersediaan stok */}
                        <div className={`text-sm mt-1 font-medium ${stock > 0 ? "text-slate-500" : "text-red-500"}`}>
                            {stock > 0 ? `Stok tersedia: ${stock}` : "Stok Habis"}
                        </div>
                    </div>

                    {/* ACTION */}
                    <div className="flex gap-3">
                        {/* Menambahkan properti disabled jika stok kosong */}
                        <button
                            disabled={stock === 0}
                            className="flex-1 flex items-center justify-center h-12 rounded-2xl border border-slate-200 bg-white font-medium text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Masukkan Keranjang
                        </button>

                        <Button
                            disabled={stock === 0}
                            className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Beli Sekarang
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}