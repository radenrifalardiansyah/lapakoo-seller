import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import type {
  Product, ProductStatus, WarehouseLocation, StockMovement,
} from '../types/inventory'
import { productsApi, warehousesApi, inventoryApi, mapApiProduct, mapApiWarehouse, type ApiWarehouse } from '../lib/api'

// ─── Fallback jika API warehouse kosong ───────────────────────────────────────

const DEFAULT_WAREHOUSES: WarehouseLocation[] = [
  {
    id: 'wh-1', code: 'GDG-01', name: 'Gudang Utama',
    address: '', city: 'Jakarta',
    pic: '', phone: '', isPrimary: true, active: true,
  },
]

// ─── Context shape ────────────────────────────────────────────────────────────

interface AdjustInput {
  warehouseId: string
  productId: number
  delta: number
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
  loading: boolean
  error: string | null
  reload: () => void

  totalStockOf: (productId: number) => number
  stockAt: (productId: number, warehouseId: string) => number
  statusOf: (productId: number) => ProductStatus
  distributionOf: (productId: number) => Record<string, number>
  primaryWarehouseId: string | null

  addProduct: (data: Omit<Product, 'id'>, initialStock: number) => Promise<void>
  updateProduct: (id: number, data: Omit<Product, 'id'>) => Promise<void>
  deleteProduct: (id: number) => Promise<void>
  bulkAddProducts: (rows: Array<{ data: Omit<Product, 'id'>; initialStock: number }>) => Promise<void>

  addWarehouse: (data: Omit<WarehouseLocation, 'id'>) => void
  updateWarehouse: (id: string, data: Omit<WarehouseLocation, 'id'>) => void
  deleteWarehouse: (id: string) => void

