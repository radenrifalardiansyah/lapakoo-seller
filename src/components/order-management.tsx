import { useState, useEffect, useCallback } from 'react'
import { ordersApi, type ApiOrder } from '../lib/api'
import * as XLSX from 'xlsx'
import { exportPdf, fileStamp, formatRupiah } from '../lib/pdf-export'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { TruncatedText } from './ui/truncated-text'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Separator } from "./ui/separator"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "./ui/pagination"
import {
  Search, Eye, Truck, Package, CheckCircle, Clock,
  ShoppingCart, TrendingUp, AlertCircle, FileSpreadsheet, FileText,
  MapPin, Phone, Mail, Hash, Calendar, X, ChevronRight,
  MessageCircle, Printer, Ban, RotateCcw, CheckSquare, Square,
  ThumbsUp, ThumbsDown, Send
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'


// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'waiting' | 'paid' | 'failed' | 'refunded'
type ReturType = 'return_item' | 'refund_only'
type ReturStatus = 'requested' | 'approved' | 'rejected' | 'completed'

interface ReturnRequest {
  type: ReturType
  reason: string
  notes: string
  requestDate: string
  status: ReturStatus
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer: { name: string; email: string; phone: string }
  items: OrderItem[]
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  shippingAddress: string
  orderDate: string
  estimatedDelivery?: string
  trackingNumber?: string
  deliveryDate?: string
  cancelReason?: string
  courier?: string
  returnRequest?: ReturnRequest
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const initialOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: { name: 'Ahmad Rizki', email: 'ahmad.rizki@email.com', phone: '+62 812-3456-7890' },
    items: [{ name: 'iPhone 14 Pro Max', quantity: 1, price: 15999000 }],
    total: 15999000,
    status: 'pending',
    paymentStatus: 'waiting',
    shippingAddress: 'Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190',
    orderDate: '2024-01-15T10:30:00',
    estimatedDelivery: '2024-01-20',
  },
  {
    id: 'ORD-002',
    customer: { name: 'Siti Nurhaliza', email: 'siti.nurhaliza@email.com', phone: '+62 813-2468-1357' },
    items: [
      { name: 'Samsung Galaxy S23 Ultra', quantity: 1, price: 18999000 },
      { name: 'Samsung Galaxy Buds2 Pro', quantity: 1, price: 3299000 },
    ],
    total: 22298000,
    status: 'shipped',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Gatot Subroto No. 456, Bandung, Jawa Barat 40123',
    orderDate: '2024-01-14T14:20:00',
    estimatedDelivery: '2024-01-19',
    trackingNumber: 'JNE123456789',
    courier: 'JNE',
  },
  {
    id: 'ORD-003',
    customer: { name: 'Budi Santoso', email: 'budi.santoso@email.com', phone: '+62 814-9876-5432' },
    items: [
      { name: 'MacBook Air M2', quantity: 1, price: 18999000 },
      { name: 'Magic Mouse', quantity: 1, price: 1299000 },
    ],
    total: 20298000,
    status: 'delivered',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Malioboro No. 789, Yogyakarta, DIY 55271',
    orderDate: '2024-01-12T09:15:00',
    estimatedDelivery: '2024-01-17',
    trackingNumber: 'SICEPAT987654321',
    courier: 'SiCepat',
    deliveryDate: '2024-01-16T15:30:00',
  },
  {
    id: 'ORD-004',
    customer: { name: 'Dewi Lestari', email: 'dewi.lestari@email.com', phone: '+62 815-1357-2468' },
    items: [{ name: 'Nike Air Jordan 1', quantity: 2, price: 2499000 }],
    total: 4998000,
    status: 'processing',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Diponegoro No. 321, Surabaya, Jawa Timur 60265',
    orderDate: '2024-01-13T16:45:00',
    estimatedDelivery: '2024-01-18',
  },
  {
    id: 'ORD-005',
    customer: { name: 'Eko Prasetyo', email: 'eko.prasetyo@email.com', phone: '+62 816-8642-9753' },
    items: [{ name: 'iPad Air 5th Gen', quantity: 1, price: 8999000 }],
    total: 8999000,
    status: 'cancelled',
    paymentStatus: 'refunded',
    shippingAddress: 'Jl. Ahmad Yani No. 654, Medan, Sumatera Utara 20111',
    orderDate: '2024-01-11T11:20:00',
    cancelReason: 'Pelanggan membatalkan pesanan',
  },
  {
    id: 'ORD-006',
    customer: { name: 'Rina Wulandari', email: 'rina.wulandari@email.com', phone: '+62 817-5544-3322' },
    items: [
      { name: 'Adidas Ultraboost 22', quantity: 1, price: 2899000 },
      { name: 'Nike Dri-FIT Shirt', quantity: 2, price: 449000 },
    ],
    total: 3797000,
    status: 'pending',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Raya Bogor No. 88, Bogor, Jawa Barat 16720',
    orderDate: '2024-01-15T08:00:00',
    estimatedDelivery: '2024-01-20',
  },
  {
    id: 'ORD-007',
    customer: { name: 'Farhan Hidayat', email: 'farhan.h@email.com', phone: '+62 818-9988-7766' },
    items: [{ name: 'Sony WH-1000XM5', quantity: 1, price: 5499000 }],
    total: 5499000,
    status: 'processing',
    paymentStatus: 'paid',
    shippingAddress: 'Jl. Veteran No. 77, Semarang, Jawa Tengah 50233',
    orderDate: '2024-01-14T19:30:00',
    estimatedDelivery: '2024-01-19',
  },
]

