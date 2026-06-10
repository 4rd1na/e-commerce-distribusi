import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "@/components/admin/AdminLayoutWrapper";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Ambil role user
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, internal_role, full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

    // Hanya user internal yang boleh masuk
    if (profile?.role !== "internal") {
        redirect("/");
    }

    const internalRole = (profile?.internal_role || "admin") as "admin" | "support" | "billing";

    return (
        <AdminLayoutClient
            role={internalRole}
            userName={profile?.full_name || "User"}
            userEmail={profile?.email || ""}
            userAvatar={profile?.avatar_url || null}
        >
            {children}
        </AdminLayoutClient>
    );
}
