"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Variant {
    id: string;
    variant_name: string;
    base_price: number;
    inventory_stocks: {
        qty: number;
    }[];
    display_price?: number; // Menampung harga dinamis hasil kalkulasi level
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [addingToCart, setAddingToCart] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);

    useEffect(() => {
        fetchProduct();
    }, [params.slug]);

    const fetchProduct = async () => {
        try {
            setLoading(true);

            // 1. Dapatkan user session saat ini
            const { data: { user } } = await supabase.auth.getUser();
            let userLevel = 'konsumen'; // Default level jika belum login

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("level")
                    .eq("id", user.id)
                    .single();
                if (profile) userLevel = profile.level;
            }

            // 2. Ambil detail produk beserta varian stok
            const { data, error } = await supabase
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
                        ),
                        product_variant_prices (
                            price,
                            level
                        )
                    )
                `)
                .eq("slug", params.slug)
                .eq("is_active", true)
                .single();

            if (error) throw error;

            if (data) {
                // 3. Format harga varian berdasarkan level user saat ini
                const formattedVariants = data.product_variants?.map((v: any) => {
                    // Cari apakah ada harga khusus level akun di tabel product_variant_prices
                    const specialPriceObj = v.product_variant_prices?.find((p: any) => p.level === userLevel);
                    return {
                        id: v.id,
                        variant_name: v.variant_name,
                        base_price: Number(v.base_price || 0),
                        inventory_stocks: v.inventory_stocks || [],
                        display_price: specialPriceObj ? Number(specialPriceObj.price) : Number(v.base_price || 0)
                    };
                }) || [];

                const formattedProduct = {
                    ...data,
                    product_variants: formattedVariants
                };

                setProduct(formattedProduct);

                if (formattedVariants.length > 0) {
                    setSelectedVariant(formattedVariants[0]);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil detail produk:", error);
        } finally {
            setLoading(false);
        }
    };

    // FUNGSI UTAMA: Tambah Ke Keranjang (Mengikuti logika ProductsPage)
    const handleAddToCart = async (redirectToCart: boolean = false) => {
        if (!selectedVariant) return;

        try {
            setAddingToCart(true);

            // 1. Validasi Autentikasi User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }

            // 2. Cari atau Buat Keranjang Aktif (Carts) milik user
            let { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!cart) {
                const { data: newCart, error: cartError } = await supabase
                    .from("carts")
                    .insert({ user_id: user.id })
                    .select("id")
                    .single();

                if (cartError) throw cartError;
                cart = newCart;
            }

            // 3. Periksa apakah item varian yang sama sudah ada di keranjang
            const { data: existingItem } = await supabase
                .from("cart_items")
                .select("id, qty")
                .eq("cart_id", cart.id)
                .eq("variant_id", selectedVariant.id)
                .maybeSingle();

            if (existingItem) {
                // Jika ada, tambahkan quantity (+1)
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ qty: existingItem.qty + 1 })
                    .eq("id", existingItem.id);

                if (updateError) throw updateError;
            } else {
                // Jika belum ada, buat baris item baru
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert({
                        cart_id: cart.id,
                        variant_id: selectedVariant.id,
                        qty: 1
                    });

                if (insertError) throw insertError;
            }

            // 4. Trigger event global untuk memperbarui badge jumlah di header (jika ada)
            window.dispatchEvent(new Event("cart-updated"));

            if (redirectToCart) {
                router.push("/carts");
            } else {
                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                }, 2000);
            }

        } catch (error) {
            console.error("Gagal menambah ke keranjang:", error);
            alert("Gagal menambahkan produk ke keranjang");
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-sm text-slate-400 font-medium animate-pulse">
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

    // Hitung total akumulasi stok dari gudang untuk varian yang dipilih
    const stock = selectedVariant?.inventory_stocks?.reduce(
        (a, b) => a + b.qty,
        0
    ) || 0;

    return (
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">

                {/* IMAGE CONTAINER */}
                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/3] md:aspect-square w-full max-h-[400px] md:max-h-[480px] flex items-center justify-center shadow-sm">
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
                            {product?.product_categories?.name || "Tanpa Kategori"}
                        </span>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                            {product.name}
                        </h1>
                    </div>

                    {/* PRICE & STOCK INFO */}
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div className="text-xl md:text-2xl font-extrabold text-emerald-600">
                            {/* Menggunakan display_price agar dinamis menyesuaikan level */}
                            Rp {Number(selectedVariant?.display_price || selectedVariant?.base_price || 0).toLocaleString("id-ID")}
                        </div>
                        <div className={`text-xs mt-1 font-medium ${stock > 0 ? "text-slate-500" : "text-red-500"}`}>
                            {stock > 0 ? `Stok : ${stock} pcs` : "Stok Habis"}
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
                            {product.description || "Tidak ada deskripsi untuk produk ini."}
                        </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex sm:flex-row gap-2 pt-1">
                        {/* BUTTON: TAMBAH KERANJANG */}
                        <button
                            disabled={stock === 0 || addingToCart}
                            onClick={() => handleAddToCart(false)}
                            className="flex-1 flex items-center justify-center h-10 text-xs md:text-sm rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {addingToCart ? "Memproses..." : "Keranjang"}
                        </button>

                        {/* BUTTON: BELI SEKARANG */}
                        <Button
                            disabled={stock === 0 || addingToCart}
                            onClick={() => handleAddToCart(true)}
                            className="flex-1 h-10 text-xs md:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Beli Sekarang
                        </Button>
                    </div>

                </div>
            </div>

            {/* TOAST MESSAGE */}
            {showToast && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900/90 text-white px-5 py-3 rounded-xl shadow-xl flex flex-col items-center gap-1.5 max-w-xs text-center backdrop-blur-sm">
                        {/* Icon centang hijau kecil yang manis */}
                        <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-xs font-medium tracking-wide">
                            Berhasil dimasukkan ke keranjang
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}