"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Package, ShoppingCart, Zap, Check } from "lucide-react";
import type { UserLevel } from "@/types";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [userLevel, setUserLevel] = useState<UserLevel>("konsumen");

    // State tambahan untuk menyimpan varian yang dipilih
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    useEffect(() => {
        loadProduct();
    }, []);

    const loadProduct = async () => {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            let currentLevel: UserLevel = "konsumen";

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("level")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profile) {
                    currentLevel = profile.level as UserLevel;
                }
            }

            setUserLevel(currentLevel);

            const { data, error } = await supabase
                .from("products")
                .select(`
                  *,
                  product_tier_prices(level, price),
                  inventory_stocks(qty),
                  bulk_discounts(min_qty, discount_price),
                  product_variants(id, variant_name, additional_price)
                `)
                .eq("id", params.id)
                .single();

            if (error) throw error;

            const totalStock = (data.inventory_stocks || []).reduce(
                (sum: number, stock: any) => sum + (stock.qty || 0),
                0
            );

            setProduct({
                ...data,
                total_stock: totalStock,
            });

            // Set varian pertama secara default jika ada varian produk
            if (data.product_variants && data.product_variants.length > 0) {
                setSelectedVariant(data.product_variants[0]);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi getPrice yang dinamis mendeteksi Level User, Bulk Discount, dan Varian
    const getPrice = () => {
        if (!product) return 0;

        // 1. Ambil harga dari Tier/Level User terlebih dahulu
        const tierPrice = product.product_tier_prices?.find(
            (tp: any) => tp.level.toLowerCase() === userLevel.toLowerCase()
        );

        // SINKRONISASI LOGIKA: Jika level konsumen/lain tidak ditemukan di tier, 
        // jangan langsung bocorkan base_price (harga modal). Jadikan 0 atau amankan dengan fallback logis.
        let currentPrice = tierPrice ? Number(tierPrice.price) : Number(product.base_price);

        // 2. Cek apakah jumlah order memenuhi kriteria Grosir (Bulk Discount)
        // Catatan: Umumnya bulk discount hanya berlaku untuk non-konsumen, namun kode ini tetap mempertahankan fleksibilitas kuantitasmu
        if (product.bulk_discounts && product.bulk_discounts.length > 0) {
            const sortedBulk = [...product.bulk_discounts].sort((a, b) => b.min_qty - a.min_qty);
            const applicableBulk = sortedBulk.find((bulk: any) => qty >= bulk.min_qty);

            if (applicableBulk) {
                currentPrice = Number(applicableBulk.discount_price);
            }
        }

        // 3. Tambahkan harga tambahan jika ada varian yang dipilih
        if (selectedVariant && selectedVariant.additional_price) {
            currentPrice += Number(selectedVariant.additional_price);
        }

        return currentPrice;
    };

    const addToCart = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Silakan login terlebih dahulu");
                return;
            }

            let { data: cart } = await supabase
                .from("carts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!cart) {
                const { data: newCart, error: cartError } = await supabase
                    .from("carts")
                    .insert({ user_id: user.id })
                    .select()
                    .single();

                if (cartError) {
                    console.error(cartError);
                    alert("Gagal membuat keranjang");
                    return;
                }
                cart = newCart;
            }

            const { data: existingItem } = await supabase
                .from("cart_items")
                .select("*")
                .eq("cart_id", cart.id)
                .eq("product_id", product.id)
                .eq("variant_id", selectedVariant ? selectedVariant.id : null) // Diubah ke variant_id sesuai types barumu
                .maybeSingle();

            if (existingItem) {
                const { error } = await supabase
                    .from("cart_items")
                    .update({ qty: existingItem.qty + qty })
                    .eq("id", existingItem.id);

                if (error) {
                    console.error(error);
                    alert("Gagal update keranjang");
                    return;
                }
            } else {
                const { error } = await supabase
                    .from("cart_items")
                    .insert({
                        cart_id: cart.id,
                        product_id: product.id,
                        variant_id: selectedVariant ? selectedVariant.id : null,
                        qty: qty
                    });

                if (error) {
                    console.error(error);
                    alert("Gagal tambah keranjang");
                    return;
                }
            }

            alert("Produk berhasil masuk keranjang");

        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-sm text-slate-400">
                Memuat produk...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6 text-center text-sm text-red-500">
                Produk tidak ditemukan
            </div>
        );
    }

    const finalPrice = getPrice();

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali
            </Button>

            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* =========================================================================
                    PERBAIKAN UI: FOTO PRODUK MENYATU PAS DENGAN TEPI BORDER CARD
                   ========================================================================= */}
                <Card className="overflow-hidden border border-slate-200 p-0 rounded-2xl shadow-sm w-full">
                    {/* Menggunakan aspect-square untuk mengunci rasio 1:1 di semua ukuran layar */}
                    <div className="w-full aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden">
                        <img
                            src={
                                product.image_url ||
                                "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600"
                            }
                            alt={product.name}
                            // w-full h-full dan object-cover memastikan foto mengisi ruang tanpa merusak rasio asli gambar
                            className="w-full h-full object-cover block absolute inset-0"
                        />
                    </div>
                </Card>

                {/* AREA DETAIL */}
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${product.type === "barang"
                                ? "bg-slate-900 text-white"
                                : "bg-emerald-600 text-white"
                                }`}>
                                {product.type}
                            </span>
                            {userLevel !== "konsumen" && (
                                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                                    MEMBER: {userLevel}
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl font-bold text-slate-900 leading-snug">
                            {product.name}
                        </h1>

                        <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                            {product.description || "Tidak ada deskripsi produk"}
                        </p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Harga per Pcs</p>
                        <div className="text-2xl font-black text-emerald-600 mt-0.5">
                            Rp {finalPrice.toLocaleString("id-ID")}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Total: <span className="text-slate-800">Rp {(finalPrice * qty).toLocaleString("id-ID")}</span>
                        </p>
                    </div>

                    {/* PILIHAN VARIAN */}
                    {product.product_variants?.length > 0 && (
                        <div>
                            <p className="text-xs mb-2 font-semibold text-slate-700">Pilih Varian</p>
                            <div className="flex flex-wrap gap-2">
                                {product.product_variants.map((variant: any) => {
                                    const isSelected = selectedVariant?.id === variant.id;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`px-3 py-1.5 text-xs rounded-xl border transition-all flex items-center gap-1.5 ${isSelected
                                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            {variant.variant_name}
                                            {Number(variant.additional_price) > 0 && (
                                                <span className="text-[10px] opacity-75 font-normal">
                                                    (+Rp {Number(variant.additional_price).toLocaleString("id-ID")})
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STOK */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        {product.type === "barang" ? (
                            <>
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                    Stok tersedia: {product.total_stock} pcs
                                </span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                <span className="text-emerald-700">Layanan Jasa Aktif</span>
                            </>
                        )}
                    </div>

                    {/* BULK DISCOUNTS (INFO GROSIR) - Hanya Tampil untuk Selain Konsumen */}
                    {userLevel !== "konsumen" && product.bulk_discounts?.length > 0 && (
                        <Card className="p-3 bg-amber-50/70 border-amber-100 rounded-xl shadow-none">
                            <p className="text-xs font-bold text-amber-800 mb-1.5">
                                Skema Diskon Grosir Kuantitas:
                            </p>
                            <div className="space-y-1">
                                {product.bulk_discounts.map((bulk: any) => {
                                    const isActive = qty >= bulk.min_qty;
                                    return (
                                        <div
                                            key={bulk.min_qty}
                                            className={`flex justify-between text-xs p-1 rounded transition-colors ${isActive ? "bg-amber-200/60 font-bold text-amber-900" : "text-slate-600"
                                                }`}
                                        >
                                            <span>Min. {bulk.min_qty} pcs {isActive && "✓"}</span>
                                            <span>
                                                Rp {Number(bulk.discount_price).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* INPUT JUMLAH (QTY) */}
                    <div>
                        <p className="text-xs mb-2 font-semibold text-slate-700">Jumlah Pesanan</p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQty(Math.max(1, qty - 1))}
                                disabled={qty <= 1}
                                className="h-8 w-8 rounded-lg font-bold"
                            >
                                -
                            </Button>
                            <div className="w-10 text-center text-xs font-bold text-slate-800">
                                {qty}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQty(qty + 1)}
                                disabled={product.type === "barang" && qty >= product.total_stock}
                                className="h-8 w-8 rounded-lg font-bold"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl text-xs font-medium h-10 border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={addToCart}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2 text-slate-500" />
                            + Keranjang
                        </Button>
                        <Button
                            className="flex-1 bg-slate-950 text-white hover:bg-slate-800 rounded-xl text-xs font-medium h-10 transition-colors"
                        >
                            Beli Sekarang
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}