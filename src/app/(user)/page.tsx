"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  ShoppingBag,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase/client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ── Tipe Data ──

type VariantPrice = {
  price: number;
  level: string;
};

type InventoryStock = {
  qty: number;
};

type ProductVariant = {
  id: string;
  variant_name: string;
  base_price: number;
  inventory_stocks: InventoryStock[];
  product_variant_prices: VariantPrice[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  type: "barang" | "jasa";
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  product_categories: { name: string }[] | null;
  product_variants: ProductVariant[];
};

type CategoryFromDB = {
  id: string;
  name: string;
  slug: string;
};

// ── Komponen Utama ──

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [cartLoadingId, setCartLoadingId] = useState<string | null>(null);

  const [userLevel, setUserLevel] = useState<string>("konsumen");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("terbaru");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Sheet state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const sortOptions: Record<string, string> = {
    terbaru: "Terbaru",
    terlama: "Terlama",
  };

  // ── Harga aktif berdasarkan level user ──
  const hitungHarga = (variant: ProductVariant): number => {
    const specialPrice = variant.product_variant_prices?.find(
      (p) => p.level === userLevel
    );
    const basePrice = specialPrice ? Number(specialPrice.price) : Number(variant.base_price || 0);
    return basePrice;
  };

  // ── Stok varian ──
  const hitungStokVariant = (variant: ProductVariant): number => {
    return variant.inventory_stocks?.reduce((total, s) => total + (s.qty || 0), 0) ?? 0;
  };

  // ── Total stok produk (semua varian) ──
  const hitungTotalStok = (product: Product): number => {
    return product.product_variants?.reduce(
      (total, v) => total + hitungStokVariant(v), 0
    ) ?? 0;
  };

  // ── Harga terendah dari semua varian ──
  const hargaTerendah = (product: Product): number => {
    if (!product.product_variants?.length) return 0;
    const prices = product.product_variants.map((v) => hitungHarga(v));
    return Math.min(...prices);
  };

  // ── Filter & Sort ──
  const filteredProducts = products
    .filter((p) => {
      if (!searchQuery || p.name.toLowerCase().includes(searchQuery)) {
        // ok
      } else {
        return false;
      }
      if (selectedCategory === "all") return true;
      const catName = p.product_categories?.[0]?.name?.toLowerCase() || "";
      return catName === selectedCategory.toLowerCase();
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sortBy === "terbaru") return timeB - timeA;
      if (sortBy === "terlama") return timeA - timeB;
      return 0;
    });

  // ── Search debounce ──
  useEffect(() => {
    if (!searchQuery) { setIsSearching(false); return; }
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Load data ──
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", user.id)
            .single();
          if (profile?.level) setUserLevel(profile.level);
        }
        await Promise.all([fetchCategories(), fetchProducts()]);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchQuery]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug")
      .order("name", { ascending: true });
    if (error) { console.error(error); return; }
    setCategories(data || []);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, type, image_url, is_active, created_at,
        product_categories ( name ),
        product_variants (
          id, variant_name, base_price,
          inventory_stocks ( qty ),
          product_variant_prices ( price, level )
        )
      `)
      .eq("is_active", true)
      .ilike("name", `%${searchQuery}%`);

    if (error) { console.error(error); return; }
    setProducts((data as Product[]) || []);
  }

  // ── Klik tombol keranjang ──
  const handleCartClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.product_variants.length <= 1) {
      // Produk tanpa variasi → langsung tambah
      const variant = product.product_variants[0];
      if (variant) {
        addToCart(product.id, variant.id, 1);
      }
    } else {
      // Produk punya variasi → buka Sheet
      setActiveProduct(product);
      const firstVariant = product.product_variants[0];
      setSelectedVariant(firstVariant);
      setQuantity(1);
      setIsSheetOpen(true);
    }
  };

  // ── Tambah ke keranjang ──
  const addToCart = async (productId: string, variantId: string, qty: number) => {
    try {
      setCartLoadingId(productId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (cartError) throw cartError;
        cart = newCart;
      }

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, qty")
        .eq("cart_id", cart.id)
        .eq("variant_id", variantId)
        .maybeSingle();

      if (existingItem) {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ qty: existingItem.qty + qty })
          .eq("id", existingItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({ cart_id: cart.id, variant_id: variantId, qty });
        if (insertError) throw insertError;
      }

      showToast("Berhasil dimasukkan ke keranjang");
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Gagal menambah ke keranjang:", error);
      showToast("Terjadi kesalahan, silakan coba lagi", "error");
    } finally {
      setCartLoadingId(null);
    }
  };

  // ── Sheet: stok & harga varian aktif ──
  const sheetStok = selectedVariant ? hitungStokVariant(selectedVariant) : 0;
  const sheetHarga = selectedVariant ? hitungHarga(selectedVariant) : 0;
  const sheetOutOfStock = activeProduct?.type === "barang" && sheetStok === 0;

  // ── Render ──

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm font-medium">
        Belum ada produk yang tersedia saat ini.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">

      {/* ── FILTER KATEGORI & SORTIR ── */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Kategori Chips */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition whitespace-nowrap snap-start ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition whitespace-nowrap snap-start ${
                  selectedCategory === cat.slug
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOptions[sortBy]}</span>
            <span className={`text-[9px] text-slate-400 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {isSortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
                {Object.entries(sortOptions).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSortBy(value); setIsSortOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      sortBy === value
                        ? "text-emerald-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="font-medium text-slate-600">Produk tidak ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba pilih kategori lain atau ubah kata pencarian.</p>
        </div>
      ) : (
        /* ── GRID PRODUK ── */
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredProducts.map((p) => {
              const totalStok = hitungTotalStok(p);
              const harga = hargaTerendah(p);
              const isOutOfStock = p.type === "barang" && totalStok === 0;
              const hasVariants = p.product_variants.length > 1;

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/products/${p.slug}`)}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
                >
                  {/* Gambar */}
                  <Link href={`/products/${p.slug}`}>
                    <div className="aspect-square overflow-hidden bg-slate-100 relative">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isOutOfStock ? "brightness-[0.8]" : "group-hover:scale-105"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          Belum Ada Gambar
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-black/70 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full tracking-wider border border-white/20">
                            Habis
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Konten */}
                  <div className="p-2 sm:p-3 flex flex-col flex-1">

                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Link href={`/products/${p.slug}`} className="block overflow-hidden">
                          <h2 className="text-[12px] sm:text-sm font-semibold line-clamp-2 leading-snug hover:text-emerald-600 transition mt-0.5">
                            {p.name}
                          </h2>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs bg-slate-900 text-white p-2 rounded-md shadow-md">
                        <p>{p.name}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Stok */}
                    <div className="mt-1 text-[9px] sm:text-[10px] font-medium text-slate-400">
                      {p.type === "barang"
                        ? (totalStok === 0 ? <span className="text-rose-500">Stok: Habis</span> : `Stok: ${totalStok}`)
                        : <span className="text-emerald-600 bg-emerald-50 px-1 rounded">Layanan</span>
                      }
                    </div>

                    {/* Harga & Tombol */}
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-emerald-600">
                          Rp {harga.toLocaleString("id-ID")}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isOutOfStock || cartLoadingId === p.id}
                          onClick={(e) => handleCartClick(e, p)}
                          className="h-7 w-7 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 shrink-0 p-0"
                        >
                          {cartLoadingId === p.id ? (
                            <span className="text-[10px] font-bold animate-pulse text-emerald-600">...</span>
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>

                      <Button
                        disabled={isOutOfStock || cartLoadingId === p.id}
                        onClick={(e) => handleCartClick(e, p)}
                        className="w-full h-7 sm:h-8 mt-1.5 text-[10px] sm:text-[11px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        {hasVariants ? "Beli Sekarang" : "Beli Sekarang"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm ${
            toast.type === "success"
              ? "bg-white/95 border border-slate-200"
              : "bg-white/95 border border-red-200"
          }`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success" ? "bg-emerald-50" : "bg-red-50"
            }`}>
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700">{toast.message}</p>
          </div>
        </div>
      )}

      {/* ── SHEET: Pilih Varian ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-2xl overflow-y-auto max-h-[85vh] border-x border-t border-slate-200 p-0 max-w-lg mx-auto w-full"
        >
          {activeProduct && (
            <div className="mx-auto max-w-lg w-full pb-6 pt-3 px-4 sm:px-5">
              {/* Drag handle */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />

              {/* Header */}
              <SheetHeader className="text-left p-0 mb-4">
                <div className="flex gap-3">
                  <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {activeProduct.image_url ? (
                      <img
                        src={activeProduct.image_url}
                        alt={activeProduct.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {activeProduct.name}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Pilih varian produk sebelum dimasukkan ke keranjang.
                    </SheetDescription>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold text-emerald-600">
                        Rp {sheetHarga.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {activeProduct.type === "barang"
                          ? `Stok: ${sheetStok} pcs`
                          : "Tersedia"}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Pilihan Varian */}
              {activeProduct.product_variants.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Pilih Varian
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.product_variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const varStok = hitungStokVariant(variant);
                      const isDisabled = activeProduct.type === "barang" && varStok === 0;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setQuantity(1);
                          }}
                          className={`rounded-lg border px-3 py-2 text-xs transition-all ${
                            isDisabled
                              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                              : isSelected
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-500/30"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 active:bg-slate-50"
                          }`}
                        >
                          {variant.variant_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Jumlah / Stepper */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
                <span className="text-xs font-medium text-slate-600">Jumlah</span>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || sheetOutOfStock}
                    className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold tabular-nums text-slate-800">
                    {sheetOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    disabled={sheetOutOfStock || (activeProduct.type === "barang" && quantity >= sheetStok)}
                    className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtotal & Aksi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
                  <span className="text-xs text-slate-500">Subtotal</span>
                  <span className="text-sm font-bold text-slate-900">
                    Rp {(sheetHarga * quantity).toLocaleString("id-ID")}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    if (activeProduct && selectedVariant) {
                      addToCart(activeProduct.id, selectedVariant.id, quantity);
                    }
                  }}
                  disabled={cartLoadingId === activeProduct.id || sheetOutOfStock || !selectedVariant}
                  className="w-full h-10 gap-2 rounded-xl bg-emerald-600 font-semibold text-sm text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {cartLoadingId === activeProduct.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  {sheetOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Skeleton ──

function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="aspect-square bg-slate-200 animate-pulse" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 w-14 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded animate-pulse" />
          <div className="h-3.5 w-3/4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-7 w-7 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-7 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
