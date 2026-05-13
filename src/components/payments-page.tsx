import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Separator } from "./ui/separator"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "./ui/pagination"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownToLine, Clock,
  CheckCircle, XCircle, Search, FileSpreadsheet,
  CreditCard, Building2, AlertCircle, ReceiptText,
  ChevronDown, ChevronUp, Minus,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType    = 'Penjualan' | 'Penarikan' | 'Refund' | 'Biaya Admin'
type TxStatus  = 'Sukses' | 'Pending' | 'Gagal'
type ReportMode = 'monthly' | 'yearly'

interface Transaction {
  id: string
  date: string
  description: string
  type: TxType
  amount: number
  status: TxStatus
}

interface ReportRow {
  period: string
  date: string
  omzet: number
  adminFee: number
  refund: number
  netIncome: number
  orders: number
}

interface ReportSummary {
  omzet: number
  adminFee: number
  refund: number
  netIncome: number
  orders: number
}

// ─── Income Report Data ───────────────────────────────────────────────────────

const ADMIN_RATE = 0.02   // 2% biaya layanan platform

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const MONTH_NAMES  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const BASE_MONTHLY: Record<number, { omzet: number; refund: number; orders: number }[]> = {
  2024: [
    { omzet: 125_000_000, refund: 3_500_000, orders: 28 },
    { omzet: 132_000_000, refund: 2_800_000, orders: 30 },
    { omzet: 148_000_000, refund: 4_100_000, orders: 35 },
    { omzet: 155_000_000, refund: 3_200_000, orders: 37 },
    { omzet: 178_000_000, refund: 5_000_000, orders: 42 },
    { omzet: 185_000_000, refund: 4_500_000, orders: 44 },
    { omzet: 162_000_000, refund: 3_800_000, orders: 39 },
    { omzet: 195_000_000, refund: 5_500_000, orders: 46 },
    { omzet: 208_000_000, refund: 4_200_000, orders: 49 },
    { omzet: 220_000_000, refund: 6_000_000, orders: 52 },
    { omzet: 245_000_000, refund: 7_000_000, orders: 58 },
    { omzet: 278_000_000, refund: 8_500_000, orders: 65 },
  ],
  2023: [
    { omzet: 87_000_000,  refund: 2_000_000, orders: 20 },
    { omzet: 92_000_000,  refund: 1_800_000, orders: 21 },
    { omzet: 98_000_000,  refund: 2_500_000, orders: 23 },
    { omzet: 105_000_000, refund: 2_200_000, orders: 25 },
    { omzet: 118_000_000, refund: 3_000_000, orders: 28 },
    { omzet: 125_000_000, refund: 2_800_000, orders: 30 },
    { omzet: 110_000_000, refund: 2_500_000, orders: 26 },
    { omzet: 130_000_000, refund: 3_200_000, orders: 31 },
    { omzet: 142_000_000, refund: 3_500_000, orders: 34 },
    { omzet: 155_000_000, refund: 4_000_000, orders: 37 },
    { omzet: 168_000_000, refund: 4_500_000, orders: 40 },
    { omzet: 192_000_000, refund: 5_500_000, orders: 46 },
  ],
  2022: [
    { omzet: 62_000_000,  refund: 1_200_000, orders: 14 },
    { omzet: 68_000_000,  refund: 1_500_000, orders: 16 },
    { omzet: 75_000_000,  refund: 1_800_000, orders: 18 },
    { omzet: 80_000_000,  refund: 2_000_000, orders: 19 },
    { omzet: 88_000_000,  refund: 2_200_000, orders: 21 },
    { omzet: 95_000_000,  refund: 2_500_000, orders: 23 },
    { omzet: 85_000_000,  refund: 2_000_000, orders: 20 },
    { omzet: 102_000_000, refund: 2_800_000, orders: 24 },
    { omzet: 110_000_000, refund: 3_000_000, orders: 26 },
    { omzet: 118_000_000, refund: 3_200_000, orders: 28 },
    { omzet: 132_000_000, refund: 3_800_000, orders: 31 },
    { omzet: 155_000_000, refund: 4_500_000, orders: 37 },
  ],
}

