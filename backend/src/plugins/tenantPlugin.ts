import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const tenantPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    // Always allow CORS preflight
    if (req.method === "OPTIONS") return;

    // Allow audit + health endpoints without tenant enforcement (alpha-safe).
    // This prevents the UI from rendering "blank" when x-tenant-id isn't wired yet.
    const url = req.url || "";
    if (
      url.startsWith("/v1/") &&
      (
        url.startsWith("/v1/audit") ||
        url.startsWith("/v1/health") ||
        url.startsWith("/v1/email/inbound") ||
        url === "/v1"
      )
    ) {
      return;
    }

    const tenantId = String(req.headers["x-tenant-id"] ?? "").trim();
    const userId = (req as any).auth?.userId;

    if (!tenantId) {
      return reply.code(400).send({ ok: false, error: "missing_x_tenant_id" });
    }

    const member = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    if (!member) {
      return reply.code(403).send({ ok: false, error: "not_a_tenant_member" });
    }

    (req as any).tenantId = tenantId;
    (req as any).tenantRole = member.role;
  });
};
