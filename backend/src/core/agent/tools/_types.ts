/**
 * Shared types for the modular agent tool system.
 *
 * Every tool file under tools/ exports a ToolDefinition.
 * The registry loads them all and wires them into agentTools.ts.
 */

export type ToolContext = {
  tenantId: string;
  agentId:  string;
  query:    string;
};

export type ToolResult = {
  tool:   string;
  data:   string;
  usedAt: string;
};

export interface ToolDefinition {
  /** Permission key used in AGENT_TOOL_PERMISSIONS, e.g. "hackerNews" */
  key:      string;
  /** Human-readable name, e.g. "HackerNews Search" */
  name:     string;
  /** Regex patterns that trigger this tool when matched against the query */
  patterns: RegExp[];
  /** Execute the tool and return a result */
  execute:  (ctx: ToolContext) => Promise<ToolResult>;
}

/** Helper to build a ToolResult with the current timestamp */
export function makeResult(tool: string, data: string): ToolResult {
  return { tool, data, usedAt: new Date().toISOString() };
}

/** Helper to build an error ToolResult */
export function makeError(tool: string, err: unknown): ToolResult {
  const msg = err instanceof Error ? err.message : String(err);
  return { tool, data: `[error: ${msg}]`, usedAt: new Date().toISOString() };
}
