"use client";

import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Load MapPicker secara dinamis agar tidak error SSR (window is not defined)
const MapPicker = dynamic(() => import("@/components/profile/MapPicker"), {
    ssr: false,
    loading: () => <div className="h-[250px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-sm text-slate-400">Memuat Peta...</div>
});

export default function AddressModal({
    open,
    setOpen,
    form,
    setForm,
    onSave,
    editingAddressId,
    loading,
}: any) {

    const handleLocationChange = (lat: number, lng: number) => {
        setForm({
            ...form,
            latitude: lat,
            longitude: lng,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {editingAddressId ? "Edit Alamat" : "Tambah Alamat"}
                    </DialogTitle>
                    <DialogDescription>
                        Lengkapi informasi alamat pengiriman beserta titik peta Anda
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Pilih Titik di Peta */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Pilih Lokasi di Peta (Klik / Geser Pin)
                        </label>
                        <MapPicker
                            lat={form.latitude}
                            lng={form.longitude}
                            onChangeLocation={handleLocationChange}
                        />
                        <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border">
                            <div><span className="font-semibold">Lat:</span> {form.latitude?.toFixed(6) || "-"}</div>
                            <div><span className="font-semibold">Lng:</span> {form.longitude?.toFixed(6) || "-"}</div>
                        </div>
                    </div>

                    {/* Nama Penerima */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Nama Penerima</label>
                        <Input
                            placeholder="Contoh: Ardina Rahma"
                            value={form.recipient_name}
                            onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Nomor HP</label>
                        <Input
                            placeholder="08xxxxxxxxxx"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    {/* Grid Provinsi & Kota */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Provinsi</label>
                            <Input
                                placeholder="Jawa Timur"
                                value={form.province}
                                onChange={(e) => setForm({ ...form, province: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Kota / Kabupaten</label>
                            <Input
                                placeholder="Jombang"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Grid Kecamatan & Desa */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Kecamatan</label>
                            <Input
                                placeholder="Kabuh"
                                value={form.district}
                                onChange={(e) => setForm({ ...form, district: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Desa / Kelurahan</label>
                            <Input
                                placeholder="Sumberingin"
                                value={form.village}
                                onChange={(e) => setForm({ ...form, village: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Detail Alamat */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Detail Alamat</label>
                        <Input
                            placeholder="Jl. Mawar No. 10"
                            value={form.address_detail}
                            onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                        />
                    </div>

                    {/* Button Simpan */}
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl mt-2"
                    >
                        {loading ? "Menyimpan..." : editingAddressId ? "Simpan Perubahan" : "Tambah Alamat"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}