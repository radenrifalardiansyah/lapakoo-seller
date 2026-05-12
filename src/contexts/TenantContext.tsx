import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Tenant, TenantContextValue, FeatureKey, Package } from '../types/tenant';

// ─── Package definitions ──────────────────────────────────────────────────────

const PACKAGES: Record<string, Package> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    features: ['dashboard', 'products', 'orders', 'notifications', 'settings', 'help'],
    maxProducts: 50,
    maxOrders: 100,
    maxUsers: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    features: [
      'dashboard', 'products', 'orders', 'analytics',
      'customers', 'marketing', 'payments',
      'notifications', 'settings', 'help', 'team',
    ],
    maxProducts: 500,
    maxOrders: -1,
    maxUsers: 5,
  },
  business: {
    id: 'business',
    name: 'Business',
    features: [
      'dashboard', 'products', 'orders', 'analytics',
      'customers', 'resellers', 'marketing', 'payments',
      'notifications', 'settings', 'help', 'team',
    ],
    maxProducts: -1,
    maxOrders: -1,
    maxUsers: -1,
  },
};

// ─── Mock tenant database ─────────────────────────────────────────────────────
// In production: ganti dengan API call ke backend -> GET /api/tenants?subdomain=xxx

const MOCK_TENANTS: Record<string, Tenant> = {
  demo: {
    id: '1',
    subdomain: 'demo',
    storeName: 'Toko Demo',
    ownerName: 'Admin Demo',
    email: 'demo@seller.id',
    primaryColor: '#6366f1',
    package: PACKAGES.starter,
    status: 'active',
  },
  tokobudi: {
    id: '2',
    subdomain: 'tokobudi',
    storeName: 'Toko Budi Jaya',
    ownerName: 'Budi Santoso',
    email: 'budi@tokobudi.seller.id',
    primaryColor: '#0ea5e9',
    package: PACKAGES.pro,
    status: 'active',
  },
  abcstore: {
    id: '3',
    subdomain: 'abcstore',
    storeName: 'ABC Store Official',
    ownerName: 'Ahmad Rizki',
    email: 'admin@abcstore.seller.id',
    primaryColor: '#10b981',
    package: PACKAGES.business,
    status: 'active',
  },
  // Default fallback — dipakai saat akses langsung (localhost, Vercel root, dll.)
  __default__: {
    id: '0',
    subdomain: '__default__',
    storeName: 'Eleven Seller',
    ownerName: 'Admin',
    email: 'admin@eleven-seller.vercel.app',
    primaryColor: '#6366f1',
    package: PACKAGES.business,
    status: 'active',
  },
};

// ─── Subdomain extractor ──────────────────────────────────────────────────────

// Platform hosting dengan 2-level suffix (project.platform.tld).
// Pada domain ini, "project" adalah nama project, bukan subdomain tenant.
// Subdomain tenant baru ada jika ada 4+ part: tenant.project.platform.tld
const TWO_LEVEL_SUFFIXES = ['vercel.app', 'netlify.app', 'pages.dev', 'web.app'];

function getSubdomain(): string | null {
  const host = window.location.hostname.split(':')[0]; // strip port
  const parts = host.split('.');

  // localhost / localhost dengan subdomain → e.g. tokobudi.localhost
  if (parts[parts.length - 1] === 'localhost') {
    return parts.length > 1 ? parts[0] : null;
  }

  // IP address — no subdomain
  if (/^\d+$/.test(parts[parts.length - 1])) return null;

  // Platform dengan 2-level suffix (vercel.app, netlify.app, dll.)
  // eleven-seller.vercel.app (3 parts) → null (ini project root, bukan tenant)
  // demo.eleven-seller.vercel.app (4 parts) → "demo" (ini subdomain tenant)
  const twoLevelSuffix = TWO_LEVEL_SUFFIXES.find(s => host.endsWith('.' + s) || host === s);
  if (twoLevelSuffix) {
    const suffixParts = twoLevelSuffix.split('.').length; // 2
    return parts.length > suffixParts + 1 ? parts[0] : null;
  }

  // domain.tld (no subdomain)
  if (parts.length <= 2) return null;

  // subdomain.domain.tld
  return parts[0];
}

// Prioritas tenant: ?tenant=xxx query param (untuk demo/preview)
function getTenantKey(): string | null {
  const params = new URLSearchParams(window.location.search);
  const qTenant = params.get('tenant');
  if (qTenant) return qTenant;
  return getSubdomain();
}

// ─── Simulated API fetch ──────────────────────────────────────────────────────

async function fetchTenantBySubdomain(subdomain: string | null): Promise<Tenant> {
  // Simulasi network delay
  await new Promise(r => setTimeout(r, 400));

  if (!subdomain) return MOCK_TENANTS.__default__;

  const tenant = MOCK_TENANTS[subdomain];
  if (!tenant) throw new Error(`Toko dengan subdomain "${subdomain}" tidak ditemukan.`);
  if (tenant.status !== 'active') throw new Error('Toko ini sedang tidak aktif.');

  return tenant;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
  hasFeature: () => false,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subdomain = getTenantKey();
    fetchTenantBySubdomain(subdomain)
      .then(data => setTenant(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hasFeature = (feature: FeatureKey) =>
    tenant?.package.features.includes(feature) ?? false;

  return (
    <TenantContext.Provider value={{ tenant, loading, error, hasFeature }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
