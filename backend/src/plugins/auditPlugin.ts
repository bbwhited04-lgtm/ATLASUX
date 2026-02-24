import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

let auditDisabled = false;
let warnedOnce = false;

function shouldDisableAudit(err: any): boolean {
  const msg = String(err?.message ?? err);
  // Supabase/PG: type "public.AuditLevel" does not exist (code 42704)
  if (msg.includes('type "public.AuditLevel" does not exist')) return true;
  if (msg.includes("AuditLevel") && msg.includes("does not exist")) return true;
  if (String(err?.code) === "42704") return true;
  if (String(err?.meta?.code) === "42704") return true;
  return false;
}

const auditPlugin: FastifyPluginAsync = async (app) => {
  app.log.info("AUDIT PLUGIN LOADED");

  app.addHook("onSend", async (req, reply, payload) => {
    if (auditDisabled) return payload;

    try {
      const level =
        reply.statusCode >= 500 ? "error" : reply.statusCode >= 400 ? "warn" : "info";

      const requestId = String(req.headers["x-request-id"] ?? req.id ?? "");

      const base = {
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: null,
        level: level as any,
        action: `${req.method} ${req.url}`,
      };

      const sharedMeta = {
        source: "api",
        statusCode: reply.statusCode,
        requestId: requestId || undefined,
        ipAddress: (req as any).ip ?? null,
        userAgent: (req.headers["user-agent"] as string) || null,
      };

      // Attempt 1: schema with status/ip/userAgent/metadata as top-level columns
      try {
        await prisma.auditLog.create({
          data: {
            ...base,
            status: reply.statusCode >= 400 ? "FAILED" : "SUCCESS",
            ipAddress: sharedMeta.ipAddress,
            userAgent: sharedMeta.userAgent,
            metadata: sharedMeta,
          } as any,
        });
      } catch (_e1) {
        // Attempt 2: schema where everything is stored in a single JSON field (meta)
        await prisma.auditLog.create({
          data: {
            ...base,
            meta: sharedMeta,
          } as any,
        });
      }

    } catch (err) {
      // Never fail the request because audit logging failed.
      app.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");

      // If the database schema isn't ready (missing enum type), disable audit to stop spamming logs.
      if (shouldDisableAudit(err)) {
        auditDisabled = true;
        if (!warnedOnce) {
          warnedOnce = true;
          app.log.warn(
            "Audit logging disabled because AuditLevel enum/type is missing in Postgres. Run prisma migrations/db push to create it."
          );
        }
      }
    }

    return payload;
  });
};

export default fp(auditPlugin);
