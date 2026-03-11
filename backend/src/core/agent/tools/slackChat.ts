/**
 * Slack Chat — Full inter-agent communication tool.
 *
 * Capabilities:
 *   - Channel messaging (send, read, reply in threads)
 *   - DMs between agents (private channels simulate 1:1 conversations)
 *   - File upload/view/list (share docs, reports, code between agents)
 *   - Workflow creation (automated multi-step Slack sequences)
 *   - Canvas creation & editing (collaborative documents in Slack)
 *
 * Requires: SLACK_BOT_TOKEN env var.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { resolveCredential } from "../../../services/credentialResolver.js";
import {
  postAsAgent,
  readHistory,
  getAgentChannels,
  getChannelByName,
  replyAsAgent,
  sendDM,
  readDM,
  uploadFile,
  listFiles,
  downloadFile,
  createChannel,
  setTopic,
  addReaction,
  runWorkflow,
  createCanvas,
  updateCanvas,
} from "../../../services/slack.js";
import type { SlackWorkflowStep } from "../../../services/slack.js";

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
    /\b(?:dm|direct\s*message)\s+\w+/i,
    /(?:upload|share|attach)\s+(?:file|doc|report)/i,
    /(?:list|show|get)\s+files/i,
    /(?:workflow|automate|sequence)/i,
    /canvas/i,
  ],
  async execute(ctx) {
    try {
      const token = await resolveCredential(ctx.tenantId, "slack");
      if (!token) return makeResult("slackChat", "Slack bot token is not configured. Add your Slack bot token in Settings > Integrations.");

      const query = ctx.query;
      const agentId = ctx.agentId;

      // ── Route to the right sub-handler ─────────────────────────────────

      // Canvas operations
      if (/canvas/i.test(query)) {
        return await handleCanvas(query, agentId);
      }

      // DM operations
      if (/(?:dm|direct\s*message)\s+(\w+)/i.test(query)) {
        return await handleDM(query, agentId);
      }

      // File operations
      if (/(?:upload|share|attach)\s+(?:file|doc|report)/i.test(query)) {
        return await handleFileUpload(query, agentId);
      }
      if (/(?:list|show|get)\s+files/i.test(query)) {
        return await handleFileList(query, agentId);
      }

      // Workflow operations
      if (/(?:workflow|automate|sequence|run\s+steps)/i.test(query)) {
        return await handleWorkflow(query, agentId);
      }

      // Channel create
      if (/(?:create|make|new)\s+(?:#?\s*)?channel/i.test(query)) {
        return await handleCreateChannel(query);
      }

      // Default: send or read channel messages
      return await handleChannelMessage(query, agentId);

    } catch (err) {
      return makeError("slackChat", err);
    }
  },
};

// ── Sub-handlers ────────────────────────────────────────────────────────────

async function handleChannelMessage(query: string, agentId: string) {
  const isSend = /(?:send|post|write|say|tell|announce|share|chat|reply|respond)/i.test(query);
  const isRead = /(?:read|check|see|get|show|what|latest|recent|history|catch\s*up)/i.test(query);

  const isExecs = /exec|executive|leadership|board|private/i.test(query);
  const channels = await getAgentChannels();

  const customMatch = query.match(/#([\w-]+)/);
  let targetChannel = isExecs ? channels.execs : channels.general;

  if (customMatch) {
    const custom = await getChannelByName(customMatch[1], true);
    if (custom) targetChannel = custom;
  }

  if (!targetChannel) {
    return makeResult("slackChat", "Could not find the target Slack channel. Make sure #atlas-ux exists and the bot is invited.");
  }

  if (isSend && !isRead) {
    let message = query
      .replace(/(?:send|post|write|say|tell|announce|share)\s+(?:to\s+)?(?:#?[\w-]+\s*(?:channel)?\s*:?\s*)/i, "")
      .replace(/(?:chat|reply|respond)\s+(?:in\s+)?(?:#?[\w-]+\s*:?\s*)/i, "")
      .replace(/(?:on|in|to)\s+slack\s*:?\s*/i, "")
      .trim();

    if (!message || message.length < 3) message = query;

    const result = await postAsAgent(targetChannel.id, agentId, message);
    if (!result.ok) return makeResult("slackChat", `Failed to post to #${targetChannel.name}: ${result.error}`);

    return makeResult("slackChat", `Posted to #${targetChannel.name} as ${agentId}: "${message.slice(0, 100)}${message.length > 100 ? "..." : ""}"`);
  }

  // Read mode
  const messages = await readHistory(targetChannel.id, 15);
  if (!messages.length) return makeResult("slackChat", `No recent messages in #${targetChannel.name}.`);

  const lines = messages.reverse().map((m) => {
    const who = m.username ?? m.user ?? "unknown";
    const time = m.ts ? new Date(parseFloat(m.ts) * 1000).toLocaleTimeString() : "";
    const thread = m.thread_ts && m.thread_ts !== m.ts ? " [thread]" : "";
    return `[${time}] ${who}${thread}: ${m.text.slice(0, 200)}`;
  });

  return makeResult("slackChat", `Recent messages in #${targetChannel.name} (${lines.length}):\n${lines.join("\n")}`);
}

