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
    ShoppingBag,
    Tag,
    Warehouse,
    Package,
    Plus,
    Search,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// ── Types ──
interface ProductRow {
    id: string;
    name: string;
    slug: string | null;
    type: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    category_id: string | null;
    created_at: string;
    product_categories: { name: string }[] | null;
    product_variants: { id: string; base_price: number }[];
}

type FilterTab = "all" | "active" | "inactive";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Dashboard stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalWarehouses: 0,
        totalStock: 0,
    });

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
    const [processing, setProcessing] = useState(false);

    // ── Fetch ──
    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch products with category + variants
            const { data: productsData, error: pError } = await supabase
                .from("products")
                .select(`
                    id, name, slug, type, description, image_url, is_active,
                    category_id, created_at,
                    product_categories (name),
                    product_variants (id, base_price)
                `)
                .order("created_at", { ascending: false });

            if (pError) throw pError;
            setProducts((productsData as ProductRow[]) || []);

            // Fetch stats in parallel
            const [catRes, whRes, stockRes] = await Promise.all([
                supabase.from("product_categories").select("id", { count: "exact", head: true }),
                supabase.from("warehouses").select("id", { count: "exact", head: true }),
                supabase.from("inventory_stocks").select("qty"),
            ]);

            setStats({
                totalProducts: (productsData || []).length,
                totalCategories: catRes.count || 0,
                totalWarehouses: whRes.count || 0,
                totalStock: (stockRes.data || []).reduce((sum, s) => sum + (s.qty || 0), 0),
            });
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    // ── Filter ──
    const filtered = products.filter((p) => {
        const matchTab =
            activeTab === "all" ? true :
                activeTab === "active" ? p.is_active :
                    !p.is_active;
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const counts = {
        all: products.length,
        active: products.filter((p) => p.is_active).length,
        inactive: products.filter((p) => !p.is_active).length,
    };

    // ── Pagination ──
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ── Format helpers ──
    const formatPrice = (price: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    const getCategoryName = (p: ProductRow) => {
        if (!p.product_categories) return "—";
        if (Array.isArray(p.product_categories)) return p.product_categories[0]?.name || "—";
        return (p.product_categories as unknown as { name: string }).name || "—";
    };

    const getMinPrice = (p: ProductRow) => {
        if (!p.product_variants?.length) return 0;
        const prices = p.product_variants.map((v) => Number(v.base_price));
        return Math.min(...prices);
    };

    // ── Handlers ──
    const handleToggleActive = async (product: ProductRow) => {
        try {
            // Cek session dulu
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Sesi expired. Silakan login ulang.");
                router.push("/login");
                return;
            }

            const { error, count } = await supabase
                .from("products")
                .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
                .eq("id", product.id)
                .select("id");

            if (error) {
                console.error("Toggle error:", error.message, error.code, error.details);
                throw error;
            }
            await fetchData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengubah status produk.";
            console.error("Error toggling status:", msg);
            alert(msg);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setProcessing(true);
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", deleteTarget.id);
            if (error) throw error;
            await fetchData();
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Gagal menghapus produk. Coba lagi.");
        } finally {
            setProcessing(false);
            setDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    const openDelete = (p: ProductRow) => {
        setDeleteTarget(p);
        setDeleteOpen(true);
    };

    // ── Tabs ──
    const tabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: "Semua" },
        { key: "active", label: "Aktif" },
        { key: "inactive", label: "Nonaktif" },
    ];

    // ── Render ──
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kelola Produk</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola produk, kategori, varian, dan stok</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs rounded-lg"
                        onClick={() => router.push("/admin/products/categories")}
                    >
                        <Tag className="w-3.5 h-3.5 mr-1" />
                        Kategori
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs rounded-lg"
                        onClick={() => router.push("/admin/products/warehouses")}
                    >
                        <Warehouse className="w-3.5 h-3.5 mr-1" />
                        Gudang
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                        onClick={() => router.push("/admin/products/new")}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah Produk
                    </Button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Total Produk</p>
                        <p className="text-xl font-bold text-slate-900">{stats.totalProducts}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Total Kategori</p>
                        <p className="text-xl font-bold text-slate-900">{stats.totalCategories}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                        <Warehouse className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Total Gudang</p>
                        <p className="text-xl font-bold text-slate-900">{stats.totalWarehouses}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400">Total Stok</p>
                        <p className="text-xl font-bold text-slate-900">{stats.totalStock.toLocaleString("id-ID")}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
            </div>

            {/* Tab Filter */}
            <div className="flex gap-2 border-b border-slate-200 pb-0 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${activeTab === tab.key
                                ? "border-emerald-600 text-emerald-700"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key
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
                                <div className="h-12 w-12 bg-slate-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 border rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">Belum Ada Produk</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {search ? "Tidak ada produk yang cocok dengan pencarian." : "Mulai tambahkan produk pertama."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold text-slate-600">Produk</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Kategori</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Tipe</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 hidden md:table-cell">Varian</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Harga Dasar</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                                                    <p className="text-[11px] text-slate-400">{formatDate(p.created_at)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">{getCategoryName(p)}</span>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {p.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <span className="text-sm text-slate-600">{p.product_variants?.length || 0} varian</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-slate-700">
                                                {p.product_variants?.length ? formatPrice(getMinPrice(p)) : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs flex items-center gap-1 w-fit ${p.is_active
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-100"
                                                }`}>
                                                {p.is_active ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg"
                                                    title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                    onClick={() => handleToggleActive(p)}
                                                >
                                                    {p.is_active
                                                        ? <ToggleRight className="w-4 h-4 text-emerald-600" />
                                                        : <ToggleLeft className="w-4 h-4 text-slate-400" />
                                                    }
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg"
                                                    title="Edit"
                                                    onClick={() => router.push(`/admin/products/${p.id}`)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg"
                                                    title="Hapus"
                                                    onClick={() => openDelete(p)}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} produk
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        className={`h-8 w-8 p-0 rounded-lg text-xs ${page === currentPage
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
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Hapus Produk?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500">
                            {deleteTarget && (
                                <>
                                    Produk <span className="font-semibold text-slate-700">{deleteTarget.name}</span> beserta semua varian, harga, dan stoknya akan dihapus permanen.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-2">
                        <AlertDialogCancel disabled={processing} className="text-xs font-semibold h-9 rounded-xl flex-1 sm:flex-none">
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
        </div>
    );
}
