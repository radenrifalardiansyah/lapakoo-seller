import { useState } from 'react'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from './ui/pagination'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Separator } from './ui/separator'
import {
  Users, Search, Eye, Star, ShoppingBag, Phone, Mail, MapPin, Calendar, TrendingUp,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Segment = 'VIP' | 'Regular' | 'New'

interface Order {
  id: string
  product: string
  amount: number
  date: string
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
}: {
  customer: Customer | null
  open: boolean
  onClose: () => void
}) {
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
              <span className="truncate">{customer.email}</span>
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
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Total Pesanan</p>
              <p className="text-xl font-bold mt-0.5">{customer.totalOrders}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Total Belanja</p>
              <p className="text-xl font-bold mt-0.5 text-sm">{formatPrice(customer.totalSpend)}</p>
            </div>
          </div>

          <Separator />

          {/* Recent Orders */}
          <div>
            <p className="text-sm font-semibold mb-2">Riwayat Pesanan Terakhir</p>
            <div className="space-y-2">
              {customer.orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg border bg-card">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.product}</p>
                    <p className="text-xs text-muted-foreground">{order.id} · {formatDate(order.date)}</p>
                  </div>
                  <p className="font-semibold shrink-0 ml-3">{formatPrice(order.amount)}</p>
                </div>
              ))}
            </div>
          </div>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<'all' | Segment>('all')
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── Derived state ──
  const filtered = customers.filter(c => {
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
  const totalCustomers = customers.length
  const newThisMonth = customers.filter(c => {
    const join = new Date(c.joinDate)
    const now = new Date()
    return join.getMonth() === now.getMonth() && join.getFullYear() === now.getFullYear()
  }).length
  const activeCustomers = customers.filter(c => c.segment !== 'New' || c.totalOrders >= 2).length
  const avgClv = Math.round(customers.reduce((acc, c) => acc + c.totalSpend, 0) / customers.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Manajemen Pelanggan</h1>
        <p className="text-muted-foreground">Kelola dan pantau data pelanggan toko Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.247</div>
            <p className="text-xs text-muted-foreground">pelanggan terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Baru Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">bergabung bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">aktif bertransaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata CLV</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgClv)}</div>
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
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{customer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{customer.phone}</TableCell>
                      <TableCell className="text-right font-medium">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(customer.totalSpend)}</TableCell>
                      <TableCell>
                        <SegmentBadge segment={customer.segment} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(customer.lastOrder)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Lihat detail"
                          onClick={() => setViewCustomer(customer)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
      />
    </div>
  )
}
