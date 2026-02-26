/**
 * Telegram Routes — two-way chat bridge.
 *
 * Agents can SEND notifications to users via the bot, AND users can
 * MESSAGE the bot to chat with Atlas (or any agent) in real-time.
 *
 * Incoming flow:
 *   User messages bot on Telegram
 *     → Telegram hits POST /v1/telegram/webhook
 *     → We look up the tenant by chat_id (Integration table)
 *     → Route the message through the chat engine (same as web chat)
 *     → Send Atlas's reply back through the bot
 *
 * Agent routing:
 *   /atlas  — talk to Atlas (default)
 *   /binky  — talk to Binky
 *   /cheryl — talk to Cheryl
 *   /help   — list available agents
 *   /start  — register this chat with your tenant
 */

import type { FastifyPluginAsync } from "fastify";
import { saveTelegramChatId, sendTelegramDirect } from "../lib/telegramNotify.js";
import { prisma } from "../db/prisma.js";
import { runChat } from "../ai.js";
import { getSkillBlock, loadAllSkills } from "../core/kb/skillLoader.js";
import { resolveAgentTools } from "../core/agent/agentTools.js";
import { agentRegistry } from "../agents/registry.js";
import { getKbContext } from "../core/kb/getKbContext.js";

// Ensure SKILL.md files are loaded
loadAllSkills();

const BOT_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = String(process.env.BOTFATHERTOKEN ?? "").trim();
  if (!token) throw new Error("BOTFATHERTOKEN not configured");
  return token;
}

// ── Conversation memory per chat (in-memory, last N turns) ──────────────────
// Key: `${chatId}` → array of {role, content}
const chatHistory = new Map<string, Array<{ role: string; content: string }>>();
const MAX_HISTORY = 20; // keep last 20 messages (10 exchanges)

function getHistory(chatId: string): Array<{ role: string; content: string }> {
  return chatHistory.get(chatId) ?? [];
}

function addToHistory(chatId: string, role: string, content: string) {
  const history = chatHistory.get(chatId) ?? [];
  history.push({ role, content });
  // Trim to max
  while (history.length > MAX_HISTORY) history.shift();
  chatHistory.set(chatId, history);
}

// ── Active agent per chat (defaults to atlas) ───────────────────────────────
const activeAgent = new Map<string, string>();

