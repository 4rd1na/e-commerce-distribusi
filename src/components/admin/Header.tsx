"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
    onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            localStorage.clear();
            router.refresh();
            router.replace("/auth/login");
        } catch (error) {
            console.error("Gagal Logout Admin:", error);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-20">
            <div className="flex items-center gap-3">
                {/* Tombol Hamburger - Muncul hanya di Mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="md:hidden text-slate-600 hover:bg-slate-100"
                >
                    <Menu className="w-6 h-6" />
                </Button>

                <h1 className="font-bold text-slate-900 text-sm md:text-base">Admin Panel</h1>
            </div>

            {/* Tombol Logout Admin */}
            <div>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl gap-2 text-xs md:text-sm font-semibold px-3 py-2"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
}