"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Menu, ShoppingCart, LogOut, X, Search, User as UserIcon, ShoppingBag, MapPin, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

        // Jalankan pengecekan ulang jumlah cart tiap kali ada event 'cart-updated' dipicu
        const handleCartUpdateEvent = () => {
            getCartCountOnly();
        };

        window.addEventListener("cart-updated", handleCartUpdateEvent);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            getSession();
        });

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("cart-updated", handleCartUpdateEvent);
        };
    }, []);

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

    // Fungsi mandiri untuk tarik nilai Qty Item Cart secara real-time
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
                const { data: items } = await supabase
                    .from("cart_items")
                    .select("qty")
                    .eq("cart_id", cart.id);

                const total = items?.reduce((acc, item) => acc + item.qty, 0) || 0;
                setCartCount(total);
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
            router.push("/auth/login");
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
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

                {/* LEFT */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-2xl font-black">
                        <span className="text-emerald-600">Dina</span>
                        <span className="text-slate-900">Mart</span>
                    </Link>
                </div>

                {/* SEARCH */}
                <div className="hidden md:flex flex-1 max-w-xl relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2">
                    {/* PENGAJUAN (DESKTOP) */}
                    <Link href="/" className="hidden md:block">
                        <Button variant="outline" className="rounded-xl border-none">
                            Home
                        </Button>
                    </Link>
                    {user && (
                        <Link href="/pengajuan" className="hidden md:block">
                            <Button variant="outline" className="rounded-xl border-none">
                                Pengajuan
                            </Button>
                        </Link>
                    )}

                    {/* CART (DESKTOP) */}
                    <div className="hidden md:block">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCartClick}
                            className="relative rounded-full"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 h-4 min-w-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center transform translate-x-1 -translate-y-1 shadow-sm animate-in scale-in duration-100">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* USER (DESKTOP) */}
                    {user ? (
                        <div className="hidden md:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="rounded-full">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={profile?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {getInitials(profile?.full_name || profile?.email?.split("@")[0])}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">Profiles</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/orders">Pesanan Saya</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/addresses">Alamat</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-red-600"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="hidden md:block">
                            <Link href="/auth/login">
                                <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                    Masuk
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* MOBILE MENU TOGGLE */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
                    >
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* MOBILE DROPDOWN */}
            {menuOpen && (
                <div className="border-t bg-white md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="p-4 space-y-4">
                        {/* SEARCH (MOBILE) */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none"
                            />
                        </div>

                        {/* NAV LINK (MOBILE) */}
                        <div className="space-y-1">
                            <Link
                                href="/"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                            >
                                Home
                            </Link>

                            <button
                                onClick={handleCartClick}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-slate-500" />
                                    <span>Keranjang</span>
                                </div>
                                {cartCount > 0 && (
                                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {user && (
                                <Link
                                    href="/pengajuan"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span>Pengajuan</span>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* PROFILE SECTIONS (MOBILE) */}
                        <div className="border-t pt-3">
                            {user ? (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 flex items-center gap-3 mb-2">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={profile?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {getInitials(profile?.full_name || profile?.email?.split("@")[0])}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-800 truncate">
                                                {profile?.full_name || "User"}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate">
                                                {profile?.email}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        href="/profile"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50"
                                    >
                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                        Profiles
                                    </Link>

                                    <Link
                                        href="/orders"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50"
                                    >
                                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                                        Pesanan Saya
                                    </Link>

                                    <Link
                                        href="/addresses"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50"
                                    >
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        Alamat
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 mt-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                                    <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">
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