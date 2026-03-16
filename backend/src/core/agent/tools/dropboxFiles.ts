/**
 * Dropbox Files — Dropbox HTTP API v2 for listing/reading files.
 *
 * Auth: OAuth2 token from token_vault (provider: "dropbox").
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const DROPBOX_API = "https://api.dropboxapi.com/2";

async function getDropboxToken(tenantId: string): Promise<string | null> {
  try {
    const { loadEnv } = await import("../../../env.js");
    const { getProviderToken } = await import("../../../lib/tokenStore.js");
    const env = loadEnv(process.env);
    return getProviderToken(env, tenantId, "dropbox");
  } catch {
    return null;
  }
}

export const dropboxFilesTool: ToolDefinition = {
  key:  "dropbox",
  name: "Dropbox Files",
  patterns: [
    /dropbox/i,
    /cloud\s*file/i,
    /shared\s*folder/i,
  ],
  async execute(ctx) {
    try {
      const token = await getDropboxToken(ctx.tenantId);
      if (!token) {
        return makeResult("dropbox_files", "Dropbox not available — Dropbox account not connected. Connect via Settings > Integrations.");
      }

      const isSearch = /search|find|look/i.test(ctx.query);

      if (isSearch) {
        const searchTerms = ctx.query
          .replace(/(?:search|find)\s+(?:on\s+)?dropbox\s*(?:for)?\s*/i, "")
          .trim();

        const res = await fetch(`${DROPBOX_API}/files/search_v2`, {
          method: "POST",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchTerms, options: { max_results: 10 } }),
        });

        if (!res.ok) return makeResult("dropbox_files", `Dropbox search returned ${res.status}`);

        const json = await res.json() as { matches?: Array<{ metadata?: { metadata?: { name?: string; path_display?: string; size?: number } } }> };
        const matches = json.matches ?? [];
        if (!matches.length) return makeResult("dropbox_files", `No Dropbox files found for: ${searchTerms}`);

        const lines = matches.map((m, i) => {
          const meta = m.metadata?.metadata;
          const size = meta?.size ? ` (${(meta.size / 1024).toFixed(1)} KB)` : "";
          return `${i + 1}. ${meta?.name ?? "—"}${size}\n   ${meta?.path_display ?? ""}`;
        });

        return makeResult("dropbox_files", `Dropbox search results:\n${lines.join("\n")}`);
      }

      // Default: list root folder
      const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "", limit: 20 }),
      });

      if (!res.ok) return makeResult("dropbox_files", `Dropbox API returned ${res.status}`);

      const json = await res.json() as { entries?: Array<{ name: string; path_display: string; ".tag": string; size?: number }> };
      const entries = json.entries ?? [];
      if (!entries.length) return makeResult("dropbox_files", "Dropbox root folder is empty.");

      const lines = entries.map((e, i) => {
        const type = e[".tag"] === "folder" ? "[folder]" : `(${e.size ? (e.size / 1024).toFixed(1) + " KB" : "file"})`;
        return `${i + 1}. ${e.name} ${type}\n   ${e.path_display}`;
      });

      return makeResult("dropbox_files", `Dropbox root folder (${entries.length} items):\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("dropbox_files", err);
    }
  },
};
