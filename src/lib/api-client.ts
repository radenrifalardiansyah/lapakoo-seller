// ─── Centralized HTTP client untuk semua request ke backend API ──────────────

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

function getExpiresAt(): number {
  return Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
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

// Lock untuk mencegah concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  // Gunakan promise yang sama jika refresh sedang berjalan
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      // Endpoint belum ada (404) atau server error → jangan logout, gagal senyap
      if (res.status === 404 || res.status >= 500) return null;

      // Refresh token tidak valid (401) → logout
      if (res.status === 401) {
        clearAllTokens();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return null;
      }

      if (!res.ok) return null;

      const json = await res.json();
      const data = json?.data ?? json;
      if (data?.access_token) {
        saveNewTokens(data.access_token, data.refresh_token ?? refreshToken, data.expires_at ?? 0);
        return data.access_token as string;
      }
    } catch {
      // Network error — jangan logout
    }
    return null;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
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

  // Tangani 401 dengan percobaan refresh token
  if (res.status === 401 && !skipAuth && !_isRetry) {
    const tokenExpired = getExpiresAt() <= Date.now();

    if (tokenExpired || getRefreshToken()) {
      const newToken = await attemptRefresh();
      if (newToken) {
        // Retry dengan token baru
        return apiRequest<T>(path, { ...options, _isRetry: true });
      }
    }

    // Jika token expired dan refresh gagal → logout
    if (tokenExpired && !getToken()) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new ApiError(401, 'Sesi berakhir. Silakan login kembali.');
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

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (json && typeof json === 'object') {
    if ('success' in json && 'data' in json) {
      if ((json as { success: boolean }).success === true) {
        return (json as { success: boolean; data: T }).data;
      }
      const errMsg = (json as { error?: string }).error ?? 'Request gagal';
      throw new ApiError(res.status, errMsg, json);
    }
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
