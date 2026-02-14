import type { Env } from "../env.js";
import { paidFetch } from "./paidFetch.js";

export type OpenAIResponsesTextArgs = {
  env: Env;

  org_id?: string | null;
  user_id?: string | null;
  related_job_id?: string | null;

  model?: string; // default gpt-4o-mini
  systemPrompt?: string | null;

  input: Array<{ role: "system" | "user" | "assistant"; content: string }>;

  est_cost_usd?: number | null;
};

export async function openaiResponsesText(args: OpenAIResponsesTextArgs): Promise<{
  request_id?: string;
  model: string;
  output_text: string;
  raw: any;
}> {
  const env = args.env;

  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  const base = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = args.model || "gpt-4o-mini";

  const messages: Array<{ role: string; content: string }> = [];
  if (args.systemPrompt) messages.push({ role: "system", content: args.systemPrompt });
  messages.push(...args.input);

  const payload = {
    model,
    input: messages.map((m) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    })),
    temperature: 0.7,
  };

  const r = await paidFetch<any>({
    env,
    provider: "openai",
    action: "openai.responses.create",
    org_id: args.org_id ?? null,
    user_id: args.user_id ?? null,
    related_job_id: args.related_job_id ?? null,
    est_cost_usd: args.est_cost_usd ?? null,
    url: `${base}/responses`,
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  });

  const data = r.data || {};
  return {
    request_id: data?.id,
    model,
    output_text: (data?.output_text as string) || "",
    raw: data,
  };
}
