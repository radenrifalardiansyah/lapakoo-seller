import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { exportPdf, fileStamp, formatRupiah } from '../lib/pdf-export'
import { TruncatedText } from './ui/truncated-text'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Separator } from "./ui/separator"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "./ui/pagination"
import {
  Megaphone, Plus, Search, Edit, Trash2, Tag, Zap,
  Copy, CheckCircle, XCircle, Clock, Timer, Flame,
  TrendingUp, BadgePercent, FileSpreadsheet, FileText, AlertCircle,
  Package, Power, RefreshCw, ChevronDown, ChevronUp,
  Calendar, Ban,
} from 'lucide-react'
import { useInventory } from '../contexts/InventoryContext'
import { useTenant } from '../contexts/TenantContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherType   = 'percentage' | 'fixed'
type VoucherStatus = 'active' | 'scheduled' | 'expired' | 'disabled'
type FlashSaleStatus = 'active' | 'scheduled' | 'ended'

interface Voucher {
  id: string
  code: string
  name: string
  type: VoucherType
  value: number
  minPurchase: number
  maxDiscount: number | null
  quota: number
  used: number
  startDate: string
  endDate: string
  disabled: boolean
  description?: string
}

interface FlashSaleItem {
  productId: number
  productName: string
  originalPrice: number
  salePrice: number
  quota: number
  sold: number
}

