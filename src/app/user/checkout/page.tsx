"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [user, setUser] = useState<any>(null);
    const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
    const [address, setAddress] = useState<any>(null);

    useEffect(() => {
        initCheckout();
    }, []);

    const initCheckout = async () => {
        try {
            setLoading(true);

            // 1. Cek User Session
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/login");
                return;
            }
            setUser(authUser);

            // 2. Ambil data item yang dipilih dari localStorage (diset dari CartPage)
            const storedData = localStorage.getItem("selected_checkout_items");
            if (!storedData) {
                alert("Tidak ada item untuk di-checkout");
                router.push("/cart");
                return;
            }
            
            const parsedItems = JSON.parse(storedData);
            if (parsedItems.length === 0) {
                router.push("/cart");
                return;
            }
            setCheckoutItems(parsedItems);

            // 3. Ambil Alamat Default User
            const { data: addrData } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", authUser.id)
                .eq("is_default", true)
                .maybeSingle();

            // Jika tidak ada alamat default, ambil alamat pertama saja
            if (!addrData) {
                const { data: anyAddr } = await supabase
                    .from("addresses")
                    .select("*")
                    .eq("user_id", authUser.id)
                    .limit(1)
                    .maybeSingle();
                setAddress(anyAddr);
            } else {
                setAddress(addrData);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // HITUNG TOTAL BELANJA
    // ==========================================
    const totalProductPrice = checkoutItems.reduce(
        (sum, item) => sum + (Number(item.products?.base_price || 0) * item.qty),
        0
    );
    
    const shippingFee = address ? 15000 : 0; // Simulasi ongkir flat jika ada alamat
    const grandTotal = totalProductPrice + shippingFee;

    // ==========================================
    // PROSES PROSES CHECKOUT (PLACE ORDER)
    // ==========================================
    const handlePlaceOrder = async () => {
        if (!address) {
            alert("Silakan isi atau pilih alamat pengiriman terlebih dahulu!");
            return;
        }

        try {
            setIsSubmitting(true);

            // ------------------------------------------
            // 1. INSERT KE TABEL ORDERS
            // ------------------------------------------
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: user.id,
                    total_amount: grandTotal,
                    status: "pending" // Sesuai default order_status di skema kamu
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // ------------------------------------------
            // 2. PREPARE & INSERT KE ORDER_ITEMS + KURANGI STOK
            // ------------------------------------------
            const orderItemsPayload = checkoutItems.map((item) => ({
                order_id: orderData.id,
                product_id: item.product_id,
                variant_id: item.variant_id || null, // Jika ada varian di skema kamu
                qty: item.qty,
                price_per_unit: Number(item.products?.base_price || 0)
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsPayload);

            if (itemsError) throw itemsError;

            // Loop untuk mengurangi stok di inventory_stocks (Simulasi manual transaction)
            for (const item of checkoutItems) {
                // Ambil stok terlama/terkini dari gudang terdekat (contoh ambil record pertama)
                const { data: stockData } = await supabase
                    .from("inventory_stocks")
                    .select("id, qty")
                    .eq("product_id", item.product_id)
                    .limit(1)
                    .maybeSingle();

                if (stockData) {
                    const newStockQty = stockData.qty - item.qty;
                    await supabase
                        .from("inventory_stocks")
                        .update({ qty: newStockQty >= 0 ? newStockQty : 0 })
                        .eq("id", stockData.id);
                }
            }

            // ------------------------------------------
            // 3. HAPUS ITEMS YANG BERHASIL DI-CO DARI KERANJANG
            // ------------------------------------------
            const selectedCartItemIds = checkoutItems.map((item) => item.id);
            
            const { error: deleteCartError } = await supabase
                .from("cart_items")
                .delete()
                .in("id", selectedCartItemIds);

            if (deleteCartError) throw deleteCartError;

            // ------------------------------------------
            // 4. BERSIHKAN LOCALSTORAGE & REDIRECT SAKSES
            // ------------------------------------------
            localStorage.removeItem("selected_checkout_items");
            window.dispatchEvent(new Event("cart-updated")); // Update badge header jika ada
            
            alert("Pesanan berhasil dibuat!");
            router.push(`/user/orders?success=true&order_id=${orderData.id}`);

        } catch (err: any) {
            console.error(err);
            alert("Gagal memproses checkout: " + (err.message || err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-sm text-slate-400">Menyiapkan checkout...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            
            {/* BACK BUTTON */}
            <button 
                onClick={() => router.back()} 
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-4 font-medium"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Keranjang
            </button>

            <h1 className="text-xl font-black text-slate-800 mb-5">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* KIRI: DETAIL ITEMS & ALAMAT */}
                <div className="md:col-span-2 space-y-3">
                    
                    {/* SECTION ALAMAT */}
                    <Card className="p-4 border-slate-100 shadow-none rounded-xl">
                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            Alamat Pengiriman
                        </div>
                        {address ? (
                            <div className="text-xs text-slate-600 space-y-1">
                                <p className="font-bold text-slate-800">{address.recipient_name} ({address.phone})</p>
                                <p>{address.address_detail}</p>
                                <p>{`${address.district}, ${address.city}, ${address.province}`}</p>
                            </div>
                        ) : (
                            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                Kamu belum mengisi alamat pengiriman. Silakan tambahkan alamat terlebih dahulu di profil.
                            </div>
                        )}
                    </Card>

                    {/* SECTION ITEMS */}
                    <Card className="p-4 border-slate-100 shadow-none rounded-xl space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-700 font-bold text-sm">
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            Ringkasan Produk
                        </div>
                        
                        {checkoutItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 text-xs py-1">
                                <img 
                                    src={item.products?.image_url || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100"} 
                                    alt={item.products?.name} 
                                    className="w-12 h-12 object-cover rounded-lg bg-slate-50 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-700 truncate">{item.products?.name}</h3>
                                    <p className="text-slate-400">{item.qty} x Rp {Number(item.products?.base_price).toLocaleString("id-ID")}</p>
                                </div>
                                <div className="font-bold text-slate-800">
                                    Rp {(Number(item.products?.base_price || 0) * item.qty).toLocaleString("id-ID")}
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* KANAN: RINGKASAN PEMBAYARAN */}
                <div className="md:col-span-1">
                    <Card className="p-4 border-slate-100 shadow-none rounded-xl sticky top-4 space-y-4">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm pb-2 border-b border-slate-100">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            Total Pembayaran
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Total Harga ({checkoutItems.length} produk)</span>
                                <span>Rp {totalProductPrice.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Ongkos Kirim</span>
                                <span>Rp {shippingFee.toLocaleString("id-ID")}</span>
                            </div>
                            <hr className="border-dashed my-1" />
                            <div className="flex justify-between items-center text-sm font-black text-slate-800">
                                <span>Total Bayar</span>
                                <span className="text-emerald-600 text-base">Rp {grandTotal.toLocaleString("id-ID")}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || checkoutItems.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-xl disabled:bg-slate-200"
                        >
                            {isSubmitting ? "Memproses..." : "Buat Pesanan"}
                        </Button>
                    </Card>
                </div>

            </div>
        </div>
    );
}