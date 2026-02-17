import type { FastifyPluginAsync } from "fastify";
import { createClient } from "@supabase/supabase-js";

export const authPlugin: FastifyPluginAsync = async (app) => {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const rawUrl = process.env.SUPABASE_URL ?? "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  console.log("[authPlugin] env check", {
  hasSupabaseUrl: rawUrl.trim().length > 0,
  supabaseUrlLen: rawUrl.trim().length,
  hasServiceKey: rawKey.trim().length > 0,
  serviceKeyLen: rawKey.trim().length,
});

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

    // Attach user info to request
    (req as any).auth = {
      userId: data.user.id,
      email: data.user.email ?? null,
    };
  });
};