// Deterministic daily weight distribution (31 values)
const DAY_WEIGHTS = [
  0.65, 0.85, 1.10, 0.75, 1.05, 1.25, 0.55, 0.80, 1.15, 0.90,
  1.10, 0.70, 1.00, 1.20, 0.78, 0.88, 1.12, 0.72, 1.28, 0.82,
  1.02, 0.92, 1.08, 0.78, 0.68, 1.18, 0.88, 1.00, 0.80, 1.10, 0.90,
]

function getYearlyReport(year: number): ReportRow[] {
  const base = BASE_MONTHLY[year]
  if (!base) return []
  return base.map((m, i) => {
    const adminFee = Math.round(m.omzet * ADMIN_RATE)
    const netIncome = m.omzet - adminFee - m.refund
    return {
      period: MONTH_LABELS[i],
      date: `${year}-${String(i + 1).padStart(2, '0')}-01`,
      omzet: m.omzet,
      adminFee,
      refund: m.refund,
      netIncome,
      orders: m.orders,
    }
  })
}

function getMonthlyReport(year: number, month: number): ReportRow[] {
  const base = BASE_MONTHLY[year]?.[month - 1]
  if (!base) return []
  const daysInMonth = new Date(year, month, 0).getDate()
  const weights = DAY_WEIGHTS.slice(0, daysInMonth)
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  return weights.map((w, i) => {
    const day = i + 1
    const omzet = Math.round((base.omzet * w) / totalWeight)
    const adminFee = Math.round(omzet * ADMIN_RATE)
    const refund = (i % 7 === 0 || i % 11 === 3)
      ? Math.round(base.refund / Math.max(1, Math.floor(daysInMonth / 5)))
      : 0
    const netIncome = omzet - adminFee - refund
    const orders = Math.max(1, Math.round((base.orders * w) / totalWeight))
    return {
      period: `${day}`,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      omzet,
      adminFee,
      refund,
      netIncome,
      orders,
    }
  })
}

function computeSummary(rows: ReportRow[]): ReportSummary {
  return rows.reduce(
    (s, r) => ({
      omzet:     s.omzet + r.omzet,
      adminFee:  s.adminFee + r.adminFee,
      refund:    s.refund + r.refund,
      netIncome: s.netIncome + r.netIncome,
      orders:    s.orders + r.orders,
    }),
    { omzet: 0, adminFee: 0, refund: 0, netIncome: 0, orders: 0 }
  )
}

function getPrevSummary(mode: ReportMode, year: number, month: number): ReportSummary {
  if (mode === 'yearly') return computeSummary(getYearlyReport(year - 1))
  const pm = month === 1 ? 12 : month - 1
  const py = month === 1 ? year - 1 : year
  return computeSummary(getMonthlyReport(py, pm))
}

function pctChange(cur: number, prev: number) {
  if (prev === 0) return null
  return ((cur - prev) / prev) * 100
}

// ─── Mock Transactions ────────────────────────────────────────────────────────

