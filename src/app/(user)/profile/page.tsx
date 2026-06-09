"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { Camera, Calendar, ShieldCheck, Loader2, Trash2 } from "lucide-react";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    avatar_url: string | null;
    role?: string; // Menampung data level user jika ada di profile
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

    // Helper format tanggal (Bergabung Sejak)
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 px-4 py-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto" />
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32 mx-auto" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40 mx-auto" />
                    </div>
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-6">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                        <div className="space-y-4">
                            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 px-4 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">

                {/* KARTU KIRI: AVATAR & INFO STATIS */}
                <Card className="h-fit shadow-sm border-slate-200 dark:border-slate-800">
                    <CardContent className="pt-6 flex flex-col items-center">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-md dark:border-slate-950">
                                {avatarUrl ? (
                                    <AvatarImage src={avatarUrl} alt={profile?.full_name || "User"} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xl font-bold dark:bg-emerald-950 dark:text-emerald-400">
                                    {getInitials(profile?.full_name || email)}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-0 right-0 h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={uploadAvatar}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="mt-4 text-center">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 line-clamp-1">
                                {profile?.full_name || "User"}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 break-all max-w-[220px]">
                                {email}
                            </p>
                        </div>

                        {avatarUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={deleteAvatar}
                                disabled={uploading}
                                className="mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Hapus Foto
                            </Button>
                        )}

                        <Separator className="my-5 bg-slate-100 dark:bg-slate-800" />

                        {/* INFO LEVEL & TANGGAL BERGABUNG */}
                        <div className="w-full space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Level
                                </span>
                                <Badge variant="secondary" className="capitalize font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    {user?.user_metadata?.role || profile?.role || "Member"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                    <Calendar className="w-4 h-4 text-slate-400" /> Bergabung
                                </span>
                                <span className="text-xs font-medium text-slate-900 dark:text-slate-200">
                                    {formatDate(user?.created_at)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KARTU KANAN: FORM PENGATURAN */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            Pengaturan Profil
                        </CardTitle>
                        <CardDescription>
                            Kelola dan perbarui informasi data akun pribadi kamu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">
                                Nama Lengkap
                            </Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Masukkan nama lengkap kamu"
                                className="focus-visible:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                                Alamat Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">
                                Nomor Handphone
                            </Label>
                            <Input
                                id="phone"
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Contoh: 081234567890"
                                className="focus-visible:ring-emerald-500"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 shadow-sm shadow-emerald-600/10 active:scale-98 transition-all"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Perubahan"
                                )}
                            </Button>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}