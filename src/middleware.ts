import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route yang bisa diakses tanpa login
const PUBLIC_ROUTES = ["/", "/products"];

// Route auth — redirect ke home jika sudah login
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

// Route user yang WAJIB login (bukan admin)
const PROTECTED_USER_ROUTES = [
    "/profile",
    "/orders",
    "/carts",
    "/addresses",
    "/kemitraan",
];

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

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
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Ambil user saat ini
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
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Cek role admin dari tabel profiles
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, internal_role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "internal" || profile?.internal_role !== "admin") {
            // Bukan admin → tendang ke homepage
            return NextResponse.redirect(new URL("/", request.url));
        }

        return response;
    }

    // ── 3. Route User yang dilindungi ──
    const isProtectedUserRoute = PROTECTED_USER_ROUTES.some((p) =>
        pathname.startsWith(p)
    );

    if (isProtectedUserRoute) {
        if (!user) {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Cek apakah admin mencoba akses route user
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, internal_role")
            .eq("id", user.id)
            .single();

        if (profile?.role === "internal" && profile?.internal_role === "admin") {
            // Admin → tendang ke panel admin
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    // Kirim pathname ke header supaya layout/server component bisa baca
    response.headers.set("x-pathname", pathname);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match semua request kecuali:
         * - _next/static (file statis)
         * - _next/image (optimasi gambar)
         * - favicon.ico
         * - file public (svg, png, jpg, jpeg, gif, webp)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