  adjustStock: (input: AdjustInput) => void
  transferStock: (input: TransferInput) => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function buildDistributionFromApi(
  products: Product[],
  warehouses: WarehouseLocation[],
  apiWarehouses: ApiWarehouse[],
  stockMap: Record<number, number>,
): Record<number, Record<string, number>> {
  const primaryId = warehouses.find(w => w.isPrimary)?.id ?? warehouses[0]?.id ?? 'wh-1'

  const dist: Record<number, Record<string, number>> = {}
  products.forEach(p => {
    const perWh: Record<string, number> = {}
    warehouses.forEach(w => { perWh[w.id] = 0 })
    dist[p.id] = perWh
  })

  // Isi dari stock_distribution di setiap warehouse
  apiWarehouses.forEach(w => {
    (w.stock_distribution ?? []).forEach(sd => {
      const pid = Number(sd.product_id)
      if (dist[pid] && w.id in dist[pid]) {
        dist[pid][w.id] = sd.quantity
      }
    })
  })

  // Fallback: jika belum ada stock_distribution, taruh di primary warehouse
  products.forEach(p => {
    const hasAny = Object.values(dist[p.id]).some(q => q > 0)
    if (!hasAny && stockMap[p.id]) {
      dist[p.id][primaryId] = stockMap[p.id]
    }
  })

  return dist
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>(DEFAULT_WAREHOUSES)
  const [distribution, setDistribution] = useState<Record<number, Record<string, number>>>({})
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const primaryWarehouseId = useMemo(() => {
    const primary = warehouses.find(w => w.isPrimary && w.active)
    if (primary) return primary.id
    return warehouses.find(w => w.active)?.id ?? warehouses[0]?.id ?? null
  }, [warehouses])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [apiProducts, apiWarehouses] = await Promise.all([
        productsApi.list(),
        warehousesApi.list().catch(() => [] as ApiWarehouse[]),
      ])

      const mapped = apiProducts.map(mapApiProduct)
      const mappedWh = apiWarehouses.length > 0
        ? apiWarehouses.map(mapApiWarehouse)
        : DEFAULT_WAREHOUSES

      setWarehouses(mappedWh)

      // Build stock map dari field stock di product
      const stockMap: Record<number, number> = {}
      apiProducts.forEach(p => {
        if (p.stock !== undefined) stockMap[Number(p.id)] = Number(p.stock)
      })

      const dist = buildDistributionFromApi(mapped, mappedWh, apiWarehouses, stockMap)

      setProducts(mapped)
      setDistribution(dist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Selectors ──
  const totalStockOf = useCallback(
    (id: number) => Object.values(distribution[id] ?? {}).reduce((s, n) => s + n, 0),
    [distribution],
  )
  const stockAt = useCallback(
    (id: number, whId: string) => distribution[id]?.[whId] ?? 0,
    [distribution],
  )
  const statusOf = useCallback((id: number): ProductStatus => {
    const s = totalStockOf(id)
    if (s === 0) return 'out_of_stock'
    if (s <= 5) return 'low_stock'
    return 'active'
  }, [totalStockOf])
  const distributionOf = useCallback(
    (id: number) => distribution[id] ?? {},
    [distribution],
  )

  // ── Product CRUD ──
  const addProduct = useCallback(async (data: Omit<Product, 'id'>, initialStock: number) => {
    const created = await productsApi.create({
      name: data.name,
      category: data.category,
      price: data.price,
      image: data.image,
      sku: data.sku,
      weight: data.weight,
      description: data.description,
      stock: initialStock,
    })
    const newProduct = mapApiProduct(created)

    setProducts(prev => [...prev, newProduct])
    setDistribution(d => {
      const perWh: Record<string, number> = {}
      warehouses.forEach(w => { perWh[w.id] = 0 })
      if (primaryWarehouseId) perWh[primaryWarehouseId] = Math.max(0, initialStock)
      return { ...d, [newProduct.id]: perWh }
    })
  }, [warehouses, primaryWarehouseId])

  const updateProduct = useCallback(async (id: number, data: Omit<Product, 'id'>) => {
    const updated = await productsApi.update(id, {
      name: data.name,
      category: data.category,
      price: data.price,
      image: data.image,
      sku: data.sku,
      weight: data.weight,
      description: data.description,
    })
    const mapped = mapApiProduct(updated)
    setProducts(prev => prev.map(p => (p.id === id ? mapped : p)))
  }, [])

  const deleteProduct = useCallback(async (id: number) => {
    await productsApi.remove(id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setDistribution(d => {
      const next = { ...d }
      delete next[id]
      return next
    })
  }, [])

  const bulkAddProducts = useCallback(
    async (rows: Array<{ data: Omit<Product, 'id'>; initialStock: number }>) => {
      const created = await Promise.all(
        rows.map(r => productsApi.create({
          name: r.data.name,
          category: r.data.category,
          price: r.data.price,
          image: r.data.image,
          sku: r.data.sku,
          weight: r.data.weight,
          description: r.data.description,
          stock: r.initialStock,
        })),
      )
      const newProducts = created.map(mapApiProduct)
      setProducts(prev => [...prev, ...newProducts])
      setDistribution(d => {
        const next = { ...d }
        newProducts.forEach((p, idx) => {
          const perWh: Record<string, number> = {}
          warehouses.forEach(w => { perWh[w.id] = 0 })
          if (primaryWarehouseId) perWh[primaryWarehouseId] = Math.max(0, rows[idx].initialStock)
          next[p.id] = perWh
        })
        return next
      })
    },
    [warehouses, primaryWarehouseId],
  )

  // ── Warehouse CRUD (optimistic + sync ke API) ──
  const addWarehouse = useCallback((data: Omit<WarehouseLocation, 'id'>) => {
    const tempId = genId('wh')
    setWarehouses(prev => {
      const cleared = data.isPrimary ? prev.map(w => ({ ...w, isPrimary: false })) : prev
      return [...cleared, { ...data, id: tempId }]
    })
    setDistribution(d => {
      const next: typeof d = {}
      Object.entries(d).forEach(([pid, perWh]) => {
        next[Number(pid)] = { ...perWh, [tempId]: 0 }
      })
      return next
    })

    warehousesApi.create({
      code: data.code,
      name: data.name,
      address: data.address || null,
      city: data.city || null,
      pic: data.pic || null,
      phone: data.phone || null,
      is_primary: data.isPrimary,
    }).then(created => {
      const realId = created.id
      setWarehouses(prev => prev.map(w => w.id === tempId ? mapApiWarehouse(created) : w))
      setDistribution(d => {
        const next: typeof d = {}
        Object.entries(d).forEach(([pid, perWh]) => {
          const { [tempId]: qty, ...rest } = perWh
          next[Number(pid)] = { ...rest, [realId]: qty ?? 0 }
        })
        return next
      })
    }).catch(() => {
      // Rollback jika API gagal
      setWarehouses(prev => prev.filter(w => w.id !== tempId))
      setDistribution(d => {
        const next: typeof d = {}
        Object.entries(d).forEach(([pid, perWh]) => {
          const { [tempId]: _, ...rest } = perWh
          next[Number(pid)] = rest
        })
        return next
      })
    })
  }, [])

  const updateWarehouse = useCallback((id: string, data: Omit<WarehouseLocation, 'id'>) => {
    setWarehouses(prev => prev.map(w => {
      if (w.id === id) return { ...data, id }
      if (data.isPrimary) return { ...w, isPrimary: false }
      return w
    }))
    warehousesApi.update(id, {
      name: data.name,
      address: data.address || null,
      city: data.city || null,
      pic: data.pic || null,
      phone: data.phone || null,
      is_primary: data.isPrimary,
      active: data.active,
    }).catch(() => {})
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
    warehousesApi.remove(id).catch(() => {})
  }, [])

  // ── Movement log ──
  const pushMovement = useCallback((m: Omit<StockMovement, 'id' | 'date'>) => {
    setMovements(prev => [{ ...m, id: genId('mv'), date: new Date().toISOString() }, ...prev])
  }, [])

  // ── Stock operations (local update + API inventory record) ──
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
    inventoryApi.create({
      product_id: productId,
      warehouse_id: warehouseId,
      qty: Math.abs(delta),
      type: delta >= 0 ? 'adjustment_in' : 'adjustment_out',
      reason,
    }).catch(() => {})
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
    loading, error, reload: loadData,
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
