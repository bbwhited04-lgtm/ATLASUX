export async function runChat(req: any, env: any) {
  const { provider, messages } = req;

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  if (provider === "openai") {
    const key = env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: req.model || "gpt-4o-mini",
        messages,
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "OpenAI error");

    return {
      provider,
      model: data.model,
      request_id: data.id,
      content: data.choices?.[0]?.message?.content ?? "",
    };
  }

  // ── DeepSeek (OpenAI-compatible API) ───────────────────────────────────────
  if (provider === "deepseek") {
    const key = env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("DEEPSEEK_API_KEY not set");

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: req.model || "deepseek-chat",
        messages,
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "DeepSeek error");

    return {
      provider,
      model: data.model || "deepseek-chat",
      request_id: data.id || null,
      content: data.choices?.[0]?.message?.content ?? "",
    };
  }

  // ── Claude (Anthropic) ─────────────────────────────────────────────────────
  if (provider === "claude") {
    const key = env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");

    // Claude separates system messages from the conversation
    const sysMsgs = messages.filter((m: any) => m.role === "system");
    const chatMsgs = messages.filter((m: any) => m.role !== "system");
    const system = sysMsgs.map((m: any) => m.content).join("\n\n") || undefined;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: req.model || "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        ...(system ? { system } : {}),
        messages: chatMsgs,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "Claude error");

    return {
      provider,
      model: data.model,
      request_id: data.id,
      content: data.content?.[0]?.text ?? "",
    };
  }

  // ── Gemini ─────────────────────────────────────────────────────────────────
  if (provider === "gemini") {
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");

    // Convert OpenAI-style messages to Gemini format
    const contents = messages
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "Gemini error");

    return {
      provider,
      model: "gemini-2.0-flash",
      request_id: null,
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
