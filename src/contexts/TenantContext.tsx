import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Tenant, TenantContextValue, FeatureKey, Package } from '../types/tenant';
import { apiGet } from '../lib/api-client';
import type { ApiStore } from '../lib/api';
import { loadStoreCache } from '../lib/auth-api';

// ─── Package definitions ──────────────────────────────────────────────────────

const PACKAGES: Record<string, Package> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    features: ['dashboard', 'products', 'warehouse', 'orders', 'payments', 'notifications', 'settings', 'help'],
    maxProducts: 50,
    maxOrders: 100,
    maxUsers: 1,
    maxWarehouses: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    features: [
      'dashboard', 'products', 'warehouse', 'orders', 'analytics',
      'customers', 'marketing', 'payments',
      'notifications', 'settings', 'help', 'team',
      'export-data', 'bulk-import', 'stock-transfer', 'bulk-actions',
      'advanced-notifications', 'low-stock-alerts', 'two-factor-auth',
    ],
    maxProducts: 500,
    maxOrders: -1,
    maxUsers: 5,
    maxWarehouses: 5,
  },
  business: {
    id: 'business',
    name: 'Business',
    features: [
      'dashboard', 'products', 'warehouse', 'orders', 'analytics',
      'customers', 'resellers', 'marketing', 'payments',
      'notifications', 'settings', 'help', 'team',
      'export-data', 'export-pdf', 'customer-history-detail',
      'bulk-import', 'stock-transfer', 'bulk-actions',
      'advanced-notifications', 'low-stock-alerts', 'two-factor-auth',
      'ai-insights',
    ],
    maxProducts: -1,
    maxOrders: -1,
    maxUsers: -1,
    maxWarehouses: -1,
  },
};

// ─── Default tenant (sebelum login / fallback) ────────────────────────────────

const DEFAULT_TENANT: Tenant = {
  id: '0',
  subdomain: '',
  storeName: 'Lapakoo Seller',
  ownerName: '',
  email: '',
  primaryColor: '#6366f1',
  package: PACKAGES.business,
  status: 'active',
};

// ─── API response → Tenant mapper ─────────────────────────────────────────────

interface ApiStoreWithPlan extends ApiStore {
  plan?: string;
  package?: string;
  subdomain?: string;
  owner_name?: string;
  primary_color?: string;
}

function mapStoreToTenant(store: ApiStoreWithPlan): Tenant {
  const planKey = ((store.plan ?? store.package) || 'business').toLowerCase();
  const pkg = PACKAGES[planKey] ?? PACKAGES.business;
  return {
    id: String(store.id ?? '0'),
    subdomain: store.subdomain ?? '',
    storeName: store.store_name ?? store.name ?? DEFAULT_TENANT.storeName,
    ownerName: store.owner_name ?? '',
    email: store.email ?? '',
    logoUrl: store.logo_url ?? store.logo,
    primaryColor: store.primary_color ?? store.theme_color ?? DEFAULT_TENANT.primaryColor,
    package: pkg,
    status: 'active',
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: false,
  error: null,
  hasFeature: () => false,
  refreshTenant: async () => {},
  resetTenant: () => {},
});

interface ResolveTenantResponse {
  id: string | number;
  subdomain: string;
  store_name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  status: string;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(DEFAULT_TENANT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Baca ?tenant= atau ?subdomain= dari URL dan pre-load data toko sebelum login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('tenant') ?? params.get('subdomain');
    if (!slug) return;

    setLoading(true);
    apiGet<ResolveTenantResponse>(`/api/tenants/resolve?tenant=${encodeURIComponent(slug)}`, { skipAuth: true })
      .then((data) => {
        setTenant({
          ...DEFAULT_TENANT,
          id: String(data.id),
          subdomain: data.subdomain,
          storeName: data.store_name,
          logoUrl: data.logo_url ?? undefined,
          primaryColor: data.primary_color ?? DEFAULT_TENANT.primaryColor,
          status: data.status as Tenant['status'],
        });
      })
      .catch(() => {
        // URL tenant tidak ditemukan — biarkan DEFAULT_TENANT
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshTenant = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const store = await apiGet<ApiStoreWithPlan>('/api/store', {
        headers: { Authorization: `Bearer ${token}` },
        skipAuth: true,
      });
      setTenant(mapStoreToTenant(store));
    } catch {
      // /api/store gagal — gunakan data dari cache login (profile.tenants)
      const cached = loadStoreCache();
      if (cached) {
        setTenant({
          ...DEFAULT_TENANT,
          id: cached.id,
          subdomain: cached.subdomain,
          storeName: cached.storeName,
          logoUrl: cached.logoUrl,
          primaryColor: cached.primaryColor ?? DEFAULT_TENANT.primaryColor,
        });
      } else {
        setTenant(DEFAULT_TENANT);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const resetTenant = useCallback(() => {
    setTenant(DEFAULT_TENANT);
    setError(null);
  }, []);

  const hasFeature = useCallback(
    (feature: FeatureKey) => tenant?.package.features.includes(feature) ?? false,
    [tenant],
  );

  return (
    <TenantContext.Provider value={{ tenant, loading, error, hasFeature, refreshTenant, resetTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
