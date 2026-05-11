import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import {
  HelpCircle, Search, ChevronDown, ChevronUp, Mail, Phone,
  MessageSquare, CheckCircle2, Package, ShoppingCart, CreditCard,
  Handshake, Megaphone, Settings, BarChart3, Zap, BookOpen,
  AlertCircle, ExternalLink, Clock, Shield, Truck,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
}

interface FaqCategory {
  id: string
  label: string
  icon: React.ElementType
  color: string
  items: FaqItem[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "products",
    label: "Produk & Inventaris",
    icon: Package,
    color: "text-blue-600",
    items: [
      {
        q: "Bagaimana cara menambah produk baru?",
        a: "Buka menu Produk → klik tombol 'Tambah Produk'. Isi nama produk, kategori, harga, stok, dan SKU. Klik 'Simpan' untuk menyimpan produk.",
      },
      {
        q: "Bagaimana cara import produk secara massal?",
        a: "Di halaman Produk, klik 'Import Excel'. Download template terlebih dahulu, isi data produk sesuai format, lalu upload file. Sistem akan memvalidasi dan menampilkan preview sebelum data disimpan.",
      },
      {
        q: "Bagaimana cara mengatur kategori produk?",
        a: "Klik 'Kategori' di halaman Produk. Anda bisa menambah, mengganti nama, atau menghapus kategori. Perubahan nama kategori otomatis diperbarui di semua produk terkait.",
      },
      {
        q: "Apa yang dimaksud status 'Stok Rendah'?",
        a: "Produk berstatus Stok Rendah jika jumlah stok ≤ 5 unit. Badge merah akan muncul di menu Produk pada sidebar sebagai pengingat.",
      },
      {
        q: "Bagaimana cara menonaktifkan produk tanpa menghapusnya?",
        a: "Edit produk yang diinginkan, ubah status dari 'Aktif' menjadi 'Tidak Aktif'. Produk tidak akan muncul di etalase tetapi data tetap tersimpan.",
      },
    ],
  },
  {
    id: "orders",
    label: "Pesanan & Pengiriman",
    icon: ShoppingCart,
    color: "text-orange-600",
    items: [
      {
        q: "Bagaimana alur status pesanan?",
        a: "Pesanan baru masuk dengan status 'Menunggu' → diproses menjadi 'Diproses' → dikirim menjadi 'Dikirim' (isi nomor resi) → selesai menjadi 'Terkirim'. Pesanan juga bisa dibatalkan dari status Menunggu atau Diproses.",
      },
      {
        q: "Bagaimana cara kirim pesanan secara massal?",
        a: "Centang beberapa pesanan berstatus 'Diproses' di tab Pesanan, lalu klik 'Kirim Massal'. Pilih kurir dan isi nomor resi untuk masing-masing pesanan sekaligus.",
      },
      {
        q: "Bagaimana cara memproses pengajuan retur?",
        a: "Buka tab 'Retur' di halaman Pesanan. Klik detail pesanan untuk melihat alasan retur, lalu pilih 'Setujui' atau 'Tolak'. Jika disetujui, status retur berubah menjadi 'Disetujui' dan bisa diproses ke selesai.",
      },
      {
        q: "Apa yang terjadi saat pesanan dibatalkan?",
        a: "Jika pembayaran sudah lunas, statusnya otomatis berubah menjadi 'Dikembalikan'. Stok produk tidak otomatis dipulihkan — update stok perlu dilakukan manual di halaman Produk.",
      },
    ],
  },
  {
    id: "payments",
    label: "Keuangan & Pembayaran",
    icon: CreditCard,
    color: "text-green-600",
    items: [
      {
        q: "Bagaimana cara melihat laporan penghasilan?",
        a: "Buka menu Keuangan → tab 'Laporan Penghasilan'. Pilih mode Bulanan atau Tahunan, lalu pilih periode. Laporan menampilkan omzet, biaya admin 2%, refund, dan net income dalam grafik dan tabel.",
      },
      {
        q: "Apa itu biaya admin platform?",
        a: "Platform membebankan biaya layanan sebesar 2% dari total omzet per periode. Biaya ini sudah termasuk dalam kalkulasi laporan net income di halaman Keuangan.",
      },
      {
        q: "Bagaimana cara export laporan keuangan ke Excel?",
        a: "Di halaman Keuangan → tab Laporan Penghasilan, klik 'Export Excel'. File akan berisi data per periode (harian/bulanan), omzet, biaya admin, refund, net income, dan margin bersih.",
      },
      {
        q: "Mengapa ada transaksi bertipe 'Biaya Layanan Platform'?",
        a: "Transaksi ini mewakili pemotongan biaya admin 2% per bulan dari platform. Ini adalah biaya operasional yang dikurangkan dari total pendapatan Anda.",
      },
    ],
  },
  {
    id: "reseller",
    label: "Manajemen Reseller",
    icon: Handshake,
    color: "text-purple-600",
    items: [
      {
        q: "Bagaimana sistem tier reseller bekerja?",
        a: "Ada 4 tier: Bronze (0–10jt, komisi 5%), Silver (10–50jt, 8%), Gold (50–150jt, 12%), dan Platinum (>150jt, 15%). Tier naik otomatis berdasarkan total penjualan kumulatif reseller.",
      },
      {
        q: "Bagaimana cara menyetujui pendaftaran reseller baru?",
        a: "Buka tab 'Menunggu' di halaman Reseller. Klik ikon centang (✓) pada reseller yang ingin disetujui. Tetapkan tier awal dan konfirmasi. Kode referral akan dibuat otomatis.",
      },
      {
        q: "Bagaimana cara membayar komisi reseller?",
        a: "Klik ikon koin (komisi) pada reseller yang memiliki komisi pending, atau buka detail reseller → klik 'Bayar Komisi'. Pilih metode transfer dan konfirmasi pembayaran.",
      },
      {
        q: "Bagaimana cara mengubah persentase komisi per tier?",
        a: "Klik tombol 'Pengaturan Tier' di header halaman Reseller. Edit komisi (%), min. dan maks. penjualan untuk setiap tier. Klik 'Simpan Pengaturan' untuk menerapkan perubahan.",
      },
    ],
  },
  {
    id: "marketing",
    label: "Pemasaran & Promosi",
    icon: Megaphone,
    color: "text-pink-600",
    items: [
      {
        q: "Bagaimana cara membuat voucher diskon?",
        a: "Buka Pemasaran → tab Voucher & Kupon → klik 'Buat Voucher'. Isi kode (atau gunakan tombol Acak), tipe diskon (persentase/nominal), nilai, kuota, dan masa berlaku.",
      },
      {
        q: "Apa perbedaan voucher persentase dan nominal?",
        a: "Voucher persentase memberi diskon berdasarkan % dari total belanja (bisa dibatasi maks. diskon). Voucher nominal memberi potongan langsung sejumlah Rp tertentu dari total belanja.",
      },
      {
        q: "Bagaimana cara membuat flash sale?",
        a: "Buka Pemasaran → tab Flash Sale → klik 'Buat Flash Sale'. Isi nama, waktu mulai & berakhir, lalu tambahkan produk dengan harga flash sale dan kuota. Flash sale aktif menampilkan countdown real-time.",
      },
      {
        q: "Bagaimana cara menonaktifkan voucher sementara?",
        a: "Di tabel voucher, klik ikon power (🔌) pada voucher yang ingin dinonaktifkan. Voucher tidak bisa digunakan pelanggan sampai diaktifkan kembali.",
      },
    ],
  },
  {
    id: "account",
    label: "Akun & Keamanan",
    icon: Shield,
    color: "text-slate-600",
    items: [
      {
        q: "Bagaimana cara mengganti kata sandi?",
        a: "Buka Pengaturan → Keamanan & Akun → klik 'Ganti Kata Sandi'. Masukkan kata sandi lama, kata sandi baru (min. 8 karakter), dan konfirmasi. Indikator kekuatan sandi tersedia secara real-time.",
      },
      {
        q: "Apa itu Verifikasi 2 Langkah (2FA)?",
        a: "2FA menambahkan lapisan keamanan dengan meminta kode OTP ke nomor telepon terdaftar setiap kali login. Aktifkan di Pengaturan → Keamanan & Akun → toggle 2FA.",
      },
      {
        q: "Bagaimana cara melihat dan mencabut sesi login?",
        a: "Di Pengaturan → Keamanan & Akun → Sesi Login Aktif, Anda bisa melihat semua perangkat yang sedang login. Klik 'Cabut' untuk memaksa logout perangkat yang tidak dikenal.",
      },
      {
        q: "Bagaimana cara mengatur dekorasi toko?",
        a: "Buka Pengaturan → Dekorasi Toko. Anda bisa memilih warna tema (10 pilihan + kustom), upload banner, mengatur tagline/slogan, dan toggle tampilan ulasan serta produk terlaris.",
      },
    ],
  },
]

