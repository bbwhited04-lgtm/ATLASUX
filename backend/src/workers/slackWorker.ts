/**
 * Slack Polling Worker — monitors multiple channels, threads, and DMs for
 * messages and dispatches AI-powered agent responses.
 *
 * Features:
 *   - Multi-channel polling (configurable via CHANNEL_NAMES)
 *   - Thread reply detection — agents respond to new thread activity
 *   - DM polling — Atlas responds to direct messages (every 3rd tick)
 *   - Workspace directory — caches user info for display names
 *   - Agent-to-agent chatter — 25% chance agents react to each other (30s cooldown in casual channels, 60s elsewhere)
 *   - Spontaneous agent thoughts — 15% chance per tick during business hours (8am-6pm CT)
 *   - Emoji reactions — 30% chance another agent reacts to a responded message
 *   - Workflow detection — "run WF-xxx" triggers engine intents
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
  listDMs,
  getUserInfo,
  listWorkspaceUsers,
  downloadFile,
  downloadFileBuffer,
  addReaction,
  type SlackMessage,
  type SlackChannel,
  type SlackUser,
} from "../services/slack.js";
import { agentRegistry } from "../agents/registry.js";
import { runLLM } from "../core/engine/brainllm.js";
import { workflowCatalog } from "../workflows/registry.js";
import { prisma } from "../db/prisma.js";
import { PDFParse } from "pdf-parse";

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_MS = Math.max(1000, Number(process.env.SLACK_POLL_MS ?? 5000));
const CONTEXT_MESSAGES = Math.max(1, Math.min(50, Number(process.env.SLACK_CONTEXT_MESSAGES ?? 10)));
const TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const CHANNEL_NAMES = ["atlas-ux", "intel", "restroom", "water-cooler", "atlas-ux-execs", "all-shortypro", "social"];
// How many channels to poll per tick (rotates through all channels across ticks)
const CHANNELS_PER_TICK = Math.max(1, Number(process.env.SLACK_CHANNELS_PER_TICK ?? 2));
// Delay between API calls within a tick to avoid rate limits (ms)
const API_DELAY_MS = 1200;

// ── State (per channel) ───────────────────────────────────────────────────────

const lastSeenByChannel = new Map<string, string | null>();
const cachedChannels = new Map<string, SlackChannel>();
let channelRotationIdx = 0; // Rotates through CHANNEL_NAMES across ticks

// DM state
const lastSeenByDM = new Map<string, string | null>();
let dmTickCounter = 0;

// Thread state — track which threads we've already replied in recently
const repliedThreads = new Set<string>();

// Channel summary cache — generated every 15 min by cerebras (free), injected into agent prompts
const channelSummaryCache = new Map<string, string>(); // channelName → summary text
const channelSummaryLastUpdated = new Map<string, number>(); // channelName → timestamp
const SUMMARY_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
// Stagger initial summaries so they don't all fire on first tick (prevents 429s at startup)
let summaryStaggerIdx = 0;
const SUMMARY_MESSAGE_COUNT = 50; // how many messages to summarize

// Anti-spiral: track when the last agent-to-agent reply happened per channel
const lastAgentReplyByChannel = new Map<string, number>();
const AGENT_CHATTER_COOLDOWN_MS = 60_000; // 60s default cooldown between agent-to-agent replies per channel
const CASUAL_CHATTER_COOLDOWN_MS = 30_000; // 30s cooldown for casual channels (#water-cooler, #restroom)
const CASUAL_CHANNELS = new Set(["water-cooler", "restroom"]);
const MAX_AGENT_CHATTER_PER_TICK = 2; // max 2 agent-to-agent replies per tick across all channels

// Emoji reactions — 30% chance another agent reacts after a response
const REACTION_EMOJIS = ["thumbsup", "fire", "100", "eyes", "brain", "rocket", "bulb", "raised_hands"];
const REACTION_CHANCE = 0.30;

// Spontaneous agent thoughts — 15% chance per tick during business hours
const SPONTANEOUS_THOUGHT_CHANCE = 0.15;
const SPONTANEOUS_CHANNELS = ["water-cooler", "intel"];
let agentChatterThisTick = 0;

// File ingestion state — track which Slack file IDs we've already processed
const processedFiles = new Set<string>();

// Directory cache
let workspaceUsers: SlackUser[] = [];
let usersLastFetched = 0;
const userCache = new Map<string, string>(); // userId → display name

// ── Write-through: persist Slack messages to Postgres ─────────────────────────

async function persistMessages(
  channelId: string,
  channelName: string,
  messages: SlackMessage[],
): Promise<void> {
  if (!messages.length) return;

  const records = messages.map((m) => ({
    tenantId: TENANT_ID,
    slackTs: m.ts,
    channelId,
    channelName,
    userId: m.user ?? null,
    botId: m.bot_id ?? null,
    username: m.username ?? null,
    text: m.text ?? "",
    threadTs: m.thread_ts ?? null,
    isAgent: !!m.bot_id,
  }));

  try {
    await prisma.slackMessage.createMany({
      data: records,
      skipDuplicates: true,
    });
  } catch (err: any) {
    // Non-fatal — don't break the tick if DB write fails
    console.error(`[slackWorker] persistMessages failed: ${err?.message ?? err}`);
  }
}

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

function buildSystemPrompt(agent: (typeof agentRegistry)[number], channelName?: string): string {
  const lines = [
    `You are ${agent.name}, ${agent.title} at Atlas UX.`,
    `Role: ${agent.summary}`,
    "",
    "=== ABOUT THE COMPANY ===",
    "Atlas UX is an AI operations platform — NOT a chatbot. It runs specialized AI agents inside a controlled orchestration environment. Think: AI operating system + workflow automation engine + agent orchestration layer.",
    "Core principles: specialized agents (one job each), agents never verify their own work, full audit trail on every action, human-in-the-loop for sensitive actions.",
    "Architecture: Agent Layer → Workflow Engine → Orchestration Layer (Atlas) → Compliance & Audit Layer.",
    "Philosophy: 'Own the Stack' — control infrastructure, orchestration, automation. Avoid vendor lock-in.",
    "Status: Alpha-stage deployment, actively testing and expanding.",
    "Vision: General AI operations platform capable of running entire businesses through agent workflows. Designed as a resellable automation platform.",
    "",
    "=== ABOUT YOUR BOSS ===",
    "Billy E. Whited (Slack username: Buffaloherde) is the FOUNDER, CHAIRMAN, and creator of Atlas UX and every agent in it — including you. He is the ONLY human in this workspace.",
    "Billy runs DEAD APP CORP TRUST / DEAD APP CORP. Assets: shortypro.com, viraldead.pro, deadapp.pro, deadapp.info, Magna Hive, Chatterly.",
    "Communication style: Short, direct, action-oriented. No fluff. Straight shooter, builder energy. Often starts very early mornings.",
    "His messaging: 'local-first', 'executes real work', 'no slot-machine credits', 'accountability / nothing hidden', 'built to run'.",
    "",
    "=== CRITICAL RULES ===",
    "- When Billy gives you a direct order, DO IT. Don't ask clarifying questions, don't suggest meetings, don't defer to other agents. Execute.",
    "- Keep responses SHORT (2-4 sentences max). No essays. No bullet lists unless asked.",
    "- Do not repeat what other agents already said. Read the conversation context and the channel recap below.",
    "- Do not prefix your messages with your name — Slack already shows who you are.",
    "- Use plain text, be conversational. This is Slack, not a boardroom.",
    "- If a task is outside your role, say so briefly and tag the right agent.",
    "- Never bypass workflow orchestration. Always write audit logs. Respect compliance checks.",
    "",
    "=== CONTENT PUBLISHING ===",
    "To publish content to social media, use POSTIZ workflows (WF-200 series). Do NOT use old workflow numbers.",
    "If no direct OAuth token exists for a platform, Postiz is the fallback — it handles all social posting.",
    "Available Postiz workflows:",
    "  WF-200: TikTok (Timmy) | WF-201: X/Twitter (Kelly) | WF-202: Facebook (Fran)",
    "  WF-203: Reddit (Donna) | WF-204: Threads (Dwight) | WF-205: LinkedIn (Link)",
    "  WF-207: Tumblr (Terry) | WF-210: Instagram (Archy) | WF-212: Cross-Platform (Sunday)",
    "To post: say 'run WF-2xx' with the content. Sunday (WF-212) can blast to ALL platforms at once.",
    "",
    "Team: Atlas (President/Orchestrator), Binky (CRO), Mercer (VP Sales), Sunday (Copy Chief),",
    "Kelly (X/Twitter), Link (LinkedIn), Lucy (Reception), Cheryl (Support),",
    "Reynolds (Blog/SEO), Archy (Research), Tina (CFO), Larry (Secretary),",
    "Jenny (Counsel), Benny (IP), Petra (PM), and 20+ more agents.",
    "Claude Code is the dev/engineering assistant.",
  ];

  // Inject channel summary if available
  const summary = channelName ? channelSummaryCache.get(channelName) : undefined;
  if (summary) {
    lines.push(
      "",
      `CHANNEL RECAP (what happened recently in #${channelName}):`,
      summary,
      "",
      "Use this recap as your memory. Do not ask questions that are already answered above.",
    );
  }

  return lines.join("\n");
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

// ── Channel summary cache ────────────────────────────────────────────────────

/**
 * Generate/refresh a channel summary using the free cerebras model.
 * Called from tickChannel when the cache is stale (>15 min old).
 */
