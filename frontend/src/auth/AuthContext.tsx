import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";
import type { LoginResponse } from "../types/api";

interface JwtClaims {
  sub: number;
  email: string;
  nickname: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  nickname?: string;
}

interface AuthState {
  token: string | null;
  user: JwtClaims | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

function decodeClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    tokenStore.set(data.accessToken);
    setToken(data.accessToken);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await api.post<LoginResponse>("/auth/register", input);
    tokenStore.set(data.accessToken);
    setToken(data.accessToken);
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      token,
      user: token ? decodeClaims(token) : null,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    };
  }, [token, login, register, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
