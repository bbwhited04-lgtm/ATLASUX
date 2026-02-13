import type { Env } from "../../env";
import { makeSupabase } from "../../supabase";
import { logSystemEvent } from "../../audit";
import { writeLedgerEvent } from "../../ledger";
import {
  ContentJobSchema,
  CreateContentJobSchema,
  UpdateContentJobSchema,
  type CreateContentJobInput,
  type UpdateContentJobInput,
} from "./contentJob.model";

function isoNow() {
  return new Date().toISOString();
}

/**
 * Table: public.content_jobs
 * See backend/sql/001_content_jobs.sql
 */

export async function createContentJob(env: Env, raw: CreateContentJobInput) {
  const args = CreateContentJobSchema.parse(raw);
  const supabase = makeSupabase(env);
  const now = isoNow();

  const row = {
    org_id: args.org_id,
    user_id: args.user_id,
    kind: args.kind ?? "generic",
    provider: args.provider ?? "unknown",
    model: args.model ?? null,
    status: "queued",
    input: args.input ?? null,
    output: null,
    error: null,
    request_id: null,
    est_cost_usd: args.est_cost_usd ?? null,
    actual_cost_usd: null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("content_jobs")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(`content_jobs insert failed: ${error.message}`);

  const job = ContentJobSchema.parse(data);

  await logSystemEvent(env, {
    actor_type: "system",
    action: "content_job.create",
    entity_type: "content_job",
    entity_id: job.id,
    status: "success",
    metadata: { kind: job.kind, provider: job.provider },
    org_id: job.org_id,
    actor_id: job.user_id,
  });

  return job;
}

export async function getContentJob(env: Env, id: string) {
  const supabase = makeSupabase(env);
  const { data, error } = await supabase
    .from("content_jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`content_job_get_failed: ${error.message}`);
  return ContentJobSchema.parse(data);
}

export async function listContentJobs(
  env: Env,
  args: { org_id: string; user_id?: string; limit?: number }
) {
  const supabase = makeSupabase(env);
  const lim = Math.max(1, Math.min(args.limit ?? 50, 200));

  let q = supabase
    .from("content_jobs")
    .select("*")
    .eq("org_id", args.org_id)
    .order("created_at", { ascending: false })
    .limit(lim);

  if (args.user_id) q = q.eq("user_id", args.user_id);

  const { data, error } = await q;
  if (error) throw new Error(`content_job_list_failed: ${error.message}`);

  return (data ?? []).map((r: any) => ContentJobSchema.parse(r));
}

export async function updateContentJob(
  env: Env,
  id: string,
  raw: UpdateContentJobInput
) {
  const patch = UpdateContentJobSchema.parse(raw);
  const supabase = makeSupabase(env);

  const row: any = { updated_at: isoNow() };

  if (patch.status) row.status = patch.status;
  if ("output" in patch) row.output = patch.output ?? null;
  if ("error" in patch) row.error = patch.error ?? null;
  if ("request_id" in patch) row.request_id = patch.request_id ?? null;
  if ("actual_cost_usd" in patch) row.actual_cost_usd = patch.actual_cost_usd ?? null;
  if ("model" in patch) row.model = patch.model ?? null;
  if (patch.provider) row.provider = patch.provider;

  const { data, error } = await supabase
    .from("content_jobs")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`content_job_update_failed: ${error.message}`);

  const job = ContentJobSchema.parse(data);

  await logSystemEvent(env, {
    actor_type: "system",
    action: "content_job.update",
    entity_type: "content_job",
    entity_id: job.id,
    status: "success",
    metadata: { status: job.status },
    org_id: job.org_id,
    actor_id: job.user_id,
  });

  // If we have actual cost, write a ledger spend event correlated to the job id.
  if (patch.actual_cost_usd != null) {
    await writeLedgerEvent(env, {
      event_type: "spend",
      amount: Number(patch.actual_cost_usd),
      currency: "USD",
      status: "recorded",
      related_job_id: job.id,
      provider: job.provider ?? null,
      metadata: { kind: job.kind, model: job.model ?? null },
      org_id: job.org_id,
      user_id: job.user_id,
    });
  }

  return job;
}
