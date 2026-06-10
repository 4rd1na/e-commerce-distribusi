"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const AddressMap = dynamic(() =>
    import("@/components/maps/AddressMap"),
    {
        ssr: false,
    }
);

interface Address {
    id: string;
    recipient_name: string;
    phone_number: string;
    province: string;
    city: string;
    district: string;
    village: string;
    postal_code: string;
    address_detail: string;
    latitude: number;
    longitude: number;
    is_default: boolean;
}

const defaultPosition: [number, number] = [-7.5514, 112.2332,];

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [position, setPosition] = useState<[number, number]>(defaultPosition);
    const [form, setForm] = useState({
        recipient_name: "",
        phone_number: "",
        province: "",
        city: "",
        district: "",
        village: "",
        postal_code: "",
        address_detail: "",
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);

            const { data: { user }, } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: false,
                });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            recipient_name: "",
            phone_number: "",
            province: "",
            city: "",
            district: "",
            village: "",
            postal_code: "",
            address_detail: "",
        });
        setPosition(defaultPosition);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const { data: { user }, } = await supabase.auth.getUser();

            if (!user) return;

            const isFirstAddress =
                !editingId &&
                addresses.length === 0;

            const currentAddress =
                addresses.find(
                    (item) => item.id === editingId
                );

            const payload = {
                user_id: user.id,
                ...form,
                latitude: position[0],
                longitude: position[1],

                is_default: editingId
                    ? currentAddress?.is_default || false
                    : isFirstAddress,
            };

            if (editingId) {
                const { error } = await supabase
                    .from("addresses")
                    .update(payload)
                    .eq("id", editingId)
                    .eq("user_id", user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("addresses")
                    .insert(payload);

                if (error) throw error;
            }

            resetForm();
            setShowForm(false);
            fetchAddresses();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (address: Address) => {
        setEditingId(address.id);
        setShowForm(true);
        setForm({
            recipient_name: address.recipient_name,
            phone_number: address.phone_number,
            province: address.province || "",
            city: address.city || "",
            district: address.district || "",
            village: address.village || "",
            postal_code: address.postal_code || "",
            address_detail: address.address_detail,
        });

        setPosition([
            address.latitude || defaultPosition[0],
            address.longitude || defaultPosition[1],
        ]);
    };

    const handleDelete = async (id: string) => {
        try {
            const confirmDelete = confirm(
                "Apakah yakin ingin menghapus alamat?"
            );

            if (!confirmDelete) return;

            const { data: { user }, } = await supabase.auth.getUser();

            if (!user) return;

            const deletedAddress = addresses
                .find((item) => item.id === id);

            const { error } = await supabase
                .from("addresses")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            if (deletedAddress?.is_default) {
                const remaining =
                    addresses.filter(
                        (item) => item.id !== id
                    );

                if (remaining.length > 0) {
                    await supabase
                        .from("addresses")
                        .update({
                            is_default: true,
                        })
                        .eq(
                            "id",
                            remaining[0].id
                        )
                        .eq(
                            "user_id",
                            user.id
                        );
                }
            }
            fetchAddresses();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const { data: { user }, } = await supabase.auth.getUser();

            if (!user) return;

            const { error: resetError } =
                await supabase
                    .from("addresses")
                    .update({
                        is_default: false,
                    })
                    .eq("user_id", user.id);

            if (resetError) throw resetError;

            const { error: setError } = await supabase
                .from("addresses")
                .update({
                    is_default: true,
                })
                .eq("id", id)
                .eq("user_id", user.id);

            if (setError) throw setError;
            fetchAddresses();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 py-5">

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Alamat Saya
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola alamat pengiriman
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Alamat
                    </Button>
                </div>

                {showForm && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <input
                                placeholder="Nama Penerima"
                                value={
                                    form.recipient_name
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        recipient_name:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Nomor HP"
                                value={
                                    form.phone_number
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone_number:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Provinsi"
                                value={form.province}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        province:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Kota"
                                value={form.city}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        city:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Kecamatan"
                                value={form.district}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        district:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Kelurahan"
                                value={form.village}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        village:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                            <input
                                placeholder="Kode Pos"
                                value={
                                    form.postal_code
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        postal_code:
                                            e.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border px-4 text-sm"
                            />

                        </div>

                        <textarea
                            placeholder="Detail alamat lengkap"
                            value={
                                form.address_detail
                            }
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    address_detail:
                                        e.target.value,
                                })
                            }
                            className="w-full mt-4 rounded-2xl border px-4 py-3 text-sm min-h-[100px]"
                        />

                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                                <p className="text-sm font-medium">
                                    Lokasi Pengiriman
                                </p>
                            </div>

                            <AddressMap
                                position={position}
                                setPosition={
                                    setPosition
                                }
                            />
                        </div>

                        <div className="flex gap-3 mt-5">
                            <Button
                                onClick={
                                    handleSubmit
                                }
                                disabled={saving}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                            >
                                {saving
                                    ? "Menyimpan..."
                                    : editingId
                                        ? "Update"
                                        : "Simpan"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="text-sm text-slate-500">
                            Memuat alamat...
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="text-sm text-slate-500">
                            Belum ada alamat
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <div
                                key={address.id}
                                className="bg-white border border-slate-200 rounded-2xl p-4"
                            >

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <div className="flex items-center gap-2 flex-wrap">

                                            <h2 className="font-semibold text-slate-900">
                                                {
                                                    address.recipient_name
                                                }
                                            </h2>

                                            {address.is_default && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                                    Default
                                                </span>
                                            )}

                                        </div>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {
                                                address.phone_number
                                            }
                                        </p>

                                        <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                                            {
                                                address.address_detail
                                            },{" "}
                                            {
                                                address.village
                                            },{" "}
                                            {
                                                address.district
                                            },{" "}
                                            {
                                                address.city
                                            },{" "}
                                            {
                                                address.province
                                            }{" "}
                                            {
                                                address.postal_code
                                            }
                                        </p>

                                    </div>

                                    <div className="flex flex-col gap-2">

                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                                handleEdit(
                                                    address
                                                )
                                            }
                                            className="rounded-xl"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                                handleDelete(
                                                    address.id
                                                )
                                            }
                                            className="rounded-xl text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>

                                    </div>

                                </div>

                                {!address.is_default && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handleSetDefault(
                                                address.id
                                            )
                                        }
                                        className="mt-4 rounded-xl"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Jadikan Default
                                    </Button>
                                )}

                            </div>
                        ))
                    )}

                </div>

            </div>

        </div>
    );
}