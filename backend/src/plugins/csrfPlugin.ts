import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import cookie from "@fastify/cookie";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

const SKIP_PREFIXES = [
  "/v1/billing/stripe/webhook",
  "/v1/stripe/webhook",
  "/v1/oauth/",
  "/v1/discord/webhook",
  "/v1/meta/deletion",
  "/v1/google/deletion",
  "/v1/x/webhook",
  "/v1/tiktok/webhook",
  "/v1/telegram/webhook",
  "/v1/linkedin/webhook",
  "/v1/alignable/webhook",
  "/v1/tumblr/webhook",
  "/v1/pinterest/webhook",
  "/v1/teams/webhook",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const csrfPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie);

  app.addHook("onRequest", async (req, reply) => {
    const method = req.method.toUpperCase();

    // Non-mutating: set the cookie so the frontend can read it
    if (!MUTATING_METHODS.has(method)) {
      if (!req.cookies[CSRF_COOKIE]) {
        const token = randomBytes(32).toString("hex");
        reply.setCookie(CSRF_COOKIE, token, {
          path: "/",
          httpOnly: false,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        });
      }
      return;
    }

    // Mutating: check if this route is exempt
    for (const prefix of SKIP_PREFIXES) {
      if (req.url.startsWith(prefix)) return;
    }

    // Validate double-submit
    const cookieToken = req.cookies[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return reply.code(403).send({ ok: false, error: "CSRF token mismatch" });
    }
  });
};

export default csrfPlugin;
