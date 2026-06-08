"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t bg-white">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* KIRI: Brand & Slogan Singkat */}
                    <div className="text-center md:text-left">
                        <h2 className="text-lg font-black text-emerald-600 leading-none mb-1">
                            DinaMart
                        </h2>
                        <p className="text-xs text-slate-500">
                            Platform distribusi produk & mitra.
                        </p>
                    </div>

                    {/* TENGAH: Info Tambahan Ringkas (Navigasi & Kontak) */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-500 font-medium">
                        <Link href="/" className="hover:text-emerald-600 transition">Beranda</Link>
                        <Link href="/pengajuan" className="hover:text-emerald-600 transition">Kemitraan</Link>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span className="text-slate-500">support@dinamart.com</span>
                    </div>

                    {/* KANAN: Copyright */}
                    <div className="text-xs text-slate-500 text-center md:text-right">
                        © {new Date().getFullYear()} DinaMart. Semua hak dilindungi undang-undang.
                    </div>

                </div>
            </div>
        </footer>
    );
}