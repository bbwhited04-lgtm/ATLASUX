import type { Env } from "./env";
import { makeSupabase } from "./supabase";
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
  payload: any;
}) {
  const supabase = makeSupabase(env);
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("jobs").insert({
    org_id: args.org_id,
    user_id: args.user_id,
    type: args.type,
    status: "queued",
    payload: args.payload ?? {},
    created_at: now,
    updated_at: now
  }).select("*").single();
  if (error) throw new Error(`jobs insert failed: ${error.message}`);
  return data;
}
