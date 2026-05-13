import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from './ui/pagination'
import {
  Warehouse, Plus, Edit, Trash2, MapPin, Phone, User, Lock,
  ArrowRightLeft, SlidersHorizontal, History, Check, X, Package,
  AlertTriangle, ArrowDown, ArrowUp, Star, Search, FileSpreadsheet,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'
import { useInventory } from '../contexts/InventoryContext'
import type { MovementType, WarehouseLocation } from '../types/inventory'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOVEMENT_LABEL: Record<MovementType, { label: string; color: string; icon: typeof ArrowDown }> = {
  adjustment_in:  { label: 'Penyesuaian (+)', color: 'text-green-600',  icon: ArrowUp },
  adjustment_out: { label: 'Penyesuaian (−)', color: 'text-red-600',    icon: ArrowDown },
  transfer_in:    { label: 'Transfer Masuk',  color: 'text-blue-600',   icon: ArrowDown },
  transfer_out:   { label: 'Transfer Keluar', color: 'text-amber-600',  icon: ArrowUp },
  sale:           { label: 'Penjualan',       color: 'text-red-600',    icon: ArrowDown },
  restock:        { label: 'Restock',         color: 'text-green-600',  icon: ArrowUp },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Reusable pagination footer ───────────────────────────────────────────────

function TableFooterBar({
  total, startItem, endItem, itemLabel,
  pageSize, onPageSizeChange,
  page, totalPages, onPageChange,
}: {
  total: number
  startItem: number
  endItem: number
  itemLabel: string
  pageSize: number
  onPageSizeChange: (n: number) => void
  page: number
  totalPages: number
  onPageChange: (n: number) => void
}) {
  const isShowAll = pageSize === 0
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {total > 0
            ? `Menampilkan ${startItem}–${endItem} dari ${total} ${itemLabel}`
            : `Tidak ada ${itemLabel}`}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Tampilkan</span>
          <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
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
                onClick={() => onPageChange(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <PaginationItem key={n}>
                <PaginationLink
                  isActive={n === page}
                  onClick={() => onPageChange(n)}
                  className="cursor-pointer"
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                aria-disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

// ─── Warehouse Form Dialog ────────────────────────────────────────────────────

function WarehouseFormDialog({
  open, onClose, onSave, mode, initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<WarehouseLocation, 'id'>) => void
  mode: 'add' | 'edit'
  initial: Omit<WarehouseLocation, 'id'>
}) {
  const [form, setForm] = useState(initial)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const canSave = form.name.trim() && form.code.trim() && form.city.trim()

  const handleSave = () => {
    if (!canSave) return
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (o) setForm(initial); else onClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Tambah Gudang Baru' : 'Edit Gudang'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Kode Gudang <span className="text-red-500">*</span></Label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="JKT-01" />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Gudang <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Gudang Jakarta Pusat" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alamat Lengkap</Label>
            <Textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Jalan, kelurahan, kecamatan..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Kota <span className="text-red-500">*</span></Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Jakarta Pusat" />
            </div>
            <div className="space-y-1.5">
              <Label>Penanggung Jawab (PIC)</Label>
              <Input value={form.pic} onChange={e => set('pic', e.target.value)} placeholder="Nama PIC" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>No. Telepon PIC</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xx-xxxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch checked={form.active} onCheckedChange={v => set('active', v)} />
                <span className="text-sm text-muted-foreground">{form.active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Switch checked={form.isPrimary} onCheckedChange={v => set('isPrimary', v)} />
            <div className="text-sm">
              <p className="font-medium text-amber-900">Jadikan Gudang Utama</p>
              <p className="text-xs text-amber-700">Stok default & alamat asal untuk pengiriman. Hanya boleh satu gudang utama.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1.5" />Batal</Button>
            <Button onClick={handleSave} disabled={!canSave}>
              <Check className="w-4 h-4 mr-1.5" />
              {mode === 'add' ? 'Simpan Gudang' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stock Adjustment Dialog ──────────────────────────────────────────────────

function AdjustmentDialog({
  open, onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { products, warehouses, stockAt, adjustStock } = useInventory()
  const activeWhs = warehouses.filter(w => w.active)
  const [warehouseId, setWarehouseId] = useState(activeWhs[0]?.id ?? '')
  const [productId, setProductId] = useState<number | ''>('')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [qtyRaw, setQtyRaw] = useState('')
  const [reason, setReason] = useState('Restock')

  const currentStock = typeof productId === 'number' ? stockAt(productId, warehouseId) : 0
  const qty = Number(qtyRaw) || 0
  const willBeNegative = direction === 'out' && qty > currentStock
  const canSubmit = warehouseId && typeof productId === 'number' && qty > 0 && reason.trim() && !willBeNegative

  const reset = () => {
    setWarehouseId(activeWhs[0]?.id ?? '')
    setProductId('')
    setDirection('in')
    setQtyRaw('')
    setReason('Restock')
  }

  const handleSubmit = () => {
    if (!canSubmit || typeof productId !== 'number') return
    adjustStock({
      warehouseId, productId,
      delta: direction === 'in' ? qty : -qty,
      reason: reason.trim(),
    })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Penyesuaian Stok Manual
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Gudang <span className="text-red-500">*</span></Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue placeholder="Pilih gudang" /></SelectTrigger>
              <SelectContent>
                {activeWhs.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Produk <span className="text-red-500">*</span></Label>
            <Select value={productId === '' ? '' : String(productId)} onValueChange={v => setProductId(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typeof productId === 'number' && (
              <p className="text-xs text-muted-foreground">
                Stok saat ini di gudang ini: <strong>{currentStock} unit</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={direction} onValueChange={v => setDirection(v as 'in' | 'out')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Tambah (+)</SelectItem>
                  <SelectItem value="out">Kurang (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                inputMode="numeric"
                value={qtyRaw}
                onChange={e => setQtyRaw(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
              />
            </div>
          </div>
          {willBeNegative && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Jumlah pengurangan melebihi stok yang tersedia.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Alasan <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Restock">Restock dari supplier</SelectItem>
                <SelectItem value="Stock opname">Koreksi stock opname</SelectItem>
                <SelectItem value="Barang rusak">Barang rusak</SelectItem>
                <SelectItem value="Barang hilang">Barang hilang / susut</SelectItem>
                <SelectItem value="Retur dari pelanggan">Retur dari pelanggan</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { reset(); onClose() }}>
              <X className="w-4 h-4 mr-1.5" />Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              <Check className="w-4 h-4 mr-1.5" />Simpan Penyesuaian
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Transfer Dialog ──────────────────────────────────────────────────────────

function TransferDialog({
  open, onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { products, warehouses, stockAt, transferStock } = useInventory()
  const activeWhs = warehouses.filter(w => w.active)
  const [fromId, setFromId] = useState(activeWhs[0]?.id ?? '')
  const [toId, setToId] = useState(activeWhs[1]?.id ?? '')
  const [productId, setProductId] = useState<number | ''>('')
  const [qtyRaw, setQtyRaw] = useState('')
  const [note, setNote] = useState('')

  const sourceStock = typeof productId === 'number' ? stockAt(productId, fromId) : 0
  const qty = Number(qtyRaw) || 0
  const overLimit = qty > sourceStock
  const sameWarehouse = fromId === toId
  const canSubmit = fromId && toId && !sameWarehouse && typeof productId === 'number' && qty > 0 && !overLimit

  const reset = () => {
    setFromId(activeWhs[0]?.id ?? '')
    setToId(activeWhs[1]?.id ?? '')
    setProductId('')
    setQtyRaw('')
    setNote('')
  }

  const handleSubmit = () => {
    if (!canSubmit || typeof productId !== 'number') return
    transferStock({ fromId, toId, productId, qty, note: note.trim() })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Transfer Stok Antar Gudang
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {activeWhs.length < 2 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Butuh minimal 2 gudang aktif untuk melakukan transfer.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Dari Gudang</Label>
                  <Select value={fromId} onValueChange={setFromId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {activeWhs.map(w => <SelectItem key={w.id} value={w.id}>{w.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ke Gudang</Label>
                  <Select value={toId} onValueChange={setToId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {activeWhs.map(w => <SelectItem key={w.id} value={w.id}>{w.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {sameWarehouse && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />Gudang asal dan tujuan harus berbeda.
                </p>
              )}

              <div className="space-y-1.5">
                <Label>Produk</Label>
                <Select value={productId === '' ? '' : String(productId)} onValueChange={v => setProductId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeof productId === 'number' && (
                  <p className="text-xs text-muted-foreground">
                    Stok di gudang asal: <strong>{sourceStock} unit</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Jumlah Transfer</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={qtyRaw}
                  onChange={e => setQtyRaw(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                />
                {overLimit && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />Melebihi stok gudang asal.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Catatan (opsional)</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Misal: pemindahan stok lebaran" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { reset(); onClose() }}>
              <X className="w-4 h-4 mr-1.5" />Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              <Check className="w-4 h-4 mr-1.5" />Konfirmasi Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WarehouseManagement() {
  const { tenant, hasFeature } = useTenant()
  const {
    products, warehouses, movements, distribution,
    addWarehouse, updateWarehouse, deleteWarehouse,
  } = useInventory()

  const maxWarehouses = tenant?.package.maxWarehouses ?? 1
  const packageName = tenant?.package.name ?? 'Starter'
  const primaryColor = tenant?.primaryColor ?? '#6366f1'

  const [editWh, setEditWh] = useState<WarehouseLocation | null>(null)
  const [deleteWh, setDeleteWh] = useState<WarehouseLocation | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stock' | 'movements'>('warehouses')

  // tab 1: daftar gudang
  const [searchWh, setSearchWh] = useState('')
  const [statusWhFilter, setStatusWhFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pageWh, setPageWh] = useState(1)
  const [sizeWh, setSizeWh] = useState(5)

  // tab 2: stok per gudang
  const [searchSt, setSearchSt] = useState('')
  const [pageSt, setPageSt] = useState(1)
  const [sizeSt, setSizeSt] = useState(5)

  // tab 3: riwayat pergerakan
  const [searchMv, setSearchMv] = useState('')
  const [typeMvFilter, setTypeMvFilter] = useState<MovementType | 'all'>('all')
  const [whMvFilter, setWhMvFilter] = useState<string>('all')
  const [pageMv, setPageMv] = useState(1)
  const [sizeMv, setSizeMv] = useState(10)

  const activeCount = warehouses.filter(w => w.active).length
  const isUnlimited = maxWarehouses === -1
  const atLimit = !isUnlimited && warehouses.length >= maxWarehouses
  const limitLabel = isUnlimited ? 'Tanpa batas' : `${warehouses.length} / ${maxWarehouses}`
  const limitPct = isUnlimited ? 0 : Math.min(100, (warehouses.length / maxWarehouses) * 100)

  const stockByWarehouse = useMemo(() => {
    const result: Record<string, number> = {}
    warehouses.forEach(w => { result[w.id] = 0 })
    Object.values(distribution).forEach(perWh => {
      Object.entries(perWh).forEach(([whId, qty]) => {
        result[whId] = (result[whId] ?? 0) + qty
      })
    })
    return result
  }, [warehouses, distribution])

  const totalStock = Object.values(stockByWarehouse).reduce((s, n) => s + n, 0)

  // ── Filtered + paginated views ──
  const filteredWarehouses = useMemo(() => {
    const q = searchWh.trim().toLowerCase()
    return warehouses.filter(w => {
      if (statusWhFilter === 'active' && !w.active) return false
      if (statusWhFilter === 'inactive' && w.active) return false
      if (!q) return true
      return (
        w.code.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.pic.toLowerCase().includes(q)
      )
    })
  }, [warehouses, searchWh, statusWhFilter])

  const filteredStockProducts = useMemo(() => {
    const q = searchSt.trim().toLowerCase()
    if (!q) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [products, searchSt])

  const filteredMovements = useMemo(() => {
    const q = searchMv.trim().toLowerCase()
    return movements.filter(m => {
      if (typeMvFilter !== 'all' && m.type !== typeMvFilter) return false
      if (whMvFilter !== 'all' && m.warehouseId !== whMvFilter) return false
      if (!q) return true
      return (
        m.productName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.by.toLowerCase().includes(q)
      )
    })
  }, [movements, searchMv, typeMvFilter, whMvFilter])

  // ── Pagination math ──
  function paginate<T>(items: T[], page: number, size: number) {
    const isAll = size === 0
    const effective = isAll ? items.length || 1 : size
    const totalPages = Math.max(1, Math.ceil(items.length / effective))
    const safe = Math.min(page, totalPages)
    const paged = isAll ? items : items.slice((safe - 1) * effective, safe * effective)
    const startItem = items.length === 0 ? 0 : isAll ? 1 : (safe - 1) * effective + 1
    const endItem = isAll ? items.length : Math.min(safe * effective, items.length)
    return { paged, totalPages, page: safe, startItem, endItem }
  }

  const whView = paginate(filteredWarehouses, pageWh, sizeWh)
  const stView = paginate(filteredStockProducts, pageSt, sizeSt)
  const mvView = paginate(filteredMovements, pageMv, sizeMv)

  const handleDeleteWarehouse = () => {
    if (!deleteWh) return
    if ((stockByWarehouse[deleteWh.id] ?? 0) > 0) return
    deleteWarehouse(deleteWh.id)
    setDeleteWh(null)
  }

  // ── Export Excel (per active tab) ──
  const handleExport = () => {
    const ws = (() => {
      if (activeTab === 'warehouses') {
        const rows = filteredWarehouses.map(w => ({
          'Kode': w.code,
          'Nama Gudang': w.name,
          'Alamat': w.address,
          'Kota': w.city,
          'PIC': w.pic,
          'Telepon': w.phone,
          'Total Stok': stockByWarehouse[w.id] ?? 0,
          'Utama': w.isPrimary ? 'Ya' : '',
          'Status': w.active ? 'Aktif' : 'Nonaktif',
        }))
        const s = XLSX.utils.json_to_sheet(rows)
        s['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 40 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 12 }]
        return { ws: s, sheet: 'Gudang' }
      }
      if (activeTab === 'stock') {
        const rows = filteredStockProducts.map(p => {
          const perWh = distribution[p.id] ?? {}
          const total = Object.values(perWh).reduce((s, n) => s + n, 0)
          const row: Record<string, string | number> = {
            'Produk': p.name,
            'SKU': p.sku,
          }
          warehouses.forEach(w => { row[w.code] = perWh[w.id] ?? 0 })
          row['Total'] = total
          return row
        })
        const s = XLSX.utils.json_to_sheet(rows)
        s['!cols'] = [{ wch: 30 }, { wch: 18 }, ...warehouses.map(() => ({ wch: 10 })), { wch: 10 }]
        return { ws: s, sheet: 'Stok per Gudang' }
      }
      const rows = filteredMovements.map(m => ({
        'Waktu': formatDateTime(m.date),
        'Tipe': MOVEMENT_LABEL[m.type].label,
        'Produk': m.productName,
        'Gudang': m.warehouseName,
        'Gudang Tujuan/Asal': m.refWarehouseName ?? '',
        'Qty': m.qty,
        'Alasan': m.reason,
        'Oleh': m.by,
      }))
      const s = XLSX.utils.json_to_sheet(rows)
      s['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 24 }, { wch: 14 }]
      return { ws: s, sheet: 'Pergerakan Stok' }
    })()
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws.ws, ws.sheet)
    XLSX.writeFile(wb, `gudang-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const emptyForm: Omit<WarehouseLocation, 'id'> = {
    code: '', name: '', address: '', city: '', pic: '', phone: '',
    isPrimary: warehouses.length === 0, active: true,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Gudang</h1>
          <p className="text-muted-foreground">Kelola lokasi penyimpanan, stok per gudang, transfer, dan riwayat pergerakan barang.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasFeature('export-data') && (
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />Export Excel
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAdjustOpen(true)} disabled={activeCount === 0}>
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />Penyesuaian Stok
          </Button>
          {hasFeature('stock-transfer') && (
            <Button variant="outline" onClick={() => setIsTransferOpen(true)} disabled={activeCount < 2}>
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />Transfer Stok
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)} disabled={atLimit}>
            <Plus className="w-4 h-4 mr-1.5" />Tambah Gudang
          </Button>
        </div>
      </div>

      {/* Limit info card */}
      <Card style={{ borderColor: atLimit ? '#fca5a5' : `${primaryColor}30`, backgroundColor: atLimit ? '#fef2f2' : `${primaryColor}06` }}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: atLimit ? '#fee2e2' : `${primaryColor}15`, color: atLimit ? '#dc2626' : primaryColor }}>
                {atLimit ? <Lock className="w-5 h-5" /> : <Warehouse className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Paket <span style={{ color: primaryColor }}>{packageName}</span> · Gudang terpakai: <span className="tabular-nums">{limitLabel}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {atLimit
                    ? 'Anda telah mencapai batas gudang. Upgrade paket untuk menambah gudang lagi.'
                    : isUnlimited
                      ? 'Paket Anda mendukung jumlah gudang tanpa batas.'
                      : `Anda bisa menambah ${maxWarehouses - warehouses.length} gudang lagi.`}
                </p>
              </div>
            </div>
            {!isUnlimited && (
              <div className="w-full sm:w-48">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${limitPct}%`, backgroundColor: atLimit ? '#dc2626' : primaryColor }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gudang</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">{activeCount} aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">unit di semua gudang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Terdaftar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">SKU di sistem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pergerakan Stok</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
            <p className="text-xs text-muted-foreground">transaksi tercatat</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouses">Daftar Gudang</TabsTrigger>
          <TabsTrigger value="stock">Stok per Gudang</TabsTrigger>
          <TabsTrigger value="movements">Riwayat Pergerakan</TabsTrigger>
        </TabsList>

        {/* Tab 1: Warehouses */}
        <TabsContent value="warehouses">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle>Daftar Gudang</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select value={statusWhFilter} onValueChange={v => { setStatusWhFilter(v as typeof statusWhFilter); setPageWh(1) }}>
                    <SelectTrigger className="w-full sm:w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari kode, nama, kota, PIC..."
                      value={searchWh}
                      onChange={e => { setSearchWh(e.target.value); setPageWh(1) }}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Belum ada gudang. Tambahkan gudang pertama Anda.</p>
                </div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada gudang yang cocok dengan filter.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Gudang</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>PIC</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whView.paged.map(w => {
                        const stock = stockByWarehouse[w.id] ?? 0
                        return (
                          <TableRow key={w.id}>
                            <TableCell className="font-mono text-xs">{w.code}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{w.name}</span>
                                {w.isPrimary && (
                                  <Badge variant="outline" className="text-[10px] gap-1 border-amber-500 text-amber-700">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />Utama
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                  <p>{w.address || '—'}</p>
                                  <p className="text-xs text-muted-foreground">{w.city}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{w.pic || '—'}</div>
                              {w.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{w.phone}</div>}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{stock.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {w.active
                                ? <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>
                                : <Badge variant="outline" className="text-gray-500">Nonaktif</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditWh(w)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={stock > 0 ? 'Tidak bisa dihapus: masih ada stok di gudang ini' : 'Hapus gudang'}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={stock > 0 || w.isPrimary}
                                  onClick={() => setDeleteWh(w)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <TableFooterBar
                    total={filteredWarehouses.length}
                    startItem={whView.startItem}
                    endItem={whView.endItem}
                    itemLabel="gudang"
                    pageSize={sizeWh}
                    onPageSizeChange={n => { setSizeWh(n); setPageWh(1) }}
                    page={whView.page}
                    totalPages={whView.totalPages}
                    onPageChange={setPageWh}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Stock per warehouse */}
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle>Distribusi Stok per Gudang</CardTitle>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama produk atau SKU..."
                    value={searchSt}
                    onChange={e => { setSearchSt(e.target.value); setPageSt(1) }}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Tambahkan gudang terlebih dahulu.</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Belum ada produk. Tambahkan produk di menu Produk.</p>
                </div>
              ) : filteredStockProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada produk yang cocok.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Produk</TableHead>
                          {warehouses.map(w => (
                            <TableHead key={w.id} className="text-right">
                              <div className="font-mono text-[11px]">{w.code}</div>
                              <div className="text-[10px] text-muted-foreground font-normal">{w.city}</div>
                            </TableHead>
                          ))}
                          <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stView.paged.map(p => {
                          const perWh = distribution[p.id] ?? {}
                          const total = Object.values(perWh).reduce((s, n) => s + n, 0)
                          return (
                            <TableRow key={p.id}>
                              <TableCell>
                                <p className="font-medium text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.sku}</p>
                              </TableCell>
                              {warehouses.map(w => {
                                const qty = perWh[w.id] ?? 0
                                return (
                                  <TableCell key={w.id} className="text-right tabular-nums">
                                    <span className={qty === 0 ? 'text-muted-foreground' : qty <= 5 ? 'text-orange-600 font-medium' : ''}>
                                      {qty}
                                    </span>
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-right tabular-nums font-bold">{total}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <TableFooterBar
                    total={filteredStockProducts.length}
                    startItem={stView.startItem}
                    endItem={stView.endItem}
                    itemLabel="produk"
                    pageSize={sizeSt}
                    onPageSizeChange={n => { setSizeSt(n); setPageSt(1) }}
                    page={stView.page}
                    totalPages={stView.totalPages}
                    onPageChange={setPageSt}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Movement log */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <CardTitle>Riwayat Pergerakan Stok</CardTitle>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari produk, alasan, atau user..."
                      value={searchMv}
                      onChange={e => { setSearchMv(e.target.value); setPageMv(1) }}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={typeMvFilter} onValueChange={v => { setTypeMvFilter(v as typeof typeMvFilter); setPageMv(1) }}>
                    <SelectTrigger className="w-full sm:w-56 h-9">
                      <SelectValue placeholder="Tipe pergerakan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua tipe</SelectItem>
                      <SelectItem value="adjustment_in">{MOVEMENT_LABEL.adjustment_in.label}</SelectItem>
                      <SelectItem value="adjustment_out">{MOVEMENT_LABEL.adjustment_out.label}</SelectItem>
                      {hasFeature('stock-transfer') && (
                        <>
                          <SelectItem value="transfer_in">{MOVEMENT_LABEL.transfer_in.label}</SelectItem>
                          <SelectItem value="transfer_out">{MOVEMENT_LABEL.transfer_out.label}</SelectItem>
                        </>
                      )}
                      <SelectItem value="sale">{MOVEMENT_LABEL.sale.label}</SelectItem>
                      <SelectItem value="restock">{MOVEMENT_LABEL.restock.label}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={whMvFilter} onValueChange={v => { setWhMvFilter(v); setPageMv(1) }}>
                    <SelectTrigger className="w-full sm:w-64 h-9">
                      <SelectValue placeholder="Filter gudang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua gudang</SelectItem>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Belum ada riwayat pergerakan stok.</p>
                  <p className="text-xs mt-1">Lakukan penyesuaian atau transfer untuk memulai.</p>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada pergerakan yang cocok dengan filter.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Gudang</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Oleh</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mvView.paged.map(m => {
                        const meta = MOVEMENT_LABEL[m.type]
                        const Icon = meta.icon
                        const isOut = m.type === 'adjustment_out' || m.type === 'transfer_out' || m.type === 'sale'
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs whitespace-nowrap">{formatDateTime(m.date)}</TableCell>
                            <TableCell>
                              <span className={`text-xs font-medium flex items-center gap-1 ${meta.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{m.productName}</TableCell>
                            <TableCell className="text-sm">
                              {m.warehouseName}
                              {m.refWarehouseName && (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <ArrowRightLeft className="w-3 h-3" />
                                  {m.type === 'transfer_in' ? `dari ${m.refWarehouseName}` : `ke ${m.refWarehouseName}`}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`text-right tabular-nums font-medium ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                              {isOut ? '−' : '+'}{m.qty}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{m.reason}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{m.by}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <TableFooterBar
                    total={filteredMovements.length}
                    startItem={mvView.startItem}
                    endItem={mvView.endItem}
                    itemLabel="pergerakan"
                    pageSize={sizeMv}
                    onPageSizeChange={n => { setSizeMv(n); setPageMv(1) }}
                    page={mvView.page}
                    totalPages={mvView.totalPages}
                    onPageChange={setPageMv}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <WarehouseFormDialog
        key={isAddOpen ? 'add-open' : 'add-closed'}
        mode="add"
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={addWarehouse}
        initial={emptyForm}
      />

      {editWh && (
        <WarehouseFormDialog
          key={`edit-${editWh.id}`}
          mode="edit"
          open={!!editWh}
          onClose={() => setEditWh(null)}
          onSave={data => updateWarehouse(editWh.id, data)}
          initial={{
            code: editWh.code, name: editWh.name, address: editWh.address,
            city: editWh.city, pic: editWh.pic, phone: editWh.phone,
            isPrimary: editWh.isPrimary, active: editWh.active,
          }}
        />
      )}

      <AdjustmentDialog
        open={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
      />

      <TransferDialog
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <AlertDialog open={!!deleteWh} onOpenChange={o => !o && setDeleteWh(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Gudang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteWh?.name}</strong>?
              Gudang yang masih menyimpan stok atau bertanda Utama tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWarehouse} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
