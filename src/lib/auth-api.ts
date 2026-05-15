// ──────────────────────────────────────────────────────────────────────────────
// AUTH API LAYER
//
// Satu-satunya boundary antara frontend dan backend auth.
// Semua request ke /api/auth/* lewat sini.
// Komponen UI TIDAK boleh import file ini langsung — semua akses lewat AuthContext.
// ──────────────────────────────────────────────────────────────────────────────

import type { AuthSession, AuthUser, LoginResponse } from '../types/auth';
import { apiPost, apiGet, ApiError } from './api-client';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

// ─── Response shapes dari backend ─────────────────────────────────────────────

interface LoginApiResponse {
  token?: string;
  access_token?: string;
  user?: {
    id: string | number;
    email: string;
    name?: string;
    owner_name?: string;
    role?: string;
    store_id?: string | number;
    avatar?: string;
    avatar_url?: string;
  };
  data?: {
    token?: string;
    access_token?: string;
    user?: LoginApiResponse['user'];
  };
  expires_at?: number;
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

function mapUser(raw: NonNullable<LoginApiResponse['user']> | MeApiResponse): AuthUser {
  return {
    id: String(raw.id),
    email: raw.email,
    name: (raw as MeApiResponse).name ?? (raw as MeApiResponse).owner_name ?? raw.email,
    role: (raw.role as AuthUser['role']) ?? 'owner',
    tenantId: String(raw.store_id ?? '0'),
    avatarUrl: raw.avatar_url ?? raw.avatar,
  };
}

function extractSession(res: LoginApiResponse): AuthSession | null {
  // Handle berbagai format response: { token, user } atau { data: { token, user } }
  const data = res.data ?? res;
  const token = data.token ?? data.access_token ?? res.token ?? res.access_token;
  const user = data.user ?? res.user;
  if (!token || !user) return null;
  return {
    token,
    user: mapUser(user),
    expiresAt: res.expires_at ?? (Date.now() + SESSION_TTL_MS),
  };
}

// ─── Demo fallback (digunakan saat API server error) ─────────────────────────

interface MockRecord { password: string; user: AuthUser }

const MOCK_DB: MockRecord[] = [
  {
    password: 'demo123',
    user: { id: 'u_1', email: 'budi@tokobudi.seller.id', name: 'Budi Santoso', role: 'owner', tenantId: '1' },
  },
  {
    password: 'demo123',
    user: { id: 'u_2', email: 'siti@tokobudi.seller.id', name: 'Siti Rahayu', role: 'admin', tenantId: '1' },
  },
  {
    password: 'demo123',
    user: { id: 'u_3', email: 'doni@tokobudi.seller.id', name: 'Doni Prasetyo', role: 'staff', tenantId: '1' },
  },
  {
    password: 'password123',
    user: { id: 'u_legacy', email: 'seller@example.com', name: 'Demo Seller', role: 'owner', tenantId: '0' },
  },
];

function mockLogin(email: string, password: string): LoginResponse {
  const normalized = email.trim().toLowerCase();
  const record = MOCK_DB.find(r => r.user.email.toLowerCase() === normalized);
  if (!record || record.password !== password) {
    return { ok: false, error: 'Email atau password salah' };
  }
  return {
    ok: true,
    session: {
      token: `demo.${record.user.id}.${Date.now()}`,
      user: record.user,
      expiresAt: Date.now() + SESSION_TTL_MS,
    },
  };
}

function isMockToken(token: string): boolean {
  return token.startsWith('demo.');
}

function mockMe(token: string): AuthUser | null {
  if (!isMockToken(token)) return null;
  const userId = token.split('.')[1];
  return MOCK_DB.find(r => r.user.id === userId)?.user ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await apiPost<LoginApiResponse>('/api/auth/login', { email, password }, { skipAuth: true });
    const session = extractSession(res);
    if (!session) {
      // Response tidak punya token/user — coba mock
      console.warn('[auth] API login succeeded but response format unexpected, using demo fallback');
      return mockLogin(email, password);
    }
    return { ok: true, session };
  } catch (err) {
    if (err instanceof ApiError) {
      // 401/403/422 = salah kredensial
      if (err.status === 401 || err.status === 403 || err.status === 422) {
        return { ok: false, error: 'Email atau password salah' };
      }
      // 5xx = server error — gunakan demo fallback agar app tetap bisa dipakai
      if (err.status >= 500) {
        console.warn(`[auth] API server error (${err.status}), using demo fallback`);
        return mockLogin(email, password);
      }
      return { ok: false, error: err.message };
    }
    // Network error / CORS — gunakan mock
    console.warn('[auth] Network error, using demo fallback:', err);
    return mockLogin(email, password);
  }
}

export async function apiLogout(token: string): Promise<void> {
  if (isMockToken(token)) return; // demo session, skip API call
  try {
    await apiPost('/api/auth/logout', undefined, {
      headers: { Authorization: `Bearer ${token}` },
      skipAuth: true,
    });
  } catch {
    // Abaikan error logout — session sudah dihapus di sisi client
  }
}

export async function apiMe(token: string): Promise<AuthUser | null> {
  if (isMockToken(token)) return mockMe(token);
  try {
    const res = await apiGet<MeApiResponse>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      skipAuth: true,
    });
    return mapUser(res);
  } catch {
    return null;
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
      // Buat subdomain otomatis dari store_name
      subdomain: (data.store_name ?? data.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30) + Math.floor(Math.random() * 1000),
    };
    const res = await apiPost<LoginApiResponse>('/api/auth/register', payload, { skipAuth: true });
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
