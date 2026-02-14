import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export async function tenantsRoutes(app: FastifyInstance) {

  // ✅ GET all tenants
  app.get("/", async (_req, reply) => {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, tenants });
  });

  // ✅ CREATE tenant
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

    try {
      const tenant = await prisma.tenant.create({
        data: { name, slug },
      });

      return reply.send({ ok: true, tenant });

    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        // 🔥 duplicate slug
        return reply.code(409).send({
          ok: false,
          error: "tenant_already_exists",
        });
      }

      throw e;
    }
  });
}
