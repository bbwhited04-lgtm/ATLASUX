import crypto from "crypto";

export function getRequestId(req: any) {
  return (req.headers["x-request-id"] as string) || crypto.randomUUID();
}

export function getClientIp(req: any) {
  // fastify has req.ip if trustProxy is configured; fall back to headers
  return req.ip || (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || null;
}

export function getUserAgent(req: any) {
  return (req.headers["user-agent"] as string) || null;
}

// This is your “truth layer” gate: extract identity from auth/session/api key
export function getActor(req: any) {
  // Adjust to match your auth wiring
  // Examples: req.user from JWT plugin, req.session.userId, etc.
  const user = (req as any).user;

  if (user?.id) {
    return { actorType: "user", actorId: String(user.id) };
  }

  // If you later support API keys / companion approvals, map them here:
  const apiKeyId = (req as any).apiKeyId;
  if (apiKeyId) {
    return { actorType: "api_key", actorId: String(apiKeyId) };
  }

  return { actorType: "anonymous", actorId: null };
}
