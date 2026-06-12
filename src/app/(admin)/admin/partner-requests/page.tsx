"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Eye,
    Users,
    Building2,
    CalendarDays,
    MessageSquare,
    ArrowUpRight,
    Trash2,
    Ban,
    ChevronLeft,
    ChevronRight,
    FileCheck,
    FileX,
    PauseCircle,
} from "lucide-react";

// ── Type ──
// Supabase mengembalikan profiles sebagai array dari join,
// jadi kita buat type raw dulu lalu normalize
interface RawPartnerRequest {
    id: string;
    user_id: string;
    requested_level: string;
    company_name: string | null;
    notes: string | null;
    attachment_url: string | null;
    status: "pending" | "approved" | "rejected" | "dinonaktifkan";
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        level: string;
    }[]; // ← array dari Supabase join
}

interface PartnerRequest {
    id: string;
    user_id: string;
    requested_level: string;
    company_name: string | null;
    notes: string | null;
    attachment_url: string | null;
    status: "pending" | "approved" | "rejected" | "dinonaktifkan";
    created_at: string;
    profile: {
        full_name: string;
        email: string;
        level: string;
    } | null;
}

type FilterTab = "all" | "pending" | "approved" | "rejected" | "dinonaktifkan";

// ── Label helper ──
const levelLabels: Record<string, string> = {
    reseller: "Reseller",
    sub_agen: "Sub Agen",
    agen: "Agen",
    distributor: "Distributor",
    konsumen: "Konsumen",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
    pending: {
        label: "Pending",
        icon: <Clock className="w-3.5 h-3.5" />,
        badgeClass: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    },
    approved: {
        label: "Disetujui",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    },
    rejected: {
        label: "Ditolak",
        icon: <XCircle className="w-3.5 h-3.5" />,
        badgeClass: "bg-red-100 text-red-600 hover:bg-red-100",
    },
    dinonaktifkan: {
        label: "Dinonaktifkan",
        icon: <Ban className="w-3.5 h-3.5" />,
        badgeClass: "bg-slate-200 text-slate-600 hover:bg-slate-200",
    },
};

// ── Normalize data dari Supabase ──
// Supabase join mengembalikan profiles sebagai array,
// kita ambil elemen pertama saja
function normalize(raw: RawPartnerRequest[]): PartnerRequest[] {
    return raw.map((r) => ({
        ...r,
        profile: r.profiles?.[0] || null,
    }));
}

