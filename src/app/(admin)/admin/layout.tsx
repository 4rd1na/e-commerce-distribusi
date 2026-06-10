import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "@/components/admin/AdminLayoutWrapper";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Panggil server client
    const supabase = await createClient();

    // Ambil data user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Cek Role di Server
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, internal_role")
        .eq("id", user.id)
        .single();

    // Jika bukan internal atau bukan admin, tendang ke homepage
    if (profile?.role !== "internal" || profile?.internal_role !== "admin") {
        redirect("/");
    }

    // Alirkan anak komponen ke Client Wrapper untuk manajemen state UI responsif
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}