const mockTransactions: Transaction[] = [
  { id: 'TRX-001', date: '2024-01-15', description: 'Penjualan iPhone 14 Pro Max',           type: 'Penjualan',   amount:  15999000, status: 'Sukses' },
  { id: 'TRX-002', date: '2024-01-15', description: 'Penjualan Samsung Galaxy S23',           type: 'Penjualan',   amount:  18999000, status: 'Sukses' },
  { id: 'TRX-003', date: '2024-01-15', description: 'Biaya Layanan Platform (Jan W3)',         type: 'Biaya Admin', amount:    -698000, status: 'Sukses' },
  { id: 'TRX-004', date: '2024-01-14', description: 'Penarikan ke BCA - 1234****',            type: 'Penarikan',   amount: -20000000, status: 'Sukses' },
  { id: 'TRX-005', date: '2024-01-14', description: 'Refund Pesanan ORD-005',                 type: 'Refund',      amount:  -8999000, status: 'Sukses' },
  { id: 'TRX-006', date: '2024-01-13', description: 'Penjualan MacBook Air M2',               type: 'Penjualan',   amount:  18999000, status: 'Sukses' },
  { id: 'TRX-007', date: '2024-01-13', description: 'Penjualan Nike Air Jordan 1',            type: 'Penjualan',   amount:   4998000, status: 'Sukses' },
  { id: 'TRX-008', date: '2024-01-12', description: 'Biaya Layanan Platform (Jan W2)',         type: 'Biaya Admin', amount:    -480000, status: 'Sukses' },
  { id: 'TRX-009', date: '2024-01-12', description: 'Penarikan ke Mandiri - 5678****',        type: 'Penarikan',   amount: -15000000, status: 'Pending' },
  { id: 'TRX-010', date: '2024-01-12', description: 'Penjualan Sony WH-1000XM5',              type: 'Penjualan',   amount:   5499000, status: 'Sukses' },
  { id: 'TRX-011', date: '2024-01-11', description: 'Penjualan iPad Air 5th Gen',             type: 'Penjualan',   amount:   8999000, status: 'Sukses' },
  { id: 'TRX-012', date: '2024-01-11', description: 'Refund Pesanan ORD-003',                 type: 'Refund',      amount:  -1299000, status: 'Sukses' },
  { id: 'TRX-013', date: '2024-01-10', description: 'Penjualan Adidas Ultraboost',            type: 'Penjualan',   amount:   2899000, status: 'Sukses' },
  { id: 'TRX-014', date: '2024-01-10', description: 'Penarikan ke GoPay - 0812****',          type: 'Penarikan',   amount:  -5000000, status: 'Gagal' },
  { id: 'TRX-015', date: '2024-01-09', description: 'Penjualan Magic Mouse',                  type: 'Penjualan',   amount:   1299000, status: 'Sukses' },
  { id: 'TRX-016', date: '2024-01-09', description: 'Penjualan Samsung Galaxy Buds2',         type: 'Penjualan',   amount:   3299000, status: 'Pending' },
  { id: 'TRX-017', date: '2024-01-08', description: 'Biaya Layanan Platform (Jan W1)',         type: 'Biaya Admin', amount:    -320000, status: 'Sukses' },
  { id: 'TRX-018', date: '2024-01-08', description: 'Penarikan ke BNI - 9012****',            type: 'Penarikan',   amount: -10000000, status: 'Sukses' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Math.abs(amount))
}

