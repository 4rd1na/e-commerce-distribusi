"use client";

import { useEffect, useState, useRef } from "react";
import { ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
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
    const [activeIdx, setActiveIdx] = useState<number>(0);

    // KUNCI SMOOTH: Ref untuk mengontrol container scroll secara programmatik
    const sliderRef = useRef<HTMLDivElement>(null);

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
                    product_galleries (
                        media_url,
                        media_type,
                        position
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
                .order("position", { foreignTable: "product_galleries", ascending: true })
                .single();

            if (error) {
                if (error.code === '42501') {
                    console.warn("Akses product_galleries ditolak (RLS). Mengambil data produk dasar saja...");
                    const { data: basicData, error: basicError } = await supabase
                        .from("products")
                        .select(`
                            *,
                            product_categories (name),
                            product_variants (
                                id, variant_name, base_price,
                                inventory_stocks (qty),
                                product_variant_prices (price, level)
                            )
                        `)
                        .eq("slug", params.slug)
                        .eq("is_active", true)
                        .single();

                    if (basicError) throw basicError;
                    handleSetupProduct(basicData, userLevel);
                } else {
                    throw error;
                }
            } else if (data) {
                handleSetupProduct(data, userLevel);
            }
        } catch (error) {
            console.error("Gagal mengambil detail produk:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetupProduct = (data: any, userLevel: string) => {
        const formattedVariants = data.product_variants?.map((v: any) => {
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
        setActiveIdx(0);

        const firstAvailableVariant = formattedVariants.find((v: any) =>
            (v.inventory_stocks?.reduce((a: number, b: any) => a + b.qty, 0) || 0) > 0
        );

        if (formattedVariants.length > 0) {
            setSelectedVariant(firstAvailableVariant || formattedVariants[0]);
        }
    };

    const handleAddToCart = async (redirectToCart: boolean = false) => {
        if (!selectedVariant) return;

        try {
            setAddingToCart(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }

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

            const { data: existingItem } = await supabase
                .from("cart_items")
                .select("id, qty")
                .eq("cart_id", cart.id)
                .eq("variant_id", selectedVariant.id)
                .maybeSingle();

            if (existingItem) {
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ qty: existingItem.qty + 1 })
                    .eq("id", existingItem.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert({
                        cart_id: cart.id,
                        variant_id: selectedVariant.id,
                        qty: 1
                    });

                if (insertError) throw insertError;
            }

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

    // FUNGSI NAVIGASI SLIDER BARU: Agar perpindahan media animasi gesernya halus
    const scrollToIdx = (idx: number) => {
        if (!sliderRef.current) return;
        const container = sliderRef.current;
        const width = container.clientWidth;

        container.scrollTo({
            left: idx * width,
            behavior: "smooth" // Efek animasi transisi geser horizontal halus
        });
        setActiveIdx(idx);
    };

    // Fungsi handle jika pembeli swiping manual lewat layar touchscreen HP
    const handleScrollDetect = (e: any) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const width = container.clientWidth;
        const newIdx = Math.round(scrollLeft / width);
        if (newIdx !== activeIdx && newIdx >= 0) {
            setActiveIdx(newIdx);
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

    const productMedia = product?.product_galleries && product.product_galleries.length > 0
        ? product.product_galleries
        : [{ media_url: product?.image_url || "/placeholder.png", media_type: "image" }];

    const stock = selectedVariant?.inventory_stocks?.reduce(
        (a, b) => a + b.qty,
        0
    ) || 0;

    return (
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">

                {/* IMAGE & VIDEO MULTI-SLIDER (ALA SHOPEE - SMOOTH VERSION) */}
                <div className="w-full space-y-3">

                    {/* Frame Utama Media */}
                    <div className="relative aspect-square bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group shadow-sm">

                        {/* Container Horizontal Scroll dengan Snap CSS */}
                        <div
                            ref={sliderRef}
                            onScroll={handleScrollDetect}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
                        >
                            {productMedia.map((mediaItem: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="w-full h-full shrink-0 snap-center flex items-center justify-center relative"
                                >
                                    {mediaItem?.media_type === "video" ? (
                                        <video
                                            src={mediaItem?.media_url}
                                            controls
                                            playsInline
                                            className="w-full h-full object-contain bg-slate-950"
                                        />
                                    ) : (
                                        <img
                                            src={mediaItem?.media_url}
                                            alt={`${product.name}-${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Tombol Panah Kiri & Kanan */}
                        {productMedia.length > 1 && (
                            <>
                                <button
                                    onClick={() => {
                                        const prevIdx = activeIdx === 0 ? productMedia.length - 1 : activeIdx - 1;
                                        scrollToIdx(prevIdx);
                                    }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow opacity-0 group-hover:opacity-100 transition duration-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        const nextIdx = activeIdx === productMedia.length - 1 ? 0 : activeIdx + 1;
                                        scrollToIdx(nextIdx);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow opacity-0 group-hover:opacity-100 transition duration-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Indikator Angka */}
                        {productMedia.length > 1 && (
                            <div className="absolute right-3 bottom-3 z-10 bg-slate-950/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                                {activeIdx + 1}/{productMedia.length}
                            </div>
                        )}
                    </div>

                    {/* Barisan Thumbnail Kecil di Bawah Frame Utama */}
                    {productMedia.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {productMedia.map((mediaItem: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => scrollToIdx(idx)}
                                    className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden bg-slate-50 shrink-0 transition-all ${activeIdx === idx
                                        ? "border-emerald-600 shadow-sm scale-95"
                                        : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {mediaItem.media_type === "video" ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white relative">
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-xs">▶</div>
                                        </div>
                                    ) : (
                                        <img
                                            src={mediaItem.media_url}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
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
                                {product.product_variants.map((variant: Variant) => {
                                    // 1. Hitung stok untuk varian ini
                                    const variantStock = variant.inventory_stocks?.reduce(
                                        (a, b) => a + b.qty,
                                        0
                                    ) || 0;

                                    const isOutOfStock = variantStock === 0;

                                    return (
                                        <button
                                            key={variant.id}
                                            disabled={isOutOfStock} // 2. Kunci tombol jika stok habis
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${selectedVariant?.id === variant.id
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                : isOutOfStock
                                                    ? "border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed opacity-60" // 3. Styling jika habis
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            {variant.variant_name}
                                        </button>
                                    );
                                })}
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
                        <button
                            disabled={stock === 0 || addingToCart}
                            onClick={() => handleAddToCart(false)}
                            className="flex-1 flex items-center justify-center h-10 text-xs md:text-sm rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {addingToCart ? "Memproses..." : "Keranjang"}
                        </button>

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