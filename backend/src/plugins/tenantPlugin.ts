import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

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
 * When auth IS wired (req.auth.userId), membership is verified and
 * req.tenantRole is set. In alpha (no auth) the member check is skipped.
 */
const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, _reply) => {
    if (req.method === "OPTIONS") return;

    // Read from header first, then query param fallback
    const headerTenantId = String(req.headers["x-tenant-id"] ?? "").trim();
    const queryTenantId  = String((req.query as any)?.tenantId ?? "").trim();
    const tenantId = headerTenantId || queryTenantId;

    if (!tenantId) return; // Nothing to set — routes check req.tenantId themselves

    const userId = (req as any).auth?.userId ?? null;

    // Alpha mode: when auth is not wired, skip the member check entirely
    if (userId) {
      try {
        const member = await prisma.tenantMember.findUnique({
          where: { tenantId_userId: { tenantId, userId } },
        });
        if (member) {
          (req as any).tenantRole = member.role;
        }
        // Non-members: still set tenantId (alpha tolerance), but no role
      } catch {
        // Member check failure is non-fatal in alpha
      }
    }

    (req as any).tenantId = tenantId;
  });
};

// fp() makes the hook global — without it, Fastify scopes the hook
// to the plugin's child context and routes never see it.
export const tenantPlugin = fp(plugin);
