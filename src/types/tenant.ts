export type FeatureKey =
  | 'dashboard'
  | 'products'
  | 'warehouse'
  | 'orders'
  | 'analytics'
  | 'customers'
  | 'resellers'
  | 'marketing'
  | 'payments'
  | 'notifications'
  | 'settings'
  | 'help'
  | 'team'
  | 'export-data'
  | 'export-pdf'
  | 'customer-history-detail'
  | 'bulk-import'
  | 'stock-transfer'
  | 'bulk-actions'
  | 'advanced-notifications'
  | 'low-stock-alerts'
  | 'two-factor-auth'
  | 'ai-insights';

export type StoreCategoryId =
  | 'elektronik'
  | 'makanan'
  | 'fashion'
  | 'sepatu'
  | 'kosmetik'
  | 'olahraga'
  | 'rumah'
  | 'lainnya';

export interface StoreCategory {
  id: StoreCategoryId;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Package {
  id: string;
  name: string;
  features: FeatureKey[];
  maxProducts: number;
  maxOrders: number;     // -1 = unlimited
  maxUsers: number;      // -1 = unlimited
  maxWarehouses: number; // -1 = unlimited
}

export interface Tenant {
  id: string;
  subdomain: string;
  storeName: string;
  ownerName: string;
  email: string;
  logoUrl?: string;
  primaryColor: string;
  package: Package;
  storeCategory?: StoreCategory;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: FeatureKey) => boolean;
  refreshTenant: (token: string) => Promise<void>;
  resetTenant: () => void;
}
