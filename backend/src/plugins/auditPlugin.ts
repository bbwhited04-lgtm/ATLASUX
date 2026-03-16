import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { computeAuditHash } from "../lib/auditChain.js";

let auditPausedUntil = 0;       // epoch ms — pause window, not permanent
let warnedOnce = false;
const AUDIT_PAUSE_MS = 10_000;  // pause for 10s on schema error, then retry

function isSchemaError(err: any): boolean {
  const msg = String(err?.message ?? err);
  if (msg.includes('type "public.AuditLevel" does not exist')) return true;
  if (msg.includes("AuditLevel") && msg.includes("does not exist")) return true;
  if (String(err?.code) === "42704") return true;
  if (String(err?.meta?.code) === "42704") return true;
  return false;
}

const auditPlugin: FastifyPluginAsync = async (app) => {
  app.log.info("AUDIT PLUGIN LOADED");

  // Paths that generate too much noise for the audit table
  const AUDIT_SKIP = new Set(["/v1/health", "/health", "/v1/runtime/status"]);

  app.addHook("onSend", async (req, reply, payload) => {
    // Temporary pause (not permanent disable) — auto-retries after window
    if (auditPausedUntil > Date.now()) return payload;

    // Skip noisy polling endpoints and successful GETs (Gemini audit finding)
    const urlPath = req.url.split("?")[0];
    if (AUDIT_SKIP.has(urlPath)) return payload;
    if (req.method === "GET" && reply.statusCode < 400) return payload;

    try {
      const level =
        reply.statusCode >= 500 ? "error" : reply.statusCode >= 400 ? "warn" : "info";

      const requestId = String(req.headers["x-request-id"] ?? req.id ?? "");
      const now = new Date();
      const tenantId = (req as any).tenantId ?? null;
      const action = `${req.method} ${req.url}`;

      // Compute hash chain fields (SOC 2 CC7.2, NIST AU-10)
      let hashFields = { prevHash: "", recordHash: "" };
      try {
        hashFields = await computeAuditHash({
          tenantId,
          action,
          entityId: null,
          timestamp: now,
          actorUserId: null,
        });
      } catch {
        // Non-fatal — hash chain columns may not exist yet
      }

      const base = {
        actorType: "system",
        actorExternalId: null,
        level: level as any,
        action,
        timestamp: now,
        prevHash: hashFields.prevHash || undefined,
        recordHash: hashFields.recordHash || undefined,
      };

      const sharedMeta = {
        source: "api",
        statusCode: reply.statusCode,
        requestId: requestId || undefined,
        ipAddress: (req as any).ip ?? null,
        userAgent: (req.headers["user-agent"] as string) || null,
      };

      await prisma.auditLog.create({
        data: {
          ...base,
          meta: sharedMeta,
        } as any,
      });

    } catch (err) {
      // Never fail the request because audit logging failed.
      app.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");

      // Fallback: write to stderr so events are never fully lost
      const fallback = {
        _audit_fallback: true,
        ts: new Date().toISOString(),
        action: `${req.method} ${req.url}`,
        tenantId: (req as any).tenantId ?? null,
        status: reply.statusCode,
        ip: (req as any).ip ?? null,
      };
      process.stderr.write(JSON.stringify(fallback) + "\n");

      if (isSchemaError(err)) {
        auditPausedUntil = Date.now() + AUDIT_PAUSE_MS;
        if (!warnedOnce) {
          warnedOnce = true;
          app.log.warn(
            `Audit logging paused for ${AUDIT_PAUSE_MS / 1000}s — AuditLevel enum missing. Run prisma migrations/db push to fix.`
          );
        }
      }
    }

    return payload;
  });
};

export default fp(auditPlugin);
