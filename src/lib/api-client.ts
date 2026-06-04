// ─── Centralized HTTP client untuk semua request ke backend API ──────────────
// Semua komponen dan service harus pakai fungsi ini, bukan fetch() langsung.

// Saat development, Vite proxy meneruskan /api/* ke API server (bypass CORS).
// Saat production build, gunakan URL penuh.
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY         = 'auth.token';
const EXPIRES_KEY       = 'auth.expiresAt';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveNewTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt * 1000));
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearAllTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('auth.user');
  localStorage.removeItem('auth.store');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
  _isRetry?: boolean;
};

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json?.data ?? json;
    if (data?.access_token) {
      saveNewTokens(data.access_token, data.refresh_token ?? refreshToken, data.expires_at ?? 0);
      return data.access_token;
    }
  } catch {
    // refresh gagal
  }
  return null;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, _isRetry = false, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> ?? {}),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh token saat dapat 401 (token expired)
  if (res.status === 401 && !skipAuth && !_isRetry) {
    const newToken = await attemptRefresh();
    if (newToken) {
      // Retry request sekali dengan token baru
      return apiRequest<T>(path, { ...options, _isRetry: true });
    } else {
      // Refresh gagal — clear session dan notify app untuk logout
      clearAllTokens();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new ApiError(401, 'Sesi berakhir. Silakan login kembali.');
    }
  }

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    let errorBody: unknown;
    try {
      errorBody = await res.json();
      if (typeof errorBody === 'object' && errorBody !== null) {
        const msg = (errorBody as Record<string, string>).message
          ?? (errorBody as Record<string, string>).error
          ?? errorMessage;
        errorMessage = msg;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, errorMessage, errorBody);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (json && typeof json === 'object') {
    // Backend ini selalu mengembalikan { success: bool, data/error: ... }
    // Unwrap data jika success=true
    if ('success' in json && 'data' in json) {
      if ((json as { success: boolean }).success === true) {
        return (json as { success: boolean; data: T }).data;
      }
      // success=false dengan HTTP 200 — perlakukan sebagai error
      const errMsg = (json as { error?: string }).error ?? 'Request gagal';
      throw new ApiError(res.status, errMsg, json);
    }
    // Format lama: { data: ... } tanpa field success
    if ('data' in json && Object.keys(json).length === 1) {
      return (json as { data: T }).data;
    }
  }

  return json as T;
}

export const apiGet = <T>(path: string, opts?: RequestOptions) =>
  apiRequest<T>(path, { method: 'GET', ...opts });

export const apiPost = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  apiRequest<T>(path, { method: 'POST', body, ...opts });

export const apiPut = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  apiRequest<T>(path, { method: 'PUT', body, ...opts });

export const apiDelete = <T>(path: string, opts?: RequestOptions) =>
  apiRequest<T>(path, { method: 'DELETE', ...opts });
