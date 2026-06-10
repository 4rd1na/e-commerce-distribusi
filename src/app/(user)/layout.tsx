import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Route yang TIDAK menampilkan Footer
const HIDE_FOOTER_ROUTES = ["/carts"];

// Route user yang WAJIB login
const PROTECTED_USER_ROUTES = [
    "/",
    "/profile",
    "/orders",
    "/carts",
    "/addresses",
    "/kemitraan",
];

export default async function CustomerGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isProtectedRoute = PROTECTED_USER_ROUTES.some((p) =>
        pathname.startsWith(p)
    );

    if (isProtectedRoute) {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Belum login → redirect ke login
        if (!user) {
            redirect("/auth/login");
        }

        // Cek apakah admin mencoba akses route user
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, internal_role")
            .eq("id", user.id)
            .single();

        if (
            profile?.role === "internal" &&
            profile?.internal_role === "admin"
        ) {
            redirect("/admin");
        }
    }

    const hideFooter = HIDE_FOOTER_ROUTES.some((p) =>
        pathname.startsWith(p)
    );

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1">{children}</main>
            {!hideFooter && <Footer />}
        </div>
    );
}
