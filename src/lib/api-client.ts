// ─── Centralized HTTP client untuk semua request ke backend API ──────────────
// Semua komponen dan service harus pakai fungsi ini, bukan fetch() langsung.

// Saat development, Vite proxy meneruskan /api/* ke API server (bypass CORS).
// Saat production build, gunakan URL penuh.
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'auth.token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
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
};

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, ...rest } = options;

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
  // Unwrap { data: ... } envelope if present, otherwise return as-is
  if (json && typeof json === 'object' && 'data' in json && Object.keys(json).length === 1) {
    return (json as { data: T }).data;
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
