import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { meterApiCall } from "../lib/usageMeter.js";

/**
 * Global tenant resolution plugin (alpha-safe).
 *
 * Reads tenantId from:
 *   1. x-tenant-id request header  (preferred — set by frontend once wired)
 *   2. tenantId query param         (fallback — current frontend behaviour)
 *
 * Sets req.tenantId so every route handler can use it.
 * Never blocks a request on its own — routes enforce their own requirements.
 *
 * When auth IS wired (req.auth.userId), membership is verified,
 * req.tenantRole and req.seatType are set. In alpha (no auth)
 * the member check is skipped.
 *
 * Phase 2: Also meters the API call for the authenticated user.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    if (req.method === "OPTIONS") return;

    // Read from header first, then query param fallback
    const headerTenantId = String(req.headers["x-tenant-id"] ?? "").trim();
    const queryTenantId  = String((req.query as any)?.tenantId ?? "").trim();
    const tenantId = headerTenantId || queryTenantId;

    if (!tenantId) return; // Nothing to set — routes check req.tenantId themselves

    // Validate UUID format to prevent SQL injection via RLS session variable
    if (!UUID_RE.test(tenantId)) {
      return reply.code(400).send({ ok: false, error: "INVALID_TENANT_ID" });
    }

    const userId = (req as any).auth?.userId ?? null;

    if (userId) {
      try {
        const member = await prisma.tenantMember.findUnique({
          where: { tenantId_userId: { tenantId, userId } },
        });
        if (member) {
          (req as any).tenantRole = member.role;
          (req as any).seatType = member.seatType;
        } else {
          // Authenticated user is not a member of this tenant — hard reject
          return reply.code(403).send({ ok: false, error: "TENANT_ACCESS_DENIED" });
        }
      } catch {
        // Member check unavailable — fail closed
        return reply.code(503).send({ ok: false, error: "TENANT_CHECK_UNAVAILABLE" });
      }

      // Phase 2: meter this API call (fire-and-forget)
      meterApiCall(userId, tenantId);
    }

    (req as any).tenantId = tenantId;
  });
};

// fp() makes the hook global — without it, Fastify scopes the hook
// to the plugin's child context and routes never see it.
export const tenantPlugin = fp(plugin);
