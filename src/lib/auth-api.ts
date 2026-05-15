// ──────────────────────────────────────────────────────────────────────────────
// AUTH API LAYER
// ──────────────────────────────────────────────────────────────────────────────

import type { AuthSession, AuthUser, LoginResponse } from '../types/auth';
import { apiPost, apiGet, ApiError } from './api-client';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

// ─── Actual API response shapes ───────────────────────────────────────────────
// Format dari lapakoo-client-api:
// POST /api/auth/login → { success, data: { user, session, profile } }

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

interface ApiProfile {
  id: number | string;
  tenant_id: number | string;
  role: string;
  name: string;
  avatar_url: string | null;
  status: string;
  tenants?: {
    id: number | string;
    store_name: string;
    subdomain: string;
    logo_url: string | null;
    status: string;
  };
}

interface ApiSession {
  access_token: string;
  expires_at: number;   // detik (bukan ms)
  expires_in: number;
  refresh_token: string;
}

interface LoginApiResponse {
  success?: boolean;
  error?: string;
  // Format baru (Supabase-backed): data.session.access_token + data.profile
  data?: {
    user?: SupabaseUser;
    session?: ApiSession;
    profile?: ApiProfile;
    // Format lama (flat dalam data)
    token?: string;
    access_token?: string;
    legacy_user?: LegacyUser;
  };
  // Format lama (flat di root)
  token?: string;
  access_token?: string;
  user?: LegacyUser;
  expires_at?: number;
}

// api-client.ts auto-unwraps { success, data } envelope, sehingga yang
// diterima oleh extractSession adalah inner "data" object secara langsung.
type UnwrappedLoginData = NonNullable<LoginApiResponse['data']> & { expires_at?: number };

interface LegacyUser {
  id: string | number;
  email: string;
  name?: string;
  owner_name?: string;
  role?: string;
  store_id?: string | number;
  avatar?: string;
  avatar_url?: string;
}

interface MeApiResponse {
  id: string | number;
  email: string;
  name?: string;
  owner_name?: string;
  role?: string;
  store_id?: string | number;
  avatar?: string;
  avatar_url?: string;
}

// ─── localStorage cache (agar session restore tidak bergantung pada /api/auth/me) ──

const USER_CACHE_KEY = 'auth.user';

// Diexport agar TenantContext bisa baca tenant dari login response
export const STORE_CACHE_KEY = 'auth.store';

export interface CachedStore {
  id: string;
  tenantId: string;
  storeName: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor?: string;
}

