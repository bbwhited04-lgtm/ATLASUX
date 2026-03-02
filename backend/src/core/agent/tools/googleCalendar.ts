/**
 * Google Calendar — Google Calendar API v3 via OAuth2 token from token_vault.
 * Complements the existing M365 read_calendar tool with Google Calendar support.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const GCAL_API = "https://www.googleapis.com/calendar/v3";

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

export const googleCalendarTool: ToolDefinition = {
  key:  "googleCalendar",
  name: "Google Calendar",
  patterns: [
    /google\s*calendar/i,
    /\bgcal\b/i,
    /schedule\s*meeting/i,
    /my\s*(?:google\s*)?schedule/i,
  ],
  async execute(ctx) {
    try {
      const token = await getGoogleToken(ctx.tenantId);
      if (!token) {
        return makeResult("google_calendar", "Google Calendar not available — Google account not connected. Connect via Settings > Integrations.");
      }

      const now = new Date().toISOString();
      const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(
        `${GCAL_API}/calendars/primary/events?timeMin=${now}&timeMax=${weekOut}&maxResults=10&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return makeResult("google_calendar", `Google Calendar API returned ${res.status}`);

      const json = await res.json() as { items?: Array<{ summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string; attendees?: Array<{ email: string }> }> };
      const events = json.items ?? [];
      if (!events.length) return makeResult("google_calendar", "No upcoming Google Calendar events in the next 7 days.");

      const lines = events.map((e, i) => {
        const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : e.start?.date ?? "TBD";
        const loc = e.location ? ` @ ${e.location}` : "";
        const attendees = e.attendees?.length ? ` (${e.attendees.length} attendees)` : "";
        return `${i + 1}. ${e.summary ?? "(no title)"}${loc} — ${start}${attendees}`;
      });

      return makeResult("google_calendar", `Google Calendar — upcoming events (next 7 days):\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("google_calendar", err);
    }
  },
};
