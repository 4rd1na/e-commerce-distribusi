"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
    stocks: { warehouse_id: string; qty: number; existing?: boolean }[];
}

interface GalleryExisting {
    id: string;
    media_url: string;
    media_type: string;
    position: number;
}

interface GalleryNewItem {
    file: File;
    preview: string;
    type: "image" | "video";
}

type GalleryItem =
    | { kind: "existing"; data: GalleryExisting }
    | { kind: "new"; data: GalleryNewItem };

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

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
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
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [variants, setVariants] = useState<VariantForm[]>([]);
    const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);

    // Gallery state
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);

    // ── Fetch product + master data ──
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);

                // Fetch master data
                const [catRes, whRes] = await Promise.all([
                    supabase.from("product_categories").select("id, name").order("name"),
                    supabase.from("warehouses").select("id, name").order("name"),
                ]);
                const cats = (catRes.data as Category[]) || [];
                const whs = (whRes.data as Warehouse[]) || [];
                setCategories(cats);
                setWarehouses(whs);

                // Fetch product data
                const { data: product, error: pError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", productId)
                    .single();

                if (pError || !product) throw pError;

                setName(product.name);
                setSlug(product.slug || "");
                setCategoryId(product.category_id || "");
                setType(product.type);
                setDescription(product.description || "");
                setIsActive(product.is_active);
                setExistingImageUrl(product.image_url);

                // Fetch existing gallery
                const { data: galleryData } = await supabase
                    .from("product_galleries")
                    .select("id, media_url, media_type, position")
                    .eq("product_id", productId)
                    .order("position", { ascending: true });

                if (galleryData && galleryData.length > 0) {
                    setGalleryItems(
                        galleryData.map((g: GalleryExisting) => ({
                            kind: "existing" as const,
                            data: g,
                        }))
                    );
                }

                // Fetch variants with prices and stocks
                const { data: dbVariants } = await supabase
                    .from("product_variants")
                    .select(`
                        id, variant_name, sku, barcode, weight, cost_price, base_price,
                        product_variant_prices (level, price),
                        inventory_stocks (warehouse_id, qty)
                    `)
                    .eq("product_id", productId);

                const formVariants: VariantForm[] = (dbVariants || []).map((v: Record<string, unknown>) => {
                    const prices: Record<UserLevel, number> = {
                        konsumen: Number(v.base_price) || 0,
                        reseller: 0, sub_agen: 0, agen: 0, distributor: 0,
                    };

                    (v.product_variant_prices as { level: string; price: number }[] || []).forEach((p) => {
                        if (p.level in prices) {
                            prices[p.level as UserLevel] = Number(p.price);
                        }
                    });

                    const stocks = whs.map((w) => {
                        const existing = (v.inventory_stocks as { warehouse_id: string; qty: number }[] || [])
                            .find((s) => s.warehouse_id === w.id);
                        return {
                            warehouse_id: w.id,
                            qty: existing ? Number(existing.qty) : 0,
                            existing: !!existing,
                        };
                    });

                    return {
                        key: newVariantKey(),
                        id: v.id as string,
                        variant_name: (v.variant_name as string) || "",
                        sku: (v.sku as string) || "",
                        barcode: (v.barcode as string) || "",
                        weight: Number(v.weight) || 0,
                        cost_price: Number(v.cost_price) || 0,
                        base_price: Number(v.base_price) || 0,
                        prices,
                        stocks,
                    };
                });

                setVariants(formVariants.length ? formVariants : []);
            } catch (err) {
                console.error("Error fetching product:", err);
                alert("Produk tidak ditemukan.");
                router.push("/admin/products");
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchAll();
    }, [productId, router]);

    // Auto-generate slug
    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(generateSlug(val));
    };

    // ── Image handler ──
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Ukuran file maksimal 5MB"); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
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
                kind: "new" as const,
                data: {
                    file: f,
                    preview: URL.createObjectURL(f),
                    type: getMediaType(f),
                },
            }));

        setGalleryItems((prev) => [...prev, ...newItems]);
        e.target.value = "";
    };

    const removeGalleryItem = (index: number) => {
        setGalleryItems((prev) => {
            const item = prev[index];
            if (item?.kind === "existing") {
                setRemovedGalleryIds((ids) => [...ids, item.data.id]);
            }
            if (item?.kind === "new") {
                URL.revokeObjectURL(item.data.preview);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const moveGalleryItem = (from: number, to: number) => {
        if (to < 0 || to >= galleryItems.length) return;
        setGalleryItems((prev) => {
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

    const removeVariant = (v: VariantForm) => {
        if (v.id) {
            setRemovedVariantIds((prev) => [...prev, v.id!]);
        }
        setVariants((prev) => prev.filter((x) => x.key !== v.key));
    };

    const updateVariant = (key: string, field: string, value: string | number) => {
        setVariants((prev) =>
            prev.map((v) => (v.key === key ? { ...v, [field]: value } : v))
        );
    };

    const updateVariantPrice = (key: string, level: UserLevel, price: number) => {
        setVariants((prev) =>
            prev.map((v) =>
                v.key === key ? { ...v, prices: { ...v.prices, [level]: price } } : v
            )
        );
    };

    const updateVariantStock = (vKey: string, whId: string, qty: number) => {
        setVariants((prev) =>
            prev.map((v) =>
                v.key === vKey
                    ? { ...v, stocks: v.stocks.map((s) => s.warehouse_id === whId ? { ...s, qty } : s) }
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

        try {
            setSubmitting(true);

            // 1. Upload new image if changed
            let imageUrl = existingImageUrl;
            if (imageFile) {
                const ext = imageFile.name.split(".").pop();
                const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from("products").upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            // 2. Update product
            const { error: productError } = await supabase
                .from("products")
                .update({
                    name: name.trim(),
                    slug: slug.trim() || generateSlug(name),
                    category_id: categoryId || null,
                    type,
                    description: description.trim() || null,
                    image_url: imageUrl,
                    is_active: isActive,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            if (productError) throw productError;

            // 3. Delete removed gallery items
            for (const gid of removedGalleryIds) {
                await supabase.from("product_galleries").delete().eq("id", gid);
            }

            // 4. Upload new gallery items + update positions for all
            // First, figure out position mapping
            for (let i = 0; i < galleryItems.length; i++) {
                const item = galleryItems[i];

                if (item.kind === "existing") {
                    // Update position
                    await supabase
                        .from("product_galleries")
                        .update({ position: i })
                        .eq("id", item.data.id);
                } else {
                    // Upload new file
                    const ext = item.data.file.name.split(".").pop();
                    const bucket = item.data.type === "video" ? "products-videos" : "products";
                    const folder = item.data.type === "video" ? "videos" : "images";
                    const filePath = `${folder}/${productId}_${Date.now()}_${i}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from(bucket)
                        .upload(filePath, item.data.file);
                    if (uploadError) {
                        console.error("Gallery upload error:", uploadError);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

                    await supabase.from("product_galleries").insert({
                        product_id: productId,
                        media_url: publicUrl,
                        media_type: item.data.type,
                        position: i,
                    });
                }
            }

            // 5. Delete removed variants
            for (const vid of removedVariantIds) {
                await supabase.from("inventory_stocks").delete().eq("variant_id", vid);
                await supabase.from("product_variant_prices").delete().eq("variant_id", vid);
                await supabase.from("product_variants").delete().eq("id", vid);
            }

            // 6. Upsert variants
            for (const v of variants) {
                if (!v.variant_name.trim()) continue;

                if (v.id) {
                    const { error: vError } = await supabase
                        .from("product_variants")
                        .update({
                            variant_name: v.variant_name.trim(),
                            sku: v.sku.trim() || null,
                            barcode: v.barcode.trim() || null,
                            weight: Number(v.weight) || 0,
                            cost_price: Number(v.cost_price) || 0,
                            base_price: Number(v.base_price) || 0,
                        })
                        .eq("id", v.id);
                    if (vError) throw vError;

                    await supabase.from("product_variant_prices").delete().eq("variant_id", v.id);

                    const priceInserts = LEVELS
                        .filter((l) => v.prices[l.key] > 0)
                        .map((l) => ({ variant_id: v.id, level: l.key, price: v.prices[l.key] }));
                    if (priceInserts.length) {
                        await supabase.from("product_variant_prices").insert(priceInserts);
                    }

                    for (const s of v.stocks) {
                        if (s.existing) {
                            await supabase
                                .from("inventory_stocks")
                                .update({ qty: s.qty, updated_at: new Date().toISOString() })
                                .eq("variant_id", v.id)
                                .eq("warehouse_id", s.warehouse_id);
                        } else if (s.qty > 0) {
                            await supabase.from("inventory_stocks").insert({
                                variant_id: v.id,
                                warehouse_id: s.warehouse_id,
                                qty: s.qty,
                            });
                        }
                    }
                } else {
                    const { data: newVar, error: vError } = await supabase
                        .from("product_variants")
                        .insert({
                            product_id: productId,
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

                    const priceInserts = LEVELS
                        .filter((l) => v.prices[l.key] > 0)
                        .map((l) => ({ variant_id: newVar.id, level: l.key, price: v.prices[l.key] }));
                    if (priceInserts.length) {
                        await supabase.from("product_variant_prices").insert(priceInserts);
                    }

                    const stockInserts = v.stocks
                        .filter((s) => s.qty > 0)
                        .map((s) => ({ variant_id: newVar.id, warehouse_id: s.warehouse_id, qty: s.qty }));
                    if (stockInserts.length) {
                        await supabase.from("inventory_stocks").insert(stockInserts);
                    }
                }
            }

            router.push("/admin/products");
        } catch (err) {
            console.error("Error updating product:", err);
            alert("Gagal menyimpan perubahan. Coba lagi.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Memuat data produk...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => router.push("/admin/products")}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Produk</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Ubah informasi produk, varian, harga, dan stok</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Info Produk ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold text-slate-900">Informasi Produk</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Nama Produk *</Label>
                            <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nama produk" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" required />
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Slug</Label>
                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Kategori</Label>
                            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                <option value="">— Tanpa Kategori —</option>
                                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-slate-700 mb-1.5">Tipe Produk *</Label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                <option value="barang">Barang</option>
                                <option value="jasa">Jasa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium text-slate-700 mb-1.5">Deskripsi</Label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
                    </div>

                    {/* Image */}
                    <div>
                        <Label className="text-xs font-medium text-slate-700 mb-1.5">Gambar Utama</Label>
                        {(imagePreview || existingImageUrl) ? (
                            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                                <img src={imagePreview || existingImageUrl || ""} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={removeImage} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
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
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
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

                    {galleryItems.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-sm text-slate-400">Belum ada file. Klik &quot;Tambah File&quot; untuk menambahkan foto atau video.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {galleryItems.map((item, i) => {
                                const isExisting = item.kind === "existing";
                                const mediaType = isExisting ? (item.data as GalleryExisting).media_type : (item.data as GalleryNewItem).type;
                                const mediaUrl = isExisting ? (item.data as GalleryExisting).media_url : (item.data as GalleryNewItem).preview;

                                return (
                                    <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                                        {mediaType === "image" ? (
                                            <img src={mediaUrl} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
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
                                                disabled={i === galleryItems.length - 1}
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
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Varian ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">Varian Produk</h2>
                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={addVariant}>
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
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" onClick={() => removeVariant(v)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Nama Varian *</Label>
                                    <input type="text" value={v.variant_name} onChange={(e) => updateVariant(v.key, "variant_name", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">SKU</Label>
                                    <input type="text" value={v.sku} onChange={(e) => updateVariant(v.key, "sku", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Barcode</Label>
                                    <input type="text" value={v.barcode} onChange={(e) => updateVariant(v.key, "barcode", e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Berat (gram)</Label>
                                    <input type="number" value={v.weight || ""} onChange={(e) => updateVariant(v.key, "weight", Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Harga Modal (Rp)</Label>
                                    <input type="number" value={v.cost_price || ""} onChange={(e) => updateVariant(v.key, "cost_price", Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-500 mb-1 block">Harga Dasar (Rp) *</Label>
                                    <input type="number" value={v.base_price || ""} onChange={(e) => updateBasePrice(v.key, Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
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
                                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            />
                                        </div>
                                    ))}
                                </div>
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
                                                    <input type="number" value={s.qty || ""} onChange={(e) => updateVariantStock(v.key, s.warehouse_id, Number(e.target.value))} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
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
                    <Button type="button" variant="outline" className="h-10 px-6 rounded-xl text-sm" onClick={() => router.push("/admin/products")}>
                        Batal
                    </Button>
                    <Button type="submit" className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
