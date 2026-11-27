import { api } from "./client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type AuthResult = {
  user: User;
  token: string;
};

export function login(input: { email: string; password: string }) {
  return api<AuthResult>("/auth/login", { method: "POST", body: input });
}

export function register(input: { name: string; email: string; password: string }) {
  return api<AuthResult>("/auth/register", { method: "POST", body: input });
}

// Asks the backend who the token belongs to. Fails with 401 if it is invalid or expired.
export function getMe(token: string) {
  return api<{ user: User }>("/auth/me", { token, cache: "no-store" });
}
