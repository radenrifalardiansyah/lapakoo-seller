// ─── Semua API service functions, dikelompokkan per entity ───────────────────
// Import dari sini, bukan dari api-client.ts langsung.

import { apiGet, apiPost, apiPut, apiDelete } from './api-client';
import type { Product } from '../types/inventory';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Response shapes dari backend
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiProduct {
  id: number | string;
  name: string;
  category?: string;
  category_id?: number | string;
  price: number | string;
  image?: string;
  images?: { id: number; url: string }[];
  sku?: string;
  weight?: number | string;
  description?: string;
  stock?: number | string;
}

export interface ApiCategory {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
}

export interface ApiOrder {
  id: string | number;
  order_number?: string;
  customer?: {
    id?: string | number;
    name: string;
    email?: string;
    phone?: string;
  };
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: ApiOrderItem[];
  order_items?: ApiOrderItem[];
  total?: number | string;
  total_amount?: number | string;
  status: string;
  payment_status?: string;
  shipping_address?: string;
  created_at?: string;
  order_date?: string;
  estimated_delivery?: string;
  tracking_number?: string;
  delivered_at?: string;
  cancel_reason?: string;
  courier?: string;
  return?: ApiReturn;
}

export interface ApiOrderItem {
  id?: number | string;
  name?: string;
  product_name?: string;
  quantity?: number;
  qty?: number;
  price?: number | string;
  unit_price?: number | string;
  subtotal?: number | string;
}

export interface ApiReturn {
  type?: string;
  reason?: string;
  notes?: string;
  request_date?: string;
  status?: string;
}

export interface ApiCustomer {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  segment?: string;
  total_orders?: number | string;
  total_spend?: number | string;
  last_order?: string;
  last_order_date?: string;
  join_date?: string;
  created_at?: string;
  orders?: ApiOrder[];
}

export interface ApiStore {
  id?: number | string;
  name?: string;
  store_name?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  operational_hours?: string;
  logo?: string;
  logo_url?: string;
  theme_color?: string;
  tagline?: string;
  banner_image?: string;
  show_reviews?: boolean;
  show_best_sellers?: boolean;
}

export interface ApiStoreStats {
  revenue?: number | string;
  revenue_this_month?: number | string;
  total_orders?: number | string;
  orders_this_month?: number | string;
  new_customers?: number | string;
  new_customers_this_month?: number | string;
  average_order_value?: number | string;
  sales_chart?: { month: string; sales: number; orders: number }[];
  category_chart?: { name: string; value: number }[];
  recent_orders?: ApiOrder[];
}

export interface ApiReseller {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  tier?: string;
  status?: string;
  join_date?: string;
  created_at?: string;
  total_sales?: number | string;
  total_orders?: number | string;
  pending_commission?: number | string;
  paid_commission?: number | string;
  referral_code?: string;
  notes?: string;
}

export interface ApiVoucher {
  id: string | number;
  code: string;
  name?: string;
  title?: string;
  type?: string;
  discount_type?: string;
  discount_value?: number | string;
  value?: number | string;
  minimum_purchase?: number | string;
  min_purchase?: number | string;
  max_discount?: number | string;
  quota?: number | string;
  used?: number | string;
  used_count?: number | string;
  start_date?: string;
  end_date?: string;
  expired_at?: string;
  status?: string;
  is_active?: boolean;
}

export interface ApiInventoryRecord {
  id?: number | string;
  product_id: number | string;
  product_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  qty?: number;
  previous_stock?: number;
  new_stock?: number;
  type?: string;
  reason?: string;
  reference_type?: string;
  reference_id?: string;
  ref_warehouse_id?: string;
  created_at?: string;
}

