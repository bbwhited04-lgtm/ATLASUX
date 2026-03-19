/**
 * Treatment Routes — REST API for the video treatment pipeline.
 *
 * POST /treatments        — Create a new treatment
 * GET  /treatments        — List treatments for tenant
 * GET  /treatments/:id    — Get treatment status + clips
 * POST /treatments/:id/approve — Approve or reject at gate
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { createTreatment, canStartTreatment } from "../services/treatment/orchestrator.js";

const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;

const CreateTreatmentSchema = z.object({
  sourceUrl: z.string().url().refine((url) => YOUTUBE_URL_RE.test(url), {
    message: "Only YouTube URLs are supported",
  }),
});

export const treatmentRoutes: FastifyPluginAsync = async (app) => {
  // POST /treatments — Create new treatment
  app.post("/treatments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string | undefined;

    const parsed = CreateTreatmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const check = await canStartTreatment(tenantId);
    if (!check.ok) {
      return reply.status(429).send({ error: check.reason });
    }

    const id = await createTreatment(tenantId, parsed.data.sourceUrl, userId);
    return reply.status(201).send({ id, status: "queued" });
  });

  // GET /treatments — List treatments for tenant
  app.get("/treatments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const treatments = await prisma.treatment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sourceUrl: true,
        sourceTitle: true,
        status: true,
        stage: true,
        clipCount: true,
        costEstimate: true,
        costActual: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return reply.send({ treatments });
  });

  // GET /treatments/:id — Get treatment details + clips
  app.get("/treatments/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };

    const treatment = await prisma.treatment.findFirst({
      where: { id, tenantId },
      include: {
        clips: {
          orderBy: { score: "desc" },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            score: true,
            transcript: true,
            status: true,
            viduModel: true,
            viduCost: true,
            outputPath: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!treatment) return reply.status(404).send({ error: "Treatment not found" });
    return reply.send({ treatment });
  });

  // POST /treatments/:id/approve — Approve or reject at gate
  app.post("/treatments/:id/approve", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };
    const body = req.body as { action: "approve" | "reject"; clipIds?: string[] };

    const treatment = await prisma.treatment.findFirst({
      where: { id, tenantId, status: { in: ["awaiting_approval", "awaiting_publish"] } },
    });

    if (!treatment) {
      return reply.status(404).send({ error: "Treatment not found or not awaiting approval" });
    }

    const titlePrefix = treatment.status === "awaiting_approval"
      ? "[TREATMENT_APPROVAL]"
      : "[TREATMENT_PUBLISH]";

    const memo = await prisma.decisionMemo.findFirst({
      where: {
        tenantId,
        title: { startsWith: titlePrefix },
        payload: { path: ["treatmentId"], equals: id },
        status: { in: ["PROPOSED", "AWAITING_HUMAN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!memo) {
      return reply.status(404).send({ error: "No pending approval memo found" });
    }

    if (body.action === "approve") {
      const payload = body.clipIds
        ? { ...(memo.payload as any), approvedClipIds: body.clipIds }
        : memo.payload;

      await prisma.decisionMemo.update({
        where: { id: memo.id },
        data: { status: "APPROVED", payload },
      });
    } else {
      await prisma.decisionMemo.update({
        where: { id: memo.id },
        data: { status: "REJECTED" },
      });
    }

    return reply.send({ ok: true, action: body.action });
  });
};