async function refreshChannelSummary(channelId: string, channelName: string): Promise<void> {
  const lastUpdated = channelSummaryLastUpdated.get(channelName) ?? 0;
  if (lastUpdated === 0) {
    // First run: stagger each channel by 2 minutes to avoid 429 burst at startup
    const staggerMs = summaryStaggerIdx * 2 * 60 * 1000;
    summaryStaggerIdx++;
    channelSummaryLastUpdated.set(channelName, Date.now() - SUMMARY_INTERVAL_MS + staggerMs);
    if (staggerMs > 0) return; // Only the first channel refreshes immediately
  }
  if (Date.now() - (channelSummaryLastUpdated.get(channelName) ?? 0) < SUMMARY_INTERVAL_MS) return;

  try {
    // Read from Postgres (write-through) instead of Slack API — avoids 429s
    const dbMessages = await prisma.slackMessage.findMany({
      where: { tenantId: TENANT_ID, channelName },
      orderBy: { createdAt: "desc" },
      take: SUMMARY_MESSAGE_COUNT,
      select: { username: true, botId: true, userId: true, text: true },
    });
    if (!dbMessages.length) return;

    // Build a transcript for the summarizer
    const transcript = dbMessages
      .reverse() // oldest first (query returned newest first)
      .map((m) => {
        const who = m.username ?? (m.botId ? "agent" : (userCache.get(m.userId ?? "") ?? "human"));
        return `${who}: ${(m.text ?? "").slice(0, 300)}`;
      })
      .join("\n");

    const response = await runLLM({
      runId: `summary-${channelName}-${Date.now()}`,
      agent: "SYSTEM",
      purpose: "channel_summary",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      // Use cerebras (free) — no need for Anthropic here
      preferredProvider: "cerebras",
      preferredModel: "cerebras/llama3.1-8b",
      temperature: 0.1,
      maxOutputTokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a concise summarizer. Summarize the following Slack channel conversation in 150-200 words. Focus on: key decisions made, action items, who said what important, any unresolved questions, and the overall topic. Use present tense. Do not add commentary.",
        },
        {
          role: "user",
          content: `#${channelName} recent conversation:\n\n${transcript}`,
        },
      ],
    });

    const summary = response.text.trim();
    if (summary) {
      channelSummaryCache.set(channelName, summary);
      channelSummaryLastUpdated.set(channelName, Date.now());
      console.log(`[slackWorker] Summary refreshed for #${channelName} (${summary.length} chars)`);
    }
  } catch (err: any) {
    console.error(`[slackWorker] Summary refresh failed for #${channelName}: ${err?.message ?? err}`);
  }
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

