import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";

export async function tenantsRoutes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    const body = req.body as any;

    const name = String(body?.name ?? "").trim();
    const slug =
      body?.slug ??
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (!name) {
      return reply.code(400).send({ ok: false, error: "name_required" });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    return reply.send({ ok: true, tenant });
  });
}
