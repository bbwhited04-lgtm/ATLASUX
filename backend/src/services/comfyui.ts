/**
 * ComfyUI API client — connects to a locally running ComfyUI instance
 * (default: http://localhost:8188).
 *
 * Desktop-only: Electron sets COMFYUI_BASE_URL when a local ComfyUI is detected.
 * On cloud (Render/Vercel) all calls return { available: false }.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ComfyPromptResult = {
  ok: boolean;
  promptId?: string;
  error?: string;
};

export type ComfyJobStatus = {
  ok: boolean;
  status: "queued" | "running" | "completed" | "failed" | "unknown";
  progress?: number; // 0-100
  error?: string;
};

export type ComfyOutput = {
  ok: boolean;
  files?: { filename: string; subfolder: string; type: string }[];
  error?: string;
};

// ── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_BASE = "http://localhost:8188";

function getBase(): string {
  return (process.env.COMFYUI_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.COMFYUI_API_KEY;
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

// ── Health check ─────────────────────────────────────────────────────────────

export async function isAvailable(baseUrl?: string): Promise<boolean> {
  const url = (baseUrl ?? getBase()) + "/system_stats";
  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get system stats (GPU info, queue size, etc.) */
export async function getSystemStats(baseUrl?: string): Promise<any> {
  const url = (baseUrl ?? getBase()) + "/system_stats";
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Queue a workflow prompt ──────────────────────────────────────────────────

export async function queuePrompt(
  workflow: Record<string, any>,
  baseUrl?: string,
): Promise<ComfyPromptResult> {
  const url = (baseUrl ?? getBase()) + "/prompt";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `ComfyUI ${res.status}: ${errText.slice(0, 300)}` };
    }

    const data = (await res.json()) as any;
    return { ok: true, promptId: data.prompt_id };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "ComfyUI unreachable" };
  }
}

// ── Check job status ─────────────────────────────────────────────────────────

export async function getStatus(
  promptId: string,
  baseUrl?: string,
): Promise<ComfyJobStatus> {
  const url = (baseUrl ?? getBase()) + `/history/${promptId}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      return { ok: false, status: "unknown", error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as any;
    const entry = data[promptId];

    if (!entry) {
      // Not in history yet — check queue
      const queueRes = await fetch((baseUrl ?? getBase()) + "/queue", { headers: getHeaders() });
      if (queueRes.ok) {
        const queueData = (await queueRes.json()) as any;
        const pending = (queueData.queue_pending ?? []) as any[];
        const running = (queueData.queue_running ?? []) as any[];
        if (running.some((r: any) => r[1] === promptId)) return { ok: true, status: "running" };
        if (pending.some((r: any) => r[1] === promptId)) return { ok: true, status: "queued" };
      }
      return { ok: true, status: "queued" };
    }

    // Check if completed
    if (entry.status?.completed) {
      return { ok: true, status: "completed" };
    }

    if (entry.status?.status_str === "error") {
      return { ok: true, status: "failed", error: entry.status?.messages?.[0]?.toString() ?? "Unknown error" };
    }

    return { ok: true, status: "running" };
  } catch (err: any) {
    return { ok: false, status: "unknown", error: err.message };
  }
}

// ── Get output files ─────────────────────────────────────────────────────────

export async function getOutput(
  promptId: string,
  baseUrl?: string,
): Promise<ComfyOutput> {
  const url = (baseUrl ?? getBase()) + `/history/${promptId}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const data = (await res.json()) as any;
    const entry = data[promptId];
    if (!entry) return { ok: false, error: "Prompt not found in history" };

    const outputs = entry.outputs ?? {};
    const files: { filename: string; subfolder: string; type: string }[] = [];

    for (const nodeId of Object.keys(outputs)) {
      const nodeOutputs = outputs[nodeId];
      // Video outputs
      if (nodeOutputs.gifs) {
        for (const gif of nodeOutputs.gifs) {
          files.push({ filename: gif.filename, subfolder: gif.subfolder ?? "", type: gif.type ?? "output" });
        }
      }
      // Image outputs
      if (nodeOutputs.images) {
        for (const img of nodeOutputs.images) {
          files.push({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
        }
      }
    }

    return { ok: true, files };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ── Download output file ─────────────────────────────────────────────────────

export async function downloadOutput(
  filename: string,
  subfolder: string,
  type = "output",
  baseUrl?: string,
): Promise<Buffer | null> {
  const url = `${baseUrl ?? getBase()}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch {
    return null;
  }
}
