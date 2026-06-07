"use client";

import {
    ChevronRight,
    PackageCheck,
} from "lucide-react";

const orders = [
    {
        id: "INV-20260806-001",
        status: "processed",
        total: 154000,
        created_at: "6 Agustus 2026",
        items: [
            {
                name: "Serum Brightening Glow",
                variant: "30ml",
                qty: 2,
                price: 32000,
                image:
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop",
            },
            {
                name: "Oversize Hoodie Premium",
                variant: "Size L",
                qty: 1,
                price: 90000,
                image:
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
            },
        ],
    },

    {
        id: "INV-20260805-002",
        status: "completed",
        total: 145000,
        created_at: "5 Agustus 2026",
        items: [
            {
                name: "Wireless Earbuds Pro",
                variant: "Black",
                qty: 1,
                price: 145000,
                image:
                    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1200&auto=format&fit=crop",
            },
        ],
    },
];

const statusConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    pending: {
        label: "Pending",
        className:
            "bg-slate-100 text-slate-600",
    },

    waiting_payment: {
        label: "Menunggu Pembayaran",
        className:
            "bg-yellow-100 text-yellow-700",
    },

    paid: {
        label: "Sudah Dibayar",
        className:
            "bg-blue-100 text-blue-700",
    },

    processed: {
        label: "Diproses",
        className:
            "bg-orange-100 text-orange-700",
    },

    shipped: {
        label: "Dikirim",
        className:
            "bg-purple-100 text-purple-700",
    },

    completed: {
        label: "Selesai",
        className:
            "bg-emerald-100 text-emerald-700",
    },

    cancelled: {
        label: "Dibatalkan",
        className:
            "bg-red-100 text-red-700",
    },
};

export default function OrdersPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-5">

            {/* HEADER */}
            <div className="mb-5">
                <h1 className="text-2xl font-black text-slate-900">
                    Pesanan Saya
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                    Semua transaksi pesanan kamu.
                </p>
            </div>

            {/* LIST */}
            <div className="space-y-4">

                {orders.map((order) => {
                    const status =
                        statusConfig[order.status];

                    return (
                        <div
                            key={order.id}
                            className="
                                bg-white
                                border border-slate-200
                                rounded-2xl
                                overflow-hidden
                            "
                        >

                            {/* TOP */}
                            <div
                                className="
                                    px-4 py-3
                                    border-b
                                    bg-slate-50
                                    flex
                                    flex-col
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    gap-3
                                "
                            >

                                <div>
                                    <div className="text-xs text-slate-500">
                                        Invoice
                                    </div>

                                    <div className="font-bold text-sm text-slate-900">
                                        {order.id}
                                    </div>

                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {order.created_at}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">

                                    <div
                                        className={`
                                            px-2.5 py-1
                                            rounded-full
                                            text-[11px]
                                            font-semibold
                                            ${status.className}
                                        `}
                                    >
                                        {status.label}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[11px] text-slate-500">
                                            Total
                                        </div>

                                        <div className="text-sm font-black text-emerald-600">
                                            Rp{" "}
                                            {order.total.toLocaleString("id-ID")}
                                        </div>
                                    </div>

                                </div>

                            </div>

                            {/* ITEMS */}
                            <div className="divide-y">

                                {order.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="
                                                p-4
                                                flex
                                                gap-3
                                            "
                                        >

                                            {/* IMAGE */}
                                            <div
                                                className="
                                                    w-16 h-16
                                                    rounded-xl
                                                    overflow-hidden
                                                    border
                                                    shrink-0
                                                    bg-slate-100
                                                "
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* CONTENT */}
                                            <div className="flex-1 min-w-0">

                                                <h2
                                                    className="
                                                        text-sm
                                                        font-semibold
                                                        text-slate-900
                                                        line-clamp-2
                                                    "
                                                >
                                                    {item.name}
                                                </h2>

                                                <div className="text-xs text-slate-500 mt-1">
                                                    Variant: {item.variant}
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    Qty: {item.qty}
                                                </div>

                                            </div>

                                            {/* PRICE */}
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-bold text-emerald-600">
                                                    Rp{" "}
                                                    {item.price.toLocaleString(
                                                        "id-ID"
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                            {/* FOOTER */}
                            <div
                                className="
                                    px-4 py-3
                                    border-t
                                    flex
                                    items-center
                                    justify-between
                                    bg-white
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    <PackageCheck className="w-4 h-4" />

                                    Status pesanan aktif
                                </div>

                                <button
                                    className="
                                        h-9
                                        px-3
                                        rounded-xl
                                        border
                                        text-xs
                                        font-medium
                                        hover:bg-slate-50
                                        transition
                                        flex
                                        items-center
                                        gap-1.5
                                    "
                                >
                                    Detail

                                    <ChevronRight className="w-4 h-4" />
                                </button>

                            </div>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}