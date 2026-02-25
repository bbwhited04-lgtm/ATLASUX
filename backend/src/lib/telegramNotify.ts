/**
 * telegramNotify.ts
 *
 * Shared utility for sending Telegram messages from anywhere in the backend
 * (agent tools, workers, routes) without duplicating bot logic.
 *
 * Requires:
 *   BOTFATHERTOKEN env var — the Telegram bot token from @BotFather
 *
 * The tenant's default chat_id is stored in the Integration table:
 *   provider: "telegram", config: { chat_id: "123456789" }
 *
 * Usage:
 *   await sendTelegramNotification(tenantId, "Growth loop finished 🚀");
 *   await sendTelegramDirect(chatId, "Hello from Atlas");
 */

import { prisma } from "../prisma.js";

const TG_API = "https://api.telegram.org/bot";

// ── Low-level send (no DB lookup) ─────────────────────────────────────────────

export async function sendTelegramDirect(
  chatId: string | number,
  text: string,
  parseMode: "Markdown" | "HTML" | "" = "Markdown",
): Promise<{ ok: boolean; message_id?: number; error?: string }> {
  const token = String(process.env.BOTFATHERTOKEN ?? "").trim();
  if (!token) return { ok: false, error: "BOTFATHERTOKEN not configured" };
  if (!chatId || !text) return { ok: false, error: "chatId and text are required" };

  try {
    const res = await fetch(`${TG_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
      }),
    });
    const data = (await res.json()) as any;
    if (!data.ok) return { ok: false, error: data.description ?? "send_failed" };
    return { ok: true, message_id: data.result?.message_id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "network_error" };
  }
}

// ── Tenant-aware send (reads chat_id from Integration table) ──────────────────

export async function sendTelegramNotification(
  tenantId: string,
  text: string,
  parseMode: "Markdown" | "HTML" | "" = "Markdown",
): Promise<{ ok: boolean; chat_id?: string; error?: string }> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { tenantId_provider: { tenantId, provider: "telegram" } },
      select: { config: true, connected: true },
    });

    const config = (integration?.config ?? {}) as Record<string, any>;
    const chatId = String(config.chat_id ?? "").trim();

    if (!chatId) {
      return { ok: false, error: "No default Telegram chat configured. Open Messaging Hub → Telegram → set a default chat." };
    }

    const result = await sendTelegramDirect(chatId, text, parseMode);
    return { ...result, chat_id: chatId };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "db_error" };
  }
}

// ── Save default chat_id for a tenant ────────────────────────────────────────

export async function saveTelegramChatId(
  tenantId: string,
  chatId: string,
): Promise<void> {
  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId, provider: "telegram" } },
    create: {
      tenantId,
      provider: "telegram",
      connected: true,
      config: { chat_id: chatId },
    },
    update: {
      connected: true,
      config: { chat_id: chatId },
    },
  });
}
