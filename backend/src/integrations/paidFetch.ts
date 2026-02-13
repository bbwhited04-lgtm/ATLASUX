import type { Env } from "../env";
import { logSystemEvent } from "../audit";
import { writeLedgerEvent } from "../ledger";

type PaidFetchArgs = {
  env: Env;

  provider: string; // openai, etc.
  action: string;   // openai.responses.create, etc.

  org_id?: string | null;
  user_id?: string | null;
  related_job_id?: string | null;

  // Optional estimate if you can calculate it
  est_cost_usd?: number | null;

  url: string;
  init: RequestInit;

  // Optional: caller handles non-2xx
  noThrow?: boolean;
};

export async function paidFetch<T = any>(args: PaidFetchArgs): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  text: string | null;
  latency_ms: number;
}> {
  const started = Date.now();
  let status = 0;
  let ok = false;
  let text: string | null = null;

  try {
    const r = await fetch(args.url, args.init);
    status = r.status;
    ok = r.ok;

    text = await r.text().catch(() => null);

    // Audit vendor call (never include query params)
    await logSystemEvent(args.env, {
      actor_type: "system",
      action: args.action,
      entity_type: "vendor_call",
      entity_id: args.related_job_id ?? null,
      status: ok ? "success" : "failure",
      metadata: {
        provider: args.provider,
        status,
        latency_ms: Date.now() - started,
        url: safeUrl(args.url),
      },
      org_id: args.org_id ?? null,
      actor_id: args.user_id ?? null,
      source: "api",
    });

    // If we have an estimate, write a ledger record now (you can later patch actual_cost_usd on the job)
    if (args.est_cost_usd != null) {
      await writeLedgerEvent(args.env, {
        event_type: "spend",
        amount: Number(args.est_cost_usd),
        currency: "USD",
        status: ok ? "recorded" : "failed",
        related_job_id: args.related_job_id ?? null,
        provider: args.provider,
        metadata: { action: args.action, http_status: status },
        org_id: args.org_id ?? null,
        user_id: args.user_id ?? null,
      });
    }

    let data: any = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }

    if (!ok && !args.noThrow) {
      const msg = (data as any)?.error?.message || text || `http_${status}`;
      throw new Error(`${args.provider} request failed (${status}): ${msg}`);
    }

    return { ok, status, data: data as T, text, latency_ms: Date.now() - started };
  } catch (e) {
    // best-effort failure audit (don't crash because audit failed)
    try {
      await logSystemEvent(args.env, {
        actor_type: "system",
        action: args.action,
        entity_type: "vendor_call",
        entity_id: args.related_job_id ?? null,
        status: "failure",
        metadata: {
          provider: args.provider,
          status,
          latency_ms: Date.now() - started,
          url: safeUrl(args.url),
          error: (e as any)?.message || "paidFetch_failed",
        },
        org_id: args.org_id ?? null,
        actor_id: args.user_id ?? null,
        source: "api",
      });
    } catch {}
    throw e;
  }
}

function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}