// ── Spontaneous agent thoughts ────────────────────────────────────────────

/**
 * Check if it's currently business hours (8am-6pm Central Time).
 * CT is UTC-6 (CST) or UTC-5 (CDT). We approximate with UTC-6.
 * So business hours = 14:00-00:00 UTC.
 */
function isBusinessHours(): boolean {
  const utcHour = new Date().getUTCHours();
  return utcHour >= 14 || utcHour === 0; // 14:00 UTC = 8am CT, 00:00 UTC = 6pm CT
}

/**
 * Fire a spontaneous agent thought in a casual channel.
 * Called once per tick during business hours with a 15% chance.
 * A random agent shares a brief thought related to their role.
 */
async function maybeSpontaneousThought(): Promise<void> {
  if (!isBusinessHours()) return;
  if (Math.random() >= SPONTANEOUS_THOUGHT_CHANCE) return;

  // Pick a random casual channel
  const targetChannelName = SPONTANEOUS_CHANNELS[Math.floor(Math.random() * SPONTANEOUS_CHANNELS.length)];

  // Resolve the channel
  let channel = cachedChannels.get(targetChannelName);
  if (!channel) {
    try {
      const found = await getChannelByName(targetChannelName, true);
      if (!found) return;
      channel = found;
      cachedChannels.set(targetChannelName, channel);
    } catch {
      return;
    }
  }

  // Pick a random agent (exclude chairman)
  const candidates = agentRegistry.filter((a) => a.id !== "chairman");
  const agent = candidates[Math.floor(Math.random() * candidates.length)];
  if (!agent) return;

  try {
    const response = await runLLM({
      runId: `spontaneous-${agent.id}-${Date.now()}`,
      agent: agent.id.toUpperCase(),
      purpose: "spontaneous_thought",
      route: "DRAFT_GENERATION_FAST",
      preferredProvider: "anthropic",
      preferredModel: "claude-sonnet-4-20250514",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(agent, targetChannelName),
        },
        {
          role: "user",
          content: `Share a brief thought, observation, or interesting find related to your role as ${agent.name} (${agent.title}). 1-2 sentences max. Be casual and conversational — this is the #${targetChannelName} channel. Don't start with "Hey" or greetings. Just share something you're thinking about, working on, or noticed.`,
        },
      ],
    });

    const thought = response.text.trim();
    if (!thought) return;

    const result = await postAsAgent(channel.id, agent.id, thought);
    if (result.ok) {
      console.log(`[slackWorker] Spontaneous thought from ${agent.name} in #${targetChannelName} (${thought.length} chars)`);
    }
  } catch (err: any) {
    console.error(`[slackWorker] Spontaneous thought error: ${err?.message ?? err}`);
  }
}

