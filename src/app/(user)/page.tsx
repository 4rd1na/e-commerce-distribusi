"use client";

import Link from "next/link";
import { ShoppingCart, ShoppingBag, ArrowUpDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Variant {
  id: string;
  variant_name: string;
  base_price: number;
  display_price: number;
  stock: number;
}

interface Products {
  id: string;
  name: string;
  slug: string;
  type: 'barang' | 'jasa';
  image_url: string;
  category: string;
  variants: Variant[];
  totalStock: number;
}

const sortOptions = {
  terlaris: "Terlaris",
  terbaru: "Terbaru",
  terlama: "Terlama",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("terlaris");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const searchParams = useSearchParams();
  const [searchLoading, setSearchLoading] = useState(false);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);

  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setSearchLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);

    const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      let userLevel = 'konsumen';
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("level")
          .eq("id", user.id)
          .single();
        if (profile) userLevel = profile.level;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          type,
          image_url,
          is_active,
          product_categories ( name ),
          product_variants (
            id,
            variant_name,
            base_price,
            inventory_stocks ( qty ),
            product_variant_prices (
              price,
              level
            )
          )
        `)
        .eq("is_active", true);

      if (error) throw error;

      if (data) {
        const formattedProducts: Products[] = data.map((p: any) => {
          const variants: Variant[] = p.product_variants?.map((v: any) => {
            const variantStock = v.inventory_stocks?.reduce((acc: number, s: any) => acc + (s.qty || 0), 0) || 0;
            const specialPriceObj = v.product_variant_prices?.find((pPrice: any) => pPrice.level === userLevel);
            return {
              id: v.id,
              variant_name: v.variant_name,
              base_price: Number(v.base_price || 0),
              display_price: specialPriceObj ? Number(specialPriceObj.price) : Number(v.base_price || 0),
              stock: variantStock
            };
          }) || [];

          const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            type: p.type,
            image_url: p.image_url,
            category: p.product_categories?.name || "Tanpa Kategori",
            variants: variants,
            totalStock: totalStock,
          };
        });

        setProducts(formattedProducts);

        const defaults: { [key: string]: string } = {};
        formattedProducts.forEach(p => {
          if (p.variants.length > 0) {
            defaults[p.id] = p.variants[0].id;
          }
        });
        setSelectedVariants(defaults);
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
    }
  };

  const handleAddToCart = async (product: Products, redirectToCart: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const variantId = selectedVariants[product.id];
      if (!variantId) return;

      setAddingToCart(variantId);

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
          .update({ qty: existingItem.qty + 1 })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            variant_id: variantId,
            qty: 1
          });

        if (insertError) throw insertError;
      }

      if (redirectToCart) {
        router.push("/carts");
      } else {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Gagal menambah ke keranjang:", error);
      alert("Gagal menambahkan produk ke keranjang");
    } finally {
      setAddingToCart(null);
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-3 space-y-3">
        <div className="h-3 w-16 bg-slate-200 rounded" />
        <div className="space-y-2"><div className="h-4 bg-slate-200 rounded" /><div className="h-4 w-3/4 bg-slate-200 rounded" /></div>
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="flex justify-between pt-2"><div className="h-4 w-20 bg-slate-200 rounded" /><div className="h-4 w-10 bg-slate-200 rounded" /></div>
        <div className="flex gap-2"><div className="h-8 flex-1 bg-slate-200 rounded-lg" /><div className="h-8 flex-1 bg-slate-200 rounded-lg" /></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }
  if (products.length === 0) return <div className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm font-medium">Belum ada produk yang tersedia saat ini.</div>;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">

      {/* FILTER KATEGORI & SORTIR */}
      <div className="mb-6 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition whitespace-nowrap snap-tight ${selectedCategory === "all"
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
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition whitespace-nowrap snap-tight ${selectedCategory === cat.slug
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOptions[sortBy as keyof typeof sortOptions]}</span>
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
                    onClick={() => {
                      setSortBy(value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${sortBy === value
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
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

      {/* KONTEN UTAMA */}
      {searchLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => <SkeletonCard key={idx} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="font-medium text-slate-600">Produk tidak ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba pilih kategori produk lainnya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {filteredProducts.map((p) => {
            const currentVariantId = selectedVariants[p.id];
            const currentVariant = p.variants.find(v => v.id === currentVariantId) || p.variants[0];
            const price = currentVariant ? (currentVariant.display_price || currentVariant.base_price) : 0;
            const stock = currentVariant ? currentVariant.stock : 0;

            return (
              <div key={p.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                {/* GAMBAR PRODUK */}
                <Link href={`/products/${p.slug}`}>
                  <div className="aspect-square overflow-hidden bg-slate-100 relative">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className={`w-full h-full object-cover transition duration-300 ${p.totalStock === 0 ? "brightness-[0.8]" : "group-hover:scale-105"
                          }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Tidak Ada Gambar</div>
                    )}

                    {/* OVERLAY & TEXT STOK HABIS */}
                    {p.totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-black/70 text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full tracking-wider border border-white/20">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* KONTEN */}
                <div className="p-2 sm:p-3 flex flex-col flex-1">
                  <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">{p.category}</span>

                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Link href={`/products/${p.slug}`} className="block overflow-hidden">
                          <h2 className="text-[12px] sm:text-sm font-semibold truncate leading-snug hover:text-emerald-600 transition">
                            {p.name}
                          </h2>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs bg-slate-900 text-white p-2 rounded-md shadow-md">
                        <p>{p.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* PEMILIH VARIAN */}
                  {p.variants.length > 1 && (
                    <div className="mt-1">
                      <select
                        value={currentVariantId || ""}
                        onChange={(e) => setSelectedVariants({ ...selectedVariants, [p.id]: e.target.value })}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-md p-1 outline-none text-slate-700"
                      >
                        {p.variants.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            disabled={v.stock === 0}
                            className={v.stock === 0 ? "text-slate-400 bg-slate-100" : "text-slate-700"}
                          >
                            {v.variant_name} {v.stock === 0 ? "(Habis)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* KONTEN BAGIAN BAWAH */}
                  <div className="mt-auto pt-2 sm:pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-emerald-600 font-bold text-[12px] sm:text-sm">
                        Rp {price.toLocaleString("id-ID")}
                      </div>
                      <div className={`text-[9px] sm:text-[10px] font-medium ${stock === 0 ? "text-rose-500" : "text-slate-400"}`}>
                        Stok: {stock}
                      </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="flex gap-1.5 sm:gap-2 mt-2">
                      <Button
                        variant="outline"
                        disabled={stock === 0 || addingToCart === currentVariantId}
                        onClick={() => handleAddToCart(p)}
                        className="h-7 sm:h-8 w-7 sm:w-8 p-0 px-1 flex items-center justify-center rounded-lg border border-slate-200 shrink-0 gap-0.5 text-[10px]"
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
                        {addingToCart === currentVariantId && (
                          <span className="font-bold text-emerald-600 animate-pulse">...</span>
                        )}
                      </Button>

                      <Button
                        disabled={stock === 0 || addingToCart === currentVariantId}
                        onClick={() => {
                          handleAddToCart(p);
                          router.push("/carts");
                        }}
                        className="flex-1 h-7 sm:h-8 text-[10px] sm:text-[11px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Beli Sekarang
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/90 text-white px-5 py-3 rounded-xl shadow-xl flex flex-col items-center gap-1.5 max-w-xs text-center backdrop-blur-sm">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs font-medium tracking-wide">
              Berhasil dimasukkan ke keranjang
            </p>
          </div>
        </div>
      )}
    </div>
  );
}