"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    Store,
    BadgePercent,
    Clock,
    CheckCircle2,
    AlertCircle,
    Upload,
    ChevronRight,
    Building2
} from "lucide-react";

export default function PengajuanMitraPage() {
    // STATE SIMULASI UI (Ubah nilai di bawah ini untuk tes tampilan status)
    // Pilihan status: "none" (form kosong), "pending" (menunggu), "approved" (sukses), "rejected" (ditolak)
    const [simulatedStatus, setSimulatedStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");

    // Form State (UI Only)
    const [companyName, setCompanyName] = useState("");
    const [requestedLevel, setRequestedLevel] = useState("reseller"); // Default opsi pertama dari ENUM kemitraan
    const [notes, setNotes] = useState("");
    const [storeImage, setStoreImage] = useState<File | null>(null);

    // Fungsi handle submit simulasi UI
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) return;

        // Ubah status ke pending untuk mensimulasikan setelah klik kirim
        setSimulatedStatus("pending");
    };

    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl min-h-[calc(100vh-130px)]">

            {/* TOOLBOX SIMULASI (Bisa kamu hapus nanti, ini cuma buat testing UI status) */}
            <div className="mb-6 p-3 bg-slate-50 border rounded-xl flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tes Tampilan Status UI:</span>
                <div className="flex gap-1.5">
                    <button onClick={() => setSimulatedStatus("none")} className={`px-2.5 py-1 rounded-md text-xs font-semibold ${simulatedStatus === "none" ? "bg-slate-900 text-white" : "bg-white border text-slate-600"}`}>Form Kosong</button>
                    <button onClick={() => setSimulatedStatus("pending")} className={`px-2.5 py-1 rounded-md text-xs font-semibold ${simulatedStatus === "pending" ? "bg-amber-500 text-white" : "bg-white border text-slate-600"}`}>Status Pending</button>
                    <button onClick={() => setSimulatedStatus("approved")} className={`px-2.5 py-1 rounded-md text-xs font-semibold ${simulatedStatus === "approved" ? "bg-emerald-600 text-white" : "bg-white border text-slate-600"}`}>Status Approved</button>
                    <button onClick={() => setSimulatedStatus("rejected")} className={`px-2.5 py-1 rounded-md text-xs font-semibold ${simulatedStatus === "rejected" ? "bg-red-600 text-white" : "bg-white border text-slate-600"}`}>Status Rejected</button>
                </div>
            </div>
            {/* ------------------------------------------------------------- */}

            {/* HEADER HALAMAN */}
            <div className="text-center md:text-left mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Upgrade Level Kemitraan
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Ajukan peningkatan level akun Anda untuk mendapatkan potongan harga produk yang jauh lebih murah.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                {/* KIRI: INFORMASI & BENEFIT MITRA */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            Benefit Naik Level
                        </h3>

                        <div className="space-y-3 text-xs text-slate-700">
                            <div className="flex gap-3">
                                <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-900 text-[13px]">Harga Tiering Khusus</p>
                                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">Sistem otomatis mengubah harga katalog katalog produk sesuai tingkatan level aktif Anda.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-900 text-[13px]">Prioritas Stok Gudang</p>
                                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">Alokasi produk dari inventory stock utama diutamakan untuk menunjang penjualan Anda.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-100 bg-white rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
                        <p className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Alur Proses Verifikasi:</p>
                        <div className="space-y-2 text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">1</span>
                                <span>Pilih level target & isi info usaha</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">2</span>
                                <span>Admin memvalidasi data pengajuan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">3</span>
                                <span>Level profiles & harga terupdate</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KANAN: KONDISI UI FORM / STATUS RESPONSIVE */}
                <div className="md:col-span-2">

                    {/* STATUS 1: MENUNGGU PERSETUJUAN (PENDING) */}
                    {simulatedStatus === "pending" && (
                        <div className="border border-amber-200 bg-amber-50/40 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
                                <Clock className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-amber-900">Pengajuan Sedang Ditinjau Admin</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                    Permintaan peningkatan level akun Anda menjadi <span className="font-bold text-slate-800 uppercase">"{requestedLevel}"</span> sedang diproses. Mohon tunggu konfirmasi berkas Anda selesai diperiksa.
                                </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 tracking-wide uppercase">
                                Status: Pending
                            </span>
                        </div>
                    )}

                    {/* STATUS 2: DISETUJUI (APPROVED) */}
                    {simulatedStatus === "approved" && (
                        <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-emerald-900">Selamat! Pengajuan Anda Disetujui</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                    Tingkat akun Anda sekarang sudah resmi naik menjadi <span className="font-bold text-emerald-700 uppercase">"{requestedLevel}"</span>. Selamat menikmati potongan harga kemitraan baru Anda!
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold gap-1"
                                onClick={() => window.location.href = '/'}
                            >
                                Mulai Belanja Dengan Harga Baru <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    {/* STATUS 3: FORM INPUT UTAMA (NONE ATAU REJECTED) */}
                    {(simulatedStatus === "none" || simulatedStatus === "rejected") && (
                        <form onSubmit={handleFormSubmit} className="border rounded-2xl p-6 bg-white space-y-5 shadow-sm animate-in fade-in duration-200">

                            {/* Alert Box jika pengajuan sebelumnya ditolak */}
                            {simulatedStatus === "rejected" && (
                                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start text-xs text-red-700">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                    <div className="space-y-0.5">
                                        <p className="font-bold">Pengajuan Sebelumnya Ditolak Admin</p>
                                        <p className="text-red-600/90 text-[11px] leading-relaxed">Alasan: Berkas atau bukti foto kelayakan operasional toko kurang jelas. Silakan lengkapi catatan dan upload ulang foto terbaru Anda.</p>
                                    </div>
                                </div>
                            )}

                            {/* Input Nama Usaha */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Nama Usaha / Nama Toko
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Mitra Mandiri Grosir"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            {/* Pilihan Level - Diambil Sesuai Opsi ENUM user_level */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Tingkat Akun yang Diajukan</label>
                                <select
                                    value={requestedLevel}
                                    onChange={(e) => setRequestedLevel(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                                >
                                    <option value="reseller">Reseller (Skala Kecil / Toko Rumahan)</option>
                                    <option value="sub_agen">Sub Agen (Skala Toko Menengah)</option>
                                    <option value="agen">Agen (Distribusi Wilayah Kecamatan)</option>
                                    <option value="distributor">Distributor (Grosir Partai Besar Utama)</option>
                                </select>
                            </div>

                            {/* Upload Gambar Toko */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Foto Bukti Fisik Usaha / Toko</label>
                                <div className="border border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/40 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && setStoreImage(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center shadow-sm text-slate-400 mb-2">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-700">
                                        {storeImage ? storeImage.name : "Pilih atau Tarik Berkas Foto"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Format Gambar PNG, JPG maks. 2MB</p>
                                </div>
                            </div>

                            {/* Catatan */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Catatan Tambahan Mengenai Usaha Anda (Opsional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ceritakan singkat cakupan distribusi jualan Anda atau perkiraan jumlah kuantitas produk yang biasa Anda order dalam sebulan..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white transition resize-none"
                                />
                            </div>

                            {/* Button Kirim */}
                            <Button
                                type="submit"
                                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-sm"
                            >
                                Kirim Pengajuan Sekarang
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}