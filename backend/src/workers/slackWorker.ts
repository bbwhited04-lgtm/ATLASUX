/**
 * Slack Polling Worker — monitors #atlas-ux for human messages and dispatches
 * AI-powered agent responses.
 *
 * Polls the #atlas-ux channel every few seconds, detects which agent the human
 * is addressing (via @mention or name mention), generates a response using
 * runLLM with the agent's personality, and posts it back as that agent.
 *
 * Env:
 *   SLACK_BOT_TOKEN          required — Slack bot token with chat:write.customize
 *   SLACK_POLL_MS            polling interval in ms (default 5000)
 *   SLACK_CONTEXT_MESSAGES   number of recent messages for context (default 10)
 *   TENANT_ID                tenant ID for LLM calls
 */

import "dotenv/config";

import {
  readHistory,
  postAsAgent,
  getChannelByName,
  type SlackMessage,
  type SlackChannel,
} from "../services/slack.js";
import { agentRegistry } from "../agents/registry.js";
import { runLLM } from "../core/engine/brainllm.js";
import { workflowCatalog } from "../workflows/registry.js";
import { prisma } from "../db/prisma.js";

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_MS = Math.max(1000, Number(process.env.SLACK_POLL_MS ?? 5000));
const CONTEXT_MESSAGES = Math.max(1, Math.min(50, Number(process.env.SLACK_CONTEXT_MESSAGES ?? 10)));
const TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const CHANNEL_NAME = "atlas-ux";

// ── State ─────────────────────────────────────────────────────────────────────

/** Slack message timestamp of the last message we processed. */
let lastSeenTs: string | null = null;

/** Cached channel object so we don't look it up every tick. */
let cachedChannel: SlackChannel | null = null;

// ── Agent detection ───────────────────────────────────────────────────────────

/** Build a lookup of lowercase agent names/ids to registry entries. */
const agentLookup = new Map<string, (typeof agentRegistry)[number]>();
for (const agent of agentRegistry) {
  agentLookup.set(agent.id.toLowerCase(), agent);
  agentLookup.set(agent.name.toLowerCase(), agent);
}

/**
 * Detect which agent the human is addressing.
 *
 * Priority:
 *   1. Slack @mention format: <@USERID> or @AgentName
 *   2. Bare name mention in text (case-insensitive, word boundary)
 *   3. Default to Atlas
 */
function detectAgent(text: string): (typeof agentRegistry)[number] {
  const lower = text.toLowerCase();

  // 1. Check for @mention pattern (Slack encodes as <@USERID|display_name> or plain @Name)
  const atMentionMatch = text.match(/@(\w[\w-]*)/g);
  if (atMentionMatch) {
    for (const mention of atMentionMatch) {
      const name = mention.slice(1).toLowerCase(); // strip leading @
      const agent = agentLookup.get(name);
      if (agent) return agent;
    }
  }

  // 2. Check for bare name mention (word boundary match, longest name first)
  // Sort agents by name length descending to match "daily-intel" before "intel"
  const sortedAgents = [...agentRegistry].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const agent of sortedAgents) {
    const nameLower = agent.name.toLowerCase();
    // Word boundary check: the name must be surrounded by non-alpha chars or string edges
    const idx = lower.indexOf(nameLower);
    if (idx === -1) continue;

    const before = idx === 0 || !/[a-z]/.test(lower[idx - 1]);
    const after =
      idx + nameLower.length >= lower.length ||
      !/[a-z]/.test(lower[idx + nameLower.length]);

    if (before && after) return agent;
  }

  // 3. Also check by agent ID (e.g., "daily-intel")
  for (const agent of sortedAgents) {
    const idLower = agent.id.toLowerCase();
    const idx = lower.indexOf(idLower);
    if (idx === -1) continue;

    const before = idx === 0 || !/[a-z]/.test(lower[idx - 1]);
    const after =
      idx + idLower.length >= lower.length ||
      !/[a-z]/.test(lower[idx + idLower.length]);

    if (before && after) return agent;
  }

  // 4. Default to Atlas
  return agentRegistry.find((a) => a.id === "atlas")!;
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(agent: (typeof agentRegistry)[number]): string {
  return [
    `You are ${agent.name}, ${agent.title} at Atlas UX.`,
    `Role: ${agent.summary}`,
    "",
    "You are chatting in the #atlas-ux Slack channel with the team.",
    "Billy is the human founder and Chairman — always be respectful and helpful to him.",
    "",
    "Guidelines:",
    "- Keep responses conversational and brief (2-4 sentences for casual chat).",
    "- For work requests, questions about your domain, or technical topics, give thorough but focused answers.",
    "- Stay in character as your role at Atlas UX.",
    "- Use plain text (no markdown headers or bullet lists unless truly needed).",
    "- Do not prefix your messages with your name — Slack already shows who you are.",
    "- If the question is outside your area, briefly answer but suggest the right agent to ask.",
  ].join("\n");
}

