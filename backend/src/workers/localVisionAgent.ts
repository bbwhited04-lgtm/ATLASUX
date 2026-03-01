/**
 * Local Vision Agent — runs on your machine, polls the Render backend
 * for LOCAL_VISION_TASK jobs, uses Playwright CDP to interact with your
 * already-authenticated Edge browser, and uses Claude Vision (Sonnet)
 * to understand what it sees.
 *
 * Start Edge with remote debugging:
 *   msedge --remote-debugging-port=9222
 *
 * Env:
 *   ATLAS_API_URL       — Backend URL (e.g. https://atlas-ux.onrender.com)
 *   ATLAS_TENANT_ID     — Your tenant ID
 *   ATLAS_LOCAL_AGENT_KEY — API key from POST /v1/local-agent/register
 *   ANTHROPIC_API_KEY   — Anthropic API key for Claude Vision
 *   CDP_ENDPOINT        — CDP WebSocket URL (default: http://localhost:9222)
 *   POLL_INTERVAL_MS    — Poll interval (default: 5000)
 *   HEARTBEAT_INTERVAL_MS — Heartbeat interval (default: 30000)
 */

import {
  checkLocalVisionUrlAllowed,
  hasVisibleCredentials,
  validateLocalVisionTask,
  MAX_SESSION_DURATION_MS,
  MAX_ACTIONS_PER_SESSION,
  MAX_SCREENSHOT_SIZE,
} from "../tools/browser/localVisionGovernance.js";

// ── Config ───────────────────────────────────────────────────────────────────

const API_URL = (process.env.ATLAS_API_URL ?? "http://localhost:8787").replace(/\/+$/, "");
const TENANT_ID = process.env.ATLAS_TENANT_ID ?? "";
const AGENT_KEY = process.env.ATLAS_LOCAL_AGENT_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const CDP_ENDPOINT = process.env.CDP_ENDPOINT ?? "http://localhost:9222";
const POLL_MS = Math.max(1000, Number(process.env.POLL_INTERVAL_MS ?? 5000));
const HEARTBEAT_MS = Math.max(5000, Number(process.env.HEARTBEAT_INTERVAL_MS ?? 30000));

const AUTH_HEADER = `Bearer local:${TENANT_ID}:${AGENT_KEY}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  process.stdout.write(`[localVision] ${new Date().toISOString()} ${msg}\n`);
}

function logError(msg: string) {
  process.stderr.write(`[localVision] ${new Date().toISOString()} ERROR: ${msg}\n`);
}

async function apiCall(
  method: string,
  path: string,
  body?: any,
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${API_URL}/v1/local-agent${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": "application/json",
      "x-tenant-id": TENANT_ID,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Claude Vision ────────────────────────────────────────────────────────────

interface VisionAction {
  action: "click" | "type" | "navigate" | "scroll" | "screenshot" | "done" | "error";
  target?: string; // CSS selector or description
  value?: string;  // text to type or URL to navigate
  reasoning: string;
}

async function analyzeScreenshot(
  screenshotBase64: string,
  taskDescription: string,
  actionHistory: string[],
  currentUrl: string,
): Promise<VisionAction> {
  const prompt = [
    `You are a vision agent executing a browser task. Analyze the screenshot and determine the next action.`,
    ``,
    `TASK: ${taskDescription}`,
    `CURRENT URL: ${currentUrl}`,
    ``,
    `ACTIONS TAKEN SO FAR (${actionHistory.length}):`,
    actionHistory.length ? actionHistory.map((a, i) => `  ${i + 1}. ${a}`).join("\n") : "  (none yet)",
    ``,
    `RULES:`,
    `- Never interact with password fields, payment forms, or credential inputs`,
    `- Never navigate to banking, crypto, government, or healthcare sites`,
    `- Return action "done" when the task is complete`,
    `- Return action "error" if the task cannot be completed`,
    `- Be precise with CSS selectors when clicking or typing`,
    `- Describe what you see and your reasoning`,
    ``,
    `Respond with ONLY valid JSON (no markdown):`,
    `{"action": "click|type|navigate|scroll|screenshot|done|error", "target": "css selector or description", "value": "text or url if needed", "reasoning": "why this action"}`,
  ].join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: screenshotBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude Vision API error (${res.status}): ${errText.slice(0, 500)}`);
  }

  const result = (await res.json()) as any;
  const textBlock = result.content?.find((c: any) => c.type === "text");
  if (!textBlock?.text) throw new Error("No text response from Claude Vision");

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(jsonStr) as VisionAction;
}