async function handleDM(query: string, agentId: string) {
  const targetMatch = query.match(/(?:dm|direct\s*message)\s+(\w+)/i);
  const targetAgent = targetMatch?.[1]?.toLowerCase() ?? "";
  if (!targetAgent) return makeResult("slackChat", "Specify the agent to DM, e.g. 'dm binky: hey what's up'");

  const isRead = /(?:read|check|see|history)/i.test(query);

  if (isRead) {
    const messages = await readDM(agentId, targetAgent, 15);
    if (!messages.length) return makeResult("slackChat", `No DM history between ${agentId} and ${targetAgent}.`);

    const lines = messages.reverse().map((m) => {
      const who = m.username ?? m.user ?? "unknown";
      const time = m.ts ? new Date(parseFloat(m.ts) * 1000).toLocaleTimeString() : "";
      return `[${time}] ${who}: ${m.text.slice(0, 200)}`;
    });

    return makeResult("slackChat", `DM history (${agentId} ↔ ${targetAgent}):\n${lines.join("\n")}`);
  }

  // Send DM
  let message = query
    .replace(/(?:dm|direct\s*message)\s+\w+\s*:?\s*/i, "")
    .replace(/(?:on|in|to|via)\s+slack\s*:?\s*/i, "")
    .trim();

  if (!message || message.length < 2) message = query;

  const result = await sendDM(agentId, targetAgent, message);
  if (!result.ok) return makeResult("slackChat", `DM failed: ${result.error}`);

  return makeResult("slackChat", `DM sent from ${agentId} → ${targetAgent}: "${message.slice(0, 100)}"`);
}

