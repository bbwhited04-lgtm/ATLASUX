/**
 * Real-time Slack alerts for Lucy's phone/meeting activity.
 *
 * When Lucy detects:
 *   - VC on the line -> instant DM
 *   - Warm lead calling -> instant DM
 *   - Frustrated caller -> instant DM
 *   - Call ended -> summary with classification + action items
 */

import { postAsAgent, getChannelByName } from "../services/slack.js";
import type { CallerType } from "./contextRing.js";
import { getSession } from "./contextRing.js";

const ALERT_CHANNEL = "phone-calls";

export async function sendCallerAlert(
  callerType: CallerType,
  callerName: string,
  company: string,
  context: string,
): Promise<void> {
  const typeLabel = callerType === "vc_stress_test" ? "VC Call"
    : callerType === "warm_lead" ? "Warm Lead"
    : "Frustrated Caller";

  const message = `*${typeLabel}*: ${callerName}${company ? ` from ${company}` : ""}\n${context}`;

  try {
    const channel = await getChannelByName(ALERT_CHANNEL, true);
    if (channel) {
      await postAsAgent(channel.id, "lucy", message);
    }
  } catch { /* best-effort */ }
}

export async function sendCallSummary(sessionId: string): Promise<void> {
  const session = getSession(sessionId);
  if (!session) return;

  const profile = session.callerProfile;
  const duration = Math.round((Date.now() - session.startedAt) / 1000);
  const durationStr = duration > 60 ? `${Math.round(duration / 60)}m ${duration % 60}s` : `${duration}s`;

  const sentimentLabel = profile.sentiment > 0.3 ? "positive"
    : profile.sentiment < -0.3 ? "frustrated"
    : "neutral";

  const lines = [
    `*Call Ended* — ${durationStr}`,
    `*Caller:* ${profile.name ?? "Unknown"} ${profile.company ? `@ ${profile.company}` : ""}`,
    `*Type:* ${profile.callerType.replace(/_/g, " ")} | *Sentiment:* ${sentimentLabel} (${profile.sentiment.toFixed(1)})`,
    `*Source:* ${session.source} | *Return caller:* ${profile.isReturnCaller ? "Yes" : "No"}`,
  ];

  if (profile.notes.length > 0) {
    lines.push(`*Notes:* ${profile.notes.slice(-3).join("; ")}`);
  }

  try {
    const channel = await getChannelByName(ALERT_CHANNEL, true);
    if (channel) {
      await postAsAgent(channel.id, "lucy", lines.join("\n"));
    }
  } catch { /* best-effort */ }
}
