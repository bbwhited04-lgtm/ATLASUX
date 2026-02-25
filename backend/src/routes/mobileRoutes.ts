import { randomBytes } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

interface PairingEntry {
  code:      string;
  tenantId:  string;
  createdAt: number;
  status:    "pending" | "confirmed";
  deviceInfo?: { name: string; os: string };
}

// In-memory pairing store — same pattern as PKCE store in oauthRoutes.ts.
// Codes expire after 10 minutes; confirmed entries are cleaned up on next prune.
const pairingStore = new Map<string, PairingEntry>();
const PAIRING_TTL_MS = 10 * 60 * 1000;

function pruneExpired() {
  const cutoff = Date.now() - PAIRING_TTL_MS;
  for (const [k, v] of pairingStore.entries()) {
    if (v.createdAt < cutoff) pairingStore.delete(k);
  }
}

function genCode(): string {
  // Format: AX-XXXX-XXXX (hex-derived, human-readable)
  const hex = randomBytes(4).toString("hex").toUpperCase();
  return `AX-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export const mobileRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/mobile/pair/start
   * Generates a pairing code for this tenant. Any existing pending code is
   * replaced. The code is valid for 10 minutes.
   */
  app.post("/pair/start", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    pruneExpired();

    // Evict any existing pending code for this tenant
    for (const [k, v] of pairingStore.entries()) {
      if (v.tenantId === tenantId && v.status === "pending") pairingStore.delete(k);
    }

    const code = genCode();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();
    pairingStore.set(code, { code, tenantId, createdAt: Date.now(), status: "pending" });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: null,
        level: "info",
        action: "MOBILE_PAIR_STARTED",
        entityType: "mobile_pair",
        entityId: code,
        message: "Mobile pairing session started",
        meta: { code, expiresAt },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, code, expiresAt });
  });

  /**
   * GET /v1/mobile/pair/status/:code
   * Poll the status of a pairing code. Returns "pending", "confirmed", or "expired".
   */
  app.get("/pair/status/:code", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const { code } = req.params as { code: string };
    pruneExpired();

    const entry = pairingStore.get(code);
    if (!entry) return reply.send({ ok: true, status: "expired" });
    if (entry.tenantId !== tenantId) return reply.code(403).send({ ok: false, error: "FORBIDDEN" });

    return reply.send({
      ok: true,
      status: entry.status,
      deviceInfo: entry.deviceInfo ?? null,
    });
  });

  /**
   * POST /v1/mobile/pair/confirm/:code
   * Called by the mobile app to confirm the pairing. Body may include
   * { deviceName, os } for display purposes.
   */
  app.post("/pair/confirm/:code", async (req, reply) => {
    const { code } = req.params as { code: string };
    const body = (req.body as any) ?? {};

    pruneExpired();

    const entry = pairingStore.get(code);
    if (!entry || entry.status !== "pending") {
      return reply.code(404).send({ ok: false, error: "CODE_NOT_FOUND_OR_EXPIRED" });
    }

    entry.status = "confirmed";
    entry.deviceInfo = {
      name: String(body.deviceName ?? "iPhone").slice(0, 60),
      os:   String(body.os ?? "iOS").slice(0, 40),
    };

    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: null,
        level: "info",
        action: "MOBILE_PAIR_CONFIRMED",
        entityType: "mobile_pair",
        entityId: code,
        message: `Mobile device paired: ${entry.deviceInfo.name}`,
        meta: { code, deviceName: entry.deviceInfo.name, os: entry.deviceInfo.os },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });

  /**
   * DELETE /v1/mobile/pair/:code
   * Cancel or unpair an existing pairing code.
   */
  app.delete("/pair/:code", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const { code } = req.params as { code: string };
    const entry = pairingStore.get(code);
    if (entry && entry.tenantId === tenantId) {
      pairingStore.delete(code);
    }

    return reply.send({ ok: true });
  });
};