function formatPriceShort(amount: number) {
  if (Math.abs(amount) >= 1_000_000_000)
    return `Rp ${(Math.abs(amount) / 1_000_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000_000)
    return `Rp ${(Math.abs(amount) / 1_000_000).toFixed(0)}Jt`
  if (Math.abs(amount) >= 1_000)
    return `Rp ${(Math.abs(amount) / 1_000).toFixed(0)}Rb`
  return `Rp ${Math.abs(amount)}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const TYPE_CONFIG: Record<TxType, { class: string }> = {
  Penjualan:    { class: 'bg-green-50 text-green-700 border-green-200' },
  Penarikan:    { class: 'bg-blue-50 text-blue-700 border-blue-200' },
  Refund:       { class: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Biaya Admin':{ class: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_CONFIG: Record<TxStatus, { class: string; icon: React.ElementType }> = {
  Sukses:  { class: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  Pending: { class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  Gagal:   { class: 'bg-red-50 text-red-700 border-red-200',       icon: XCircle },
}

// ─── Trend indicator ─────────────────────────────────────────────────────────

function Trend({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return null
  const up = inverse ? pct < 0 : pct > 0
  const color = pct === 0 ? 'text-muted-foreground' : up ? 'text-green-600' : 'text-red-600'
  const Icon = pct === 0 ? Minus : pct > 0 ? ChevronUp : ChevronDown
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(pct).toFixed(1)}% vs periode lalu
    </span>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ReportTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const omzet = (payload.find(p => p.name === 'netIncome')?.value ?? 0) +
                (payload.find(p => p.name === 'adminFee')?.value ?? 0) +
                (payload.find(p => p.name === 'refund')?.value ?? 0)
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-xs space-y-1.5 min-w-[200px]">
      <p className="font-semibold text-sm border-b pb-1.5 mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Omzet</span>
        <span className="font-medium">{formatPrice(omzet)}</span>
      </div>
      {payload.map(p => {
        const labels: Record<string, string> = { netIncome: 'Net Income', adminFee: 'Biaya Admin (2%)', refund: 'Refund' }
        return (
          <div key={p.name} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: p.fill }} />
              {labels[p.name] ?? p.name}
            </span>
            <span className="font-medium">{formatPrice(p.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Withdraw Dialog ──────────────────────────────────────────────────────────

function WithdrawDialog({ open, onClose, balance }: { open: boolean; onClose: () => void; balance: number }) {
  const [method, setMethod] = useState('')
  const [account, setAccount] = useState('')
  const [accountName, setAccountName] = useState('')
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const amountNum = Number(amount.replace(/\D/g, ''))
  const isValid = method && account.trim() && accountName.trim() && amountNum > 0 && amountNum <= balance

  const handleSubmit = () => { if (isValid) setSubmitted(true) }

  const handleClose = () => {
    setMethod(''); setAccount(''); setAccountName(''); setAmount(''); setSubmitted(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Tarik Saldo</DialogTitle></DialogHeader>
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold text-lg">Permintaan Penarikan Dikirim</p>
            <p className="text-sm text-muted-foreground">
              Penarikan {formatPrice(amountNum)} akan diproses dalam 1–3 hari kerja.
            </p>
            <Button onClick={handleClose} className="mt-2">Tutup</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo Tersedia</span>
              <span className="font-semibold text-green-600">{formatPrice(balance)}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Metode Penarikan</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bca"><span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />Transfer Bank BCA</span></SelectItem>
                  <SelectItem value="mandiri">Transfer Bank Mandiri</SelectItem>
                  <SelectItem value="bni">Transfer Bank BNI</SelectItem>
                  <SelectItem value="bri">Transfer Bank BRI</SelectItem>
                  <SelectItem value="gopay">GoPay</SelectItem>
                  <SelectItem value="ovo">OVO</SelectItem>
                  <SelectItem value="dana">DANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nomor Rekening / Akun</Label>
              <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="Masukkan nomor rekening" />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Pemilik Rekening</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Nama sesuai rekening" />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Penarikan (Rp)</Label>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0" type="text" inputMode="numeric"
              />
              {amountNum > balance && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Melebihi saldo tersedia
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>Batal</Button>
              <Button onClick={handleSubmit} disabled={!isValid}>
                <ArrowDownToLine className="w-4 h-4 mr-1.5" />Konfirmasi Penarikan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AVAILABLE_YEARS = [2022, 2023, 2024]

export function PaymentsPage() {
  const { hasFeature } = useTenant()
  // ── existing state ──
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  // ── income report state ──
  const [reportMode, setReportMode] = useState<ReportMode>('monthly')
  const [reportYear, setReportYear] = useState(2024)
  const [reportMonth, setReportMonth] = useState(6)
  const [reportPage, setReportPage] = useState(1)
  const [reportPageSize, setReportPageSize] = useState(10)

  const balance = 45_250_000

  // ── report data ──
  const reportRows = reportMode === 'yearly'
    ? getYearlyReport(reportYear)
    : getMonthlyReport(reportYear, reportMonth)

  const summary = computeSummary(reportRows)
  const prevSummary = getPrevSummary(reportMode, reportYear, reportMonth)

  const reportPeriodLabel = reportMode === 'yearly'
    ? `Tahun ${reportYear}`
    : `${MONTH_NAMES[reportMonth - 1]} ${reportYear}`

  const prevPeriodLabel = reportMode === 'yearly'
    ? `Tahun ${reportYear - 1}`
    : reportMonth === 1
      ? `${MONTH_NAMES[11]} ${reportYear - 1}`
      : `${MONTH_NAMES[reportMonth - 2]} ${reportYear}`

  // ── report table pagination ──
  const rpIsAll = reportPageSize === 0
  const rpEffSize = rpIsAll ? reportRows.length : reportPageSize
  const rpTotalPages = Math.max(1, Math.ceil(reportRows.length / rpEffSize))
  const rpPage = Math.min(reportPage, rpTotalPages)
  const rpPaged = rpIsAll ? reportRows : reportRows.slice((rpPage - 1) * rpEffSize, rpPage * rpEffSize)
  const rpStart = rpIsAll ? 1 : (rpPage - 1) * rpEffSize + 1
  const rpEnd = rpIsAll ? reportRows.length : Math.min(rpPage * rpEffSize, reportRows.length)

  // ── export income report ──
  const handleExportReport = () => {
    const rows = reportRows.map(r => ({
      'Periode': r.period,
      'Omzet (Rp)': r.omzet,
      'Biaya Admin 2% (Rp)': r.adminFee,
      'Refund (Rp)': r.refund,
      'Net Income (Rp)': r.netIncome,
      'Jumlah Pesanan': r.orders,
      'Margin Bersih (%)': r.omzet > 0 ? ((r.netIncome / r.omzet) * 100).toFixed(1) + '%' : '0.0%',
    }))
    // Summary row
    rows.push({
      'Periode': 'TOTAL',
      'Omzet (Rp)': summary.omzet,
      'Biaya Admin 2% (Rp)': summary.adminFee,
      'Refund (Rp)': summary.refund,
      'Net Income (Rp)': summary.netIncome,
      'Jumlah Pesanan': summary.orders,
      'Margin Bersih (%)': ((summary.netIncome / summary.omzet) * 100).toFixed(1) + '%',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penghasilan')
    XLSX.writeFile(wb, `laporan-penghasilan-${reportMode === 'yearly' ? reportYear : `${reportYear}-${String(reportMonth).padStart(2,'0')}`}.xlsx`)
  }

  // ── transactions ──
  const filtered = mockTransactions.filter(tx => {
    const matchSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = typeFilter === 'all' || tx.type === typeFilter
    return matchSearch && matchType
  })

  const isShowAll = pageSize === 0
  const effectiveSize = isShowAll ? filtered.length : pageSize
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectiveSize))
  const page = Math.min(currentPage, totalPages)
  const paged = isShowAll ? filtered : filtered.slice((page - 1) * effectiveSize, page * effectiveSize)
  const startItem = filtered.length === 0 ? 0 : isShowAll ? 1 : (page - 1) * effectiveSize + 1
  const endItem = isShowAll ? filtered.length : Math.min(page * effectiveSize, filtered.length)

  const handleExportTx = () => {
    const rows = filtered.map(tx => ({
      'ID Transaksi': tx.id,
      'Tanggal': formatDate(tx.date),
      'Keterangan': tx.description,
      'Jenis': tx.type,
      'Jumlah (Rp)': tx.amount,
      'Status': tx.status,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.writeFile(wb, `transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // chart data: limit to last 15 items for monthly (avoid clutter), all for yearly
  const chartData = reportMode === 'monthly'
    ? reportRows.filter((_, i) => i % 2 === 0)   // every other day to reduce clutter
    : reportRows

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Keuangan & Pembayaran</h1>
        <p className="text-muted-foreground">Pantau keuangan, laporan penghasilan, dan riwayat transaksi toko Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Saldo Tersedia</CardTitle>
            <Wallet className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-lg xl:text-2xl font-bold text-green-600 truncate leading-tight">{formatPrice(balance)}</div>
            <Button size="sm" className="w-full mt-auto pt-0" onClick={() => setIsWithdrawOpen(true)}>
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />Tarik Saldo
            </Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-lg xl:text-2xl font-bold text-amber-600 truncate leading-tight">{formatPrice(12_800_000)}</div>
            <p className="text-xs text-muted-foreground mt-auto pt-2">Dicairkan dalam 1–3 hari kerja</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Pendapatan Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-lg xl:text-2xl font-bold truncate leading-tight">{formatPrice(185_000_000)}</div>
            <p className="text-xs text-muted-foreground mt-auto pt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500 shrink-0" />+12.5% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Penarikan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="text-lg xl:text-2xl font-bold truncate leading-tight">{formatPrice(238_500_000)}</div>
            <p className="text-xs text-muted-foreground mt-auto pt-2">Sepanjang waktu</p>
          </CardContent>
        </Card>
      </div>

      {/* ── LAPORAN PENGHASILAN ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5" />
                Laporan Penghasilan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Omzet, biaya admin (2%), refund, dan net income — {reportPeriodLabel}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                {(['monthly', 'yearly'] as ReportMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setReportMode(m); setReportPage(1) }}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      reportMode === m
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {m === 'monthly' ? 'Bulanan' : 'Tahunan'}
                  </button>
                ))}
              </div>

              {/* Month selector (monthly mode only) */}
              {reportMode === 'monthly' && (
                <Select
                  value={String(reportMonth)}
                  onValueChange={v => { setReportMonth(Number(v)); setReportPage(1) }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Year selector */}
              <Select
                value={String(reportYear)}
                onValueChange={v => { setReportYear(Number(v)); setReportPage(1) }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFeature('export-data') && (
                <Button size="sm" variant="outline" onClick={handleExportReport} className="h-8 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                  Export Laporan
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Omzet',
                value: summary.omzet,
                prev: prevSummary.omzet,
                color: 'text-foreground',
                bg: 'bg-muted/30',
                icon: TrendingUp,
                iconColor: 'text-blue-500',
                inverse: false,
              },
              {
                label: 'Biaya Admin (2%)',
                value: summary.adminFee,
                prev: prevSummary.adminFee,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                icon: ReceiptText,
                iconColor: 'text-orange-500',
                inverse: true,
                note: `${((summary.adminFee / summary.omzet) * 100).toFixed(1)}% dari omzet`,
              },
              {
                label: 'Total Refund',
                value: summary.refund,
                prev: prevSummary.refund,
                color: 'text-red-600',
                bg: 'bg-red-50',
                icon: TrendingDown,
                iconColor: 'text-red-500',
                inverse: true,
                note: `${((summary.refund / summary.omzet) * 100).toFixed(1)}% dari omzet`,
              },
              {
                label: 'Net Income',
                value: summary.netIncome,
                prev: prevSummary.netIncome,
                color: 'text-green-600',
                bg: 'bg-green-50',
                icon: Wallet,
                iconColor: 'text-green-500',
                inverse: false,
                note: `Margin ${((summary.netIncome / summary.omzet) * 100).toFixed(1)}%`,
              },
            ].map(kpi => {
              const Icon = kpi.icon
              const pct = pctChange(kpi.value, kpi.prev)
              return (
                <div key={kpi.label} className={`rounded-xl p-4 ${kpi.bg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                  </div>
                  <p className={`text-xl font-bold ${kpi.color}`}>{formatPrice(kpi.value)}</p>
                  {kpi.note && <p className="text-xs text-muted-foreground">{kpi.note}</p>}
                  <div className="pt-1 border-t border-black/5">
                    <Trend pct={pct} inverse={kpi.inverse} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">vs {prevPeriodLabel}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Grafik Komposisi Penghasilan</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Net Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Biaya Admin</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Refund</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                barCategoryGap="20%"
                margin={{ top: 4, right: 8, left: 0, bottom: reportMode === 'monthly' ? 20 : 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: reportMode === 'monthly' ? 9 : 11 }}
                  angle={reportMode === 'monthly' ? -50 : 0}
                  textAnchor={reportMode === 'monthly' ? 'end' : 'middle'}
                  height={reportMode === 'monthly' ? 50 : 30}
                />
                <YAxis tickFormatter={v => formatPriceShort(v)} width={72} tick={{ fontSize: 10 }} />
                <Tooltip content={<ReportTooltip />} />
                <Bar dataKey="netIncome"  stackId="a" fill="#3b82f6" name="netIncome"  radius={[0, 0, 0, 0]} />
                <Bar dataKey="adminFee"   stackId="a" fill="#fbbf24" name="adminFee"   radius={[0, 0, 0, 0]} />
                <Bar dataKey="refund"     stackId="a" fill="#f87171" name="refund"     radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Tinggi bar = total omzet · terbagi atas Net Income (biru), Biaya Admin (kuning), Refund (merah)
            </p>
          </div>

          <Separator />

          {/* Report detail table */}
          <div>
            <p className="text-sm font-semibold mb-3">
              Rincian {reportMode === 'monthly' ? 'Per Hari' : 'Per Bulan'} — {reportPeriodLabel}
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{reportMode === 'monthly' ? 'Tanggal' : 'Bulan'}</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      Biaya Admin
                      <span className="text-[10px] font-normal text-muted-foreground">(2%)</span>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Refund</TableHead>
                  <TableHead className="text-right">Net Income</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Pesanan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rpPaged.map((row, i) => {
                  const margin = row.omzet > 0 ? (row.netIncome / row.omzet) * 100 : 0
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">
                        {reportMode === 'monthly'
                          ? `${row.period} ${MONTH_LABELS[reportMonth - 1]} ${reportYear}`
                          : `${row.period} ${reportYear}`
                        }
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatPrice(row.omzet)}</TableCell>
                      <TableCell className="text-right text-sm text-orange-600">
                        − {formatPrice(row.adminFee)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {row.refund > 0 ? `− ${formatPrice(row.refund)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-600">
                        {formatPrice(row.netIncome)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          margin >= 90 ? 'bg-green-50 text-green-700' :
                          margin >= 80 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{row.orders}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Subtotal row */}
            <div className="grid grid-cols-6 gap-0 mt-2 pt-3 border-t text-sm font-semibold">
              <div className="col-span-1 text-muted-foreground">Total</div>
              <div className="text-right">{formatPrice(summary.omzet)}</div>
              <div className="text-right text-orange-600">− {formatPrice(summary.adminFee)}</div>
              <div className="text-right text-red-600">− {formatPrice(summary.refund)}</div>
              <div className="text-right text-green-600">{formatPrice(summary.netIncome)}</div>
              <div className="text-right text-muted-foreground">{summary.orders} pesanan</div>
            </div>

            {/* Report table pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t mt-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {reportRows.length > 0
                    ? `Menampilkan ${rpStart}–${rpEnd} dari ${reportRows.length} baris`
                    : ''}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Tampilkan</span>
                  <Select
                    value={String(reportPageSize)}
                    onValueChange={v => { setReportPageSize(Number(v)); setReportPage(1) }}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="31">31</SelectItem>
                      <SelectItem value="0">Semua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!rpIsAll && rpTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setReportPage(p => Math.max(1, p - 1))}
                        aria-disabled={rpPage === 1}
                        className={rpPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: rpTotalPages }, (_, i) => i + 1).map(n => (
                      <PaginationItem key={n}>
                        <PaginationLink isActive={n === rpPage} onClick={() => setReportPage(n)} className="cursor-pointer">
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setReportPage(p => Math.min(rpTotalPages, p + 1))}
                        aria-disabled={rpPage === rpTotalPages}
                        className={rpPage === rpTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── RIWAYAT TRANSAKSI ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Riwayat Transaksi</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari ID atau keterangan..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Penjualan">Penjualan</SelectItem>
                  <SelectItem value="Penarikan">Penarikan</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="Biaya Admin">Biaya Admin</SelectItem>
                </SelectContent>
              </Select>
              {hasFeature('export-data') && (
                <Button variant="outline" onClick={handleExportTx}>
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada transaksi ditemukan</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(tx => {
                    const statusCfg = STATUS_CONFIG[tx.status]
                    const StatusIcon = statusCfg.icon
                    const isDebit = tx.amount < 0
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{tx.description}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${TYPE_CONFIG[tx.type].class}`}>
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell className={`font-semibold whitespace-nowrap ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                          {isDebit ? '−' : '+'}{formatPrice(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusCfg.class}`}>
                            <StatusIcon className="w-3 h-3" />{tx.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Menampilkan {startItem}–{endItem} dari {filtered.length} transaksi
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Tampilkan</span>
                    <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1) }}>
                      <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
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
                          <PaginationLink isActive={n === page} onClick={() => setCurrentPage(n)} className="cursor-pointer">{n}</PaginationLink>
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

      <WithdrawDialog open={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} balance={balance} />
    </div>
  )
}
