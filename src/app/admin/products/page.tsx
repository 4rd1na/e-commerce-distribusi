"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    is_active: boolean;
    created_at: string;

    product_categories:
    | {
        name: string;
    }
    | {
        name: string;
    }[]
    | null;

    product_variants: {
        id: string;
        variant_name: string;
        base_price: number;

        inventory_stocks: {
            qty: number;
        }[];
    }[];
}

export default function AdminProductsPage() {

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
                    image_url,
                    is_active,
                    created_at,

                    product_categories (
                        name
                    ),

                    product_variants (
                        id,
                        variant_name,
                        base_price,

                        inventory_stocks (
                            qty
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setProducts(data || []);

        } catch (error) {

            console.error("Gagal mengambil produk:", error);

        } finally {

            setLoading(false);

        }

    };

    const handleDelete = async (id: string) => {

        const confirmDelete = confirm(
            "Yakin ingin menghapus produk ini?"
        );

        if (!confirmDelete) return;

        try {

            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setProducts((prev) =>
                prev.filter((item) => item.id !== id)
            );

        } catch (error) {

            console.error("Gagal menghapus produk:", error);

        }

    };

    const filteredProducts = products.filter((product) =>
        product.name
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-black text-slate-900">
                        Products
                    </h1>

                    <p className="text-sm text-slate-500 mt-1">
                        Kelola semua produk toko.
                    </p>

                </div>

                <Link href="/admin/products/create">

                    <button
                        className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" />

                        Tambah Produk
                    </button>

                </Link>

            </div>

            {/* FILTER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="relative">

                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                    <input
                        type="text"
                        placeholder="Cari produk..."
                        className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

            </div>

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px]">

                        <thead className="bg-slate-50 border-b border-slate-200">

                            <tr className="text-left">

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Produk
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Kategori
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Variant
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Stock
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Harga
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan={7}
                                        className="px-6 py-10 text-center text-sm text-slate-500"
                                    >
                                        Memuat produk...
                                    </td>

                                </tr>

                            ) : filteredProducts.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={7}
                                        className="px-6 py-10 text-center text-sm text-slate-500"
                                    >
                                        Produk tidak ditemukan.
                                    </td>

                                </tr>

                            ) : (

                                filteredProducts.map((product) => {

                                    const firstVariant =
                                        product.product_variants?.[0];

                                    const totalStock =
                                        product.product_variants?.reduce(
                                            (acc, variant) => {

                                                const variantStock =
                                                    variant.inventory_stocks?.reduce(
                                                        (stockAcc, stock) =>
                                                            stockAcc + stock.qty,
                                                        0
                                                    ) || 0;

                                                return acc + variantStock;

                                            },
                                            0
                                        ) || 0;

                                    return (

                                        <tr
                                            key={product.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition"
                                        >

                                            {/* PRODUCT */}
                                            <td className="px-6 py-4">

                                                <div className="flex items-center gap-4">

                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">

                                                        {product.image_url ? (

                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />

                                                        ) : (

                                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                                                No Image
                                                            </div>

                                                        )}

                                                    </div>

                                                    <div>

                                                        <div className="font-semibold text-slate-900 line-clamp-1">
                                                            {product.name}
                                                        </div>

                                                        <div className="text-sm text-slate-500 mt-1">
                                                            Product ID #
                                                            {product.id.slice(0, 8)}
                                                        </div>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* CATEGORY */}
                                            <td className="px-6 py-4 text-sm text-slate-700">

                                                {Array.isArray(product.product_categories)
                                                    ? product.product_categories[0]?.name || "-"
                                                    : product.product_categories?.name || "-"}

                                            </td>

                                            {/* VARIANT */}
                                            <td className="px-6 py-4 text-sm text-slate-700">

                                                {firstVariant?.variant_name || "-"}

                                                {product.product_variants.length > 1 && (
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        +{product.product_variants.length - 1} variant
                                                    </div>
                                                )}

                                            </td>

                                            {/* STOCK */}
                                            <td className="px-6 py-4">

                                                <div
                                                    className={`
                                                        inline-flex px-3 py-1 rounded-full text-xs font-semibold

                                                        ${totalStock > 0
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-red-100 text-red-600"
                                                        }
                                                    `}
                                                >

                                                    {totalStock > 0
                                                        ? `${totalStock} pcs`
                                                        : "Habis"}

                                                </div>

                                            </td>

                                            {/* PRICE */}
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">

                                                Rp{" "}

                                                {Number(
                                                    firstVariant?.base_price || 0
                                                ).toLocaleString("id-ID")}

                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">

                                                <div
                                                    className={`
                                                        inline-flex px-3 py-1 rounded-full text-xs font-semibold

                                                        ${product.is_active
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-slate-200 text-slate-600"
                                                        }
                                                    `}
                                                >

                                                    {product.is_active
                                                        ? "Active"
                                                        : "Inactive"}

                                                </div>

                                            </td>

                                            {/* ACTION */}
                                            <td className="px-6 py-4">

                                                <div className="flex items-center justify-end gap-2">

                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                    >

                                                        <button
                                                            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center transition"
                                                        >
                                                            <Pencil className="w-4 h-4 text-slate-700" />
                                                        </button>

                                                    </Link>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(product.id)
                                                        }
                                                        className="w-10 h-10 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center transition"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                })

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}