import type { Request, Response, NextFunction } from "express";
import type { Env } from "./env";
import { makeSupabase } from "./supabase";

export type AuditStatus = "success" | "failure";

export type AuditEvent = {
  timestamp?: string; // ISO
  actor_type: "user" | "system" | "device" | "mobile";
  actor_id?: string | null;
  device_id?: string | null;
  source?: "web" | "tauri" | "mobile" | "api" | string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  status: AuditStatus;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  org_id?: string | null;
};

function isoNow() {
  return new Date().toISOString();
}

function safeJson(obj: any) {
  try { return obj ?? null; } catch { return null; }
}

function header(req: Request, name: string) {
  const v = req.header(name);
  return v ? String(v) : null;
}

export function getRequestContext(req: Request) {
  return {
    org_id: header(req, "x-org-id"),
    actor_id: header(req, "x-user-id") || header(req, "x-actor-id"),
    device_id: header(req, "x-device-id"),
    source: header(req, "x-source") || "api",
    request_id: header(req, "x-request-id") || null,
    ip_address: (req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : null) || (req.ip ? String(req.ip) : null),
    user_agent: req.headers["user-agent"] ? String(req.headers["user-agent"]) : null
  };
}

export async function writeAudit(env: Env, event: AuditEvent) {
  // "Local-first": if Supabase isn't configured or table isn't present, we won't crash.
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, skipped: true, reason: "supabase_not_configured" };
  const supabase = makeSupabase(env);

  const row = {
    timestamp: event.timestamp || isoNow(),
    actor_type: event.actor_type,
    actor_id: event.actor_id ?? null,
    org_id: event.org_id ?? null,
    device_id: event.device_id ?? null,
    source: event.source ?? "api",
    action: event.action,
    entity_type: event.entity_type ?? null,
    entity_id: event.entity_id ?? null,
    status: event.status,
    metadata: safeJson(event.metadata),
    ip_address: event.ip_address ?? null,
    user_agent: event.user_agent ?? null,
    request_id: event.request_id ?? null
  };

  const { error } = await supabase.from("audit_log").insert([row]);
  if (error) return { ok: false, skipped: false, reason: error.message };
  return { ok: true };
}

export function auditMiddleware(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const ctx = getRequestContext(req);

    res.on("finish", async () => {
      // Don't log noisy endpoints unless they are important
      const path = req.path || "";
      if (path === "/health") return;

      const duration_ms = Date.now() - started;
      const status: AuditStatus = res.statusCode >= 400 ? "failure" : "success";

      // Avoid logging sensitive payloads; only keys.
      const bodyKeys = req.body && typeof req.body === "object" ? Object.keys(req.body).slice(0, 25) : [];
      const queryKeys = req.query && typeof req.query === "object" ? Object.keys(req.query).slice(0, 25) : [];

      const action = `http:${req.method.toUpperCase()} ${path}`;

      await writeAudit(env, {
        actor_type: ctx.actor_id ? "user" : (ctx.device_id ? "device" : "system"),
        actor_id: ctx.actor_id,
        org_id: ctx.org_id,
        device_id: ctx.device_id,
        source: ctx.source,
        action,
        entity_type: "http_request",
        entity_id: null,
        status,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
        request_id: ctx.request_id,
        metadata: {
          duration_ms,
          status_code: res.statusCode,
          query_keys: queryKeys,
          body_keys: bodyKeys,
        }
      });
    });

    next();
  };
}

// Convenience helper for key business events
export async function logBusinessEvent(env: Env, req: Request, event: Omit<AuditEvent, "ip_address" | "user_agent" | "request_id" | "org_id" | "actor_id" | "device_id" | "source"> & { metadata?: Record<string, any> | null }) {
  const ctx = getRequestContext(req);
  return writeAudit(env, {
    ...event,
    actor_id: ctx.actor_id,
    org_id: ctx.org_id,
    device_id: ctx.device_id,
    source: ctx.source,
    ip_address: ctx.ip_address,
    user_agent: ctx.user_agent,
    request_id: ctx.request_id
  });
}
