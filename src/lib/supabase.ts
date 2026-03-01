import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  `https://wxeomtjipoirzetjngco.supabase.co`;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZW9tdGppcG9pcnpldGpuZ2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjkwMTEsImV4cCI6MjA4NTY0NTAxMX0._ZJvIZ88G1m8cRyM75VoSYCwSXf5QHtoSQqgTcpUkqg";

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

export async function supabaseSignOut() {
  await supabase.auth.signOut();
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getSupabaseToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
