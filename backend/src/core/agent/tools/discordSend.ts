/**
 * Discord Send — Discord Bot API for sending/reading messages.
 *
 * Requires: DISCORD_BOT_TOKEN, DISCORD_DEFAULT_CHANNEL_ID env vars.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const DISCORD_API = "https://discord.com/api/v10";

export const discordSendTool: ToolDefinition = {
  key:  "discord",
  name: "Discord",
  patterns: [
    /discord/i,
    /send\s+(?:to\s+)?discord/i,
    /discord\s*message/i,
    /discord\s*channel/i,
  ],
  async execute(ctx) {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;
      const channelId = process.env.DISCORD_DEFAULT_CHANNEL_ID;

      if (!token) return makeResult("discord", "Discord not configured — DISCORD_BOT_TOKEN not set.");
      if (!channelId) return makeResult("discord", "Discord not configured — DISCORD_DEFAULT_CHANNEL_ID not set.");

      const headers = {
        Authorization:  `Bot ${token}`,
        "Content-Type": "application/json",
      };

      // Detect if this is a send or read request
      const isSend = /send|post|write|tell|notify/i.test(ctx.query);

      if (isSend) {
        // Extract message content
        const messageContent = ctx.query
          .replace(/(?:send|post|write)\s+(?:to\s+)?discord\s*:?\s*/i, "")
          .replace(/(?:send|post)\s+(?:a\s+)?(?:message\s+)?(?:to\s+)?(?:discord)\s*:?\s*/i, "")
          .trim();

        if (!messageContent) return makeResult("discord", "No message content provided. Try: 'send to discord: Hello team!'");

        const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: messageContent }),
        });

        if (!res.ok) return makeResult("discord", `Discord API returned ${res.status} — check bot permissions.`);
        return makeResult("discord", `Message sent to Discord channel: "${messageContent.slice(0, 100)}"`);
      }

      // Read recent messages
      const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=10`, { headers });
      if (!res.ok) return makeResult("discord", `Discord API returned ${res.status}`);

      const messages = await res.json() as Array<{ content: string; author: { username: string }; timestamp: string }>;
      if (!messages.length) return makeResult("discord", "No recent messages in Discord channel.");

      const lines = messages.map((m, i) => {
        const date = new Date(m.timestamp).toLocaleString();
        return `${i + 1}. [${m.author.username}] ${m.content.slice(0, 150)} (${date})`;
      });

      return makeResult("discord", `Recent Discord messages (${lines.length}):\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("discord", err);
    }
  },
};
