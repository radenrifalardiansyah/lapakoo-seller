import { useMemo, useState, useEffect, useCallback } from 'react'
import { customersApi, type ApiCustomer } from '../lib/api'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from './ui/pagination'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TruncatedText } from './ui/truncated-text'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Separator } from './ui/separator'
import {
  Users, Search, Eye, Star, ShoppingBag, Phone, Mail, MapPin, Calendar, TrendingUp,
  History, FileText, Package, Wallet, BarChart3, Filter,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'
import { exportPdf, fileStamp, formatRupiah } from '../lib/pdf-export'

// ─── Types ───────────────────────────────────────────────────────────────────

type Segment = 'VIP' | 'Regular' | 'New'
type OrderStatus = 'delivered' | 'shipped' | 'processing' | 'cancelled'
type PaymentStatus = 'paid' | 'waiting' | 'refunded'

interface Order {
  id: string
  product: string
  amount: number
  date: string
  /** Auto-derived for Business analytics. Optional for backward-compat. */
  category?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  segment: Segment
  totalOrders: number
  totalSpend: number
  lastOrder: string
  joinDate: string
  orders: Order[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const customers: Customer[] = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '0812-3456-7890',
    address: 'Jl. Sudirman No. 12, Jakarta Pusat, DKI Jakarta 10220',
    segment: 'VIP',
    totalOrders: 34,
    totalSpend: 18750000,
    lastOrder: '2025-05-01',
    joinDate: '2022-03-15',
    orders: [
      { id: 'INV-2025-0412', product: 'iPhone 14 Pro Max', amount: 15999000, date: '2025-05-01' },
      { id: 'INV-2025-0311', product: 'AirPods Pro', amount: 3499000, date: '2025-04-12' },
      { id: 'INV-2025-0205', product: 'MacBook Air M2', amount: 18999000, date: '2025-03-20' },
    ],
  },
  {
    id: 2,
    name: 'Siti Rahayu',
    email: 'siti.rahayu@yahoo.com',
    phone: '0856-9012-3456',
    address: 'Jl. Gatot Subroto No. 45, Bandung, Jawa Barat 40262',
    segment: 'VIP',
    totalOrders: 28,
    totalSpend: 12400000,
    lastOrder: '2025-04-28',
    joinDate: '2022-07-22',
    orders: [
      { id: 'INV-2025-0408', product: 'Samsung Galaxy S23 Ultra', amount: 18999000, date: '2025-04-28' },
      { id: 'INV-2025-0302', product: 'Samsung Buds Pro', amount: 2499000, date: '2025-03-15' },
      { id: 'INV-2025-0201', product: 'Samsung Galaxy Tab S9', amount: 11999000, date: '2025-02-10' },
    ],
  },
  {
    id: 3,
    name: 'Agus Wijaya',
    email: 'agus.wijaya@outlook.com',
    phone: '0878-5678-9012',
    address: 'Jl. Pemuda No. 78, Surabaya, Jawa Timur 60271',
    segment: 'Regular',
    totalOrders: 11,
    totalSpend: 4250000,
    lastOrder: '2025-04-20',
    joinDate: '2023-01-10',
    orders: [
      { id: 'INV-2025-0395', product: 'Nike Air Jordan 1', amount: 2499000, date: '2025-04-20' },
      { id: 'INV-2025-0278', product: 'Adidas Ultraboost 22', amount: 2899000, date: '2025-03-05' },
      { id: 'INV-2025-0190', product: 'Topi Snapback', amount: 350000, date: '2025-01-28' },
    ],
  },
  {
    id: 4,
    name: 'Dewi Lestari',
    email: 'dewi.lestari@gmail.com',
    phone: '0821-4567-8901',
    address: 'Jl. Malioboro No. 33, Yogyakarta, DIY 55271',
    segment: 'Regular',
    totalOrders: 8,
    totalSpend: 3100000,
    lastOrder: '2025-04-15',
    joinDate: '2023-05-18',
    orders: [
      { id: 'INV-2025-0381', product: 'Dress Batik Premium', amount: 850000, date: '2025-04-15' },
      { id: 'INV-2025-0265', product: 'Tas Kulit Wanita', amount: 1200000, date: '2025-03-01' },
      { id: 'INV-2025-0154', product: 'Sepatu Heels', amount: 750000, date: '2025-01-20' },
    ],
  },
  {
    id: 5,
    name: 'Eko Prasetyo',
    email: 'eko.prasetyo@hotmail.com',
    phone: '0895-3456-7890',
    address: 'Jl. Ahmad Yani No. 56, Semarang, Jawa Tengah 50171',
    segment: 'VIP',
    totalOrders: 22,
    totalSpend: 9800000,
    lastOrder: '2025-05-02',
    joinDate: '2022-11-05',
    orders: [
      { id: 'INV-2025-0420', product: 'PlayStation 5', amount: 8999000, date: '2025-05-02' },
      { id: 'INV-2025-0310', product: 'Controller PS5 DualSense', amount: 1099000, date: '2025-04-10' },
      { id: 'INV-2025-0215', product: 'Game FIFA 25', amount: 799000, date: '2025-02-22' },
    ],
  },
  {
    id: 6,
    name: 'Fitri Handayani',
    email: 'fitri.handayani@gmail.com',
    phone: '0813-7890-1234',
    address: 'Jl. Diponegoro No. 89, Medan, Sumatera Utara 20152',
    segment: 'New',
    totalOrders: 2,
    totalSpend: 650000,
    lastOrder: '2025-04-30',
    joinDate: '2025-04-10',
    orders: [
      { id: 'INV-2025-0410', product: 'Skincare Set Wardah', amount: 450000, date: '2025-04-30' },
      { id: 'INV-2025-0401', product: 'Lip Cream Implora', amount: 200000, date: '2025-04-12' },
    ],
  },
  {
    id: 7,
    name: 'Gunawan Susanto',
    email: 'gunawan.s@gmail.com',
    phone: '0857-2345-6789',
    address: 'Jl. Raya Bogor No. 120, Depok, Jawa Barat 16413',
    segment: 'Regular',
    totalOrders: 14,
    totalSpend: 5600000,
    lastOrder: '2025-04-18',
    joinDate: '2023-08-30',
    orders: [
      { id: 'INV-2025-0376', product: 'Raket Badminton Yonex', amount: 1800000, date: '2025-04-18' },
      { id: 'INV-2025-0258', product: 'Sepatu Badminton', amount: 1200000, date: '2025-02-28' },
      { id: 'INV-2025-0145', product: 'Shuttlecock Mavis 350', amount: 150000, date: '2025-01-15' },
    ],
  },
  {
    id: 8,
    name: 'Hana Pertiwi',
    email: 'hana.pertiwi@yahoo.co.id',
    phone: '0838-6789-0123',
    address: 'Jl. Kertajaya No. 67, Surabaya, Jawa Timur 60283',
    segment: 'New',
    totalOrders: 1,
    totalSpend: 299000,
    lastOrder: '2025-05-03',
    joinDate: '2025-04-28',
    orders: [
      { id: 'INV-2025-0425', product: 'Buku Novel Bestseller', amount: 299000, date: '2025-05-03' },
    ],
  },
  {
    id: 9,
    name: 'Irwan Setiawan',
    email: 'irwan.setiawan@gmail.com',
    phone: '0819-0123-4567',
    address: 'Jl. Sultan Agung No. 44, Bekasi, Jawa Barat 17113',
    segment: 'Regular',
    totalOrders: 9,
    totalSpend: 3750000,
    lastOrder: '2025-04-22',
    joinDate: '2023-10-14',
    orders: [
      { id: 'INV-2025-0390', product: 'Kursi Gaming ErgoChair', amount: 3200000, date: '2025-04-22' },
      { id: 'INV-2025-0277', product: 'Mouse Gaming Logitech', amount: 850000, date: '2025-03-08' },
      { id: 'INV-2025-0166', product: 'Mousepad XL', amount: 250000, date: '2025-01-30' },
    ],
  },
  {
    id: 10,
    name: 'Julia Maharani',
    email: 'julia.maharani@gmail.com',
    phone: '0851-4567-8901',
    address: 'Jl. Pemuda No. 15, Makassar, Sulawesi Selatan 90111',
    segment: 'VIP',
    totalOrders: 19,
    totalSpend: 8200000,
    lastOrder: '2025-04-29',
    joinDate: '2022-09-03',
    orders: [
      { id: 'INV-2025-0406', product: 'Parfum Jo Malone', amount: 2500000, date: '2025-04-29' },
      { id: 'INV-2025-0308', product: 'Tas Longchamp Medium', amount: 3200000, date: '2025-04-05' },
      { id: 'INV-2025-0199', product: 'Sunglasses Ray-Ban', amount: 2800000, date: '2025-02-15' },
    ],
  },
  {
    id: 11,
    name: 'Kevin Ardiansyah',
    email: 'kevin.ardi@gmail.com',
    phone: '0896-5678-9012',
    address: 'Jl. Raya Darmo No. 88, Surabaya, Jawa Timur 60265',
    segment: 'New',
    totalOrders: 3,
    totalSpend: 920000,
    lastOrder: '2025-05-01',
    joinDate: '2025-03-20',
    orders: [
      { id: 'INV-2025-0415', product: 'Kaos Polos Uniqlo', amount: 299000, date: '2025-05-01' },
      { id: 'INV-2025-0350', product: 'Celana Chino', amount: 450000, date: '2025-04-14' },
      { id: 'INV-2025-0320', product: 'Ikat Pinggang Kulit', amount: 175000, date: '2025-03-25' },
    ],
  },
  {
    id: 12,
    name: 'Linda Kurniawati',
    email: 'linda.kurnia@outlook.com',
    phone: '0822-8901-2345',
    address: 'Jl. Gatot Subroto No. 77, Tangerang, Banten 15117',
    segment: 'Regular',
    totalOrders: 16,
    totalSpend: 6300000,
    lastOrder: '2025-04-25',
    joinDate: '2023-02-28',
    orders: [
      { id: 'INV-2025-0398', product: 'Blender Philips 2L', amount: 750000, date: '2025-04-25' },
      { id: 'INV-2025-0287', product: 'Rice Cooker Miyako', amount: 650000, date: '2025-03-12' },
      { id: 'INV-2025-0175', product: 'Panci Set Anti Lengket', amount: 1200000, date: '2025-02-03' },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── Category / status auto-derivation ────────────────────────────────────────
// Mock data only stores `product` name. To support analitik (kategori favorit,
// status breakdown), we derive these fields deterministically per order.

const CATEGORY_RULES: Array<{ match: RegExp; category: string }> = [
  { match: /iphone|samsung|playstation|airpods|controller|buds|tab|fifa|game/i, category: 'Elektronik' },
  { match: /macbook|kursi|mouse|mousepad/i, category: 'Komputer & Aksesoris' },
  { match: /nike|adidas|sepatu|raket|shuttlecock|badminton|topi/i, category: 'Olahraga' },
  { match: /dress|tas|heels|kaos|celana|ikat pinggang|batik|uniqlo|chino/i, category: 'Fashion' },
  { match: /skincare|lip|wardah|implora|parfum|jo malone|sunglasses|ray-ban/i, category: 'Kecantikan' },
  { match: /buku|novel/i, category: 'Buku' },
  { match: /blender|rice cooker|panci|philips|miyako/i, category: 'Rumah Tangga' },
  { match: /longchamp/i, category: 'Fashion' },
]

function deriveCategory(product: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(product)) return rule.category
  }
  return 'Lainnya'
}

function deriveStatus(orderId: string, dateStr: string): OrderStatus {
  const ageDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (ageDays > 30) return 'delivered'
  if (ageDays > 14) return 'delivered'
  // Use last digit of id for stable variety
  const tail = Number(orderId.slice(-2)) || 0
  if (tail % 11 === 0) return 'cancelled'
  if (ageDays > 7) return 'shipped'
  if (tail % 5 === 0) return 'processing'
  return 'delivered'
}

function derivePaymentStatus(status: OrderStatus, orderId: string): PaymentStatus {
  if (status === 'cancelled') {
    const tail = Number(orderId.slice(-2)) || 0
    return tail % 2 === 0 ? 'refunded' : 'waiting'
  }
  if (status === 'processing') return 'waiting'
  return 'paid'
}

/** Returns the order with derived fields filled in (idempotent). */
function enrichOrder(o: Order): Required<Order> {
  const status = o.status ?? deriveStatus(o.id, o.date)
  return {
    ...o,
    category: o.category ?? deriveCategory(o.product),
    status,
    paymentStatus: o.paymentStatus ?? derivePaymentStatus(status, o.id),
  }
}

const ORDER_STATUS_CFG: Record<OrderStatus, { label: string; class: string }> = {
  delivered:  { label: 'Selesai',    class: 'bg-green-50 text-green-700 border-green-200' },
  shipped:    { label: 'Dikirim',    class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  processing: { label: 'Diproses',   class: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled:  { label: 'Dibatalkan', class: 'bg-red-50 text-red-700 border-red-200' },
}

const PAYMENT_STATUS_CFG: Record<PaymentStatus, { label: string; class: string }> = {
  paid:     { label: 'Lunas',         class: 'bg-green-50 text-green-700 border-green-200' },
  waiting:  { label: 'Menunggu',      class: 'bg-amber-50 text-amber-700 border-amber-200' },
  refunded: { label: 'Dikembalikan',  class: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
}

// ─── Segment Badge ────────────────────────────────────────────────────────────

function SegmentBadge({ segment }: { segment: Segment }) {
  if (segment === 'VIP')
    return (
      <Badge className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
        VIP
      </Badge>
    )
  if (segment === 'Regular')
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-blue-700 border-blue-400 bg-blue-50 hover:bg-blue-50">
        <ShoppingBag className="w-3 h-3" />
        Regular
      </Badge>
    )
  return (
    <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-400 bg-green-50 hover:bg-green-50">
      <Users className="w-3 h-3" />
      New
    </Badge>
  )
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function CustomerDetailDialog({
  customer,
  open,
  onClose,
  onOpenHistory,
}: {
  customer: Customer | null
  open: boolean
  onClose: () => void
  onOpenHistory: (c: Customer) => void
}) {
  const { hasFeature } = useTenant()
  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pelanggan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg leading-tight">{customer.name}</p>
              <SegmentBadge segment={customer.segment} />
            </div>
          </div>

          <Separator />

          {/* Contact & Info */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <TruncatedText as="span" className="truncate">{customer.email}</TruncatedText>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{customer.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Bergabung sejak {formatDate(customer.joinDate)}</span>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3 min-w-0">
              <p className="text-xs text-muted-foreground">Total Pesanan</p>
              <TruncatedText className="text-xl font-bold mt-0.5 text-right tabular-nums truncate">{customer.totalOrders}</TruncatedText>
            </div>
            <div className="rounded-lg bg-muted p-3 min-w-0">
              <p className="text-xs text-muted-foreground">Total Belanja</p>
              <TruncatedText className="text-xl font-bold mt-0.5 text-right tabular-nums truncate">{formatPrice(customer.totalSpend)}</TruncatedText>
            </div>
          </div>

          <Separator />

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Riwayat Pesanan Terakhir</p>
              {hasFeature('customer-history-detail') && customer.orders.length > 3 && (
                <span className="text-xs text-muted-foreground">menampilkan 3 dari {customer.orders.length}</span>
              )}
            </div>
            <div className="space-y-2">
              {customer.orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between gap-3 text-sm p-2.5 rounded-lg border bg-card">
                  <div className="min-w-0">
                    <TruncatedText className="font-medium truncate">{order.product}</TruncatedText>
                    <p className="text-xs text-muted-foreground tabular-nums">{order.id} · {formatDate(order.date)}</p>
                  </div>
                  <p className="font-semibold shrink-0 text-right tabular-nums">{formatPrice(order.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {hasFeature('customer-history-detail') && (
            <Button onClick={() => onOpenHistory(customer)} className="flex items-center gap-1.5">
              <History className="w-4 h-4" />
              Riwayat Belanja Detail
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Riwayat Belanja Detail (Business only) ───────────────────────────────────

type PeriodFilter = '30d' | '90d' | '6m' | '1y' | 'all'
type StatusFilter = 'all' | OrderStatus

const PERIOD_OPTS: Array<{ value: PeriodFilter; label: string; days: number | null }> = [
  { value: '30d', label: '30 hari terakhir', days: 30 },
  { value: '90d', label: '90 hari terakhir', days: 90 },
  { value: '6m',  label: '6 bulan terakhir', days: 180 },
  { value: '1y',  label: '1 tahun terakhir', days: 365 },
  { value: 'all', label: 'Semua periode',   days: null },
]

// ─── API → Local type mapper ──────────────────────────────────────────────────

function deriveSegment(totalOrders: number, totalSpend: number): Segment {
  if (totalSpend >= 10000000 || totalOrders >= 20) return 'VIP'
  if (totalOrders >= 2) return 'Regular'
  return 'New'
}

function mapApiCustomer(c: ApiCustomer): Customer {
  const totalOrders = Number(c.total_orders) || 0
  const totalSpend = Number(c.total_spend) || 0
  return {
    id: Number(c.id),
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: c.address ?? '',
    segment: (c.segment as Segment) ?? deriveSegment(totalOrders, totalSpend),
    totalOrders,
    totalSpend,
    lastOrder: c.last_order ?? c.last_order_date ?? '',
    joinDate: c.join_date ?? c.created_at ?? '',
    orders: (c.orders ?? []).map(o => ({
      id: String(o.id),
      product: (o.items ?? o.order_items ?? [])[0]?.product_name
        ?? (o.items ?? o.order_items ?? [])[0]?.name
        ?? '-',
      amount: Number(o.total_amount ?? o.total) || 0,
      date: o.created_at ?? o.order_date ?? '',
      status: o.status as OrderStatus | undefined,
    })),
  }
}

function CustomerHistoryDialog({
  customer,
  open,
  onClose,
  storeName,
}: {
  customer: Customer | null
  open: boolean
  onClose: () => void
  storeName?: string
}) {
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const enriched = useMemo<Required<Order>[]>(
    () => (customer?.orders ?? []).map(enrichOrder),
    [customer]
  )

  const filtered = useMemo(() => {
    const periodCfg = PERIOD_OPTS.find(p => p.value === period)
    const cutoff = periodCfg?.days ? Date.now() - periodCfg.days * 86_400_000 : null
    return enriched.filter(o => {
      if (cutoff !== null && new Date(o.date).getTime() < cutoff) return false
      if (status !== 'all' && o.status !== status) return false
      return true
    })
  }, [enriched, period, status])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [filtered]
  )

  // ── Analytics ──
  const analytics = useMemo(() => {
    const completed = filtered.filter(o => o.status !== 'cancelled')
    const totalSpend = completed.reduce((s, o) => s + o.amount, 0)
    const aov = completed.length > 0 ? totalSpend / completed.length : 0

    const catTotals = new Map<string, number>()
    completed.forEach(o => {
      catTotals.set(o.category, (catTotals.get(o.category) ?? 0) + o.amount)
    })
    const favoriteCategory = [...catTotals.entries()].sort((a, b) => b[1] - a[1])[0]

    // Lifetime value across ALL orders (ignores filter)
    const lifetimeValue = enriched
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + o.amount, 0)

    // Repeat rate: orders per month since join
    const firstDate = enriched.length > 0
      ? new Date(enriched.reduce((min, o) => o.date < min ? o.date : min, enriched[0].date))
      : new Date()
    const monthsActive = Math.max(1, (Date.now() - firstDate.getTime()) / (30 * 86_400_000))
    const orderFrequency = enriched.length / monthsActive

    return {
      totalOrders: filtered.length,
      completedOrders: completed.length,
      cancelledOrders: filtered.filter(o => o.status === 'cancelled').length,
      totalSpend,
      aov,
      favoriteCategory: favoriteCategory ? favoriteCategory[0] : '—',
      favoriteCategoryAmount: favoriteCategory ? favoriteCategory[1] : 0,
      lifetimeValue,
      orderFrequency,
    }
  }, [filtered, enriched])

  const handleExportPdf = () => {
    if (!customer) return
    const periodLabel = PERIOD_OPTS.find(p => p.value === period)?.label ?? '—'
    const statusLabel = status === 'all' ? 'Semua status' : ORDER_STATUS_CFG[status].label

    exportPdf({
      fileName: `riwayat-belanja-${customer.name.replace(/\s+/g, '-').toLowerCase()}-${fileStamp()}`,
      title: `Riwayat Belanja — ${customer.name}`,
      subtitle: `${customer.email} · Bergabung ${formatDate(customer.joinDate)} · ${customer.segment}`,
      storeName,
      orientation: 'landscape',
      summary: [
        { label: 'Total Pesanan', value: String(analytics.totalOrders) },
        { label: 'Total Belanja', value: formatRupiah(analytics.totalSpend) },
        { label: 'Rata-rata (AOV)', value: formatRupiah(Math.round(analytics.aov)) },
        { label: 'Kategori Favorit', value: analytics.favoriteCategory },
      ],
      columns: [
        { header: 'No. Pesanan', width: 30 },
        { header: 'Tanggal', width: 26 },
        { header: 'Produk', width: 60 },
        { header: 'Kategori', width: 30 },
        { header: 'Total', width: 30, align: 'right' },
        { header: 'Status', width: 22, align: 'center' },
        { header: 'Pembayaran', width: 24, align: 'center' },
      ],
      rows: sorted.map(o => [
        o.id,
        formatDate(o.date),
        o.product,
        o.category,
        formatRupiah(o.amount),
        ORDER_STATUS_CFG[o.status].label,
        PAYMENT_STATUS_CFG[o.paymentStatus].label,
      ]),
      footnote: `Filter: ${periodLabel} · ${statusLabel}`,
    })
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Belanja — {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identity strip */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{customer.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Bergabung {formatDate(customer.joinDate)}</span>
            <SegmentBadge segment={customer.segment} />
          </div>

          {/* Filters + Export */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filter:
            </div>
            <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIOD_OPTS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {(Object.keys(ORDER_STATUS_CFG) as OrderStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{ORDER_STATUS_CFG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-8 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Export PDF
            </Button>
          </div>

          {/* Analytics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-blue-50 border border-blue-100 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-blue-700 truncate">Total Pesanan</p>
                <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              </div>
              <TruncatedText className="text-xl font-bold text-blue-900 mt-1 text-right tabular-nums truncate">{analytics.totalOrders}</TruncatedText>
              <p className="text-[10px] text-blue-600 mt-0.5 tabular-nums">
                {analytics.completedOrders} selesai · {analytics.cancelledOrders} batal
              </p>
            </div>
            <div className="rounded-xl p-3 bg-green-50 border border-green-100 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-green-700 truncate">Total Belanja</p>
                <Wallet className="w-3.5 h-3.5 text-green-500 shrink-0" />
              </div>
              <TruncatedText className="text-lg font-bold text-green-900 mt-1 text-right tabular-nums truncate">{formatPrice(analytics.totalSpend)}</TruncatedText>
              <TruncatedText className="text-[10px] text-green-600 mt-0.5 tabular-nums truncate">
                AOV: {formatPrice(Math.round(analytics.aov))}
              </TruncatedText>
            </div>
            <div className="rounded-xl p-3 bg-amber-50 border border-amber-100 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-amber-700 truncate">Kategori Favorit</p>
                <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>
              <TruncatedText className="text-base font-bold text-amber-900 mt-1 truncate">{analytics.favoriteCategory}</TruncatedText>
              <TruncatedText className="text-[10px] text-amber-600 mt-0.5 tabular-nums truncate">
                {formatPrice(analytics.favoriteCategoryAmount)}
              </TruncatedText>
            </div>
            <div className="rounded-xl p-3 bg-purple-50 border border-purple-100 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-purple-700 truncate">Lifetime Value</p>
                <BarChart3 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              </div>
              <TruncatedText className="text-lg font-bold text-purple-900 mt-1 text-right tabular-nums truncate">{formatPrice(analytics.lifetimeValue)}</TruncatedText>
              <p className="text-[10px] text-purple-600 mt-0.5 tabular-nums">
                {analytics.orderFrequency.toFixed(1)} pesanan / bulan
              </p>
            </div>
          </div>

          {/* Orders table */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Riwayat Pesanan ({sorted.length})
            </p>
            {sorted.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada pesanan untuk filter ini</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pesanan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Pembayaran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap tabular-nums">{formatDate(o.date)}</TableCell>
                        <TableCell className="text-sm">{o.product}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="text-xs font-normal">{o.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">{formatPrice(o.amount)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${ORDER_STATUS_CFG[o.status].class}`}>
                            {ORDER_STATUS_CFG[o.status].label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${PAYMENT_STATUS_CFG[o.paymentStatus].class}`}>
                            {PAYMENT_STATUS_CFG[o.paymentStatus].label}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {sorted.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Rincian per Kategori</p>
              <div className="space-y-2">
                {(() => {
                  const byCat = new Map<string, { count: number; total: number }>()
                  sorted.filter(o => o.status !== 'cancelled').forEach(o => {
                    const cur = byCat.get(o.category) ?? { count: 0, total: 0 }
                    cur.count += 1
                    cur.total += o.amount
                    byCat.set(o.category, cur)
                  })
                  const entries = [...byCat.entries()].sort((a, b) => b[1].total - a[1].total)
                  const grand = entries.reduce((s, [, v]) => s + v.total, 0)
                  return entries.map(([cat, v]) => {
                    const pct = grand > 0 ? (v.total / grand) * 100 : 0
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between gap-3 text-sm mb-1">
                          <span className="font-medium truncate">{cat}</span>
                          <span className="text-muted-foreground tabular-nums shrink-0">
                            {v.count} pesanan · {formatPrice(v.total)} · {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomersPage() {
  const { hasFeature, tenant } = useTenant()
  const [customerList, setCustomerList] = useState<Customer[]>(customers)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [customersError, setCustomersError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<'all' | Segment>('all')
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true)
    setCustomersError(null)
    try {
      const data = await customersApi.list()
      setCustomerList(data.map(mapApiCustomer))
    } catch (err) {
      setCustomersError(err instanceof Error ? err.message : 'Gagal memuat pelanggan')
      setCustomerList(customers) // fallback ke mock
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  // ── Derived state ──
  const filtered = customerList.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSegment = segmentFilter === 'all' || c.segment === segmentFilter
    return matchSearch && matchSegment
  })

  const isShowAll = pageSize === 0
  const effectiveSize = isShowAll ? filtered.length : pageSize
  const totalPages = Math.max(1, Math.ceil(filtered.length / (effectiveSize || 1)))
  const page = Math.min(currentPage, totalPages)
  const paged = isShowAll ? filtered : filtered.slice((page - 1) * effectiveSize, page * effectiveSize)
  const startItem = filtered.length === 0 ? 0 : isShowAll ? 1 : (page - 1) * effectiveSize + 1
  const endItem = isShowAll ? filtered.length : Math.min(page * effectiveSize, filtered.length)

  const resetPage = () => setCurrentPage(1)

  // ── Stats ──
  const totalCustomers = customerList.length
  const newThisMonth = customerList.filter(c => {
    const join = new Date(c.joinDate)
    const now = new Date()
    return join.getMonth() === now.getMonth() && join.getFullYear() === now.getFullYear()
  }).length
  const activeCustomers = customerList.filter(c => c.segment !== 'New' || c.totalOrders >= 2).length
  const avgClv = customerList.length > 0
    ? Math.round(customerList.reduce((acc, c) => acc + c.totalSpend, 0) / customerList.length)
    : 0

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center space-y-2">
          <Users className="w-10 h-10 mx-auto animate-pulse" />
          <p>Memuat pelanggan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {customersError && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <span>Gagal terhubung ke server — menampilkan data contoh</span>
          <Button variant="outline" size="sm" onClick={loadCustomers}>Muat Ulang</Button>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Manajemen Pelanggan</h1>
        <p className="text-muted-foreground">Kelola dan pantau data pelanggan toko Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{totalCustomers.toLocaleString('id-ID')}</TruncatedText>
            <p className="text-xs text-muted-foreground">pelanggan terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Pelanggan Baru Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-green-600 text-right tabular-nums truncate">+{newThisMonth}</TruncatedText>
            <p className="text-xs text-muted-foreground">bergabung bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Pelanggan Aktif</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{activeCustomers}</TruncatedText>
            <p className="text-xs text-muted-foreground">aktif bertransaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Rata-rata CLV</CardTitle>
            <Star className="h-4 w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{formatPrice(avgClv)}</TruncatedText>
            <p className="text-xs text-muted-foreground">customer lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Daftar Pelanggan</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); resetPage() }}
                  className="pl-8"
                />
              </div>
              {/* Segment filter */}
              <Select
                value={segmentFilter}
                onValueChange={v => { setSegmentFilter(v as typeof segmentFilter); resetPage() }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Segmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada pelanggan yang ditemukan</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama / Email</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead className="text-right">Total Pesanan</TableHead>
                    <TableHead className="text-right">Total Belanja</TableHead>
                    <TableHead>Segmen</TableHead>
                    <TableHead>Terakhir Beli</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {(customer.name ?? '').charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <TruncatedText className="font-medium truncate">{customer.name}</TruncatedText>
                            <TruncatedText className="text-xs text-muted-foreground truncate">{customer.email}</TruncatedText>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{customer.phone}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">{formatPrice(customer.totalSpend)}</TableCell>
                      <TableCell>
                        <SegmentBadge segment={customer.segment} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(customer.lastOrder)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Lihat detail"
                            onClick={() => setViewCustomer(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {hasFeature('customer-history-detail') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Riwayat belanja detail"
                              onClick={() => setHistoryCustomer(customer)}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Menampilkan {startItem}–{endItem} dari {filtered.length} pelanggan
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Tampilkan</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={v => { setPageSize(Number(v)); resetPage() }}
                    >
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="0">Semua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isShowAll && totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          aria-disabled={page === 1}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                        <PaginationItem key={n}>
                          <PaginationLink
                            isActive={n === page}
                            onClick={() => setCurrentPage(n)}
                            className="cursor-pointer"
                          >
                            {n}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          aria-disabled={page === totalPages}
                          className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <CustomerDetailDialog
        customer={viewCustomer}
        open={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        onOpenHistory={c => {
          setViewCustomer(null)
          setHistoryCustomer(c)
        }}
      />

      {/* Riwayat Belanja Detail (Business only) */}
      <CustomerHistoryDialog
        customer={historyCustomer}
        open={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        storeName={tenant?.storeName}
      />
    </div>
  )
}
