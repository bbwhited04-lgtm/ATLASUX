import OpenAI from "openai";
import { writeLedgerEvent } from "./ledger.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function calcCostUSD(model: string, usage?: { prompt_tokens?: number; completion_tokens?: number }) {
  // Optional: if you don’t want pricing math yet, return undefined.
  // If you DO want it: keep a price table here and compute.
  // For now, we’ll store tokens and leave amount at 0.
  return undefined;
}

export async function openaiChat(args: {
  model: string;
  messages: any[];
  relatedId?: string;
  metadata?: Record<string, any>;
}) {
  const start = Date.now();
  let status: "SUCCESS" | "FAILED" = "SUCCESS";
  let usage: any = null;
  let modelUsed = args.model;

  try {
    const res = await openai.chat.completions.create({
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
