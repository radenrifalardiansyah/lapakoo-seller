import { useState, useRef, useEffect } from 'react'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "./ui/pagination"
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Separator } from "./ui/separator"
import {
  Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle,
  FileSpreadsheet, X, Check, Camera, Upload, Tags, FolderOpen,
  ChevronDown
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: string
  image: string
  sku: string
  weight?: number
  description?: string
}

export const initialProducts: Product[] = [
  {
    id: 1,
    name: 'iPhone 14 Pro Max',
    category: 'Electronics',
    price: 15999000,
    stock: 25,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    sku: 'IPH14PM-256-SG',
    weight: 240,
    description: 'Smartphone flagship Apple dengan chip A16 Bionic, kamera 48MP, layar Super Retina XDR 6.7 inci.',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S23 Ultra',
    category: 'Electronics',
    price: 18999000,
    stock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1610792516307-ea5aabac2b31?w=200&h=200&fit=crop',
    sku: 'SGS23U-512-BK',
    weight: 234,
    description: 'Flagship Samsung dengan S Pen terintegrasi, kamera 200MP, dan baterai 5000mAh.',
  },
  {
    id: 3,
    name: 'MacBook Air M2',
    category: 'Electronics',
    price: 18999000,
    stock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&h=200&fit=crop',
    sku: 'MBA-M2-256-SG',
    weight: 1240,
    description: 'Laptop tipis Apple dengan chip M2, layar Liquid Retina 13.6 inci, dan ketahanan baterai hingga 18 jam.',
  },
  {
    id: 4,
    name: 'Nike Air Jordan 1',
    category: 'Fashion',
    price: 2499000,
    stock: 3,
    status: 'low_stock',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop',
    sku: 'NAJ1-42-RED',
    weight: 500,
    description: 'Sepatu basket ikonik Nike dengan desain retro klasik.',
  },
  {
    id: 5,
    name: 'Adidas Ultraboost 22',
    category: 'Fashion',
    price: 2899000,
    stock: 0,
    status: 'out_of_stock',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    sku: 'AUB22-43-WHT',
    weight: 350,
    description: 'Sepatu lari premium dengan teknologi Boost untuk kenyamanan maksimal.',
  },
]

const DEFAULT_CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Other']

const emptyForm: Omit<Product, 'id'> = {
  name: '',
  category: '',
  price: 0,
  stock: 0,
  status: 'active',
  image: '',
  sku: '',
  weight: 0,
  description: '',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

function deriveStatus(stock: number): string {
  if (stock === 0) return 'out_of_stock'
  if (stock <= 5) return 'low_stock'
  return 'active'
}

function StatusBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Habis
      </Badge>
    )
  if (stock <= 5)
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
        <AlertTriangle className="w-3 h-3" />
        Stok Rendah
      </Badge>
    )
  return <Badge variant="secondary">Aktif</Badge>
}

