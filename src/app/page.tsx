"use client";

import Link from "next/link";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  category: string;
  price: number;
  stock: number;
}

const { data } = await supabase
  .from('products')
  .select(`
    id, name, slug, description, image_url,
    product_categories(name),
    product_variants(
      base_price,
      inventory_stocks(qty)
    )
  `)
  .order('id', { ascending: false })

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const [searchLoading, setSearchLoading] =
    useState(false);

  const searchQuery =
    searchParams.get("search")?.toLowerCase() || "";

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
            base_price,
            inventory_stocks ( qty )
          )
        `)
        .eq("is_active", true);

      if (error) throw error;

      if (data) {
        const formattedProducts: Product[] = data.map((p: any) => {
          const totalStock = p.product_variants?.reduce((prodAcc: number, variant: any) => {
            const variantStock = variant.inventory_stocks?.reduce((variantAcc: number, stock: any) => {
              return variantAcc + (stock.qty || 0);
            }, 0) || 0;
            return prodAcc + variantStock;
          }, 0) || 0;

          const defaultPrice = Number(p.product_variants?.[0]?.base_price || 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            image_url: p.image_url,
            category: p.product_categories?.name || "Uncategorized",
            price: defaultPrice,
            stock: totalStock,
          };
        });

        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-slate-500 text-sm font-medium">
        Memuat produk...
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

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-500">
        Produk tidak ditemukan
      </div>
    );
  }

  const SkeletonCard = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
        {/* IMAGE */}
        <div className="aspect-square bg-slate-200" />

        {/* CONTENT */}
        <div className="p-3 space-y-3">
          <div className="h-3 w-16 bg-slate-200 rounded" />

          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>

          <div className="h-3 w-full bg-slate-200 rounded" />

          <div className="flex justify-between pt-2">
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-10 bg-slate-200 rounded" />
          </div>

          <div className="flex gap-2">
            <div className="h-8 flex-1 bg-slate-200 rounded-lg" />
            <div className="h-8 flex-1 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* GRID RESPONSIVE */}
      <div
        className="
                grid
                grid-cols-2
                sm:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
                gap-2.5
                sm:gap-4
            "
      >
        {searchLoading
          ? Array.from({ length: 10 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))
          : filteredProducts.map((p) => (
            <div
              key={p.id}
              className="
                            group
                            bg-white
                            border border-slate-200
                            rounded-xl
                            overflow-hidden
                            shadow-sm
                            hover:shadow-md
                            transition
                            flex flex-col
                        "
            >
              {/* IMAGE */}
              <Link href={`/products/${p.slug}`}>
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
              </Link>

              {/* CONTENT */}
              <div className="p-2 sm:p-3 flex flex-col flex-1">
                {/* CATEGORY */}
                <span className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">
                  {p.category}
                </span>

                {/* TITLE */}
                <Link href={`/products/${p.slug}`} title={p.name}>
                  <h2
                    className="
                                    text-[12px] sm:text-sm
                                    font-semibold
                                    line-clamp-2
                                    leading-snug
                                    hover:text-emerald-600
                                    transition
                                "
                  >
                    {p.name}
                  </h2>
                </Link>

                {/* DESC (hidden di mobile kecil biar hemat space) */}
                {p.description && (
                  <p className="hidden sm:block text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {p.description}
                  </p>
                )}

                {/* PUSH BOTTOM */}
                <div className="mt-auto pt-2 sm:pt-3">
                  {/* PRICE + STOCK */}
                  <div className="flex items-center justify-between">
                    <div className="text-emerald-600 font-bold text-[12px] sm:text-sm">
                      Rp {p.price.toLocaleString("id-ID")}
                    </div>

                    <div className="text-[9px] sm:text-[10px] text-slate-400">
                      {p.stock}
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-1.5 sm:gap-2 mt-2">
                    <Button
                      variant="outline"
                      disabled={p.stock === 0}
                      className="flex-1 h-7 sm:h-8 text-[10px] sm:text-[11px] rounded-lg px-2"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Cart
                    </Button>

                    <Button
                      disabled={p.stock === 0}
                      className="flex-1 h-7 sm:h-8 text-[10px] sm:text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 text-white"
                    >
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}