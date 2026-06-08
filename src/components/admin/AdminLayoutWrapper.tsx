"use client";

import { useState } from "react";
import AdminSidebar from "./Sidebar";
import AdminHeader from "./Header";
import AdminFooter from "./Footer";

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-slate-100 overflow-x-hidden">
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}