// ─── API → Local type mapper ──────────────────────────────────────────────────

function mapApiOrder(o: ApiOrder): Order {
  const rawItems = o.items ?? o.order_items ?? []
  const items: OrderItem[] = rawItems.map(i => ({
    name: i.product_name ?? i.name ?? '',
    quantity: i.qty ?? i.quantity ?? 1,
    price: Number(i.unit_price ?? i.price) || 0,
  }))
  const total = Number(o.total_amount ?? o.total) || items.reduce((s, i) => s + i.price * i.quantity, 0)
  const ret = o.return
  return {
    id: String(o.id),
    customer: {
      name: o.customer?.name ?? o.customer_name ?? 'Pelanggan',
      email: o.customer?.email ?? o.customer_email ?? '',
      phone: o.customer?.phone ?? o.customer_phone ?? '',
    },
    items,
    total,
    status: (o.status as OrderStatus) ?? 'pending',
    paymentStatus: (o.payment_status as PaymentStatus) ?? 'waiting',
    shippingAddress: o.shipping_address ?? '',
    orderDate: o.created_at ?? o.order_date ?? new Date().toISOString(),
    estimatedDelivery: o.estimated_delivery,
    trackingNumber: o.tracking_number,
    deliveryDate: o.delivered_at,
    cancelReason: o.cancel_reason,
    courier: o.courier,
    returnRequest: ret
      ? {
          type: (ret.type as ReturType) ?? 'return_item',
          reason: ret.reason ?? '',
          notes: ret.notes ?? '',
          requestDate: ret.request_date ?? new Date().toISOString(),
          status: (ret.status as ReturStatus) ?? 'requested',
        }
      : undefined,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateString: string, withTime = true) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const COURIERS = ['JNE', 'SiCepat', 'J&T Express', 'AnterAja', 'Ninja Xpress', 'Pos Indonesia', 'Tiki', 'Lion Parcel']

const CANCEL_REASONS = [
  'Permintaan pelanggan',
  'Stok tidak tersedia',
  'Pembayaran gagal / belum dibayar',
  'Alamat pengiriman tidak valid',
  'Produk bermasalah',
  'Lainnya',
]

const RETUR_REASONS = [
  'Produk rusak / cacat saat diterima',
  'Produk tidak sesuai deskripsi',
  'Produk yang dikirim salah',
  'Kualitas produk tidak memuaskan',
  'Lainnya',
]

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; badgeClass: string; icon: React.ElementType }> = {
  pending:    { label: 'Menunggu',   color: 'text-amber-600',  badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  processing: { label: 'Diproses',   color: 'text-blue-600',   badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Package },
  shipped:    { label: 'Dikirim',    color: 'text-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck },
  delivered:  { label: 'Selesai',    color: 'text-green-600',  badgeClass: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle },
  cancelled:  { label: 'Dibatalkan', color: 'text-red-600',    badgeClass: 'bg-red-50 text-red-700 border-red-200',         icon: X },
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; badgeClass: string }> = {
  waiting:  { label: 'Menunggu Bayar', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:     { label: 'Lunas',          badgeClass: 'bg-green-50 text-green-700 border-green-200' },
  failed:   { label: 'Gagal',          badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  refunded: { label: 'Dikembalikan',   badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
}

const RETUR_STATUS_CONFIG: Record<ReturStatus, { label: string; badgeClass: string }> = {
  requested: { label: 'Menunggu Review', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  approved:  { label: 'Disetujui',       badgeClass: 'bg-green-50 text-green-700 border-green-200' },
  rejected:  { label: 'Ditolak',         badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  completed: { label: 'Selesai',         badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.badgeClass}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.badgeClass}`}>
      {cfg.label}
    </span>
  )
}

function ReturBadge({ status }: { status: ReturStatus }) {
  const cfg = RETUR_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.badgeClass}`}>
      <RotateCcw className="w-3 h-3" />Retur · {cfg.label}
    </span>
  )
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <X className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700 font-medium">Pesanan Dibatalkan</span>
      </div>
    )
  }
  const currentIdx = STATUS_FLOW.indexOf(status)
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => {
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                done
                  ? active
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-green-500 border-green-500 text-white'
                  : 'bg-background border-muted-foreground/30 text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${done ? active ? 'text-primary' : 'text-green-600' : 'text-muted-foreground'}`}>
                {cfg.label}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-green-400' : 'bg-muted-foreground/20'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Bulk Ship Dialog ─────────────────────────────────────────────────────────

function BulkShipDialog({
  orders,
  open,
  onClose,
  onConfirm,
}: {
  orders: Order[]
  open: boolean
  onClose: () => void
  onConfirm: (updates: { id: string; courier: string; trackingNumber: string }[]) => void
}) {
  const [courier, setCourier] = useState('')
  const [resiMap, setResiMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setCourier('')
      setResiMap(Object.fromEntries(orders.map(o => [o.id, o.trackingNumber ?? ''])))
    }
  }, [open, orders])

  const allResiFilled = orders.every(o => (resiMap[o.id] ?? '').trim().length > 0)

  const handleConfirm = () => {
    onConfirm(orders.map(o => ({
      id: o.id,
      courier,
      trackingNumber: resiMap[o.id] ?? '',
    })))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Pengiriman Massal — {orders.length} Pesanan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Info banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium">Semua pesanan akan diubah statusnya menjadi "Dikirim"</p>
            <p className="text-blue-600 text-xs mt-0.5">Pilih satu kurir yang berlaku untuk semua pesanan, lalu masukkan nomor resi masing-masing.</p>
          </div>

          {/* Shared courier */}
          <div className="space-y-1.5">
            <Label>Kurir Pengiriman <span className="text-red-500">*</span></Label>
            <Select value={courier} onValueChange={setCourier}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kurir untuk semua pesanan" />
              </SelectTrigger>
              <SelectContent>
                {COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Per-order resi input */}
          <div className="space-y-2">
            <Label>Nomor Resi per Pesanan <span className="text-red-500">*</span></Label>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {orders.map((o, idx) => (
                <div key={o.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{o.id}</span>
                      <span className="text-xs text-muted-foreground">{o.customer.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </p>
                    <Input
                      className="h-8 text-sm mt-2"
                      placeholder="Masukkan nomor resi..."
                      value={resiMap[o.id] ?? ''}
                      onChange={e => setResiMap(prev => ({ ...prev, [o.id]: e.target.value }))}
                    />
                  </div>
                  <div className="text-xs font-medium text-right shrink-0 mt-1 tabular-nums whitespace-nowrap">
                    {formatPrice(o.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {allResiFilled && courier
                ? <span className="text-green-600 font-medium">✓ Semua resi terisi</span>
                : 'Isi semua nomor resi sebelum konfirmasi'
              }
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Batal</Button>
              <Button onClick={handleConfirm} disabled={!courier || !allResiFilled}>
                <Truck className="w-4 h-4 mr-1.5" />
                Konfirmasi Pengiriman
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cancel Order Dialog ──────────────────────────────────────────────────────

function CancelOrderDialog({
  orders,
  open,
  onClose,
  onConfirm,
}: {
  orders: Order[]
  open: boolean
  onClose: () => void
  onConfirm: (ids: string[], reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const handleClose = () => {
    setReason('')
    setNotes('')
    onClose()
  }

  const handleConfirm = () => {
    const finalReason = reason === 'Lainnya' ? notes.trim() : reason
    onConfirm(orders.map(o => o.id), finalReason)
    handleClose()
  }

  const hasPaidOrders = orders.some(o => o.paymentStatus === 'paid')

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="w-5 h-5" />
            {orders.length > 1 ? `Batalkan ${orders.length} Pesanan` : 'Batalkan Pesanan'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Orders summary */}
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pesanan yang akan dibatalkan
            </div>
            <div className="divide-y max-h-36 overflow-y-auto">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <TruncatedText className="font-mono text-sm font-medium truncate">{o.id}</TruncatedText>
                    <TruncatedText className="text-xs text-muted-foreground truncate">{o.customer.name}</TruncatedText>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium tabular-nums whitespace-nowrap">{formatPrice(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Alasan Pembatalan <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih alasan pembatalan" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {reason === 'Lainnya' && (
            <div className="space-y-1.5">
              <Label>Keterangan <span className="text-red-500">*</span></Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Jelaskan alasan pembatalan secara detail..."
                rows={3}
              />
            </div>
          )}

          {hasPaidOrders && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pesanan yang sudah <strong>Lunas</strong> akan otomatis ditandai <strong>Dikembalikan (Refunded)</strong>.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!reason || (reason === 'Lainnya' && !notes.trim())}
            >
              <Ban className="w-4 h-4 mr-1.5" />
              Ya, Batalkan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Retur Dialog ─────────────────────────────────────────────────────────────

function ReturDialog({
  order,
  open,
  onClose,
  onConfirm,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string, request: ReturnRequest) => void
}) {
  const [type, setType] = useState<ReturType>('return_item')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const handleClose = () => {
    setType('return_item')
    setReason('')
    setNotes('')
    onClose()
  }

  const handleConfirm = () => {
    if (!order) return
    onConfirm(order.id, {
      type,
      reason: reason === 'Lainnya' ? notes.trim() : reason,
      notes,
      requestDate: new Date().toISOString(),
      status: 'requested',
    })
    handleClose()
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Ajukan Retur / Pengembalian
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Order info */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between gap-2">
              <TruncatedText as="span" className="font-mono font-medium truncate">{order.id}</TruncatedText>
              <span className="font-medium tabular-nums whitespace-nowrap shrink-0">{formatPrice(order.total)}</span>
            </div>
            <p className="text-muted-foreground">{order.customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.items.map(i => `${i.name} ×${i.quantity}`).join(' · ')}
            </p>
          </div>

          {/* Retur type */}
          <div className="space-y-2">
            <Label>Jenis Retur</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: 'return_item' as ReturType,
                  label: 'Kembalikan Produk',
                  desc: 'Produk dikembalikan + dana dikembalikan',
                },
                {
                  val: 'refund_only' as ReturType,
                  label: 'Refund Saja',
                  desc: 'Dana dikembalikan tanpa pengembalian produk',
                },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setType(opt.val)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    type === opt.val
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`}
                >
                  <p className="text-sm font-medium leading-tight">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Alasan Retur <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih alasan retur" />
              </SelectTrigger>
              <SelectContent>
                {RETUR_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>
              Keterangan Tambahan
              {reason === 'Lainnya' && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Jelaskan kondisi produk, lampirkan foto jika perlu..."
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Pengajuan retur akan ditinjau dalam 1×24 jam. Pelanggan akan dinotifikasi via email.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason || (reason === 'Lainnya' && !notes.trim())}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Ajukan Retur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Update Status Dialog ─────────────────────────────────────────────────────

function UpdateStatusDialog({
  order,
  open,
  onClose,
  onUpdate,
}: {
  order: Order
  open: boolean
  onClose: () => void
  onUpdate: (id: string, status: OrderStatus, extra?: { trackingNumber?: string; courier?: string }) => void
}) {
  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null
  const [resi, setResi] = useState(order.trackingNumber ?? '')
  const [courier, setCourier] = useState(order.courier ?? '')

  if (!nextStatus) return null

  const handleConfirm = () => {
    onUpdate(order.id, nextStatus, nextStatus === 'shipped' ? { trackingNumber: resi, courier } : undefined)
    onClose()
  }

  const nextCfg = STATUS_CONFIG[nextStatus]

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status Pesanan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <StatusBadge status={order.status} />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <StatusBadge status={nextStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            Pesanan <strong>{order.id}</strong> akan diubah statusnya menjadi <strong>{nextCfg.label}</strong>.
          </p>
          {nextStatus === 'shipped' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label>Kurir</Label>
                <Select value={courier} onValueChange={setCourier}>
                  <SelectTrigger><SelectValue placeholder="Pilih kurir" /></SelectTrigger>
                  <SelectContent>
                    {COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nomor Resi</Label>
                <Input value={resi} onChange={e => setResi(e.target.value)} placeholder="Masukkan nomor resi pengiriman" />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={handleConfirm}>Konfirmasi Update</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Order Detail Dialog ──────────────────────────────────────────────────────

function OrderDetailDialog({
  order,
  open,
  onClose,
  onUpdateStatus,
  onCancel,
  onRetur,
  onReturStatusUpdate,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
  onUpdateStatus: (order: Order) => void
  onCancel: (order: Order) => void
  onRetur: (order: Order) => void
  onReturStatusUpdate: (id: string, status: ReturStatus) => void
}) {
  if (!order) return null
  const canAdvance = order.status !== 'delivered' && order.status !== 'cancelled'
  const canCancel = order.status === 'pending' || order.status === 'processing'
  const canRetur = order.status === 'delivered' && !order.returnRequest
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg">Detail Pesanan #{order.id}</DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Timeline */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status Pengiriman</p>
            <StatusTimeline status={order.status} />
          </div>

          {/* Return request section */}
          {order.returnRequest && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-800 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  Permintaan Retur
                </p>
                <ReturBadge status={order.returnRequest.status} />
              </div>
              <div className="text-sm text-purple-700 space-y-1">
                <p><span className="text-purple-500">Jenis:</span> {order.returnRequest.type === 'return_item' ? 'Kembalikan Produk + Refund' : 'Refund Saja'}</p>
                <p><span className="text-purple-500">Alasan:</span> {order.returnRequest.reason}</p>
                {order.returnRequest.notes && order.returnRequest.notes !== order.returnRequest.reason && (
                  <p><span className="text-purple-500">Keterangan:</span> {order.returnRequest.notes}</p>
                )}
                <p><span className="text-purple-500">Tanggal:</span> {formatDate(order.returnRequest.requestDate)}</p>
              </div>
              {order.returnRequest.status === 'requested' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-400 text-green-700 hover:bg-green-50 flex-1"
                    onClick={() => onReturStatusUpdate(order.id, 'approved')}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    Setujui Retur
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-700 hover:bg-red-50 flex-1"
                    onClick={() => onReturStatusUpdate(order.id, 'rejected')}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                    Tolak Retur
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Customer + Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Informasi Pelanggan</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{order.customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{order.customer.phone}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Alamat Pengiriman</p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">No. Resi:</span>
                  <span className="font-mono font-medium text-primary">{order.trackingNumber}</span>
                  {order.courier && <span className="text-xs text-muted-foreground">({order.courier})</span>}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tanggal */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dipesan: <strong className="text-foreground">{formatDate(order.orderDate)}</strong></span>
            </div>
            {order.estimatedDelivery && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Truck className="w-3.5 h-3.5" />
                <span>Est. Tiba: <strong className="text-foreground">{formatDate(order.estimatedDelivery, false)}</strong></span>
              </div>
            )}
            {order.deliveryDate && (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Diterima: <strong>{formatDate(order.deliveryDate)}</strong></span>
              </div>
            )}
          </div>

          {order.cancelReason && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Alasan pembatalan: {order.cancelReason}</span>
            </div>
          )}

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Item Pesanan</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Produk</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Harga</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/30">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-primary tabular-nums whitespace-nowrap">{formatPrice(subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-between gap-2 pt-1 border-t">
            <div className="flex gap-2">
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => { onClose(); onCancel(order) }}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Batalkan
                </Button>
              )}
              {canRetur && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  onClick={() => { onClose(); onRetur(order) }}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Ajukan Retur
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
              {canAdvance && (
                <Button size="sm" onClick={() => { onClose(); onUpdateStatus(order) }}>
                  <ChevronRight className="w-4 h-4 mr-1.5" />
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

function OrdersTable({
  orders,
  onView,
  onUpdateStatus,
  onCancel,
  onRetur,
  selectedIds,
  onToggleSelect,
  bulkEnabled,
}: {
  orders: Order[]
  onView: (o: Order) => void
  onUpdateStatus: (o: Order) => void
  onCancel: (o: Order) => void
  onRetur: (o: Order) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  bulkEnabled: boolean
}) {
  if (orders.length === 0)
    return (
      <div className="text-center py-14 text-muted-foreground">
        <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Tidak ada pesanan</p>
      </div>
    )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {bulkEnabled && <TableHead className="w-8"></TableHead>}
          <TableHead>Pesanan</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pembayaran</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => {
          const isSelectable = order.status === 'pending' || order.status === 'processing'
          const isSelected = selectedIds.has(order.id)
          const canAdvance = order.status !== 'delivered' && order.status !== 'cancelled'
          const canCancel = order.status === 'pending' || order.status === 'processing'
          const canRetur = order.status === 'delivered' && !order.returnRequest
          const nextIdx = STATUS_FLOW.indexOf(order.status) + 1
          const nextCfg = canAdvance && nextIdx < STATUS_FLOW.length ? STATUS_CONFIG[STATUS_FLOW[nextIdx]] : null
          const NextIcon = nextCfg?.icon

          return (
            <TableRow key={order.id} className={isSelected ? 'bg-primary/5' : ''}>
              {bulkEnabled && (
                <TableCell>
                  {isSelectable ? (
                    <button
                      type="button"
                      onClick={() => onToggleSelect(order.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                  ) : null}
                </TableCell>
              )}
              <TableCell>
                <p className="font-mono font-medium text-sm">{order.id}</p>
                <p className="text-xs text-muted-foreground">{order.items.length} item</p>
                {order.returnRequest && (
                  <ReturBadge status={order.returnRequest.status} />
                )}
              </TableCell>
              <TableCell>
                <p className="font-medium text-sm">{order.customer.name}</p>
                <p className="text-xs text-muted-foreground">{order.customer.email}</p>
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap text-right tabular-nums">{formatPrice(order.total)}</TableCell>
              <TableCell><StatusBadge status={order.status} /></TableCell>
              <TableCell><PaymentBadge status={order.paymentStatus} /></TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(order.orderDate)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end items-center gap-1">
                  <Button variant="ghost" size="sm" title="Lihat detail" onClick={() => onView(order)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canAdvance && nextCfg && NextIcon && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title={`Update ke ${nextCfg.label}`}
                      className={`${nextCfg.color} hover:opacity-80`}
                      onClick={() => onUpdateStatus(order)}
                    >
                      <NextIcon className="w-4 h-4" />
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Batalkan pesanan"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onCancel(order)}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                  {canRetur && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ajukan retur"
                      className="text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => onRetur(order)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderManagement() {
  const { hasFeature, tenant } = useTenant()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const [viewOrder, setViewOrder]   = useState<Order | null>(null)
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null)
  const [cancelOrders, setCancelOrders] = useState<Order[]>([])
  const [returOrder, setReturOrder]   = useState<Order | null>(null)
  const [bulkShipOrders, setBulkShipOrders] = useState<Order[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const data = await ordersApi.list()
      setOrders(data.map(mapApiOrder))
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Gagal memuat pesanan')
      // Fallback ke mock data agar UI tetap berfungsi saat API belum live
      setOrders(initialOrders)
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const resetPage = () => setCurrentPage(1)

  const handleTabChange = (v: string) => {
    setActiveTab(v)
    resetPage()
    setSelectedIds(new Set())
  }

  // ── toggle selection ──
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── derived selection info ──
  const selectedProcessing = orders.filter(o => selectedIds.has(o.id) && o.status === 'processing')
  const selectedCancellable = orders.filter(o => selectedIds.has(o.id) && (o.status === 'pending' || o.status === 'processing'))

  // ── filters ──
  const filterOrders = (tabValue?: string) =>
    orders.filter(o => {
      const matchSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      if (tabValue === 'retur') return matchSearch && !!o.returnRequest
      const matchStatus = !tabValue || tabValue === 'all' || o.status === tabValue
      return matchSearch && matchStatus
    })

  // ── stats ──
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    retur: orders.filter(o => !!o.returnRequest).length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
  }

  // ── handlers ──
  const handleUpdateStatus = (id: string, status: OrderStatus, extra?: { trackingNumber?: string; courier?: string }) => {
    const patch = {
      ...extra,
      ...(status === 'delivered' ? { deliveryDate: new Date().toISOString() } : {}),
    }
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status, ...patch } : o
    ))
    setViewOrder(prev => prev?.id === id ? { ...prev!, status, ...patch } : prev)
    // Sinkronisasi ke API (optimistic)
    ordersApi.update(id, { status, tracking_number: extra?.trackingNumber, courier: extra?.courier }).catch(() => {})
  }

  const handleBulkShip = (updates: { id: string; courier: string; trackingNumber: string }[]) => {
    setOrders(prev => prev.map(o => {
      const update = updates.find(u => u.id === o.id)
      if (!update) return o
      return { ...o, status: 'shipped' as OrderStatus, courier: update.courier, trackingNumber: update.trackingNumber }
    }))
    updates.forEach(u =>
      ordersApi.update(u.id, { status: 'shipped', courier: u.courier, tracking_number: u.trackingNumber }).catch(() => {})
    )
    setSelectedIds(new Set())
    setBulkShipOrders([])
  }

  const handleCancelOrders = (ids: string[], reason: string) => {
    setOrders(prev => prev.map(o => {
      if (!ids.includes(o.id)) return o
      return {
        ...o,
        status: 'cancelled' as OrderStatus,
        paymentStatus: o.paymentStatus === 'paid' ? 'refunded' as PaymentStatus : o.paymentStatus,
        cancelReason: reason,
      }
    }))
    ids.forEach(id => ordersApi.update(id, { status: 'cancelled', cancel_reason: reason }).catch(() => {}))
    setSelectedIds(new Set())
    setCancelOrders([])
  }

  const handleReturRequest = (id: string, request: ReturnRequest) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, returnRequest: request } : o))
    ordersApi.createReturn(id, {
      type: request.type,
      reason: request.reason,
      notes: request.notes,
      status: request.status,
    }).catch(() => {})
  }

  const handleReturStatusUpdate = (id: string, status: ReturStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === id && o.returnRequest
        ? { ...o, returnRequest: { ...o.returnRequest, status } }
        : o
    ))
    setViewOrder(prev =>
      prev?.id === id && prev.returnRequest
        ? { ...prev, returnRequest: { ...prev.returnRequest, status } }
        : prev
    )
    ordersApi.updateReturn(id, { status }).catch(() => {})
  }

  // ── export ──
  const handleExport = () => {
    const data = filterOrders(activeTab === 'all' ? undefined : activeTab)
    const rows = data.map(o => ({
      'No. Pesanan': o.id,
      'Nama Pelanggan': o.customer.name,
      'Email': o.customer.email,
      'Telepon': o.customer.phone,
      'Produk': o.items.map(i => `${i.name} x${i.quantity}`).join(', '),
      'Total (Rp)': o.total,
      'Status Pesanan': STATUS_CONFIG[o.status].label,
      'Status Pembayaran': PAYMENT_CONFIG[o.paymentStatus].label,
      'Tanggal Pesan': formatDate(o.orderDate),
      'No. Resi': o.trackingNumber ?? '',
      'Kurir': o.courier ?? '',
      'Alamat': o.shippingAddress,
      'Alasan Batal': o.cancelReason ?? '',
      'Status Retur': o.returnRequest ? RETUR_STATUS_CONFIG[o.returnRequest.status].label : '',
      'Alasan Retur': o.returnRequest?.reason ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 26 }, { wch: 18 },
      { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
      { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 30 }, { wch: 16 }, { wch: 30 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pesanan')
    XLSX.writeFile(wb, `pesanan-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportPdf = () => {
    const data = filterOrders(activeTab === 'all' ? undefined : activeTab)
    const totalOmzet = data.reduce((sum, o) => sum + o.total, 0)

    exportPdf({
      fileName: `pesanan-${activeTab}-${fileStamp()}`,
      title: 'Daftar Pesanan',
      subtitle: `Filter: ${activeTab === 'all' ? 'Semua status' : (STATUS_CONFIG[activeTab as OrderStatus]?.label ?? activeTab)}`,
      storeName: tenant?.storeName,
      orientation: 'landscape',
      summary: [
        { label: 'Total Pesanan', value: String(data.length) },
        { label: 'Total Omzet', value: formatRupiah(totalOmzet) },
        { label: 'Filter', value: activeTab === 'all' ? 'Semua' : (STATUS_CONFIG[activeTab as OrderStatus]?.label ?? activeTab) },
      ],
      columns: [
        { header: 'No. Pesanan', width: 28 },
        { header: 'Pelanggan', width: 38 },
        { header: 'Produk', width: 70 },
        { header: 'Total', width: 28, align: 'right' },
        { header: 'Status', width: 22 },
        { header: 'Bayar', width: 22 },
        { header: 'Tanggal', width: 24 },
      ],
      rows: data.map(o => [
        o.id,
        `${o.customer.name}\n${o.customer.email}`,
        o.items.map(i => `${i.name} x${i.quantity}`).join(', '),
        formatRupiah(o.total),
        STATUS_CONFIG[o.status].label,
        PAYMENT_CONFIG[o.paymentStatus].label,
        formatDate(o.orderDate),
      ]),
      footnote: 'Daftar pesanan diekspor dari Eleven Seller',
    })
  }

  const TABS = [
    { value: 'all',        label: 'Semua',     count: stats.total },
    { value: 'pending',    label: 'Menunggu',   count: stats.pending },
    { value: 'processing', label: 'Diproses',   count: stats.processing },
    { value: 'shipped',    label: 'Dikirim',    count: stats.shipped },
    { value: 'delivered',  label: 'Selesai',    count: stats.delivered },
    { value: 'cancelled',  label: 'Dibatalkan', count: stats.cancelled },
    { value: 'retur',      label: 'Retur',      count: stats.retur },
  ]

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center space-y-2">
          <ShoppingCart className="w-10 h-10 mx-auto animate-pulse" />
          <p>Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {ordersError && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <span><AlertCircle className="w-4 h-4 inline mr-1.5" />Gagal terhubung ke server — menampilkan data contoh</span>
          <Button variant="outline" size="sm" onClick={loadOrders}>Muat Ulang</Button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pesanan</h1>
          <p className="text-muted-foreground">Kelola dan pantau semua pesanan yang masuk dari pelanggan</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {hasFeature('export-data') && (
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          )}
          {hasFeature('export-pdf') && (
            <Button variant="outline" onClick={handleExportPdf} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{stats.total}</TruncatedText>
            <p className="text-xs text-muted-foreground">semua pesanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Perlu Diproses</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-amber-600 text-right tabular-nums truncate">{stats.pending + stats.processing}</TruncatedText>
            <p className="text-xs text-muted-foreground">menunggu & diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Sedang Dikirim</CardTitle>
            <Truck className="h-4 w-4 text-indigo-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-indigo-600 text-right tabular-nums truncate">{stats.shipped}</TruncatedText>
            <p className="text-xs text-muted-foreground">dalam perjalanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-green-600 text-right tabular-nums truncate">{formatPrice(stats.revenue)}</TruncatedText>
            <p className="text-xs text-muted-foreground">dari pesanan lunas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto">
          <TabsList className="flex w-max">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
                {t.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t.value === 'retur' && t.count > 0
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {t.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Daftar Pesanan</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nomor pesanan atau nama pelanggan..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); resetPage() }}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk action bar */}
            {hasFeature('bulk-actions') && selectedIds.size > 0 && (
              <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{selectedIds.size} pesanan dipilih</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Batal pilih
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedProcessing.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setBulkShipOrders(selectedProcessing)}
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Kirim Massal ({selectedProcessing.length})
                    </Button>
                  )}
                  {selectedCancellable.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelOrders(selectedCancellable)}
                    >
                      <Ban className="w-4 h-4 mr-1.5" />
                      Batalkan ({selectedCancellable.length})
                    </Button>
                  )}
                </div>
              </div>
            )}

            {TABS.map(t => {
              const filtered = filterOrders(t.value)
              const isShowAll = pageSize === 0
              const effectiveSize = isShowAll ? filtered.length : pageSize
              const totalPages = Math.max(1, Math.ceil(filtered.length / effectiveSize))
              const page = Math.min(currentPage, totalPages)
              const paged = isShowAll ? filtered : filtered.slice((page - 1) * effectiveSize, page * effectiveSize)
              const startItem = isShowAll ? 1 : (page - 1) * effectiveSize + 1
              const endItem = isShowAll ? filtered.length : Math.min(page * effectiveSize, filtered.length)

              return (
                <TabsContent key={t.value} value={t.value} className="mt-0 space-y-4">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada pesanan ditemukan</p>
                    </div>
                  ) : (
                    <>
                      <OrdersTable
                        orders={paged}
                        onView={setViewOrder}
                        onUpdateStatus={o => setUpdateOrder(o)}
                        onCancel={o => setCancelOrders([o])}
                        onRetur={o => setReturOrder(o)}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        bulkEnabled={hasFeature('bulk-actions')}
                      />

                      {/* Pagination bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {filtered.length > 0
                              ? `Menampilkan ${startItem}–${endItem} dari ${filtered.length} pesanan`
                              : ''}
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
                </TabsContent>
              )
            })}
          </CardContent>
        </Card>
      </Tabs>

      {/* Detail Dialog */}
      <OrderDetailDialog
        order={viewOrder}
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        onUpdateStatus={o => setUpdateOrder(o)}
        onCancel={o => setCancelOrders([o])}
        onRetur={o => setReturOrder(o)}
        onReturStatusUpdate={handleReturStatusUpdate}
      />

      {/* Update Status Dialog */}
      {updateOrder && (
        <UpdateStatusDialog
          order={updateOrder}
          open={!!updateOrder}
          onClose={() => setUpdateOrder(null)}
          onUpdate={handleUpdateStatus}
        />
      )}

      {/* Bulk Ship Dialog */}
      <BulkShipDialog
        orders={bulkShipOrders}
        open={bulkShipOrders.length > 0}
        onClose={() => setBulkShipOrders([])}
        onConfirm={handleBulkShip}
      />

      {/* Cancel Dialog */}
      <CancelOrderDialog
        orders={cancelOrders}
        open={cancelOrders.length > 0}
        onClose={() => setCancelOrders([])}
        onConfirm={handleCancelOrders}
      />

      {/* Retur Dialog */}
      <ReturDialog
        order={returOrder}
        open={!!returOrder}
        onClose={() => setReturOrder(null)}
        onConfirm={handleReturRequest}
      />
    </div>
  )
}
