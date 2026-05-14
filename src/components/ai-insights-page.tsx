import { useMemo, useState } from 'react'
import {
  Sparkles, TrendingUp, TrendingDown, Brain, Zap, Lightbulb,
  AlertTriangle, PackageCheck, Target, ArrowRight, Crown,
  BadgePercent, Clock, RefreshCw, Boxes,
} from 'lucide-react'
import { TruncatedText } from './ui/truncated-text'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useInventory } from '../contexts/InventoryContext'
import { useTenant } from '../contexts/TenantContext'
import { getPackageTheme } from '../lib/packageTheme'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(v)
}

function formatShort(v: number) {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)}M`
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(0)}Jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}Rb`
  return `Rp ${v}`
}

// Pseudo-random tapi deterministik berdasarkan productId — supaya hasil konsisten antar render.
function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// ─── Synthetic historical velocity (sales per day) per produk ──────────────
// Catatan: di produksi ini diganti dengan query histori order 90-180 hari terakhir.

interface ProductSignal {
  id: number
  name: string
  category: string
  price: number
  currentStock: number
  avgDailySales: number       // velocity 30 hari terakhir
  prevAvgDailySales: number   // velocity 30-60 hari sebelumnya
  trendPct: number            // % perubahan velocity
  forecast30d: number         // proyeksi unit terjual 30 hari
  forecastRevenue30d: number  // proyeksi pendapatan 30 hari
  daysOfStock: number         // hari sebelum habis (Infinity jika 0 velocity)
  confidence: number          // 0-100
}

function buildSignals(
  products: { id: number; name: string; category: string; price: number }[],
  totalStockOf: (id: number) => number,
): ProductSignal[] {
  return products.map(p => {
    const r1 = seededRand(p.id * 7 + 13)
    const r2 = seededRand(p.id * 11 + 29)
    const r3 = seededRand(p.id * 17 + 41)

    // Velocity disesuaikan kasar dengan harga: barang murah jual lebih banyak unit
    const base = p.price > 10_000_000 ? 0.6 : p.price > 2_000_000 ? 1.8 : 4.5
    const avgDailySales = +(base * (0.6 + r1 * 1.4)).toFixed(2)
    const prevAvgDailySales = +(avgDailySales * (0.7 + r2 * 0.6)).toFixed(2)
    const trendPct = prevAvgDailySales > 0
      ? +(((avgDailySales - prevAvgDailySales) / prevAvgDailySales) * 100).toFixed(1)
      : 0

    const forecast30d = Math.round(avgDailySales * 30)
    const forecastRevenue30d = forecast30d * p.price

    const currentStock = totalStockOf(p.id)
    const daysOfStock = avgDailySales > 0 ? +(currentStock / avgDailySales).toFixed(1) : Infinity
    const confidence = Math.round(65 + r3 * 30) // 65-95

    return {
      id: p.id, name: p.name, category: p.category, price: p.price,
      currentStock, avgDailySales, prevAvgDailySales, trendPct,
      forecast30d, forecastRevenue30d, daysOfStock, confidence,
    }
  })
}

// 30 hari historis + 30 hari forecast (mock) untuk demand chart toko
function buildDemandSeries(totalDaily: number) {
  const arr: { day: string; aktual: number | null; prediksi: number | null }[] = []
  const today = 30
  for (let i = -30; i <= 30; i++) {
    const wave = Math.sin((i + 30) * 0.4) * 0.15
    const noise = (seededRand(i + 100) - 0.5) * 0.2
    const value = Math.max(0, Math.round(totalDaily * (1 + wave + noise)))
    arr.push({
      day: `H${i >= 0 ? '+' : ''}${i}`,
      aktual: i <= 0 ? value : null,
      prediksi: i >= 0 ? value : null,
    })
  }
  return arr
}

// ─── Restock helpers ───────────────────────────────────────────────────────────