const QUICK_GUIDES = [
  { icon: Package,     label: "Tambah Produk Pertama",   desc: "Panduan lengkap menambah dan mengatur produk", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { icon: ShoppingCart,label: "Proses Pesanan Masuk",    desc: "Cara menerima, memproses, dan mengirim pesanan", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { icon: Truck,       label: "Setup Layanan Pengiriman",desc: "Aktifkan kurir dan atur ongkir gratis", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { icon: Zap,         label: "Buat Flash Sale",         desc: "Tingkatkan penjualan dengan promo waktu terbatas", color: "bg-red-50 border-red-200 text-red-700" },
  { icon: Handshake,   label: "Daftarkan Reseller",      desc: "Bangun jaringan reseller dan atur komisi", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { icon: BarChart3,   label: "Baca Laporan Analitik",   desc: "Pahami performa toko dari data penjualan", color: "bg-green-50 border-green-200 text-green-700" },
]

const SYSTEM_STATUS = [
  { label: "Platform Seller",   ok: true },
  { label: "Proses Pembayaran", ok: true },
  { label: "Layanan Pengiriman",ok: true },
  { label: "Notifikasi",        ok: true },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function HelpPage() {
  const [search, setSearch]           = useState("")
  const [openFaq, setOpenFaq]         = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("products")

  const toggleFaq = (key: string) => setOpenFaq(prev => prev === key ? null : key)

  const filtered = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0)

  const displayCategories = search ? filtered : FAQ_CATEGORIES
  const activeCat = displayCategories.find(c => c.id === activeCategory) ?? displayCategories[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7" />Pusat Bantuan
          </h1>
          <p className="text-muted-foreground">Panduan, FAQ, dan kontak dukungan Seller Center</p>
        </div>
        {/* System status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Semua sistem operasional</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11 text-base"
          placeholder="Cari pertanyaan, misalnya: cara membuat voucher..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpenFaq(null) }}
        />
      </div>

      {/* Quick Guides */}
      {!search && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />Panduan Cepat
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_GUIDES.map((g, i) => {
              const Icon = g.icon
              return (
                <div key={i}
                  className={`p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow ${g.color}`}>
                  <Icon className="w-5 h-5 mb-2" />
                  <p className="text-sm font-semibold leading-tight">{g.label}</p>
                  <p className="text-xs mt-1 opacity-80">{g.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          {search ? `Hasil Pencarian (${displayCategories.reduce((s, c) => s + c.items.length, 0)} pertanyaan)` : "Pertanyaan yang Sering Diajukan"}
        </h2>

        {displayCategories.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Tidak ada hasil untuk "{search}"</p>
              <p className="text-sm mt-1">Coba kata kunci lain atau hubungi support di bawah.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Category sidebar */}
            {!search && (
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-2">
                    {FAQ_CATEGORIES.map(cat => {
                      const Icon = cat.icon
                      const isActive = activeCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveCategory(cat.id); setOpenFaq(null) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                            isActive
                              ? "bg-secondary font-medium"
                              : "hover:bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? cat.color : ""}`} />
                          {cat.label}
                          <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                            {cat.items.length}
                          </span>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FAQ list */}
            <div className={search ? "lg:col-span-4" : "lg:col-span-3"}>
              {(search ? displayCategories : [activeCat ?? displayCategories[0]]).map(cat => {
                const Icon = cat.icon
                return (
                  <div key={cat.id} className="space-y-2">
                    {search && (
                      <div className={`flex items-center gap-2 text-sm font-semibold mb-2 ${cat.color}`}>
                        <Icon className="w-4 h-4" />{cat.label}
                      </div>
                    )}
                    {cat.items.map((item, idx) => {
                      const key = `${cat.id}-${idx}`
                      const isOpen = openFaq === key
                      return (
                        <div key={key} className={`border rounded-xl overflow-hidden transition-all ${isOpen ? "border-primary/30 shadow-sm" : ""}`}>
                          <button
                            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                            onClick={() => toggleFaq(key)}
                          >
                            <span className="text-sm font-medium">{item.q}</span>
                            {isOpen
                              ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                              : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-1 bg-muted/20 border-t">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* System Status + Contact side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status sistem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />Status Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SYSTEM_STATUS.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-green-500" : "bg-red-500"}`} />
                  <span className={`text-xs font-medium ${s.ok ? "text-green-600" : "text-red-600"}`}>
                    {s.ok ? "Operasional" : "Gangguan"}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Diperbarui: hari ini pukul 08.00 WIB</p>
          </CardContent>
        </Card>

        {/* Kontak support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />Hubungi Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Mail,          label: "Email Support",    value: "seller-support@eleven.id",  sub: "Respons dalam 1×24 jam" },
              { icon: Phone,         label: "WhatsApp Business",value: "+62 811-2345-6789",          sub: "Senin–Jumat, 09.00–18.00" },
              { icon: MessageSquare, label: "Live Chat",        value: "Chat langsung di Seller App", sub: "Rata-rata respons 5 menit" },
            ].map(({ icon: Icon, label, value, sub }, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b last:border-0">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{sub}
                  </p>
                </div>
              </div>
            ))}
            <Button
              className="w-full mt-1"
              onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />Mulai Live Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Tips Menggunakan Seller Center</p>
          <p className="mt-0.5 text-blue-700">
            Pantau stok rendah dari badge merah di sidebar, gunakan filter tab pada setiap halaman untuk menemukan data lebih cepat, dan manfaatkan fitur export Excel untuk analisis lanjutan di luar platform.
          </p>
        </div>
      </div>
    </div>
  )
}
