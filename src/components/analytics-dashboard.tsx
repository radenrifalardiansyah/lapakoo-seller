import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Users } from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const salesTrendData = [
  { date: '01 Jan', penjualan: 12000000, pesanan: 45, pengunjung: 1250 },
  { date: '02 Jan', penjualan: 15000000, pesanan: 52, pengunjung: 1380 },
  { date: '03 Jan', penjualan: 18000000, pesanan: 61, pengunjung: 1520 },
  { date: '04 Jan', penjualan: 14000000, pesanan: 48, pengunjung: 1290 },
  { date: '05 Jan', penjualan: 22000000, pesanan: 75, pengunjung: 1680 },
  { date: '06 Jan', penjualan: 19000000, pesanan: 66, pengunjung: 1590 },
  { date: '07 Jan', penjualan: 25000000, pesanan: 82, pengunjung: 1890 },
]

const monthlyData = [
  { bulan: 'Jan', penjualan: 125000000, pesanan: 450, pelanggan: 380 },
  { bulan: 'Feb', penjualan: 132000000, pesanan: 478, pelanggan: 425 },
  { bulan: 'Mar', penjualan: 148000000, pesanan: 520, pelanggan: 465 },
  { bulan: 'Apr', penjualan: 155000000, pesanan: 545, pelanggan: 490 },
  { bulan: 'Mei', penjualan: 178000000, pesanan: 612, pelanggan: 550 },
  { bulan: 'Jun', penjualan: 185000000, pesanan: 645, pelanggan: 580 },
]

const topProductsData = [
  { nama: 'iPhone 14 Pro', penjualan: 45000000, pesanan: 30, persentase: 35 },
  { nama: 'Samsung Galaxy S23', penjualan: 38000000, pesanan: 25, persentase: 28 },
  { nama: 'MacBook Air M2', penjualan: 32000000, pesanan: 18, persentase: 22 },
  { nama: 'iPad Air', penjualan: 15000000, pesanan: 12, persentase: 15 },
]

const trafficSourceData = [
  { sumber: 'Organic Search', pengunjung: 45, color: '#8884d8' },
  { sumber: 'Media Sosial',   pengunjung: 25, color: '#82ca9d' },
  { sumber: 'Direct',         pengunjung: 15, color: '#ffc658' },
  { sumber: 'Referral',       pengunjung: 10, color: '#ff7300' },
  { sumber: 'Email',          pengunjung: 5,  color: '#06b6d4' },
]

