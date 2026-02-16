export async function runChat(req: any, env: any) {
  const { provider, messages } = req;
  const key =
    provider === "openai"
      ? env.OPENAI_API_KEY
      : env.DEEPSEEK_API_KEY;

  if (!key) throw new Error("API key not set");

  if (provider === "openai") {
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
    if (!r.ok) {
      throw new Error(data?.error?.message || "OpenAI error");
    }

    return {
      provider,
      model: data.model,
      request_id: data.id,
      content: data.choices?.[0]?.message?.content ?? "",
    };
  }

  throw new Error("Unsupported provider");
}