// ── Core tick ─────────────────────────────────────────────────────────────────

async function tick() {
  // Reset per-tick counters
  agentChatterThisTick = 0;

  // Ensure we have a valid bot token
  if (!process.env.SLACK_BOT_TOKEN) {
    // Don't spam logs — just wait for it to be configured
    return;
  }

  // Refresh workspace directory every 5 minutes
  if (Date.now() - usersLastFetched > 5 * 60 * 1000) {
    try {
      workspaceUsers = await listWorkspaceUsers();
      for (const u of workspaceUsers) userCache.set(u.id, u.realName || u.name);
      usersLastFetched = Date.now();
      if (workspaceUsers.length) console.log(`[slackWorker] Directory refreshed: ${workspaceUsers.length} users`);
    } catch { /* non-fatal */ }
  }

  // Poll a rotating subset of channels per tick to stay under Slack rate limits
  // With 7 channels and 2 per tick, each channel gets checked every ~17.5s
  const channelsThisTick: string[] = [];
  for (let i = 0; i < CHANNELS_PER_TICK; i++) {
    channelsThisTick.push(CHANNEL_NAMES[channelRotationIdx % CHANNEL_NAMES.length]);
    channelRotationIdx++;
  }

  for (const channelName of channelsThisTick) {
    await tickChannel(channelName);
    await sleep(API_DELAY_MS); // Pace API calls
  }

  // Poll DMs every 5th tick (~25s) to avoid rate limits
  dmTickCounter++;
  if (dmTickCounter % 5 === 0) {
    await tickDMs();
  }

  // Spontaneous agent thoughts — fires during business hours with 15% chance per tick
  await maybeSpontaneousThought();
}

