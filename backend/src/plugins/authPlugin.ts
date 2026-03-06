import type { FastifyPluginAsync } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../db/prisma.js";

export const authPlugin: FastifyPluginAsync = async (app) => {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  app.decorateRequest("auth", null);

  app.addHook("preHandler", async (req, reply) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ ok: false, error: "missing_bearer_token" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return reply.code(401).send({ ok: false, error: "invalid_token" });
    }

    // Check token blacklist (HIPAA §164.312(d), NIST IA-11)
    const { createHash } = await import("node:crypto");
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

    const userId = data.user.id;
    const email = data.user.email ?? null;

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
