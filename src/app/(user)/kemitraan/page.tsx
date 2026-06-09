"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PartnerRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [requestedLevel, setRequestedLevel] = useState("reseller");
    const [companyName, setCompanyName] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Dapatkan session user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let attachmentUrl = null;

            // 2. Upload file bukti jika ada
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("partner-attachments")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Dapatkan Public URL nya
                const { data: { publicUrl } } = supabase.storage
                    .from("partner-attachments")
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;
            }

            // 3. Simpan data pengajuan ke table partner_requests
            const { error: insertError } = await supabase
                .from("partner_requests")
                .insert({
                    user_id: user.id,
                    requested_level: requestedLevel,
                    company_name: companyName || null,
                    notes: notes || null,
                    attachment_url: attachmentUrl,
                    status: "pending" // Default status sesuai Enum schema
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

    if (success) {
        return (
            <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Pengajuan Terkirim!</h2>
                <p className="text-slate-600 text-sm mb-6">
                    Permintaan kemitraan Anda sedang ditinjau oleh tim Admin DinaMart. Status awal pengajuan Anda adalah <strong>Pending</strong>.
                </p>
                <Button onClick={() => router.push("/")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    Kembali ke Beranda
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto my-8 p-4 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900">Ajukan Kemitraan</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kembangkan bisnis Anda bersama DinaMart dengan jenjang tingkat harga yang lebih menguntungkan.
                </p>
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
                        <option value="reseller">Reseller</option>
                        <option value="sub_agen">Sub Agen</option>
                        <option value="agen">Agen</option>
                        <option value="distributor">Distributor</option>
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