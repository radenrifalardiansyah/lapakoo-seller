import {
  createContext, useCallback, useContext, useMemo, useState,
  type ReactNode,
} from 'react'
import type {
  Product, ProductStatus, WarehouseLocation, StockMovement,
} from '../types/inventory'

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PRODUCTS: Product[] = [
  {
    id: 1, name: 'iPhone 14 Pro Max', category: 'Electronics', price: 15999000,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
    sku: 'IPH14PM-256-SG', weight: 240,
    description: 'Smartphone flagship Apple dengan chip A16 Bionic, kamera 48MP, layar Super Retina XDR 6.7 inci.',
  },
  {
    id: 2, name: 'Samsung Galaxy S23 Ultra', category: 'Electronics', price: 18999000,
    image: 'https://images.unsplash.com/photo-1610792516307-ea5aabac2b31?w=200&h=200&fit=crop',
    sku: 'SGS23U-512-BK', weight: 234,
    description: 'Flagship Samsung dengan S Pen terintegrasi, kamera 200MP, dan baterai 5000mAh.',
  },
  {
    id: 3, name: 'MacBook Air M2', category: 'Electronics', price: 18999000,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&h=200&fit=crop',
    sku: 'MBA-M2-256-SG', weight: 1240,
    description: 'Laptop tipis Apple dengan chip M2, layar Liquid Retina 13.6 inci, dan ketahanan baterai hingga 18 jam.',
  },
  {
    id: 4, name: 'Nike Air Jordan 1', category: 'Fashion', price: 2499000,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop',
    sku: 'NAJ1-42-RED', weight: 500,
    description: 'Sepatu basket ikonik Nike dengan desain retro klasik.',
  },
  {
    id: 5, name: 'Adidas Ultraboost 22', category: 'Fashion', price: 2899000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    sku: 'AUB22-43-WHT', weight: 350,
    description: 'Sepatu lari premium dengan teknologi Boost untuk kenyamanan maksimal.',
  },
]

const SEED_INITIAL_STOCK: Record<number, number> = { 1: 25, 2: 15, 3: 8, 4: 3, 5: 0 }

const SEED_WAREHOUSES: WarehouseLocation[] = [
  {
    id: 'wh-1', code: 'JKT-01', name: 'Gudang Jakarta Pusat',
    address: 'Jl. Sudirman No. 25, Kel. Karet, Setiabudi',
    city: 'Jakarta Pusat', pic: 'Andi Saputra', phone: '0812-1111-2222',
    isPrimary: true, active: true,
  },
  {
    id: 'wh-2', code: 'SBY-01', name: 'Gudang Surabaya',
    address: 'Jl. Tunjungan No. 80',
    city: 'Surabaya', pic: 'Lina Wijaya', phone: '0813-3333-4444',
    isPrimary: false, active: true,
  },
]

