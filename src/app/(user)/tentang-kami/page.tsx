"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShoppingBag,
  Users,
  Target,
  Heart,
  Handshake,
  ShieldCheck,
  TrendingUp,
  Mail,
  ChevronRight,
} from "lucide-react";

const nilaiNilai = [
  {
    icon: Handshake,
    title: "Kepercayaan",
    desc: "Menjaga kejujuran dan transparansi dalam setiap transaksi dengan mitra maupun pelanggan.",
  },
  {
    icon: TrendingUp,
    title: "Kemudahan",
    desc: "Menyediakan platform yang intuitif dan mudah digunakan oleh semua kalangan.",
  },
  {
    icon: ShieldCheck,
    title: "Kualitas",
    desc: "Memastikan setiap produk yang didistribusikan memenuhi standar mutu terbaik.",
  },
  {
    icon: Heart,
    title: "Kemitraan",
    desc: "Membangun hubungan jangka panjang yang saling menguntungkan bersama seluruh mitra.",
  },
];

const faqData = [
  {
    q: "Apa itu DinaraMart?",
    a: "DinaraMart adalah platform distribusi produk terpercaya yang menghubungkan produsen, reseller, dan konsumen dalam satu ekosistem digital yang mudah dan transparan.",
  },
  {
    q: "Bagaimana cara mendaftar sebagai mitra?",
    a: "Klik tombol \"Menjadi Mitra\" di halaman utama atau kunjungi halaman Kemitraan setelah login. Isi formulir pendaftaran dan tim kami akan menghubungi Anda untuk proses verifikasi.",
  },
  {
    q: "Apakah ada minimum order untuk pembelian?",
    a: "Tidak ada minimum order khusus. Anda bisa berbelanja mulai dari 1 pcs. Untuk mitra reseller, tersedia harga khusus yang berlaku otomatis berdasarkan level akun Anda.",
  },
  {
    q: "Bagaimana sistem harga yang berlaku?",
    a: "Harga di DinaraMart disesuaikan otomatis berdasarkan level akun Anda — konsumen, silver, reseller, atau VIP. Semakin tinggi level, semakin besar diskon yang Anda dapatkan.",
  },
  {
    q: "Metode pembayaran apa yang tersedia?",
    a: "Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet, dan metode pembayaran digital lainnya yang tersedia di platform.",
  },
  {
    q: "Berapa lama proses pengiriman?",
    a: "Waktu pengiriman bervariasi tergantung lokasi. Untuk area Jawa Timur biasanya 1-2 hari kerja, dan luar Jawa 3-5 hari kerja. Anda bisa memantau status pesanan di halaman Pesanan Saya.",
  },
];

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO SECTION ── */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900" />
        <div className="relative container mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Tentang <span className="text-emerald-400">DinaraMart</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Platform distribusi produk terpercaya di Indonesia. Menghubungkan produsen dan konsumen dengan kemudahan bertransaksi, harga bersaing, dan layanan terbaik.
          </p>
        </div>
      </section>

      {/* ── SIAPA KAMI ── */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Siapa Kami</h2>
          </div>
          <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              DinaraMart hadir sebagai solusi distribusi produk modern yang menghubungkan produsen langsung ke tangan konsumen melalui platform digital yang mudah digunakan.
            </p>
            <p>
              Berbasis di Jawa Timur, kami melayani ribuan pelanggan dari berbagai kalangan — mulai dari konsumen rumah tangga, reseller, hingga mitra bisnis yang tersebar di seluruh Indonesia.
            </p>
            <p>
              Dengan sistem harga bertingkat yang transparan, setiap pelanggan mendapatkan harga terbaik sesuai level keanggotaan mereka, tanpa perlu negosiasi rumit.
            </p>
          </div>
        </div>
      </section>

      {/* ── VISI & MISI ── */}
      <section className="bg-slate-50">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Visi & Misi</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Visi */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Visi</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Menjadi platform distribusi produk terdepan di Indonesia yang memberdayakan UMKM dan memberikan pengalaman berbelanja terbaik bagi seluruh pelanggan.
                </p>
              </div>

              {/* Misi */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Misi</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    Menyediakan platform yang mudah dan transparan
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    Memberikan harga bersaing untuk semua level
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    Membangun kemitraan yang saling menguntungkan
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    Menjamin kualitas produk dan layanan terbaik
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NILAI-NILAI ── */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Nilai-Nilai Kami</h2>
            <p className="text-sm pb-4 text-slate-500">Prinsip yang kami pegang dalam setiap langkah bisnis.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nilaiNilai.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA MENJADI MITRA ── */}
      <section className="bg-emerald-600">
        <div className="container mx-auto px-4 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Tertarik Menjadi Mitra?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-xl pb-2 mx-auto mb-8 leading-relaxed">
            Bergabunglah sebagai mitra DinaraMart dan nikmati harga spesial, prioritas stok, serta dukungan bisnis langsung dari kami.
          </p>
          <Link href="/kemitraan">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl pl-4 h-12 text-sm shadow-lg shadow-emerald-700/20">
              Daftar Kemitraan
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm text-slate-500 pb-2">Jawaban untuk pertanyaan umum seputar DinaraMart.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-500 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── HUBUNGI KAMI ── */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
              Punya Pertanyaan?
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Jangan ragu untuk menghubungi kami. Tim support akan merespons secepat mungkin.
            </p>
            <a href="mailto:support@dinaramart.com">
              <Button
                variant="outline"
                className="rounded-xl px-6 h-11 text-sm font-semibold border-slate-300 text-slate-700 hover:text-emerald-600 hover:border-emerald-400"
              >
                <Mail className="w-4 h-4 mr-2" />
                support@dinaramart.com
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
