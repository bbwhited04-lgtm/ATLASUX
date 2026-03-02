/**
 * Telegram Full — extends existing telegramNotify.ts with read/history.
 *
 * Send: delegates to existing sendTelegramNotification()
 * Read: uses getUpdates API to fetch recent messages
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const TG_API = "https://api.telegram.org/bot";

async function getTelegramConfig(tenantId: string): Promise<{ botToken: string; chatId: string } | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase
      .from("integrations")
      .select("config")
      .eq("tenant_id", tenantId)
      .eq("provider", "telegram")
      .limit(1)
      .single();

    if (!data?.config) return null;
    const config = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
    const botToken = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = config.chat_id;
    if (!botToken || !chatId) return null;
    return { botToken, chatId };
  } catch {
    return null;
  }
}

export const telegramFullTool: ToolDefinition = {
  key:  "telegramFull",
  name: "Telegram Full",
  patterns: [
    /telegram\s*(?:history|messages?|chat|read|recent)/i,
    /read\s+telegram/i,
    /telegram\s*update/i,
  ],
  async execute(ctx) {
    try {
      const config = await getTelegramConfig(ctx.tenantId);
      if (!config) {
        return makeResult("telegram_full", "Telegram not configured for this account. Connect via Settings > Integrations.");
      }

      // Fetch recent updates
      const res = await fetch(`${TG_API}${config.botToken}/getUpdates?limit=15&allowed_updates=["message"]`);
      if (!res.ok) return makeResult("telegram_full", `Telegram API returned ${res.status}`);

      const json = await res.json() as { ok: boolean; result: Array<{ message?: { from?: { first_name?: string; username?: string }; text?: string; date?: number; chat?: { id: number } } }> };

      if (!json.ok) return makeResult("telegram_full", "Telegram API error — bot token may be invalid.");

      // Filter to messages from the tenant's chat
      const chatMessages = json.result
        .filter(u => u.message?.chat?.id === Number(config.chatId) && u.message?.text)
        .map(u => u.message!);

      if (!chatMessages.length) return makeResult("telegram_full", "No recent messages in your Telegram chat.");

      const lines = chatMessages.slice(-10).map((m, i) => {
        const who = m.from?.first_name ?? m.from?.username ?? "Unknown";
        const date = m.date ? new Date(m.date * 1000).toLocaleString() : "";
        return `${i + 1}. [${who}] ${m.text!.slice(0, 200)} (${date})`;
      });

      return makeResult("telegram_full", `Recent Telegram messages (${lines.length}):\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("telegram_full", err);
    }
  },
};
