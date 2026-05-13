export type UserRole = 'owner' | 'admin' | 'staff';

export type Permission =
  | 'dashboard:view'
  | 'products:view' | 'products:edit'
  | 'orders:view' | 'orders:edit'
  | 'warehouse:view' | 'warehouse:edit'
  | 'analytics:view'
  | 'ai-insights:view'
  | 'customers:view' | 'customers:edit'
  | 'resellers:view' | 'resellers:edit'
  | 'marketing:view' | 'marketing:edit'
  | 'payments:view' | 'payments:edit'
  | 'team:view' | 'team:edit'
  | 'settings:view' | 'settings:edit'
  | 'notifications:view'
  | 'help:view';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  // Optional per-user override; if absent, derived from role
  permissions?: Permission[];
}

// Standard auth response shape — mirrors typical JWT login endpoint
export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number; // unix ms
}

export interface LoginResult {
  ok: true;
  session: AuthSession;
}

export interface LoginError {
  ok: false;
  error: string;
}

export type LoginResponse = LoginResult | LoginError;

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;          // true while restoring session on app boot
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  canAccessTab: (tab: string) => boolean;
}
