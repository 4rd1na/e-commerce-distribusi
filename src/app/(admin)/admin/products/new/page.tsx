"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    Upload,
    X,
    Image as ImageIcon,
    Film,
} from "lucide-react";

// ── Types ──
interface Category { id: string; name: string; }
interface Warehouse { id: string; name: string; }

type UserLevel = "konsumen" | "reseller" | "sub_agen" | "agen" | "distributor";

interface VariantForm {
    key: string;
    id?: string;
    variant_name: string;
    sku: string;
    barcode: string;
    weight: number;
    cost_price: number;
    base_price: number;
    prices: Record<UserLevel, number>;
    stocks: { warehouse_id: string; qty: number }[];
}

interface GalleryItem {
    file: File;
    preview: string;
    type: "image" | "video";
}

const LEVELS: { key: UserLevel; label: string }[] = [
    { key: "konsumen", label: "Konsumen" },
    { key: "reseller", label: "Reseller" },
    { key: "sub_agen", label: "Sub Agen" },
    { key: "agen", label: "Agen" },
    { key: "distributor", label: "Distributor" },
];

let variantCounter = 0;
const newVariantKey = () => `v_${++variantCounter}_${Date.now()}`;

function generateSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

function getMediaType(file: File): "image" | "video" {
    if (file.type.startsWith("video/")) return "video";
    return "image";
}

