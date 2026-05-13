// ──────────────────────────────────────────────────────────────────────────────
// AUTH API LAYER
//
// File ini adalah satu-satunya boundary antara frontend dan backend auth.
// Ketika backend siap, ganti isi tiap fungsi di bawah ini dengan fetch() —
// bentuk return value (Promise<...>) sudah dirancang sesuai pola JWT bearer:
//
//   apiLogin   -> POST   /api/auth/login    { email, password } -> { token, user, expiresAt }
//   apiLogout  -> POST   /api/auth/logout   (Authorization: Bearer <token>)
//   apiMe      -> GET    /api/auth/me       (Authorization: Bearer <token>) -> user
//
// Komponen UI TIDAK boleh import file ini langsung — semua akses lewat AuthContext.
// ──────────────────────────────────────────────────────────────────────────────

import type { AuthSession, AuthUser, LoginResponse } from '../types/auth';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

// ─── Mock user database ───────────────────────────────────────────────────────
// Email & nama selaras dengan mock di team-page.tsx (tenant: tokobudi).

interface MockRecord {
  password: string;
  user: AuthUser;
}

const MOCK_DB: MockRecord[] = [
  {
    password: 'demo123',
    user: {
      id: 'u_1',
      email: 'budi@tokobudi.seller.id',
      name: 'Budi Santoso',
      role: 'owner',
      tenantId: '2',
    },
  },
  {
    password: 'demo123',
    user: {
      id: 'u_2',
      email: 'siti@tokobudi.seller.id',
      name: 'Siti Rahayu',
      role: 'admin',
      tenantId: '2',
    },
  },
  {
    password: 'demo123',
    user: {
      id: 'u_3',
      email: 'doni@tokobudi.seller.id',
      name: 'Doni Prasetyo',
      role: 'staff',
      tenantId: '2',
    },
  },
  // Legacy single-credential fallback so existing demo links tetap jalan.
  {
    password: 'password123',
    user: {
      id: 'u_legacy',
      email: 'seller@example.com',
      name: 'Demo Seller',
      role: 'owner',
      tenantId: '0',
    },
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildToken(userId: string): string {
  // Mock token. Backend nyata akan return JWT signed (header.payload.signature).
  // Shape sengaja mirip "mock.<userId>.<issuedAt>" agar mudah dikenali.
  return `mock.${userId}.${Date.now()}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  await sleep(700); // simulate network

  const normalized = email.trim().toLowerCase();
  const record = MOCK_DB.find(r => r.user.email.toLowerCase() === normalized);

  if (!record || record.password !== password) {
    return { ok: false, error: 'Email atau password salah' };
  }

  const session: AuthSession = {
    token: buildToken(record.user.id),
    user: record.user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return { ok: true, session };
}

export async function apiLogout(_token: string): Promise<void> {
  await sleep(150);
  // Backend nyata: invalidate token / clear cookie. Mock: no-op.
}

export async function apiMe(token: string): Promise<AuthUser | null> {
  await sleep(150);
  // Decode mock token "mock.<userId>.<issuedAt>" to lookup user.
  const parts = token.split('.');
  if (parts[0] !== 'mock' || parts.length < 3) return null;
  const userId = parts[1];
  return MOCK_DB.find(r => r.user.id === userId)?.user ?? null;
}
