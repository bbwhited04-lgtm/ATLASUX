/**
 * Slack Chat — Inter-agent communication tool.
 *
 * Agents use this to send messages, read conversations, and reply
 * in Slack channels (#atlas-ux, #atlas-ux-execs). Each agent gets
 * their own display name and emoji avatar via chat:write.customize.
 *
 * Requires: SLACK_BOT_TOKEN env var.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import {
  postAsAgent,
  readHistory,
  getAgentChannels,
  getChannelByName,
  replyAsAgent,
} from "../../../services/slack.js";

export const slackChatTool: ToolDefinition = {
  key:  "slackChat",
  name: "Slack Chat",
  patterns: [
    /slack/i,
    /\bchat\s+(?:in|on|with)\s+(?:#?\w)/i,
    /(?:send|post|write)\s+(?:to\s+)?(?:#?atlas[\w-]*)/i,
    /(?:read|check|see)\s+(?:#?atlas[\w-]*)\s*(?:channel|chat|messages?)?/i,
    /inter[\s-]?agent\s+(?:chat|comm|message)/i,
    /agent\s+(?:slack|channel|chat)/i,
  ],
  async execute(ctx) {
    try {
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) return makeResult("slackChat", "Slack not configured — SLACK_BOT_TOKEN not set.");

      const query = ctx.query;
      const agentId = ctx.agentId;

      // Detect if this is a send or read request
      const isSend = /(?:send|post|write|say|tell|announce|share|chat|reply|respond)/i.test(query);
      const isRead = /(?:read|check|see|get|show|what|latest|recent|history|catch\s*up)/i.test(query);

      // Determine target channel
      const isExecs = /exec|executive|leadership|board|private/i.test(query);

      const channels = await getAgentChannels();

      // Also check for custom channel names
      const customMatch = query.match(/#([\w-]+)/);
      let targetChannel = isExecs
        ? channels.execs
        : channels.general;

      if (customMatch) {
        const custom = await getChannelByName(customMatch[1], true);
        if (custom) targetChannel = custom;
      }

      if (!targetChannel) {
        return makeResult("slackChat", "Could not find the target Slack channel. Make sure #atlas-ux exists and the bot is invited.");
      }

      // ── Send mode ──────────────────────────────────────────────────────────
      if (isSend && !isRead) {
        // Extract message content — strip the command prefix
        let message = query
          .replace(/(?:send|post|write|say|tell|announce|share)\s+(?:to\s+)?(?:#?[\w-]+\s*(?:channel)?\s*:?\s*)/i, "")
          .replace(/(?:chat|reply|respond)\s+(?:in\s+)?(?:#?[\w-]+\s*:?\s*)/i, "")
          .replace(/(?:on|in|to)\s+slack\s*:?\s*/i, "")
          .trim();

        // If no extracted message, use the whole query as context
        if (!message || message.length < 3) {
          message = query;
        }

        const result = await postAsAgent(targetChannel.id, agentId, message);

        if (!result.ok) {
          return makeResult("slackChat", `Failed to post to #${targetChannel.name}: ${result.error}`);
        }

        return makeResult(
          "slackChat",
          `Posted to #${targetChannel.name} as ${agentId}: "${message.slice(0, 100)}${message.length > 100 ? "..." : ""}"`,
        );
      }

      // ── Read mode (default) ────────────────────────────────────────────────
      const messages = await readHistory(targetChannel.id, 15);

      if (!messages.length) {
        return makeResult("slackChat", `No recent messages in #${targetChannel.name}.`);
      }

      const lines = messages
        .reverse() // chronological order
        .map((m) => {
          const who = m.username ?? m.user ?? "unknown";
          const time = m.ts ? new Date(parseFloat(m.ts) * 1000).toLocaleTimeString() : "";
          const thread = m.thread_ts && m.thread_ts !== m.ts ? " [thread]" : "";
          return `[${time}] ${who}${thread}: ${m.text.slice(0, 200)}`;
        });

      return makeResult(
        "slackChat",
        `Recent messages in #${targetChannel.name} (${lines.length}):\n${lines.join("\n")}`,
      );
    } catch (err) {
      return makeError("slackChat", err);
    }
  },
};