function buildSeedDistribution(): Record<number, Record<string, number>> {
  const dist: Record<number, Record<string, number>> = {}
  const primaryId = SEED_WAREHOUSES.find(w => w.isPrimary)?.id ?? SEED_WAREHOUSES[0].id
  const otherIds = SEED_WAREHOUSES.filter(w => w.id !== primaryId).map(w => w.id)

  SEED_PRODUCTS.forEach(p => {
    const total = SEED_INITIAL_STOCK[p.id] ?? 0
    const perWh: Record<string, number> = {}
    SEED_WAREHOUSES.forEach(w => { perWh[w.id] = 0 })
    const primaryShare = Math.round(total * 0.7)
    perWh[primaryId] = primaryShare
    let remaining = total - primaryShare
    otherIds.forEach((id, idx) => {
      const share = idx === otherIds.length - 1 ? remaining : Math.round(remaining / (otherIds.length - idx))
      perWh[id] = share
      remaining -= share
    })
    dist[p.id] = perWh
  })
  return dist
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface AdjustInput {
  warehouseId: string
  productId: number
  delta: number   // positif = tambah, negatif = kurang
  reason: string
  by?: string
}

interface TransferInput {
  fromId: string
  toId: string
  productId: number
  qty: number
  note?: string
  by?: string
}

interface InventoryContextValue {
  products: Product[]
  warehouses: WarehouseLocation[]
  movements: StockMovement[]
  distribution: Record<number, Record<string, number>>

  // selectors
  totalStockOf: (productId: number) => number
  stockAt: (productId: number, warehouseId: string) => number
  statusOf: (productId: number) => ProductStatus
  distributionOf: (productId: number) => Record<string, number>
  primaryWarehouseId: string | null

  // product CRUD
  addProduct: (data: Omit<Product, 'id'>, initialStock: number) => void
  updateProduct: (id: number, data: Omit<Product, 'id'>) => void
  deleteProduct: (id: number) => void
  bulkAddProducts: (rows: Array<{ data: Omit<Product, 'id'>; initialStock: number }>) => void

  // warehouse CRUD
  addWarehouse: (data: Omit<WarehouseLocation, 'id'>) => void
  updateWarehouse: (id: string, data: Omit<WarehouseLocation, 'id'>) => void
  deleteWarehouse: (id: string) => void

  // stock operations
  adjustStock: (input: AdjustInput) => void
  transferStock: (input: TransferInput) => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS)
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>(SEED_WAREHOUSES)
  const [distribution, setDistribution] = useState<Record<number, Record<string, number>>>(buildSeedDistribution)
  const [movements, setMovements] = useState<StockMovement[]>([])

  const primaryWarehouseId = useMemo(() => {
    const primary = warehouses.find(w => w.isPrimary && w.active)
    if (primary) return primary.id
    const anyActive = warehouses.find(w => w.active)
    return anyActive?.id ?? warehouses[0]?.id ?? null
  }, [warehouses])

  // ── Selectors ──
  const totalStockOf = useCallback(
    (id: number) => Object.values(distribution[id] ?? {}).reduce((s, n) => s + n, 0),
    [distribution]
  )
  const stockAt = useCallback(
    (id: number, whId: string) => distribution[id]?.[whId] ?? 0,
    [distribution]
  )
  const statusOf = useCallback((id: number): ProductStatus => {
    const s = totalStockOf(id)
    if (s === 0) return 'out_of_stock'
    if (s <= 5) return 'low_stock'
    return 'active'
  }, [totalStockOf])
  const distributionOf = useCallback(
    (id: number) => distribution[id] ?? {},
    [distribution]
  )

  // ── Product CRUD ──
  const addProduct = useCallback((data: Omit<Product, 'id'>, initialStock: number) => {
    setProducts(prev => {
      const newId = Math.max(0, ...prev.map(p => p.id)) + 1
      setDistribution(d => {
        const perWh: Record<string, number> = {}
        warehouses.forEach(w => { perWh[w.id] = 0 })
        if (primaryWarehouseId) perWh[primaryWarehouseId] = Math.max(0, initialStock)
        return { ...d, [newId]: perWh }
      })
      return [...prev, { ...data, id: newId }]
    })
  }, [warehouses, primaryWarehouseId])

  const updateProduct = useCallback((id: number, data: Omit<Product, 'id'>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...data, id: p.id } : p)))
  }, [])

  const deleteProduct = useCallback((id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    setDistribution(d => {
      const next = { ...d }
      delete next[id]
      return next
    })
  }, [])

  const bulkAddProducts = useCallback(
    (rows: Array<{ data: Omit<Product, 'id'>; initialStock: number }>) => {
      setProducts(prev => {
        let nextId = Math.max(0, ...prev.map(p => p.id)) + 1
        const items = rows.map(r => ({ ...r.data, id: nextId++ }))
        setDistribution(d => {
          const next = { ...d }
          items.forEach((p, idx) => {
            const perWh: Record<string, number> = {}
            warehouses.forEach(w => { perWh[w.id] = 0 })
            if (primaryWarehouseId) perWh[primaryWarehouseId] = Math.max(0, rows[idx].initialStock)
            next[p.id] = perWh
          })
          return next
        })
        return [...prev, ...items]
      })
    },
    [warehouses, primaryWarehouseId]
  )

  // ── Warehouse CRUD ──
  const addWarehouse = useCallback((data: Omit<WarehouseLocation, 'id'>) => {
    const id = genId('wh')
    setWarehouses(prev => {
      const cleared = data.isPrimary ? prev.map(w => ({ ...w, isPrimary: false })) : prev
      return [...cleared, { ...data, id }]
    })
    setDistribution(d => {
      const next: typeof d = {}
      Object.entries(d).forEach(([pid, perWh]) => {
        next[Number(pid)] = { ...perWh, [id]: 0 }
      })
      return next
    })
  }, [])

  const updateWarehouse = useCallback((id: string, data: Omit<WarehouseLocation, 'id'>) => {
    setWarehouses(prev => prev.map(w => {
      if (w.id === id) return { ...data, id }
      if (data.isPrimary) return { ...w, isPrimary: false }
      return w
    }))
  }, [])

  const deleteWarehouse = useCallback((id: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== id))
    setDistribution(d => {
      const next: typeof d = {}
      Object.entries(d).forEach(([pid, perWh]) => {
        const { [id]: _drop, ...rest } = perWh
        next[Number(pid)] = rest
      })
      return next
    })
  }, [])

  // ── Movement log ──
  const pushMovement = useCallback((m: Omit<StockMovement, 'id' | 'date'>) => {
    setMovements(prev => [{
      ...m, id: genId('mv'), date: new Date().toISOString(),
    }, ...prev])
  }, [])

  // ── Stock operations ──
  const adjustStock = useCallback(({ warehouseId, productId, delta, reason, by = 'Admin' }: AdjustInput) => {
    setDistribution(d => {
      const next = { ...d }
      const cur = next[productId]?.[warehouseId] ?? 0
      next[productId] = { ...(next[productId] ?? {}), [warehouseId]: Math.max(0, cur + delta) }
      return next
    })
    const product = products.find(p => p.id === productId)
    const wh = warehouses.find(w => w.id === warehouseId)
    pushMovement({
      type: delta >= 0 ? 'adjustment_in' : 'adjustment_out',
      productId, productName: product?.name ?? '—',
      warehouseId, warehouseName: wh?.name ?? '—',
      qty: Math.abs(delta), reason, by,
    })
  }, [products, warehouses, pushMovement])

  const transferStock = useCallback(({ fromId, toId, productId, qty, note = '', by = 'Admin' }: TransferInput) => {
    setDistribution(d => {
      const next = { ...d }
      const perWh = { ...(next[productId] ?? {}) }
      perWh[fromId] = Math.max(0, (perWh[fromId] ?? 0) - qty)
      perWh[toId] = (perWh[toId] ?? 0) + qty
      next[productId] = perWh
      return next
    })
    const product = products.find(p => p.id === productId)
    const from = warehouses.find(w => w.id === fromId)
    const to = warehouses.find(w => w.id === toId)
    const reason = note || `Transfer ${from?.code ?? ''} → ${to?.code ?? ''}`.trim()
    pushMovement({
      type: 'transfer_out',
      productId, productName: product?.name ?? '—',
      warehouseId: fromId, warehouseName: from?.name ?? '—',
      refWarehouseId: toId, refWarehouseName: to?.name,
      qty, reason, by,
    })
    pushMovement({
      type: 'transfer_in',
      productId, productName: product?.name ?? '—',
      warehouseId: toId, warehouseName: to?.name ?? '—',
      refWarehouseId: fromId, refWarehouseName: from?.name,
      qty, reason, by,
    })
  }, [products, warehouses, pushMovement])

  const value: InventoryContextValue = {
    products, warehouses, movements, distribution,
    totalStockOf, stockAt, statusOf, distributionOf, primaryWarehouseId,
    addProduct, updateProduct, deleteProduct, bulkAddProducts,
    addWarehouse, updateWarehouse, deleteWarehouse,
    adjustStock, transferStock,
  }

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>')
  return ctx
}
