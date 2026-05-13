import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Separator } from "./ui/separator"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Eye,
  Plus, CheckCircle2, Circle, Trash2, Megaphone, X,
  AlertTriangle, Info, Tag, Star, Target, Users,
  Clock, ArrowRight,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'

// ─── Data ─────────────────────────────────────────────────────────────────────

const salesData = [
  { bulan: 'Jan', penjualan: 125000000, pesanan: 450 },
  { bulan: 'Feb', penjualan: 132000000, pesanan: 478 },
  { bulan: 'Mar', penjualan: 148000000, pesanan: 520 },
  { bulan: 'Apr', penjualan: 155000000, pesanan: 545 },
  { bulan: 'Mei', penjualan: 178000000, pesanan: 612 },
  { bulan: 'Jun', penjualan: 185000000, pesanan: 645 },
]

const categoryData = [
  { nama: 'Electronics',   nilai: 35, color: '#6366f1' },
  { nama: 'Fashion',       nilai: 25, color: '#06b6d4' },
  { nama: 'Home & Garden', nilai: 20, color: '#10b981' },
  { nama: 'Sports',        nilai: 12, color: '#f59e0b' },
  { nama: 'Books',         nilai: 8,  color: '#f43f5e' },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'Ahmad Rizki',    product: 'iPhone 14 Pro Max',     amount: 15999000, status: 'pending',    date: '15 Jan 2024' },
  { id: 'ORD-002', customer: 'Siti Nurhaliza', product: 'Samsung Galaxy S23 Ultra', amount: 22298000, status: 'shipped',    date: '14 Jan 2024' },
  { id: 'ORD-003', customer: 'Budi Santoso',   product: 'MacBook Air M2',         amount: 20298000, status: 'delivered',  date: '12 Jan 2024' },
  { id: 'ORD-004', customer: 'Dewi Lestari',   product: 'Nike Air Jordan 1 x2',  amount: 4998000,  status: 'processing', date: '13 Jan 2024' },
]

const businessSummary = [
  { label: 'Pendapatan Bulan Ini',  value: 'Rp 185.000.000', prev: 'Rp 178.000.000', pct: '+3.9%',  up: true,  icon: DollarSign, color: 'text-green-500' },
  { label: 'Total Pesanan',         value: '645',             prev: '612',             pct: '+5.4%',  up: true,  icon: ShoppingCart, color: 'text-blue-500' },
  { label: 'Pelanggan Baru',        value: '156',             prev: '128',             pct: '+21.9%', up: true,  icon: Users,      color: 'text-purple-500' },
  { label: 'Rata-rata Nilai Pesan', value: 'Rp 875.000',      prev: 'Rp 893.000',     pct: '-2.0%',  up: false, icon: Target,     color: 'text-orange-500' },
]

const targetProgress = [
  { label: 'Target Pendapatan',  current: 185000000, target: 220000000, color: 'bg-blue-500' },
  { label: 'Target Pesanan',     current: 645,       target: 700,       color: 'bg-green-500' },
  { label: 'Target Pelanggan',   current: 156,       target: 200,       color: 'bg-purple-500' },
]

const initialAnnouncements = [
  {
    id: 1,
    type: 'promo' as const,
    title: 'Promo Harbolnas 7.7 — Daftarkan Produk Anda',
    desc: 'Daftarkan minimal 5 produk untuk mendapatkan slot featured dan cashback biaya iklan 50%.',
    date: '10 Jan 2024',
    dismissed: false,
  },
  {
    id: 2,
    type: 'info' as const,
    title: 'Update Kebijakan Pengiriman Gratis',
    desc: 'Mulai 1 Februari, minimum pembelian untuk gratis ongkir berubah dari Rp 50.000 menjadi Rp 75.000.',
    date: '08 Jan 2024',
    dismissed: false,
  },
  {
    id: 3,
    type: 'warning' as const,
    title: 'Verifikasi Identitas Seller Wajib',
    desc: 'Lengkapi verifikasi KTP dan NPWP sebelum 31 Januari untuk menghindari pembatasan akun.',
    date: '05 Jan 2024',
    dismissed: false,
  },
  {
    id: 4,
    type: 'info' as const,
    title: 'Fitur Baru: Analitik Real-time',
    desc: 'Dashboard analitik kini dilengkapi laporan real-time dan export otomatis setiap hari.',
    date: '03 Jan 2024',
    dismissed: false,
  },
]

