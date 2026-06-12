"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MapComponent = dynamic(
  () => import("@/components/maps/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-48 w-full border border-zinc-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <p className="text-xs text-zinc-500">Memuat peta...</p>
        </div>
      </div>
    ),
  },
);

interface Address {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone_number: string;
  province: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  village: string | null;
  address_detail: string;
  is_default: boolean | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function AddressPage() {
  // State Utama
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Toggle Tampilan Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State Penanganan Map
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isMapLoading, setIsMapLoading] = useState(false);

  const getUserLocation = () => {
    setIsMapLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsMapLoading(false);
        },
        (error) => {
          alert("Error mendapatkan lokasi: " + error.message);
          setIsMapLoading(false);
        },
      );
    } else {
      alert("Geolocation tidak didukung oleh browser ini.");
      setIsMapLoading(false);
    }
  };

  // State Form Input
  const [formData, setFormData] = useState({
    label: "Rumah",
    recipient_name: "",
    phone_number: "",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    village: "",
    address_detail: "",
    notes: "",
    is_default: false,
  });

  // Ambil data user & list alamat
  useEffect(() => {
    const initData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false });

          if (error) throw error;
          setAddresses(data || []);
        }
      } catch (err: any) {
        setMessage({
          type: "error",
          text: err.message || "Gagal memuat data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Handler Input Form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      label: "Rumah",
      recipient_name: "",
      phone_number: "",
      province: "",
      city: "",
      district: "",
      postal_code: "",
      village: "",
      address_detail: "",
      notes: "",
      is_default: false,
    });
    setEditingId(null);
    setUserLocation(null); // Reset lokasi map saat form ditutup/batal
    setIsFormOpen(false);
  };

  // Set Form untuk Edit
  const handleEditClick = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label || "Rumah",
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number,
      province: addr.province || "",
      city: addr.city || "",
      district: addr.district || "",
      postal_code: addr.postal_code || "",
      village: addr.village || "",
      address_detail: addr.address_detail,
      notes: addr.notes || "",
      is_default: !!addr.is_default,
    });

    if (addr.latitude && addr.longitude) {
      setUserLocation([addr.latitude, addr.longitude]);
    } else {
      setUserLocation(null);
    }

    setIsFormOpen(true);
  };

  // Submit Simpan / Ubah Alamat
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitLoading(true);
    setMessage(null);

    try {
      if (formData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      // Perbarui payload di bawah ini:
      const payload = {
        ...formData,
        user_id: userId,
        updated_at: new Date().toISOString(),
        latitude: userLocation ? userLocation[0] : null, // Menyimpan Latitude
        longitude: userLocation ? userLocation[1] : null, // Menyimpan Longitude
      };

      if (editingId) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        setMessage({ type: "success", text: "Alamat berhasil diperbarui!" });
      } else {
        const { error } = await supabase.from("addresses").insert([
          {
            ...payload,
            is_default: addresses.length === 0 ? true : formData.is_default,
          },
        ]);
        if (error) throw error;
        setMessage({ type: "success", text: "Alamat baru berhasil disimpan!" });
      }

      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });
      setAddresses(data || []);
      resetForm();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Gagal menyimpan alamat.",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Hapus Alamat
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      setMessage({ type: "success", text: "Alamat berhasil dihapus." });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Gagal menghapus alamat.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-zinc-500">Memuat alamat...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Alamat Saya
          </h1>
          <p className="text-xs text-zinc-500">
            Kelola alamat tujuan pengiriman kamu
          </p>
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1" /> Tambah Alamat
          </Button>
        )}
      </div>

      {/* Notifikasi Status */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Tambah/Ubah Alamat */}
      {isFormOpen && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h3 className="font-semibold text-sm">
                {editingId ? "Ubah Alamat" : "Tambah Alamat Baru"}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={resetForm}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="recipient_name" className="text-xs">
                    Nama Penerima
                  </Label>
                  <Input
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone_number" className="text-xs">
                    No. Telepon
                  </Label>
                  <Input
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="province" className="text-xs">
                    Provinsi
                  </Label>
                  <Input
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs">
                    Kota/Kab
                  </Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="district" className="text-xs">
                    Kecamatan
                  </Label>
                  <Input
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="village" className="text-xs">
                    Kelurahan
                  </Label>
                  <Input
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="label" className="text-xs">
                    Label (misal: Rumah, Kantor)
                  </Label>
                  <Input
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postal_code" className="text-xs">
                    Kode Pos
                  </Label>
                  <Input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs">
                  Alamat Lengkap
                </Label>
                <textarea
                  name="address"
                  value={formData.address_detail}
                  onChange={handleInputChange}
                  required
                  className="w-full min-h-[60px] p-2 text-xs rounded-md border border-zinc-200 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">
                  Catatan Kurir (Opsional)
                </Label>
                <Input
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="h-9 text-xs"
                  placeholder="Pagar hitam, titip satpam, dll"
                />
              </div>

              {/* SECTION MAPS INTEGRATION */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Titik Maps Alamat
                    </Label>
                    <p className="text-[11px] text-zinc-500">
                      Sematkan lokasi akuratmu agar memudahkan kurir
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getUserLocation}
                    disabled={isMapLoading}
                    className="h-8 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50 shrink-0"
                  >
                    {isMapLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Mencari...
                      </>
                    ) : (
                      "Dapatkan Lokasi Saya"
                    )}
                  </Button>
                </div>

                {userLocation && (
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-100">
                    Lokasi Terdeteksi:{" "}
                    <span className="font-mono text-emerald-600">
                      Lat {userLocation[0].toFixed(5)}, Long{" "}
                      {userLocation[1].toFixed(5)}
                    </span>
                  </p>
                )}

                <div className="rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 h-52">
                  <MapComponent userLocation={userLocation} />
                </div>
              </div>
              {/* END OF MAPS INTEGRATION */}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_default: e.target.checked,
                    }))
                  }
                  disabled={
                    editingId !== null &&
                    addresses.find((a) => a.id === editingId)?.is_default ===
                      true
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="is_default"
                  className="text-xs font-medium text-zinc-600 cursor-pointer select-none"
                >
                  Jadikan alamat utama (default)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                >
                  {isSubmitLoading ? "Menyimpan..." : "Simpan Alamat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Daftar Alamat */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-white dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">
              Belum ada alamat yang disimpan.
            </p>
          </div>
        ) : (
          addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`border-zinc-200 dark:border-zinc-800 transition-all ${
                addr.is_default
                  ? "ring-1 ring-emerald-500 bg-emerald-50/10"
                  : ""
              }`}
            >
              <CardContent className="p-4 flex justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                      {addr.recipient_name}
                    </span>
                    <span className="text-zinc-400">|</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {addr.phone_number}
                    </span>
                    {addr.label && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5"
                      >
                        {addr.label}
                      </Badge>
                    )}
                    {addr.is_default && (
                      <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">
                        Utama
                      </Badge>
                    )}
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1">
                    {addr.address_detail}
                  </p>

                  <p className="text-zinc-500 text-[11px]">
                    {[addr.district, addr.city, addr.province, addr.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {addr.notes && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded w-fit mt-1">
                      Catatan: {addr.notes}
                    </p>
                  )}
                </div>

                {/* Aksi */}
                <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEditClick(addr)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-zinc-600" />
                    </Button>
                    {!addr.is_default && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDelete(addr.id)}
                        className="h-8 w-8 hover:bg-rose-50 hover:border-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
