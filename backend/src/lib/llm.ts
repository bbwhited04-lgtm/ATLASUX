import OpenAI from "openai";
import { writeLedgerEvent } from "./ledger.js";

/**
 * Create an OpenAI client for the given API key.
 * Callers should resolve the key via credentialResolver first.
 */
export function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

function calcCostUSD(model: string, usage?: { prompt_tokens?: number; completion_tokens?: number }) {
  // Optional: if you don't want pricing math yet, return undefined.
  // If you DO want it: keep a price table here and compute.
  // For now, we'll store tokens and leave amount at 0.
  return undefined;
}

export async function openaiChat(args: {
  apiKey: string;
  model: string;
  messages: any[];
  relatedId?: string;
  metadata?: Record<string, any>;
}) {
  const client = getOpenAIClient(args.apiKey);
  const start = Date.now();
  let status: "SUCCESS" | "FAILED" = "SUCCESS";
  let usage: any = null;
  let modelUsed = args.model;

  try {
    const res = await client.chat.completions.create({
      model: args.model,
      messages: args.messages,
    });

    usage = res.usage ?? null;
    modelUsed = res.model ?? args.model;
    return res;
  } catch (err: any) {
    status = "FAILED";
    throw err;
  } finally {
    const latencyMs = Date.now() - start;

    await writeLedgerEvent({
      eventType: "LLM_TOKENS",
      provider: "OpenAI",
      status,
      // amount: calcCostUSD(modelUsed, usage), // enable when you want real $ tracking
      relatedJobId: args.relatedId,
      metadata: {
        ...args.metadata,
        model: modelUsed,
        latencyMs,
        usage,                 // stores prompt/completion/total tokens if present
      },
    });
  }
}