interface FlashSale {
  id: string
  name: string
  startDateTime: string
  endDateTime: string
  items: FlashSaleItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function generateCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getVoucherStatus(v: Voucher): VoucherStatus {
  if (v.disabled) return 'disabled'
  const now = new Date()
  if (new Date(v.endDate + 'T23:59:59') < now) return 'expired'
  if (new Date(v.startDate) > now) return 'scheduled'
  if (v.used >= v.quota) return 'expired'
  return 'active'
}

function getFlashSaleStatus(fs: FlashSale): FlashSaleStatus {
  const now = new Date()
  if (new Date(fs.endDateTime) < now) return 'ended'
  if (new Date(fs.startDateTime) > now) return 'scheduled'
  return 'active'
}

function discountPct(original: number, sale: number) {
  return original > 0 ? Math.round(((original - sale) / original) * 100) : 0
}

// ─── Status Config ────────────────────────────────────────────────────────────

const VOUCHER_STATUS_CFG: Record<VoucherStatus, { label: string; cls: string; icon: React.ElementType }> = {
  active:    { label: 'Aktif',     cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle },
  scheduled: { label: 'Terjadwal', cls: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Clock },
  expired:   { label: 'Kadaluarsa',cls: 'bg-gray-50 text-gray-500 border-gray-200',   icon: XCircle },
  disabled:  { label: 'Dinonaktifkan', cls: 'bg-red-50 text-red-600 border-red-200',  icon: Ban },
}

const FLASH_STATUS_CFG: Record<FlashSaleStatus, { label: string; cls: string; icon: React.ElementType }> = {
  active:    { label: 'Berlangsung', cls: 'bg-red-50 text-red-600 border-red-200',    icon: Flame },
  scheduled: { label: 'Terjadwal',   cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  ended:     { label: 'Selesai',     cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const _now = new Date()
const _d = (h: number) => new Date(_now.getTime() + h * 3600_000).toISOString()

export const initialVouchers: Voucher[] = [
  {
    id: 'VCH-001', code: 'WELCOME10', name: 'Selamat Datang 10%',
    type: 'percentage', value: 10, minPurchase: 100_000, maxDiscount: 50_000,
    quota: 100, used: 45, startDate: '2024-01-01', endDate: '2026-12-31',
    disabled: false, description: 'Voucher sambutan untuk pelanggan baru.',
  },
  {
    id: 'VCH-002', code: 'HEMAT50K', name: 'Hemat Rp 50.000',
    type: 'fixed', value: 50_000, minPurchase: 500_000, maxDiscount: null,
    quota: 50, used: 50, startDate: '2024-01-01', endDate: '2024-06-30',
    disabled: false, description: 'Potongan langsung Rp 50.000 tanpa syarat tambahan.',
  },
  {
    id: 'VCH-003', code: 'FLASH20', name: 'Diskon Flash 20%',
    type: 'percentage', value: 20, minPurchase: 200_000, maxDiscount: 100_000,
    quota: 200, used: 78, startDate: '2025-05-01', endDate: '2026-07-31',
    disabled: false, description: 'Voucher khusus program flash deal.',
  },
  {
    id: 'VCH-004', code: 'LEBARAN25', name: 'Promo Hari Raya 25%',
    type: 'percentage', value: 25, minPurchase: 300_000, maxDiscount: 150_000,
    quota: 500, used: 0, startDate: '2026-06-01', endDate: '2026-06-30',
    disabled: false, description: 'Voucher spesial Lebaran, berlaku sebulan penuh.',
  },
  {
    id: 'VCH-005', code: 'VIP25K', name: 'Bonus VIP Rp 25.000',
    type: 'fixed', value: 25_000, minPurchase: 150_000, maxDiscount: null,
    quota: 1000, used: 312, startDate: '2024-09-01', endDate: '2026-08-31',
    disabled: false,
  },
  {
    id: 'VCH-006', code: 'OLDPROMO', name: 'Promo Lama 15%',
    type: 'percentage', value: 15, minPurchase: 200_000, maxDiscount: 75_000,
    quota: 300, used: 210, startDate: '2024-01-01', endDate: '2025-03-31',
    disabled: true, description: 'Voucher lama yang sudah dinonaktifkan.',
  },
]

const initialFlashSales: FlashSale[] = [
  {
    id: 'FS-001', name: 'Flash Sale Akhir Pekan',
    startDateTime: _d(-2), endDateTime: _d(4),
    items: [
      { productId: 1, productName: 'iPhone 14 Pro Max', originalPrice: 15_999_000, salePrice: 13_999_000, quota: 5, sold: 3 },
      { productId: 2, productName: 'Samsung Galaxy S23 Ultra', originalPrice: 18_999_000, salePrice: 16_499_000, quota: 8, sold: 6 },
      { productId: 3, productName: 'MacBook Air M2', originalPrice: 18_999_000, salePrice: 17_299_000, quota: 3, sold: 1 },
    ],
  },
  {
    id: 'FS-002', name: 'Promo Gadget 6.6',
    startDateTime: _d(3 * 24), endDateTime: _d(3 * 24 + 8),
    items: [
      { productId: 5, productName: 'OnePlus 11', originalPrice: 8_999_000, salePrice: 7_499_000, quota: 10, sold: 0 },
      { productId: 6, productName: 'iPad Pro M2', originalPrice: 16_999_000, salePrice: 14_999_000, quota: 5, sold: 0 },
    ],
  },
  {
    id: 'FS-003', name: 'Flash Sale Kemarin',
    startDateTime: _d(-50), endDateTime: _d(-26),
    items: [
      { productId: 4, productName: 'Nike Air Jordan 1', originalPrice: 2_499_000, salePrice: 1_899_000, quota: 20, sold: 20 },
      { productId: 7, productName: 'Adidas Ultraboost 23', originalPrice: 2_299_000, salePrice: 1_699_000, quota: 15, sold: 12 },
    ],
  },
]

// ─── Status Badges ────────────────────────────────────────────────────────────

function VoucherStatusBadge({ status }: { status: VoucherStatus }) {
  const cfg = VOUCHER_STATUS_CFG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function FlashSaleStatusBadge({ status }: { status: FlashSaleStatus }) {
  const cfg = FLASH_STATUS_CFG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ endDateTime }: { endDateTime: string }) {
  const calc = () => {
    const diff = new Date(endDateTime).getTime() - Date.now()
    if (diff <= 0) return '00:00:00'
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000)
    return () => clearInterval(id)
  }, [endDateTime])
  return <span className="font-mono font-bold tabular-nums text-red-600">{time}</span>
}

// ─── Voucher Form Dialog ──────────────────────────────────────────────────────

interface VoucherFormData {
  code: string; name: string; type: VoucherType
  value: string; minPurchase: string; maxDiscount: string
  quota: string; startDate: string; endDate: string; description: string
}

const emptyVoucherForm: VoucherFormData = {
  code: '', name: '', type: 'percentage',
  value: '', minPurchase: '', maxDiscount: '',
  quota: '', startDate: '', endDate: '', description: '',
}

function VoucherFormDialog({
  mode, initial, open, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  initial: VoucherFormData
  open: boolean
  onClose: () => void
  onSave: (data: VoucherFormData) => void
}) {
  const [form, setForm] = useState<VoucherFormData>(initial)
  const set = (k: keyof VoucherFormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleOpenChange = (o: boolean) => { if (o) setForm(initial); else onClose() }

  const isValid = form.code.trim() && form.name.trim() && form.value && form.quota && form.startDate && form.endDate

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />{mode === 'add' ? 'Buat Voucher Baru' : 'Edit Voucher'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Code */}
          <div className="space-y-1.5">
            <Label>Kode Voucher <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="Contoh: DISKON10"
                className="font-mono tracking-wider"
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0"
                onClick={() => set('code', generateCode())}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />Acak
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nama Voucher <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nama deskriptif voucher" />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipe Diskon</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Persentase (%)</SelectItem>
                  <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nilai Diskon <span className="text-red-500">*</span></Label>
              <div className="flex items-center">
                <span className="px-2.5 h-9 flex items-center bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                  {form.type === 'percentage' ? '%' : 'Rp'}
                </span>
                <Input
                  type="text" inputMode="numeric"
                  value={form.value}
                  onChange={e => set('value', e.target.value.replace(/\D/g, ''))}
                  onFocus={e => e.target.select()}
                  placeholder={form.type === 'percentage' ? '10' : '50000'}
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          {/* Min purchase + Max discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label>Min. Pembelian (Rp)</Label>
              <Input type="text" inputMode="numeric" value={form.minPurchase}
                onChange={e => set('minPurchase', e.target.value.replace(/\D/g, ''))}
                onFocus={e => e.target.select()} placeholder="0" />
              {form.minPurchase && <TruncatedText className="text-[10px] text-muted-foreground tabular-nums truncate">{formatPrice(Number(form.minPurchase))}</TruncatedText>}
            </div>
            {form.type === 'percentage' && (
              <div className="space-y-1.5 min-w-0">
                <Label>Maks. Diskon (Rp)</Label>
                <Input type="text" inputMode="numeric" value={form.maxDiscount}
                  onChange={e => set('maxDiscount', e.target.value.replace(/\D/g, ''))}
                  onFocus={e => e.target.select()} placeholder="Opsional" />
                {form.maxDiscount && <TruncatedText className="text-[10px] text-muted-foreground tabular-nums truncate">{formatPrice(Number(form.maxDiscount))}</TruncatedText>}
              </div>
            )}
          </div>

          {/* Quota */}
          <div className="space-y-1.5">
            <Label>Kuota Penggunaan <span className="text-red-500">*</span></Label>
            <Input type="text" inputMode="numeric" value={form.quota}
              onChange={e => set('quota', e.target.value.replace(/\D/g, ''))}
              onFocus={e => e.target.select()} placeholder="100" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tanggal Mulai <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Berakhir <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Deskripsi</Label>
            <Textarea rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Keterangan tambahan (opsional)..." />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button disabled={!isValid} onClick={() => { onSave(form); onClose() }}>
              {mode === 'add' ? 'Buat Voucher' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Flash Sale Form Dialog ───────────────────────────────────────────────────

interface FSForm {
  name: string
  startDateTime: string
  endDateTime: string
  items: FlashSaleItem[]
}

const emptyFSForm: FSForm = { name: '', startDateTime: '', endDateTime: '', items: [] }

function FlashSaleFormDialog({
  mode, initial, open, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  initial: FSForm
  open: boolean
  onClose: () => void
  onSave: (data: FSForm) => void
}) {
  const { products, statusOf } = useInventory()
  const [form, setForm] = useState<FSForm>(initial)
  const [addProductId, setAddProductId] = useState<string>('')
  const [addSalePrice, setAddSalePrice] = useState('')
  const [addQuota, setAddQuota]         = useState('')
  const [addError, setAddError]         = useState('')

  const handleOpenChange = (o: boolean) => {
    if (o) { setForm(initial); setAddProductId(''); setAddSalePrice(''); setAddQuota(''); setAddError('') }
    else onClose()
  }

  const availableProducts = products.filter(
    p => statusOf(p.id) === 'active' && !form.items.some(it => it.productId === p.id)
  )

  const handleAddItem = () => {
    setAddError('')
    const prod = products.find(p => p.id === Number(addProductId))
    if (!prod) { setAddError('Pilih produk terlebih dahulu'); return }
    const sp = Number(addSalePrice)
    if (!sp || sp <= 0) { setAddError('Harga flash sale harus lebih dari 0'); return }
    if (sp >= prod.price) { setAddError('Harga flash sale harus lebih kecil dari harga normal'); return }
    const q = Number(addQuota)
    if (!q || q <= 0) { setAddError('Kuota harus lebih dari 0'); return }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: prod.id, productName: prod.name,
        originalPrice: prod.price, salePrice: sp, quota: q, sold: 0,
      }],
    }))
    setAddProductId(''); setAddSalePrice(''); setAddQuota('')
  }

