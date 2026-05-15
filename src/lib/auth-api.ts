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
  token: string;
  user: {
    id: string | number;
    email: string;
    name: string;
    role?: string;
    store_id?: string | number;
    avatar?: string;
    avatar_url?: string;
  };
  expires_at?: number;
}

interface MeApiResponse {
  id: string | number;
  email: string;
  name: string;
  role?: string;
  store_id?: string | number;
  avatar?: string;
  avatar_url?: string;
}

function mapUser(raw: LoginApiResponse['user'] | MeApiResponse): AuthUser {
  return {
    id: String(raw.id),
    email: raw.email,
    name: raw.name,
    role: (raw.role as AuthUser['role']) ?? 'staff',
    tenantId: String(raw.store_id ?? '0'),
    avatarUrl: raw.avatar_url ?? raw.avatar,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await apiPost<LoginApiResponse>('/api/auth/login', { email, password }, { skipAuth: true });
    const user = mapUser(res.user);
    const session: AuthSession = {
      token: res.token,
      user,
      expiresAt: res.expires_at ?? (Date.now() + SESSION_TTL_MS),
    };
    return { ok: true, session };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 422) {
        return { ok: false, error: 'Email atau password salah' };
      }
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Gagal terhubung ke server. Coba lagi.' };
  }
}

export async function apiLogout(token: string): Promise<void> {
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
    const res = await apiPost<LoginApiResponse>('/api/auth/register', data, { skipAuth: true });
    const user = mapUser(res.user);
    const session: AuthSession = {
      token: res.token,
      user,
      expiresAt: res.expires_at ?? (Date.now() + SESSION_TTL_MS),
    };
    return { ok: true, session };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 422) return { ok: false, error: 'Email sudah terdaftar atau data tidak valid' };
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Gagal mendaftar. Coba lagi.' };
  }
}