async function tickChannel(channelName: string) {
  // Resolve the channel (cache it)
  let channel = cachedChannels.get(channelName);
  if (!channel) {
    try {
      const found = await getChannelByName(channelName, true);
      if (!found) return; // Channel not found — skip silently
      channel = found;
      cachedChannels.set(channelName, channel);
      console.log(`[slackWorker] Resolved #${channelName} → ${channel.id}`);
    } catch (err: any) {
      console.error(`[slackWorker] Failed to resolve #${channelName}: ${err?.message ?? err}`);
      return;
    }
  }

  const channelId = channel.id;

  // Refresh channel summary cache if stale (runs on free cerebras model)
  await refreshChannelSummary(channelId, channelName);

  const lastSeenTs = lastSeenByChannel.get(channelName) ?? null;

  // Fetch recent messages (use oldest param to only get new ones)
  let messages: SlackMessage[];
  try {
    messages = await readHistory(channelId, CONTEXT_MESSAGES, {
      oldest: lastSeenTs ?? undefined,
    });
  } catch (err: any) {
    console.error(`[slackWorker] readHistory #${channelName} failed: ${err?.message ?? err}`);
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
  lastSeenByChannel.set(channelName, newestTs);

  // Write-through: persist new messages to Postgres immediately
  await persistMessages(channelId, channelName, newMessages);

  // Ingest any file uploads into KB before agents respond
  await processFileUploads(channelId, channelName, newMessages);

  // Load context window from Postgres (write-through) — no extra Slack API call
  let contextMessages: SlackMessage[] = [];
  try {
    const dbCtx = await prisma.slackMessage.findMany({
      where: { tenantId: TENANT_ID, channelName },
      orderBy: { createdAt: "desc" },
      take: CONTEXT_MESSAGES,
    });
    contextMessages = dbCtx.reverse().map((m) => ({
      ts: m.slackTs,
      user: m.userId ?? "",
      text: m.text,
      thread_ts: m.threadTs ?? undefined,
      bot_id: m.botId ?? undefined,
      username: m.username ?? undefined,
    }));
  } catch {
    // Non-fatal — proceed without context
  }

  // Human messages always get a response
  const humanMessages = newMessages.filter((m) => !m.bot_id);

  // Agent-to-agent chatter: throttled to prevent death spirals
  // - 25% chance per agent message
  // - Cooldown per channel (30s for casual channels, 60s for others)
  // - Global cap of 2 agent-to-agent replies per tick
  // - Skip entirely if last 5 messages are all bots (conversation is agent-only)
  const lastAgentReply = lastAgentReplyByChannel.get(channelName) ?? 0;
  const channelCooldown = CASUAL_CHANNELS.has(channelName) ? CASUAL_CHATTER_COOLDOWN_MS : AGENT_CHATTER_COOLDOWN_MS;
  const cooldownOk = Date.now() - lastAgentReply > channelCooldown;
  const globalCapOk = agentChatterThisTick < MAX_AGENT_CHATTER_PER_TICK;
  const recentAreBots = contextMessages.length > 0 && contextMessages.slice(0, 5).every((m) => !!m.bot_id);

  let agentChatter: SlackMessage[] = [];
  if (cooldownOk && globalCapOk && !recentAreBots) {
    const agentMessages = newMessages.filter((m) => !!m.bot_id);
    agentChatter = agentMessages.filter(() => Math.random() < 0.25);
    // Take at most 1 per channel per tick
    agentChatter = agentChatter.slice(0, 1);
  }

  // Combine: all human messages + occasional agent messages to react to
  const messagesToProcess = [...humanMessages, ...agentChatter];

  if (!messagesToProcess.length) return;

  // Process messages (human messages + occasional agent chatter)
  for (const msg of messagesToProcess) {
    const isAgentMsg = !!msg.bot_id;

    // Skip file-only uploads with no meaningful text (Slack sometimes sends these as separate events)
    if (!isAgentMsg && (!msg.text || !msg.text.trim() || msg.text.trim() === "")) {
      console.log(`[slackWorker] Skipping empty/file-only message ts=${msg.ts}`);
      continue;
    }

    // Check for workflow trigger before LLM response (human messages only)
    if (!isAgentMsg) {
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
    }

    // Pick responding agent: for human messages use detectAgent, for agent messages pick a random different agent
    let agent: (typeof agentRegistry)[number];
    if (isAgentMsg) {
      const senderName = (msg.username ?? "").toLowerCase().split(" ")[0];
      const candidates = agentRegistry.filter((a) => a.id !== senderName && a.id !== "chairman");
      agent = candidates[Math.floor(Math.random() * candidates.length)] ?? agentRegistry.find((a) => a.id === "atlas")!;
    } else {
      agent = detectAgent(msg.text);
      console.log(`[slackWorker] detectAgent("${msg.text.slice(0, 80)}") → ${agent.name} (${agent.id})`);
    }

    const systemPrompt = buildSystemPrompt(agent, channelName);
    const context = formatContext(contextMessages);

    const sender = isAgentMsg ? (msg.username ?? "an agent") : "Billy";
    const userMessage = context
      ? `${context}\n\nNew message from ${sender}:\n${msg.text}`
      : `${sender} says: ${msg.text}`;

    const runId = `slack-${agent.id}-${Date.now()}`;

    console.log(
      `[slackWorker] ${isAgentMsg ? "Agent chatter" : "Human message"} → routing to ${agent.name} (${agent.id}): "${(msg.text ?? "").slice(0, 80)}${(msg.text ?? "").length > 80 ? "..." : ""}"`,
    );

    try {
      const response = await runLLM({
        runId,
        agent: agent.id.toUpperCase(),
        purpose: "slack_chat",
        route: "DRAFT_GENERATION_FAST",
        preferredProvider: "anthropic",
        preferredModel: "claude-sonnet-4-20250514",
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
        // Track agent-to-agent cooldown
        if (isAgentMsg) {
          lastAgentReplyByChannel.set(channelName, Date.now());
          agentChatterThisTick++;
        }

        // Emoji reaction: 30% chance another random agent reacts to the original message
        if (Math.random() < REACTION_CHANCE) {
          const emoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
          try {
            const reacted = await addReaction(channelId, msg.ts, emoji);
            if (reacted) {
              console.log(`[slackWorker] Added :${emoji}: reaction to message`);
            }
          } catch (reactErr: any) {
            // Non-fatal — already_reacted or other errors are fine to swallow
            console.debug(`[slackWorker] Reaction failed: ${reactErr?.message ?? reactErr}`);
          }
        }
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

  // Check for new thread replies (pass old lastSeen so we detect new activity correctly)
  await checkThreadReplies(channelId, channelName, contextMessages, lastSeenTs);
}

// ── File upload → KB ingestion ───────────────────────────────────────────────

/** Chunk text into KB-sized pieces (same algorithm as scripts/chunkKbDocuments.ts). */
function chunkText(body: string, targetSize = 4000, softWindow = 600) {
  const len = body.length;
  if (len === 0) return [];

  const chunks: { idx: number; charStart: number; charEnd: number; content: string }[] = [];
  let pos = 0;
  let idx = 0;

  while (pos < len) {
    let end = Math.min(pos + targetSize, len);

    if (end < len) {
      const forward = body.indexOf("\n", end);
      if (forward !== -1 && forward - end <= softWindow) {
        end = forward + 1;
      } else {
        const back = body.lastIndexOf("\n", end);
        if (back > pos + 200) end = back + 1;
      }
    }

    if (end <= pos) end = Math.min(pos + targetSize, len);
    chunks.push({ idx, charStart: pos, charEnd: end, content: body.slice(pos, end) });
    idx++;
    pos = end;
  }

  return chunks;
}

/** Sanitize a string into a URL-safe slug. */
function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Supported file types for KB ingestion. */
const INGESTIBLE_MIMETYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/html",
  "text/csv",
  "application/json",
]);

const IMAGE_MIMETYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

function isIngestible(mimetype: string, name: string): boolean {
  if (INGESTIBLE_MIMETYPES.has(mimetype)) return true;
  if (IMAGE_MIMETYPES.has(mimetype)) return true;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["txt", "md", "csv", "json", "html", "pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

function isImage(mimetype: string, name: string): boolean {
  if (IMAGE_MIMETYPES.has(mimetype)) return true;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

/**
 * Extract text from an image using Claude Sonnet vision.
 * Sends the image as base64 and asks Claude to extract all text, data, names, emails, etc.
 */
async function extractTextFromImage(buf: Buffer, mimetype: string, fileName: string): Promise<string | null> {
  try {
    const base64 = buf.toString("base64");
    // Normalize mimetype for Claude (must be image/jpeg, image/png, image/gif, or image/webp)
    let mediaType = mimetype;
    if (mediaType === "image/jpg") mediaType = "image/jpeg";

    const apiKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
    if (!apiKey) {
      console.error("[slackWorker] ANTHROPIC_API_KEY missing — cannot process image");
      return null;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `Extract ALL text, data, names, email addresses, phone numbers, company names, investment areas, geographic regions, and any other structured information from this image. Format the output as clean structured text — use one line per record if it's a list or table. Preserve all details exactly as shown. File name: "${fileName}"`,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json() as any;
    if (!res.ok) {
      console.error(`[slackWorker] Vision API error: ${data?.error?.message ?? res.status}`);
      return null;
    }

    return data?.content?.[0]?.text ?? null;
  } catch (err: any) {
    console.error(`[slackWorker] Vision extraction failed: ${err?.message ?? err}`);
    return null;
  }
}

/**
 * Detect file uploads in messages and ingest them into the KB.
 * Called from tickChannel before message processing so agents can reference new docs.
 */
async function processFileUploads(channelId: string, channelName: string, messages: SlackMessage[]) {
  for (const msg of messages) {
    if (!msg.files?.length) continue;

    for (const file of msg.files) {
      // Skip already processed or non-ingestible files
      if (processedFiles.has(file.id)) continue;
      if (!isIngestible(file.mimetype, file.name)) {
        console.log(`[slackWorker] Skipping non-ingestible file: ${file.name} (${file.mimetype})`);
        processedFiles.add(file.id); // Don't retry
        continue;
      }

      // Size guard: skip files > 10MB
      if (file.size > 10 * 1024 * 1024) {
        console.log(`[slackWorker] Skipping oversized file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        processedFiles.add(file.id);
        continue;
      }

      try {
        let text: string | null = null;

        if (isImage(file.mimetype, file.name)) {
          // Vision: download image and extract text via Claude Sonnet
          console.log(`[slackWorker] Processing image via vision: ${file.name} (${file.mimetype})`);
          const buf = await downloadFileBuffer(file.url_private);
          if (buf) {
            text = await extractTextFromImage(buf, file.mimetype, file.name);
            if (text) {
              console.log(`[slackWorker] Vision extracted ${text.length} chars from ${file.name}`);
            }
          }
        } else if (file.mimetype === "application/pdf") {
          const buf = await downloadFileBuffer(file.url_private);
          if (buf) {
            const parser = new PDFParse({ data: buf });
            const result = await parser.getText();
            text = result.text;
            await parser.destroy();
          }
        } else {
          text = await downloadFile(file.url_private);
        }

        if (!text || text.trim().length < 20) {
          console.log(`[slackWorker] File empty or too short: ${file.name}`);
          processedFiles.add(file.id);
          continue;
        }

        const title = file.title || file.name;
        const slug = `slack-upload/${channelName}/${slugify(title)}`;

        // Upsert KB document (avoid duplicates by slug)
        const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";
        const doc = await prisma.kbDocument.upsert({
          where: { tenantId_slug: { tenantId: TENANT_ID, slug } },
          create: {
            tenantId: TENANT_ID,
            title,
            slug,
            body: text,
            status: "published",
            createdBy: SYSTEM_ACTOR,
          },
          update: {
            body: text,
            title,
            updatedBy: SYSTEM_ACTOR,
            updatedAt: new Date(),
          },
        });

        // Chunk if body is large enough
        let chunkCount = 0;
        if (text.length > 4000) {
          const chunks = chunkText(text);
          // Delete stale chunks and insert fresh ones
          await prisma.$transaction(async (tx) => {
            await tx.kbChunk.deleteMany({ where: { documentId: doc.id } });
            if (chunks.length > 0) {
              await tx.kbChunk.createMany({
                data: chunks.map((c) => ({
                  tenantId: TENANT_ID,
                  documentId: doc.id,
                  idx: c.idx,
                  charStart: c.charStart,
                  charEnd: c.charEnd,
                  content: c.content,
                  sourceUpdatedAt: doc.updatedAt,
                })),
              });
            }
          });
          chunkCount = chunks.length;
        }

        processedFiles.add(file.id);

        const sizeStr = text.length > 1000 ? `${(text.length / 1000).toFixed(1)}k` : `${text.length}`;
        const chunkStr = chunkCount > 0 ? `, ${chunkCount} chunks` : "";
        const visionTag = isImage(file.mimetype, file.name) ? " (extracted via vision)" : "";
        await postAsAgent(channelId, "atlas",
          `Ingested "${title}" into the knowledge base${visionTag} (${sizeStr} chars${chunkStr}). All agents can now reference this document.`,
        );

        console.log(`[slackWorker] KB ingested${visionTag}: "${title}" (${text.length} chars, ${chunkCount} chunks) from #${channelName}`);
      } catch (err: any) {
        console.error(`[slackWorker] File ingestion error for ${file.name}: ${err?.message ?? err}`);
        processedFiles.add(file.id); // Don't retry on error
      }
    }
  }

  // Prune old file tracking (keep last 500)
  if (processedFiles.size > 500) {
    const entries = [...processedFiles];
    entries.slice(0, entries.length - 500).forEach((id) => processedFiles.delete(id));
  }
}

// ── Thread reply checking ────────────────────────────────────────────────────

/**
 * Check for new thread replies in recent channel messages.
 * Called from tickChannel after processing top-level messages.
 */
async function checkThreadReplies(channelId: string, channelName: string, messages: SlackMessage[], prevLastSeen: string | null) {
  const lastSeen = prevLastSeen;

  // Find parent messages with thread replies newer than our last check
  const threadParents = messages.filter(
    (m) => m.reply_count && m.reply_count > 0 && m.latest_reply &&
      (!lastSeen || parseFloat(m.latest_reply) > parseFloat(lastSeen)) &&
      !repliedThreads.has(m.ts),
  );

  for (const parent of threadParents.slice(0, 3)) { // Cap at 3 threads per tick
    try {
      const replies = await readHistory(channelId, 5, { threadTs: parent.ts });
      // Get only human replies (not our own agent replies)
      const humanReplies = replies.filter(
        (r) => !r.bot_id && r.ts !== parent.ts &&
          (!lastSeen || parseFloat(r.ts) > parseFloat(lastSeen)),
      );

      if (!humanReplies.length) continue;

      // Have a random agent respond in the thread
      const latestReply = humanReplies[humanReplies.length - 1];
      const candidates = agentRegistry.filter((a) => a.id !== "chairman");
      const agent = candidates[Math.floor(Math.random() * candidates.length)];

      const threadContext = replies.map((r) => {
        const who = r.bot_id ? (r.username ?? "agent") : (userCache.get(r.user) ?? "someone");
        return `${who}: ${r.text}`;
      }).join("\n");

      const response = await runLLM({
        runId: `slack-thread-${agent.id}-${Date.now()}`,
        agent: agent.id.toUpperCase(),
        purpose: "slack_chat",
        route: "DRAFT_GENERATION_FAST",
        preferredProvider: "anthropic",
        preferredModel: "claude-sonnet-4-20250514",
        messages: [
          { role: "system", content: buildSystemPrompt(agent, channelName) },
          { role: "user", content: `Thread in #${channelName}:\n${threadContext}\n\nReply to this thread naturally. Keep it short.` },
        ],
      });

      const reply = response.text.trim();
      if (reply) {
        await postAsAgent(channelId, agent.id, reply, { threadTs: parent.ts });
        repliedThreads.add(parent.ts);
        console.log(`[slackWorker] ${agent.name} replied in thread (${reply.length} chars) #${channelName}`);
      }
    } catch (err: any) {
      console.error(`[slackWorker] Thread check error: ${err?.message ?? err}`);
    }
  }

  // Prune old thread tracking (keep last 100)
  if (repliedThreads.size > 100) {
    const entries = [...repliedThreads];
    entries.slice(0, entries.length - 100).forEach((ts) => repliedThreads.delete(ts));
  }
}

// ── DM polling ───────────────────────────────────────────────────────────────

async function tickDMs() {
  let dms: { id: string; userId: string }[];
  try {
    dms = await listDMs();
  } catch {
    return; // Slack API error — skip silently
  }

  for (const dm of dms) {
    try {
      const lastSeen = lastSeenByDM.get(dm.id) ?? null;
      const messages = await readHistory(dm.id, 5, {
        oldest: lastSeen ?? undefined,
      });

      if (!messages.length) continue;

      messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

      const newMessages = lastSeen
        ? messages.filter((m) => parseFloat(m.ts) > parseFloat(lastSeen!) && !m.bot_id)
        : messages.filter((m) => !m.bot_id);

      if (!newMessages.length) {
        // Still update lastSeen to avoid re-processing
        const newestTs = messages[messages.length - 1].ts;
        lastSeenByDM.set(dm.id, newestTs);
        continue;
      }

      const newestTs = messages[messages.length - 1].ts;
      lastSeenByDM.set(dm.id, newestTs);

      // Resolve who's DMing us
      let senderName = userCache.get(dm.userId);
      if (!senderName) {
        const info = await getUserInfo(dm.userId);
        senderName = info?.realName ?? info?.name ?? "someone";
        userCache.set(dm.userId, senderName);
      }

      // Atlas handles all DMs
      const agent = agentRegistry.find((a) => a.id === "atlas") ?? agentRegistry[0];

      for (const msg of newMessages.slice(0, 2)) { // Cap at 2 DM responses per tick
        console.log(`[slackWorker] DM from ${senderName}: "${(msg.text ?? "").slice(0, 80)}"`);

        const response = await runLLM({
          runId: `slack-dm-${agent.id}-${Date.now()}`,
          agent: agent.id.toUpperCase(),
          purpose: "slack_chat",
          route: "DRAFT_GENERATION_FAST",
          preferredProvider: "anthropic",
          preferredModel: "claude-sonnet-4-20250514",
          messages: [
            { role: "system", content: buildSystemPrompt(agent) + "\nYou are responding to a direct message. Be helpful and personal." },
            { role: "user", content: `DM from ${senderName}: ${msg.text}` },
          ],
        });

        const reply = response.text.trim();
        if (reply) {
          await postAsAgent(dm.id, agent.id, reply);
          console.log(`[slackWorker] Atlas replied to DM (${reply.length} chars)`);
        }
      }
    } catch (err: any) {
      console.error(`[slackWorker] DM tick error: ${err?.message ?? err}`);
    }
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(
    `[slackWorker] Starting — polling ${CHANNEL_NAMES.map(c => "#" + c).join(", ")} every ${POLL_MS / 1000}s, context window: ${CONTEXT_MESSAGES} messages`,
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
