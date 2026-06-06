"use client";

import React, { useState } from "react";
import { MOCK_WAREHOUSES, MOCK_INVENTORY } from "../../data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminStokPage() {
    // State simulasi untuk mencatat log return baru
    const [returnType, setReturnType] = useState<"pembelian" | "penjualan">("pembelian");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [returnQty, setReturnQty] = useState(1);
    const [notes, setNotes] = useState("");

    const handleSimpanReturn = (e: React.FormEvent) => {
        e.preventDefault();
        // Di sini nanti diisi fungsi insert ke tabel 'returns' Supabase
        alert(`Log Return Berhasil Disimpan!\nTipe: ${returnType}\nQty: ${returnQty}\nKeterangan: ${notes}`);
        // Reset form
        setNotes("");
        setReturnQty(1);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8">
            {/* Header Halaman */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Logistik</h1>
                <p className="text-muted-foreground">Manajemen Multi-Gudang, Stok Tersedia, dan Form Return Barang.</p>
            </div>

            {/* SEKSI 1: TABEL STOK MULTI GUDANG */}
            <Card>
                <CardHeader>
                    <CardTitle>Status Stok Produk</CardTitle>
                    <CardDescription>Daftar kuantitas produk yang tersebar di beberapa lokasi gudang fisik.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Variasi</TableHead>
                                {MOCK_WAREHOUSES.map((wh) => (
                                    <TableHead key={wh.id} className="text-center">{wh.name}</TableHead>
                                ))}
                                <TableHead className="text-center font-bold bg-slate-50">Total Stok</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_INVENTORY.map((item) => {
                                // Hitung total stok dari seluruh gudang
                                const totalStok = Object.values(item.stocks).reduce((a, b) => a + b, 0);

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.product_name}</TableCell>
                                        <TableCell>{item.variant_name ? <Badge variant="outline">{item.variant_name}</Badge> : "-"}</TableCell>

                                        {/* Render stok per gudang secara dinamis */}
                                        {MOCK_WAREHOUSES.map((wh) => {
                                            const stokGudang = item.stocks[wh.id] || 0;
                                            return (
                                                <TableCell key={wh.id} className="text-center">
                                                    {stokGudang === 0 && item.variant_name === null ? (
                                                        <span className="text-slate-400 text-xs">N/A (Jasa)</span>
                                                    ) : (
                                                        stokGudang
                                                    )}
                                                </TableCell>
                                            );
                                        })}

                                        {/* Total Stok Kolom */}
                                        <TableCell className="text-center font-bold bg-slate-50/50 text-emerald-600">
                                            {item.variant_name === null ? "-" : totalStok}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* SEKSI 2: FORM RETURN BARANG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Form Return Stok</CardTitle>
                        <CardDescription>Pencatatan sirkulasi barang masuk/keluar akibat return.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSimpanReturn} className="space-y-4">

                            {/* Pilihan Tipe Return */}
                            <div>
                                <Label className="text-xs font-semibold mb-2 block">Jenis Return</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant={returnType === "pembelian" ? "default" : "outline"}
                                        onClick={() => setReturnType("pembelian")}
                                        className="text-xs"
                                    >
                                        Pembelian (Stok ⬇️)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={returnType === "penjualan" ? "default" : "outline"}
                                        onClick={() => setReturnType("penjualan")}
                                        className="text-xs"
                                    >
                                        Penjualan (Stok ⬆️)
                                    </Button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {returnType === "pembelian"
                                        ? "* Sesuai aturan: Return Pembelian mengurangi stok gudang kita."
                                        : "* Sesuai aturan: Return Penjualan menambah kembali stok gudang kita."}
                                </p>
                            </div>

                            {/* Pilihan Produk */}
                            <div>
                                <Label htmlFor="produk" className="text-xs font-semibold">Pilih Produk & Variasi</Label>
                                <select
                                    id="produk"
                                    className="w-full mt-1 p-2 bg-white rounded-md border border-slate-200 text-sm"
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {MOCK_INVENTORY.filter(i => i.variant_name !== null).map((i) => (
                                        <option key={i.id} value={i.id}>{i.product_name} ({i.variant_name})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pilihan Gudang */}
                            <div>
                                <Label htmlFor="gudang" className="text-xs font-semibold">Lokasi Gudang</Label>
                                <select
                                    id="gudang"
                                    className="w-full mt-1 p-2 bg-white rounded-md border border-slate-200 text-sm"
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Gudang Tujuan --</option>
                                    {MOCK_WAREHOUSES.map((wh) => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Kuantitas Return */}
                            <div>
                                <Label htmlFor="qty-return" className="text-xs font-semibold">Jumlah Kuantitas (Qty)</Label>
                                <Input
                                    id="qty-return"
                                    type="number"
                                    min={1}
                                    value={returnQty}
                                    onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            {/* Form Keterangan Alasan Return */}
                            <div>
                                <Label htmlFor="notes" className="text-xs font-semibold">Keterangan / Alasan Return</Label>
                                <textarea
                                    id="notes"
                                    placeholder="Contoh: Barang cacat produksi / Salah kirim ukuran..."
                                    className="w-full mt-1 p-2 bg-white rounded-md border border-slate-200 text-sm min-h-[80px]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white">
                                Submit Log Return
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* COL-SPAN 2: TRIVIA / LOG AKTIVITAS TERBARU (Opsional untuk Mempercantik Dashboard) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Aturan Logika Bisnis (Validasi)</CardTitle>
                        <CardDescription>Rangkuman operasional logistik gudang saat ini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold text-slate-800 mb-1">💡 Info Sinkronisasi Otomatis</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Tabel di atas mengombinasikan data dari relasi unik <code className="bg-slate-200 px-1 rounded">UNIQUE(product_id, variant_id, warehouse_id)</code> pada database Anda. Ketika form di sebelah kiri disubmit, sistem backend Supabase Anda di fase berikutnya akan memicu pembaruan berkala nilai kuantitas di masing-masing kolom gudang.
                            </p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-800 mb-1">⚠️ Aturan Produk bertipe Jasa</h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Produk berjenis <strong>"Jasa"</strong> (seperti Desain Grafis atau Pembuatan Website) secara otomatis dikecualikan dari kalkulasi stok fisik dan tidak dapat di-return karena tidak memiliki wujud fisik di Gudang A maupun Gudang B.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}