import type { Request, Response, NextFunction } from "express";
import type { Env } from "./env.js";
import { prisma } from "./db/prisma.js";

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

// --------------------
// Local-first + cost-aware audit batching
// --------------------
const AUDIT_BATCH_MAX = 25;
const AUDIT_FLUSH_INTERVAL_MS = 2000;

let auditQueue: any[] = [];
let flushing = false;
let timerStarted = false;

function startFlushTimer(_env: Env) {
  if (timerStarted) return;
  timerStarted = true;
  setInterval(() => {
    void flushAuditQueue();
  }, AUDIT_FLUSH_INTERVAL_MS).unref?.();
}

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function writeAudit(env: Env, event: AuditEvent) {
  startFlushTimer(env);

  const row = {
    timestamp: event.timestamp || isoNow(),
    actorType: event.actor_type,
    actorUserId: event.actor_id && UUID_RE.test(event.actor_id) ? event.actor_id : null,
    actorExternalId: event.actor_id && !UUID_RE.test(event.actor_id) ? event.actor_id : null,
    tenantId: event.org_id && UUID_RE.test(event.org_id) ? event.org_id : null,
    action: event.action,
    entityType: event.entity_type ?? null,
    entityId: event.entity_id && UUID_RE.test(event.entity_id) ? event.entity_id : null,
    meta: safeJson({
      ...event.metadata,
      status: event.status,
      source: event.source ?? "api",
      device_id: event.device_id ?? null,
      ip_address: event.ip_address ?? null,
      user_agent: event.user_agent ?? null,
      request_id: event.request_id ?? null,
    }),
  };

  auditQueue.push(row);
  if (auditQueue.length >= AUDIT_BATCH_MAX) void flushAuditQueue();
  return { ok: true, queued: true };
}

async function flushAuditQueue() {
  if (flushing) return;
  if (!auditQueue.length) return;
  flushing = true;
  let batch: any[] = [];
  try {
    batch = auditQueue.splice(0, AUDIT_BATCH_MAX);
    await prisma.auditLog.createMany({ data: batch });
  } catch {
    // Put back to queue (front) for retry later.
    if (batch.length) auditQueue = batch.concat(auditQueue);
  } finally {
    flushing = false;
  }
}

export function auditMiddleware(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const ctx = getRequestContext(req);

    res.on("finish", async () => {
      const path = req.path || "";
      if (path === "/health") return;

      const duration_ms = Date.now() - started;
      const status: AuditStatus = res.statusCode >= 400 ? "failure" : "success";

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

// Background/system events (no Request available)
export async function logSystemEvent(env: Env, event: Omit<AuditEvent, "ip_address" | "user_agent" | "request_id" | "org_id" | "actor_id" | "device_id" | "source"> & {
  org_id?: string | null;
  actor_id?: string | null;
  device_id?: string | null;
  source?: string;
  request_id?: string | null;
}) {
  return writeAudit(env, {
    ...event,
    org_id: event.org_id ?? null,
    actor_id: event.actor_id ?? null,
    device_id: event.device_id ?? null,
    source: (event as any).source ?? "system",
    ip_address: null,
    user_agent: null,
    request_id: (event as any).request_id ?? null
  });
}
