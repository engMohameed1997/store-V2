"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authClient, type AuthUser, type LoginPayload } from "@/lib/client/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuth = useCallback((user: AuthUser, token: string) => {
    setState({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Deduplicate concurrent refresh calls — reuse in-flight promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      const result = await authClient.refresh();
      if (result.success && result.data?.accessToken && result.data?.user) {
        setState({
          user: result.data.user,
          accessToken: result.data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      // Don't clear auth on rate-limit (429) — keep existing session
      if (result.status === 429) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
      clearAuth();
      return false;
    })();

    refreshPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [clearAuth]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await authClient.login(payload);
      if (result.success && result.data) {
        setAuth(result.data.user, result.data.accessToken);
        return { success: true };
      }
      return {
        success: false,
        message: !result.success ? result.error.message : "Login failed",
      };
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    if (state.accessToken) {
      await authClient.logout(state.accessToken);
    }
    clearAuth();
  }, [state.accessToken, clearAuth]);

  // Try to refresh token on mount (session recovery)
  // useRef prevents double-execution in React strict mode
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const timeoutId = setTimeout(() => {
      // Safety net: if refresh takes more than 10s, clear loading state
      setState((prev) => (prev.isLoading ? { ...prev, isLoading: false } : prev));
    }, 10000);

    refreshToken()
      .catch(() => clearAuth())
      .finally(() => clearTimeout(timeoutId));
  }, [refreshToken, clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshToken,
      setAuth,
      clearAuth,
    }),
    [state, login, logout, refreshToken, setAuth, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
