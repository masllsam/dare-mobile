import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/api/client';
import * as api from '@/api';
import type { User } from '@/api/types';
import { deleteToken, getToken, saveToken } from '@/auth/tokenStore';

export type AuthStatus = 'restoring' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');

  const clearSession = useCallback(async () => {
    setToken(null);
    setUserState(null);
    await deleteToken().catch(() => {});
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const res = await api.login({ email_or_username: emailOrUsername, password });
      await saveToken(res.access_token);
      setToken(res.access_token);
      setUserState(res.user);
      setStatus('signedIn');
    },
    [],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await api.register({ username, email, password });
      await saveToken(res.access_token);
      setToken(res.access_token);
      setUserState(res.user);
      setStatus('signedIn');
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setStatus('signedOut');
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await api.getMe(token);
      setUserState(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await clearSession();
    }
  }, [token, clearSession]);

  const setUser = useCallback((u: User) => setUserState(u), []);

  // Restore session on app start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getToken();
        if (cancelled) return;
        if (stored) {
          try {
            const me = await api.getMe(stored);
            if (cancelled) return;
            setToken(stored);
            setUserState(me);
            setStatus('signedIn');
            return;
          } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
              await clearSession();
            } else {
              // Network hiccup: keep the stored token, sign in with stale
              // profile so the app is usable; refreshUser will retry later.
              if (!cancelled) {
                setToken(stored);
                setUserState(null);
                setStatus('signedIn');
              }
              return;
            }
          }
        }
        if (!cancelled) setStatus('signedOut');
      } catch {
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, register, logout, refreshUser, setUser }),
    [status, user, token, login, register, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
