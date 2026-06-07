"use client";

import Link from "next/link";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
} from "lucide-react";

const dummyProducts = [
    {
        id: 1,
        image:
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop",
        name: "Serum Brightening Glow",
        category: "Skincare",
        variant: "30ml",
        stock: 24,
        price: 32000,
        active: true,
    },
    {
        id: 2,
        image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
        name: "Oversize Hoodie Premium",
        category: "Fashion",
        variant: "Size L",
        stock: 12,
        price: 90000,
        active: true,
    },
    {
        id: 3,
        image:
            "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1200&auto=format&fit=crop",
        name: "Wireless Earbuds Pro",
        category: "Elektronik",
        variant: "Black",
        stock: 0,
        price: 145000,
        active: false,
    },
];

export default function AdminProductsPage() {

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

                <button
                    className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 transition"
                >
                    <Plus className="w-4 h-4" />

                    Tambah Produk
                </button>

            </div>

            {/* FILTER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">

                <div className="relative">

                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                    <input
                        type="text"
                        placeholder="Cari produk..."
                        className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                </div>

            </div>

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

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

                            {dummyProducts.map((product) => (

                                <tr
                                    key={product.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                                >

                                    {/* PRODUCT */}
                                    <td className="px-6 py-4">

                                        <div className="flex items-center gap-4">

                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">

                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />

                                            </div>

                                            <div>

                                                <div className="font-semibold text-slate-900">
                                                    {product.name}
                                                </div>

                                                <div className="text-sm text-slate-500 mt-1">
                                                    Product ID #{product.id}
                                                </div>

                                            </div>

                                        </div>

                                    </td>

                                    {/* CATEGORY */}
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        {product.category}
                                    </td>

                                    {/* VARIANT */}
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        {product.variant}
                                    </td>

                                    {/* STOCK */}
                                    <td className="px-6 py-4">

                                        <div
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold
                                                
                                                ${product.stock > 0
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-600"
                                                }
                                            `}
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} pcs`
                                                : "Habis"}
                                        </div>

                                    </td>

                                    {/* PRICE */}
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">

                                        Rp{" "}
                                        {product.price.toLocaleString("id-ID")}

                                    </td>

                                    {/* STATUS */}
                                    <td className="px-6 py-4">

                                        <div
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold
                                                
                                                ${product.active
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-slate-200 text-slate-600"
                                                }
                                            `}
                                        >
                                            {product.active
                                                ? "Active"
                                                : "Inactive"}
                                        </div>

                                    </td>

                                    {/* ACTION */}
                                    <td className="px-6 py-4">

                                        <div className="flex items-center justify-end gap-2">

                                            <button
                                                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center transition"
                                            >
                                                <Pencil className="w-4 h-4 text-slate-700" />
                                            </button>

                                            <button
                                                className="w-10 h-10 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center transition"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}