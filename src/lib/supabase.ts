import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars. " +
    "Add them to your .env file (see .env.example).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOKEN_KEY = "supabase_token";

export async function supabaseSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  const token = data.session?.access_token ?? null;
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore storage failures
    }
  }
  return { session: data.session, user: data.user };
}

export async function supabaseSignUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export function getSupabaseToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
