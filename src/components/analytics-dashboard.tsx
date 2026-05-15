import { useState, useEffect } from 'react'
import { TruncatedText } from './ui/truncated-text'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { Skeleton } from "./ui/skeleton"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Users } from 'lucide-react'
import { storeApi, ordersApi, customersApi, type ApiStoreStats, type ApiOrder, type ApiCustomer } from '../lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function formatShort(v: number) {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(0)}Jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}Rb`
  return `Rp ${v}`
}

function pctChange(cur: number, prev: number) {
  if (prev === 0) return null
  return ((cur - prev) / prev) * 100
}

function formatPct(n: number | null): { label: string; up: boolean } | null {
  if (n === null) return null
  return { label: `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`, up: n >= 0 }
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#06b6d4', '#f43f5e', '#8b5cf6']

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm space-y-1">
      <p className="font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{formatPrice(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm space-y-1">
      <p className="font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{p.value.toLocaleString('id-ID')}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<ApiStoreStats | null>(null)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      storeApi.stats(),
      ordersApi.list(),
      customersApi.list(),
    ])
      .then(([s, o, c]) => { setStats(s); setOrders(o); setCustomers(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Compute KPIs ──
  const totalRevenue = Number(stats?.total_revenue ?? 0)
  const totalOrders = Number(stats?.total_orders ?? 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // ── Monthly chart from stats.sales_chart ──
  const monthlyData = stats?.sales_chart?.map(d => ({
    bulan: d.month, penjualan: d.sales, pesanan: d.orders,
  })) ?? []

  // ── Category distribution from stats.category_chart ──
  const categoryData = stats?.category_chart?.map((d, i) => ({
    sumber: d.name, pengunjung: d.value, color: CHART_COLORS[i % CHART_COLORS.length],
  })) ?? []

  // ── Top products from delivered orders ──
  const productMap = new Map<string, { penjualan: number; pesanan: number }>()
  for (const order of orders) {
    if (order.status !== 'delivered') continue
    const items = order.items ?? order.order_items ?? []
    for (const item of items) {
      const name = item.product_name ?? item.name ?? 'Produk'
      const qty = Number(item.qty ?? item.quantity) || 1
      const price = Number(item.subtotal) || Number(item.unit_price ?? item.price ?? 0) * qty
      const existing = productMap.get(name) ?? { penjualan: 0, pesanan: 0 }
      productMap.set(name, { penjualan: existing.penjualan + price, pesanan: existing.pesanan + qty })
    }
  }
  const totalProductSales = Array.from(productMap.values()).reduce((s, p) => s + p.penjualan, 0)
  const topProductsData = Array.from(productMap.entries())
    .sort((a, b) => b[1].penjualan - a[1].penjualan)
    .slice(0, 5)
    .map(([nama, d]) => ({
      nama,
      penjualan: d.penjualan,
      pesanan: d.pesanan,
      persentase: totalProductSales > 0 ? Math.round((d.penjualan / totalProductSales) * 100) : 0,
    }))

  // ── Customer segments ──
  const segNew     = customers.filter(c => Number(c.total_orders ?? 0) <= 1)
  const segRegular = customers.filter(c => { const n = Number(c.total_orders ?? 0); return n >= 2 && n <= 5 })
  const segVip     = customers.filter(c => Number(c.total_orders ?? 0) > 5)
  const totalCust  = customers.length || 1
  const avgSpend   = (cs: ApiCustomer[]) => cs.length ? cs.reduce((s, c) => s + (Number(c.total_spend) || 0), 0) / cs.length : 0

  const customerSegmentData = [
    { segmen: 'Pelanggan Baru',    jumlah: segNew.length,     persentase: Math.round((segNew.length / totalCust) * 100),     rataRata: avgSpend(segNew),     color: '#22c55e' },
    { segmen: 'Pelanggan Regular', jumlah: segRegular.length, persentase: Math.round((segRegular.length / totalCust) * 100), rataRata: avgSpend(segRegular), color: '#3b82f6' },
    { segmen: 'Pelanggan VIP',     jumlah: segVip.length,     persentase: Math.round((segVip.length / totalCust) * 100),     rataRata: avgSpend(segVip),     color: '#f59e0b' },
  ]

  // ── Month-over-month growth from sales_chart ──
  const lastTwo = monthlyData.slice(-2)
  const growthRevenue  = lastTwo.length >= 2 ? formatPct(pctChange(lastTwo[1].penjualan, lastTwo[0].penjualan)) : null
  const growthOrders   = lastTwo.length >= 2 ? formatPct(pctChange(lastTwo[1].pesanan,   lastTwo[0].pesanan))   : null
  const growthCustomers = null // belum ada data pelanggan bulanan dari API

  const prevAvg = lastTwo.length >= 2 && lastTwo[0].pesanan > 0 ? lastTwo[0].penjualan / lastTwo[0].pesanan : 0
  const curAvg  = lastTwo.length >= 2 && lastTwo[1].pesanan > 0 ? lastTwo[1].penjualan / lastTwo[1].pesanan : 0
  const growthAov = prevAvg > 0 ? formatPct(pctChange(curAvg, prevAvg)) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analitik &amp; Laporan</h1>
          <p className="text-muted-foreground">Pantau performa bisnis dan dapatkan insights untuk mengembangkan toko Anda</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Waktu</SelectItem>
            <SelectItem value="7days">7 Hari Terakhir</SelectItem>
            <SelectItem value="30days">30 Hari Terakhir</SelectItem>
            <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
            <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-36 ml-auto" /></CardContent>
              </Card>
            ))
          : ([
              { title: 'Total Pendapatan',       value: formatPrice(totalRevenue),                  trend: growthRevenue,  icon: DollarSign,   color: 'text-green-500' },
              { title: 'Total Pesanan',           value: totalOrders.toLocaleString('id-ID'),         trend: growthOrders,   icon: ShoppingCart, color: 'text-blue-500' },
              { title: 'Rata-rata Nilai Pesanan', value: formatPrice(avgOrderValue),                  trend: growthAov,      icon: Package,      color: 'text-orange-500' },
              { title: 'Total Pelanggan',         value: customers.length.toLocaleString('id-ID'),    trend: growthCustomers,icon: Users,        color: 'text-purple-500' },
            ] as const).map((item, i) => {
              const Icon = item.icon
              return (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </CardHeader>
                  <CardContent>
                    <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{item.value}</TruncatedText>
                    {item.trend ? (
                      <p className={`text-xs flex items-center justify-end gap-1 mt-1 tabular-nums ${item.trend.up ? 'text-green-600' : 'text-red-500'}`}>
                        {item.trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.trend.label} dari bulan lalu
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 text-right">—</p>
                    )}
                  </CardContent>
                </Card>
              )
            })
        }
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="customers">Pelanggan</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Ringkasan ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Tren Penjualan Bulanan</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : monthlyData.length === 0 ? (
                <EmptyState message="Belum ada data penjualan" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8884d8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis tickFormatter={formatShort} width={75} />
                    <Tooltip content={<PriceTooltip />} />
                    <Area type="monotone" dataKey="penjualan" name="Penjualan" stroke="#8884d8" fill="url(#gradSales)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Produk Terlaris</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : topProductsData.length === 0 ? (
                  <EmptyState message="Belum ada data produk terlaris" />
                ) : (
                  topProductsData.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1 gap-3">
                        <div className="min-w-0">
                          <TruncatedText className="text-sm font-medium truncate">{p.nama}</TruncatedText>
                          <p className="text-xs text-muted-foreground tabular-nums">{p.pesanan} terjual</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{formatPrice(p.penjualan)}</p>
                          <Badge variant="secondary" className="text-xs tabular-nums">{p.persentase}%</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.persentase}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Distribusi Kategori Produk</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[180px] w-full" />
                ) : categoryData.length === 0 ? (
                  <EmptyState message="Belum ada data kategori" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="pengunjung">
                          {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v}%`, 'Porsi']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      {categoryData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <TruncatedText as="span" className="text-muted-foreground truncate">{item.sumber}</TruncatedText>
                          <span className="ml-auto font-medium">{item.pengunjung}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Penjualan ── */}
        <TabsContent value="sales" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Penjualan Bulanan</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : monthlyData.length === 0 ? (
                <EmptyState message="Belum ada data penjualan bulanan" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis tickFormatter={formatShort} width={75} />
                    <Tooltip content={<PriceTooltip />} />
                    <Bar dataKey="penjualan" name="Penjualan" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pertumbuhan Bulan-ke-Bulan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : (
                [
                  { label: 'Pertumbuhan Pendapatan', trend: growthRevenue },
                  { label: 'Pertumbuhan Pesanan',    trend: growthOrders },
                  { label: 'Pertumbuhan AOV',        trend: growthAov },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-sm">{item.label}</span>
                    {item.trend ? (
                      <Badge className={item.trend.up ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                        {item.trend.label}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Data tidak cukup</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Produk ── */}
        <TabsContent value="products" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Pendapatan per Produk</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : topProductsData.length === 0 ? (
                <EmptyState message="Belum ada data produk" />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, topProductsData.length * 55)}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatShort} width={70} />
                    <YAxis type="category" dataKey="nama" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip content={<PriceTooltip />} />
                    <Bar dataKey="penjualan" name="Penjualan" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {topProductsData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Detail Produk Terlaris</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Produk</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Terjual</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pendapatan</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductsData.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="py-3 font-medium">{p.nama}</td>
                        <td className="py-3 text-right tabular-nums">{p.pesanan}</td>
                        <td className="py-3 text-right tabular-nums">{formatPrice(p.penjualan)}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.persentase}%` }} />
                            </div>
                            <span className="tabular-nums">{p.persentase}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Pelanggan ── */}
        <TabsContent value="customers" className="space-y-6 mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {customerSegmentData.map((seg, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{seg.segmen}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{seg.jumlah.toLocaleString('id-ID')}</div>
                    <p className="text-xs text-muted-foreground mt-1">{seg.persentase}% dari total</p>
                    {seg.rataRata > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground">Rata-rata belanja</p>
                        <p className="text-sm font-semibold">{formatPrice(seg.rataRata)}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Segmentasi Pelanggan</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[220px] w-full" />
                ) : customers.length === 0 ? (
                  <EmptyState message="Belum ada data pelanggan" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={customerSegmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="jumlah">
                          {customerSegmentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v.toLocaleString('id-ID'), 'Pelanggan']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {customerSegmentData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="flex-1">{item.segmen}</span>
                          <span className="font-medium">{item.jumlah}</span>
                          <span className="text-muted-foreground">({item.persentase}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pertumbuhan Pesanan Bulanan</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[220px] w-full" />
                ) : monthlyData.length === 0 ? (
                  <EmptyState message="Belum ada data pesanan bulanan" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bulan" />
                      <YAxis />
                      <Tooltip content={<CountTooltip />} />
                      <Line type="monotone" dataKey="pesanan" name="Pesanan" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
