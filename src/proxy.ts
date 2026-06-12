import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route auth — redirect ke home jika sudah login
const AUTH_ROUTES = ["/login", "/register"];

// Route user yang WAJIB login (bukan admin)
const PROTECTED_USER_ROUTES = [
    "/profile",
    "/orders",
    "/carts",
    "/addresses",
    "/kemitraan",
];

export default async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // ── 1. Sudah login → redirect dari halaman auth ──
    if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // ── 2. Route Admin: /admin/* ──
    if (pathname.startsWith("/admin")) {
        if (!user) {
            // Token mungkin sedang di-refresh, return response dengan cookies baru
            // Browser akan simpan cookie baru, lalu request berikutnya akan punya session valid
            return supabaseResponse;
        }

        // Cek role — gunakan response yang sudah punya refreshed cookies
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, internal_role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "internal") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        return supabaseResponse;
    }

    // ── 3. Admin sudah login → blokir akses route public/user ──
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, internal_role")
            .eq("id", user.id)
            .single();

        if (profile?.role === "internal") {
            if (!pathname.startsWith("/admin")) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return supabaseResponse;
        }
    }

    // ── 4. Route User yang dilindungi ──
    const isProtectedUserRoute = PROTECTED_USER_ROUTES.some((p) =>
        pathname.startsWith(p)
    );

    if (isProtectedUserRoute && !user) {
        return supabaseResponse;
    }

    // Kirim pathname ke header
    supabaseResponse.headers.set("x-pathname", pathname);

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
