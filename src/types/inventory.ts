export interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  sku: string
  weight?: number
  description?: string
}

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock'

export interface WarehouseLocation {
  id: string
  code: string
  name: string
  address: string
  city: string
  pic: string
  phone: string
  isPrimary: boolean
  active: boolean
}

export type MovementType =
  | 'adjustment_in'
  | 'adjustment_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'sale'
  | 'restock'

export interface StockMovement {
  id: string
  date: string // ISO
  type: MovementType
  productId: number
  productName: string
  warehouseId: string
  warehouseName: string
  qty: number // selalu positif
  refWarehouseId?: string
  refWarehouseName?: string
  reason: string
  by: string
}
