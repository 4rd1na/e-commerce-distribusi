import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";
import AdminFooter from "@/components/admin/Footer";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("USER LOGIN:", user);
    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    console.log("PROFILE:", profile);
    if (profile?.role !== "internal") {
        redirect("/");
    }

    return (
        <div className="min-h-screen flex bg-slate-100">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
                <AdminHeader />
                <main className="flex-1 p-6">
                    {children}
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}