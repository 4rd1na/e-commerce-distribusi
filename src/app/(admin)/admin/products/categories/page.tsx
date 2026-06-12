"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Tag,
    Loader2,
} from "lucide-react";

// ── Types ──
interface Category {
    id: string;
    name: string;
    slug: string | null;
    created_at: string;
    _count?: number; // jumlah produk di kategori ini
}

function generateSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch ──
    const fetchCategories = async () => {
        try {
            setLoading(true);

            // Fetch kategori
            const { data, error } = await supabase
                .from("product_categories")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setCategories((data as Category[]) || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // ── Auto-generate slug dari nama ──
    const handleNameChange = (name: string) => {
        setFormName(name);
        if (!editMode) {
            setFormSlug(generateSlug(name));
        }
    };

    // ── Submit Create/Update ──
    const handleSubmit = async () => {
        if (!formName.trim()) return;
        try {
            setSubmitting(true);

            const slug = formSlug.trim() || generateSlug(formName);

            if (editMode && editingId) {
                const { error } = await supabase
                    .from("product_categories")
                    .update({ name: formName.trim(), slug })
                    .eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("product_categories")
                    .insert({ name: formName.trim(), slug });
                if (error) throw error;
            }

            setFormOpen(false);
            setFormName("");
            setFormSlug("");
            setEditingId(null);
            await fetchCategories();
        } catch (err: unknown) {
            console.error("Error saving category:", err);
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("unique") || msg.includes("duplicate")) {
                alert("Nama atau slug kategori sudah ada.");
            } else {
                alert("Gagal menyimpan kategori. Coba lagi.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Open create dialog ──
    const openCreate = () => {
        setEditMode(false);
        setFormName("");
        setFormSlug("");
        setEditingId(null);
        setFormOpen(true);
    };

    // ── Open edit dialog ──
    const openEdit = (cat: Category) => {
        setEditMode(true);
        setFormName(cat.name);
        setFormSlug(cat.slug || "");
        setEditingId(cat.id);
        setFormOpen(true);
    };

    // ── Delete ──
    const openDelete = async (cat: Category) => {
        setDeleteTarget(cat);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);

            // Cek apakah ada produk di kategori ini
            const { count } = await supabase
                .from("products")
                .select("id", { count: "exact", head: true })
                .eq("category_id", deleteTarget.id);

            if (count && count > 0) {
                alert(`Tidak bisa menghapus kategori "${deleteTarget.name}" karena masih ada ${count} produk di dalamnya.`);
                setDeleting(false);
                setDeleteOpen(false);
                return;
            }

            const { error } = await supabase
                .from("product_categories")
                .delete()
                .eq("id", deleteTarget.id);

            if (error) throw error;
            await fetchCategories();
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("Gagal menghapus kategori. Coba lagi.");
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
                    <h1 className="text-2xl font-bold text-slate-900">Kelola Kategori</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola kategori produk</p>
                </div>
            </div>

            {/* Tombol Tambah */}
            <Button
                size="sm"
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                onClick={openCreate}
            >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Kategori
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
            ) : categories.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 border rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">Belum Ada Kategori</h3>
                    <p className="text-sm text-slate-400 mt-1">Tambahkan kategori pertama untuk produk.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-xs font-semibold text-slate-600">Nama Kategori</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600">Slug</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Dibuat</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((cat) => (
                                <TableRow key={cat.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                <Tag className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-900">{cat.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs font-normal">{cat.slug || "—"}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <span className="text-xs text-slate-500">{formatDate(cat.created_at)}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg"
                                                onClick={() => openEdit(cat)}
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg"
                                                onClick={() => openDelete(cat)}
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

            {/* Form Dialog (Create/Edit) */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {editMode ? "Edit Kategori" : "Tambah Kategori"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            {editMode ? "Ubah nama atau slug kategori." : "Buat kategori baru untuk produk."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Nama Kategori</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Contoh: Makanan Ringan"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Slug</label>
                            <input
                                type="text"
                                value={formSlug}
                                onChange={(e) => setFormSlug(e.target.value)}
                                placeholder="makanan-ringan"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                                ) : editMode ? "Simpan Perubahan" : "Tambah Kategori"}
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
                            Hapus Kategori?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {deleteTarget && (
                                <>
                                    Kategori <span className="font-semibold text-slate-700">{deleteTarget.name}</span> akan dihapus permanen.
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
