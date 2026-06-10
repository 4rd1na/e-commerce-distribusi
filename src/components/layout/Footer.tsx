import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">
                                Dina<span className="text-emerald-400">Mart</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            Platform distribusi produk terpercaya. Belanja mudah, harga bersaing, pengiriman cepat.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Navigasi</h3>
                        <div className="space-y-2">
                            <Link href="/" className="block text-sm text-slate-500 hover:text-emerald-400 transition">Beranda</Link>
                            <Link href="/kemitraan" className="block text-sm text-slate-500 hover:text-emerald-400 transition">Kemitraan</Link>
                            <Link href="/carts" className="block text-sm text-slate-500 hover:text-emerald-400 transition">Keranjang</Link>
                            <Link href="/profile" className="block text-sm text-slate-500 hover:text-emerald-400 transition">Profile</Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Kontak</h3>
                        <div className="space-y-2 text-sm text-slate-500">
                            <p>support@dinamart.com</p>
                            <p>Jawa Timur, Indonesia</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
                <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} DinaMart. Semua hak dilindungi.
                    </p>
                </div>
            </div>
        </footer>
    );
}
