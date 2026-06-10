"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, ShoppingBag, Users, ShoppingCart, Receipt, Headphones, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    role: "admin" | "support" | "billing";
}

// Konfigurasi per role
const roleConfig = {
    admin: {
        label: "Administrator",
        accent: "emerald",
        accentBg: "bg-emerald-600",
        accentBgLight: "bg-emerald-500/10",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500/30",
        accentShadow: "shadow-emerald-600/20",
    },
    support: {
        label: "Support",
        accent: "blue",
        accentBg: "bg-blue-600",
        accentBgLight: "bg-blue-500/10",
        accentText: "text-blue-400",
        accentBorder: "border-blue-500/30",
        accentShadow: "shadow-blue-600/20",
    },
    billing: {
        label: "Billing",
        accent: "violet",
        accentBg: "bg-violet-600",
        accentBgLight: "bg-violet-500/10",
        accentText: "text-violet-400",
        accentBorder: "border-violet-500/30",
        accentShadow: "shadow-violet-600/20",
    },
};

// Menu yang tersedia per role
const menuByRole: Record<string, { name: string; href: string; icon: any }[]> = {
    admin: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Products", href: "/admin/products", icon: ShoppingBag },
        { name: "Pengajuan Kemitraan", href: "/admin/partner-requests", icon: Users },
    ],
    support: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Pesanan", href: "/admin", icon: ShoppingCart },
    ],
    billing: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Pembayaran", href: "/admin", icon: CreditCard },
    ],
};

export default function AdminSidebar({ isOpen, onClose, role }: AdminSidebarProps) {
    const pathname = usePathname();
    const config = roleConfig[role];
    const menus = menuByRole[role] || menuByRole.admin;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 bottom-0 left-0 w-64 z-50
                bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
                flex flex-col
                transition-transform duration-300 md:static md:translate-x-0
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                {/* ── Brand ── */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${config.accentBg} rounded-lg flex items-center justify-center shadow-lg ${config.accentShadow}`}>
                            <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-white tracking-tight block leading-none">
                                DinaMart
                            </span>
                            <span className={`text-[10px] ${config.accentText} font-semibold uppercase tracking-widest`}>
                                {config.label}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="md:hidden text-slate-500 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* ── Menu Section ── */}
                <div className="px-4 pt-6 pb-2">
                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em] px-3">
                        Menu
                    </span>
                </div>

                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                    {menus.map((menu) => {
                        const Icon = menu.icon;
                        const isActive = menu.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(menu.href);

                        return (
                            <Link
                                key={menu.href}
                                href={menu.href}
                                onClick={onClose}
                                className={`
                                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                                    ${isActive
                                        ? `bg-white/10 text-white`
                                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                    }
                                `}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <div className={`absolute left-0 w-[3px] h-6 ${config.accentBg} rounded-r-full`} />
                                )}
                                <Icon className={`w-[18px] h-[18px] ${isActive ? config.accentText : "text-slate-600 group-hover:text-slate-400"}`} />
                                <span>{menu.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Bottom ── */}
                <div className="p-3 border-t border-white/5">
                    <div className={`px-3 py-2.5 rounded-xl ${config.accentBgLight} ${config.accentBorder} border`}>
                        <p className={`text-[10px] ${config.accentText} font-semibold uppercase tracking-wider`}>
                            {config.label} Panel v1.0
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                            DinaMart Internal
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