export interface ApiNotification {
  id: number | string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

export function mapApiProduct(p: ApiProduct): Product {
  const firstImage = p.images?.[0]?.url ?? p.image ?? '';
  return {
    id: Number(p.id),
    name: p.name,
    category: p.category ?? '',
    price: Number(p.price) || 0,
    image: firstImage,
    sku: p.sku ?? '',
    weight: p.weight ? Number(p.weight) : undefined,
    description: p.description,
  };
}

export const productsApi = {
  list: () => apiGet<ApiProduct[] | { data: ApiProduct[] }>('/api/products').then(normalizeList<ApiProduct>),
  get: (id: number | string) => apiGet<ApiProduct>(`/api/products/${id}`),
  create: (data: Partial<ApiProduct>) => apiPost<ApiProduct>('/api/products', data),
  update: (id: number | string, data: Partial<ApiProduct>) => apiPut<ApiProduct>(`/api/products/${id}`, data),
  remove: (id: number | string) => apiDelete(`/api/products/${id}`),
  addImage: (id: number | string, imageUrl: string) =>
    apiPost(`/api/products/${id}/images`, { url: imageUrl }),
  removeImage: (productId: number | string, imageId: number | string) =>
    apiDelete(`/api/products/${productId}/images/${imageId}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const categoriesApi = {
  list: () => apiGet<ApiCategory[] | { data: ApiCategory[] }>('/api/categories').then(normalizeList<ApiCategory>),
  create: (data: { name: string; description?: string }) => apiPost<ApiCategory>('/api/categories', data),
  update: (id: number | string, data: { name: string; description?: string }) =>
    apiPut<ApiCategory>(`/api/categories/${id}`, data),
  remove: (id: number | string) => apiDelete(`/api/categories/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ordersApi = {
  list: () => apiGet<ApiOrder[] | { data: ApiOrder[] }>('/api/orders').then(normalizeList<ApiOrder>),
  get: (id: string | number) => apiGet<ApiOrder>(`/api/orders/${id}`),
  update: (id: string | number, data: Partial<ApiOrder>) => apiPut<ApiOrder>(`/api/orders/${id}`, data),
  getReturn: (id: string | number) => apiGet<ApiReturn>(`/api/orders/${id}/return`),
  createReturn: (id: string | number, data: Partial<ApiReturn>) =>
    apiPost<ApiReturn>(`/api/orders/${id}/return`, data),
  updateReturn: (id: string | number, data: Partial<ApiReturn>) =>
    apiPut<ApiReturn>(`/api/orders/${id}/return`, data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════

export const customersApi = {
  list: () => apiGet<ApiCustomer[] | { data: ApiCustomer[] }>('/api/customers').then(normalizeList<ApiCustomer>),
  get: (id: number | string) => apiGet<ApiCustomer>(`/api/customers/${id}`),
  create: (data: Partial<ApiCustomer>) => apiPost<ApiCustomer>('/api/customers', data),
  update: (id: number | string, data: Partial<ApiCustomer>) => apiPut<ApiCustomer>(`/api/customers/${id}`, data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const storeApi = {
  get: () => apiGet<ApiStore>('/api/store'),
  update: (data: Partial<ApiStore>) => apiPut<ApiStore>('/api/store', data),
  stats: () => apiGet<ApiStoreStats>('/api/store/stats'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const notificationsApi = {
  list: () => apiGet<ApiNotification[] | { data: ApiNotification[] }>('/api/notifications').then(normalizeList<ApiNotification>),
  markRead: (id: number | string) => apiPut(`/api/notifications/${id}`, { is_read: true }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOUCHERS
// ═══════════════════════════════════════════════════════════════════════════════

export const vouchersApi = {
  list: () => apiGet<ApiVoucher[] | { data: ApiVoucher[] }>('/api/vouchers').then(normalizeList<ApiVoucher>),
  create: (data: Partial<ApiVoucher>) => apiPost<ApiVoucher>('/api/vouchers', data),
  update: (id: string | number, data: Partial<ApiVoucher>) => apiPut<ApiVoucher>(`/api/vouchers/${id}`, data),
  remove: (id: string | number) => apiDelete(`/api/vouchers/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESELLERS
// ═══════════════════════════════════════════════════════════════════════════════

export const resellersApi = {
  list: () => apiGet<ApiReseller[] | { data: ApiReseller[] }>('/api/resellers').then(normalizeList<ApiReseller>),
  get: (id: string | number) => apiGet<ApiReseller>(`/api/resellers/${id}`),
  create: (data: Partial<ApiReseller>) => apiPost<ApiReseller>('/api/resellers', data),
  update: (id: string | number, data: Partial<ApiReseller>) => apiPut<ApiReseller>(`/api/resellers/${id}`, data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════

export const inventoryApi = {
  list: () => apiGet<ApiInventoryRecord[] | { data: ApiInventoryRecord[] }>('/api/inventory').then(normalizeList<ApiInventoryRecord>),
  create: (data: ApiInventoryRecord) => apiPost<ApiInventoryRecord>('/api/inventory', data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTIL
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeList<T>(res: T[] | { data: T[] }): T[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && 'data' in res) return (res as { data: T[] }).data;
  return [];
}
