import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const accessToken = request.cookies.get("sb-access-token");

    const isAuthPage =
        request.nextUrl.pathname.startsWith("/auth");

    const isAdminPage =
        request.nextUrl.pathname.startsWith("/admin");

    if (!accessToken && !isAuthPage) {
        return NextResponse.redirect(
            new URL("/auth/login", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/profil/:path*",
        "/pesanan/:path*",
        "/checkout/:path*",
        "/admin/:path*",
    ],
};