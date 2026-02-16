import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const tenantPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
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
