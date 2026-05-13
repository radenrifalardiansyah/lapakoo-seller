import type { AuthUser, Permission, UserRole } from '../types/auth';

// ─── Role → permission matrix ─────────────────────────────────────────────────
// Owner: everything.
// Admin: full operasional, kecuali Tim & Pengaturan (edit) & Keuangan (edit).
// Staff: operasional pesanan — view+edit Pesanan, view-only sisanya.

const OWNER_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'products:view', 'products:edit',
  'orders:view', 'orders:edit',
  'warehouse:view', 'warehouse:edit',
  'analytics:view',
  'ai-insights:view',
  'customers:view', 'customers:edit',
  'resellers:view', 'resellers:edit',
  'marketing:view', 'marketing:edit',
  'payments:view', 'payments:edit',
  'team:view', 'team:edit',
  'settings:view', 'settings:edit',
  'notifications:view',
  'help:view',
];

const ADMIN_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'products:view', 'products:edit',
  'orders:view', 'orders:edit',
  'warehouse:view', 'warehouse:edit',
  'analytics:view',
  'ai-insights:view',
  'customers:view', 'customers:edit',
  'resellers:view', 'resellers:edit',
  'marketing:view', 'marketing:edit',
  'payments:view',
  'team:view',
  'settings:view',
  'notifications:view',
  'help:view',
];

const STAFF_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'products:view',
  'orders:view', 'orders:edit',
  'warehouse:view',
  'customers:view',
  'notifications:view',
  'help:view',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: OWNER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  staff: STAFF_PERMISSIONS,
};

// ─── Tab → minimum permission required ────────────────────────────────────────
// Used by sidebar / bottom-nav / render guard.

export const TAB_PERMISSIONS: Record<string, Permission> = {
  dashboard:     'dashboard:view',
  products:      'products:view',
  warehouse:     'warehouse:view',
  orders:        'orders:view',
  analytics:     'analytics:view',
  'ai-insights': 'ai-insights:view',
  customers:     'customers:view',
  resellers:     'resellers:view',
  marketing:     'marketing:view',
  payments:      'payments:view',
  team:          'team:view',
  notifications: 'notifications:view',
  settings:      'settings:view',
  help:          'help:view',
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function getPermissionsFor(user: AuthUser): Permission[] {
  return user.permissions ?? ROLE_PERMISSIONS[user.role] ?? [];
}

export function userHasPermission(user: AuthUser | null, perm: Permission): boolean {
  if (!user) return false;
  return getPermissionsFor(user).includes(perm);
}

export function userCanAccessTab(user: AuthUser | null, tab: string): boolean {
  if (!user) return false;
  const required = TAB_PERMISSIONS[tab];
  if (!required) return true; // unknown tabs are open (fail-open for non-gated screens)
  return userHasPermission(user, required);
}

// ─── Role display helpers ─────────────────────────────────────────────────────

export const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
  staff: 'Staf',
};