  const removeItem = (id: number) =>
    setForm(prev => ({ ...prev, items: prev.items.filter(it => it.productId !== id) }))

  const isValid = form.name.trim() && form.startDateTime && form.endDateTime && form.items.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />{mode === 'add' ? 'Buat Flash Sale' : 'Edit Flash Sale'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nama Flash Sale <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Contoh: Flash Sale Akhir Pekan" />
          </div>

          {/* Datetime */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Waktu Mulai <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" value={form.startDateTime}
                onChange={e => setForm(p => ({ ...p, startDateTime: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Waktu Berakhir <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" value={form.endDateTime}
                onChange={e => setForm(p => ({ ...p, endDateTime: e.target.value }))} />
            </div>
          </div>

          <Separator />

          {/* Product list */}
          <div className="space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4" />Produk Flash Sale
              {form.items.length > 0 && <span className="text-muted-foreground font-normal">({form.items.length} produk)</span>}
            </p>

            {form.items.length > 0 && (
              <div className="rounded-lg border divide-y">
                {form.items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <div className="flex-1 min-w-0">
                      <TruncatedText className="font-medium truncate">{item.productName}</TruncatedText>
                      <TruncatedText className="text-xs text-muted-foreground tabular-nums truncate">
                        Normal: {formatPrice(item.originalPrice)} →
                        <span className="text-red-600 font-semibold ml-1">{formatPrice(item.salePrice)}</span>
                        <span className="ml-1 text-green-600">(-{discountPct(item.originalPrice, item.salePrice)}%)</span>
                      </TruncatedText>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground tabular-nums">Kuota: <strong>{item.quota}</strong></p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-7 px-2"
                      onClick={() => removeItem(item.productId)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add product form */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-3 border border-dashed">
              <p className="text-xs font-medium text-muted-foreground">Tambah Produk</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select value={addProductId} onValueChange={v => { setAddProductId(v); setAddError('') }}>
                  <SelectTrigger className="sm:col-span-1">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length === 0
                      ? <div className="px-3 py-2 text-sm text-muted-foreground">Semua produk sudah ditambahkan</div>
                      : availableProducts.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} — {formatPrice(p.price)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <div className="flex items-center">
                  <span className="px-2 h-9 flex items-center bg-background border border-r-0 rounded-l-md text-xs text-muted-foreground">Rp</span>
                  <Input type="text" inputMode="numeric" value={addSalePrice}
                    onChange={e => { setAddSalePrice(e.target.value.replace(/\D/g, '')); setAddError('') }}
                    onFocus={e => e.target.select()}
                    placeholder="Harga flash" className="rounded-l-none" />
                </div>
                <div className="flex gap-2">
                  <Input type="text" inputMode="numeric" value={addQuota}
                    onChange={e => { setAddQuota(e.target.value.replace(/\D/g, '')); setAddError('') }}
                    onFocus={e => e.target.select()}
                    placeholder="Kuota" />
                  <Button type="button" size="sm" onClick={handleAddItem} className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {addError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />{addError}
                </p>
              )}
              {addProductId && addSalePrice && Number(addSalePrice) > 0 && (
                (() => {
                  const prod = products.find(p => p.id === Number(addProductId))
                  if (!prod || Number(addSalePrice) >= prod.price) return null
                  return (
                    <p className="text-xs text-green-600">
                      Diskon {discountPct(prod.price, Number(addSalePrice))}% dari harga normal {formatPrice(prod.price)}
                    </p>
                  )
                })()
              )}
            </div>
          </div>

          {!isValid && form.items.length === 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />Tambahkan minimal 1 produk ke flash sale
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button disabled={!isValid} onClick={() => { onSave(form); onClose() }}>
              {mode === 'add' ? 'Buat Flash Sale' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Flash Sale Card ──────────────────────────────────────────────────────────

function FlashSaleCard({
  fs, onEdit, onDelete,
}: {
  fs: FlashSale
  onEdit: (fs: FlashSale) => void
  onDelete: (fs: FlashSale) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = getFlashSaleStatus(fs)
  const totalSold  = fs.items.reduce((s, it) => s + it.sold, 0)
  const totalQuota = fs.items.reduce((s, it) => s + it.quota, 0)
  const fillPct    = totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0

  return (
    <Card className={`overflow-hidden ${status === 'active' ? 'ring-2 ring-red-200' : ''}`}>
      <div className={`h-1 w-full ${status === 'active' ? 'bg-red-400' : status === 'scheduled' ? 'bg-blue-400' : 'bg-gray-300'}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <FlashSaleStatusBadge status={status} />
            </div>
            <TruncatedText as="p" className="font-bold text-base truncate">{fs.name}</TruncatedText>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateTime(fs.startDateTime)} — {formatDateTime(fs.endDateTime)}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {status !== 'ended' && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(fs)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => onDelete(fs)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Countdown for active */}
        {status === 'active' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
            <Timer className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm text-red-700">Berakhir dalam:</span>
            <Countdown endDateTime={fs.endDateTime} />
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalSold} terjual dari {totalQuota} kuota</span>
            <span className="font-medium">{fillPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${status === 'active' ? 'bg-red-400' : status === 'scheduled' ? 'bg-blue-400' : 'bg-gray-400'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {/* Products */}
      <CardContent className="pt-0">
        <button
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          onClick={() => setExpanded(e => !e)}
        >
          <span>{fs.items.length} produk dalam flash sale</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {fs.items.map(item => (
              <div key={item.productId} className="flex items-center justify-between gap-3 p-2.5 bg-muted/40 rounded-lg text-sm">
                <div className="flex-1 min-w-0">
                  <TruncatedText className="font-medium text-xs truncate">{item.productName}</TruncatedText>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-muted-foreground line-through text-[10px] tabular-nums whitespace-nowrap">{formatPrice(item.originalPrice)}</span>
                    <span className="text-red-600 font-bold text-xs tabular-nums whitespace-nowrap">{formatPrice(item.salePrice)}</span>
                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums">
                      -{discountPct(item.originalPrice, item.salePrice)}%
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium tabular-nums">{item.sold}/{item.quota}</p>
                  <p className="text-[10px] text-muted-foreground">terjual</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketingPage() {
  const { hasFeature, tenant } = useTenant()
  const [vouchers, setVouchers]       = useState<Voucher[]>(initialVouchers)
  const [flashSales, setFlashSales]   = useState<FlashSale[]>(initialFlashSales)
  const [activeTab, setActiveTab]     = useState('vouchers')

  // Voucher state
  const [vSearch, setVSearch]         = useState('')
  const [vFilter, setVFilter]         = useState<string>('all')
  const [vPage, setVPage]             = useState(1)
  const [vPageSize, setVPageSize]     = useState(5)
  const [addVoucherOpen, setAddVoucherOpen] = useState(false)
  const [editVoucher, setEditVoucher]  = useState<Voucher | null>(null)
  const [deleteVoucher, setDeleteVoucher] = useState<Voucher | null>(null)
  const [toggleVoucher, setToggleVoucher] = useState<Voucher | null>(null)
  const [copiedCode, setCopiedCode]   = useState<string | null>(null)

  // Flash sale state
  const [fsSearch, setFsSearch]       = useState('')
  const [fsFilter, setFsFilter]       = useState<string>('all')
  const [addFSOpen, setAddFSOpen]     = useState(false)
  const [editFS, setEditFS]           = useState<FlashSale | null>(null)
  const [deleteFS, setDeleteFS]       = useState<FlashSale | null>(null)

  // ── Voucher derived ──
  const filteredVouchers = vouchers.filter(v => {
    const status = getVoucherStatus(v)
    const matchSearch = v.code.toLowerCase().includes(vSearch.toLowerCase()) ||
      v.name.toLowerCase().includes(vSearch.toLowerCase())
    const matchFilter = vFilter === 'all' || status === vFilter
    return matchSearch && matchFilter
  })

  const isVAll   = vPageSize === 0
  const vEff     = isVAll ? filteredVouchers.length : vPageSize
  const vTotalPg = Math.max(1, Math.ceil(filteredVouchers.length / (vEff || 1)))
  const vPg      = Math.min(vPage, vTotalPg)
  const pagedVouchers = isVAll
    ? filteredVouchers
    : filteredVouchers.slice((vPg - 1) * vEff, vPg * vEff)

  // ── Flash sale derived ──
  const filteredFS = flashSales.filter(fs => {
    const status = getFlashSaleStatus(fs)
    const matchSearch = fs.name.toLowerCase().includes(fsSearch.toLowerCase())
    const matchFilter = fsFilter === 'all' || status === fsFilter
    return matchSearch && matchFilter
  })

  // ── Stats ──
  const activeVouchers   = vouchers.filter(v => getVoucherStatus(v) === 'active').length
  const scheduledVouchers = vouchers.filter(v => getVoucherStatus(v) === 'scheduled').length
  const totalVoucherUsed = vouchers.reduce((s, v) => s + v.used, 0)
  const activeFlashSales = flashSales.filter(fs => getFlashSaleStatus(fs) === 'active').length

  // ── Voucher handlers ──
  const handleAddVoucher = (data: VoucherFormData) => {
    const id = `VCH-${String(vouchers.length + 1).padStart(3, '0')}`
    setVouchers(prev => [...prev, {
      id, code: data.code, name: data.name, type: data.type,
      value: Number(data.value), minPurchase: Number(data.minPurchase) || 0,
      maxDiscount: data.type === 'percentage' && data.maxDiscount ? Number(data.maxDiscount) : null,
      quota: Number(data.quota), used: 0,
      startDate: data.startDate, endDate: data.endDate,
      disabled: false, description: data.description || undefined,
    }])
  }

  const handleEditVoucher = (data: VoucherFormData) => {
    if (!editVoucher) return
    setVouchers(prev => prev.map(v => v.id === editVoucher.id ? {
      ...v, code: data.code, name: data.name, type: data.type,
      value: Number(data.value), minPurchase: Number(data.minPurchase) || 0,
      maxDiscount: data.type === 'percentage' && data.maxDiscount ? Number(data.maxDiscount) : null,
      quota: Number(data.quota), startDate: data.startDate, endDate: data.endDate,
      description: data.description || undefined,
    } : v))
    setEditVoucher(null)
  }

  const handleToggleVoucher = () => {
    if (!toggleVoucher) return
    setVouchers(prev => prev.map(v => v.id === toggleVoucher.id ? { ...v, disabled: !v.disabled } : v))
    setToggleVoucher(null)
  }

  const handleDeleteVoucher = () => {
    if (!deleteVoucher) return
    setVouchers(prev => prev.filter(v => v.id !== deleteVoucher.id))
    setDeleteVoucher(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  // ── Flash sale handlers ──
  const handleAddFS = (data: FSForm) => {
    const id = `FS-${String(flashSales.length + 1).padStart(3, '0')}`
    setFlashSales(prev => [...prev, { id, ...data, startDateTime: new Date(data.startDateTime).toISOString(), endDateTime: new Date(data.endDateTime).toISOString() }])
  }

  const handleEditFS = (data: FSForm) => {
    if (!editFS) return
    setFlashSales(prev => prev.map(fs => fs.id === editFS.id
      ? { ...fs, ...data, startDateTime: new Date(data.startDateTime).toISOString(), endDateTime: new Date(data.endDateTime).toISOString() }
      : fs
    ))
    setEditFS(null)
  }

  const handleDeleteFS = () => {
    if (!deleteFS) return
    setFlashSales(prev => prev.filter(fs => fs.id !== deleteFS.id))
    setDeleteFS(null)
  }

  // ── Export vouchers ──
  const handleExportVouchers = () => {
    const rows = filteredVouchers.map(v => ({
      'ID': v.id, 'Kode': v.code, 'Nama': v.name,
      'Tipe': v.type === 'percentage' ? 'Persentase' : 'Nominal',
      'Nilai': v.type === 'percentage' ? `${v.value}%` : formatPrice(v.value),
      'Min. Pembelian (Rp)': v.minPurchase,
      'Maks. Diskon (Rp)': v.maxDiscount ?? '-',
      'Kuota': v.quota, 'Terpakai': v.used,
      'Mulai': v.startDate, 'Berakhir': v.endDate,
      'Status': VOUCHER_STATUS_CFG[getVoucherStatus(v)].label,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 14 },
      { wch: 20 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Voucher')
    XLSX.writeFile(wb, `voucher-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportVouchersPdf = () => {
    const totalQuota = filteredVouchers.reduce((s, v) => s + v.quota, 0)
    const totalUsed = filteredVouchers.reduce((s, v) => s + v.used, 0)

    exportPdf({
      fileName: `voucher-${fileStamp()}`,
      title: 'Daftar Voucher',
      subtitle: 'Voucher & program diskon toko',
      storeName: tenant?.storeName,
      orientation: 'landscape',
      summary: [
        { label: 'Total Voucher', value: String(filteredVouchers.length) },
        { label: 'Total Kuota', value: totalQuota.toLocaleString('id-ID') },
        { label: 'Terpakai', value: totalUsed.toLocaleString('id-ID') },
      ],
      columns: [
        { header: 'Kode', width: 26 },
        { header: 'Nama', width: 55 },
        { header: 'Tipe', width: 22 },
        { header: 'Nilai', width: 26, align: 'right' },
        { header: 'Min. Beli', width: 26, align: 'right' },
        { header: 'Kuota / Pakai', width: 22, align: 'right' },
        { header: 'Berlaku', width: 36 },
        { header: 'Status', width: 22 },
      ],
      rows: filteredVouchers.map(v => [
        v.code,
        v.name,
        v.type === 'percentage' ? 'Persentase' : 'Nominal',
        v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value),
        v.minPurchase > 0 ? formatRupiah(v.minPurchase) : '—',
        `${v.used} / ${v.quota}`,
        `${formatDate(v.startDate)}\ns/d ${formatDate(v.endDate)}`,
        VOUCHER_STATUS_CFG[getVoucherStatus(v)].label,
      ]),
      footnote: 'Daftar voucher diekspor dari Eleven Seller',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7" />Pemasaran &amp; Promosi
          </h1>
          <p className="text-muted-foreground">Kelola voucher, flash sale, dan program promosi toko</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voucher Aktif</CardTitle>
            <Tag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl text-right font-bold text-green-600 truncate">{activeVouchers}</TruncatedText>
            <p className="text-xs text-muted-foreground">{scheduledVouchers} terjadwal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penggunaan Voucher</CardTitle>
            <BadgePercent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl text-right font-bold truncate">{totalVoucherUsed.toLocaleString('id-ID')}</TruncatedText>
            <p className="text-xs text-muted-foreground">dari {vouchers.length} voucher</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flash Sale Aktif</CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl text-right font-bold text-red-600 truncate">{activeFlashSales}</TruncatedText>
            <p className="text-xs text-muted-foreground">berlangsung sekarang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flash Sale</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl text-right font-bold truncate">{flashSales.length}</TruncatedText>
            <p className="text-xs text-muted-foreground">{flashSales.filter(fs => getFlashSaleStatus(fs) === 'scheduled').length} terjadwal</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vouchers" className="flex items-center gap-1.5">
            <Tag className="w-4 h-4" />Voucher &amp; Kupon
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
              {vouchers.filter(v => getVoucherStatus(v) === 'active').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="flashsale" className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" />Flash Sale
            {activeFlashSales > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                {activeFlashSales}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Voucher Tab ── */}
        <TabsContent value="vouchers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle>Daftar Voucher</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari kode atau nama..."
                      value={vSearch} onChange={e => { setVSearch(e.target.value); setVPage(1) }}
                      className="pl-8" />
                  </div>
                  <Select value={vFilter} onValueChange={v => { setVFilter(v); setVPage(1) }}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="scheduled">Terjadwal</SelectItem>
                      <SelectItem value="expired">Kadaluarsa</SelectItem>
                      <SelectItem value="disabled">Dinonaktifkan</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasFeature('export-data') && (
                    <Button variant="outline" onClick={handleExportVouchers}>
                      <FileSpreadsheet className="w-4 h-4 mr-1.5" />Excel
                    </Button>
                  )}
                  {hasFeature('export-pdf') && (
                    <Button variant="outline" onClick={handleExportVouchersPdf}>
                      <FileText className="w-4 h-4 mr-1.5" />PDF
                    </Button>
                  )}
                  <Button onClick={() => setAddVoucherOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />Buat Voucher
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredVouchers.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Tidak ada voucher ditemukan</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode &amp; Nama</TableHead>
                        <TableHead className="text-right">Tipe</TableHead>
                        <TableHead className="text-right">Min. Beli</TableHead>
                        <TableHead className="text-center">Penggunaan</TableHead>
                        <TableHead>Berlaku</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedVouchers.map(v => {
                        const status = getVoucherStatus(v)
                        const pctUsed = v.quota > 0 ? Math.round((v.used / v.quota) * 100) : 0
                        return (
                          <TableRow key={v.id}>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-bold font-mono tracking-widest">{v.code}</code>
                                  <button onClick={() => copyCode(v.code)}
                                    className="text-muted-foreground hover:text-primary transition-colors">
                                    {copiedCode === v.code
                                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                      : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <TruncatedText className="text-xs text-muted-foreground truncate">{v.name}</TruncatedText>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-sm">
                                {v.type === 'percentage' ? (
                                  <span className="text-blue-700 font-semibold tabular-nums">{v.value}%</span>
                                ) : (
                                  <span className="text-green-700 font-semibold tabular-nums whitespace-nowrap">{formatPrice(v.value)}</span>
                                )}
                                {v.maxDiscount !== null && (
                                  <p className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">maks. {formatPrice(v.maxDiscount)}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground text-right tabular-nums whitespace-nowrap">
                              {v.minPurchase > 0 ? formatPrice(v.minPurchase) : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <p className="text-sm font-medium tabular-nums">{v.used}/{v.quota}</p>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden w-16 mx-auto mt-1">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${pctUsed}%` }} />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{pctUsed}%</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <p>{formatDate(v.startDate)}</p>
                              <p>s/d {formatDate(v.endDate)}</p>
                            </TableCell>
                            <TableCell><VoucherStatusBadge status={status} /></TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditVoucher(v)}
                                  disabled={status === 'expired'}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm"
                                  className={v.disabled ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}
                                  onClick={() => setToggleVoucher(v)}
                                  disabled={status === 'expired'}
                                  title={v.disabled ? 'Aktifkan' : 'Nonaktifkan'}>
                                  <Power className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm"
                                  className="text-red-500 hover:bg-red-50"
                                  onClick={() => setDeleteVoucher(v)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        {filteredVouchers.length === 0 ? '0' : `${isVAll ? 1 : (vPg - 1) * vEff + 1}–${isVAll ? filteredVouchers.length : Math.min(vPg * vEff, filteredVouchers.length)}`} dari {filteredVouchers.length}
                      </p>
                      <Select value={String(vPageSize)} onValueChange={v => { setVPageSize(Number(v)); setVPage(1) }}>
                        <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[5, 10, 25].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          <SelectItem value="0">Semua</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!isVAll && vTotalPg > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious onClick={() => setVPage(p => Math.max(1, p - 1))}
                              aria-disabled={vPg === 1} className={vPg === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                          </PaginationItem>
                          {Array.from({ length: vTotalPg }, (_, i) => i + 1).map(n => (
                            <PaginationItem key={n}>
                              <PaginationLink isActive={n === vPg} onClick={() => setVPage(n)} className="cursor-pointer">{n}</PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext onClick={() => setVPage(p => Math.min(vTotalPg, p + 1))}
                              aria-disabled={vPg === vTotalPg} className={vPg === vTotalPg ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Flash Sale Tab ── */}
        <TabsContent value="flashsale" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari flash sale..."
                  value={fsSearch} onChange={e => setFsSearch(e.target.value)} className="pl-8" />
              </div>
              <Select value={fsFilter} onValueChange={setFsFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Berlangsung</SelectItem>
                  <SelectItem value="scheduled">Terjadwal</SelectItem>
                  <SelectItem value="ended">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setAddFSOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Buat Flash Sale
            </Button>
          </div>

          {filteredFS.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada flash sale ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFS.map(fs => (
                <FlashSaleCard
                  key={fs.id} fs={fs}
                  onEdit={fs => setEditFS(fs)}
                  onDelete={fs => setDeleteFS(fs)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}

      {/* Voucher add */}
      <VoucherFormDialog
        key={addVoucherOpen ? 'add-v' : 'add-v-closed'}
        mode="add" initial={emptyVoucherForm}
        open={addVoucherOpen} onClose={() => setAddVoucherOpen(false)}
        onSave={handleAddVoucher}
      />

      {/* Voucher edit */}
      {editVoucher && (
        <VoucherFormDialog
          key={`edit-v-${editVoucher.id}`}
          mode="edit"
          initial={{
            code: editVoucher.code, name: editVoucher.name, type: editVoucher.type,
            value: String(editVoucher.value), minPurchase: String(editVoucher.minPurchase),
            maxDiscount: editVoucher.maxDiscount !== null ? String(editVoucher.maxDiscount) : '',
            quota: String(editVoucher.quota),
            startDate: editVoucher.startDate, endDate: editVoucher.endDate,
            description: editVoucher.description ?? '',
          }}
          open={!!editVoucher} onClose={() => setEditVoucher(null)}
          onSave={handleEditVoucher}
        />
      )}

      {/* Toggle voucher */}
      <AlertDialog open={!!toggleVoucher} onOpenChange={o => !o && setToggleVoucher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleVoucher?.disabled ? 'Aktifkan Voucher' : 'Nonaktifkan Voucher'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleVoucher?.disabled
                ? `Aktifkan voucher ${toggleVoucher?.code} agar bisa digunakan pelanggan?`
                : `Nonaktifkan voucher ${toggleVoucher?.code}? Pelanggan tidak bisa menggunakannya sampai diaktifkan kembali.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleVoucher}
              className={toggleVoucher?.disabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}>
              {toggleVoucher?.disabled ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete voucher */}
      <AlertDialog open={!!deleteVoucher} onOpenChange={o => !o && setDeleteVoucher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus voucher <strong>{deleteVoucher?.code}</strong>? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVoucher} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flash sale add */}
      <FlashSaleFormDialog
        key={addFSOpen ? 'add-fs' : 'add-fs-closed'}
        mode="add" initial={emptyFSForm}
        open={addFSOpen} onClose={() => setAddFSOpen(false)}
        onSave={handleAddFS}
      />

      {/* Flash sale edit */}
      {editFS && (
        <FlashSaleFormDialog
          key={`edit-fs-${editFS.id}`}
          mode="edit"
          initial={{
            name: editFS.name,
            startDateTime: toLocalInput(editFS.startDateTime),
            endDateTime: toLocalInput(editFS.endDateTime),
            items: editFS.items,
          }}
          open={!!editFS} onClose={() => setEditFS(null)}
          onSave={handleEditFS}
        />
      )}

      {/* Delete flash sale */}
      <AlertDialog open={!!deleteFS} onOpenChange={o => !o && setDeleteFS(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Flash Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus flash sale <strong>{deleteFS?.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFS} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