export default function NewProductPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Master data
    const [categories, setCategories] = useState<Category[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    // Form state
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [type, setType] = useState("barang");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [variants, setVariants] = useState<VariantForm[]>([]);

    // Gallery state
    const [gallery, setGallery] = useState<GalleryItem[]>([]);

    // ── Fetch master data ──
    useEffect(() => {
        const fetchMaster = async () => {
            const [catRes, whRes] = await Promise.all([
                supabase.from("product_categories").select("id, name").order("name"),
                supabase.from("warehouses").select("id, name").order("name"),
            ]);
            setCategories((catRes.data as Category[]) || []);
            setWarehouses((whRes.data as Warehouse[]) || []);
            addVariant();
        };
        fetchMaster();
    }, []);

    // Auto-generate slug
    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(generateSlug(val));
    };

    // ── Image handler ──
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file maksimal 5MB");
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // ── Gallery handlers ──
    const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newItems: GalleryItem[] = Array.from(files)
            .filter((f) => {
                const isImage = f.type.startsWith("image/");
                const isVideo = f.type.startsWith("video/");
                if (!isImage && !isVideo) return false;
                if (f.size > 20 * 1024 * 1024) {
                    alert(`File "${f.name}" melebihi 20MB.`);
                    return false;
                }
                return true;
            })
            .map((f) => ({
                file: f,
                preview: URL.createObjectURL(f),
                type: getMediaType(f),
            }));

        setGallery((prev) => [...prev, ...newItems]);
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    const removeGalleryItem = (index: number) => {
        setGallery((prev) => {
            const item = prev[index];
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const moveGalleryItem = (from: number, to: number) => {
        if (to < 0 || to >= gallery.length) return;
        setGallery((prev) => {
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return arr;
        });
    };

    // ── Variant handlers ──
    const addVariant = () => {
        const stocks = warehouses.map((w) => ({ warehouse_id: w.id, qty: 0 }));
        setVariants((prev) => [
            ...prev,
            {
                key: newVariantKey(),
                variant_name: "",
                sku: "",
                barcode: "",
                weight: 0,
                cost_price: 0,
                base_price: 0,
                prices: { konsumen: 0, reseller: 0, sub_agen: 0, agen: 0, distributor: 0 },
                stocks: stocks.length ? stocks : [],
            },
        ]);
    };

    const removeVariant = (key: string) => {
        setVariants((prev) => prev.filter((v) => v.key !== key));
    };

    const updateVariant = (key: string, field: string, value: string | number) => {
        setVariants((prev) =>
            prev.map((v) => (v.key === key ? { ...v, [field]: value } : v))
        );
    };

    const updateVariantPrice = (key: string, level: UserLevel, price: number) => {
        setVariants((prev) =>
            prev.map((v) =>
                v.key === key
                    ? { ...v, prices: { ...v.prices, [level]: price } }
                    : v
            )
        );
    };

    const updateVariantStock = (vKey: string, whId: string, qty: number) => {
        setVariants((prev) =>
            prev.map((v) =>
                v.key === vKey
                    ? {
                          ...v,
                          stocks: v.stocks.map((s) =>
                              s.warehouse_id === whId ? { ...s, qty } : s
                          ),
                      }
                    : v
            )
        );
    };

    const updateBasePrice = (key: string, price: number) => {
        setVariants((prev) =>
            prev.map((v) =>
                v.key === key
                    ? { ...v, base_price: price }
                    : v
            )
        );
    };

    // ── Submit ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert("Nama produk wajib diisi."); return; }
        if (!variants.length) { alert("Tambahkan minimal 1 varian."); return; }

        try {
            setSubmitting(true);

            // 1. Upload main image
            let imageUrl: string | null = null;
            if (imageFile) {
                const ext = imageFile.name.split(".").pop();
                const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("products")
                    .upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            // 2. Insert product
            const { data: product, error: productError } = await supabase
                .from("products")
                .insert({
                    name: name.trim(),
                    slug: slug.trim() || generateSlug(name),
                    category_id: categoryId || null,
                    type,
                    description: description.trim() || null,
                    image_url: imageUrl,
                    is_active: isActive,
                })
                .select("id")
                .single();

            if (productError) throw productError;

            // 3. Insert gallery items
            for (let i = 0; i < gallery.length; i++) {
                const g = gallery[i];
                const ext = g.file.name.split(".").pop();
                const bucket = g.type === "video" ? "products-videos" : "products";
                const folder = g.type === "video" ? "videos" : "images";
                const filePath = `${folder}/${product.id}_${Date.now()}_${i}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, g.file);
                if (uploadError) {
                    console.error("Gallery upload error:", uploadError);
                    continue; // skip failed uploads
                }

                const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

                await supabase.from("product_galleries").insert({
                    product_id: product.id,
                    media_url: publicUrl,
                    media_type: g.type,
                    position: i,
                });
            }

            // 4. Insert variants + prices + stocks
            for (const v of variants) {
                if (!v.variant_name.trim()) continue;

                const { data: variant, error: vError } = await supabase
                    .from("product_variants")
                    .insert({
                        product_id: product.id,
                        variant_name: v.variant_name.trim(),
                        sku: v.sku.trim() || null,
                        barcode: v.barcode.trim() || null,
                        weight: Number(v.weight) || 0,
                        cost_price: Number(v.cost_price) || 0,
                        base_price: Number(v.base_price) || 0,
                    })
                    .select("id")
                    .single();

                if (vError) throw vError;

                // Insert prices per level
                const priceInserts = LEVELS
                    .filter((l) => v.prices[l.key] > 0)
                    .map((l) => ({
                        variant_id: variant.id,
                        level: l.key,
                        price: v.prices[l.key],
                    }));

                if (priceInserts.length) {
                    const { error: priceError } = await supabase
                        .from("product_variant_prices")
                        .insert(priceInserts);
                    if (priceError) throw priceError;
                }

                // Insert stocks per warehouse
                const stockInserts = v.stocks
                    .filter((s) => s.qty > 0)
                    .map((s) => ({
                        warehouse_id: s.warehouse_id,
                        variant_id: variant.id,
                        qty: s.qty,
                    }));

                if (stockInserts.length) {
                    const { error: stockError } = await supabase
                        .from("inventory_stocks")
                        .insert(stockInserts);
                    if (stockError) throw stockError;
                }
            }

            router.push("/admin/products");
        } catch (err) {
            console.error("Error creating product:", err);
            alert("Gagal membuat produk. Coba lagi.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ──
    return (
        <div className="max-w-4xl mx-auto space-y-8">
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
                    <h1 className="text-2xl font-bold text-slate-900">Tambah Produk Baru</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Isi informasi produk, varian, harga, dan stok</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Bagian A: Info Produk ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-900">Informasi Produk</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Nama Produk *</Label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Contoh: Mie Sedaap Goreng"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Slug</Label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="mie-sedaap-goreng"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Kategori</Label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                            >
                                <option value="">— Tanpa Kategori —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Tipe Produk *</Label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                            >
                                <option value="barang">Barang</option>
                                <option value="jasa">Jasa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium text-slate-700 mb-1.5">Deskripsi</Label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Deskripsi produk..."
                            rows={3}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        />
                    </div>

                    {/* Image upload */}
                    <div>
                        <Label className="text-xs font-medium text-slate-700 mb-1.5">Gambar Utama</Label>
                        {imagePreview ? (
                            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition">
                                <div className="text-center">
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                                    <span className="text-[10px] text-slate-400">Upload</span>
                                </div>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">Maks. 5MB. Format: JPG, PNG, WebP</p>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <span className="text-sm text-slate-700">{isActive ? "Aktif" : "Nonaktif"}</span>
                    </div>
                </div>

                {/* ── Gallery (Foto + Video) ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">Galeri Produk</h2>
                        <label className="cursor-pointer">
                            <Button type="button" size="sm" variant="outline" className="h-8 text-xs rounded-lg" asChild>
                                <span>
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Tambah File
                                </span>
                            </Button>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleGalleryFiles}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <p className="text-[11px] text-slate-400">Format: JPG, PNG, WebP (maks 5MB) atau MP4, WebM (maks 20MB). Urutan dari kiri ke kanan.</p>

                    {gallery.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-sm text-slate-400">Belum ada file. Klik &quot;Tambah File&quot; untuk menambahkan foto atau video.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {gallery.map((g, i) => (
                                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                                    {g.type === "image" ? (
                                        <img src={g.preview} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                                            <Film className="w-6 h-6 text-slate-400 mb-1" />
                                            <span className="text-[10px] text-slate-400">Video</span>
                                        </div>
                                    )}
                                    {/* Actions overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => moveGalleryItem(i, i - 1)}
                                            disabled={i === 0}
                                            className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-30"
                                        >
                                            ←
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryItem(i)}
                                            className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveGalleryItem(i, i + 1)}
                                            disabled={i === gallery.length - 1}
                                            className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-30"
                                        >
                                            →
                                        </button>
                                    </div>
                                    {/* Position badge */}
                                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                        {i + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Bagian B: Varian ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">Varian Produk</h2>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg"
                            onClick={addVariant}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Tambah Varian
                        </Button>
                    </div>

                    {variants.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-6">Belum ada varian. Klik &quot;Tambah Varian&quot; untuk menambahkan.</p>
                    )}

                    {variants.map((v, idx) => (
                        <div key={v.key} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800">Varian {idx + 1}</span>
                                {variants.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        onClick={() => removeVariant(v.key)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Nama Varian *</Label>
                                    <input type="text" value={v.variant_name} onChange={(e) => updateVariant(v.key, "variant_name", e.target.value)} placeholder="Contoh: Original 85g" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">SKU</Label>
                                    <input type="text" value={v.sku} onChange={(e) => updateVariant(v.key, "sku", e.target.value)} placeholder="SKU-001" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Barcode</Label>
                                    <input type="text" value={v.barcode} onChange={(e) => updateVariant(v.key, "barcode", e.target.value)} placeholder="Barcode" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Berat (gram)</Label>
                                    <input type="number" value={v.weight || ""} onChange={(e) => updateVariant(v.key, "weight", Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Harga Modal (Rp)</Label>
                                    <input type="number" value={v.cost_price || ""} onChange={(e) => updateVariant(v.key, "cost_price", Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Harga Dasar (Rp) *</Label>
                                    <input type="number" value={v.base_price || ""} onChange={(e) => updateBasePrice(v.key, Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                            </div>

                            {/* Prices per level */}
                            <div>
                                <p className="text-[11px] font-medium text-slate-600 mb-2">Harga per Level</p>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {LEVELS.map((l) => (
                                        <div key={l.key}>
                                            <Label className="text-[10px] text-slate-400 mb-0.5 block">{l.label}</Label>
                                            <input
                                                type="number"
                                                value={v.prices[l.key] || ""}
                                                onChange={(e) => updateVariantPrice(v.key, l.key, Number(e.target.value))}
                                                placeholder={l.key === "konsumen" ? String(v.base_price) : "0"}
                                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">* Kosongkan harga jika ingin mengikuti Harga Dasar</p>
                            </div>

                            {/* Stock per warehouse */}
                            {warehouses.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-medium text-slate-600 mb-2">Stok per Gudang</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {v.stocks.map((s) => {
                                            const wh = warehouses.find((w) => w.id === s.warehouse_id);
                                            return (
                                                <div key={s.warehouse_id}>
                                                    <Label className="text-[10px] text-slate-400 mb-0.5 block">{wh?.name || "Gudang"}</Label>
                                                    <input type="number" value={s.qty || ""} onChange={(e) => updateVariantStock(v.key, s.warehouse_id, Number(e.target.value))} placeholder="0" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Submit */}
                <div className="flex gap-3 justify-end pb-8">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-6 rounded-xl text-sm"
                        onClick={() => router.push("/admin/products")}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                        ) : "Simpan Produk"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
