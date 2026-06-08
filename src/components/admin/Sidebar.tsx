"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const menus = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            name: "Products",
            href: "/admin/products",
            icon: ShoppingBag,
        },
    ];

    return (
        <>
            {/* Backdrop Gelap saat Sidebar Mobile Terbuka */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 
                flex flex-col transition-transform duration-300 md:static md:translate-x-0
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b font-black text-xl text-slate-900">
                    <span>DinaMart Admin</span>
                    {/* Tombol Close - Hanya muncul di Mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="md:hidden text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menus.map((menu) => {
                        const Icon = menu.icon;
                        const isActive = pathname === menu.href;

                        return (
                            <Link
                                key={menu.href}
                                href={menu.href}
                                onClick={onClose} // Menutup sidebar otomatis saat link diklik (di mobile)
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                                    ${isActive
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                                        : "text-slate-700 hover:bg-slate-100"
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {menu.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}