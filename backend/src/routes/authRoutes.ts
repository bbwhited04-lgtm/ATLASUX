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

  /**
   * POST /logout
   * Revokes the current JWT by adding its hash to the blacklist.
   * Controls: HIPAA §164.312(d), NIST IA-11, SOC 2 CC6.1, PCI 8.1.8
   */
  app.post("/logout", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) {
      return reply.code(401).send({ ok: false, error: "not_authenticated" });
    }

    const token = (req.headers.authorization ?? "").replace("Bearer ", "");
    if (!token) {
      return reply.code(400).send({ ok: false, error: "no_token" });
    }

    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // JWT max lifetime: 1 hour (Supabase default). Blacklist entry expires after that.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.revokedToken.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: { revokedAt: new Date() },
    }).catch(() => null);

    // Audit log
    prisma.auditLog.create({
      data: {
        tenantId: (req as any).tenantId ?? null,
        actorType: "user",
        actorUserId: auth.userId,
        level: "info",
        action: "SESSION_TERMINATED",
        entityType: "auth",
        message: `User ${auth.email ?? auth.userId} logged out`,
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });
};
