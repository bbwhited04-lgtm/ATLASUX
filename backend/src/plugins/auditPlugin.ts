import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

const auditPlugin: FastifyPluginAsync = async (app) => {
  console.log("AUDIT PLUGIN LOADED");

  app.addHook("onSend", async (req, reply, payload) => {
    console.log("AUDIT HOOK FIRED", req.method, req.url);

    try {
      const level =
        reply.statusCode >= 500
          ? "error"
          : reply.statusCode >= 400
            ? "warn"
            : "info";

      await prisma.auditLog.create({
  data: {
    actorType: "system",
    actorUserId: null,          // or a uuid when you have it
    actorExternalId: null,
    level,
    action: `${req.method} ${req.url}`,
    meta: {
      source: "api",
      statusCode: reply.statusCode,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
    },
  },
});
    } catch (err) {
      console.error("AUDIT DB WRITE FAILED", err);
    }

    return payload;
  });
};

export default fp(auditPlugin);