function saveUserCache(user: AuthUser): void {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function loadUserCache(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

function saveStoreCache(store: CachedStore): void {
  localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(store));
}

export function loadStoreCache(): CachedStore | null {
  try {
    const raw = localStorage.getItem(STORE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedStore) : null;
  } catch { return null; }
}

export function clearAuthCache(): void {
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem(STORE_CACHE_KEY);
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapLegacyUser(raw: LegacyUser | MeApiResponse): AuthUser {
  return {
    id: String(raw.id ?? ''),
    email: raw.email ?? '',
    name: raw.name ?? (raw as LegacyUser).owner_name ?? raw.email ?? '',
    role: (raw.role as AuthUser['role']) ?? 'owner',
    tenantId: String((raw as LegacyUser).store_id ?? '0'),
    avatarUrl: raw.avatar_url ?? (raw as LegacyUser).avatar,
  };
}

// ─── Session extractor ────────────────────────────────────────────────────────

// api-client.ts sudah unwrap { success, data }, jadi d adalah inner data object.
function extractSession(d: UnwrappedLoginData): AuthSession | null {
  // ── Format baru: session.access_token + profile ──
  if (d?.session?.access_token && d.profile) {
    const profile = d.profile;
    const user: AuthUser = {
      id: String(profile.id),
      email: d.user?.email ?? '',
      name: profile.name || d.user?.user_metadata?.full_name || d.user?.email || '',
      role: (profile.role as AuthUser['role']) ?? 'owner',
      tenantId: String(profile.tenant_id ?? '0'),
      avatarUrl: profile.avatar_url ?? undefined,
    };

    saveUserCache(user);
    if (profile.tenants) {
      saveStoreCache({
        id: String(profile.tenants.id),
        tenantId: String(profile.tenant_id),
        storeName: profile.tenants.store_name,
        subdomain: profile.tenants.subdomain,
        logoUrl: profile.tenants.logo_url ?? undefined,
      });
    }

    return {
      token: d.session.access_token,
      user,
      expiresAt: d.session.expires_at * 1000, // detik → ms
    };
  }

  // ── Format lama: token + user (flat dalam data) ──
  const token = d?.token ?? d?.access_token;
  const rawUser = d?.legacy_user;
  if (!token || !rawUser) return null;

  const user = mapLegacyUser(rawUser);
  saveUserCache(user);
  return {
    token,
    user,
    expiresAt: d.expires_at ?? (Date.now() + SESSION_TTL_MS),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await apiPost<UnwrappedLoginData>('/api/auth/login', { email, password }, { skipAuth: true });
    const session = extractSession(res);
    if (!session) {
      // success: false dari API = kredensial salah
      return { ok: false, error: 'Email atau password salah' };
    }
    return { ok: true, session };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403 || err.status === 422) {
        return { ok: false, error: 'Email atau password salah' };
      }
      return { ok: false, error: 'Server error. Coba beberapa saat lagi.' };
    }
    return { ok: false, error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
  }
}

export async function apiLogout(token: string): Promise<void> {
  clearAuthCache();
  try {
    await apiPost('/api/auth/logout', undefined, {
      headers: { Authorization: `Bearer ${token}` },
      skipAuth: true,
    });
  } catch {
    // Session sudah dihapus di sisi client
  }
}

export async function apiMe(token: string): Promise<AuthUser | null> {
  try {
    const res = await apiGet<Record<string, unknown>>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      skipAuth: true,
    });

    // Handle format nested sama seperti login: { profile, user, session }
    const profile = res.profile as ApiProfile | undefined;
    const supaUser = res.user as SupabaseUser | undefined;
    if (profile) {
      const user: AuthUser = {
        id: String(profile.id ?? ''),
        email: supaUser?.email ?? String(res.email ?? ''),
        name: profile.name || supaUser?.user_metadata?.full_name || String(res.email ?? ''),
        role: (profile.role as AuthUser['role']) ?? 'owner',
        tenantId: String(profile.tenant_id ?? '0'),
        avatarUrl: profile.avatar_url ?? undefined,
      };
      saveUserCache(user);
      if (profile.tenants) {
        saveStoreCache({
          id: String(profile.tenants.id),
          tenantId: String(profile.tenant_id),
          storeName: profile.tenants.store_name,
          subdomain: profile.tenants.subdomain,
          logoUrl: profile.tenants.logo_url ?? undefined,
        });
      }
      return user;
    }

    // Handle format flat: { id, email, name, role, ... }
    const user = mapLegacyUser(res as unknown as MeApiResponse);
    saveUserCache(user);
    return user;
  } catch (err) {
    // Token invalid/expired — jangan kembalikan cache, paksa re-login
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    return loadUserCache();
  }
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  store_name?: string;
  store_address?: string;
}): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  try {
    const payload = {
      owner_name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      store_name: data.store_name,
      subdomain: (data.store_name ?? data.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30),
    };
    const res = await apiPost<UnwrappedLoginData>('/api/auth/register', payload, { skipAuth: true });
    const session = extractSession(res);
    if (!session) throw new ApiError(500, 'Response format tidak dikenali');
    return { ok: true, session };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400 || err.status === 422) return { ok: false, error: 'Email sudah terdaftar atau data tidak valid' };
      if (err.status >= 500) return { ok: false, error: 'Server sedang bermasalah. Coba beberapa saat lagi.' };
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Gagal mendaftar. Coba lagi.' };
  }
}