const customerSegmentData = [
  { segmen: 'Pelanggan Baru',     jumlah: 500, persentase: 40, rataRata: 850000,  color: '#22c55e' },
  { segmen: 'Pelanggan Regular',  jumlah: 658, persentase: 53, rataRata: 2100000, color: '#3b82f6' },
  { segmen: 'Pelanggan VIP',      jumlah: 89,  persentase: 7,  rataRata: 8500000, color: '#f59e0b' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function formatShort(v: number) {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(0)}Jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}Rb`
  return `Rp ${v}`
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#06b6d4']

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

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analitik & Laporan</h1>
          <p className="text-muted-foreground">Pantau performa bisnis dan dapatkan insights untuk mengembangkan toko Anda</p>
        </div>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">7 Hari Terakhir</SelectItem>
            <SelectItem value="30days">30 Hari Terakhir</SelectItem>
            <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
            <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Pendapatan',         value: formatPrice(125000000), trend: '+15.2%', up: true,  icon: DollarSign,   color: 'text-green-500' },
          { title: 'Tingkat Konversi',          value: '4.35%',                trend: '+0.8%',  up: true,  icon: ShoppingCart, color: 'text-blue-500' },
          { title: 'Rata-rata Nilai Pesanan',   value: formatPrice(875000),    trend: '-2.1%',  up: false, icon: Package,      color: 'text-orange-500' },
          { title: 'Pelanggan Baru',            value: '156',                  trend: '+22%',   up: true,  icon: Users,        color: 'text-purple-500' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right tabular-nums">{item.value}</div>
                <p className={`text-xs flex items-center justify-end gap-1 mt-1 tabular-nums ${item.up ? 'text-green-600' : 'text-red-500'}`}>
                  {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.trend} dari periode sebelumnya
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="customers">Pelanggan</TabsTrigger>
            <TabsTrigger value="traffic">Sumber Traffic</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Ringkasan ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Tren Penjualan Harian</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatShort} width={75} />
                  <Tooltip content={<PriceTooltip />} />
                  <Area type="monotone" dataKey="penjualan" name="Penjualan" stroke="#8884d8" fill="url(#gradSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Produk Terlaris</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {topProductsData.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.nama}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{p.pesanan} pesanan</p>
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
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Sumber Traffic</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={trafficSourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="pengunjung">
                      {trafficSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Pengunjung']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  {trafficSourceData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.sumber}</span>
                      <span className="ml-auto font-medium">{item.pengunjung}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Penjualan ── */}
        <TabsContent value="sales" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Penjualan Bulanan</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bulan" />
                  <YAxis tickFormatter={formatShort} width={75} />
                  <Tooltip content={<PriceTooltip />} />
                  <Bar dataKey="penjualan" name="Penjualan" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Pertumbuhan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Pertumbuhan Pendapatan', value: '+15.2%', up: true },
                  { label: 'Pertumbuhan Pesanan',    value: '+12.8%', up: true },
                  { label: 'Pertumbuhan Pelanggan',  value: '+22.3%', up: true },
                  { label: 'Pertumbuhan AOV',        value: '-2.1%',  up: false },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-sm">{item.label}</span>
                    <Badge className={item.up ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pencapaian Target</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Target Pendapatan Bulanan', pct: 85, color: 'bg-blue-500' },
                  { label: 'Target Jumlah Pesanan',     pct: 92, color: 'bg-green-500' },
                  { label: 'Target Pelanggan Baru',     pct: 78, color: 'bg-orange-500' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Produk ── */}
        <TabsContent value="products" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Pendapatan per Produk</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatShort} width={70} />
                  <YAxis type="category" dataKey="nama" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip content={<PriceTooltip />} />
                  <Bar dataKey="penjualan" name="Penjualan" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detail Produk Terlaris</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Produk</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Pesanan</th>
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
        </TabsContent>

        {/* ── Pelanggan ── */}
        <TabsContent value="customers" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {customerSegmentData.map((seg, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{seg.segmen}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{seg.jumlah.toLocaleString('id-ID')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{seg.persentase}% dari total</p>
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground">Rata-rata belanja</p>
                  <p className="text-sm font-semibold">{formatPrice(seg.rataRata)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Segmentasi Pelanggan</CardTitle></CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Pertumbuhan Pelanggan Bulanan</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis />
                    <Tooltip content={<CountTooltip />} />
                    <Line type="monotone" dataKey="pelanggan" name="Pelanggan" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Traffic ── */}
        <TabsContent value="traffic" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Distribusi Sumber Traffic</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={trafficSourceData} cx="50%" cy="50%" outerRadius={100} paddingAngle={3} dataKey="pengunjung" label={({ sumber, pengunjung }) => `${pengunjung}%`}>
                      {trafficSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Persentase']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Detail Sumber Traffic</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Sumber</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pengunjung</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficSourceData.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            {item.sumber}
                          </div>
                        </td>
                        <td className="py-3 text-right text-muted-foreground tabular-nums">
                          {Math.round(item.pengunjung * 18.9).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${item.pengunjung}%`, backgroundColor: item.color }} />
                            </div>
                            <span className="tabular-nums">{item.pengunjung}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Tren Pengunjung Harian</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#82ca9d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CountTooltip />} />
                  <Area type="monotone" dataKey="pengunjung" name="Pengunjung" stroke="#82ca9d" fill="url(#gradVisitors)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
