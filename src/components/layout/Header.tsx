"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
    Menu,
    ShoppingCart,
    LogOut,
    X,
    Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
}

export default function Header() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        router.push(`/?search=${encodeURIComponent(debouncedSearch)}`);
    }, [debouncedSearch, router]);

    useEffect(() => {
        getSession();
    }, []);

    const getSession = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);

            if (!user) {
                setProfile(null);
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(profileData);

            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (cart) {
                const { data: items } = await supabase
                    .from("cart_items")
                    .select("qty")
                    .eq("cart_id", cart.id);

                const total =
                    items?.reduce(
                        (acc, item) => acc + item.qty,
                        0
                    ) || 0;

                setCartCount(total);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            localStorage.clear();

            router.push("/auth/login");

        } catch (error) {
            console.error("Gagal Logout", error);
        }
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

                    <Link
                        href="/"
                        className="text-2xl font-black"
                    >
                        <span className="text-emerald-600">
                            Dina
                        </span>

                        <span className="text-slate-900">
                            Mart
                        </span>
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

                    {/* PENGAJUAN */}
                    {user && (
                        <>
                            <Link
                                href="/"
                                className="hidden md:block"
                            >
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-none"
                                >
                                    Home
                                </Button>
                            </Link>
                            <Link
                                href="/pengajuan"
                                className="hidden md:block"
                            >
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-none"
                                >
                                    Pengajuan
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* CART */}
                    <Link href="/cart">

                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full"
                        >
                            <ShoppingCart className="w-5 h-5" />

                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                                    {cartCount}
                                </div>
                            )}

                        </Button>

                    </Link>

                    {/* USER */}
                    {user ? (
                        <DropdownMenu>

                            <DropdownMenuTrigger asChild>

                                <button className="rounded-full">

                                    <Avatar className="h-10 w-10 border">

                                        <AvatarImage
                                            src={profile?.avatar_url || ""}
                                        />

                                        <AvatarFallback>
                                            {getInitials(
                                                profile?.full_name ||
                                                user?.user_metadata?.full_name ||
                                                user?.email?.split("@")[0]
                                            )}
                                        </AvatarFallback>

                                    </Avatar>

                                </button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">

                                <DropdownMenuItem asChild>

                                    <Link href="/profile">
                                        Profiles
                                    </Link>

                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>

                                    <Link href="/orders">
                                        Pesanan Saya
                                    </Link>

                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>

                                    <Link href="/addresses">
                                        Alamat
                                    </Link>

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
                    ) : (
                        <Link href="/auth/login">

                            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                Masuk
                            </Button>

                        </Link>
                    )}

                    {/* MOBILE MENU */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden"
                    >
                        {menuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>

                </div>

            </div>

            {/* MOBILE */}
            {menuOpen && (
                <div className="border-t bg-white md:hidden">

                    <div className="p-4 space-y-3">

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

                        <Link
                            href="/"
                            className="block text-sm font-medium"
                        >
                            Home
                        </Link>

                        <Link
                            href="/cart"
                            className="block text-sm font-medium"
                        >
                            Keranjang
                        </Link>

                        {user && (
                            <Link
                                href="/pengajuan"
                                className="block text-sm font-medium"
                            >
                                Pengajuan
                            </Link>
                        )}

                    </div>

                </div>
            )}
        </header>
    );
}