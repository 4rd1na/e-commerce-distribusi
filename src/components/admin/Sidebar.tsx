"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {

    const pathname = usePathname();

    const menus = [
        {
            name: "Dashboard",
            href: "/admin",
        },
        {
            name: "Products",
            href: "/admin/products",
        },
        {
            name: "Orders",
            href: "/admin/orders",
        },
        {
            name: "Users",
            href: "/admin/users",
        },
        {
            name: "Partner Requests",
            href: "/admin/partner-requests",
        },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">

            <div className="h-16 flex items-center px-6 border-b font-black text-xl">
                DinaMart Admin
            </div>

            <nav className="flex-1 p-4 space-y-2">

                {menus.map((menu) => (

                    <Link
                        key={menu.href}
                        href={menu.href}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition
                            
                            ${pathname === menu.href
                                ? "bg-emerald-600 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }
                        `}
                    >
                        {menu.name}
                    </Link>

                ))}

            </nav>
        </aside>
    );
}