// ── Resolve tenant from Telegram chat_id ────────────────────────────────────
async function resolveTenantByChatId(chatId: string): Promise<string | null> {
  try {
    // Look for an Integration row where config contains this chat_id
    const integrations = await prisma.integration.findMany({
      where: { provider: "telegram", connected: true },
      select: { tenantId: true, config: true },
    });
    for (const row of integrations) {
      const cfg = (row.config ?? {}) as Record<string, any>;
      if (String(cfg.chat_id ?? "") === chatId) return row.tenantId;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Send a "typing" action so the user knows Atlas is thinking ──────────────
async function sendTyping(chatId: string) {
  try {
    const token = getBotToken();
    await fetch(`${BOT_API}${token}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
  } catch { /* best effort */ }
}

// ── Run the chat engine for a Telegram message ──────────────────────────────
async function runTelegramChat(
  tenantId: string,
  agentId: string,
  userText: string,
  chatId: string,
): Promise<string> {
  const agent = agentRegistry.find(a => a.id === agentId) ?? agentRegistry.find(a => a.id === "atlas")!;
  const effectiveAgentId = agent.id;

  // Build messages array with conversation history
  const history = getHistory(chatId);
  const messages: Array<{ role: string; content: string }> = [];

  // System prompt
  const contextParts: string[] = [];
  contextParts.push(
    `[ATLAS CONTEXT] You are ${agent.name}, the ${agent.title} of Atlas UX. ` +
    `You are chatting with the user via Telegram. Keep replies concise and conversational — ` +
    `Telegram messages should be shorter than web chat. Use markdown sparingly (Telegram supports *bold* and _italic_). ` +
    `You operate within a structured agent hierarchy and execute only after governance gates approve.`,
  );

  const skillBlock = getSkillBlock(effectiveAgentId);
  if (skillBlock) contextParts.push(skillBlock);

  // Agent tools (subscription info, calendar, etc.)
  const toolContext = await resolveAgentTools(tenantId, userText, effectiveAgentId).catch(() => "");
  if (toolContext) contextParts.push(toolContext);

  // KB context for complex questions
  const kb = await getKbContext({ tenantId, agentId: effectiveAgentId, query: userText.slice(0, 200) }).catch(() => null);
  if (kb?.text) {
    contextParts.push(`[KNOWLEDGE BASE — ${kb.items.length} docs]\n${kb.text.slice(0, 4000)}`);
  }

  messages.push({ role: "system", content: contextParts.join("\n\n") });

  // Add conversation history
  for (const turn of history) {
    messages.push(turn);
  }

  // Add current user message
  messages.push({ role: "user", content: userText });

  // Pick provider (prefer deepseek for speed, fallback to openai)
  const provider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "openai";
  const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";

  const result = await runChat({ provider, model, messages, agentId: effectiveAgentId }, process.env as any);
  const reply = String((result as any)?.content ?? "I couldn't generate a response. Try again.");

  // Save to history
  addToHistory(chatId, "user", userText);
  addToHistory(chatId, "assistant", reply);

  return reply;
}

export const telegramRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/telegram/me — verify bot is reachable (auth required)
  app.get("/me", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/getMe`);
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, bot: data.result ?? null });
    } catch (e: any) {
      return reply.code(503).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/telegram/send — send a message to a chat
  app.post("/send", async (req, reply) => {
    const body = (req.body ?? {}) as {
      chat_id?: string | number;
      text?: string;
      parse_mode?: string;
    };
    const chatId = body.chat_id;
    const text = String(body.text ?? "").trim();
    if (!chatId || !text) {
      return reply.code(400).send({ ok: false, error: "chat_id and text are required" });
    }
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: body.parse_mode ?? "Markdown",
        }),
      });
      const data = (await res.json()) as any;
      if (!data.ok) throw new Error(data.description ?? "telegram_send_failed");
      return reply.send({ ok: true, message_id: data.result?.message_id });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/telegram/updates — poll for recent incoming messages (auth required)
  app.get("/updates", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/getUpdates`);
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, updates: data.result ?? [] });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // ── POST /v1/telegram/webhook — TWO-WAY CHAT BRIDGE ──────────────────────
  // Telegram sends every incoming message here. We:
  //   1. Validate the secret token
  //   2. Parse the message + check for /commands
  //   3. Look up the tenant by chat_id
  //   4. Route through the chat engine
  //   5. Send Atlas's reply back via the bot
  app.post("/webhook", async (req, reply) => {
    // ── Secret token validation ───────────────────────────────────────────
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
    if (webhookSecret) {
      const provided = String(req.headers["x-telegram-bot-api-secret-token"] ?? "");
      if (provided !== webhookSecret) {
        return reply.code(403).send({ ok: false, error: "invalid_webhook_secret" });
      }
    }

    const body = req.body as any;
    const message = body?.message;

    // Telegram sends various update types — we only care about text messages
    if (!message?.text || !message?.chat?.id) {
      return reply.send({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = String(message.text).trim();
    const username = message.from?.username ?? message.from?.first_name ?? "user";

    req.log.info({ from: username, chat: chatId, text: text.slice(0, 100) }, "Telegram incoming");

    // ── /start — register this chat ─────────────────────────────────────
    if (text === "/start" || text.startsWith("/start ")) {
      const tenantId = await resolveTenantByChatId(chatId);
      if (tenantId) {
        await sendTelegramDirect(chatId,
          `Welcome back! This chat is linked to your Atlas UX tenant.\n\n` +
          `Talk to me like you would in the web chat. I'm Atlas by default.\n\n` +
          `Commands:\n` +
          `/atlas — switch to Atlas\n` +
          `/binky — switch to Binky\n` +
          `/cheryl — switch to Cheryl\n` +
          `/agent [name] — switch to any agent\n` +
          `/help — list all agents\n` +
          `/clear — reset conversation`,
          "",
        );
      } else {
        // Auto-link: find the first tenant without a Telegram chat linked, or prompt them
        await sendTelegramDirect(chatId,
          `Hi ${username}! I'm Atlas, your AI employee.\n\n` +
          `To link this chat to your Atlas UX account, go to:\n` +
          `atlasux.cloud → Messaging Hub → Telegram → paste this chat ID:\n\n` +
          `\`${chatId}\`\n\n` +
          `Once linked, you can chat with me right here.`,
          "Markdown",
        );
      }
      return reply.send({ ok: true });
    }

    // ── /help — list available agents ───────────────────────────────────
    if (text === "/help") {
      const agentLines = agentRegistry
        .filter(a => a.id !== "chairman")
        .map(a => `/${a.id} — ${a.name} (${a.title})`);
      await sendTelegramDirect(chatId,
        `Available agents:\n\n${agentLines.join("\n")}\n\n` +
        `Type /agent [name] to switch, or just send a message to talk to your current agent.\n` +
        `/clear — reset conversation history`,
        "",
      );
      return reply.send({ ok: true });
    }

    // ── /clear — reset conversation history ─────────────────────────────
    if (text === "/clear") {
      chatHistory.delete(chatId);
      activeAgent.delete(chatId);
      await sendTelegramDirect(chatId, "Conversation cleared. Starting fresh with Atlas.", "");
      return reply.send({ ok: true });
    }

    // ── /agent [name] or /[agentname] — switch active agent ─────────────
    const agentCmd = text.match(/^\/agent\s+(\w+)/i) ?? text.match(/^\/(\w+)$/);
    if (agentCmd) {
      const requested = agentCmd[1].toLowerCase();
      const found = agentRegistry.find(
        a => a.id === requested || a.name.toLowerCase() === requested,
      );
      if (found && found.id !== "chairman") {
        activeAgent.set(chatId, found.id);
        chatHistory.delete(chatId); // fresh context for new agent
        await sendTelegramDirect(chatId,
          `Switched to *${found.name}* (${found.title}). Conversation reset.\n\nGo ahead, I'm listening.`,
          "Markdown",
        );
        return reply.send({ ok: true });
      }
      // If it doesn't match any agent, treat it as a regular message (fall through)
      // But only if it's not a known Telegram command that we should ignore
      if (["settings", "privacy", "language"].includes(requested)) {
        return reply.send({ ok: true });
      }
    }

    // ── Resolve tenant ──────────────────────────────────────────────────
    const tenantId = await resolveTenantByChatId(chatId);
    if (!tenantId) {
      await sendTelegramDirect(chatId,
        `This chat isn't linked to an Atlas UX account yet.\n\n` +
        `Go to atlasux.cloud → Messaging Hub → Telegram and save this chat ID:\n\`${chatId}\``,
        "Markdown",
      );
      return reply.send({ ok: true });
    }

    // ── Show typing indicator ───────────────────────────────────────────
    await sendTyping(chatId);

    // ── Route through chat engine ───────────────────────────────────────
    const agentId = activeAgent.get(chatId) ?? "atlas";

    try {
      const aiReply = await runTelegramChat(tenantId, agentId, text, chatId);

      // Telegram has a 4096 char limit per message — split if needed
      const chunks: string[] = [];
      let remaining = aiReply;
      while (remaining.length > 0) {
        chunks.push(remaining.slice(0, 4000));
        remaining = remaining.slice(4000);
      }

      for (const chunk of chunks) {
        await sendTelegramDirect(chatId, chunk, "Markdown");
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: null,
          actorExternalId: `telegram:${username}`,
          actorType: "user",
          level: "info",
          action: "TELEGRAM_CHAT",
          entityType: "message",
          entityId: null,
          message: `Telegram chat with ${agentId}: "${text.slice(0, 120)}"`,
          meta: { chatId, agentId, userText: text.slice(0, 500), replyLength: aiReply.length },
          timestamp: new Date(),
        },
      } as any).catch(() => null);
    } catch (err: any) {
      req.log.error({ err, chatId, agentId }, "Telegram chat engine error");
      await sendTelegramDirect(chatId,
        `Sorry, I hit an error processing that. Try again in a moment.\n\n_${(err?.message ?? "unknown error").slice(0, 200)}_`,
        "Markdown",
      );
    }

    return reply.send({ ok: true });
  });

  // POST /v1/telegram/save-chat — save the default chat_id for this tenant
  app.post("/save-chat", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const chatId = String(body.chatId ?? "").trim();
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });
    if (!chatId) return reply.code(400).send({ ok: false, error: "chatId required" });
    try {
      await saveTelegramChatId(tenantId, chatId);
      return reply.send({ ok: true, chatId });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/telegram/default-chat — get the saved default chat_id for this tenant
  app.get("/default-chat", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });
    try {
      const integration = await prisma.integration.findUnique({
        where: { tenantId_provider: { tenantId, provider: "telegram" } },
        select: { config: true, connected: true },
      });
      const config = (integration?.config ?? {}) as Record<string, any>;
      const chatId = String(config.chat_id ?? "").trim() || null;
      return reply.send({ ok: true, chatId });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/telegram/set_webhook — register the Atlas webhook URL with Telegram
  // Includes secret_token so we can verify incoming requests are from Telegram
  app.post("/set_webhook", async (req, reply) => {
    const body = (req.body ?? {}) as { url?: string };
    const url = String(body.url ?? "").trim();
    if (!url) return reply.code(400).send({ ok: false, error: "url required" });
    try {
      const token = getBotToken();
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
      const payload: Record<string, any> = { url };
      if (secret) payload.secret_token = secret;
      // Allow all update types we care about
      payload.allowed_updates = ["message"];

      const res = await fetch(`${BOT_API}${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, description: data.description });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // DELETE /v1/telegram/webhook — remove the webhook (switch back to polling)
  app.delete("/webhook", async (_req, reply) => {
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/deleteWebhook`, { method: "POST" });
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, description: data.description });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/telegram/webhook-info — check current webhook status
  app.get("/webhook-info", async (_req, reply) => {
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/getWebhookInfo`);
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, info: data.result ?? null });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });
};
