"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, ShoppingCart, LogOut, X, Search, User as UserIcon, ShoppingBag, MapPin, FileText, Home, Info, Package } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    avatar_url: string | null;
}

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [search, setSearch] = useState("");
    const searchParams = useSearchParams();

    useEffect(() => {
        const currentSearch = searchParams.get("search") || "";
        setSearch(currentSearch);
    }, [searchParams]);

    // Search behavior: hanya navigate ke /products saat ada ketikan
    // Landing page "/" tetap tampil tanpa redirect paksa
    useEffect(() => {
        const trimmed = search.trim();

        // Tidak ada ketikan → tidak redirect
        if (trimmed === "") return;

        // Sudah di /products dengan search yang sama → tidak perlu redirect
        if (pathname === "/products" && searchParams.get("search") === trimmed) return;

        const timer = setTimeout(() => {
            router.replace(`/products?search=${encodeURIComponent(trimmed)}`);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, router, pathname, searchParams]);

    useEffect(() => {
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            getSession();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel("cart-count-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cart_items" },
                () => { getCartCountOnly(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const getSession = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) {
                setProfile(null);
                setCartCount(0);
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(profileData);
            getCartCountOnly(user.id);
        } catch (error) {
            console.error(error);
        }
    };

    const getCartCountOnly = async (userId?: string) => {
        try {
            const activeUserId = userId || (await supabase.auth.getUser()).data.user?.id;
            if (!activeUserId) return;

            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", activeUserId)
                .maybeSingle();

            if (cart) {
                const { count } = await supabase
                    .from("cart_items")
                    .select("*", { count: "exact", head: true })
                    .eq("cart_id", cart.id);

                setCartCount(count || 0);
            } else {
                setCartCount(0);
            }
        } catch (err) {
            console.error("Gagal mengambil data qty cart", err);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            localStorage.clear();
            setMenuOpen(false);
            router.replace("/products");
        } catch (error) {
            console.error("Gagal Logout", error);
        }
    };

    const handleCartClick = () => {
        if (!user) {
            router.push("/login");
        } else {
            router.push("/carts");
        }
        setMenuOpen(false);
    };

    // Kemitraan butuh login dulu
    const handleKemitraanClick = () => {
        if (!user) {
            router.push("/login");
        } else {
            router.push("/kemitraan");
        }
        setMenuOpen(false);
    };

    // Helper class untuk link aktif (UX Highlight)
    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        return `hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            isActive 
                ? "text-emerald-600 font-semibold" 
                : "text-slate-600 hover:text-emerald-600"
        }`;
    };

    const getMobileLinkClass = (path: string) => {
        const isActive = pathname === path;
        return `flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
            isActive 
                ? "bg-emerald-50 text-emerald-600 font-semibold" 
                : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
        }`;
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
            {/* ROW 1: Main Navbar */}
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

                {/* LEFT — Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0 group">
                    <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight select-none">
                        <span className="text-emerald-600">Dinara</span>
                        <span className="text-slate-800">Mart</span>
                    </span>
                </Link>

                {/* SEARCH — Desktop & Tablet Grid */}
                <div className="hidden md:flex flex-1 max-w-lg relative mx-2">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Cari produk di Dinara Mart..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 rounded-full border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* RIGHT — Actions & Navigation */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 mr-2">
                        <Link href="/" className={getLinkClass("/")}>
                            Beranda
                        </Link>
                        <Link href="/products" className={getLinkClass("/products")}>
                            Produk
                        </Link>
                        <button
                            onClick={handleKemitraanClick}
                            className={getLinkClass("/kemitraan").replace("hidden md:inline-flex", "inline-flex")}
                        >
                            Kemitraan
                        </button>
                        <Link href="/tentang-kami" className={getLinkClass("/tentang-kami")}>
                            Tentang Kami
                        </Link>
                    </nav>

                    {/* Desktop Divider */}
                    <div className="hidden md:block w-px h-5 bg-slate-200 mx-1" />

                    {/* Cart Button */}
                    <button
                        onClick={handleCartClick}
                        className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                        aria-label="Keranjang Belanja"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-emerald-600/30 animate-in zoom-in-50 duration-300">
                                {cartCount > 99 ? "99+" : cartCount}
                            </span>
                        )}
                    </button>

                    {/* User Profile — Desktop Dropdown */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200 overflow-hidden hover:opacity-90 active:scale-95 transition-all" aria-label="Menu pengguna">
                                    {profile?.avatar_url ? (
                                        <img 
                                            src={profile.avatar_url} 
                                            alt={profile.full_name || "Avatar"} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-4 h-4 text-emerald-700" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 p-1.5 mt-1">
                                <div className="px-3 py-2">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {profile?.full_name || "Pengguna DinaraMart"}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {profile?.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2 cursor-pointer focus:bg-slate-50">
                                    <Link href="/profile"><UserIcon className="w-4 h-4 text-slate-400" /> Profil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2 cursor-pointer focus:bg-slate-50">
                                    <Link href="/orders"><ShoppingBag className="w-4 h-4 text-slate-400" /> Pesanan</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2 cursor-pointer focus:bg-slate-50">
                                    <Link href="/addresses"><MapPin className="w-4 h-4 text-slate-400" /> Alamat</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-sm gap-2.5 px-3 py-2 text-red-600 font-medium cursor-pointer focus:text-red-700 focus:bg-red-50">
                                    <LogOut className="w-4 h-4" /> Keluar Akun
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/login" className="hidden md:block ml-1">
                            <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold px-5 h-9 transition-colors shadow-sm shadow-emerald-600/10">
                                Masuk
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ROW 2: Mobile Search Bar */}
            <div className="md:hidden border-t border-slate-100 bg-white/50 px-4 py-2">
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all"
                    />
                </div>
            </div>

            {/* MOBILE DROPDOWN MENU */}
            {menuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl absolute w-full left-0">
                    <div className="px-4 py-4 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
                        
                        {/* User Profile Card inside Mobile Menu */}
                        {user && profile && (
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-emerald-700" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-800 truncate">{profile.full_name || "User"}</span>
                                    <span className="text-xs text-slate-400 truncate">{profile.email}</span>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links List */}
                        <nav className="flex flex-col gap-0.5">
                            <Link href="/" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/")}>
                                <Home className="w-4 h-4 opacity-70" />
                                Beranda
                            </Link>
                            <Link href="/products" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/products")}>
                                <Package  className="w-4 h-4 opacity-70" />
                                Produk
                            </Link>
                            <button onClick={handleCartClick} className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="w-4 h-4 opacity-70" />
                                    <span>Keranjang Belanja</span>
                                </div>
                                {cartCount > 0 && (
                                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Menu yang butuh login */}
                            {user && (
                                <>
                                    <Link href="/orders" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/orders")}>
                                        <ShoppingBag className="w-4 h-4 opacity-70" />
                                        Pesanan
                                    </Link>
                                    <Link href="/addresses" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/addresses")}>
                                        <MapPin className="w-4 h-4 opacity-70" />
                                        Alamat
                                    </Link>
                                    <Link href="/profile" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/profile")}>
                                        <UserIcon className="w-4 h-4 opacity-70" />
                                        Profil
                                    </Link>
                                </>
                            )}

                            {/* Menu publik (kemitraan butuh login) */}
                            <button onClick={handleKemitraanClick} className={getMobileLinkClass("/kemitraan")}>
                                <FileText className="w-4 h-4 opacity-70" />
                                Kemitraan
                            </button>
                            <Link href="/tentang-kami" onClick={() => setMenuOpen(false)} className={getMobileLinkClass("/tentang-kami")}>
                                <Info className="w-4 h-4 opacity-70" />
                                Tentang Kami
                            </Link>
                        </nav>

                        {/* Action CTA Button inside Mobile Menu */}
                        {user ? (
                            <div className="border-t border-slate-100 pt-3">
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-3 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    Keluar Akun
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" onClick={() => setMenuOpen(false)} className="block pt-2">
                                <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold h-11 text-sm shadow-md shadow-emerald-600/10">
                                    Masuk Ke Akun
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}