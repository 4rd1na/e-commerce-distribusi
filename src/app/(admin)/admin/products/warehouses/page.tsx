"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Warehouse,
    MapPin,
    Loader2,
} from "lucide-react";

// ── Types ──
interface WarehouseItem {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
}

export default function WarehousesPage() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formName, setFormName] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<WarehouseItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch ──
    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("warehouses")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setWarehouses((data as WarehouseItem[]) || []);
        } catch (err) {
            console.error("Error fetching warehouses:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    // ── Submit Create/Update ──
    const handleSubmit = async () => {
        if (!formName.trim()) return;
        try {
            setSubmitting(true);

            if (editMode && editingId) {
                const { error } = await supabase
                    .from("warehouses")
                    .update({ name: formName.trim(), address: formAddress.trim() || null })
                    .eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("warehouses")
                    .insert({ name: formName.trim(), address: formAddress.trim() || null });
                if (error) throw error;
            }

            setFormOpen(false);
            setFormName("");
            setFormAddress("");
            setEditingId(null);
            await fetchWarehouses();
        } catch (err) {
            console.error("Error saving warehouse:", err);
            alert("Gagal menyimpan gudang. Coba lagi.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Dialog helpers ──
    const openCreate = () => {
        setEditMode(false);
        setFormName("");
        setFormAddress("");
        setEditingId(null);
        setFormOpen(true);
    };

    const openEdit = (wh: WarehouseItem) => {
        setEditMode(true);
        setFormName(wh.name);
        setFormAddress(wh.address || "");
        setEditingId(wh.id);
        setFormOpen(true);
    };

    const openDelete = (wh: WarehouseItem) => {
        setDeleteTarget(wh);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);

            // Cek apakah ada stock di gudang ini
            const { count } = await supabase
                .from("inventory_stocks")
                .select("id", { count: "exact", head: true })
                .eq("warehouse_id", deleteTarget.id);

            if (count && count > 0) {
                alert(`Tidak bisa menghapus gudang "${deleteTarget.name}" karena masih ada ${count} data stok di dalamnya.`);
                setDeleting(false);
                setDeleteOpen(false);
                return;
            }

            const { error } = await supabase
                .from("warehouses")
                .delete()
                .eq("id", deleteTarget.id);

            if (error) throw error;
            await fetchWarehouses();
        } catch (err) {
            console.error("Error deleting warehouse:", err);
            alert("Gagal menghapus gudang. Coba lagi.");
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    // ── Format ──
    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    // ── Render ──
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={() => router.push("/admin/products")}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kelola Gudang</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola lokasi gudang penyimpanan</p>
                </div>
            </div>

            {/* Tombol Tambah */}
            <Button
                size="sm"
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                onClick={openCreate}
            >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Gudang
            </Button>

            {/* Tabel */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : warehouses.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 border rounded-full flex items-center justify-center mx-auto mb-4">
                        <Warehouse className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">Belum Ada Gudang</h3>
                    <p className="text-sm text-slate-400 mt-1">Tambahkan gudang pertama untuk menyimpan stok.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-xs font-semibold text-slate-600">Nama Gudang</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600">Alamat</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Dibuat</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {warehouses.map((wh) => (
                                <TableRow key={wh.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                                <Warehouse className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-900">{wh.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="text-sm text-slate-600">{wh.address || "—"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <span className="text-xs text-slate-500">{formatDate(wh.created_at)}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg"
                                                onClick={() => openEdit(wh)}
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg"
                                                onClick={() => openDelete(wh)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {editMode ? "Edit Gudang" : "Tambah Gudang"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            {editMode ? "Ubah informasi gudang." : "Tambahkan gudang baru."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Nama Gudang</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Contoh: Gudang Utama Jakarta"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Alamat</label>
                            <textarea
                                value={formAddress}
                                onChange={(e) => setFormAddress(e.target.value)}
                                placeholder="Alamat lengkap gudang"
                                rows={3}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-10 rounded-xl text-sm"
                                onClick={() => setFormOpen(false)}
                                disabled={submitting}
                            >
                                Batal
                            </Button>
                            <Button
                                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold"
                                onClick={handleSubmit}
                                disabled={submitting || !formName.trim()}
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                                ) : editMode ? "Simpan Perubahan" : "Tambah Gudang"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Hapus Gudang?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {deleteTarget && (
                                <>
                                    Gudang <span className="font-semibold text-slate-700">{deleteTarget.name}</span> akan dihapus permanen.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-2">
                        <AlertDialogCancel disabled={deleting} className="text-xs font-semibold h-9 rounded-xl flex-1 sm:flex-none">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-xs font-semibold h-9 rounded-xl text-white bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
                        >
                            {deleting ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
