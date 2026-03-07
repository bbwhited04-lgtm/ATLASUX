/**
 * Post-Call Processor — audit, CRM, and KB ingestion after every call/meeting.
 *
 * When a session ends:
 *   1. Save transcript to MeetingNote
 *   2. Create/update CRM contact activity
 *   3. Write audit log
 *   4. If new lead -> create CRM contact
 *   5. Send call summary to Slack
 */

import { prisma } from "../db/prisma.js";
import { getFullTranscriptText, endSession, getSession } from "./contextRing.js";
import { sendCallSummary } from "./slackAlerts.js";
import { runLLM, type LlmMessage } from "../core/engine/brainllm.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

export async function processEndedSession(sessionId: string): Promise<void> {
  const session = getSession(sessionId);
  if (!session) return;

  const transcript = getFullTranscriptText(sessionId);
  const profile = session.callerProfile;
  const duration = Math.round((Date.now() - session.startedAt) / 1000);

  // 1. Generate summary (lightweight LLM call)
  let summary = "";
  let actionItems: string[] = [];
  try {
    const messages: LlmMessage[] = [
      { role: "system", content: "Summarize this phone call in 2-3 sentences. List any action items as a JSON array of strings. Return format:\nSUMMARY: <text>\nACTIONS: [\"item1\", \"item2\"]" },
      { role: "user", content: transcript.slice(-3000) },
    ];

    const result = await runLLM({
      runId: sessionId,
      agent: "LUCY",
      purpose: "call_summary",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      messages,
      temperature: 0,
      maxOutputTokens: 300,
    });

    const summaryMatch = result.text.match(/SUMMARY:\s*(.*?)(?:\nACTIONS:|$)/s);
    const actionsMatch = result.text.match(/ACTIONS:\s*(\[.*?\])/s);
    summary = summaryMatch?.[1]?.trim() ?? result.text.slice(0, 500);
    if (actionsMatch) {
      try { actionItems = JSON.parse(actionsMatch[1]); } catch { /* ignore */ }
    }
  } catch { /* summary is best-effort */ }

  // 2. Save to MeetingNote
  try {
    await prisma.meetingNote.create({
      data: {
        tenantId: TENANT_ID,
        platform: session.source === "phone" ? "twilio-voice" : "zoom",
        title: `${session.source === "phone" ? "Phone Call" : "Zoom Meeting"}: ${profile.name ?? "Unknown"} ${profile.company ? `@ ${profile.company}` : ""}`,
        externalMeetingId: session.callSid ?? session.meetingId ?? null,
        scheduledAt: new Date(session.startedAt),
        durationMinutes: Math.ceil(duration / 60),
        attendees: [
          { name: profile.name ?? "Unknown", role: profile.callerType },
          { name: "Lucy", role: "secretary" },
        ],
        transcript,
        summary,
        actionItems: actionItems.map(text => ({ text, done: false })),
        keyPoints: [],
        status: "processed",
        processedAt: new Date(),
      },
    });
  } catch (err: any) {
    console.error("[lucy-postcall] MeetingNote save failed:", err?.message);
  }

  // 3. Contact activity
  if (profile.crmContactId) {
    try {
      await prisma.contactActivity.create({
        data: {
          tenantId: TENANT_ID,
          contactId: profile.crmContactId,
          type: session.source === "phone" ? "call" : "meeting",
          subject: `${session.source === "phone" ? "Phone call" : "Meeting"} with Lucy`,
          body: summary.slice(0, 500),
          meta: {
            direction: "inbound",
            callerType: profile.callerType,
            sentiment: profile.sentiment,
            duration,
            actionItems,
          },
        },
      });
    } catch (err: any) {
      console.error("[lucy-postcall] ContactActivity save failed:", err?.message);
    }
  }

  // 4. Audit log
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        actorType: "agent",
        actorExternalId: "lucy",
        level: "info",
        action: session.source === "phone" ? "lucy.voice.call_completed" : "lucy.voice.meeting_completed",
        entityType: "meeting_note",
        message: `Lucy ${session.source} session: ${profile.name ?? "Unknown"} (${profile.callerType}) — ${Math.ceil(duration / 60)}min`,
        meta: {
          sessionId,
          callerType: profile.callerType,
          sentiment: profile.sentiment,
          duration,
          hasActionItems: actionItems.length > 0,
          summary: summary.slice(0, 200),
        },
        timestamp: new Date(),
      },
    });
  } catch { /* audit is best-effort */ }

  // 5. New lead capture
  if (!profile.crmContactId && profile.name && (profile.phone || profile.email)) {
    try {
      await prisma.crmContact.create({
        data: {
          tenantId: TENANT_ID,
          firstName: profile.name.split(" ")[0] ?? null,
          lastName: profile.name.split(" ").slice(1).join(" ") || null,
          email: profile.email ?? null,
          phone: profile.phone ?? null,
          company: profile.company ?? null,
          source: "lucy_voice",
          tags: [profile.callerType],
          notes: summary.slice(0, 500),
        },
      });
      console.log(`[lucy-postcall] New lead captured: ${profile.name}`);
    } catch { /* duplicate or constraint — fine */ }
  }

  // 6. Slack summary
  await sendCallSummary(sessionId);

  // End the session (starts 10-min cleanup timer)
  endSession(sessionId);
}
