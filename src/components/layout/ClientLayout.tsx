"use client";

import { usePathname } from "next/navigation";
import AppLayout from "./AppLayout";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Route TANPA Header/Footer
    const noLayoutPaths = [
        "/auth/login",
        "/auth/register",
    ];

    const isNoLayoutPath = noLayoutPaths.includes(pathname);

    if (isNoLayoutPath) {
        return <>{children}</>;
    }

    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}