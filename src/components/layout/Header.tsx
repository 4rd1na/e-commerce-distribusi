"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, ShoppingCart, LogOut, X, Search, User as UserIcon, ShoppingBag, MapPin, FileText, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

    useEffect(() => {
        if (pathname !== "/") return;
        const timer = setTimeout(() => {
            const trimmed = search.trim();
            if (trimmed === "") {
                router.replace("/");
                return;
            }
            router.replace(`/?search=${encodeURIComponent(trimmed)}`);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, router]);

    useEffect(() => {
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            getSession();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ── Supabase Realtime ──
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
            router.replace("/");
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

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm shadow-slate-100/50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

                {/* LEFT — Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight">
                        <span className="text-emerald-600">Dina</span>
                        <span className="text-slate-800">Mart</span>
                    </span>
                </Link>

                {/* SEARCH — Desktop */}
                <div className="hidden md:flex flex-1 max-w-xl relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 rounded-full border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                </div>

                {/* RIGHT — Actions */}
                <div className="flex items-center gap-1">

                    {/* Nav Links Desktop */}
                    <Link href="/" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        Beranda
                    </Link>
                    {user && (
                        <Link href="/kemitraan" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition">
                            Kemitraan
                        </Link>
                    )}

                    {/* Divider */}
                    <div className="hidden md:block w-px h-6 bg-slate-200 mx-1" />

                    {/* Cart */}
                    <button
                        onClick={handleCartClick}
                        className="relative p-2 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-emerald-600/30">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* User */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="ml-1 rounded-full ring-2 ring-slate-100 hover:ring-emerald-200 transition">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                                            {getInitials(profile?.full_name || profile?.email?.split("@")[0])}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200 p-1">
                                <div className="px-3 py-2 mb-1">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {profile?.full_name || "User"}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                        {profile?.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2">
                                    <Link href="/profile"><UserIcon className="w-4 h-4 text-slate-400" /> Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2">
                                    <Link href="/orders"><ShoppingBag className="w-4 h-4 text-slate-400" /> Pesanan</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg text-sm gap-2.5 px-3 py-2">
                                    <Link href="/addresses"><MapPin className="w-4 h-4 text-slate-400" /> Alamat</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-sm gap-2.5 px-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <LogOut className="w-4 h-4" /> Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/login" className="hidden md:block ml-1">
                            <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold px-5 h-9 shadow-sm shadow-emerald-600/20">
                                Masuk
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {menuOpen && (
                <div className="border-t border-slate-100 bg-white md:hidden animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
                    <div className="p-4 space-y-4">

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none"
                            />
                        </div>

                        {/* Nav */}
                        <div className="space-y-0.5">
                            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition">
                                Beranda
                            </Link>
                            <button onClick={handleCartClick} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="w-4 h-4 text-slate-400" />
                                    <span>Keranjang</span>
                                </div>
                                {cartCount > 0 && (
                                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            {user && (
                                <Link href="/kemitraan" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Kemitraan
                                </Link>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="border-t border-slate-100 pt-3">
                            {user ? (
                                <div className="space-y-0.5">
                                    <div className="px-3 py-2.5 flex items-center gap-3 mb-1">
                                        <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                                            <AvatarImage src={profile?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                {getInitials(profile?.full_name || profile?.email?.split("@")[0])}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || "User"}</span>
                                            <span className="text-[11px] text-slate-400 truncate">{profile?.email}</span>
                                        </div>
                                    </div>
                                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition">
                                        <UserIcon className="w-4 h-4 text-slate-400" /> Profile
                                    </Link>
                                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition">
                                        <ShoppingBag className="w-4 h-4 text-slate-400" /> Pesanan Saya
                                    </Link>
                                    <Link href="/addresses" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition">
                                        <MapPin className="w-4 h-4 text-slate-400" /> Alamat
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition mt-1">
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" onClick={() => setMenuOpen(false)}>
                                    <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold h-10">
                                        Masuk
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