// ── Context builder ───────────────────────────────────────────────────────────

function formatContext(messages: SlackMessage[]): string {
  if (!messages.length) return "";

  const lines = messages
    .slice()
    .reverse() // oldest first for natural reading order
    .map((m) => {
      const who = m.username ?? (m.bot_id ? "bot" : "human");
      return `[${who}]: ${m.text}`;
    });

  return "Recent channel context:\n" + lines.join("\n");
}

// ── Workflow detection & execution ───────────────────────────────────────────

/** Build a lookup: lowercase workflow name/id → catalog entry. */
const workflowLookup = new Map<string, (typeof workflowCatalog)[number]>();
for (const wf of workflowCatalog) {
  workflowLookup.set(wf.id.toLowerCase(), wf);
  workflowLookup.set(wf.name.toLowerCase(), wf);
}

/**
 * Detect if a message is requesting a workflow run.
 * Matches: "run WF-021", "run self-healing workflow", "execute nightly memory", etc.
 * Returns the matched catalog entry or null.
 */
function detectWorkflow(text: string): (typeof workflowCatalog)[number] | null {
  const lower = text.toLowerCase();

  // Must contain a trigger word
  if (!/\b(?:run|execute|trigger|fire|start|kick\s*off|launch)\b/i.test(lower)) return null;

  // 1. Direct WF-xxx ID match
  const wfIdMatch = lower.match(/\bwf-(\d+)\b/);
  if (wfIdMatch) {
    const wf = workflowLookup.get(`wf-${wfIdMatch[1]}`);
    if (wf) return wf;
  }

  // 2. Fuzzy match against workflow names (longest name first to avoid partial matches)
  const sorted = [...workflowCatalog].sort((a, b) => b.name.length - a.name.length);
  for (const wf of sorted) {
    // Check if key terms from the workflow name appear in the message
    const nameWords = wf.name.toLowerCase().replace(/[()]/g, "").split(/\s+/).filter(w => w.length > 2);
    const matchCount = nameWords.filter(w => lower.includes(w)).length;
    // Require at least 2 meaningful words to match (or all words if name is short)
    const threshold = Math.min(2, nameWords.length);
    if (matchCount >= threshold) return wf;
  }

  return null;
}

/**
 * Queue a workflow by creating an ENGINE_RUN intent.
 * The engine loop will pick it up on its next tick.
 */
async function queueWorkflow(
  wf: (typeof workflowCatalog)[number],
  channelId: string,
  input?: any,
): Promise<void> {
  const intent = await prisma.intent.create({
    data: {
      tenantId: TENANT_ID,
      agentId: null,
      intentType: "ENGINE_RUN",
      payload: {
        agentId: wf.ownerAgent,
        workflowId: wf.id,
        input: input ?? {},
        requestedBy: "slack",
        traceId: null,
      },
      status: "DRAFT",
    },
  });

  console.log(
    `[slackWorker] Queued workflow ${wf.id} (${wf.name}) → intent ${intent.id}`,
  );

  await postAsAgent(channelId, wf.ownerAgent,
    `Workflow queued: *${wf.name}* (${wf.id})\nAssigned to: ${wf.ownerAgent}\nIntent ID: ${intent.id}\nThe engine will pick this up on the next tick.`,
  );
}

// ── Core tick ─────────────────────────────────────────────────────────────────

