"use client";

import Link from "next/link";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Sesuaikan interface agar menampung struktur data asli variant
interface Variant {
  id: string;
  variant_name: string;
  base_price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  category: string;
  variants: Variant[];
  totalStock: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // State untuk menyimpan varian yang dipilih user per produk [productId: variantId]
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const searchParams = useSearchParams();
  const [searchLoading, setSearchLoading] = useState(false);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setSearchLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery)
    );
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          image_url,
          is_active,
          product_categories ( name ),
          product_variants (
            id,
            variant_name,
            base_price,
            inventory_stocks ( qty )
          )
        `)
        .eq("is_active", true);

      if (error) throw error;

      if (data) {
        const formattedProducts: Product[] = data.map((p: any) => {
          // Map semua varian yang dimiliki produk ini
          const variants: Variant[] = p.product_variants?.map((v: any) => {
            const variantStock = v.inventory_stocks?.reduce((acc: number, s: any) => acc + (s.qty || 0), 0) || 0;
            return {
              id: v.id,
              variant_name: v.variant_name,
              base_price: Number(v.base_price || 0),
              stock: variantStock
            };
          }) || [];

          const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            image_url: p.image_url,
            category: p.product_categories?.name || "Uncategorized",
            variants: variants,
            totalStock: totalStock,
          };
        });

        setProducts(formattedProducts);

        // Set default variant yang terpilih (varian pertama) untuk tiap produk
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

  // FUNGSI UTAMA TAMBAH KE KERANJANG
  const handleAddToCart = async (product: Product) => {
    try {
      // 1. Cek Auth User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const variantId = selectedVariants[product.id];
      if (!variantId) return alert("Silakan pilih varian terlebih dahulu.");

      setAddingToCart(variantId);

      // 2. Ambil atau buat data cart aktif milik user
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

      // 3. Cek apakah varian barang ini sudah ada di dalam cart_items
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, qty")
        .eq("cart_id", cart.id)
        .eq("variant_id", variantId)
        .maybeSingle();

      if (existingItem) {
        // Jika sudah ada, tambahkan qty (+1)
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ qty: existingItem.qty + 1 })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Jika belum ada, buat baris baru
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            variant_id: variantId,
            qty: 1
          });

        if (insertError) throw insertError;
      }

      window.dispatchEvent(new Event("cart-updated"));

    } catch (error) {
      console.error("Gagal menambah ke keranjang:", error);
      alert("Gagal menambahkan produk ke keranjang");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm font-medium">Memuat produk...</div>;
  if (products.length === 0) return <div className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm font-medium">Belum ada produk yang tersedia saat ini.</div>;
  if (filteredProducts.length === 0) return <div className="text-center py-10 text-sm text-slate-500">Produk tidak ditemukan</div>;

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

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
        {searchLoading
          ? Array.from({ length: 10 }).map((_, idx) => <SkeletonCard key={idx} />)
          : filteredProducts.map((p) => {
            const currentVariantId = selectedVariants[p.id];
            const currentVariant = p.variants.find(v => v.id === currentVariantId) || p.variants[0];
            const price = currentVariant ? currentVariant.base_price : 0;
            const stock = currentVariant ? currentVariant.stock : 0;

            return (
              <div key={p.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                {/* IMAGE */}
                <Link href={`/products/${p.slug}`}>
                  <div className="aspect-square overflow-hidden bg-slate-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                    )}
                  </div>
                </Link>

                {/* CONTENT */}
                <div className="p-2 sm:p-3 flex flex-col flex-1">
                  <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">{p.category}</span>

                  <Link href={`/products/${p.slug}`} title={p.name}>
                    <h2 className="text-[12px] sm:text-sm font-semibold line-clamp-2 leading-snug hover:text-emerald-600 transition">{p.name}</h2>
                  </Link>

                  {p.description && <p className="hidden sm:block text-[11px] text-slate-500 line-clamp-2 mt-1">{p.description}</p>}

                  {/* SELECTOR VARIANT KALAU VARIANTNYA LEBIH DARI 1 */}
                  {p.variants.length > 1 && (
                    <div className="mt-2">
                      <select
                        value={currentVariantId || ""}
                        onChange={(e) => setSelectedVariants({ ...selectedVariants, [p.id]: e.target.value })}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-md p-1 outline-none text-slate-700"
                      >
                        {p.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.variant_name} {v.stock === 0 ? "(Habis)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* PUSH BOTTOM */}
                  <div className="mt-auto pt-2 sm:pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-emerald-600 font-bold text-[12px] sm:text-sm">
                        Rp {price.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">
                        Stok: {stock}
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-1.5 sm:gap-2 mt-2">
                      <Button
                        variant="outline"
                        disabled={stock === 0 || addingToCart === currentVariantId}
                        onClick={() => handleAddToCart(p)}
                        className="flex-1 h-7 sm:h-8 text-[10px] sm:text-[11px] rounded-lg px-2"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        {addingToCart === currentVariantId ? "..." : "Cart"}
                      </Button>

                      <Button
                        disabled={stock === 0}
                        onClick={() => {
                          handleAddToCart(p);
                          router.push("/carts");
                        }}
                        className="flex-1 h-7 sm:h-8 text-[10px] sm:text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 text-white"
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}