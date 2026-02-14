import type { Env } from "./env.js";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatRequest = {
  provider: "openai" | "deepseek";
  model?: string;
  messages: ChatMessage[];
  // Optional: force "Atlas persona" etc
  systemPrompt?: string | null;
};

export type ChatResponse = {
  provider: "openai" | "deepseek";
  model: string;
  request_id?: string;
  content: string;
};

function requireKey(provider: "openai" | "deepseek", env: Env): string {
  if (provider === "openai") {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    return env.OPENAI_API_KEY;
  }
  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not set");
  return env.DEEPSEEK_API_KEY;
}

export async function runChat(req: ChatRequest, env: Env): Promise<ChatResponse> {
  const provider = req.provider;
  const key = requireKey(provider, env);

  // Neutral default: no forced persona unless explicitly provided
  const messages: ChatMessage[] = [];
  if (req.systemPrompt) messages.push({ role: "system", content: req.systemPrompt });
  messages.push(...req.messages);

  if (provider === "openai") {
    const base = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = req.model || "gpt-4o-mini";
    const r = await fetch(`${base}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: messages.map(m => ({ role: m.role, content: [{ type: "text", text: m.content }] })),
        temperature: 0.7
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = data?.error?.message || JSON.stringify(data);
      throw new Error(`OpenAI error: ${err}`);
    }
    // Extract first output text
    const content = (data?.output_text as string) || "";
    return { provider, model, request_id: data?.id, content };
  }

  // DeepSeek compatibility: OpenAI-style chat completions
  const base = env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = req.model || "deepseek-chat";
  const r = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = data?.error?.message || JSON.stringify(data);
    throw new Error(`DeepSeek error: ${err}`);
  }
  const content = data?.choices?.[0]?.message?.content ?? "";
  return { provider, model, request_id: data?.id, content };
}
