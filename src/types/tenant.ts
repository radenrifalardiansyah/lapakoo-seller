export type FeatureKey =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'analytics'
  | 'customers'
  | 'resellers'
  | 'marketing'
  | 'payments'
  | 'notifications'
  | 'settings'
  | 'help'
  | 'team';

export interface Package {
  id: string;
  name: string;
  features: FeatureKey[];
  maxProducts: number;
  maxOrders: number; // -1 = unlimited
  maxUsers: number;  // -1 = unlimited
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
  status: 'active' | 'inactive' | 'suspended';
}

export interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: FeatureKey) => boolean;
}
