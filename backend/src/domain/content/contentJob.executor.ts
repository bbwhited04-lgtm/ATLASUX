import type { Env } from "../../env";
import { openaiResponsesText } from "../../integrations/openai.client";
import { updateContentJob } from "./contentJob.service";

export async function executeContentJob(
  env: Env,
  args: {
    jobId: string;
    orgId: string;
    userId: string;
  }
) {
  const { jobId, orgId, userId } = args;

  // 1️⃣ mark running
  await updateContentJob(env, jobId, {
    status: "running",
  });

  try {
    // 2️⃣ call OpenAI (goes through paidFetch)
    const response = await openaiResponsesText({
      env,
      org_id: orgId,
      user_id: userId,
      related_job_id: jobId,
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: "Generate a short social media post about Atlas UX."
        }
      ],
      // optional early estimate
      est_cost_usd: 0.01
    });

    // 3️⃣ update job with result
    await updateContentJob(env, jobId, {
      status: "succeeded",
      output: {
        text: response.output_text,
        model: response.model,
        request_id: response.request_id ?? null
      },
      actual_cost_usd: 0.01 // replace later with token-based calc
    });

    return { ok: true };
  } catch (err: any) {
    await updateContentJob(env, jobId, {
      status: "failed",
      error: err?.message ?? "execution_failed"
    });

    return { ok: false };
  }
}
