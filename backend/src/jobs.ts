import type { Env } from "./env.js";
import { prisma } from "./db/prisma.js";
import { z } from "zod";

export const JobTypeSchema = z.enum([
  "analytics.refresh",
  "calendar.import",
  "integrations.discovery",
  "video.generate",
  "generic"
]);

export type JobType = z.infer<typeof JobTypeSchema>;

export async function createJob(env: Env, args: {
  org_id: string;
  user_id: string;
  type: JobType;
  payload?: any;
}) {
  const data = await prisma.job.create({
    data: {
      tenantId: args.org_id,
      requested_by_user_id: args.user_id,
      jobType: args.type,
      status: "queued",
      input: args.payload ?? {},
    },
  });
  return data;
}


export async function listJobs(env: Env, args: {
  org_id: string;
  user_id: string;
  limit?: number;
}) {
  const lim = Math.max(1, Math.min(args.limit ?? 50, 200));
  const data = await prisma.job.findMany({
    where: {
      tenantId: args.org_id,
      requested_by_user_id: args.user_id,
    },
    orderBy: { createdAt: "desc" },
    take: lim,
  });
  return data;
}
