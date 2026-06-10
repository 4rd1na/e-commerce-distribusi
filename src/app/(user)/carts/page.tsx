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
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Ambil level user untuk harga sesuai level
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

            if (!cart) {
                setItems([]);
                return;
            }

            const { data: cartItems, error } = await supabase
                .from("cart_items")
                .select(`
                    id,
                    qty,
                    variant_id,
                    product_variants (
                        variant_name,
                        base_price,
                        product_variant_prices (
                            price,
                            level
                        ),
                        products (
                            name,
                            image_url
                        )
                    )
                `)
                .eq("cart_id", cart.id);

            if (error) throw error;

            if (cartItems) {
                const formatted: CartItem[] = cartItems.map((item: any) => {
                    const variant = item.product_variants;
                    const basePrice = Number(variant?.base_price || 0);

                    // Cari harga sesuai level user
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
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(item => item.id));
        }
    };

    const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            setItemToDelete(itemId);
            setIsDialogOpen(true);
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

    const handleDeleteItem = async (itemId: string) => {
        try {
            setItems(prev => prev.filter(item => item.id !== itemId));
            setSelectedIds(prev => prev.filter(id => id !== itemId));

            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", itemId);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            fetchCart();
        }
    };

    const confirmDeleteAction = () => {
        if (itemToDelete) {
            handleDeleteItem(itemToDelete);
            setItemToDelete(null);
        }
        setIsDialogOpen(false);
    };

    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    const totalPrice = selectedItems.reduce((acc, item) => acc + (item.display_price * item.qty), 0);
    const totalQty = selectedItems.reduce((acc, item) => acc + item.qty, 0);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
                <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-6" />

                <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 mb-3 shadow-sm animate-pulse">
                    <div className="w-4 h-4 bg-slate-200 rounded" />
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2 space-y-2.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex gap-3 items-center shadow-sm animate-pulse">
                                <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
                                <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/3 pt-1" />
                                </div>
                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    <div className="w-4 h-4 bg-slate-200 rounded" />
                                    <div className="w-16 h-6 bg-slate-200 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-4 shadow-sm animate-pulse">
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                        <div className="flex justify-between border-b border-slate-50 pb-3">
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                            <div className="h-3 w-10 bg-slate-200 rounded" />
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
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                </div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Keranjang Anda Masih Kosong</h2>
                <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">Kamu belum memasukkan produk apapun ke dalam keranjang belanjamu.</p>
                <Link href="/">
                    <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl text-xs px-5 h-9 font-medium shadow-sm">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Mulai Belanja
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl pb-36 lg:pb-8">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                Keranjang Belanja
                <span className="text-[10px] md:text-xs bg-slate-100 text-slate-500 font-medium px-2.5 py-0.5 rounded-full">
                    {items.length} Barang
                </span>
            </h1>

            <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 mb-3 shadow-sm">
                <button
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIds.length === items.length && items.length > 0
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 hover:border-slate-400 bg-white"
                        }`}
                >
                    {selectedIds.length === items.length && items.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span className="text-xs font-semibold text-slate-700">
                    Pilih Semua ({selectedIds.length} Terpilih)
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-2.5">
                    {items.map((item) => {
                        const isChecked = selectedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`bg-white border rounded-xl p-3 flex gap-3 items-center transition-all duration-200 ${isChecked ? "border-emerald-100 bg-emerald-50/10" : "border-slate-100"
                                    }`}
                            >
                                <button
                                    onClick={() => toggleSelect(item.id)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-slate-300 hover:border-slate-400 bg-white"
                                        }`}
                                >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>

                                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs md:text-sm font-semibold text-slate-800 truncate leading-snug">{item.product_name}</h3>
                                    <div className="mt-1">
                                        <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                                            Varian: {item.variant_name}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-slate-900 mt-2">
                                        Rp {item.display_price.toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            setItemToDelete(item.id);
                                            setIsDialogOpen(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex items-center border border-slate-200/80 rounded-lg bg-white shadow-sm overflow-hidden">
                                        <button onClick={() => updateQuantity(item.id, item.qty, -1)} className="p-1 hover:bg-slate-50 text-slate-500 transition">
                                            <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="px-2.5 text-[11px] font-bold text-slate-800 min-w-[22px] text-center">{item.qty}</span>
                                        <button onClick={() => updateQuantity(item.id, item.qty, 1)} className="p-1 hover:bg-slate-50 text-slate-500 transition">
                                            <Plus className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="hidden lg:block bg-white border border-slate-100 p-4 rounded-2xl h-fit space-y-4 shadow-sm sticky top-24">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ringkasan Belanja</h2>

                    <div className="flex justify-between text-xs text-slate-500 border-b border-slate-50 pb-3">
                        <span>Barang Terpilih</span>
                        <span className="font-semibold text-slate-700">{totalQty} Pcs</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
                        <span>Total Harga</span>
                        <span className="text-base text-emerald-600 font-extrabold">Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>

                    <Button
                        disabled={selectedIds.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs h-10 font-bold text-white transition-all shadow-sm"
                    >
                        Checkout ({selectedIds.length})
                    </Button>
                </div>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 px-4 flex items-center justify-between z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400 leading-none mb-1">Total ({totalQty} barang)</span>
                    <span className="text-base font-extrabold text-emerald-600">Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>

                <Button
                    disabled={selectedIds.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs px-6 h-10 font-bold text-white transition-all"
                >
                    Checkout ({selectedIds.length})
                </Button>
            </div>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-sm p-6 gap-4 border border-slate-100 shadow-lg">
                    <AlertDialogHeader className="space-y-2">
                        <AlertDialogTitle className="text-sm md:text-base font-bold text-slate-900 text-left">
                            Yakin Hapus Produk dari Keranjang?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-400 leading-normal text-left">
                            Barang ini akan dikeluarkan dari daftar keranjang belanja milikmu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="grid grid-cols-2 gap-2.5 mt-3 sm:space-x-0">
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDialogOpen(false);
                                setItemToDelete(null);
                            }}
                            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors mt-0"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteAction}
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