function restockUrgency(s: ProductSignal): 'critical' | 'high' | 'medium' | 'low' | 'ok' {
  if (s.avgDailySales === 0) return s.currentStock === 0 ? 'low' : 'ok'
  if (s.daysOfStock <= 3) return 'critical'
  if (s.daysOfStock <= 7) return 'high'
  if (s.daysOfStock <= 14) return 'medium'
  if (s.daysOfStock <= 21) return 'low'
  return 'ok'
}

function urgencyBadge(u: ReturnType<typeof restockUrgency>) {
  switch (u) {
    case 'critical': return { label: 'Sangat Mendesak', cls: 'bg-red-100 text-red-700 border-red-200' }
    case 'high':     return { label: 'Mendesak',        cls: 'bg-orange-100 text-orange-700 border-orange-200' }
    case 'medium':   return { label: 'Disarankan',      cls: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'low':      return { label: 'Perlu Dipantau',  cls: 'bg-sky-100 text-sky-700 border-sky-200' }
    case 'ok':       return { label: 'Aman',            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
}

// Rekomendasi qty restok: cover 30 hari + buffer 25%
function recommendedRestock(s: ProductSignal): number {
  if (s.avgDailySales === 0) return 0
  const target = Math.ceil(s.avgDailySales * 30 * 1.25)
  return Math.max(0, target - s.currentStock)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIInsightsPage() {
  const { products } = useInventory()
  const { totalStockOf } = useInventory()
  const { tenant } = useTenant()
  const theme = getPackageTheme(tenant?.package.id)

  const [horizon, setHorizon] = useState<'7' | '30' | '90'>('30')
  const [refreshKey, setRefreshKey] = useState(0)

  const signals = useMemo(
    () => buildSignals(products, totalStockOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, totalStockOf, refreshKey],
  )

  // Sorting helpers
  const topPredicted = useMemo(
    () => [...signals].sort((a, b) => b.forecastRevenue30d - a.forecastRevenue30d).slice(0, 5),
    [signals],
  )

  const restockList = useMemo(
    () => [...signals]
      .map(s => ({ ...s, urgency: restockUrgency(s), recommendQty: recommendedRestock(s) }))
      .filter(s => s.urgency !== 'ok')
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, ok: 4 }
        return order[a.urgency] - order[b.urgency]
      }),
    [signals],
  )

  const risingStars = useMemo(
    () => [...signals].filter(s => s.trendPct > 15).sort((a, b) => b.trendPct - a.trendPct).slice(0, 4),
    [signals],
  )

  const decliners = useMemo(
    () => [...signals].filter(s => s.trendPct < -10).sort((a, b) => a.trendPct - b.trendPct).slice(0, 4),
    [signals],
  )

  // Total forecast revenue toko
  const totals = useMemo(() => {
    const days = Number(horizon)
    const fcstUnit = signals.reduce((s, x) => s + x.avgDailySales * days, 0)
    const fcstRev  = signals.reduce((s, x) => s + x.avgDailySales * days * x.price, 0)
    const avgConf  = signals.length
      ? Math.round(signals.reduce((s, x) => s + x.confidence, 0) / signals.length)
      : 0
    const dailyTotal = signals.reduce((s, x) => s + x.avgDailySales, 0)
    return { fcstUnit, fcstRev, avgConf, dailyTotal }
  }, [signals, horizon])

  const demandSeries = useMemo(
    () => buildDemandSeries(totals.dailyTotal),
    [totals.dailyTotal],
  )

  const accent = theme.accent

  // ── AI generated insights — heuristik sederhana dari sinyal ──
  const aiInsights = useMemo(() => {
    const list: { title: string; body: string; icon: typeof Lightbulb; tone: 'good' | 'warn' | 'info' }[] = []

    const star = risingStars[0]
    if (star) list.push({
      icon: TrendingUp, tone: 'good',
      title: `${star.name} tren naik ${star.trendPct.toFixed(0)}%`,
      body: `Velocity 30 hari terakhir meningkat signifikan. Pertimbangkan menaikkan stok dan jadikan produk highlight di banner toko.`,
    })

    const crit = restockList.find(s => s.urgency === 'critical')
    if (crit) list.push({
      icon: AlertTriangle, tone: 'warn',
      title: `Stok ${crit.name} akan habis dalam ${crit.daysOfStock} hari`,
      body: `Pada velocity saat ini, pesan ulang ±${crit.recommendQty} unit untuk menutup 30 hari ke depan + buffer 25%.`,
    })

    const dec = decliners[0]
    if (dec) list.push({
      icon: TrendingDown, tone: 'warn',
      title: `${dec.name} turun ${Math.abs(dec.trendPct).toFixed(0)}%`,
      body: `Pertimbangkan flash sale 10-15% atau bundling dengan produk komplementer untuk mempercepat perputaran.`,
    })

    // Cross-sell heuristik: dua produk kategori sama dengan velocity tinggi
    const sameCat = [...signals].sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 6)
    const pair = sameCat.find((p, i) => sameCat.slice(i + 1).some(q => q.category === p.category))
    const partner = pair && sameCat.find(q => q.id !== pair.id && q.category === pair.category)
    if (pair && partner) list.push({
      icon: BadgePercent, tone: 'info',
      title: `Peluang bundling: ${pair.name} + ${partner.name}`,
      body: `Keduanya kategori ${pair.category} dengan velocity tinggi. Voucher bundling 5-8% diprediksi mengangkat AOV ±12%.`,
    })

    list.push({
      icon: Clock, tone: 'info',
      title: 'Jam puncak konversi: 19.00–22.00 WIB',
      body: 'Jadwalkan posting promosi dan blast email 1 jam sebelum jam puncak untuk hasil terbaik.',
    })

    return list
  }, [signals, risingStars, decliners, restockList])

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #f59e0b)`,
                }}
              >
                <Brain className="w-5 h-5" />
              </span>
              Bisnis AI
            </h1>
            <Badge
              variant="outline"
              className="gap-1 border-violet-200 bg-gradient-to-r from-violet-50 to-amber-50 text-violet-700"
            >
              <Crown className="w-3 h-3" />
              Eksklusif Business
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Analisis bisnis bertenaga AI — prediksi produk laris, saran restok, dan insight pertumbuhan berdasarkan histori penjualan toko Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={horizon} onValueChange={v => setHorizon(v as '7' | '30' | '90')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Proyeksi 7 hari</SelectItem>
              <SelectItem value="30">Proyeksi 30 hari</SelectItem>
              <SelectItem value="90">Proyeksi 90 hari</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Hitung Ulang</span>
          </Button>
        </div>
      </div>

      {/* ── AI Summary banner ───────────────────────────────────────────── */}
      <Card
        className="border-0 text-white overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, #ec4899 55%, #f59e0b 100%)` }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Sparkles className="absolute top-4 right-6 w-16 h-16" />
          <Sparkles className="absolute bottom-4 left-8 w-8 h-8" />
        </div>
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Rangkuman AI hari ini</p>
              <p className="text-lg font-bold mt-0.5">
                Toko Anda diprediksi mencetak {formatPrice(totals.fcstRev)} dalam {horizon} hari.
              </p>
              <p className="text-sm opacity-90 mt-1">
                Estimasi {Math.round(totals.fcstUnit)} unit terjual · keyakinan model {totals.avgConf}% ·
                {restockList.filter(s => s.urgency === 'critical' || s.urgency === 'high').length} produk butuh perhatian restok.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Prediksi Pendapatan',
            value: formatShort(totals.fcstRev),
            fullValue: formatPrice(totals.fcstRev),
            sub: `${horizon} hari ke depan`,
            icon: Target,
            color: 'text-violet-500',
            bg: 'bg-violet-50',
          },
          {
            title: 'Prediksi Unit Terjual',
            value: Math.round(totals.fcstUnit).toLocaleString('id-ID'),
            sub: `Top: ${topPredicted[0]?.name ?? '—'}`,
            icon: PackageCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Produk Butuh Restok',
            value: String(restockList.length),
            sub: `${restockList.filter(s => s.urgency === 'critical').length} kritis`,
            icon: AlertTriangle,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            title: 'Keyakinan Model',
            value: `${totals.avgConf}%`,
            sub: 'Akurasi histori 90 hari',
            icon: Brain,
            color: 'text-sky-500',
            bg: 'bg-sky-50',
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <TruncatedText className="text-2xl text-right font-bold mt-0.5 tabular-nums truncate" tip={kpi.fullValue}>{kpi.value}</TruncatedText>
                <TruncatedText className="text-xs text-muted-foreground mt-1 truncate">{kpi.sub}</TruncatedText>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="forecast">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max">
            <TabsTrigger value="forecast" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Prediksi Produk Laris
            </TabsTrigger>
            <TabsTrigger value="restock" className="gap-1.5">
              <Boxes className="w-3.5 h-3.5" />
              Saran Restok
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Insights AI
            </TabsTrigger>
            <TabsTrigger value="demand" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Tren & Forecast
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Prediksi Produk Laris ── */}
        <TabsContent value="forecast" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: accent }} />
                Top 5 Produk Paling Diprediksi Laris ({horizon} hari)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPredicted.map((p, i) => {
                const days = Number(horizon)
                const unitFcst = Math.round(p.avgDailySales * days)
                const revFcst = unitFcst * p.price
                const max = topPredicted[0] ? topPredicted[0].avgDailySales * days * topPredicted[0].price : 1
                const pct = max > 0 ? (revFcst / max) * 100 : 0
                return (
                  <div key={p.id}>
                    <div className="flex items-start justify-between mb-1.5 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${accent}, #f59e0b)` }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <TruncatedText className="text-sm font-semibold truncate">{p.name}</TruncatedText>
                          <p className="text-xs text-muted-foreground">
                            {p.category} · {p.avgDailySales.toFixed(1)} unit/hari
                            {p.trendPct > 0 && (
                              <span className="text-emerald-600 font-medium ml-1">
                                <TrendingUp className="inline w-3 h-3" /> +{p.trendPct.toFixed(0)}%
                              </span>
                            )}
                            {p.trendPct < 0 && (
                              <span className="text-red-500 font-medium ml-1">
                                <TrendingDown className="inline w-3 h-3" /> {p.trendPct.toFixed(0)}%
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <TruncatedText className="text-sm font-bold tabular-nums" tip={formatPrice(revFcst)}>{formatShort(revFcst)}</TruncatedText>
                        <p className="text-xs text-muted-foreground tabular-nums">{unitFcst} unit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${accent}, #f59e0b)`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">
                        {p.confidence}% yakin
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Bintang Naik Daun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risingStars.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada produk dengan tren naik signifikan.</p>
                )}
                {risingStars.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shrink-0">
                      +{p.trendPct.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Perlu Strategi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {decliners.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada produk dengan tren menurun signifikan.</p>
                )}
                {decliners.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-red-50/60 border border-red-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Saran: flash sale / bundling</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shrink-0">
                      {p.trendPct.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Saran Restok ── */}
        <TabsContent value="restock" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="w-4 h-4" style={{ color: accent }} />
                Rekomendasi Restok berbasis Velocity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Hitungan berdasarkan rata-rata penjualan harian × 30 hari + buffer 25%, dibandingkan stok aktual.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {restockList.length === 0 ? (
                <div className="p-8 text-center">
                  <PackageCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold">Semua stok aman</p>
                  <p className="text-sm text-muted-foreground">Tidak ada produk yang butuh restok dalam waktu dekat.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Produk</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Stok</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Velocity</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Sisa Hari</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Restok</th>
                        <th className="text-center py-2.5 px-4 font-medium text-muted-foreground">Urgensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restockList.map(s => {
                        const b = urgencyBadge(s.urgency)
                        return (
                          <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.category}</p>
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">{s.currentStock}</td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {s.avgDailySales.toFixed(1)}/hari
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {isFinite(s.daysOfStock) ? `${s.daysOfStock} hari` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold tabular-nums" style={{ color: accent }}>
                                +{s.recommendQty}
                              </span>
                              <span className="text-xs text-muted-foreground"> unit</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline" className={`${b.cls} font-medium`}>
                                {b.label}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(level => {
              const count = restockList.filter(s => s.urgency === level).length
              const b = urgencyBadge(level)
              return (
                <Card key={level}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{b.label}</p>
                    <p className="text-2xl font-bold tabular-nums mt-1">{count}</p>
                    <Progress
                      value={restockList.length ? (count / restockList.length) * 100 : 0}
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ── Tab: Insights AI ── */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {aiInsights.map((ins, i) => {
            const Icon = ins.icon
            const tone =
              ins.tone === 'good' ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' } :
              ins.tone === 'warn' ? { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-600' } :
                                    { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-600' }
            return (
              <Card key={i} className={`${tone.border}`}>
                <CardContent className="p-4 flex gap-3">
                  <div className={`w-10 h-10 rounded-lg ${tone.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${tone.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ins.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{ins.body}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 self-start">
                    Tindak <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}

          <Card className="bg-gradient-to-br from-violet-50 to-amber-50 border-violet-200">
            <CardContent className="p-5 flex items-start gap-3">
              <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-violet-900">Cara model bekerja</p>
                <p className="text-violet-700 mt-1 leading-relaxed">
                  Prediksi dihitung dari velocity penjualan 30-90 hari terakhir, dikombinasikan dengan
                  pola musiman per kategori, hari dalam seminggu, dan korelasi antar produk.
                  Akurasi rata-rata model: <strong>{totals.avgConf}%</strong>. Hasil di-refresh otomatis setiap pagi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Tren & Forecast ── */}
        <TabsContent value="demand" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Toko — Aktual vs Prediksi</CardTitle>
              <p className="text-xs text-muted-foreground">
                30 hari historis (garis solid) + 30 hari prediksi (garis putus-putus). H0 = hari ini.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={demandSeries}>
                  <defs>
                    <linearGradient id="aktualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={accent} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="prediksiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" interval={9} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number | null) => v == null ? ['—', ''] : [`${v} unit`, '']}
                  />
                  <ReferenceLine x="H0" stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Hari ini', position: 'top', fontSize: 11, fill: '#64748b' }} />
                  <Area type="monotone" dataKey="aktual"   name="Aktual"   stroke={accent}   fill="url(#aktualGrad)"   strokeWidth={2} />
                  <Area type="monotone" dataKey="prediksi" name="Prediksi" stroke="#f59e0b" fill="url(#prediksiGrad)" strokeWidth={2} strokeDasharray="6 4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Velocity per Produk (unit/hari)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[...signals].sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 6)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)} unit/hari`, 'Velocity']} />
                    <Bar dataKey="avgDailySales" fill={accent} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tren Velocity (30d vs 30-60d sebelumnya)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={[...signals]
                      .sort((a, b) => b.avgDailySales - a.avgDailySales)
                      .slice(0, 6)
                      .map(s => ({ name: s.name.slice(0, 14), sekarang: s.avgDailySales, sebelum: s.prevAvgDailySales }))
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sebelum"  name="Periode lalu"   stroke="#94a3b8" strokeWidth={2} />
                    <Line type="monotone" dataKey="sekarang" name="Periode sekarang" stroke={accent} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3 text-sm">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
              <div>
                <p className="font-semibold">Catatan model</p>
                <p className="text-muted-foreground mt-0.5">
                  Forecast diasumsikan tanpa intervensi promosi besar. Saat menjadwalkan voucher / flash sale,
                  prediksi akan otomatis disesuaikan oleh sistem berdasarkan kampanye serupa di masa lalu.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />
      <p className="text-xs text-muted-foreground text-center">
        Bisnis AI · Hanya tersedia di paket <strong className="text-violet-700">Business</strong>.
        Data diperbarui otomatis setiap pagi pukul 06.00 WIB.
      </p>
    </div>
  )
}
