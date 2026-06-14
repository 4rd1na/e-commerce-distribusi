"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Save,
  X,
  User,
  Phone,
  Mail,
  Camera,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// 1. TYPE DEFINITIONS & CONFIGURATIONS
export interface UserData {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  level: "konsumen" | "reseller" | "sub_agen" | "agen" | "distributor";
  role: "external" | "internal";
  internal_role: "admin" | "billing" | "support";
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const LEVEL_CONFIG = {
  konsumen: { label: "Konsumen", color: "bg-slate-100 text-slate-700 border-slate-200" },
  reseller: { label: "Reseller", color: "bg-blue-50 text-blue-700 border-blue-200" },
  sub_agen: { label: "Sub-Agen", color: "bg-purple-50 text-purple-700 border-purple-200" },
  agen: { label: "Agen Resmi", color: "bg-amber-50 text-amber-700 border-amber-200" },
  distributor: { label: "Distributor Utama", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// 2. MAIN COMPONENT (PAGE)
export default function Page() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User belum login:", authError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone_number, avatar_url, level, role, internal_role, is_active, created_at, updated_at",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Gagal mengambil data profil:", error);
      }

      if (data) {
        setUserData(data as UserData);
      }
    } catch (err) {
      console.error("Error unhandled:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-muted-foreground text-sm font-medium text-gray-500">Memuat profil Anda...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 text-center">
        <div className="max-w-sm bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-800 font-semibold text-sm">Profil Tidak Ditemukan</p>
          <p className="text-red-600 text-xs mt-1">Silakan coba muat ulang halaman atau hubungi tim bantuan jika masalah berlanjut.</p>
        </div>
      </div>
    );
  }

  return <UserProfile data={userData} setData={setUserData} />;
}

// ==========================================
// 3. SUB-COMPONENT (USER PROFILE VIEW/EDIT)
// ==========================================
interface UserProfileProps {
  data: UserData;
  setData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

function UserProfile({ data, setData }: UserProfileProps) {
  const [isEdit, setIsEdit] = useState(false);
  const [tempData, setTempData] = useState<UserData>(data);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setTempData(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempData({ ...tempData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file maksimal 2MB.", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Format harus berupa gambar.", "error");
      return;
    }

    setAvatarFile(file);
    setTempData({ ...tempData, avatar_url: URL.createObjectURL(file) });
  };

  const uploadAvatarToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${data.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    if (data.avatar_url?.includes("/avatars/")) {
      const oldPath = data.avatar_url.split("/avatars/")[1];
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!data.id) return;
    setIsSaving(true);

    try {
      let finalAvatarUrl = tempData.avatar_url;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        finalAvatarUrl = await uploadAvatarToStorage(avatarFile);
        setIsUploadingAvatar(false);
        setAvatarFile(null);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: tempData.full_name,
          phone_number: tempData.phone_number,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert({
          action: "updated",
          entity: "profiles",
          description: `Memperbarui profil: ${tempData.full_name}`,
          created_by: user.id,
        });
      }

      setData({ ...tempData, avatar_url: finalAvatarUrl });
      setLastUpdated(new Date());
      setIsEdit(false);
      showToast("Profil berhasil diperbarui!");
    } catch (error: any) {
      showToast("Gagal menyimpan: " + error.message, "error");
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    if (tempData.full_name !== data.full_name || tempData.phone_number !== data.phone_number || avatarFile) {
      if (!confirm("Batalkan semua perubahan data Anda?")) return;
    }
    setTempData(data);
    setAvatarFile(null);
    setIsEdit(false);
  };

  const formatTanggalIndo = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const currentLevel = LEVEL_CONFIG[data.level] || { label: data.level, color: "bg-gray-100" };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen sm:min-h-auto sm:my-6 rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      
      {/* HERO HEADER AREA */}
      <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 px-6 pt-8 pb-20 text-center relative">
        <h2 className="text-white font-bold text-lg">Akun Saya</h2>
        <p className="text-emerald-100 text-xs mt-0.5">Atur informasi pribadi Anda</p>
      </div>

      {/* AVATAR CARD POP-UP */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
              {tempData.avatar_url ? (
                <img src={tempData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>
            
            {isEdit && (
              <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-transform active:scale-95">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>

          <h3 className="mt-3 font-bold text-gray-800 text-base">{data.full_name || "Tanpa Nama"}</h3>
          
          <div className="flex gap-1.5 items-center mt-2">
            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border uppercase tracking-wider ${currentLevel.color}`}>
              {currentLevel.label}
            </span>
            {data.role === "internal" && (
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 capitalize">
                Staff ({data.internal_role || "User"})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PROFILE DETAILS */}
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
          
          {/* Item: Nama */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><User className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nama Lengkap</p>
                {!isEdit ? (
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{data.full_name || "-"}</p>
                ) : (
                  <input
                    type="text"
                    name="full_name"
                    value={tempData.full_name || ""}
                    onChange={handleChange}
                    placeholder="Masukkan nama"
                    className="text-sm font-medium text-emerald-600 bg-emerald-50/50 border-b border-emerald-300 outline-none px-1 mt-0.5 w-full focus:bg-emerald-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Item: Telepon */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Phone className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nomor Telepon</p>
                {!isEdit ? (
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{data.phone_number || "-"}</p>
                ) : (
                  <input
                    type="text"
                    name="phone_number"
                    value={tempData.phone_number || ""}
                    onChange={handleChange}
                    placeholder="Contoh: 081234..."
                    className="text-sm font-medium text-emerald-600 bg-emerald-50/50 border-b border-emerald-300 outline-none px-1 mt-0.5 w-full focus:bg-emerald-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Item: Email */}
          <div className="p-4 flex items-center justify-between gap-4 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100/80 text-slate-400 rounded-lg"><Mail className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Alamat Email</p>
                <p className="text-sm font-medium text-gray-400 mt-0.5">{data.email || "-"}</p>
              </div>
            </div>
            {isEdit && (
              <span className="text-[9px] bg-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded flex items-center gap-1 select-none">
                <Lock className="w-2.5 h-2.5" /> Terkunci
              </span>
            )}
          </div>

          {/* Item: Info Join */}
          <div className="p-4 flex items-center justify-between gap-4 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100/80 text-slate-400 rounded-lg"><Calendar className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bergabung Sejak</p>
                <p className="text-sm font-medium text-gray-500 mt-0.5">{formatTanggalIndo(data.created_at)}</p>
              </div>
            </div>
          </div>

        </div>

        {/* FLOATING ACTION BUTTONS */}
        <div className="pt-2">
          {!isEdit ? (
            <button
              onClick={() => setIsEdit(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl shadow-md active:scale-[0.99] transition"
            >
              <Pencil className="w-4 h-4" /> Edit Profil
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl shadow-md disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-semibold text-sm py-3 rounded-xl transition"
              >
                <X className="w-4 h-4" /> Batal
              </button>
            </div>
          )}
        </div>

        {/* FOOTER METADATA */}
        <p className="text-center text-[10px] text-gray-400 pt-2">
          {lastUpdated 
            ? `Pembaruan berhasil dilakukan.` 
            : data.updated_at 
              ? `Terakhir diperbarui: ${new Date(data.updated_at).toLocaleDateString("id-ID")}` 
              : "Profil aktif."}
        </p>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm ${
            toast.type === "success"
              ? "bg-white/95 border border-slate-200"
              : "bg-white/95 border border-red-200"
          }`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success" ? "bg-emerald-50" : "bg-red-50"
            }`}>
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}