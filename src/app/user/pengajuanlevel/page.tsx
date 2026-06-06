"use client";

import { useState } from "react";
import type { UserLevel } from "@/types";

export default function HalamanPengajuanLevel() {
    // 1. STATE SIMULASI (Sementara sebelum ada database)
    const [currentLevel, setCurrentLevel] = useState<UserLevel>("konsumen");
    const [requestedLevel, setRequestedLevel] = useState<UserLevel>("reseller");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // State untuk mengontrol tampilan UI: 'form' | 'pending' | 'success'
    const [uiState, setUiState] = useState<'form' | 'pending' | 'success'>('form');

    // 2. HANDLER SIMULASI KIRIM DATA
    const handleSimulateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulasi loading 1.5 detik seolah-olah kirim ke database
        setTimeout(() => {
            setSubmitting(false);
            setUiState('pending'); // Ubah tampilan ke mode menunggu approval admin
        }, 1500);
    };

    return (
        <div className="container mx-auto p-4 max-w-xl min-h-[80vh] flex flex-col justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-300">

                {/* =========================================================================
            KONDISI 1: TAMPILAN FORM PENGAJUAN
           ========================================================================= */}
                {uiState === 'form' && (
                    <>
                        {/* HEADER */}
                        <div className="mb-5">
                            <span className="bg-slate-100 text-slate-800 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                                Akun Kemitraan
                            </span>
                            <h1 className="text-base font-bold text-slate-900 mt-2">Ajukan Kenaikan Tingkat Akun</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Tingkat akun kamu saat ini: <span className="font-bold text-emerald-600 uppercase">{currentLevel}</span>
                            </p>
                        </div>

                        <hr className="border-slate-100 my-4" />

                        <form onSubmit={handleSimulateSubmit} className="space-y-4">
                            {/* DROPDOWN PILIH LEVEL */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Pilih Tingkat yang Diinginkan
                                </label>
                                <select
                                    value={requestedLevel}
                                    onChange={(e) => setRequestedLevel(e.target.value as UserLevel)}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                                >
                                    <option value="reseller">Reseller (Mulai Grosir Kecil)</option>
                                    <option value="sub_agen">Sub Agen (Grosir Menengah)</option>
                                    <option value="agen">Agen (Distribusi Wilayah)</option>
                                    <option value="distributor">Distributor (Mitra Utama Pabrik)</option>
                                </select>
                            </div>

                            {/* INPUT SYARAT & KETENTUAN / ALASAN */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Alasan & Dokumen Pendukung
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Saya berencana menyetok 100pcs produk per bulan, saat ini saya memiliki toko kosmetik aktif di kota Malang..."
                                    rows={4}
                                    required
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-slate-400 placeholder:text-slate-400 leading-relaxed"
                                />
                            </div>

                            {/* BANNER NOTIFIKASI KECIL */}
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[11px] text-slate-500 leading-relaxed flex gap-2">
                                <span>💡</span>
                                <p>
                                    <strong>Info:</strong> Setelah formulir dikirim, tim Admin akan melakukan validasi akun kamu. Katalog harga grosir akan aktif otomatis begitu pengajuan ini disetujui.
                                </p>
                            </div>

                            {/* TOMBOL SUBMIT */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-slate-950 text-white text-xs py-3 rounded-xl font-medium hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all duration-200 active:scale-[0.99]"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Mengirim data ke sistem...
                                    </span>
                                ) : (
                                    "Kirim Permohonan Upgrade"
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* =========================================================================
            KONDISI 2: TAMPILAN JIKA STATUS PENDING (MENUNGGU APPROVAL)
           ========================================================================= */}
                {uiState === 'pending' && (
                    <div className="py-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl border border-amber-100 animate-pulse">
                            ⏳
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Pengajuan Sedang Ditinjau
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                                Kamu telah mengajukan perpindahan tingkat akun menjadi <span className="font-bold text-amber-600 uppercase">{requestedLevel}</span>.
                                Tim Admin akan memeriksa kelayakan akun kamu dalam waktu maksimal 1x24 jam.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl text-left max-w-md mx-auto border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium uppercase mb-1">Catatan Pengajuan Anda:</span>
                            <p className="text-xs text-slate-600 italic">"{notes || 'Tidak ada catatan tambahan'}"</p>
                        </div>

                        <button
                            onClick={() => setUiState('form')}
                            className="text-xs text-slate-400 underline hover:text-slate-600 pt-2 block mx-auto"
                        >
                            Kembali ke Form (Simulasi reset)
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}