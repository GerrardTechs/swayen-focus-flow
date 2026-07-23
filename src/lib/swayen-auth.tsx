import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type AuthUser } from "./swayen-api";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  hasToken: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function SwayenAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  const refetchMe = useCallback(async () => {
    if (!tokenStore.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHasToken(!!tokenStore.access);
    refetchMe();
    const onChange = () => {
      setHasToken(!!tokenStore.access);
      refetchMe();
    };
    window.addEventListener("swayen-auth-change", onChange);
    return () => window.removeEventListener("swayen-auth-change", onChange);
  }, [refetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, hasToken, login, register, logout, refetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSwayenAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSwayenAuth must be used inside SwayenAuthProvider");
  return c;
}
