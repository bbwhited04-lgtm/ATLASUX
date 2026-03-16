/**
 * Self-managed auth — replaces Supabase Auth.
 * JWT tokens are issued by the backend (POST /v1/login, /v1/register).
 */

import { API_BASE } from "./api";

const TOKEN_KEY = "atlas_token";

export async function supabaseSignIn(email: string, password: string) {
  const res = await fetch(`${API_BASE}/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  const token = data.token;
  if (token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  }
  return { session: { access_token: token }, user: { email } };
}

export async function supabaseSignUp(email: string, password: string) {
  const res = await fetch(`${API_BASE}/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Registration failed");
  const token = data.token;
  if (token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  }
  return { session: { access_token: token }, user: { email } };
}

export function getSupabaseToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** No-op shim — replaces supabase.auth for session checks */
export const supabase = {
  auth: {
    async getUser(token?: string) {
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await fetch(`${API_BASE}/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { data: { user: null }, error: null };
        const d = await res.json();
        return { data: { user: { id: d.userId, email: d.email } }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },
  },
};
