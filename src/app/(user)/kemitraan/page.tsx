"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertCircle, CheckCircle2, Clock, XCircle, Crown } from "lucide-react";

// Label helper
const levelLabels: Record<string, string> = {
    konsumen: "Konsumen",
    reseller: "Reseller",
    sub_agen: "Sub Agen",
    agen: "Agen",
    distributor: "Distributor",
};

// Hierarki level — untuk cek apakah sudah di level yang lebih tinggi
const levelOrder = ["konsumen", "reseller", "sub_agen", "agen", "distributor"];

interface ExistingRequest {
    id: string;
    requested_level: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
}

export default function PartnerRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // State untuk cek pengajuan yang sudah ada
    const [currentLevel, setCurrentLevel] = useState("konsumen");
    const [pendingRequest, setPendingRequest] = useState<ExistingRequest | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    // Form State
    const [requestedLevel, setRequestedLevel] = useState("reseller");
    const [companyName, setCompanyName] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // ── Cek level saat ini & pengajuan pending ──
    useEffect(() => {
        checkExistingData();
    }, []);

    const checkExistingData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Ambil level saat ini dari profiles
            const { data: profile } = await supabase
                .from("profiles")
                .select("level")
                .eq("id", user.id)
                .single();

            if (profile) {
                setCurrentLevel(profile.level);
            }

            // Cek apakah ada pengajuan yang masih pending
            const { data: requests } = await supabase
                .from("partner_requests")
                .select("id, requested_level, status, created_at")
                .eq("user_id", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(1);

            if (requests && requests.length > 0) {
                setPendingRequest(requests[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setInitialLoading(false);
        }
    };

    // ── Submit pengajuan ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let attachmentUrl = null;

            // Upload file bukti jika ada
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("partner-attachments")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("partner-attachments")
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;
            }

            // Simpan data pengajuan ke table partner_requests
            const { error: insertError } = await supabase
                .from("partner_requests")
                .insert({
                    user_id: user.id,
                    requested_level: requestedLevel,
                    company_name: companyName || null,
                    notes: notes || null,
                    attachment_url: attachmentUrl,
                    status: "pending",
                });

            if (insertError) throw insertError;

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Terjadi kesalahan saat mengirim pengajuan.");
        } finally {
            setLoading(false);
        }
    };

    // ── Loading awal ──
    if (initialLoading) {
        return (
            <div className="max-w-xl mx-auto my-8 p-4 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm animate-pulse">
                <div className="h-7 bg-slate-200 rounded w-48 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-72 mb-6" />
                <div className="space-y-5">
                    <div className="h-11 bg-slate-200 rounded-xl" />
                    <div className="h-11 bg-slate-200 rounded-xl" />
                    <div className="h-24 bg-slate-200 rounded-xl" />
                    <div className="h-24 bg-slate-200 rounded-xl" />
                </div>
            </div>
        );
    }

    // ── Sukses ──
    if (success) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Pengajuan Terkirim!</h2>
                <p className="text-slate-600 text-sm mb-6">
                    Permintaan kemitraan Anda sedang ditinjau oleh tim Admin DinaraMart. Status awal pengajuan Anda adalah <strong>Pending</strong>.
                </p>
                <Button onClick={() => router.push("/")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    Kembali ke Beranda
                </Button>
            </div>
        );
    }

    // ── Sudah ada pengajuan pending ──
    if (pendingRequest) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
                <div className="w-16 h-16 bg-yellow-50 border border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Pengajuan Sedang Diproses</h2>
                <p className="text-slate-600 text-sm mb-4">
                    Anda sudah mengajukan level{" "}
                    <span className="font-semibold text-emerald-600">
                        {levelLabels[pendingRequest.requested_level]}
                    </span>
                    {" "}pada{" "}
                    <span className="font-medium">
                        {new Date(pendingRequest.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>.
                </p>
                <p className="text-xs text-slate-400 mb-6">
                    Mohon tunggu konfirmasi dari Admin DinaraMart.
                </p>
                <Button onClick={() => router.push("/")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    Kembali ke Beranda
                </Button>
            </div>
        );
    }

    // ── Filter level yang bisa diajukan (hanya yang lebih tinggi dari level saat ini) ──
    const currentLevelIndex = levelOrder.indexOf(currentLevel);
    const availableLevels = levelOrder.filter((_, i) => i > currentLevelIndex);

    // ── Sudah di level tertinggi ──
    if (availableLevels.length === 0) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Level Tertinggi Tercapai!</h2>
                <p className="text-slate-600 text-sm mb-6">
                    Anda sudah berada di level{" "}
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        {levelLabels[currentLevel]}
                    </Badge>
                    {" "}— level tertinggi dalam sistem kemitraan DinaraMart.
                </p>
                <Button onClick={() => router.push("/")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    Kembali ke Beranda
                </Button>
            </div>
        );
    }

    // ── Form Pengajuan ──
    return (
        <div className="max-w-xl mx-auto my-8 p-4 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900">Ajukan Kemitraan</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kembangkan bisnis Anda bersama DinaraMart dengan jenjang tingkat harga yang lebih menguntungkan.
                </p>
            </div>

            {/* Info level saat ini */}
            <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-white border rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                    <p className="text-xs text-slate-400">Level Anda saat ini</p>
                    <p className="text-sm font-semibold text-slate-800">
                        {levelLabels[currentLevel]}
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Pilih Tingkat Kemitraan */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Pilih Tingkat Kemitraan</label>
                    <select
                        value={requestedLevel}
                        onChange={(e) => setRequestedLevel(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    >
                        {availableLevels.map((level) => (
                            <option key={level} value={level}>
                                {levelLabels[level]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Nama Perusahaan / Toko */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Toko / Perusahaan <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Contoh: Toko Berkah Utama"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Catatan Tambahan */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Catatan Pendukung</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Jelaskan alasan pengajuan atau pengalaman jualan Anda..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Upload Bukti */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Upload Berkas / Bukti Pendukung</label>
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 rounded-xl p-6 transition text-center cursor-pointer">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700">
                            {file ? file.name : "Pilih gambar berkas atau dokumen (PDF/JPG/PNG)"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Maksimal ukuran file 2MB</p>
                    </div>
                </div>

                {/* Tombol Kirim */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                    {loading ? "Sedang Mengirim..." : "Kirim Pengajuan Kemitraan"}
                </Button>
            </form>
        </div>
    );
}
