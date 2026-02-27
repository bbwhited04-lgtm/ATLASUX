import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

/**
 * Cloud Seat gate routes.
 *
 * Public:
 *   POST /validate  — check if a gate code is valid (called by AppGate)
 *
 * Admin (requires x-gate-admin-key header matching GATE_ADMIN_KEY env):
 *   GET    /seats              — list all cloud seats
 *   POST   /seats              — create a new cloud seat
 *   PATCH  /seats/:id/revoke   — revoke a seat (instant, no redeploy)
 *   PATCH  /seats/:id/restore  — restore a revoked seat
 */

function isAdmin(req: any): boolean {
  const key = process.env.GATE_ADMIN_KEY?.trim();
  if (!key) return false;
  const header = (req.headers["x-gate-admin-key"] ?? "").toString().trim();
  return header === key;
}

export const gateRoutes: FastifyPluginAsync = async (app) => {

  // ── Public: validate a gate code ──────────────────────────────────────────
  app.post("/validate", async (req, reply) => {
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== "string") {
      return reply.code(400).send({ valid: false, error: "missing_code" });
    }

    const trimmed = code.trim();

    // Check owner code first (baked env var — always valid)
    const ownerCode = (process.env.VITE_APP_GATE_CODE ?? "").trim();
    if (ownerCode && trimmed === ownerCode) {
      return { valid: true, seat: { label: "Owner", role: "owner" } };
    }

    // Check cloud seats in DB
    const seat = await prisma.cloudSeat.findUnique({ where: { code: trimmed } });

    if (!seat) {
      return reply.code(401).send({ valid: false, error: "invalid_code" });
    }

    if (!seat.active) {
      return reply.code(403).send({ valid: false, error: "seat_revoked", revokedAt: seat.revokedAt });
    }

    // Log gate entry to audit_log so owner can see who's in
    const ip = req.headers["x-forwarded-for"] ?? req.ip ?? "unknown";
    const ua = req.headers["user-agent"] ?? "unknown";
    await prisma.auditLog.create({
      data: {
        tenantId: "00000000-0000-0000-0000-000000000000",
        actorUserId: null,
        actorExternalId: seat.id,
        actorType: "cloud_seat",
        level: "info",
        action: "GATE_ENTRY",
        entityType: "cloud_seat",
        entityId: seat.id,
        message: `[GATE] ${seat.label} entered via cloud seat (${seat.role})`,
        meta: { seatId: seat.id, label: seat.label, role: seat.role, ip, ua },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return {
      valid: true,
      seat: {
        id: seat.id,
        label: seat.label,
        role: seat.role,
      },
    };
  });

  // ── Admin: recent gate entries (who logged in and when) ─────────────────
  app.get("/activity", async (req, reply) => {
    if (!isAdmin(req)) return reply.code(403).send({ ok: false, error: "forbidden" });

    const entries = await prisma.auditLog.findMany({
      where: { action: "GATE_ENTRY" },
      orderBy: { timestamp: "desc" },
      take: 50,
      select: {
        timestamp: true,
        message: true,
        meta: true,
      },
    });

    return { ok: true, entries };
  });

  // ── Admin: list all cloud seats ───────────────────────────────────────────
  app.get("/seats", async (req, reply) => {
    if (!isAdmin(req)) return reply.code(403).send({ ok: false, error: "forbidden" });

    const seats = await prisma.cloudSeat.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { ok: true, seats };
  });

  // ── Admin: create a new cloud seat ────────────────────────────────────────
  app.post("/seats", async (req, reply) => {
    if (!isAdmin(req)) return reply.code(403).send({ ok: false, error: "forbidden" });

    const { code, label, email, role, meta } = req.body as {
      code: string;
      label: string;
      email?: string;
      role?: string;
      meta?: Record<string, unknown>;
    };

    if (!code?.trim() || !label?.trim()) {
      return reply.code(400).send({ ok: false, error: "code and label are required" });
    }

    // Check for duplicate
    const existing = await prisma.cloudSeat.findUnique({ where: { code: code.trim() } });
    if (existing) {
      return reply.code(409).send({ ok: false, error: "code_already_exists", seatId: existing.id });
    }

    const seat = await prisma.cloudSeat.create({
      data: {
        code:  code.trim(),
        label: label.trim(),
        email: email?.trim() || null,
        role:  role?.trim() || "collaborator",
        meta:  (meta ?? {}) as any,
      },
    });

    return reply.code(201).send({ ok: true, seat });
  });

  // ── Admin: revoke a cloud seat ────────────────────────────────────────────
  app.patch("/seats/:id/revoke", async (req, reply) => {
    if (!isAdmin(req)) return reply.code(403).send({ ok: false, error: "forbidden" });

    const { id } = req.params as { id: string };

    const seat = await prisma.cloudSeat.findUnique({ where: { id } });
    if (!seat) return reply.code(404).send({ ok: false, error: "seat_not_found" });

    if (!seat.active) {
      return reply.code(400).send({ ok: false, error: "already_revoked", revokedAt: seat.revokedAt });
    }

    const updated = await prisma.cloudSeat.update({
      where: { id },
      data:  { active: false, revokedAt: new Date() },
    });

    return { ok: true, seat: updated };
  });

  // ── Admin: restore a revoked seat ─────────────────────────────────────────
  app.patch("/seats/:id/restore", async (req, reply) => {
    if (!isAdmin(req)) return reply.code(403).send({ ok: false, error: "forbidden" });

    const { id } = req.params as { id: string };

    const seat = await prisma.cloudSeat.findUnique({ where: { id } });
    if (!seat) return reply.code(404).send({ ok: false, error: "seat_not_found" });

    if (seat.active) {
      return reply.code(400).send({ ok: false, error: "already_active" });
    }

    const updated = await prisma.cloudSeat.update({
      where: { id },
      data:  { active: true, revokedAt: null },
    });

    return { ok: true, seat: updated };
  });
};
