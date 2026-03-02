import { redactMessages } from "./lib/piiRedact.js";

/**
 * Atlas UX — Chat provider router.
 *
 * Supported providers:
 *   openai    → OpenAI API (OPENAI_API_KEY)
 *   deepseek  → DeepSeek API (DEEPSEEK_API_KEY) — PII-redacted (GDPR: no adequacy decision for China)
 *   claude    → Anthropic via OpenRouter (OPENROUTER_API_KEY)
 *              or directly via Anthropic API (ANTHROPIC_API_KEY)
 *   gemini    → Gemini via OpenRouter (OPENROUTER_API_KEY)
 *              or directly via Google API (GEMINI_API_KEY / GL_GOOGLE_API_KEY)
 */
export async function runChat(req: any, env: any) {
  const { provider, messages } = req;

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  if (provider === "openai") {
    const key = env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: req.model || "gpt-4o-mini", messages, temperature: 0.7 }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "OpenAI error");

    return { provider, model: data.model, request_id: data.id, content: data.choices?.[0]?.message?.content ?? "" };
  }

  // ── DeepSeek (OpenAI-compatible) — PII redacted for GDPR (China transfer) ─
  if (provider === "deepseek") {
    const key = env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("DEEPSEEK_API_KEY not set");

    const safeMessages = redactMessages(messages);

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: req.model || "deepseek-chat", messages: safeMessages, temperature: 0.7 }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "DeepSeek error");

    return { provider, model: data.model || "deepseek-chat", request_id: data.id || null, content: data.choices?.[0]?.message?.content ?? "" };
  }

  // ── Claude — direct Anthropic API, or OpenRouter fallback ─────────────────
  if (provider === "claude") {
    const anthropicKey = env.ANTHROPIC_API_KEY;
    const orKey = env.OPENROUTER_API_KEY;

    if (anthropicKey) {
      // Direct Anthropic Messages API
      const sysMsgs = messages.filter((m: any) => m.role === "system");
      const chatMsgs = messages.filter((m: any) => m.role !== "system");
      const system = sysMsgs.map((m: any) => m.content).join("\n\n") || undefined;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: req.model || "claude-3-5-haiku-20241022", max_tokens: 4096, ...(system ? { system } : {}), messages: chatMsgs }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "Claude error");
      return { provider, model: data.model, request_id: data.id, content: data.content?.[0]?.text ?? "" };
    }

    if (orKey) {
      // OpenRouter — OpenAI-compatible, supports Anthropic models
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://atlasux.cloud",
          "X-Title": "Atlas UX",
        },
        body: JSON.stringify({ model: "anthropic/claude-3-5-haiku", messages, temperature: 0.7 }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "OpenRouter/Claude error");
      return { provider, model: data.model || "claude-3-5-haiku", request_id: data.id || null, content: data.choices?.[0]?.message?.content ?? "" };
    }

    throw new Error("No API key for Claude. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY.");
  }

  // ── Gemini — direct Google API, or OpenRouter fallback ────────────────────
  if (provider === "gemini") {
    const googleKey = env.GEMINI_API_KEY || env.GL_GOOGLE_API_KEY;
    const orKey = env.OPENROUTER_API_KEY;

    if (googleKey) {
      // Direct Google Generative AI API
      const contents = messages
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents }) }
      );

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "Gemini error");
      return { provider, model: "gemini-2.0-flash", request_id: null, content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "" };
    }

    if (orKey) {
      // OpenRouter fallback
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://atlasux.cloud",
          "X-Title": "Atlas UX",
        },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-exp:free", messages, temperature: 0.7 }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "OpenRouter/Gemini error");
      return { provider, model: data.model || "gemini-2.0-flash", request_id: data.id || null, content: data.choices?.[0]?.message?.content ?? "" };
    }

    throw new Error("No API key for Gemini. Set GEMINI_API_KEY or OPENROUTER_API_KEY.");
  }

  // ── Swarms.ai (Agent Completions API) ────────────────────────────────────
  if (provider === "swarms") {
    const key = env.SWARMS_API_KEY;
    if (!key) throw new Error("SWARMS_API_KEY not set");

    const systemMsgs = messages.filter((m: any) => m.role === "system");
    const userMsgs = messages.filter((m: any) => m.role !== "system");
    const systemPrompt = systemMsgs.map((m: any) => m.content).join("\n\n") || "You are a helpful AI assistant.";
    const task = userMsgs.map((m: any) => m.content).join("\n\n");

    const swarmsModel = (req.model || "gpt-4o").replace(/^swarms\//, "");

    const r = await fetch("https://api.swarms.world/v1/agent/completions", {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_config: {
          agent_name: "atlas-chat",
          system_prompt: systemPrompt,
          model_name: swarmsModel,
          role: "worker",
          max_loops: 1,
          max_tokens: 8192,
          temperature: 0.7,
        },
        task,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || data?.detail || "Swarms error");

    return { provider, model: swarmsModel, request_id: data.id || null, content: data.output ?? data.response ?? data.result ?? "" };
  }

  // ── NVIDIA NIM (Kimi 2.5 — OpenAI-compatible) ────────────────────────────
  if (provider === "nvidia" || provider === "kimi") {
    const key = env.NVIDIA_API_KEY;
    if (!key) throw new Error("NVIDIA_API_KEY not set");

    const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: req.model || "moonshotai/kimi-k2-instruct", messages, temperature: 0.7 }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "NVIDIA NIM error");

    return { provider, model: data.model || "kimi-k2-instruct", request_id: data.id || null, content: data.choices?.[0]?.message?.content ?? "" };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
