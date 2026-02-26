import type { FastifyPluginAsync } from "fastify";
import { saveTelegramChatId } from "../lib/telegramNotify.js";
import { prisma } from "../db/prisma.js";

const BOT_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = String(process.env.BOTFATHERTOKEN ?? "").trim();
  if (!token) throw new Error("BOTFATHERTOKEN not configured");
  return token;
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

  // POST /v1/telegram/webhook — receive incoming updates from Telegram
  // Validates the request comes from Telegram via the secret_token header
  app.post("/webhook", async (req, reply) => {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
    if (webhookSecret) {
      const provided = String(req.headers["x-telegram-bot-api-secret-token"] ?? "");
      if (provided !== webhookSecret) {
        return reply.code(403).send({ ok: false, error: "invalid_webhook_secret" });
      }
    }

    const body = req.body as any;
    const message = body?.message;
    if (message) {
      req.log.info(
        { from: message.from?.username, chat: message.chat?.id, text: message.text },
        "Telegram incoming message"
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
  app.post("/set_webhook", async (req, reply) => {
    const body = (req.body ?? {}) as { url?: string };
    const url = String(body.url ?? "").trim();
    if (!url) return reply.code(400).send({ ok: false, error: "url required" });
    try {
      const token = getBotToken();
      const res = await fetch(`${BOT_API}${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as any;
      return reply.send({ ok: data.ok, description: data.description });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });
};
