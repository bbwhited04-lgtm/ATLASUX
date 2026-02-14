import { z } from "zod";

export const ContentJobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
]);

export type ContentJobStatus = z.infer<typeof ContentJobStatusSchema>;

export const ContentJobProviderSchema = z.enum(["openai", "deepseek", "unknown"]);
export type ContentJobProvider = z.infer<typeof ContentJobProviderSchema>;

export const ContentJobKindSchema = z.enum([
  "social.post",
  "social.caption",
  "social.hashtags",
  "email.draft",
  "summary",
  "generic",
]);
export type ContentJobKind = z.infer<typeof ContentJobKindSchema>;

export const ContentJobSchema = z.object({
  id: z.string().min(1),
  org_id: z.string().min(1),
  user_id: z.string().min(1),

  kind: ContentJobKindSchema.default("generic"),
  provider: ContentJobProviderSchema.default("unknown"),
  model: z.string().nullable().optional(),

  status: ContentJobStatusSchema.default("queued"),

  input: z.any().nullable().optional(),
  output: z.any().nullable().optional(),

  error: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),

  est_cost_usd: z.number().nullable().optional(),
  actual_cost_usd: z.number().nullable().optional(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ContentJob = z.infer<typeof ContentJobSchema>;

export const CreateContentJobSchema = z.object({
  org_id: z.string().min(1),
  user_id: z.string().min(1),

  kind: ContentJobKindSchema.optional(),
  provider: ContentJobProviderSchema.optional(),
  model: z.string().nullable().optional(),

  input: z.any().nullable().optional(),
  est_cost_usd: z.number().nullable().optional(),
});

export type CreateContentJobInput = z.infer<typeof CreateContentJobSchema>;

export const UpdateContentJobSchema = z.object({
  status: ContentJobStatusSchema.optional(),
  output: z.any().nullable().optional(),
  error: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),
  actual_cost_usd: z.number().nullable().optional(),
  model: z.string().nullable().optional(),
  provider: ContentJobProviderSchema.optional(),
});

export type UpdateContentJobInput = z.infer<typeof UpdateContentJobSchema>;