const initialTasks = [
  { id: 1, text: 'Proses 2 pesanan yang masih pending',      done: false, priority: 'high' as const },
  { id: 2, text: 'Restock Nike Air Jordan 1 (sisa 3 unit)',  done: false, priority: 'high' as const },
  { id: 3, text: 'Balas ulasan pelanggan bulan ini',         done: false, priority: 'medium' as const },
  { id: 4, text: 'Upload foto produk baru Samsung Tab S9',   done: true,  priority: 'medium' as const },
  { id: 5, text: 'Perbarui deskripsi MacBook Air M2',        done: false, priority: 'low' as const },
  { id: 6, text: 'Daftarkan produk ke program flash sale',   done: true,  priority: 'low' as const },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function formatShort(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}Jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}Rb`
  return String(v)
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending:    { label: 'Menunggu',  class: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Diproses',  class: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipped:    { label: 'Dikirim',   class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  delivered:  { label: 'Selesai',   class: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:  { label: 'Dibatalkan',class: 'bg-red-50 text-red-700 border-red-200' },
}

const ANNOUNCE_CFG = {
  promo:   { icon: Tag,          class: 'text-purple-600 bg-purple-50 border-purple-200', badge: 'Promo' },
  info:    { icon: Info,         class: 'text-blue-600 bg-blue-50 border-blue-200',       badge: 'Info' },
  warning: { icon: AlertTriangle,class: 'text-amber-600 bg-amber-50 border-amber-200',   badge: 'Penting' },
}

const PRIORITY_CFG = {
  high:   { label: 'Tinggi',  class: 'bg-red-100 text-red-700' },
  medium: { label: 'Sedang',  class: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Rendah',  class: 'bg-slate-100 text-slate-600' },
}

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm space-y-1">
      <p className="font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? formatPrice(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardOverview({ onAddProduct, onViewAllOrders }: { onAddProduct?: () => void; onViewAllOrders?: () => void } = {}) {
  const { tenant } = useTenant()
  const isStarter = tenant?.package.id === 'starter'

  // Announcements
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const visibleAnnouncements = announcements.filter(a => !a.dismissed)
  const dismissAnnouncement = (id: number) =>
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))

  // Tasks
  const [tasks, setTasks] = useState(initialTasks)
  const [newTask, setNewTask] = useState('')
  const doneTasks = tasks.filter(t => t.done).length

  const toggleTask = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const deleteTask = (id: number) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const addTask = () => {
    const text = newTask.trim()
    if (!text) return
    setTasks(prev => [...prev, { id: Date.now(), text, done: false, priority: 'medium' }])
    setNewTask('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang kembali! Berikut ringkasan toko Anda hari ini.</p>
        </div>
        {!isStarter && (
          <Button onClick={onAddProduct} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        )}
      </div>

      {/* ── Ringkasan Bisnis ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Ringkasan Bisnis — Juni 2024
            </CardTitle>
            <span className="text-xs text-muted-foreground">vs bulan sebelumnya</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessSummary.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="p-4 rounded-xl border bg-muted/20 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  </div>
                  <p className="text-xl font-bold text-right tabular-nums truncate">{item.value}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground tabular-nums truncate">{item.prev}</p>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums shrink-0 ${item.up ? 'text-green-600' : 'text-red-500'}`}>
                      {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.pct}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Target progress */}
          <div>
            <p className="text-sm font-semibold mb-3">Pencapaian Target Bulan Ini</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {targetProgress.map((t, i) => {
                const pct = Math.min(100, Math.round((t.current / t.target) * 100))
                return (
                  <div key={i} className="space-y-1.5 min-w-0">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground truncate">{t.label}</span>
                      <span className="font-semibold tabular-nums shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`${t.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums text-right truncate">
                      {typeof t.current === 'number' && t.current > 1000
                        ? `${formatPrice(t.current)} / ${formatPrice(t.target)}`
                        : `${t.current} / ${t.target}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Grafik Penjualan Bulanan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={formatShort} width={55} />
                <Tooltip content={<PriceTooltip />} />
                <Bar dataKey="penjualan" name="Penjualan" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribusi Kategori Produk</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="nilai">
                  {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, 'Porsi']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground flex-1">{item.nama}</span>
                  <span className="font-medium">{item.nilai}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pesanan Terbaru ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pesanan Terbaru</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={onViewAllOrders}>
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {recentOrders.map((order, i) => {
              const s = STATUS_MAP[order.status] ?? { label: order.status, class: 'bg-muted text-muted-foreground border-muted' }
              return (
                <div key={order.id} className={`flex items-center gap-4 py-3 ${i < recentOrders.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium">{order.id}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customer}</p>
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="text-sm truncate">{order.product}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatPrice(order.amount)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium mt-0.5 ${s.class}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Pengumuman + Daftar Tugas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pengumuman */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-500" />
                Pengumuman
              </CardTitle>
              <span className="text-xs text-muted-foreground">{visibleAnnouncements.length} aktif</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada pengumuman</p>
              </div>
            ) : (
              visibleAnnouncements.map(ann => {
                const cfg = ANNOUNCE_CFG[ann.type]
                const Icon = cfg.icon
                return (
                  <div key={ann.id} className={`relative rounded-lg border p-3 pr-8 ${cfg.class}`}>
                    <button
                      onClick={() => dismissAnnouncement(ann.id)}
                      className="absolute top-2.5 right-2.5 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold leading-tight">{ann.title}</p>
                          <Badge className="text-[10px] px-1.5 py-0 h-4">{cfg.badge}</Badge>
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">{ann.desc}</p>
                        <p className="text-[10px] opacity-60 pt-0.5">{ann.date}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Daftar Tugas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Daftar Tugas
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {doneTasks}/{tasks.length} selesai
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: tasks.length ? `${(doneTasks / tasks.length) * 100}%` : '0%' }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Input tambah tugas */}
            <div className="flex gap-2">
              <Input
                placeholder="Tambah tugas baru..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={addTask} disabled={!newTask.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Task list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada tugas</p>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border group transition-colors ${task.done ? 'bg-muted/40 border-transparent' : 'bg-background hover:bg-muted/20'}`}
                  >
                    <button onClick={() => toggleTask(task.id)} className="shrink-0">
                      {task.done
                        ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500 w-5 h-5" />
                        : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      }
                    </button>
                    <span className={`text-sm flex-1 min-w-0 ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                      {task.text}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!task.done && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_CFG[task.priority].class}`}>
                          {PRIORITY_CFG[task.priority].label}
                        </span>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {doneTasks > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setTasks(prev => prev.filter(t => !t.done))}
              >
                Hapus {doneTasks} tugas selesai
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
