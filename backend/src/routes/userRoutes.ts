/**
 * User routes — per-user identity, usage metering, and seat management.
 *
 * Phase 1: /me, /me/tenants, auto-provision on first auth
 * Phase 2: /me/usage, /me/usage/history
 * Phase 3: /me/subscription, /me/seat, /tenants/:id/seats
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { getUsage, getUsageHistory } from "../lib/usageMeter.js";
import { getLimits, SEAT_LIMITS, type SeatTier } from "../lib/seatLimits.js";

export const userRoutes: FastifyPluginAsync = async (app) => {

  // ── Phase 1: Identity ──────────────────────────────────────────────────────

  /**
   * GET /me — current user profile + memberships.
   * Auto-provisions a User record on first call if Supabase auth is present.
   */
  app.get("/me", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) {
      return reply.code(401).send({ ok: false, error: "not_authenticated" });
    }

    // Auto-provision: create User row from Supabase auth data if missing
    let user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        memberships: {
          include: { tenant: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: auth.userId,
          email: auth.email ?? `${auth.userId}@unknown`,
          displayName: auth.email?.split("@")[0] ?? null,
        },
        include: {
          memberships: {
            include: { tenant: { select: { id: true, name: true, slug: true } } },
          },
        },
      });
    }

    const tenantId = String((req as any).tenantId ?? "");
    const currentMembership = user.memberships.find((m) => m.tenantId === tenantId);

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      tenants: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        name: m.tenant?.name ?? m.tenantId,
        slug: m.tenant?.slug ?? null,
        role: m.role,
        seatType: m.seatType,
      })),
      currentSeat: currentMembership?.seatType ?? "free_beta",
    };
  });

  /**
   * PATCH /me — update display name or avatar.
   */
  app.patch("/me", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });

    const body = (req.body ?? {}) as { displayName?: string; avatarUrl?: string };
    const data: Record<string, string> = {};
    if (body.displayName !== undefined) data.displayName = body.displayName;
    if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;

    if (!Object.keys(data).length) {
      return reply.code(400).send({ ok: false, error: "nothing_to_update" });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
    });

    return { ok: true, user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } };
  });

  /**
   * GET /me/tenants — list all tenants the user belongs to.
   */
  app.get("/me/tenants", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });

    const memberships = await prisma.tenantMember.findMany({
      where: { userId: auth.userId },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    return {
      ok: true,
      tenants: memberships.map((m) => ({
        tenantId: m.tenantId,
        name: m.tenant?.name ?? m.tenantId,
        slug: m.tenant?.slug ?? null,
        role: m.role,
        seatType: m.seatType,
      })),
    };
  });

  // ── Phase 2: Usage Metering ────────────────────────────────────────────────

  /**
   * GET /me/usage — current month usage + limits for the active tenant.
   */
  app.get("/me/usage", async (req, reply) => {
    const auth = (req as any).auth;
    const tenantId = String((req as any).tenantId ?? "");
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenant_required" });

    const usage = await getUsage(auth.userId, tenantId);

    // Get seat type for limits
    const member = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: auth.userId } },
    });
    const limits = getLimits(member?.seatType);

    return {
      ok: true,
      usage,
      limits: {
        tokenBudgetPerDay: limits.tokenBudgetPerDay,
        storageLimitBytes: limits.storageLimitBytes,
        agentLimit: limits.agentLimit,
        jobsPerDay: limits.jobsPerDay,
      },
      seatType: member?.seatType ?? "free_beta",
    };
  });

  /**
   * GET /me/usage/history — usage over last N months.
   */
  app.get("/me/usage/history", async (req, reply) => {
    const auth = (req as any).auth;
    const tenantId = String((req as any).tenantId ?? "");
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenant_required" });

    const months = Number((req.query as any)?.months ?? 6);
    const history = await getUsageHistory(auth.userId, tenantId, months);

    return { ok: true, history };
  });

  // ── Phase 3: Billing & Seats ───────────────────────────────────────────────

  /**
   * GET /me/subscription — current subscription info.
   */
  app.get("/me/subscription", async (req, reply) => {
    const auth = (req as any).auth;
    const tenantId = String((req as any).tenantId ?? "");
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenant_required" });

    const sub = await prisma.subscription.findUnique({
      where: { userId_tenantId: { userId: auth.userId, tenantId } },
    });

    if (!sub) {
      // No subscription yet — they're on free_beta
      const limits = getLimits("free_beta");
      return {
        ok: true,
        subscription: null,
        seatType: "free_beta",
        limits,
      };
    }

    const limits = getLimits(sub.seatType);
    return {
      ok: true,
      subscription: {
        id: sub.id,
        seatType: sub.seatType,
        status: sub.status,
        stripeCustomerId: sub.stripeCustomerId,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        canceledAt: sub.canceledAt,
      },
      limits,
    };
  });

  /**
   * GET /pricing — public pricing tiers (no auth required).
   */
  app.get("/pricing", async (_req, reply) => {
    const tiers = Object.entries(SEAT_LIMITS).map(([key, limits]) => ({
      tier: key,
      priceCentsMonthly: limits.priceCentsMonthly,
      priceDisplay: limits.priceCentsMonthly === 0
        ? (key === "enterprise" ? "Custom" : "Free")
        : `$${(limits.priceCentsMonthly / 100).toFixed(0)}/mo`,
      tokenBudgetPerDay: limits.tokenBudgetPerDay,
      storageLimitBytes: limits.storageLimitBytes,
      agentLimit: limits.agentLimit,
      jobsPerDay: limits.jobsPerDay,
    }));

    return { ok: true, tiers };
  });

  /**
   * GET /tenants/:tenantId/seats — seat allocation for a tenant (admin only).
   */
  app.get("/tenants/:tenantId/seats", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });

    const { tenantId } = req.params as { tenantId: string };

    // Check caller is admin/owner of this tenant
    const caller = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: auth.userId } },
    });
    if (!caller || !["admin", "owner"].includes(caller.role)) {
      return reply.code(403).send({ ok: false, error: "admin_required" });
    }

    const members = await prisma.tenantMember.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    const seatCounts: Record<string, number> = {};
    for (const m of members) {
      seatCounts[m.seatType] = (seatCounts[m.seatType] ?? 0) + 1;
    }

    return {
      ok: true,
      totalSeats: members.length,
      seatCounts,
      members: members.map((m) => ({
        userId: m.userId,
        email: m.user?.email ?? null,
        displayName: m.user?.displayName ?? null,
        role: m.role,
        seatType: m.seatType,
        joinedAt: m.createdAt,
      })),
    };
  });

  /**
   * PATCH /tenants/:tenantId/seats/:userId — change a member's seat type (admin only).
   */
  app.patch("/tenants/:tenantId/seats/:userId", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) return reply.code(401).send({ ok: false, error: "not_authenticated" });

    const { tenantId, userId } = req.params as { tenantId: string; userId: string };
    const { seatType } = (req.body ?? {}) as { seatType?: string };

    if (!seatType || !["free_beta", "starter", "pro", "enterprise"].includes(seatType)) {
      return reply.code(400).send({ ok: false, error: "invalid_seat_type" });
    }

    // Check caller is admin/owner
    const caller = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: auth.userId } },
    });
    if (!caller || !["admin", "owner"].includes(caller.role)) {
      return reply.code(403).send({ ok: false, error: "admin_required" });
    }

    const updated = await prisma.tenantMember.update({
      where: { tenantId_userId: { tenantId, userId } },
      data: { seatType: seatType as any },
    });

    // Also upsert subscription record
    await prisma.subscription.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      create: { userId, tenantId, seatType: seatType as any, status: "active" },
      update: { seatType: seatType as any },
    }).catch(() => null);

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: auth.userId,
        actorType: "user",
        level: "info",
        action: "SEAT_CHANGED",
        entityType: "tenant_member",
        entityId: null,
        message: `Seat changed for ${userId}: ${updated.seatType}`,
        meta: { targetUserId: userId, seatType },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return { ok: true, seatType: updated.seatType };
  });
};
