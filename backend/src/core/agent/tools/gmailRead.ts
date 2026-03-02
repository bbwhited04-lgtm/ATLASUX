/**
 * Gmail Read — Google Gmail API via OAuth2 token from token_vault.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

async function getGoogleToken(tenantId: string): Promise<string | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase
      .from("token_vault")
      .select("access_token")
      .eq("org_id", tenantId)
      .eq("provider", "google")
      .limit(1)
      .single();
    return data?.access_token ?? null;
  } catch {
    return null;
  }
}

export const gmailReadTool: ToolDefinition = {
  key:  "gmailRead",
  name: "Gmail Read",
  patterns: [
    /gmail/i,
    /\bemail\b/i,
    /\binbox\b/i,
    /unread\s*mail/i,
    /check\s*(?:my\s*)?mail/i,
  ],
  async execute(ctx) {
    try {
      const token = await getGoogleToken(ctx.tenantId);
      if (!token) {
        return makeResult("gmail_read", "Gmail not available — Google account not connected. Connect via Settings > Integrations.");
      }

      // List recent messages
      const res = await fetch(`${GMAIL_API}/messages?maxResults=10&q=is:inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return makeResult("gmail_read", `Gmail API returned ${res.status}`);

      const json = await res.json() as { messages?: Array<{ id: string; threadId: string }> };
      const messages = json.messages ?? [];
      if (!messages.length) return makeResult("gmail_read", "No recent emails in inbox.");

      // Fetch headers for each message (batched, max 10)
      const details = await Promise.all(
        messages.slice(0, 10).map(async (msg) => {
          const detail = await fetch(`${GMAIL_API}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!detail.ok) return null;
          const d = await detail.json() as { payload?: { headers?: Array<{ name: string; value: string }> }; snippet?: string };
          const headers = d.payload?.headers ?? [];
          const from    = headers.find(h => h.name === "From")?.value ?? "Unknown";
          const subject = headers.find(h => h.name === "Subject")?.value ?? "(no subject)";
          const date    = headers.find(h => h.name === "Date")?.value ?? "";
          return { from, subject, date, snippet: d.snippet ?? "" };
        }),
      );

      const lines = details
        .filter(Boolean)
        .map((d, i) => `${i + 1}. From: ${d!.from}\n   Subject: ${d!.subject}\n   Date: ${d!.date}\n   Preview: ${d!.snippet.slice(0, 100)}`);

      return makeResult("gmail_read", `Recent emails (${lines.length}):\n${lines.join("\n\n")}`);
    } catch (err) {
      return makeError("gmail_read", err);
    }
  },
};
