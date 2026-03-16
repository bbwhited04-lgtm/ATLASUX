/**
 * Google Sheets — Google Sheets API v4 via OAuth2 token from token_vault.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

async function getGoogleToken(tenantId: string): Promise<string | null> {
  try {
    const { loadEnv } = await import("../../../env.js");
    const { getProviderToken } = await import("../../../lib/tokenStore.js");
    const env = loadEnv(process.env);
    return getProviderToken(env, tenantId, "google");
  } catch {
    return null;
  }
}

/** Extract a Google Sheets ID from a URL or plain ID */
function extractSheetId(query: string): string | null {
  // Match spreadsheet URLs
  const urlMatch = query.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  // Match bare IDs (44 chars alphanumeric)
  const idMatch = query.match(/\b([a-zA-Z0-9_-]{30,50})\b/);
  return idMatch ? idMatch[1] : null;
}

export const googleSheetsTool: ToolDefinition = {
  key:  "googleSheets",
  name: "Google Sheets",
  patterns: [
    /google\s*sheet/i,
    /spreadsheet/i,
    /\bgsheet/i,
  ],
  async execute(ctx) {
    try {
      const token = await getGoogleToken(ctx.tenantId);
      if (!token) {
        return makeResult("google_sheets", "Google Sheets not available — Google account not connected. Connect via Settings > Integrations.");
      }

      const sheetId = extractSheetId(ctx.query);
      if (!sheetId) {
        return makeResult("google_sheets", "Please provide a Google Sheets URL or sheet ID. Example: 'read spreadsheet https://docs.google.com/spreadsheets/d/...'");
      }

      // Get spreadsheet metadata + first sheet data
      const res = await fetch(`${SHEETS_API}/${sheetId}?includeGridData=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return makeResult("google_sheets", `Sheets API returned ${res.status} — check that the sheet is shared with your Google account.`);

      const meta = await res.json() as { properties?: { title?: string }; sheets?: Array<{ properties?: { title?: string; sheetId?: number } }> };
      const title = meta.properties?.title ?? "Untitled";
      const sheets = meta.sheets ?? [];

      // Read first sheet's data (A1:Z50)
      const firstSheet = sheets[0]?.properties?.title ?? "Sheet1";
      const dataRes = await fetch(
        `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(firstSheet)}!A1:Z50`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!dataRes.ok) return makeResult("google_sheets", `Sheet "${title}" found but could not read data (${dataRes.status}).`);

      const dataJson = await dataRes.json() as { values?: string[][] };
      const rows = dataJson.values ?? [];
      if (!rows.length) return makeResult("google_sheets", `Sheet "${title}" (${firstSheet}) is empty.`);

      // Format as markdown table
      const header = rows[0];
      const divider = header.map(() => "---");
      const tableRows = [header, divider, ...rows.slice(1, 20)]; // cap at 20 rows
      const table = tableRows.map(r => `| ${r.join(" | ")} |`).join("\n");

      const summary = `Spreadsheet: ${title} | Sheet: ${firstSheet} | ${rows.length} rows\n\n${table}`;
      if (rows.length > 20) {
        return makeResult("google_sheets", `${summary}\n\n... (${rows.length - 20} more rows not shown)`);
      }
      return makeResult("google_sheets", summary);
    } catch (err) {
      return makeError("google_sheets", err);
    }
  },
};
