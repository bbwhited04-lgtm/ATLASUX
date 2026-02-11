import type { Env } from "./env";
import { makeSupabase } from "./supabase";

export type LedgerEventType = "spend" | "income" | "refund" | "payout";

export type LedgerEvent = {
  timestamp?: string;
  event_type: LedgerEventType;
  amount: number;
  currency?: string;
  status?: string;
  related_job_id?: string | null;
  provider?: string | null;
  metadata?: Record<string, any> | null;
  org_id?: string | null;
  user_id?: string | null;
};

function isoNow() { return new Date().toISOString(); }

export async function writeLedgerEvent(env: Env, e: LedgerEvent) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, skipped: true, reason: "supabase_not_configured" };
  const supabase = makeSupabase(env);
  const row = {
    timestamp: e.timestamp || isoNow(),
    event_type: e.event_type,
    amount: e.amount,
    currency: e.currency || "USD",
    status: e.status || "recorded",
    related_job_id: e.related_job_id ?? null,
    provider: e.provider ?? null,
    metadata: e.metadata ?? null,
    org_id: e.org_id ?? null,
    user_id: e.user_id ?? null
  };
  const { error } = await supabase.from("ledger_events").insert([row]);
  if (error) return { ok: false, skipped: false, reason: error.message };
  return { ok: true };
}