async function handleFileUpload(query: string, agentId: string) {
  // Extract filename and content from the query
  // Pattern: "upload file report.md: contents here" or "share file with #channel"
  const filenameMatch = query.match(/(?:file|doc|report)\s+(?:named?\s+)?["']?([^\s"':]+)["']?\s*:?\s*/i);
  const filename = filenameMatch?.[1] ?? `${agentId}-${Date.now()}.txt`;

  // Content is everything after the filename
  let content = query
    .replace(/.*(?:file|doc|report)\s+(?:named?\s+)?["']?[^\s"':]+["']?\s*:?\s*/i, "")
    .trim();

  if (!content || content.length < 2) {
    return makeResult("slackChat", "Provide file content after the filename. Example: 'upload file report.md: # My Report\\nContent here'");
  }

  // Determine channel
  const channels = await getAgentChannels();
  const customMatch = query.match(/#([\w-]+)/);
  let targetChannel = channels.general;
  if (customMatch) {
    const custom = await getChannelByName(customMatch[1], true);
    if (custom) targetChannel = custom;
  }

  if (!targetChannel) return makeResult("slackChat", "No target channel found for file upload.");

  const result = await uploadFile(targetChannel.id, { filename, content, agentId });
  if (!result.ok) return makeResult("slackChat", `File upload failed: ${result.error}`);

  return makeResult("slackChat", `File "${filename}" uploaded to #${targetChannel.name} by ${agentId}. Permalink: ${result.permalink ?? "N/A"}`);
}

async function handleFileList(query: string, _agentId: string) {
  const channels = await getAgentChannels();
  const customMatch = query.match(/#([\w-]+)/);
  let targetChannel = channels.general;
  if (customMatch) {
    const custom = await getChannelByName(customMatch[1], true);
    if (custom) targetChannel = custom;
  }

  if (!targetChannel) return makeResult("slackChat", "No channel found.");

  const files = await listFiles(targetChannel.id, 15);
  if (!files.length) return makeResult("slackChat", `No files in #${targetChannel.name}.`);

  const lines = files.map((f, i) => {
    const size = f.size > 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${f.size}B`;
    const date = new Date(f.created * 1000).toLocaleDateString();
    return `${i + 1}. ${f.title} (${f.mimetype}, ${size}) — ${date}`;
  });

  return makeResult("slackChat", `Files in #${targetChannel.name} (${files.length}):\n${lines.join("\n")}`);
}

async function handleWorkflow(query: string, agentId: string) {
  // Parse workflow steps from natural language
  // Patterns: "workflow: send 'hello' to #atlas-ux, wait 2s, upload file report.txt: data, send 'done'"
  const channels = await getAgentChannels();
  const defaultChannel = channels.general?.id;

  if (!defaultChannel) return makeResult("slackChat", "No default channel available for workflow.");

  // Parse simple step descriptions separated by commas or semicolons or "then"
  const stepTexts = query
    .replace(/^.*?(?:workflow|automate|sequence|run\s+steps)\s*:?\s*/i, "")
    .split(/\s*(?:,|;|\bthen\b)\s*/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (!stepTexts.length) {
    return makeResult("slackChat", `Describe workflow steps separated by commas. Example: "workflow: send 'hello' to #atlas-ux, wait 2s, send 'done'"`);
  }

  const steps: SlackWorkflowStep[] = stepTexts.map(text => {
    // Wait step
    const waitMatch = text.match(/wait\s+(\d+)\s*s/i);
    if (waitMatch) return { action: "wait" as const, delayMs: parseInt(waitMatch[1]) * 1000 };

    // Upload step
    if (/upload|file/i.test(text)) {
      const parts = text.match(/(?:upload|file)\s+(\S+)\s*:?\s*(.*)/i);
      return {
        action: "upload_file" as const,
        filename: parts?.[1] ?? "workflow-file.txt",
        content: parts?.[2] ?? text,
        agentId,
      };
    }

    // Topic step
    if (/topic/i.test(text)) {
      const topicText = text.replace(/.*topic\s*:?\s*/i, "").trim();
      return { action: "set_topic" as const, text: topicText || text };
    }

    // Default: send message
    const msgContent = text
      .replace(/^send\s+/i, "")
      .replace(/^['"]|['"]$/g, "")
      .trim();
    return { action: "send_message" as const, text: msgContent || text, agentId };
  });

  const result = await runWorkflow(steps, { channel: defaultChannel, agentId });
  const summary = result.results.map((r, i) =>
    `  Step ${i + 1}: ${r.ok ? "OK" : `FAIL — ${r.error}`}`
  ).join("\n");

  return makeResult("slackChat", `Workflow completed (${result.ok ? "all passed" : "some failed"}):\n${summary}`);
}

async function handleCreateChannel(query: string) {
  const nameMatch = query.match(/channel\s+(?:named?\s+)?#?([a-z0-9-_]+)/i);
  if (!nameMatch) return makeResult("slackChat", "Specify channel name. Example: 'create channel #project-alpha'");

  const isPrivate = /private/i.test(query);
  const purposeMatch = query.match(/(?:purpose|about|for)\s*:?\s*(.+)/i);

  const ch = await createChannel(nameMatch[1], {
    isPrivate,
    purpose: purposeMatch?.[1]?.trim(),
  });

  if (!ch) return makeResult("slackChat", `Failed to create channel #${nameMatch[1]} — may already exist.`);
  return makeResult("slackChat", `Channel #${ch.name} created (${isPrivate ? "private" : "public"}).`);
}

async function handleCanvas(query: string, agentId: string) {
  const isCreate = /(?:create|new|start|make)\s+canvas/i.test(query);
  const isUpdate = /(?:update|edit|add\s+to|append|write\s+(?:to|on))\s+canvas/i.test(query);

  if (isCreate) {
    // Extract title and content
    const titleMatch = query.match(/canvas\s+(?:titled?|named?|called)\s+["']?([^"'\n:]+)["']?/i);
    const title = titleMatch?.[1]?.trim() ?? `${agentId}-canvas-${Date.now()}`;

    let content = query
      .replace(/.*canvas\s+(?:titled?|named?|called)\s+["']?[^"'\n:]+["']?\s*:?\s*/i, "")
      .trim();

    if (!content || content.length < 2) {
      // Use everything after "canvas" as content
      content = query.replace(/.*canvas\s*:?\s*/i, "").trim();
    }

    if (!content) content = `Canvas created by ${agentId}`;

    // Determine channel to post the canvas in
    const channels = await getAgentChannels();
    const channelId = channels.general?.id;

    const result = await createCanvas(title, content, channelId ?? undefined, agentId);
    if (!result.ok) return makeResult("slackChat", `Canvas creation failed: ${result.error}`);
    return makeResult("slackChat", `Canvas "${title}" created by ${agentId}. ID: ${result.canvasId ?? "N/A"}`);
  }

  if (isUpdate) {
    const canvasIdMatch = query.match(/canvas\s+([A-Z0-9]+)/i);
    if (!canvasIdMatch) return makeResult("slackChat", "Specify canvas ID to update. Example: 'update canvas F12345: new content here'");

    let content = query
      .replace(/.*canvas\s+[A-Z0-9]+\s*:?\s*/i, "")
      .trim();

    if (!content) return makeResult("slackChat", "Provide content to add to the canvas.");

    const result = await updateCanvas(canvasIdMatch[1], content);
    if (!result.ok) return makeResult("slackChat", `Canvas update failed: ${result.error}`);
    return makeResult("slackChat", `Canvas ${canvasIdMatch[1]} updated by ${agentId}.`);
  }

  return makeResult("slackChat", "Canvas commands: 'create canvas titled My Doc: content here' or 'update canvas F12345: new content'");
}
