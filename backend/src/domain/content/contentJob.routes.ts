import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { Env } from "../../env";
import { logBusinessEvent } from "../../audit";
import { executeContentJob } from "./contentJob.executor";
import {
  createContentJob,
  getContentJob,
  listContentJobs,
  updateContentJob,
} from "./contentJob.service";
import { CreateContentJobSchema, UpdateContentJobSchema } from "./contentJob.model";

const ListQuerySchema = z.object({
  org_id: z.string().min(1),
  user_id: z.string().optional(),
  limit: z.coerce.number().optional(),
});

const ExecuteBodySchema = z.object({
  org_id: z.string().min(1),
  user_id: z.string().min(1),
});

/**
 * Register Content Job routes.
 * In src/index.ts:
 *   import { registerContentJobRoutes } from "./domain/content/contentJob.routes";
 *   registerContentJobRoutes(app, env);
 */
export function registerContentJobRoutes(app: Express, env: Env) {
  // ✅ Create a job
  app.post("/v1/content/jobs", async (req: Request, res: Response) => {
    try {
      const body = CreateContentJobSchema.parse(req.body || {});
      const job = await createContentJob(env, body);

      await logBusinessEvent(env, req, {
        actor_type: "user",
        action: "content_job.created",
        entity_type: "content_job",
        entity_id: job.id,
        status: "success",
        metadata: { kind: job.kind, provider: job.provider },
      });

      res.json({ ok: true, job });
    } catch (e: any) {
      res
        .status(400)
        .json({ ok: false, error: e?.message || "content_job_create_failed" });
    }
  });

  // ✅ Execute a job (runs the provider call and updates status/output)
  app.post("/v1/content/jobs/:id/execute", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const body = ExecuteBodySchema.parse(req.body || {});

      const result = await executeContentJob(env, {
        jobId: id,
        orgId: body.org_id,
        userId: body.user_id,
      });

      await logBusinessEvent(env, req, {
        actor_type: "user",
        action: "content_job.executed",
        entity_type: "content_job",
        entity_id: id,
        status: result.ok ? "success" : "failure",
        metadata: {},
      });

      res.json({ ok: true, result });
    } catch (e: any) {
      res
        .status(400)
        .json({ ok: false, error: e?.message || "content_job_execute_failed" });
    }
  });

  // ✅ List jobs
  app.get("/v1/content/jobs", async (req: Request, res: Response) => {
    try {
      const q = ListQuerySchema.parse(req.query);
      const jobs = await listContentJobs(env, {
        org_id: q.org_id,
        user_id: q.user_id,
        limit: q.limit,
      });
      res.json({ ok: true, jobs });
    } catch (e: any) {
      res
        .status(400)
        .json({ ok: false, error: e?.message || "content_job_list_failed" });
    }
  });

  // ✅ Get job by id
  app.get("/v1/content/jobs/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const job = await getContentJob(env, id);
      res.json({ ok: true, job });
    } catch (e: any) {
      res
        .status(404)
        .json({ ok: false, error: e?.message || "content_job_not_found" });
    }
  });

  // ✅ Patch job
  app.patch("/v1/content/jobs/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const patch = UpdateContentJobSchema.parse(req.body || {});
      const job = await updateContentJob(env, id, patch);

      await logBusinessEvent(env, req, {
        actor_type: "user",
        action: "content_job.patched",
        entity_type: "content_job",
        entity_id: job.id,
        status: "success",
        metadata: { status: job.status },
      });

      res.json({ ok: true, job });
    } catch (e: any) {
      res
        .status(400)
        .json({ ok: false, error: e?.message || "content_job_patch_failed" });
    }
  });
}