// ── Task Execution ───────────────────────────────────────────────────────────

async function executeTask(job: {
  id: string;
  input: Record<string, any>;
}) {
  const { id: jobId, input } = job;
  log(`Executing job ${jobId}: ${String(input.task ?? "").slice(0, 100)}`);

  // Validate task
  const validation = validateLocalVisionTask(input);
  if (!validation.valid) {
    await apiCall("POST", `/result/${jobId}`, {
      success: false,
      error: `Validation failed: ${validation.errors.join("; ")}`,
      summary: "Task rejected by governance rules",
    });
    return;
  }

  const targetUrl = String(input.targetUrl).trim();
  const task = String(input.task).trim();

  // Dynamic import — Playwright may not be installed in all environments
  let chromium: any;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    await apiCall("POST", `/result/${jobId}`, {
      success: false,
      error: "Playwright not available. Install with: npx playwright install chromium",
      summary: "Playwright not installed",
    });
    return;
  }

  let browser: any = null;
  const actionHistory: string[] = [];
  let screenshotCount = 0;
  const sessionStart = Date.now();

  try {
    // Connect to Edge via CDP
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
    const contexts = browser.contexts();
    if (!contexts.length) throw new Error("No browser contexts found. Is Edge running with --remote-debugging-port=9222?");

    const context = contexts[0];
    const pages = context.pages();
    let page = pages[0];
    if (!page) {
      page = await context.newPage();
    }

    // Navigate to target URL
    const urlCheck = checkLocalVisionUrlAllowed(targetUrl);
    if (!urlCheck.allowed) throw new Error(`Navigation blocked: ${urlCheck.reason}`);

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    actionHistory.push(`Navigate to ${targetUrl}`);
    log(`Navigated to ${targetUrl}`);

    // Vision loop
    for (let actionIdx = 0; actionIdx < MAX_ACTIONS_PER_SESSION; actionIdx++) {
      // Check session duration
      if (Date.now() - sessionStart > MAX_SESSION_DURATION_MS) {
        actionHistory.push("Session timed out (5 min limit)");
        break;
      }

      // Take screenshot
      const screenshotBuf = await page.screenshot({ type: "png", fullPage: false });
      const screenshotB64 = screenshotBuf.toString("base64");

      // Check size
      if (screenshotBuf.length > MAX_SCREENSHOT_SIZE) {
        log("Screenshot too large, skipping upload");
      }

      // Analyze with Claude Vision
      const currentUrl = page.url();
      const visionAction = await analyzeScreenshot(screenshotB64, task, actionHistory, currentUrl);
      log(`Vision action ${actionIdx + 1}: ${visionAction.action} — ${visionAction.reasoning}`);

      // Upload screenshot (best-effort, don't fail if upload fails)
      try {
        if (screenshotBuf.length <= MAX_SCREENSHOT_SIZE) {
          // Check for visible credentials before uploading
          if (!hasVisibleCredentials(visionAction.reasoning)) {
            await apiCall("POST", "/screenshot", {
              jobId,
              screenshot: screenshotB64,
              filename: `${jobId}_step${actionIdx}.png`,
            });
            screenshotCount++;
          } else {
            log("Skipping screenshot upload — possible credentials visible");
          }
        }
      } catch {
        // Non-critical — continue execution
      }

      // Done or error — stop
      if (visionAction.action === "done") {
        actionHistory.push(`DONE: ${visionAction.reasoning}`);
        break;
      }
      if (visionAction.action === "error") {
        actionHistory.push(`ERROR: ${visionAction.reasoning}`);
        break;
      }

      // Execute the action
      try {
        switch (visionAction.action) {
          case "click":
            if (visionAction.target) {
              await page.click(visionAction.target, { timeout: 10000 });
              actionHistory.push(`Clicked: ${visionAction.target}`);
            }
            break;

          case "type":
            if (visionAction.target && visionAction.value) {
              await page.fill(visionAction.target, visionAction.value, { timeout: 10000 });
              actionHistory.push(`Typed in ${visionAction.target}: "${visionAction.value.slice(0, 50)}"`);
            }
            break;

          case "navigate": {
            const navUrl = visionAction.value ?? "";
            const navCheck = checkLocalVisionUrlAllowed(navUrl);
            if (!navCheck.allowed) {
              actionHistory.push(`Navigation blocked: ${navCheck.reason}`);
              log(`Blocked navigation to ${navUrl}: ${navCheck.reason}`);
            } else {
              await page.goto(navUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
              actionHistory.push(`Navigated to ${navUrl}`);
            }
            break;
          }

          case "scroll":
            await page.evaluate(() => window.scrollBy(0, 500));
            actionHistory.push("Scrolled down 500px");
            break;

          case "screenshot":
            // Just take another screenshot on next iteration
            actionHistory.push("Screenshot requested (captured above)");
            break;
        }
      } catch (actionErr: any) {
        actionHistory.push(`Action failed: ${visionAction.action} — ${actionErr?.message}`);
        log(`Action failed: ${actionErr?.message}`);
      }

      // Brief pause between actions
      await sleep(1000);
    }

    // Report success
    const lastAction = actionHistory[actionHistory.length - 1] ?? "";
    const success = lastAction.startsWith("DONE:");

    await apiCall("POST", `/result/${jobId}`, {
      success,
      summary: lastAction,
      output: {
        actionHistory,
        screenshotCount,
        durationMs: Date.now() - sessionStart,
        finalUrl: page.url(),
      },
      actionsExecuted: actionHistory.length,
      screenshotCount,
      error: success ? undefined : lastAction,
    });

    log(`Job ${jobId} ${success ? "completed" : "finished with issues"} (${actionHistory.length} actions, ${screenshotCount} screenshots)`);
  } catch (err: any) {
    logError(`Job ${jobId} failed: ${err?.message}`);
    await apiCall("POST", `/result/${jobId}`, {
      success: false,
      error: err?.message ?? String(err),
      summary: `Fatal error: ${err?.message}`,
      output: { actionHistory },
      actionsExecuted: actionHistory.length,
      screenshotCount,
    }).catch(() => null);
  } finally {
    // Don't close the browser — it's the user's Edge instance
    if (browser) {
      try { browser.close(); } catch { /* CDP disconnect is fine */ }
    }
  }
}

// ── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  // Validate config
  if (!TENANT_ID) throw new Error("ATLAS_TENANT_ID is required");
  if (!AGENT_KEY) throw new Error("ATLAS_LOCAL_AGENT_KEY is required");
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY is required");

  log(`Starting local vision agent`);
  log(`  API: ${API_URL}`);
  log(`  Tenant: ${TENANT_ID}`);
  log(`  CDP: ${CDP_ENDPOINT}`);
  log(`  Poll: ${POLL_MS}ms`);

  let stopping = false;
  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });

  // Heartbeat loop (separate interval)
  const heartbeatInterval = setInterval(async () => {
    try {
      await apiCall("POST", "/heartbeat");
    } catch (err: any) {
      logError(`Heartbeat failed: ${err?.message}`);
    }
  }, HEARTBEAT_MS);

  // Initial heartbeat
  try {
    const hb = await apiCall("POST", "/heartbeat");
    if (!hb.ok) logError(`Initial heartbeat failed: ${JSON.stringify(hb.data)}`);
    else log("Heartbeat OK — agent online");
  } catch (err: any) {
    logError(`Initial heartbeat failed: ${err?.message}`);
  }

  // Poll loop
  while (!stopping) {
    try {
      const res = await apiCall("GET", "/claim");

      if (res.ok && res.data?.job) {
        await executeTask(res.data.job);
      }
    } catch (err: any) {
      logError(`Poll error: ${err?.message}`);
    }

    await sleep(POLL_MS);
  }

  clearInterval(heartbeatInterval);
  log("Shutting down");
  process.exit(0);
}

main().catch((e) => {
  logError(`Fatal: ${e?.message ?? e}`);
  process.exit(1);
});
