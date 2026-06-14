"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartItem {
    id: string;
    qty: number;
    variant_id: string;
    variant_name: string;
    base_price: number;
    display_price: number;
    product_name: string;
    product_image: string;
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

    const allSelected = items.length > 0 && selectedIds.length === items.length;

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let userLevel = 'konsumen';
            const { data: profile } = await supabase
                .from("profiles")
                .select("level")
                .eq("id", user.id)
                .single();
            if (profile) userLevel = profile.level;

            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!cart) { setItems([]); return; }

            const { data: cartItems, error } = await supabase
                .from("cart_items")
                .select(`
                    id, qty, variant_id,
                    product_variants (
                        variant_name, base_price,
                        product_variant_prices ( price, level ),
                        products ( name, image_url )
                    )
                `)
                .eq("cart_id", cart.id);

            if (error) throw error;

            if (cartItems) {
                const formatted: CartItem[] = cartItems.map((item: any) => {
                    const variant = item.product_variants;
                    const basePrice = Number(variant?.base_price || 0);
                    const levelPrice = variant?.product_variant_prices?.find(
                        (p: any) => p.level === userLevel
                    );
                    const displayPrice = levelPrice ? Number(levelPrice.price) : basePrice;

                    return {
                        id: item.id,
                        qty: item.qty,
                        variant_id: item.variant_id,
                        variant_name: variant?.variant_name || "",
                        base_price: basePrice,
                        display_price: displayPrice,
                        product_name: variant?.products?.name || "Produk Hilang",
                        product_image: variant?.products?.image_url || "",
                    };
                });
                setItems(formatted);
                setSelectedIds(formatted.map(item => item.id));
            }
        } catch (err) {
            console.error("Error loading cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : items.map(item => item.id));
    };

    const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            openDeleteDialog([itemId]);
            return;
        }
        try {
            setItems(prev => prev.map(item => item.id === itemId ? { ...item, qty: newQty } : item));
            const { error } = await supabase
                .from("cart_items")
                .update({ qty: newQty })
                .eq("id", itemId);
            if (error) throw error;
        } catch (err) {
            console.error(err);
            fetchCart();
        }
    };

    const openDeleteDialog = (ids: string[]) => {
        setPendingDeleteIds(ids);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingDeleteIds.length === 0) return;
        try {
            setItems(prev => prev.filter(item => !pendingDeleteIds.includes(item.id)));
            setSelectedIds(prev => prev.filter(id => !pendingDeleteIds.includes(id)));

            const { error } = await supabase
                .from("cart_items")
                .delete()
                .in("id", pendingDeleteIds);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            fetchCart();
        }
        setPendingDeleteIds([]);
        setIsDialogOpen(false);
    };

    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + (item.display_price * item.qty), 0);
    const totalQty = selectedItems.reduce((acc, item) => acc + item.qty, 0);

    const deleteCount = pendingDeleteIds.length;
    const dialogTitle = deleteCount > 1
        ? `Hapus ${deleteCount} Produk dari Keranjang?`
        : "Hapus Produk dari Keranjang?";
    const dialogDesc = deleteCount > 1
        ? `${deleteCount} barang terpilih akan dikeluarkan dari keranjang belanjamu.`
        : "Barang ini akan dikeluarkan dari daftar keranjang belanja milikmu.";

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mb-6" />
                <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3 mb-4 shadow-sm animate-pulse">
                    <div className="w-5 h-5 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4 items-center shadow-sm animate-pulse">
                                <div className="w-5 h-5 bg-slate-200 rounded shrink-0" />
                                <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/3 pt-1" />
                                </div>
                                <div className="flex flex-col items-end gap-4 shrink-0">
                                    <div className="w-4 h-4 bg-slate-200 rounded" />
                                    <div className="w-20 h-7 bg-slate-200 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hidden lg:block bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm animate-pulse">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                            <div className="h-4 w-10 bg-slate-200 rounded" />
                        </div>
                        <div className="flex justify-between pt-1">
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                            <div className="h-5 w-24 bg-slate-200 rounded" />
                        </div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-24 text-center max-w-sm">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <ShoppingBag className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Keranjang Masih Kosong</h2>
                <p className="text-xs text-slate-400 mt-1.5 mb-6 leading-relaxed">
                    Belum ada produk di keranjang belanjamu. Yuk, cari produk menarik sekarang!
                </p>
                <Link href="/">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl text-xs px-5 h-10 font-semibold shadow-sm transition-all">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Mulai Belanja
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl pb-32 lg:pb-12">
            
            {/* Header */}
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                Keranjang Belanja
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full">
                    {items.length}
                </span>
            </h1>

            {/* Select All Bar */}
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-xl flex items-center justify-between gap-3 mb-4 shadow-sm">
                <label className="flex items-center gap-3 min-w-0 cursor-pointer select-none">
                    <button
                        onClick={toggleSelectAll}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                            allSelected
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                        }`}
                    >
                        {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                        Pilih Semua {selectedIds.length > 0 && <span className="text-emerald-600">({selectedIds.length})</span>}
                    </span>
                </label>

                {selectedIds.length > 0 && (
                    <button
                        onClick={() => openDeleteDialog(selectedIds)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 px-3 py-1.5 rounded-lg transition shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                    </button>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                
                {/* Item List */}
                <div className="lg:col-span-2 space-y-3">
                    {items.map((item) => {
                        const isChecked = selectedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`bg-white border rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center transition-all duration-200 ${
                                    isChecked 
                                        ? "border-emerald-500 bg-emerald-50/30 shadow-sm" 
                                        : "border-slate-100 hover:border-slate-200"
                                }`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleSelect(item.id)}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                                        isChecked
                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                            : "border-slate-300 hover:border-slate-400 bg-white"
                                    }`}
                                >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>

                                {/* Image */}
                                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                                        {item.product_name}
                                    </h3>
                                    {item.variant_name && (
                                        <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                            Variasi: {item.variant_name}
                                        </span>
                                    )}
                                    <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-2">
                                        Rp {item.display_price.toLocaleString("id-ID")}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-end gap-3 shrink-0 self-stretch justify-between">
                                    {/* Tombol Hapus Satuan - Diganti ke Trash2 untuk UX yang lebih natural */}
                                    <button
                                        onClick={() => openDeleteDialog([item.id])}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition"
                                        aria-label="Hapus item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Quantity Controller */}
                                    <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.qty, -1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 text-slate-500 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 text-xs font-bold text-slate-800 min-w-[28px] text-center tabular-nums">
                                            {item.qty}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.qty, 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 text-slate-500 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar Summary — Desktop */}
                <div className="hidden lg:block bg-white border border-slate-100 p-5 rounded-2xl h-fit space-y-4 shadow-sm sticky top-24">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ringkasan Belanja</h2>

                    <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                        <span>Total Barang</span>
                        <span className="font-semibold text-slate-700">{totalQty} Barang</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
                        <span>Total Harga</span>
                        <span className="text-base text-emerald-600 font-extrabold">
                            Rp {totalPrice.toLocaleString("id-ID")}
                        </span>
                    </div>

                    <Button
                        disabled={selectedIds.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs h-10 font-bold text-white transition-all shadow-sm"
                    >
                        Beli ({selectedIds.length})
                    </Button>
                </div>
            </div>

            {/* Bottom Bar — Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 px-4 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-medium text-slate-400 leading-none mb-1">
                        Total Harga ({totalQty} barang)
                    </span>
                    <span className="text-base font-extrabold text-emerald-600 truncate">
                        Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                </div>

                <Button
                    disabled={selectedIds.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs px-6 h-10 font-bold text-white transition-all shrink-0"
                >
                    Beli ({selectedIds.length})
                </Button>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[calc(100%-2rem)] sm:max-w-sm p-5 sm:p-6 gap-3 border border-slate-100 shadow-lg">
                    <AlertDialogHeader className="space-y-1.5">
                        <AlertDialogTitle className="text-sm sm:text-base font-bold text-slate-900 text-left">
                            {dialogTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed text-left">
                            {dialogDesc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="grid grid-cols-2 gap-2.5 mt-2 sm:space-x-0">
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDialogOpen(false);
                                setPendingDeleteIds([]);
                            }}
                            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors mt-0"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="w-full text-xs font-semibold h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}