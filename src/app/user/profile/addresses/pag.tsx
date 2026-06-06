"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import AddressCard from "@/components/profile/AddressCard";
import AddressModal from "@/components/profile/AddressModal";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";

export default function AddressesPage() {
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [openAddress, setOpenAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    // Default koordinat (bisa disesuaikan ke wilayah default kamu, misal Jombang)
    const defaultCoords = {
        latitude: -7.5463,
        longitude: 112.2341,
    };

    const [addressForm, setAddressForm] = useState({
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        village: "",
        address_detail: "",
        latitude: defaultCoords.latitude,
        longitude: defaultCoords.longitude,
    });

    const loadAddresses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error("Gagal memuat alamat:", error);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const handleOpenTambah = () => {
        setEditingAddressId(null);
        setAddressForm({
            recipient_name: "",
            phone: "",
            province: "",
            city: "",
            district: "",
            village: "",
            address_detail: "",
            latitude: defaultCoords.latitude,
            longitude: defaultCoords.longitude,
        });
        setOpenAddress(true);
    };

    const handleEditAddress = (address: any) => {
        setEditingAddressId(address.id);
        setAddressForm({
            recipient_name: address.recipient_name || "",
            phone: address.phone || "",
            province: address.province || "",
            city: address.city || "",
            district: address.district || "",
            village: address.village || "",
            address_detail: address.address_detail || "",
            latitude: address.latitude || defaultCoords.latitude,
            longitude: address.longitude || defaultCoords.longitude,
        });
        setOpenAddress(true);
    };

    const saveAddress = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (editingAddressId) {
                // Update alamat
                const { error } = await supabase
                    .from("addresses")
                    .update({ ...addressForm })
                    .eq("id", editingAddressId);

                if (error) throw error;
                alert("Alamat berhasil diperbarui");
            } else {
                // Tambah alamat baru
                const isFirstAddress = addresses.length === 0;
                const { error } = await supabase
                    .from("addresses")
                    .insert({
                        ...addressForm,
                        user_id: user.id,
                        is_default: isFirstAddress,
                    });

                if (error) throw error;
                alert("Alamat berhasil ditambahkan");
            }

            setOpenAddress(false);
            loadAddresses();
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan alamat");
        } finally {
            setLoading(false);
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            if (!confirm("Hapus alamat ini?")) return;
            const { error } = await supabase.from("addresses").delete().eq("id", id);
            if (error) throw error;

            alert("Alamat berhasil dihapus");
            loadAddresses();
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus alamat");
        }
    };

    const setDefaultAddress = async (id: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Matikan semua default lama milik user tersebut
            await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);

            // Aktifkan default baru
            const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
            if (error) throw error;

            alert("Alamat utama diperbarui");
            loadAddresses();
        } catch (error) {
            console.error(error);
            alert("Gagal mengatur alamat utama");
        }
    };

    return (
        <div className="container mx-auto max-w-5xl p-4 space-y-5">
            {/* Tombol kembali ke halaman Profil Utama */}
            <div className="flex items-center gap-3">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" /> Daftar Alamat Saya
                    </h1>
                    <p className="text-xs text-slate-500">Kelola dan tandai titik koordinat pengiriman Anda</p>
                </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="font-bold text-lg">Alamat Tersimpan</h2>
                    </div>
                    <Button onClick={handleOpenTambah}>
                        Tambah Alamat Baru
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <div className="border border-dashed rounded-xl p-10 text-center text-sm text-slate-500">
                        Belum ada alamat tersimpan. Silakan tambahkan alamat baru beserta titik koordinat peta.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <AddressCard
                                key={addr.id}
                                address={addr}
                                onEdit={() => handleEditAddress(addr)}
                                onDelete={() => deleteAddress(addr.id)}
                                onSetDefault={() => setDefaultAddress(addr.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddressModal
                open={openAddress}
                setOpen={setOpenAddress}
                form={addressForm}
                setForm={setAddressForm}
                onSave={saveAddress}
                editingAddressId={editingAddressId}
                loading={loading}
            />
        </div>
    );
}