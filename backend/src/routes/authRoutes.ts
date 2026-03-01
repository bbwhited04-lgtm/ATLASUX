/**
 * Auth routes — post-login provisioning for Supabase email/password auth.
 *
 * POST /provision — idempotent: ensures user has a tenant + membership.
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /provision
   * Requires a valid Supabase JWT (authPlugin runs first).
   * If user has no tenant, creates one + TenantMember (owner, free_beta).
   * If user already has a tenant, returns it.
   * Returns { tenantId, seatType, role }
   */
  app.post("/provision", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) {
      return reply.code(401).send({ ok: false, error: "not_authenticated" });
    }

    const userId: string = auth.userId;
    const email: string | null = auth.email ?? null;

    // Check if user already has a tenant membership
    const existing = await prisma.tenantMember.findFirst({
      where: { userId },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (existing) {
      return reply.send({
        ok: true,
        tenantId: existing.tenantId,
        seatType: existing.seatType,
        role: existing.role,
        tenantName: existing.tenant.name,
      });
    }

    // Create a new tenant + membership for this user
    const slug =
      (email?.split("@")[0] ?? userId.slice(0, 8)).replace(/[^a-z0-9-]/gi, "-").toLowerCase() +
      "-" +
      Date.now().toString(36);

    const displayName = email?.split("@")[0] ?? "User";

    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: `${displayName}'s Workspace`,
      },
    });

    await prisma.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId,
        role: "owner",
        seatType: "free_beta",
      },
    });

    // Audit log
    prisma.auditLog
      .create({
        data: {
          tenantId: tenant.id,
          actorType: "user",
          actorUserId: userId,
          level: "info",
          action: "TENANT_PROVISIONED",
          entityType: "tenant",
          entityId: tenant.id,
          message: `Auto-provisioned tenant for ${email ?? userId}`,
          timestamp: new Date(),
        },
      } as any)
      .catch(() => null);

    return reply.send({
      ok: true,
      tenantId: tenant.id,
      seatType: "free_beta",
      role: "owner",
      tenantName: tenant.name,
    });
  });
};
