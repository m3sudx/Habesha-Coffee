"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import type { User } from "@/lib/api/auth";

const TOKEN_KEY = "habesha.token";

// loading       = we are still checking the saved token (first moments after page load)
// authenticated = logged in
// guest         = not logged in
type Status = "loading" | "authenticated" | "guest";

type AuthState = { status: Status; user: User | null; token: string | null };

type AuthContextValue = AuthState & {
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: { name: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Browser storage can be blocked (private windows, strict settings), so never let it crash the app.
function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore: the user just stays logged in for this tab only
  }
}

const GUEST: AuthState = { status: "guest", user: null, token: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, token: null });

  // On page load: if a token was saved, ask the backend who it belongs to.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = readToken();
      if (!token) {
        setState(GUEST);
        return;
      }
      try {
        const res = await authApi.getMe(token);
        if (!cancelled) setState({ status: "authenticated", user: res.data.user, token });
      } catch (err) {
        if (cancelled) return;
        // Only forget the token if the backend says it is invalid or expired.
        // A network error should not log people out.
        if (err instanceof ApiError && err.status === 401) saveToken(null);
        setState(GUEST);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const res = await authApi.login(input);
    saveToken(res.data.token);
    setState({ status: "authenticated", user: res.data.user, token: res.data.token });
    return res.data.user;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const res = await authApi.register(input);
      saveToken(res.data.token);
      setState({ status: "authenticated", user: res.data.user, token: res.data.token });
      return res.data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    saveToken(null);
    setState(GUEST);
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
