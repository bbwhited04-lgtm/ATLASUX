/**
 * Tool Registry — loads all modular tool definitions and provides
 * detection + parallel resolution for agentTools.ts.
 *
 * New tools are added by:
 *   1. Creating a file in this directory that exports a ToolDefinition
 *   2. Importing it here and adding to the `ALL_TOOLS` array
 *
 * agentTools.ts calls resolveModularTools() alongside its existing tools.
 */

import type { ToolContext, ToolDefinition, ToolResult } from "./_types.js";

// ── Import tool modules (add new tools here) ─────────────────────────────────

import { hackerNewsTool }     from "./hackerNews.js";
import { arxivSearchTool }    from "./arxivSearch.js";
import { composioSearchTool } from "./composioSearch.js";
import { gmailReadTool }      from "./gmailRead.js";
import { googleCalendarTool } from "./googleCalendar.js";
import { googleSheetsTool }   from "./googleSheets.js";
import { discordSendTool }    from "./discordSend.js";
import { telegramFullTool }   from "./telegramFull.js";
import { excelParseTool }     from "./excelParse.js";
import { dropboxFilesTool }   from "./dropboxFiles.js";
import { xAnalyticsTool }       from "./xAnalytics.js";
import { postizPublishTool }    from "./postizPublish.js";
import { postizAnalyticsTool }  from "./postizAnalytics.js";
import { postizBroadcastTool }  from "./postizBroadcast.js";
import { slackChatTool }        from "./slackChat.js";

// ── Tool registry ────────────────────────────────────────────────────────────

const ALL_TOOLS: ToolDefinition[] = [
  hackerNewsTool,
  arxivSearchTool,
  composioSearchTool,
  gmailReadTool,
  googleCalendarTool,
  googleSheetsTool,
  discordSendTool,
  telegramFullTool,
  excelParseTool,
  dropboxFilesTool,
  xAnalyticsTool,
  postizPublishTool,
  postizAnalyticsTool,
  postizBroadcastTool,
  slackChatTool,
];

export function getAllTools(): ToolDefinition[] {
  return ALL_TOOLS;
}

/**
 * Detect which modular tools should fire, filtered by agent permissions.
 * Returns a map of tool key → true for tools whose patterns matched.
 */
export function detectModularNeeds(
  query: string,
  allowedKeys: string[],
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const tool of ALL_TOOLS) {
    if (!allowedKeys.includes(tool.key)) continue;
    result[tool.key] = tool.patterns.some(p => p.test(query));
  }
  return result;
}

/**
 * Run all triggered modular tools in parallel.
 * Only runs tools whose key is in `triggeredKeys`.
 */
export async function resolveModularTools(
  ctx: ToolContext,
  triggeredKeys: string[],
): Promise<ToolResult[]> {
  if (!triggeredKeys.length) return [];

  const jobs = ALL_TOOLS
    .filter(t => triggeredKeys.includes(t.key))
    .map(t => t.execute(ctx).catch(err => ({
      tool: t.key,
      data: `[error: ${err instanceof Error ? err.message : String(err)}]`,
      usedAt: new Date().toISOString(),
    })));

  return Promise.all(jobs);
}
