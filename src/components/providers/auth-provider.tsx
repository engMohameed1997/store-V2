"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const refreshToken = useCallback(async (): Promise<boolean> => {
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
    clearAuth();
    return false;
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
  useEffect(() => {
    refreshToken().catch(() => clearAuth());
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
