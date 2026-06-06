"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    // State untuk menyimpan ID item yang dicentang/dipilih
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);

            // =========================
            // GET USER
            // =========================
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // =========================
            // GET CART
            // =========================
            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!cart) {
                setItems([]);
                setLoading(false);
                return;
            }

            // =========================
            // GET CART ITEMS
            // =========================
            const { data, error } = await supabase
                .from("cart_items")
                .select(`
                    id,
                    qty,
                    product_id,
                    products:product_id (
                      id,
                      name,
                      image_url,
                      base_price,
                      description
                    )
                `)
                .eq("cart_id", cart.id);

            if (error) {
                console.error(error);
                return;
            }

            const cartItems = data || [];
            setItems(cartItems);

            // Otomatis centang semua item saat pertama kali load (opsional)
            if (selectedIds.length === 0 && cartItems.length > 0) {
                setSelectedIds(cartItems.map((item: any) => item.id));
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // HANDLE CHECKBOX TOGGLE
    // =========================
    const handleToggleSelect = (itemId: string) => {
        if (selectedIds.includes(itemId)) {
            setSelectedIds(selectedIds.filter((id) => id !== itemId));
        } else {
            setSelectedIds([...selectedIds, itemId]);
        }
    };

    const handleToggleAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]); // Uncheck semua
        } else {
            setSelectedIds(items.map((item) => item.id)); // Check semua
        }
    };

    // =========================
    // UPDATE QTY
    // =========================
    const updateQty = async (
        itemId: string,
        currentQty: number,
        type: "plus" | "minus"
    ) => {
        let newQty = type === "plus" ? currentQty + 1 : currentQty - 1;

        if (newQty < 1) return;

        const { error } = await supabase
            .from("cart_items")
            .update({ qty: newQty })
            .eq("id", itemId);

        if (!error) {
            loadCart();
            window.dispatchEvent(new Event("cart-updated"));
        }
    };

    // =========================
    // DELETE ITEM
    // =========================
    const deleteItem = async (itemId: string) => {
        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId);

        if (!error) {
            // Hapus juga dari daftar selectedIds jika item dihapus
            setSelectedIds(selectedIds.filter((id) => id !== itemId));
            loadCart();
            window.dispatchEvent(new Event("cart-updated"));
        }
    };

    // =========================
    // TOTAL PRICE (Hanya yang dipilih)
    // =========================
    const totalPrice = items
        .filter((item) => selectedIds.includes(item.id)) // Filter item yang masuk list selected
        .reduce(
            (sum, item) =>
                sum + (Number(item.products?.base_price || 0) * item.qty),
            0
        );

    // =========================
    // HANDLE CHECKOUT ACTION
    // =========================
    const handleCheckout = () => {
        // Filter item keranjang mana saja yang sedang dicentang user
        const itemsToCheckout = items.filter((item) => selectedIds.includes(item.id));

        // Simpan ke localStorage agar bisa dibaca di halaman /user/checkout
        localStorage.setItem("selected_checkout_items", JSON.stringify(itemsToCheckout));

        // Pindah ke halaman checkout
        router.push("/user/checkout");
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="p-10 text-center text-sm text-slate-400">
                Memuat keranjang...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <h1 className="text-xl font-black text-slate-800">
                        Keranjang Saya
                    </h1>
                </div>

                {/* Pilih Semua / Uncheck Semua Toggle */}
                {items.length > 0 && (
                    <button
                        onClick={handleToggleAll}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                        {selectedIds.length === items.length ? "Batalkan Semua" : "Pilih Semua"}
                    </button>
                )}
            </div>

            {/* EMPTY */}
            {items.length === 0 && (
                <Card className="p-10 text-center text-slate-400">
                    Keranjang masih kosong
                </Card>
            )}

            {/* ITEMS */}
            <div className="space-y-2">
                {items.map((item) => {
                    const product = item.products;
                    const subtotal = Number(product?.base_price || 0) * item.qty;
                    const isSelected = selectedIds.includes(item.id);

                    return (
                        <Card
                            key={item.id}
                            className={`p-2 border shadow-none rounded-xl transition-colors ${isSelected ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100"
                                }`}
                        >
                            <div className="flex items-center gap-3">

                                {/* CHECKBOX */}
                                <div className="pl-1 flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelect(item.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                    />
                                </div>

                                {/* IMAGE */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                    <img
                                        src={
                                            product?.image_url ||
                                            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300"
                                        }
                                        alt={product?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* INFO */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-[13px] font-semibold text-slate-700 truncate">
                                        {product?.name}
                                    </h2>

                                    <div className="text-[11px] text-slate-400 truncate">
                                        {product?.description || "Produk distribusi"}
                                    </div>

                                    <div className="mt-1 text-sm font-black text-emerald-600">
                                        Rp {Number(product?.base_price || 0).toLocaleString("id-ID")}
                                    </div>
                                </div>

                                {/* ACTION */}
                                <div className="flex flex-col items-end gap-2">
                                    {/* DELETE */}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-slate-400 hover:text-rose-500"
                                        onClick={() => deleteItem(item.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>

                                    {/* QTY */}
                                    <div className="flex items-center border bg-white rounded-lg overflow-hidden h-7">
                                        <button
                                            onClick={() => updateQty(item.id, item.qty, "minus")}
                                            className="w-7 h-7 text-xs hover:bg-slate-100"
                                        >
                                            <Minus className="w-3 h-3 mx-auto" />
                                        </button>

                                        <div className="w-8 text-center text-xs font-bold">
                                            {item.qty}
                                        </div>

                                        <button
                                            onClick={() => updateQty(item.id, item.qty, "plus")}
                                            className="w-7 h-7 text-xs hover:bg-slate-100"
                                        >
                                            <Plus className="w-3 h-3 mx-auto" />
                                        </button>
                                    </div>

                                    {/* SUBTOTAL */}
                                    <div className="text-[11px] font-black text-slate-700">
                                        Rp {subtotal.toLocaleString("id-ID")}
                                    </div>
                                </div>

                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* FOOTER TOTAL */}
            {items.length > 0 && (
                <Card className="mt-5 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">
                                Total Belanja ({selectedIds.length} Produk)
                            </p>

                            <div className="text-2xl font-black text-emerald-600">
                                Rp {totalPrice.toLocaleString("id-ID")}
                            </div>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={selectedIds.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                            Checkout ({selectedIds.length})
                        </Button>
                    </div>
                </Card>
            )}

        </div>
    );
}