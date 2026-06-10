interface AdminFooterProps {
    role: "admin" | "support" | "billing";
}

const roleFooterLabel = {
    admin: "Administrator",
    support: "Support",
    billing: "Billing",
};

export default function AdminFooter({ role }: AdminFooterProps) {
    return (
        <footer className="h-11 border-t border-slate-100 bg-white flex items-center justify-between px-4 md:px-6 text-[11px] text-slate-400 shrink-0">
            <span>© {new Date().getFullYear()} DinaMart</span>
            <span className="hidden sm:inline">
                {roleFooterLabel[role]} Panel v1.0
            </span>
        </footer>
    );
}
