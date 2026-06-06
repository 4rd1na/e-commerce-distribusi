"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import AddressCard from "@/components/profile/AddressCard";
import AddressModal from "@/components/profile/AddressModal";

import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false); // State untuk upload avatar

    const [profile, setProfile] = useState<any>({
        full_name: "",
        phone_number: "",
        email: "",
        avatar_url: "", // Tambahkan avatar_url ke state profile
    });

    const [addresses, setAddresses] = useState<any[]>([]);
    const [openAddress, setOpenAddress] = useState(false);

    const [addressForm, setAddressForm] = useState({
        recipient_name: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        village: "",
        address_detail: "",
    });

    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            // PROFILE
            const { data: profileData, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

            if (profileError) {
                console.error(profileError);
            }

            if (profileData) {
                setProfile({
                    ...profileData,
                    email: user.email,
                });
            }

            // ADDRESS
            const { data: addressData, error: addressError } =
                await supabase
                    .from("addresses")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("is_default", { ascending: false });

            if (addressError) {
                console.error(addressError);
            }

            setAddresses(addressData || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // FUNGSI UPLOAD AVATAR
    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("Pilih file terlebih dahulu");
            }

            const file = event.target.files[0];

            if (file.size > 2 * 1024 * 1024) {
                alert("Ukuran file maksimal 2MB");
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("File harus berupa gambar");
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split(".").pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload ke Supabase Storage (Bucket: 'avatars')
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Dapatkan Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            // Update kolom avatar_url di tabel profiles database
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", user.id);

            if (updateError) throw updateError;

            alert("Foto profil berhasil diperbarui!");
            loadData(); // Reload data untuk refresh UI
        } catch (error: any) {
            alert("Error upload avatar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // FUNGSI HAPUS AVATAR
    const deleteAvatar = async () => {
        try {
            if (!confirm("Yakin ingin menghapus foto profil?")) return;

            setUploading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !profile.avatar_url) return;

            // Ambil path file dari public URL cadangan
            const filename = profile.avatar_url.split("/avatars/")[1];

            // Hapus dari Storage
            const { error: storageError } = await supabase.storage
                .from("avatars")
                .remove([filename]);

            if (storageError) throw storageError;

            // Set avatar_url jadi null di database profiles
            const { error: dbError } = await supabase
                .from("profiles")
                .update({ avatar_url: null })
                .eq("id", user.id);

            if (dbError) throw dbError;

            alert("Foto profil berhasil dihapus");
            loadData();
        } catch (error: any) {
            alert("Error hapus avatar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // SAVE PROFILE
    const saveProfile = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    phone_number: profile.phone_number,
                })
                .eq("id", user.id);

            if (error) throw error;

            alert("Profil berhasil diperbarui");
            loadData();
        } catch (error) {
            console.error(error);
            alert("Gagal memperbarui profil");
        } finally {
            setLoading(false);
        }
    };

    // SAVE ADDRESS
    const saveAddress = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            if (editingAddressId) {
                const { error } = await supabase
                    .from("addresses")
                    .update({ ...addressForm })
                    .eq("id", editingAddressId);

                if (error) throw error;
                alert("Alamat berhasil diperbarui");
            } else {
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

            setAddressForm({
                recipient_name: "",
                phone: "",
                province: "",
                city: "",
                district: "",
                village: "",
                address_detail: "",
            });
            setEditingAddressId(null);
            setOpenAddress(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan alamat");
        } finally {
            setLoading(false);
        }
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
        });
        setOpenAddress(true);
    };

    const deleteAddress = async (id: string) => {
        try {
            const confirmDelete = confirm("Hapus alamat ini?");
            if (!confirmDelete) return;

            const { error } = await supabase
                .from("addresses")
                .delete()
                .eq("id", id);

            if (error) throw error;
            alert("Alamat berhasil dihapus");
            loadData();
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus alamat");
        }
    };

    const setDefaultAddress = async (id: string) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            await supabase
                .from("addresses")
                .update({ is_default: false })
                .eq("user_id", user.id);

            const { error } = await supabase
                .from("addresses")
                .update({ is_default: true })
                .eq("id", id);

            if (error) throw error;
            alert("Alamat utama diperbarui");
            loadData();
        } catch (error) {
            console.error(error);
            alert("Gagal mengatur alamat utama");
        }
    };

    return (
        <div className="container mx-auto max-w-5xl p-4 space-y-5">
            {/* HEADER dengan Props tambahan untuk avatar */}
            <ProfileHeader
                fullName={profile.full_name}
                email={profile.email}
                avatarUrl={profile.avatar_url}
                onUpload={uploadAvatar}
                onDelete={deleteAvatar}
                uploading={uploading}
            />

            {/* PROFILE FORM */}
            <ProfileForm
                form={profile}
                setForm={setProfile}
                onSave={saveProfile}
                loading={loading}
            />

            {/* ADDRESS SECTION */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-bold text-lg">Alamat Saya</h2>
                        <p className="text-sm text-slate-500">
                            Kelola alamat pengiriman akun Anda
                        </p>
                    </div>
                    <Button onClick={() => setOpenAddress(true)}>
                        Tambah Alamat
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <div className="border border-dashed rounded-xl p-10 text-center text-sm text-slate-500">
                        Belum ada alamat tersimpan
                    </div>
                ) : (
                    <div className="space-y-3">
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

            {/* ADDRESS MODAL */}
            <AddressModal
                open={openAddress}
                setOpen={setOpenAddress}
                form={addressForm}
                setForm={setAddressForm}
                onSave={saveAddress}
                loading={loading}
            />
        </div>
    );
}