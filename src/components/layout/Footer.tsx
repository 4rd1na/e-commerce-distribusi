import Link from "next/link";
import { ShoppingBag, Home, FileText, ShoppingCart, User, Mail, MapPin } from "lucide-react";

const navLinks = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/keranjang", label: "Keranjang", icon: ShoppingCart },
    { href: "/orders", label: "Pesanan", icon: ShoppingBag },
    { href: "/kemitraan", label: "Kemitraan", icon: FileText },
    { href: "/profile", label: "Profile", icon: User },
];

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400">
            {/* Main Footer */}
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">

                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">
                                Dinara<span className="text-emerald-400">Mart</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            Platform distribusi produk terpercaya. Belanja mudah, harga bersaing, pengiriman cepat.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Navigasi</h3>
                        <div className="space-y-1">
                            {navLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-2.5 px-2 py-2 -mx-2 text-sm text-slate-500 hover:text-emerald-400 active:text-emerald-300 rounded-lg hover:bg-white/5 transition"
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Kontak</h3>
                        <div className="space-y-1">
                            <a
                                href="mailto:support@dinaramart.com"
                                className="flex items-center gap-2.5 px-2 py-2 -mx-2 text-sm text-slate-500 hover:text-emerald-400 active:text-emerald-300 rounded-lg hover:bg-white/5 transition"
                            >
                                <Mail className="w-4 h-4 shrink-0" />
                                <span>support@dinaramart.com</span>
                            </a>
                            <div className="flex items-center gap-2.5 px-2 py-2 -mx-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>Jawa Timur, Indonesia</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-slate-600 text-center sm:text-left">
                        © {new Date().getFullYear()} DinaraMart. Semua hak dilindungi.
                    </p>
                </div>
            </div>
        </footer>
    );
}
