"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
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
    product_name: string;
    product_image: string;
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    // State baru untuk mengatur buka-tutup dialog & mencatat item mana yang mau dihapus
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
            // 1. Dapatkan Cart ID
            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!cart) {
                setItems([]);
                return;
            }

            // 2. Ambil items berelasi silang dari DB
            const { data: cartItems, error } = await supabase
                .from("cart_items")
                .select(`
          id,
          qty,
          variant_id,
          product_variants (
            variant_name,
            base_price,
            products (
              name,
              image_url
            )
          )
        `)
                .eq("cart_id", cart.id);

            if (error) throw error;

            if (cartItems) {
                const formatted: CartItem[] = cartItems.map((item: any) => ({
                    id: item.id,
                    qty: item.qty,
                    variant_id: item.variant_id,
                    variant_name: item.product_variants?.variant_name || "",
                    base_price: Number(item.product_variants?.base_price || 0),
                    product_name: item.product_variants?.products?.name || "Produk Hilang",
                    product_image: item.product_variants?.products?.image_url || "",
                }));
                setItems(formatted);
            }
        } catch (err) {
            console.error("Error loading cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            // Mengganti window.confirm dengan trigger dialog Shadcn UI
            setItemToDelete(itemId);
            setIsDialogOpen(true);
            return;
        }

        try {
            // Optimistic state update biar kerasa instant di mata user
            setItems(prev => prev.map(item => item.id === itemId ? { ...item, qty: newQty } : item));

            const { error } = await supabase
                .from("cart_items")
                .update({ qty: newQty })
                .eq("id", itemId);

            if (error) throw error;
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
            console.error(err);
            fetchCart(); // rollback kalau gagal
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            setItems(prev => prev.filter(item => item.id !== itemId));

            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", itemId);

            if (error) throw error;
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
            console.error(err);
            fetchCart();
        }
    };

    // Fungsi trigger konfirmasi aksi dari modal dialog
    const confirmDeleteAction = () => {
        if (itemToDelete) {
            handleDeleteItem(itemToDelete);
            setItemToDelete(null);
        }
        setIsDialogOpen(false);
    };

    const totalPrice = items.reduce((acc, item) => acc + (item.base_price * item.qty), 0);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center text-sm text-slate-500">
                Menghitung isi keranjang belanjamu...
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-md">
                <div className="w-16 h-16 bg-slate-50 border rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Keranjang Belanja Kosong</h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">Kamu belum memasukkan produk apapun ke dalam keranjang belanjamu.</p>
                <Link href="/">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Mulai Belanja
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <h1 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Keranjang Belanja
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-normal text-slate-500">
                    {items.length} Jenis Barang
                </span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LIST BARANG */}
                <div className="lg:col-span-2 space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-xl flex gap-3 items-center">
                            <div className="w-16 h-16 rounded-lg bg-slate-50 border overflow-hidden flex-shrink-0">
                                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</h3>
                                <p className="text-[11px] text-emerald-600 font-medium bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                                    Varian: {item.variant_name}
                                </p>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                    Rp {item.base_price.toLocaleString("id-ID")}
                                </p>
                            </div>

                            {/* ACTION QUANTITY */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                    <button onClick={() => updateQuantity(item.id, item.qty, -1)} className="p-1.5 hover:bg-slate-100 rounded-l-lg text-slate-600">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2 text-xs font-bold text-slate-800 min-w-[24px] text-center">{item.qty}</span>
                                    <button onClick={() => updateQuantity(item.id, item.qty, 1)} className="p-1.5 hover:bg-slate-100 rounded-r-lg text-slate-600">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setItemToDelete(item.id);
                                        setIsDialogOpen(true);
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RINGKASAN PEMBAYARAN */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl h-fit space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">Ringkasan Belanja</h2>

                    <div className="flex justify-between text-xs text-slate-600 border-b pb-3">
                        <span>Total Harga Barang</span>
                        <span className="font-semibold text-slate-800">Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                        <span>Total Belanja</span>
                        <span className="text-emerald-600">Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>

                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs h-10 font-bold text-white">
                        Lanjut ke Pembayaran
                    </Button>
                </div>
            </div>

            {/* INTEGRASI SHADCN UI DIALOG */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Hapus dari Keranjang?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            Produk ini akan dihapus dari daftar keranjang belanjamu. Kamu harus memasukkannya kembali jika ingin membelinya nanti.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 justify-end mt-2">
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDialogOpen(false);
                                setItemToDelete(null);
                            }}
                            className="text-xs font-semibold h-9 rounded-xl border-slate-200 text-slate-600 mt-0 flex-1 sm:flex-none"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteAction}
                            className="text-xs font-semibold h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex-1 sm:flex-none"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}