async function tick() {
  // Ensure we have a valid bot token
  if (!process.env.SLACK_BOT_TOKEN) {
    // Don't spam logs — just wait for it to be configured
    return;
  }

  // Resolve the channel (cache it)
  if (!cachedChannel) {
    try {
      cachedChannel = await getChannelByName(CHANNEL_NAME, true);
    } catch (err: any) {
      console.error(`[slackWorker] Failed to resolve #${CHANNEL_NAME}: ${err?.message ?? err}`);
      return;
    }
    if (!cachedChannel) {
      console.error(`[slackWorker] Channel #${CHANNEL_NAME} not found`);
      return;
    }
    console.log(`[slackWorker] Resolved #${CHANNEL_NAME} → ${cachedChannel.id}`);
  }

  const channelId = cachedChannel.id;

  // Fetch recent messages (use oldest param to only get new ones)
  let messages: SlackMessage[];
  try {
    messages = await readHistory(channelId, CONTEXT_MESSAGES, {
      oldest: lastSeenTs ?? undefined,
    });
  } catch (err: any) {
    console.error(`[slackWorker] readHistory failed: ${err?.message ?? err}`);
    return;
  }

  if (!messages.length) return;

  // Slack returns messages newest-first. Sort oldest-first for processing order.
  messages.sort((a, b) => {
    const tsA = parseFloat(a.ts);
    const tsB = parseFloat(b.ts);
    return tsA - tsB;
  });

  // Filter to only new messages we haven't seen
  const newMessages = lastSeenTs
    ? messages.filter((m) => parseFloat(m.ts) > parseFloat(lastSeenTs!))
    : messages;

  if (!newMessages.length) return;

  // Update lastSeenTs to the newest message timestamp
  const newestTs = newMessages[newMessages.length - 1].ts;
  lastSeenTs = newestTs;

  // Filter to human messages only (skip bot messages — our agents post as bots)
  const humanMessages = newMessages.filter((m) => !m.bot_id);

  if (!humanMessages.length) return;

  // Fetch context window for conversation history (separate from new-message detection)
  let contextMessages: SlackMessage[] = [];
  try {
    contextMessages = await readHistory(channelId, CONTEXT_MESSAGES);
  } catch {
    // Non-fatal — proceed without context
  }

  // Process each human message
  for (const msg of humanMessages) {
    // Check for workflow trigger before LLM response
    const workflow = detectWorkflow(msg.text);
    if (workflow) {
      console.log(
        `[slackWorker] Workflow command detected → ${workflow.id} (${workflow.name}): "${msg.text.slice(0, 80)}"`,
      );
      try {
        await queueWorkflow(workflow, channelId);
      } catch (err: any) {
        console.error(`[slackWorker] Failed to queue workflow: ${err?.message ?? err}`);
        await postAsAgent(channelId, "atlas",
          `Failed to queue workflow ${workflow.id}: ${err?.message ?? "unknown error"}`,
        );
      }
      continue; // Skip LLM response — workflow is the action
    }

    const agent = detectAgent(msg.text);
    const systemPrompt = buildSystemPrompt(agent);
    const context = formatContext(contextMessages);

    const userMessage = context
      ? `${context}\n\nNew message from Billy:\n${msg.text}`
      : `Billy says: ${msg.text}`;

    const runId = `slack-${agent.id}-${Date.now()}`;

    console.log(
      `[slackWorker] Human message detected → routing to ${agent.name} (${agent.id}): "${msg.text.slice(0, 80)}${msg.text.length > 80 ? "..." : ""}"`,
    );

    try {
      const response = await runLLM({
        runId,
        agent: agent.id.toUpperCase(),
        purpose: "slack_chat",
        route: "DRAFT_GENERATION_FAST",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const reply = response.text.trim();
      if (!reply) {
        console.warn(`[slackWorker] Empty LLM response for agent ${agent.id}`);
        continue;
      }

      // Reply in-thread if the human posted in a thread, otherwise top-level
      const threadTs = msg.thread_ts ?? undefined;
      const result = await postAsAgent(channelId, agent.id, reply, {
        threadTs,
      });

      if (result.ok) {
        console.log(
          `[slackWorker] ${agent.name} replied (${reply.length} chars)${threadTs ? " [thread]" : ""}`,
        );
      } else {
        console.error(
          `[slackWorker] postAsAgent failed for ${agent.id}: ${result.error}`,
        );
      }
    } catch (err: any) {
      console.error(
        `[slackWorker] LLM/post error for ${agent.id}: ${err?.message ?? err}`,
      );
    }
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(
    `[slackWorker] Starting — polling #${CHANNEL_NAME} every ${POLL_MS / 1000}s, context window: ${CONTEXT_MESSAGES} messages`,
  );

  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("[slackWorker] SLACK_BOT_TOKEN not set — worker will idle until configured");
  }

  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stopping) {
      process.stdout.write("[slackWorker] stopping\n");
      process.exit(0);
    }

    try {
      await tick();
    } catch (err: any) {
      console.error(`[slackWorker] tick error: ${err?.message ?? err}`);
    }

    await sleep(POLL_MS);
  }
}

main().catch((e) => {
  process.stderr.write(`[slackWorker] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
