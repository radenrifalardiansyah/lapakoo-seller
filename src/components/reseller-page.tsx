import { useState, useEffect, useCallback } from 'react'
import { resellersApi, type ApiReseller } from '../lib/api'
import * as XLSX from 'xlsx'
import { exportPdf, fileStamp, formatRupiah } from '../lib/pdf-export'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { TruncatedText } from './ui/truncated-text'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "./ui/pagination"
import {
  Handshake, Plus, Search, Eye, Edit, Trash2, FileSpreadsheet, FileText,
  UserCheck, UserX, CheckCircle, Clock, XCircle, Medal, TrendingUp,
  Copy, Phone, Mail, MapPin, Calendar, Coins, ChevronRight,
  Users, ShieldCheck, AlertCircle, ArrowRight, Star, Settings2,
  RotateCcw,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type ResellerTier   = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
type ResellerStatus = 'active' | 'pending' | 'suspended'

interface Reseller {
  id: string
  name: string
  email: string
  phone: string
  city: string
  address: string
  tier: ResellerTier
  status: ResellerStatus
  joinDate: string
  totalSales: number
  totalOrders: number
  pendingCommission: number
  paidCommission: number
  referralCode: string
  notes?: string
}

interface TierBusinessConfig {
  commission: number      // %
  minSales: number        // Rp
  maxSales: number | null // null = unlimited
}

// ─── Static Visual Config ─────────────────────────────────────────────────────

const TIER_VISUAL: Record<ResellerTier, { color: string; bg: string; border: string; ring: string }> = {
  Bronze:   { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-300',  ring: 'ring-amber-300' },
  Silver:   { color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-400',  ring: 'ring-slate-400' },
  Gold:     { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-400', ring: 'ring-yellow-400' },
  Platinum: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400', ring: 'ring-purple-400' },
}

// ─── Default Editable Business Config ────────────────────────────────────────

const DEFAULT_TIER_SETTINGS: Record<ResellerTier, TierBusinessConfig> = {
  Bronze:   { commission: 5,  minSales: 0,           maxSales: 10_000_000 },
  Silver:   { commission: 8,  minSales: 10_000_000,  maxSales: 50_000_000 },
  Gold:     { commission: 12, minSales: 50_000_000,  maxSales: 150_000_000 },
  Platinum: { commission: 15, minSales: 150_000_000, maxSales: null },
}

const STATUS_CONFIG: Record<ResellerStatus, { label: string; badgeClass: string; icon: React.ElementType }> = {
  active:    { label: 'Aktif',    badgeClass: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  pending:   { label: 'Menunggu', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  suspended: { label: 'Suspend',  badgeClass: 'bg-red-50 text-red-700 border-red-200',       icon: XCircle },
}

const TIERS: ResellerTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum']

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const initialResellers: Reseller[] = [
  {
    id: 'RSL-001', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@gmail.com', phone: '+62 812-3456-7890',
    city: 'Jakarta', address: 'Jl. Sudirman No. 45, Jakarta Pusat', tier: 'Platinum', status: 'active',
    joinDate: '2022-11-01', totalSales: 158_000_000, totalOrders: 78,
    pendingCommission: 5_280_000, paidCommission: 18_420_000, referralCode: 'AHMAD22', notes: 'Top performer, prioritas utama.',
  },
  {
    id: 'RSL-002', name: 'Dewi Kusuma', email: 'dewi.kusuma@gmail.com', phone: '+62 813-2345-6789',
    city: 'Surabaya', address: 'Jl. Ahmad Yani No. 120, Surabaya', tier: 'Gold', status: 'active',
    joinDate: '2023-02-10', totalSales: 92_000_000, totalOrders: 51,
    pendingCommission: 3_840_000, paidCommission: 7_200_000, referralCode: 'DEWI23',
  },
  {
    id: 'RSL-003', name: 'Budi Santoso', email: 'budi.santoso@gmail.com', phone: '+62 814-3456-7890',
    city: 'Jakarta', address: 'Jl. Gatot Subroto No. 77, Jakarta Selatan', tier: 'Gold', status: 'active',
    joinDate: '2023-03-15', totalSales: 78_000_000, totalOrders: 42,
    pendingCommission: 2_400_000, paidCommission: 6_960_000, referralCode: 'BUDI23',
  },
  {
    id: 'RSL-004', name: 'Siti Rahayu', email: 'siti.rahayu@gmail.com', phone: '+62 815-4567-8901',
    city: 'Bandung', address: 'Jl. Diponegoro No. 33, Bandung', tier: 'Silver', status: 'active',
    joinDate: '2023-06-20', totalSales: 38_000_000, totalOrders: 22,
    pendingCommission: 1_120_000, paidCommission: 1_920_000, referralCode: 'SITI23',
  },
  {
    id: 'RSL-005', name: 'Eko Nugroho', email: 'eko.nugroho@gmail.com', phone: '+62 816-5678-9012',
    city: 'Medan', address: 'Jl. Imam Bonjol No. 88, Medan', tier: 'Silver', status: 'active',
    joinDate: '2023-08-05', totalSales: 25_000_000, totalOrders: 15,
    pendingCommission: 800_000, paidCommission: 1_200_000, referralCode: 'EKO23',
  },
  {
    id: 'RSL-006', name: 'Rina Marlina', email: 'rina.marlina@gmail.com', phone: '+62 817-6789-0123',
    city: 'Makassar', address: 'Jl. Sam Ratulangi No. 55, Makassar', tier: 'Bronze', status: 'active',
    joinDate: '2023-10-12', totalSales: 8_000_000, totalOrders: 9,
    pendingCommission: 240_000, paidCommission: 160_000, referralCode: 'RINA23',
  },
  {
    id: 'RSL-007', name: 'Maya Sari', email: 'maya.sari@gmail.com', phone: '+62 818-7890-1234',
    city: 'Bogor', address: 'Jl. Pajajaran No. 12, Bogor', tier: 'Bronze', status: 'active',
    joinDate: '2024-01-08', totalSales: 5_000_000, totalOrders: 6,
    pendingCommission: 120_000, paidCommission: 130_000, referralCode: 'MAYA24',
  },
  {
    id: 'RSL-008', name: 'Hendra Wijaya', email: 'hendra.w@gmail.com', phone: '+62 819-8901-2345',
    city: 'Bali', address: 'Jl. Sunset Road No. 99, Kuta, Bali', tier: 'Gold', status: 'suspended',
    joinDate: '2023-01-20', totalSales: 65_000_000, totalOrders: 35,
    pendingCommission: 1_560_000, paidCommission: 6_240_000, referralCode: 'HENDRA23',
    notes: 'Disuspend karena melanggar ketentuan promosi.',
  },
  {
    id: 'RSL-009', name: 'Fajar Hidayat', email: 'fajar.h@gmail.com', phone: '+62 820-9012-3456',
    city: 'Semarang', address: 'Jl. Pemuda No. 67, Semarang', tier: 'Bronze', status: 'pending',
    joinDate: '2024-01-14', totalSales: 0, totalOrders: 0,
    pendingCommission: 0, paidCommission: 0, referralCode: '',
    notes: 'Pengajuan baru. Memiliki toko online aktif di Instagram.',
  },
  {
    id: 'RSL-010', name: 'Lestari Wulandari', email: 'lestari.w@gmail.com', phone: '+62 821-0123-4567',
    city: 'Yogyakarta', address: 'Jl. Malioboro No. 101, Yogyakarta', tier: 'Bronze', status: 'pending',
    joinDate: '2024-01-15', totalSales: 0, totalOrders: 0,
    pendingCommission: 0, paidCommission: 0, referralCode: '',
    notes: 'Pengajuan baru. Referral dari Ahmad Fauzi (RSL-001).',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

function generateReferralCode(name: string) {
  const year = new Date().getFullYear().toString().slice(-2)
  return (name.replace(/\s+/g, '').slice(0, 5).toUpperCase() + year)
}

function nextTier(tier: ResellerTier): ResellerTier | null {
  const idx = TIERS.indexOf(tier)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: ResellerTier }) {
  const cfg = TIER_VISUAL[tier]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Medal className="w-3 h-3" />{tier}
    </span>
  )
}

function StatusBadge({ status }: { status: ResellerStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.badgeClass}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

// ─── Tier Settings Dialog ─────────────────────────────────────────────────────

function TierSettingsDialog({
  open, onClose, settings, onSave,
}: {
  open: boolean
  onClose: () => void
  settings: Record<ResellerTier, TierBusinessConfig>
  onSave: (next: Record<ResellerTier, TierBusinessConfig>) => void
}) {
  const [draft, setDraft] = useState<Record<ResellerTier, TierBusinessConfig>>(settings)
  const [errors, setErrors] = useState<Partial<Record<ResellerTier, string>>>({})

  const handleOpenChange = (o: boolean) => {
    if (o) { setDraft(settings); setErrors({}) }
    else onClose()
  }

  const setField = (tier: ResellerTier, field: keyof TierBusinessConfig, raw: string) => {
    const num = raw === '' ? 0 : Number(raw.replace(/\D/g, ''))
    setDraft(prev => ({ ...prev, [tier]: { ...prev[tier], [field]: field === 'maxSales' ? (raw === '' ? null : num) : num } }))
    setErrors(prev => ({ ...prev, [tier]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<ResellerTier, string>> = {}
    TIERS.forEach(tier => {
      const s = draft[tier]
      if (s.commission < 1 || s.commission > 99) {
        newErrors[tier] = 'Komisi harus antara 1% – 99%'
      } else if (s.maxSales !== null && s.maxSales <= s.minSales) {
        newErrors[tier] = 'Maks. penjualan harus lebih besar dari min. penjualan'
      }
    })
    // check ascending thresholds
    for (let i = 0; i < TIERS.length - 1; i++) {
      const cur  = draft[TIERS[i]]
      const nxt  = draft[TIERS[i + 1]]
      if (cur.maxSales !== null && nxt.minSales !== cur.maxSales) {
        newErrors[TIERS[i + 1]] = `Min. penjualan harus sama dengan maks. penjualan tier ${TIERS[i]} (${formatPrice(cur.maxSales ?? 0)})`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) { onSave(draft); onClose() }
  }

  const handleReset = () => {
    setDraft(DEFAULT_TIER_SETTINGS)
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />Pengaturan Tier &amp; Komisi
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          Atur persentase komisi dan ambang batas penjualan untuk setiap tier reseller.
        </p>

        <div className="space-y-4">
          {TIERS.map((tier, idx) => {
            const vis = TIER_VISUAL[tier]
            const d   = draft[tier]
            const isLast = idx === TIERS.length - 1
            return (
              <div key={tier} className={`rounded-xl border-2 ${vis.border} ${vis.bg} p-4 space-y-4`}>
                {/* Tier header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${vis.ring} ${vis.bg}`}>
                      <Medal className={`w-4 h-4 ${vis.color}`} />
                    </div>
                    <span className={`font-bold text-base ${vis.color}`}>{tier}</span>
                  </div>
                  <span className={`text-2xl font-black ${vis.color}`}>{d.commission}%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Commission */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Komisi (%)</Label>
                    <div className="flex items-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={d.commission === 0 ? '' : d.commission}
                        onChange={e => setField(tier, 'commission', e.target.value.replace(/\D/g, ''))}
                        onFocus={e => e.target.select()}
                        placeholder="0"
                        className="rounded-r-none"
                      />
                      <span className="px-3 h-9 flex items-center bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Min Sales */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min. Penjualan (Rp)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={d.minSales === 0 ? '' : d.minSales}
                      disabled={idx === 0}
                      onChange={e => setField(tier, 'minSales', e.target.value.replace(/\D/g, ''))}
                      onFocus={e => e.target.select()}
                      placeholder="0"
                    />
                    <p className="text-[10px] text-muted-foreground">{idx === 0 ? 'Selalu Rp 0' : formatPrice(d.minSales)}</p>
                  </div>

                  {/* Max Sales */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Maks. Penjualan (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={isLast ? '' : (d.maxSales ?? '')}
                      disabled={isLast}
                      onChange={e => setField(tier, 'maxSales', e.target.value)}
                      placeholder={isLast ? 'Tidak terbatas' : ''}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isLast ? 'Tier tertinggi (tidak ada batas)' : d.maxSales !== null ? formatPrice(d.maxSales) : '—'}
                    </p>
                  </div>
                </div>

                {errors[tier] && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors[tier]}
                  </div>
                )}

                {/* Progression arrow */}
                {!isLast && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-dashed">
                    <ArrowRight className="w-3 h-3" />
                    <span>
                      Naik ke <span className={`font-semibold ${TIER_VISUAL[TIERS[idx + 1]].color}`}>{TIERS[idx + 1]}</span> setelah mencapai{' '}
                      <span className="font-semibold">{d.maxSales !== null ? formatPrice(d.maxSales) : '—'}</span>
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="outline" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />Reset ke Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={handleSave}>
              <Settings2 className="w-4 h-4 mr-1.5" />Simpan Pengaturan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Dialog ──────────────────────────────────────────────────────────────

function ViewResellerDialog({
  reseller, open, onClose, tierSettings,
  onEdit, onApprove, onSuspend, onActivate, onPayCommission,
}: {
  reseller: Reseller | null
  open: boolean
  onClose: () => void
  tierSettings: Record<ResellerTier, TierBusinessConfig>
  onEdit: (r: Reseller) => void
  onApprove: (r: Reseller) => void
  onSuspend: (r: Reseller) => void
  onActivate: (r: Reseller) => void
  onPayCommission: (r: Reseller) => void
}) {
  const [copied, setCopied] = useState(false)

  if (!reseller) return null
  const vis  = TIER_VISUAL[reseller.tier]
  const biz  = tierSettings[reseller.tier]
  const next = nextTier(reseller.tier)
  const nextBiz = next ? tierSettings[next] : null
  const totalCommission = reseller.pendingCommission + reseller.paidCommission
  const progressToNext = next && nextBiz
    ? Math.min(100, ((reseller.totalSales - biz.minSales) / (nextBiz.minSales - biz.minSales)) * 100)
    : 100

  const handleCopy = () => {
    navigator.clipboard.writeText(reseller.referralCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Detail Reseller</DialogTitle>
            <div className="flex gap-2">
              <TierBadge tier={reseller.tier} />
              <StatusBadge status={reseller.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Profile */}
          <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${vis.bg} ${vis.color} ring-2 ${vis.ring}`}>
              {(reseller.name ?? '').charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">{reseller.name}</p>
              <p className="text-sm text-muted-foreground font-mono">{reseller.id}</p>
              {reseller.referralCode && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Kode Referral:</span>
                  <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono font-semibold tracking-wider">
                    {reseller.referralCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Salin kode referral"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2.5">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Informasi Kontak</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" /><span>{reseller.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5 shrink-0" /><span>{reseller.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{reseller.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Bergabung: <strong className="text-foreground">{formatDate(reseller.joinDate)}</strong></span>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-2.5">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Performa Penjualan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg min-w-0">
                  <p className="text-xs text-blue-600">Total Omzet</p>
                  <TruncatedText className="font-bold text-blue-800 text-sm mt-0.5 text-right tabular-nums truncate">{formatPrice(reseller.totalSales)}</TruncatedText>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg min-w-0">
                  <p className="text-xs text-indigo-600">Total Pesanan</p>
                  <TruncatedText className="font-bold text-indigo-800 text-lg mt-0.5 text-right tabular-nums truncate">{reseller.totalOrders}</TruncatedText>
                </div>
              </div>
              {reseller.totalOrders > 0 && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  Rata-rata pesanan: {formatPrice(reseller.totalSales / reseller.totalOrders)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Commission */}
          <div className="space-y-3">
            <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Komisi</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center min-w-0">
                <p className="text-xs text-amber-600">Rate Komisi</p>
                <TruncatedText className="text-2xl font-bold text-amber-700 tabular-nums truncate">{biz.commission}%</TruncatedText>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center min-w-0">
                <p className="text-xs text-orange-600">Menunggu Bayar</p>
                <TruncatedText className="font-bold text-orange-700 mt-0.5 text-sm tabular-nums truncate">{formatPrice(reseller.pendingCommission)}</TruncatedText>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center min-w-0">
                <p className="text-xs text-green-600">Sudah Dibayar</p>
                <TruncatedText className="font-bold text-green-700 mt-0.5 text-sm tabular-nums truncate">{formatPrice(reseller.paidCommission)}</TruncatedText>
              </div>
            </div>
            {totalCommission > 0 && (
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                Total komisi sepanjang waktu: <strong>{formatPrice(totalCommission)}</strong>
              </p>
            )}
          </div>

          {/* Tier progression */}
          {reseller.status === 'active' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <TierBadge tier={reseller.tier} />
                </span>
                {next ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Menuju <TierBadge tier={next} />
                  </span>
                ) : (
                  <span className="text-purple-600 font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />Tier Tertinggi
                  </span>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${vis.bg.replace('-50', '-400')}`}
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              {next && nextBiz && (
                <p className="text-xs text-muted-foreground">
                  Butuh {formatPrice(nextBiz.minSales - reseller.totalSales)} lagi untuk naik ke {next}
                </p>
              )}
            </div>
          )}

          {reseller.notes && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{reseller.notes}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-between gap-2 pt-1 border-t">
            <div className="flex gap-2">
              {reseller.status === 'pending' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700"
                  onClick={() => { onClose(); onApprove(reseller) }}>
                  <UserCheck className="w-4 h-4 mr-1.5" />Setujui
                </Button>
              )}
              {reseller.status === 'active' && (
                <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => { onClose(); onSuspend(reseller) }}>
                  <UserX className="w-4 h-4 mr-1.5" />Suspend
                </Button>
              )}
              {reseller.status === 'suspended' && (
                <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                  onClick={() => { onClose(); onActivate(reseller) }}>
                  <UserCheck className="w-4 h-4 mr-1.5" />Aktifkan
                </Button>
              )}
              {reseller.pendingCommission > 0 && (
                <Button size="sm" variant="outline"
                  onClick={() => { onClose(); onPayCommission(reseller) }}>
                  <Coins className="w-4 h-4 mr-1.5" />Bayar Komisi
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => { onClose(); onEdit(reseller) }}>
              <Edit className="w-4 h-4 mr-1.5" />Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────

interface ResellerForm {
  name: string
  email: string
  phone: string
  city: string
  address: string
  tier: ResellerTier
  notes: string
}

const emptyForm: ResellerForm = {
  name: '', email: '', phone: '', city: '', address: '', tier: 'Bronze', notes: '',
}

function ResellerFormDialog({
  mode, initialData, open, onClose, onSave, tierSettings,
}: {
  mode: 'add' | 'edit'
  initialData: ResellerForm
  open: boolean
  onClose: () => void
  onSave: (data: ResellerForm) => void
  tierSettings: Record<ResellerTier, TierBusinessConfig>
}) {
  const [form, setForm] = useState<ResellerForm>(initialData)

  const set = (field: keyof ResellerForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleOpenChange = (o: boolean) => {
    if (o) setForm(initialData)
    else onClose()
  }

  const isValid = form.name.trim() && form.email.trim() && form.phone.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Tambah Reseller Baru' : 'Edit Reseller'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nama reseller" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>No. Telepon <span className="text-red-500">*</span></Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+62 812-xxxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Kota</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Kota domisili" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alamat Lengkap</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Jl. nama jalan, no. rumah, kota" />
          </div>

          <div className="space-y-1.5">
            <Label>Tier Reseller</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIERS.map(tier => {
                const vis = TIER_VISUAL[tier]
                const biz = tierSettings[tier]
                const selected = form.tier === tier
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => set('tier', tier)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      selected ? `${vis.border} ${vis.bg}` : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                  >
                    <Medal className={`w-4 h-4 mx-auto mb-1 ${selected ? vis.color : 'text-muted-foreground'}`} />
                    <p className={`text-xs font-semibold ${selected ? vis.color : 'text-muted-foreground'}`}>{tier}</p>
                    <p className="text-[10px] text-muted-foreground">{biz.commission}% komisi</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan Internal</Label>
            <Textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Catatan tentang reseller ini (opsional)..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => { if (isValid) { onSave(form); onClose() } }} disabled={!isValid}>
              {mode === 'add' ? 'Tambah Reseller' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Approve Dialog ───────────────────────────────────────────────────────────

function ApproveDialog({
  reseller, open, onClose, onConfirm, tierSettings,
}: {
  reseller: Reseller | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string, tier: ResellerTier) => void
  tierSettings: Record<ResellerTier, TierBusinessConfig>
}) {
  const [tier, setTier] = useState<ResellerTier>('Bronze')
  if (!reseller) return null

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <UserCheck className="w-5 h-5" />Setujui Pendaftaran Reseller
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <p className="font-semibold">{reseller.name}</p>
            <p className="text-muted-foreground">{reseller.email} · {reseller.phone}</p>
            {reseller.notes && <p className="text-xs text-blue-600 mt-1">{reseller.notes}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tetapkan Tier Awal</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map(t => {
                const vis = TIER_VISUAL[t]
                const biz = tierSettings[t]
                return (
                  <button key={t} type="button" onClick={() => setTier(t)}
                    className={`p-2.5 border-2 rounded-lg text-left transition-all flex items-center gap-2 ${
                      tier === t ? `${vis.border} ${vis.bg}` : 'border-muted-foreground/20'
                    }`}
                  >
                    <Medal className={`w-4 h-4 shrink-0 ${tier === t ? vis.color : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-xs font-semibold ${tier === t ? vis.color : 'text-muted-foreground'}`}>{t}</p>
                      <p className="text-[10px] text-muted-foreground">{biz.commission}% komisi</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700"
              onClick={() => { onConfirm(reseller.id, tier); onClose() }}>
              <UserCheck className="w-4 h-4 mr-1.5" />Konfirmasi Persetujuan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Pay Commission Dialog ────────────────────────────────────────────────────

function PayCommissionDialog({
  reseller, open, onClose, onConfirm, tierSettings,
}: {
  reseller: Reseller | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string) => void
  tierSettings: Record<ResellerTier, TierBusinessConfig>
}) {
  const [method, setMethod] = useState('')
  if (!reseller) return null

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { setMethod(''); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />Pembayaran Komisi Reseller
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-sm text-amber-700">Komisi yang akan dibayarkan ke</p>
            <p className="font-bold text-lg mt-1">{reseller.name}</p>
            <TruncatedText className="text-2xl font-bold text-amber-700 mt-2 tabular-nums truncate">{formatPrice(reseller.pendingCommission)}</TruncatedText>
            <p className="text-xs text-amber-600 mt-1">
              Tier {reseller.tier} · {tierSettings[reseller.tier].commission}% komisi
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Metode Pembayaran <span className="text-red-500">*</span></Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Pilih metode transfer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bca">Transfer Bank BCA</SelectItem>
                <SelectItem value="mandiri">Transfer Bank Mandiri</SelectItem>
                <SelectItem value="bni">Transfer Bank BNI</SelectItem>
                <SelectItem value="bri">Transfer Bank BRI</SelectItem>
                <SelectItem value="gopay">GoPay</SelectItem>
                <SelectItem value="ovo">OVO</SelectItem>
                <SelectItem value="dana">DANA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Setelah dikonfirmasi, komisi akan ditandai sebagai sudah dibayar dan saldo komisi reseller akan direset ke Rp 0.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => { setMethod(''); onClose() }}>Batal</Button>
            <Button disabled={!method}
              onClick={() => { onConfirm(reseller.id); setMethod(''); onClose() }}>
              <Coins className="w-4 h-4 mr-1.5" />Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── API → Local type mapper ──────────────────────────────────────────────────

function mapApiReseller(r: ApiReseller): Reseller {
  return {
    id: String(r.id),
    name: r.name,
    email: r.email ?? '',
    phone: r.phone ?? '',
    city: r.city ?? '',
    address: r.address ?? '',
    tier: (r.tier as ResellerTier) ?? 'Bronze',
    status: (r.status as ResellerStatus) ?? 'pending',
    joinDate: r.join_date ?? r.created_at?.slice(0, 10) ?? '',
    totalSales: Number(r.total_sales) || 0,
    totalOrders: Number(r.total_orders) || 0,
    pendingCommission: Number(r.pending_commission) || 0,
    paidCommission: Number(r.paid_commission) || 0,
    referralCode: r.referral_code ?? '',
    notes: r.notes,
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResellerPage() {
  const { hasFeature, tenant } = useTenant()
  const [resellers, setResellers]         = useState<Reseller[]>([])
  const [resellersLoading, setResellersLoading] = useState(true)
  const [resellersError, setResellersError] = useState<string | null>(null)
  const [tierSettings, setTierSettings]   = useState<Record<ResellerTier, TierBusinessConfig>>(DEFAULT_TIER_SETTINGS)
  const [searchTerm, setSearchTerm]       = useState('')
  const [tierFilter, setTierFilter]       = useState<string>('all')
  const [activeTab, setActiveTab]         = useState('all')
  const [currentPage, setCurrentPage]     = useState(1)
  const [pageSize, setPageSize]           = useState(5)

  // dialogs
  const [viewReseller, setViewReseller]         = useState<Reseller | null>(null)
  const [editReseller, setEditReseller]         = useState<Reseller | null>(null)
  const [approveReseller, setApproveReseller]   = useState<Reseller | null>(null)
  const [payReseller, setPayReseller]           = useState<Reseller | null>(null)
  const [suspendReseller, setSuspendReseller]   = useState<Reseller | null>(null)
  const [activateReseller, setActivateReseller] = useState<Reseller | null>(null)
  const [deleteReseller, setDeleteReseller]     = useState<Reseller | null>(null)
  const [isAddOpen, setIsAddOpen]               = useState(false)
  const [isTierSettingsOpen, setIsTierSettingsOpen] = useState(false)

  const loadResellers = useCallback(async () => {
    setResellersLoading(true)
    setResellersError(null)
    try {
      const data = await resellersApi.list()
      setResellers(data.map(mapApiReseller))
    } catch (err) {
      setResellersError(err instanceof Error ? err.message : 'Gagal memuat reseller')
      setResellers(initialResellers)
    } finally {
      setResellersLoading(false)
    }
  }, [])

  useEffect(() => { loadResellers() }, [loadResellers])

  const resetPage = () => setCurrentPage(1)

  // ── filter ──
  const filterResellers = (tabVal: string) =>
    resellers.filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      const matchTier = tierFilter === 'all' || r.tier === tierFilter
      const matchTab  = tabVal === 'all' || r.status === tabVal
      return matchSearch && matchTier && matchTab
    })

  // ── stats ──
  const stats = {
    total:        resellers.length,
    active:       resellers.filter(r => r.status === 'active').length,
    pending:      resellers.filter(r => r.status === 'pending').length,
    suspended:    resellers.filter(r => r.status === 'suspended').length,
    totalPaid:    resellers.reduce((s, r) => s + r.paidCommission, 0),
    totalPending: resellers.reduce((s, r) => s + r.pendingCommission, 0),
  }

  const tierCounts = TIERS.reduce<Record<ResellerTier, number>>((acc, t) => {
    acc[t] = resellers.filter(r => r.tier === t && r.status === 'active').length
    return acc
  }, { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 })

  // ── handlers ──
  const handleAdd = (data: ResellerForm) => {
    resellersApi.create({
      name: data.name, email: data.email, phone: data.phone,
      city: data.city, address: data.address, notes: data.notes,
      status: 'pending', tier: data.tier,
    }).then(created => {
      setResellers(prev => [...prev, mapApiReseller(created)])
    }).catch(() => {
      // Fallback lokal
      const id = `RSL-${String(resellers.length + 1).padStart(3, '0')}`
      setResellers(prev => [...prev, {
        id, ...data, status: 'pending',
        joinDate: new Date().toISOString().slice(0, 10),
        totalSales: 0, totalOrders: 0,
        pendingCommission: 0, paidCommission: 0, referralCode: '',
      }])
    })
  }

  const handleEdit = (data: ResellerForm) => {
    if (!editReseller) return
    setResellers(prev => prev.map(r => r.id === editReseller.id ? { ...r, ...data } : r))
    resellersApi.update(editReseller.id, {
      name: data.name, email: data.email, phone: data.phone,
      city: data.city, address: data.address, notes: data.notes, tier: data.tier,
    }).catch(() => {})
  }

  const handleApprove = (id: string, tier: ResellerTier) => {
    const ref = generateReferralCode(resellers.find(r => r.id === id)?.name ?? id)
    setResellers(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'active', tier, referralCode: ref } : r
    ))
    resellersApi.update(id, { status: 'active', tier, referral_code: ref }).catch(() => {})
  }

  const handleSuspend = () => {
    if (!suspendReseller) return
    setResellers(prev => prev.map(r => r.id === suspendReseller.id ? { ...r, status: 'suspended' } : r))
    resellersApi.update(suspendReseller.id, { status: 'suspended' }).catch(() => {})
    setSuspendReseller(null)
  }

  const handleActivate = () => {
    if (!activateReseller) return
    setResellers(prev => prev.map(r => r.id === activateReseller.id ? { ...r, status: 'active' } : r))
    resellersApi.update(activateReseller.id, { status: 'active' }).catch(() => {})
    setActivateReseller(null)
  }

  const handlePayCommission = (id: string) => {
    const r = resellers.find(x => x.id === id)
    if (!r) return
    setResellers(prev => prev.map(x =>
      x.id === id ? { ...x, paidCommission: x.paidCommission + x.pendingCommission, pendingCommission: 0 } : x
    ))
    resellersApi.update(id, {
      paid_commission: r.paidCommission + r.pendingCommission,
      pending_commission: 0,
    }).catch(() => {})
  }

  const handleDelete = () => {
    if (!deleteReseller) return
    setResellers(prev => prev.filter(r => r.id !== deleteReseller.id))
    resellersApi.remove(deleteReseller.id).catch(() => {})
    setDeleteReseller(null)
  }

  // ── export ──
  const handleExport = () => {
    const rows = filterResellers(activeTab).map(r => ({
      'ID': r.id,
      'Nama': r.name,
      'Email': r.email,
      'Telepon': r.phone,
      'Kota': r.city,
      'Tier': r.tier,
      'Komisi (%)': tierSettings[r.tier].commission,
      'Status': STATUS_CONFIG[r.status].label,
      'Total Penjualan (Rp)': r.totalSales,
      'Total Pesanan': r.totalOrders,
      'Komisi Pending (Rp)': r.pendingCommission,
      'Komisi Dibayar (Rp)': r.paidCommission,
      'Kode Referral': r.referralCode,
      'Bergabung': formatDate(r.joinDate),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 10 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 14 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
      { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reseller')
    XLSX.writeFile(wb, `reseller-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportPdf = () => {
    const data = filterResellers(activeTab)
    const totalSales = data.reduce((s, r) => s + r.totalSales, 0)
    const totalPending = data.reduce((s, r) => s + r.pendingCommission, 0)

    exportPdf({
      fileName: `reseller-${activeTab}-${fileStamp()}`,
      title: 'Daftar Reseller',
      subtitle: `Filter: ${TABS.find(t => t.value === activeTab)?.label ?? 'Semua'}`,
      storeName: tenant?.storeName,
      orientation: 'landscape',
      summary: [
        { label: 'Total Reseller', value: String(data.length) },
        { label: 'Total Penjualan', value: formatRupiah(totalSales) },
        { label: 'Komisi Pending', value: formatRupiah(totalPending) },
      ],
      columns: [
        { header: 'Nama', width: 40 },
        { header: 'Email', width: 50 },
        { header: 'Kota', width: 26 },
        { header: 'Tier', width: 18, align: 'center' },
        { header: 'Komisi %', width: 20, align: 'right' },
        { header: 'Total Penjualan', width: 32, align: 'right' },
        { header: 'Pending', width: 28, align: 'right' },
        { header: 'Dibayar', width: 28, align: 'right' },
        { header: 'Status', width: 22, align: 'center' },
      ],
      rows: data.map(r => [
        r.name,
        r.email,
        r.city,
        r.tier,
        `${tierSettings[r.tier].commission}%`,
        formatRupiah(r.totalSales),
        formatRupiah(r.pendingCommission),
        formatRupiah(r.paidCommission),
        STATUS_CONFIG[r.status].label,
      ]),
      footnote: 'Daftar reseller diekspor dari Eleven Seller',
    })
  }

  // ── tabs config ──
  const TABS = [
    { value: 'all',       label: 'Semua',     count: stats.total },
    { value: 'active',    label: 'Aktif',     count: stats.active },
    { value: 'pending',   label: 'Menunggu',  count: stats.pending },
    { value: 'suspended', label: 'Disuspend', count: stats.suspended },
  ]

  if (resellersLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center space-y-2">
          <Handshake className="w-10 h-10 mx-auto animate-pulse" />
          <p>Memuat reseller...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {resellersError && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <span>Gagal terhubung ke server — menampilkan data contoh</span>
          <Button variant="outline" size="sm" onClick={loadResellers}>Muat Ulang</Button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="w-7 h-7" />Manajemen Reseller
          </h1>
          <p className="text-muted-foreground">Kelola jaringan reseller, tier, dan pembayaran komisi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsTierSettingsOpen(true)}>
            <Settings2 className="w-4 h-4 mr-1.5" />Pengaturan Tier
          </Button>
          {hasFeature('export-data') && (
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />Export Excel
            </Button>
          )}
          {hasFeature('export-pdf') && (
            <Button variant="outline" onClick={handleExportPdf}>
              <FileText className="w-4 h-4 mr-1.5" />Export PDF
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Tambah Reseller
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Reseller</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-right tabular-nums truncate">{stats.total}</TruncatedText>
            <p className="text-xs text-muted-foreground tabular-nums">{stats.active} aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Menunggu Persetujuan</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-amber-600 text-right tabular-nums truncate">{stats.pending}</TruncatedText>
            <p className="text-xs text-muted-foreground">perlu ditinjau</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Komisi Pending</CardTitle>
            <Coins className="h-4 w-4 text-orange-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-orange-600 text-right tabular-nums truncate">{formatPrice(stats.totalPending)}</TruncatedText>
            <p className="text-xs text-muted-foreground">belum dibayarkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium truncate">Total Komisi Dibayar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <TruncatedText as="div" className="text-2xl font-bold text-green-600 text-right tabular-nums truncate">{formatPrice(stats.totalPaid)}</TruncatedText>
            <p className="text-xs text-muted-foreground">sepanjang waktu</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIERS.map(tier => {
          const vis = TIER_VISUAL[tier]
          const biz = tierSettings[tier]
          return (
            <div key={tier} className={`p-4 rounded-xl border ${vis.bg} ${vis.border} flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vis.color} ${vis.bg} ring-2 ${vis.ring}`}>
                <Medal className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-bold text-lg ${vis.color}`}>{tierCounts[tier]}</p>
                <p className={`text-xs font-medium ${vis.color} opacity-80`}>{tier} · {biz.commission}%</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); resetPage() }}>
        <div className="overflow-x-auto">
          <TabsList className="flex w-max">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
                {t.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t.value === 'pending' && t.count > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-muted-foreground'
                }`}>{t.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Daftar Reseller</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, email, kode referral..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); resetPage() }}
                    className="pl-8"
                  />
                </div>
                <Select value={tierFilter} onValueChange={v => { setTierFilter(v); resetPage() }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tier</SelectItem>
                    {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {TABS.map(t => {
              const filtered = filterResellers(t.value)
              const isAll    = pageSize === 0
              const effSize  = isAll ? filtered.length : pageSize
              const totalPg  = Math.max(1, Math.ceil(filtered.length / effSize))
              const pg       = Math.min(currentPage, totalPg)
              const paged    = isAll ? filtered : filtered.slice((pg - 1) * effSize, pg * effSize)
              const startI   = filtered.length === 0 ? 0 : isAll ? 1 : (pg - 1) * effSize + 1
              const endI     = isAll ? filtered.length : Math.min(pg * effSize, filtered.length)

              return (
                <TabsContent key={t.value} value={t.value} className="mt-0 space-y-4">
                  {filtered.length === 0 ? (
                    <div className="text-center py-14 text-muted-foreground">
                      <Handshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Tidak ada reseller ditemukan</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reseller</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Penjualan</TableHead>
                            <TableHead className="text-right">Komisi Pending</TableHead>
                            <TableHead>Bergabung</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paged.map(r => {
                            const vis = TIER_VISUAL[r.tier]
                            return (
                              <TableRow key={r.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${vis.bg} ${vis.color} ring-1 ${vis.ring}`}>
                                      {(r.name ?? '').charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{r.name}</p>
                                      <p className="text-xs text-muted-foreground">{r.email}</p>
                                      {r.referralCode && (
                                        <p className="text-xs font-mono text-primary">{r.referralCode}</p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell><TierBadge tier={r.tier} /></TableCell>
                                <TableCell><StatusBadge status={r.status} /></TableCell>
                                <TableCell className="text-right font-medium text-sm tabular-nums whitespace-nowrap">
                                  {r.totalSales > 0 ? formatPrice(r.totalSales) : '—'}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">
                                  {r.pendingCommission > 0
                                    ? <span className="text-orange-600 font-medium">{formatPrice(r.pendingCommission)}</span>
                                    : <span className="text-muted-foreground">—</span>
                                  }
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {formatDate(r.joinDate)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end items-center gap-1">
                                    <Button variant="ghost" size="sm" title="Lihat detail"
                                      onClick={() => setViewReseller(r)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Edit"
                                      onClick={() => setEditReseller(r)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    {r.status === 'pending' && (
                                      <Button variant="ghost" size="sm" title="Setujui"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => setApproveReseller(r)}>
                                        <UserCheck className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {r.status === 'active' && (
                                      <Button variant="ghost" size="sm" title="Suspend"
                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                        onClick={() => setSuspendReseller(r)}>
                                        <UserX className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {r.status === 'suspended' && (
                                      <Button variant="ghost" size="sm" title="Aktifkan kembali"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => setActivateReseller(r)}>
                                        <UserCheck className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {r.pendingCommission > 0 && (
                                      <Button variant="ghost" size="sm" title="Bayar komisi"
                                        className="text-primary hover:bg-primary/10"
                                        onClick={() => setPayReseller(r)}>
                                        <Coins className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" title="Hapus"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setDeleteReseller(r)}>
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            Menampilkan {startI}–{endI} dari {filtered.length} reseller
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Tampilkan</span>
                            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); resetPage() }}>
                              <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="0">Semua</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {!isAll && totalPg > 1 && (
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  aria-disabled={pg === 1} className={pg === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                              </PaginationItem>
                              {Array.from({ length: totalPg }, (_, i) => i + 1).map(n => (
                                <PaginationItem key={n}>
                                  <PaginationLink isActive={n === pg} onClick={() => setCurrentPage(n)} className="cursor-pointer">{n}</PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPg, p + 1))}
                                  aria-disabled={pg === totalPg} className={pg === totalPg ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
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

      {/* Tier structure info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />Struktur Tier &amp; Komisi
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsTierSettingsOpen(true)}>
              <Settings2 className="w-3.5 h-3.5 mr-1.5" />Edit Pengaturan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier, idx) => {
              const vis  = TIER_VISUAL[tier]
              const biz  = tierSettings[tier]
              const next = TIERS[idx + 1]
              return (
                <div key={tier} className={`p-4 rounded-xl border ${vis.bg} ${vis.border} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Medal className={`w-5 h-5 ${vis.color}`} />
                      <span className={`font-bold ${vis.color}`}>{tier}</span>
                    </div>
                    <span className={`text-2xl font-black ${vis.color}`}>{biz.commission}%</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Min. Penjualan</p>
                    <p className={`font-semibold ${vis.color}`}>
                      {biz.minSales === 0 ? 'Mulai dari Rp 0' : formatPrice(biz.minSales)}
                    </p>
                    {biz.maxSales !== null && (
                      <>
                        <p className="text-muted-foreground mt-1">Maks. Penjualan</p>
                        <p className={`font-semibold ${vis.color}`}>{formatPrice(biz.maxSales)}</p>
                      </>
                    )}
                    {biz.maxSales === null && (
                      <p className={`font-semibold ${vis.color} mt-1 flex items-center gap-1`}>
                        <Star className="w-3 h-3" />Tidak ada batas
                      </p>
                    )}
                  </div>
                  {next && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      <span>Naik ke {next} di {formatPrice(tierSettings[next].minSales)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <TierSettingsDialog
        open={isTierSettingsOpen}
        onClose={() => setIsTierSettingsOpen(false)}
        settings={tierSettings}
        onSave={setTierSettings}
      />

      <ViewResellerDialog
        reseller={viewReseller} open={!!viewReseller}
        onClose={() => setViewReseller(null)}
        tierSettings={tierSettings}
        onEdit={r => setEditReseller(r)}
        onApprove={r => setApproveReseller(r)}
        onSuspend={r => setSuspendReseller(r)}
        onActivate={r => setActivateReseller(r)}
        onPayCommission={r => setPayReseller(r)}
      />

      <ResellerFormDialog
        key={isAddOpen ? 'add' : 'add-closed'}
        mode="add" initialData={emptyForm}
        open={isAddOpen} onClose={() => setIsAddOpen(false)}
        onSave={handleAdd} tierSettings={tierSettings}
      />

      {editReseller && (
        <ResellerFormDialog
          key={`edit-${editReseller.id}`}
          mode="edit"
          initialData={{
            name: editReseller.name, email: editReseller.email, phone: editReseller.phone,
            city: editReseller.city, address: editReseller.address, tier: editReseller.tier,
            notes: editReseller.notes ?? '',
          }}
          open={!!editReseller} onClose={() => setEditReseller(null)}
          onSave={handleEdit} tierSettings={tierSettings}
        />
      )}

      <ApproveDialog
        reseller={approveReseller} open={!!approveReseller}
        onClose={() => setApproveReseller(null)}
        onConfirm={handleApprove} tierSettings={tierSettings}
      />

      <PayCommissionDialog
        reseller={payReseller} open={!!payReseller}
        onClose={() => setPayReseller(null)}
        onConfirm={handlePayCommission} tierSettings={tierSettings}
      />

      {/* Suspend confirm */}
      <AlertDialog open={!!suspendReseller} onOpenChange={o => !o && setSuspendReseller(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Reseller</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mensuspend <strong>{suspendReseller?.name}</strong>?
              Reseller tidak dapat melakukan penjualan selama disuspend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} className="bg-amber-600 hover:bg-amber-700 text-white">
              Ya, Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate confirm */}
      <AlertDialog open={!!activateReseller} onOpenChange={o => !o && setActivateReseller(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Reseller</AlertDialogTitle>
            <AlertDialogDescription>
              Aktifkan kembali akun reseller <strong>{activateReseller?.name}</strong>?
              Reseller dapat kembali berjualan setelah diaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} className="bg-green-600 hover:bg-green-700 text-white">
              Ya, Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteReseller} onOpenChange={o => !o && setDeleteReseller(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Reseller</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleteReseller?.name}</strong> dari daftar reseller?
              Data komisi dan riwayat penjualan akan hilang permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
