import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthContextValue, AuthUser, Permission } from '../types/auth';
import { apiLogin, apiLogout, apiMe } from '../lib/auth-api';
import { userCanAccessTab, userHasPermission } from '../lib/permissions';

const TOKEN_KEY = 'auth.token';
const EXPIRES_KEY = 'auth.expiresAt';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedExpires = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);

      if (!storedToken || storedExpires <= Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const me = await apiMe(storedToken);
        if (cancelled) return;
        if (me) {
          setToken(storedToken);
          setUser(me);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(EXPIRES_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    if (res.ok) {
      localStorage.setItem(TOKEN_KEY, res.session.token);
      localStorage.setItem(EXPIRES_KEY, String(res.session.expiresAt));
      setToken(res.session.token);
      setUser(res.session.user);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    const current = token;
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    if (current) {
      try { await apiLogout(current); } catch { /* ignore — already cleared client side */ }
    }
  }, [token]);

  const hasPermission = useCallback(
    (perm: Permission) => userHasPermission(user, perm),
    [user],
  );

  const canAccessTab = useCallback(
    (tab: string) => userCanAccessTab(user, tab),
    [user],
  );

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading, login, logout, hasPermission, canAccessTab,
  }), [user, token, loading, login, logout, hasPermission, canAccessTab]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