export default function PartnerRequestsPage() {
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Confirm dialog state (approve/reject)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
    const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
    const [processing, setProcessing] = useState(false);

    // Detail dialog state
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailRequest, setDetailRequest] = useState<PartnerRequest | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PartnerRequest | null>(null);

    // Deactivate dialog state
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState<PartnerRequest | null>(null);

    // ── Fetch data ──
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("partner_requests")
                .select(`
                    id,
                    user_id,
                    requested_level,
                    company_name,
                    notes,
                    attachment_url,
                    status,
                    created_at,
                    profiles (
                        full_name,
                        email,
                        level
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            // Normalize: profiles array → profile object
            setRequests(normalize((data as RawPartnerRequest[]) || []));
        } catch (err) {
            console.error("Error fetching partner requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Reset page saat tab berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // ── Filter data ──
    const filtered = activeTab === "all"
        ? requests
        : requests.filter((r) => r.status === activeTab);

    const counts = {
        all: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
        dinonaktifkan: requests.filter((r) => r.status === "dinonaktifkan").length,
    };

    // ── Pagination ──
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedData = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ── Handle Approve ──
    const handleApprove = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(true);

            // 1. Update status partner_request → approved
            const { error: updateStatusError } = await supabase
                .from("partner_requests")
                .update({ status: "approved" })
                .eq("id", selectedRequest.id);

            if (updateStatusError) throw updateStatusError;

            // 2. Update level user di profiles sesuai requested_level
            const { error: updateProfileError } = await supabase
                .from("profiles")
                .update({ level: selectedRequest.requested_level })
                .eq("id", selectedRequest.user_id);

            if (updateProfileError) throw updateProfileError;

            await fetchRequests();
        } catch (err) {
            console.error("Error approving request:", err);
            alert("Gagal menyetujui pengajuan. Coba lagi.");
        } finally {
            setProcessing(false);
            setDialogOpen(false);
            setSelectedRequest(null);
        }
    };

    // ── Handle Reject ──
    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(true);

            const { error } = await supabase
                .from("partner_requests")
                .update({ status: "rejected" })
                .eq("id", selectedRequest.id);

            if (error) throw error;

            await fetchRequests();
        } catch (err) {
            console.error("Error rejecting request:", err);
            alert("Gagal menolak pengajuan. Coba lagi.");
        } finally {
            setProcessing(false);
            setDialogOpen(false);
            setSelectedRequest(null);
        }
    };

    // ── Handle Delete ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setProcessing(true);
            const { error } = await supabase
                .from("partner_requests")
                .delete()
                .eq("id", deleteTarget.id);
            if (error) throw error;
            await fetchRequests();
        } catch (err) {
            console.error("Error deleting request:", err);
            alert("Gagal menghapus pengajuan. Coba lagi.");
        } finally {
            setProcessing(false);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    // ── Handle Deactivate (Nonaktifkan) ──
    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        try {
            setProcessing(true);

            // 1. Update status partner_request → dinonaktifkan
            const { error: updateStatusError } = await supabase
                .from("partner_requests")
                .update({ status: "dinonaktifkan" })
                .eq("id", deactivateTarget.id);
            if (updateStatusError) throw updateStatusError;

            // 2. Revert user level ke konsumen
            const { error: updateProfileError } = await supabase
                .from("profiles")
                .update({ level: "konsumen" })
                .eq("id", deactivateTarget.user_id);
            if (updateProfileError) throw updateProfileError;

            await fetchRequests();
        } catch (err) {
            console.error("Error deactivating partner:", err);
            alert("Gagal menonaktifkan mitra. Coba lagi.");
        } finally {
            setProcessing(false);
            setDeactivateDialogOpen(false);
            setDeactivateTarget(null);
        }
    };

    // ── Open confirm dialogs ──
    const openConfirm = (action: "approve" | "reject", request: PartnerRequest) => {
        setDialogAction(action);
        setSelectedRequest(request);
        setDialogOpen(true);
    };

    // ── Open detail dialog ──
    const openDetail = (request: PartnerRequest) => {
        setDetailRequest(request);
        setDetailOpen(true);
    };

    const openDeleteConfirm = (request: PartnerRequest) => {
        setDeleteTarget(request);
        setDeleteDialogOpen(true);
    };

    const openDeactivateConfirm = (request: PartnerRequest) => {
        setDeactivateTarget(request);
        setDeactivateDialogOpen(true);
    };

    // ── Format date ──
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // ── Cek apakah attachment adalah gambar ──
    const isImageUrl = (url: string | null) => {
        if (!url) return false;
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    };

    // ── Tabs ──
    const tabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: "Semua" },
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Disetujui" },
        { key: "rejected", label: "Ditolak" },
        { key: "dinonaktifkan", label: "Dinonaktifkan" },
    ];

    // ── Render ──
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Pengajuan Kemitraan
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kelola permintaan upgrade level dari user
                </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Total Pengajuan */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Total Pengajuan</p>
                        <p className="text-xl font-bold text-slate-900">{counts.all}</p>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Pending</p>
                        <p className="text-xl font-bold text-yellow-700">{counts.pending}</p>
                    </div>
                </div>

                {/* Disetujui (Aktif) */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        < p className="text-[11px] text-slate-400">Disetujui</p>
                        <p className="text-xl font-bold text-emerald-700">{counts.approved}</p>
                    </div>
                </div>

                {/* Ditolak */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <FileX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Ditolak</p>
                        <p className="text-xl font-bold text-red-600">{counts.rejected}</p>
                    </div>
                </div>

                {/* Dinonaktifkan */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <PauseCircle className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Dinonaktifkan</p>
                        <p className="text-xl font-bold text-slate-600">{counts.dinonaktifkan}</p>
                    </div>
                </div>
            </div>

            {/* Tab Filter */}
            <div className="flex gap-2 border-b border-slate-200 pb-0 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                            px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition
                            ${activeTab === tab.key
                                ? "border-emerald-600 text-emerald-700"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            }
                        `}
                    >
                        {tab.label}
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.key
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                        }`}>
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 border rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">Belum Ada Pengajuan</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {activeTab === "all"
                            ? "Belum ada user yang mengajukan kemitraan."
                            : `Tidak ada pengajuan dengan status "${statusConfig[activeTab]?.label}".`
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold text-slate-600">Pemohon</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Level Saat Ini</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Level Diajukan</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Perusahaan</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Tanggal</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((req) => {
                                    const status = statusConfig[req.status];
                                    return (
                                        <TableRow key={req.id} className="hover:bg-slate-50/50">
                                            {/* Pemohon */}
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {req.profile?.full_name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {req.profile?.email || ""}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Level Saat Ini */}
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {levelLabels[req.profile?.level || "konsumen"]}
                                                </Badge>
                                            </TableCell>

                                            {/* Level Diajukan */}
                                            <TableCell>
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                                                    {levelLabels[req.requested_level] || req.requested_level}
                                                </Badge>
                                            </TableCell>

                                            {/* Perusahaan */}
                                            <TableCell className="hidden md:table-cell">
                                                <span className="text-sm text-slate-600">
                                                    {req.company_name || "—"}
                                                </span>
                                            </TableCell>

                                            {/* Tanggal */}
                                            <TableCell className="hidden sm:table-cell">
                                                <span className="text-xs text-slate-500">
                                                    {formatDate(req.created_at)}
                                                </span>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <Badge
                                                    className={`${status.badgeClass} text-xs flex items-center gap-1 w-fit`}
                                                >
                                                    {status.icon}
                                                    {status.label}
                                                </Badge>
                                            </TableCell>

                                            {/* Aksi */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Tombol Detail — selalu muncul */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs text-slate-600 hover:text-slate-900 rounded-lg"
                                                        onClick={() => openDetail(req)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" />
                                                        Detail
                                                    </Button>

                                                    {/* Approve / Reject — hanya jika pending */}
                                                    {req.status === "pending" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                                                                onClick={() => openConfirm("approve", req)}
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                                                                onClick={() => openConfirm("reject", req)}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Nonaktifkan — hanya jika approved */}
                                                    {req.status === "approved" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs text-slate-600 border-slate-300 hover:bg-slate-100 rounded-lg"
                                                            onClick={() => openDeactivateConfirm(req)}
                                                        >
                                                            <Ban className="w-3.5 h-3.5 mr-1" />
                                                            Nonaktifkan
                                                        </Button>
                                                    )}

                                                    {/* Hapus — semua status */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                        onClick={() => openDeleteConfirm(req)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} pengajuan
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        className={`h-8 w-8 p-0 rounded-lg text-xs ${
                                            page === currentPage
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "text-slate-600"
                                        }`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Detail Dialog ── */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="rounded-2xl max-w-[92%] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    {detailRequest && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-slate-900">
                                    Detail Pengajuan Kemitraan
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500">
                                    Informasi lengkap pengajuan dari user
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-2">
                                {/* Status Badge */}
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const s = statusConfig[detailRequest.status];
                                        return (
                                            <Badge className={`${s.badgeClass} text-xs flex items-center gap-1`}>
                                                {s.icon}
                                                {s.label}
                                            </Badge>
                                        );
                                    })()}
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Nama */}
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[11px] text-slate-400 mb-0.5">Nama Pemohon</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {detailRequest.profile?.full_name || "Unknown"}
                                        </p>
                                    </div>

                                    {/* Email */}
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[11px] text-slate-400 mb-0.5">Email</p>
                                        <p className="text-sm text-slate-700 break-all">
                                            {detailRequest.profile?.email || "-"}
                                        </p>
                                    </div>

                                    {/* Level Saat Ini */}
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[11px] text-slate-400 mb-0.5">Level Saat Ini</p>
                                        <Badge variant="outline" className="text-xs mt-0.5">
                                            {levelLabels[detailRequest.profile?.level || "konsumen"]}
                                        </Badge>
                                    </div>

                                    {/* Level Diajukan */}
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <p className="text-[11px] text-emerald-500 mb-0.5">Level Diajukan</p>
                                        <div className="flex items-center gap-1.5">
                                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                                                {levelLabels[detailRequest.requested_level]}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Perusahaan */}
                                    <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2">
                                        <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 mb-0.5">Perusahaan / Toko</p>
                                            <p className="text-sm text-slate-700">
                                                {detailRequest.company_name || "Tidak disertakan"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tanggal Pengajuan */}
                                    <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2">
                                        <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 mb-0.5">Tanggal Pengajuan</p>
                                            <p className="text-sm text-slate-700">
                                                {formatDate(detailRequest.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Catatan */}
                                {detailRequest.notes && (
                                    <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 mb-0.5">Catatan Pendukung</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                {detailRequest.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Bukti / Attachment */}
                                {detailRequest.attachment_url && (
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            Berkas Pendukung
                                        </p>
                                        {isImageUrl(detailRequest.attachment_url) ? (
                                            <a
                                                href={detailRequest.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={detailRequest.attachment_url}
                                                    alt="Bukti pendukung"
                                                    className="w-full max-h-64 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition cursor-pointer"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 text-center">
                                                    Klik gambar untuk membuka ukuran penuh
                                                </p>
                                            </a>
                                        ) : (
                                            <a
                                                href={detailRequest.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                <FileText className="w-4 h-4 text-emerald-600" />
                                                Lihat / Download Berkas
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons di Detail */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                    {/* Approve — hanya jika pending */}
                                    {detailRequest.status === "pending" && (
                                        <Button
                                            className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold"
                                            onClick={() => {
                                                setDetailOpen(false);
                                                openConfirm("approve", detailRequest);
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Setujui
                                        </Button>
                                    )}

                                    {/* Reject — hanya jika pending */}
                                    {detailRequest.status === "pending" && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50 rounded-xl text-sm font-semibold"
                                            onClick={() => {
                                                setDetailOpen(false);
                                                openConfirm("reject", detailRequest);
                                            }}
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Tolak
                                        </Button>
                                    )}

                                    {/* Nonaktifkan — hanya jika approved */}
                                    {detailRequest.status === "approved" && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 text-slate-600 border-slate-300 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                                            onClick={() => {
                                                setDetailOpen(false);
                                                openDeactivateConfirm(detailRequest);
                                            }}
                                        >
                                            <Ban className="w-4 h-4 mr-1.5" />
                                            Nonaktifkan
                                        </Button>
                                    )}

                                    {/* Hapus — semua status */}
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-10 text-red-500 border-red-200 hover:bg-red-50 rounded-xl text-sm font-semibold"
                                        onClick={() => {
                                            setDetailOpen(false);
                                            openDeleteConfirm(detailRequest);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Confirm Dialog (Approve/Reject) ── */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            {dialogAction === "approve"
                                ? "Setujui Pengajuan Kemitraan?"
                                : "Tolak Pengajuan Kemitraan?"
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {selectedRequest && (
                                <>
                                    <span className="font-semibold text-slate-700">
                                        {selectedRequest.profile?.full_name}
                                    </span>
                                    {" "}mengajukan level{" "}
                                    <span className="font-semibold text-emerald-600">
                                        {levelLabels[selectedRequest.requested_level]}
                                    </span>

                                    {dialogAction === "approve" ? (
                                        <>. Level user akan langsung diubah dari{" "}
                                            <span className="font-semibold">{levelLabels[selectedRequest.profile?.level || "konsumen"]}</span>
                                            {" "}menjadi{" "}
                                            <span className="font-semibold text-emerald-600">{levelLabels[selectedRequest.requested_level]}</span>.
                                        </>
                                    ) : (
                                        <>. User bisa mengajukan kembali nanti.</>
                                    )}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-2">
                        <AlertDialogCancel
                            disabled={processing}
                            className="text-xs font-semibold h-9 rounded-xl border-slate-200 text-slate-600 mt-0 flex-1 sm:flex-none"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={dialogAction === "approve" ? handleApprove : handleReject}
                            disabled={processing}
                            className={`text-xs font-semibold h-9 rounded-xl text-white flex-1 sm:flex-none ${
                                dialogAction === "approve"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {processing
                                ? "Memproses..."
                                : dialogAction === "approve"
                                    ? "Ya, Setujui"
                                    : "Ya, Tolak"
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Delete Confirm Dialog ── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Hapus Pengajuan Kemitraan?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {deleteTarget && (
                                <>
                                    Pengajuan dari{" "}
                                    <span className="font-semibold text-slate-700">
                                        {deleteTarget.profile?.full_name}
                                    </span>{" "}
                                    akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-2">
                        <AlertDialogCancel
                            disabled={processing}
                            className="text-xs font-semibold h-9 rounded-xl border-slate-200 text-slate-600 mt-0 flex-1 sm:flex-none"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="text-xs font-semibold h-9 rounded-xl text-white bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
                        >
                            {processing ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Deactivate Confirm Dialog ── */}
            <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Nonaktifkan Kemitraan?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {deactivateTarget && (
                                <>
                                    Kemitraan{" "}
                                    <span className="font-semibold text-slate-700">
                                        {deactivateTarget.profile?.full_name}
                                    </span>{" "}
                                    akan dinonaktifkan. Level user akan dikembalikan menjadi{" "}
                                    <span className="font-semibold text-slate-600">Konsumen</span>.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-2">
                        <AlertDialogCancel
                            disabled={processing}
                            className="text-xs font-semibold h-9 rounded-xl border-slate-200 text-slate-600 mt-0 flex-1 sm:flex-none"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeactivate}
                            disabled={processing}
                            className="text-xs font-semibold h-9 rounded-xl text-white bg-slate-600 hover:bg-slate-700 flex-1 sm:flex-none"
                        >
                            {processing ? "Memproses..." : "Ya, Nonaktifkan"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
