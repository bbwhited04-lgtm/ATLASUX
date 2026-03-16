import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { createVerify, createPublicKey, createHash } from "node:crypto";
import * as jose from "jose";

/**
 * Self-managed JWT auth plugin.
 * Verifies tokens signed with JWT_SECRET (HS256).
 */
export const authPlugin: FastifyPluginAsync = async (app) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    app.log.warn("JWT_SECRET not set — auth will reject all requests");
  }

  app.decorateRequest("auth", null);

  app.addHook("preHandler", async (req, reply) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ ok: false, error: "missing_bearer_token" });
    }

    if (!jwtSecret) {
      return reply.code(503).send({ ok: false, error: "auth_not_configured" });
    }

    // Verify JWT
    let payload: jose.JWTPayload;
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload: p } = await jose.jwtVerify(token, secret, {
        issuer: "atlasux",
        audience: "atlasux-api",
      });
      payload = p;
    } catch {
      return reply.code(401).send({ ok: false, error: "invalid_token" });
    }

    // Check token blacklist (HIPAA §164.312(d), NIST IA-11)
    const tokenHash = createHash("sha256").update(token).digest("hex");
    try {
      const revoked = await prisma.revokedToken.findUnique({ where: { tokenHash } });
      if (revoked && revoked.expiresAt > new Date()) {
        return reply.code(401).send({ ok: false, error: "token_revoked" });
      }
    } catch {
      // Fail-closed: if blacklist check fails, reject the request (503)
      return reply.code(503).send({ ok: false, error: "token_blacklist_unavailable" });
    }

    const userId = payload.sub ?? (payload as any).userId;
    const email = (payload as any).email ?? null;

    if (!userId) {
      return reply.code(401).send({ ok: false, error: "invalid_token_payload" });
    }

    // Auto-provision User record on first auth (Phase 1)
    try {
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: email ?? `${userId}@unknown`,
          displayName: email?.split("@")[0] ?? null,
        },
        update: {},  // no-op if exists
      });
    } catch {
      // Non-fatal — User table may not exist during migration window
    }

    // Attach user info to request
    (req as any).auth = {
      userId,
      email,
    };
  });
};
