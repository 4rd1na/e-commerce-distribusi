"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, Shield, Headphones, CreditCard, User as UserIcon, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    role: "admin" | "support" | "billing";
    userName: string;
    userEmail: string;
    userAvatar: string | null;
}

const roleHeaderConfig = {
    admin: {
        label: "Administrator",
        icon: Shield,
        dotColor: "bg-emerald-500",
        badgeBg: "bg-emerald-50 text-emerald-700",
    },
    support: {
        label: "Support",
        icon: Headphones,
        dotColor: "bg-blue-500",
        badgeBg: "bg-blue-50 text-blue-700",
    },
    billing: {
        label: "Billing",
        icon: CreditCard,
        dotColor: "bg-violet-500",
        badgeBg: "bg-violet-50 text-violet-700",
    },
};

export default function AdminHeader({ onToggleSidebar, role, userName, userEmail, userAvatar }: AdminHeaderProps) {
    const router = useRouter();
    const config = roleHeaderConfig[role];
    const Icon = config.icon;

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            localStorage.clear();
            router.refresh();
            router.replace("/login");
        } catch (error) {
            console.error("Gagal Logout:", error);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 z-20 shrink-0">
            <div className="flex items-center gap-3">
                {/* Hamburger — Mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="md:hidden text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                {/* Role badge */}
                <div className="flex items-center gap-2.5">
                    <div className={`hidden md:flex w-7 h-7 rounded-lg items-center justify-center ${config.badgeBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-slate-800">{config.label}</span>
                        <span className="hidden sm:inline text-xs text-slate-400 ml-2">Panel</span>
                    </div>
                </div>
            </div>

            {/* Right — Profile Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userAvatar || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-500">
                                <UserIcon className="w-4 h-4" />
                            </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-slate-200 p-1">
                    <div className="px-3 py-2.5 mb-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem className="rounded-lg text-xs gap-2 px-3 py-2 text-slate-500">
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                        <span className="capitalize">{role}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-lg text-sm gap-2.5 px-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
