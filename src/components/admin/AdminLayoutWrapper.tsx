"use client";

import { useState } from "react";
import AdminSidebar from "./Sidebar";
import AdminHeader from "./Header";
import AdminFooter from "./Footer";

export default function AdminLayoutClient({
    children,
    role,
    userName,
    userEmail,
    userAvatar,
}: {
    children: React.ReactNode;
    role: "admin" | "support" | "billing";
    userName: string;
    userEmail: string;
    userAvatar: string | null;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-slate-50 overflow-x-hidden">
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                role={role}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    role={role}
                    userName={userName}
                    userEmail={userEmail}
                    userAvatar={userAvatar}
                />
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
                <AdminFooter role={role} />
            </div>
        </div>
    );
}
