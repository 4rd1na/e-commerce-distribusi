"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    avatar_url: string | null;
}

export default function ProfilePage() {

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            setUser(user);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setProfile(data);

            setFullName(data.full_name || "");
            setEmail(data.email || "");
            setPhoneNumber(
                data.phone_number || ""
            );

            setAvatarUrl(data.avatar_url || "");

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";

        return name
            .trim()
            .split(" ")
            .filter(Boolean)
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    phone_number: phoneNumber,
                    updated_at: new Date(),
                })
                .eq("id", user.id);

            if (error) throw error;

            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        full_name: fullName,
                        phone_number: phoneNumber,
                    }
                    : prev
            );

            alert("Profile berhasil diperbarui");

        } catch (error: any) {

            alert(error.message);

        } finally {

            setSaving(false);

        }
    };

    const uploadAvatar = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        try {
            setUploading(true);

            const file =
                e.target.files?.[0];

            if (!file) return;

            if (
                !file.type.startsWith("image/")
            ) {
                alert(
                    "File harus berupa gambar"
                );
                return;
            }

            if (
                file.size >
                2 * 1024 * 1024
            ) {
                alert(
                    "Ukuran maksimal 2MB"
                );
                return;
            }

            const ext =
                file.name.split(".").pop();

            const filePath =
                `${user.id}/${Date.now()}.${ext}`;

            const { error: uploadError } =
                await supabase.storage
                    .from("avatars")
                    .upload(filePath, file, {
                        upsert: true,
                    });

            if (uploadError)
                throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            const { error: updateError } =
                await supabase
                    .from("profiles")
                    .update({
                        avatar_url: publicUrl,
                    })
                    .eq("id", user.id);

            if (updateError)
                throw updateError;

            setAvatarUrl(publicUrl);

            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        avatar_url: publicUrl,
                    }
                    : prev
            );

            alert(
                "Avatar berhasil diupload"
            );

        } catch (error: any) {

            alert(error.message);

        } finally {

            setUploading(false);

        }
    };

    const deleteAvatar = async () => {
        try {
            const confirmDelete = confirm(
                "Hapus foto profile?"
            );

            if (!confirmDelete) return;

            setUploading(true);

            if (avatarUrl) {

                const path = avatarUrl.split(
                    "/storage/v1/object/public/avatars/"
                )[1];

                if (path) {
                    await supabase.storage
                        .from("avatars")
                        .remove([path]);
                }
            }

            const { error } = await supabase
                .from("profiles")
                .update({
                    avatar_url: null,
                })
                .eq("id", user.id);

            if (error) throw error;

            setAvatarUrl("");

            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        avatar_url: null,
                    }
                    : prev
            );

            alert(
                "Foto profile berhasil dihapus"
            );

        } catch (error: any) {

            alert(error.message);

        } finally {

            setUploading(false);

        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-5">

                <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">

                        <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto" />

                        <div className="h-4 bg-slate-200 rounded mt-4 w-24 mx-auto" />

                        <div className="h-3 bg-slate-200 rounded mt-2 w-36 mx-auto" />

                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">

                        <div className="space-y-4">

                            <div className="h-10 bg-slate-200 rounded-xl" />

                            <div className="h-10 bg-slate-200 rounded-xl" />

                            <div className="h-10 bg-slate-200 rounded-xl" />

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-5">

            <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">

                {/* LEFT */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 h-fit">

                    <div className="flex flex-col items-center">

                        <Avatar className="w-20 h-20 border-4 border-slate-100">

                            {avatarUrl ? (
                                <AvatarImage
                                    src={avatarUrl}
                                />
                            ) : null}

                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-base font-semibold">
                                {getInitials(
                                    profile?.full_name ||
                                    email
                                )}
                            </AvatarFallback>

                        </Avatar>

                        <h2 className="mt-3 text-base font-semibold text-slate-900 text-center">
                            {profile?.full_name || "User"}
                        </h2>

                        <p className="text-xs text-slate-500 text-center break-all mt-1">
                            {email}
                        </p>

                        <div className="w-full mt-4 space-y-2">

                            <label className="block">

                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={uploadAvatar}
                                    disabled={uploading}
                                />

                                <div className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition text-white text-sm font-medium flex items-center justify-center cursor-pointer">
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload Foto"}
                                </div>

                            </label>

                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={deleteAvatar}
                                    disabled={uploading}
                                    className="w-full h-9 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    Hapus Foto
                                </Button>
                            )}

                        </div>

                    </div>

                </div>

                {/* RIGHT */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">

                    <div className="mb-5">

                        <h1 className="text-lg font-bold text-slate-900">
                            Pengaturan Profile
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Kelola informasi akun kamu
                        </p>

                    </div>

                    <div className="space-y-4">

                        {/* FULL NAME */}
                        <div>

                            <label className="text-sm font-medium text-slate-700 block mb-2">
                                Nama Lengkap
                            </label>

                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(
                                        e.target.value
                                    )
                                }
                                placeholder="Masukkan nama lengkap"
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                            />

                        </div>

                        {/* EMAIL */}
                        <div>

                            <label className="text-sm font-medium text-slate-700 block mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500 cursor-not-allowed"
                            />

                        </div>

                        {/* PHONE */}
                        <div>

                            <label className="text-sm font-medium text-slate-700 block mb-2">
                                Nomor HP
                            </label>

                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) =>
                                    setPhoneNumber(
                                        e.target.value
                                    )
                                }
                                placeholder="08xxxxxxxxxx"
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                            />

                        </div>

                        {/* BUTTON */}
                        <div className="pt-1">

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5"
                            >
                                {saving
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </Button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}