"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Truck,
  Store,
  Boxes,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Truck,
    title: "Distribusi Cepat",
    desc: "Pengiriman produk lebih cepat dan efisien ke seluruh mitra di berbagai daerah.",
  },
  {
    icon: Boxes,
    title: "Stok Terintegrasi",
    desc: "Monitoring stok real-time dengan sistem modern yang stabil dan akurat.",
  },
  {
    icon: Store,
    title: "Jaringan Mitra Luas",
    desc: "Perluas bisnis dengan jaringan kemitraan toko yang terpercaya.",
  },
];

const stats = [
  { value: "15K+", label: "Produk Aktif" },
  { value: "2.5K+", label: "Mitra Ritel" },
  { value: "50+", label: "Armada Pengiriman" },
  { value: "24/7", label: "Layanan Admin" },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-950 via-[#052e1f] to-emerald-900 text-white">

      {/* ── Dekorasi Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Glow emerald kiri atas */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        {/* Glow hijau kanan bawah */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-green-400/10 blur-3xl" />
        {/* Glow kecil tengah */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative container mx-auto flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-24 text-center">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-200 backdrop-blur-sm shadow-lg shadow-emerald-900/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Platform Distribusi Modern
        </div>

        {/* Heading */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-4xl">
          Distribusi Lebih Cepat,
          <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent">
            Untung Lebih Besar
          </span>
        </h1>

        {/* Deskripsi */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-300">
          Kelola distribusi produk, stok, dan kemitraan toko dalam satu platform
          modern yang cepat, aman, dan efisien.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none">
          <Link href="/kemitraan" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="group w-full sm:w-auto bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Gabung Kemitraan
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/products" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all"
            >
              Lihat Produk
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 w-full max-w-3xl">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="relative container mx-auto px-4 sm:px-6 pb-24 pt-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Kenapa Memilih <span className="text-emerald-400">DinaraMart</span>?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Solusi lengkap untuk kebutuhan distribusi dan kemitraan bisnis Anda.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="group relative border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <CardContent className="p-6 sm:p-7 relative z-10">
                {/* Glow ikon */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-5 w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="relative container mx-auto px-4 sm:px-6 pb-24">
        <div className="relative max-w-4xl mx-auto rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-600/20 via-emerald-800/10 to-transparent backdrop-blur-sm p-8 sm:p-12 text-center overflow-hidden">
          {/* Dekorasi dalam */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-green-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Mulai Hari Ini</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
              Siap Mengembangkan Bisnis Distribusi Anda?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-xl mx-auto">
              Bergabung sebagai mitra DinaraMart dan nikmati berbagai keuntungan eksklusif untuk bisnis Anda.
            </p>
            <Link href="/kemitraan" className="inline-block mt-8">
              <Button
                size="lg"
                className="group bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
              >
                Daftar Sekarang
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
