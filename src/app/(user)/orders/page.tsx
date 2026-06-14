"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
} from "lucide-react";

// Tipe data untuk dokumentasi komponen yang lebih bersih
interface OrderItem {
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  status:
    | "pending"
    | "waiting_payment"
    | "paid"
    | "processed"
    | "shipped"
    | "completed"
    | "cancelled";
  total: number;
  created_at: string;
  items: OrderItem[];
}

const orders: Order[] = [
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
    status: "waiting_payment",
    total: 145000,
    created_at: "5 Agustus 2026",
    items: [
      {
        name: "Wireless Earbuds Pro",
        variant: "Hitam",
        qty: 1,
        price: 145000,
        image:
          "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "INV-20260804-003",
    status: "completed",
    total: 85000,
    created_at: "4 Agustus 2026",
    items: [
      {
        name: "Kacamata Anti Radiasi",
        variant: "Matte Black",
        qty: 1,
        price: 85000,
        image:
          "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
];

// Konfigurasi status yang kaya akan konteks UX (Warna, Label, Ikon, dan Catatan kaki)
// 1. Definisikan tipe untuk masing-masing item konfigurasi status
interface StatusItemConfig {
  label: string;
  className: string;
  icon: React.ReactNode;
  footerNote: string;
  actionButton?: string; // Menggunakan '?' berarti opsional
  primaryAction?: boolean; // Menggunakan '?' berarti opsional
}

// 2. Tentukan bahwa statusConfig adalah objek dengan key berupa status order
const statusConfig: Record<Order["status"], StatusItemConfig> = {
  pending: {
    label: "Menunggu Konfirmasi",
    className: "bg-slate-50 text-slate-600 border border-slate-200",
    icon: <Clock className="w-3.5 h-3.5" />,
    footerNote: "Pesanan Anda sedang dikonfirmasi oleh penjual.",
  },
  waiting_payment: {
    label: "Menunggu Pembayaran",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <CreditCard className="w-3.5 h-3.5" />,
    footerNote: "Segera selesaikan pembayaran sebelum batas waktu habis.",
    actionButton: "Bayar Sekarang",
    primaryAction: true,
  },
  paid: {
    label: "Sudah Dibayar",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    footerNote: "Pembayaran berhasil diverifikasi.",
  },
  processed: {
    label: "Sedang Diproses",
    className: "bg-orange-50 text-orange-700 border border-orange-200",
    icon: <Package className="w-3.5 h-3.5" />,
    footerNote: "Penjual sedang mengemas produk Anda.",
  },
  shipped: {
    label: "Sedang Dikirim",
    className: "bg-purple-50 text-purple-700 border border-purple-200",
    icon: <Truck className="w-3.5 h-3.5" />,
    footerNote: "Paket berada dalam perjalanan bersama kurir.",
    actionButton: "Lacak Kurir",
    primaryAction: true,
  },
  completed: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    footerNote: "Transaksi selesai. Terima kasih telah berbelanja!",
    actionButton: "Beli Lagi",
    primaryAction: false,
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
    footerNote: "Pesanan ini telah dibatalkan.",
  },
};

// Kategori Tab Filter untuk menyaring pesanan (UX Best Practice)
const tabs = [
  { id: "all", label: "Semua" },
  { id: "progress", label: "Berlangsung" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Logika filter pesanan berdasarkan Tab aktif
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return order.status === "completed";
    if (activeTab === "cancelled") return order.status === "cancelled";
    if (activeTab === "progress") {
      return [
        "pending",
        "waiting_payment",
        "paid",
        "processed",
        "shipped",
      ].includes(order.status);
    }
    return true;
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8 antialiased text-slate-900">
      {/* HEADER UTAMA */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Daftar Transaksi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pantau status pengiriman dan riwayat belanja Anda di sini.
        </p>
      </div>

      {/* TABS FILTER (Responsif & Mudah Di-scroll pada Mobile) */}
      <div className="mb-6 border-b border-slate-200 overflow-x-auto flex scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-6 min-w-full sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 text-sm font-medium transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-emerald-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR PESANAN CARD */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          // Empty State jika filter kosong
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              Tidak ada transaksi ditemukan
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status];

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md/5 transition-all duration-200 overflow-hidden"
              >
                {/* BAGIAN ATAS (Metadata Transaksi) */}
                <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs font-bold text-slate-700 tracking-wide">
                      {order.id}
                    </span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-xs text-slate-500">
                      {order.created_at}
                    </span>
                  </div>

                  {/* Badge Status Pesanan */}
                  <div
                    className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
                  >
                    {config.icon}
                    {config.label}
                  </div>
                </div>

                {/* DAFTAR BARANG/ITEMS */}
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, index) => (
                    <div key={index} className="p-4 flex gap-4 items-start">
                      {/* Thumbnail Produk */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Detail Informasi Produk */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {item.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-500">
                          {item.variant && (
                            <>
                              <span>
                                Varian:{" "}
                                <strong className="text-slate-700 font-medium">
                                  {item.variant}
                                </strong>
                              </span>
                              <span className="text-slate-300">|</span>
                            </>
                          )}
                          <span>
                            Jumlah:{" "}
                            <strong className="text-slate-700 font-medium">
                              {item.qty}
                            </strong>
                          </span>
                        </div>

                        {/* Kalkulasi Harga Per Item yang Jelas */}
                        <div className="text-xs text-slate-400 mt-1 sm:hidden">
                          Rp {item.price.toLocaleString("id-ID")} x {item.qty}
                        </div>
                      </div>

                      {/* Harga Sisi Kanan (Desktop View) */}
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="text-xs text-slate-400 mb-0.5">
                          Harga Satuan
                        </div>
                        <div className="text-sm font-semibold text-slate-800">
                          Rp {item.price.toLocaleString("id-ID")}
                        </div>
                        {item.qty > 1 && (
                          <div className="text-[11px] text-slate-400 italic">
                            (Total: Rp{" "}
                            {(item.price * item.qty).toLocaleString("id-ID")})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* BAGIAN BAWAH (Ringkasan Total & CTA Utama) */}
                <div className="px-4 py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Informasi Status Dinamis */}
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{config.footerNote}</span>
                  </div>

                  {/* Total Belanja & Aksi */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div>
                      <div className="text-[11px] text-slate-400 text-left sm:text-right">
                        Total Belanja
                      </div>
                      <div className="text-base font-black text-emerald-600">
                        Rp {order.total.toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tombol Aksi Sekunder (Detail Selalu Ada) */}
                      <button className="h-9 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition flex items-center gap-1">
                        Detail
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Tombol Aksi Utama Berdasarkan Konteks Status */}
                      {config.actionButton && (
                        <button
                          className={`h-9 px-4 rounded-xl text-xs font-bold transition shadow-sm ${
                            config.primaryAction
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {config.actionButton}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