// ─── Category Management Dialog ──────────────────────────────────────────────
function CategoryManagementDialog({
  open,
  onClose,
  categories,
  onCategoriesChange,
  products,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  onCategoriesChange: (cats: string[]) => void
  products: Product[]
}) {
  const [newCat, setNewCat] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  const productCount = (cat: string) => products.filter(p => p.category === cat).length

  const handleAdd = () => {
    const trimmed = newCat.trim()
    if (!trimmed || categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) return
    onCategoriesChange([...categories, trimmed])
    setNewCat('')
  }

  const handleEditSave = (idx: number) => {
    const trimmed = editVal.trim()
    if (!trimmed) return
    const isDuplicate = categories.some((c, i) => i !== idx && c.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) return
    const updated = [...categories]
    updated[idx] = trimmed
    onCategoriesChange(updated)
    setEditIdx(null)
    setEditVal('')
  }

  const handleDelete = (idx: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== idx))
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { setEditIdx(null); setNewCat(''); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Pengaturan Kategori Produk
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-1.5">
            <Label>Tambah Kategori Baru</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nama kategori baru..."
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={!newCat.trim() || categories.map(c => c.toLowerCase()).includes(newCat.trim().toLowerCase())}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {newCat.trim() && categories.map(c => c.toLowerCase()).includes(newCat.trim().toLowerCase()) && (
              <p className="text-xs text-red-500">Kategori sudah ada</p>
            )}
          </div>

          <Separator />

          {/* Category list */}
          <div className="space-y-1.5">
            <Label>Daftar Kategori ({categories.length})</Label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categories.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Belum ada kategori
                </div>
              )}
              {categories.map((cat, idx) => {
                const count = productCount(cat)
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/30">
                    {editIdx === idx ? (
                      <>
                        <Input
                          className="h-7 flex-1 text-sm"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditSave(idx)
                            if (e.key === 'Escape') { setEditIdx(null); setEditVal('') }
                          }}
                          autoFocus
                        />
                        <Button size="sm" className="h-7 px-2" onClick={() => handleEditSave(idx)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditIdx(null); setEditVal('') }}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm font-medium">{cat}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {count} produk
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 shrink-0"
                          onClick={() => { setEditIdx(idx); setEditVal(cat) }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(idx)}
                          disabled={count > 0}
                          title={count > 0 ? `Tidak bisa dihapus: ${count} produk menggunakan kategori ini` : 'Hapus kategori'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Kategori yang digunakan oleh produk tidak dapat dihapus. Edit nama kategori akan memperbarui semua produk terkait.
          </p>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => { setEditIdx(null); setNewCat(''); onClose() }}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Import Dialog ────────────────────────────────────────────────────────────
interface ImportRow {
  'Nama Produk': string
  'SKU': string
  'Kategori': string
  'Harga (Rp)': number | string
  'Stok': number | string
  'Berat (gram)': number | string
  'Deskripsi': string
  [key: string]: unknown
}

interface ImportError {
  row: number
  messages: string[]
}

function ImportDialog({
  open,
  onClose,
  onImport,
  categories,
}: {
  open: boolean
  onClose: () => void
  onImport: (products: Omit<Product, 'id'>[]) => void
  categories: string[]
}) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [errors, setErrors] = useState<ImportError[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setRows([])
    setErrors([])
  }

  const validateRows = (parsed: ImportRow[]): ImportError[] => {
    return parsed.reduce<ImportError[]>((acc, row, i) => {
      const rowNum = i + 2
      const msgs: string[] = []
      if (!String(row['Nama Produk'] ?? '').trim()) msgs.push('Nama Produk wajib diisi')
      if (!String(row['SKU'] ?? '').trim()) msgs.push('SKU wajib diisi')
      if (!String(row['Kategori'] ?? '').trim()) msgs.push('Kategori wajib diisi')
      if (row['Harga (Rp)'] === '' || isNaN(Number(row['Harga (Rp)']))) msgs.push('Harga harus berupa angka')
      if (msgs.length > 0) acc.push({ row: rowNum, messages: msgs })
      return acc
    }, [])
  }

  const parseFile = (f: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const parsed = XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: '' })
        setRows(parsed)
        setErrors(validateRows(parsed))
      } catch {
        setRows([])
        setErrors([{ row: 0, messages: ['File tidak dapat dibaca. Pastikan format file benar.'] }])
      }
    }
    reader.readAsBinaryString(f)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); parseFile(f) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); parseFile(f) }
  }

  const handleDownloadTemplate = () => {
    const template: ImportRow[] = [
      {
        'Nama Produk': 'Contoh Produk A',
        'SKU': 'SKU-001',
        'Kategori': categories[0] || 'Electronics',
        'Harga (Rp)': 150000,
        'Stok': 20,
        'Berat (gram)': 300,
        'Deskripsi': 'Deskripsi produk contoh',
      },
      {
        'Nama Produk': 'Contoh Produk B',
        'SKU': 'SKU-002',
        'Kategori': categories[1] || 'Fashion',
        'Harga (Rp)': 250000,
        'Stok': 5,
        'Berat (gram)': 500,
        'Deskripsi': 'Deskripsi produk kedua',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 35 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk')
    XLSX.writeFile(wb, 'template-import-produk.xlsx')
  }

  const errorRowNumbers = new Set(errors.map(e => e.row))
  const validCount = rows.filter((_, i) => !errorRowNumbers.has(i + 2)).length

  const handleImport = () => {
    const valid = rows
      .filter((_, i) => !errorRowNumbers.has(i + 2))
      .map(row => ({
        name: String(row['Nama Produk']).trim(),
        sku: String(row['SKU']).trim(),
        category: String(row['Kategori']).trim(),
        price: Number(row['Harga (Rp)']) || 0,
        stock: Number(row['Stok']) || 0,
        weight: Number(row['Berat (gram)']) || 0,
        description: String(row['Deskripsi'] || ''),
        image: '',
        status: deriveStatus(Number(row['Stok']) || 0),
      }))
    onImport(valid)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Produk Massal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Template info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-800">Download template terlebih dahulu</p>
              <p className="text-xs text-blue-600 mt-0.5">Gunakan format kolom yang benar agar import berhasil</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="border-blue-300 text-blue-700 hover:bg-blue-50 shrink-0">
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Template Excel
            </Button>
          </div>

          {/* Required columns info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { col: 'Nama Produk', req: true },
              { col: 'SKU', req: true },
              { col: 'Kategori', req: true },
              { col: 'Harga (Rp)', req: true },
              { col: 'Stok', req: false },
              { col: 'Berat (gram)', req: false },
              { col: 'Deskripsi', req: false },
            ].map(item => (
              <div key={item.col} className="flex items-center gap-1.5 text-muted-foreground">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.req ? 'bg-red-500' : 'bg-muted-foreground/40'}`} />
                <span>{item.col}</span>
                {item.req && <span className="text-red-500">*</span>}
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{rows.length} baris data ditemukan</p>
                <button
                  type="button"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                  onClick={e => { e.stopPropagation(); reset(); fileInputRef.current?.click() }}
                >
                  Ganti file
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">Drag & drop file di sini</p>
                <p className="text-sm text-muted-foreground mt-1">atau klik untuk memilih file</p>
                <p className="text-xs text-muted-foreground mt-2 bg-muted/50 inline-block px-3 py-1 rounded-full">
                  Mendukung: .xlsx, .xls, .csv
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {errorRowNumbers.size} baris memiliki kesalahan
              </p>
              <ul className="text-xs text-red-600 space-y-1 max-h-28 overflow-y-auto">
                {errors.map((e) => (
                  <li key={e.row}>
                    <span className="font-medium">Baris {e.row}:</span> {e.messages.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Preview data
                </p>
                <p className="text-xs text-muted-foreground">
                  Menampilkan {Math.min(rows.length, 5)} dari {rows.length} baris
                </p>
              </div>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-6">#</TableHead>
                      <TableHead className="text-xs">Nama Produk</TableHead>
                      <TableHead className="text-xs">SKU</TableHead>
                      <TableHead className="text-xs">Kategori</TableHead>
                      <TableHead className="text-xs text-right">Harga</TableHead>
                      <TableHead className="text-xs text-right">Stok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => {
                      const hasError = errorRowNumbers.has(i + 2)
                      return (
                        <TableRow key={i} className={hasError ? 'bg-red-50' : ''}>
                          <TableCell className="text-xs text-muted-foreground">
                            {hasError && <AlertTriangle className="w-3 h-3 text-red-500" />}
                            {!hasError && <Check className="w-3 h-3 text-green-500" />}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{String(row['Nama Produk'] || '-')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{String(row['SKU'] || '-')}</TableCell>
                          <TableCell className="text-xs">{String(row['Kategori'] || '-')}</TableCell>
                          <TableCell className="text-xs text-right">
                            {Number(row['Harga (Rp)'] || 0).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-xs text-right">{String(row['Stok'] || '0')}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 5 && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  ... dan {rows.length - 5} baris lainnya
                </p>
              )}
            </div>
          )}

          {/* Summary & actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {rows.length > 0 && (
                <span>
                  <span className="text-green-600 font-medium">{validCount} produk valid</span>
                  {errorRowNumbers.size > 0 && (
                    <span className="text-red-500 ml-2">· {errorRowNumbers.size} baris gagal</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { reset(); onClose() }}>
                Batal
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import {validCount > 0 ? `${validCount} Produk` : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Dialog ─────────────────────────────────────────────────────────────
function ViewProductDialog({
  product,
  open,
  onClose,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
}) {
  if (!product) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Produk</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-24 h-24 rounded-xl object-cover border"
            />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg leading-tight">{product.name}</p>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              <StatusBadge stock={product.stock} />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Kategori</p>
              <p className="font-medium">{product.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Harga</p>
              <p className="font-medium">{formatPrice(product.price)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stok</p>
              <p className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-orange-600' : ''}`}>
                {product.stock} unit
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Berat</p>
              <p className="font-medium">{product.weight ?? '-'} gram</p>
            </div>
          </div>
          {product.description && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Deskripsi</p>
                <p>{product.description}</p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
function ProductFormDialog({
  mode,
  initialData,
  open,
  onClose,
  onSave,
  categories,
}: {
  mode: 'add' | 'edit'
  initialData: Omit<Product, 'id'>
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Product, 'id'>) => void
  categories: string[]
}) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(initialData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rawNums, setRawNums] = useState({
    price: initialData.price > 0 ? String(initialData.price) : '',
    stock: initialData.stock > 0 ? String(initialData.stock) : '',
    weight: initialData.weight > 0 ? String(initialData.weight) : '',
  })

  useEffect(() => {
    if (open) {
      setRawNums({
        price: initialData.price > 0 ? String(initialData.price) : '',
        stock: initialData.stock > 0 ? String(initialData.stock) : '',
        weight: initialData.weight > 0 ? String(initialData.weight) : '',
      })
    }
  }, [open, initialData])

  const set = (field: keyof Omit<Product, 'id'>, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const setRaw = (field: 'price' | 'stock' | 'weight', val: string) => {
    const digits = val.replace(/\D/g, '')
    setRawNums(prev => ({ ...prev, [field]: digits }))
    set(field, digits === '' ? 0 : Number(digits))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => set('image', reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim() || !form.category) return
    onSave({ ...form, status: deriveStatus(Number(form.stock)) })
    onClose()
  }

  const handleOpenChange = (o: boolean) => {
    if (o) setForm(initialData)
    else onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Image */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center overflow-hidden">
                {form.image ? (
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Foto Produk</p>
              <p className="text-xs text-muted-foreground">Klik ikon kamera untuk upload. JPG/PNG, maks 2MB.</p>
              {form.image && (
                <button
                  type="button"
                  onClick={() => set('image', '')}
                  className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Hapus foto
                </button>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nama Produk <span className="text-red-500">*</span></Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Masukkan nama produk"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sku">SKU <span className="text-red-500">*</span></Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                placeholder="Kode produk unik"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Harga (Rp)</Label>
              <Input
                id="p-price"
                type="text"
                inputMode="numeric"
                value={rawNums.price}
                onChange={e => setRaw('price', e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stok</Label>
              <Input
                id="p-stock"
                type="text"
                inputMode="numeric"
                value={rawNums.stock}
                onChange={e => setRaw('stock', e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-weight">Berat (gram)</Label>
              <Input
                id="p-weight"
                type="text"
                inputMode="numeric"
                value={rawNums.weight}
                onChange={e => setRaw('weight', e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Deskripsi</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Deskripsi produk..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1.5" />Batal
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.sku.trim() || !form.category}>
              <Check className="w-4 h-4 mr-1.5" />
              {mode === 'add' ? 'Simpan Produk' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState('')

  // dialog state
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isShowAll = pageSize === 0
  const effectiveSize = isShowAll ? filtered.length : pageSize
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectiveSize))
  const page = Math.min(currentPage, totalPages)
  const paged = isShowAll ? filtered : filtered.slice((page - 1) * effectiveSize, page * effectiveSize)
  const startItem = filtered.length === 0 ? 0 : isShowAll ? 1 : (page - 1) * effectiveSize + 1
  const endItem = isShowAll ? filtered.length : Math.min(page * effectiveSize, filtered.length)

  // ── CRUD ──
  const handleAdd = (data: Omit<Product, 'id'>) => {
    const newId = Math.max(0, ...products.map(p => p.id)) + 1
    setProducts(prev => [...prev, { id: newId, ...data }])
  }

  const handleBulkImport = (rows: Omit<Product, 'id'>[]) => {
    let nextId = Math.max(0, ...products.map(p => p.id)) + 1
    const newProducts = rows.map(r => ({ id: nextId++, ...r }))
    setProducts(prev => [...prev, ...newProducts])
  }

  const handleEdit = (data: Omit<Product, 'id'>) => {
    if (!editProduct) return
    setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data } : p))
  }

  const handleDelete = () => {
    if (!deleteProduct) return
    setProducts(prev => prev.filter(p => p.id !== deleteProduct.id))
    setDeleteProduct(null)
  }

  // ── Category rename propagation ──
  const handleCategoriesChange = (newCats: string[]) => {
    const oldNames = categories
    // if a category was renamed, update all products using it
    oldNames.forEach((oldName, idx) => {
      const newName = newCats[idx]
      if (newName && newName !== oldName) {
        setProducts(prev => prev.map(p =>
          p.category === oldName ? { ...p, category: newName } : p
        ))
      }
    })
    setCategories(newCats)
  }

  // ── Export Excel ──
  const handleExport = () => {
    const rows = filtered.map(p => ({
      'ID': p.id,
      'Nama Produk': p.name,
      'SKU': p.sku,
      'Kategori': p.category,
      'Harga (Rp)': p.price,
      'Stok': p.stock,
      'Berat (gram)': p.weight ?? '',
      'Status': p.stock === 0 ? 'Habis' : p.stock <= 5 ? 'Stok Rendah' : 'Aktif',
      'Deskripsi': p.description ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 8 }, { wch: 13 }, { wch: 12 }, { wch: 40 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produk')
    XLSX.writeFile(wb, `produk-toko-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground">Kelola semua produk yang Anda jual di toko online Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Massal
          </Button>
          <Button variant="outline" onClick={() => setIsCategoryOpen(true)} className="flex items-center gap-2">
            <Tags className="w-4 h-4" />
            Kategori
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">produk terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.stock > 5).length}</div>
            <p className="text-xs text-muted-foreground">dengan stok cukup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.stock <= 5 && p.stock > 0).length}</div>
            <p className="text-xs text-muted-foreground">perlu restock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habis Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.stock === 0).length}</div>
            <p className="text-xs text-muted-foreground">segera restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama produk atau SKU..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada produk yang ditemukan</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={
                          product.stock === 0 ? 'text-red-600 font-medium' :
                          product.stock <= 5 ? 'text-orange-600 font-medium' : ''
                        }>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge stock={product.stock} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Lihat detail"
                            onClick={() => setViewProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit produk"
                            onClick={() => setEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hapus produk"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteProduct(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                    Menampilkan {startItem}–{endItem} dari {filtered.length} produk
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Tampilkan</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1) }}
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

      {/* Dialogs */}
      <ViewProductDialog
        product={viewProduct}
        open={!!viewProduct}
        onClose={() => setViewProduct(null)}
      />

      <ProductFormDialog
        key={isAddOpen ? 'add-open' : 'add-closed'}
        mode="add"
        initialData={emptyForm}
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
        categories={categories}
      />

      {editProduct && (
        <ProductFormDialog
          key={`edit-${editProduct.id}`}
          mode="edit"
          initialData={{
            name: editProduct.name,
            category: editProduct.category,
            price: editProduct.price,
            stock: editProduct.stock,
            status: editProduct.status,
            image: editProduct.image,
            sku: editProduct.sku,
            weight: editProduct.weight ?? 0,
            description: editProduct.description ?? '',
          }}
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          onSave={handleEdit}
          categories={categories}
        />
      )}

      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        categories={categories}
      />

      <CategoryManagementDialog
        open={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={categories}
        onCategoriesChange={handleCategoriesChange}
        products={products}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={open => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteProduct?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
