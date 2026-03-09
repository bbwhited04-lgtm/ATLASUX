/**
 * Mercer Post-Call Processor — log results, update CRM, alert Slack.
 *
 * After every outbound call:
 *   1. Generate call summary
 *   2. Update CRM contact with qualification + notes
 *   3. Log to ContactActivity
 *   4. Audit trail
 *   5. Slack notification
 */

import { prisma } from "../db/prisma.js";
import { getFullTranscriptText, endSession, getSession } from "./contextRing.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";
import { runLLM, type LlmMessage } from "../core/engine/brainllm.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

export async function processEndedOutboundCall(sessionId: string): Promise<void> {
  const session = getSession(sessionId);
  if (!session) return;

  const transcript = getFullTranscriptText(sessionId);
  const profile = session.callerProfile;
  const duration = Math.round((Date.now() - session.startedAt) / 1000);

  // 1. Generate summary + qualification
  let summary = "";
  let qualification = "unknown";
  let actionItems: string[] = [];
  let painPoints: string[] = [];

  try {
    const messages: LlmMessage[] = [
      {
        role: "system",
        content: `Summarize this outbound sales call in 2-3 sentences. Extract the lead qualification and any action items.
Return format:
SUMMARY: <text>
QUALIFICATION: hot_lead | warm_lead | not_interested | callback_later | wrong_number
PAIN_POINTS: ["point1", "point2"]
ACTIONS: ["item1", "item2"]`,
      },
      { role: "user", content: transcript.slice(-3000) },
    ];

    const result = await runLLM({
      runId: sessionId,
      agent: "MERCER",
      purpose: "outbound_call_summary",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      messages,
      temperature: 0,
      maxOutputTokens: 400,
    });

    const summaryMatch = result.text.match(/SUMMARY:\s*(.*?)(?:\nQUALIFICATION:|$)/s);
    const qualMatch = result.text.match(/QUALIFICATION:\s*(\S+)/);
    const painMatch = result.text.match(/PAIN_POINTS:\s*(\[.*?\])/s);
    const actionsMatch = result.text.match(/ACTIONS:\s*(\[.*?\])/s);

    summary = summaryMatch?.[1]?.trim() ?? result.text.slice(0, 500);
    qualification = qualMatch?.[1]?.trim() ?? "unknown";
    if (painMatch) try { painPoints = JSON.parse(painMatch[1]); } catch { /* ignore */ }
    if (actionsMatch) try { actionItems = JSON.parse(actionsMatch[1]); } catch { /* ignore */ }
  } catch { /* summary is best-effort */ }

  // 2. Update CRM contact tags with qualification
  if (profile.crmContactId) {
    try {
      const contact = await prisma.crmContact.findUnique({
        where: { id: profile.crmContactId },
        select: { tags: true, notes: true },
      });

      const existingTags = (contact?.tags as string[]) ?? [];
      const qualTag = `mercer:${qualification}`;
      const updatedTags = [...new Set([...existingTags.filter(t => !t.startsWith("mercer:")), qualTag])];

      const noteAddition = `\n[Mercer ${new Date().toISOString().split("T")[0]}] ${summary}`;

      await prisma.crmContact.update({
        where: { id: profile.crmContactId },
        data: {
          tags: updatedTags,
          notes: (contact?.notes ?? "") + noteAddition,
        },
      });
    } catch (err: any) {
      console.error("[mercer-postcall] CRM update failed:", err?.message);
    }
  }

  // 3. Contact activity
  if (profile.crmContactId) {
    try {
      await prisma.contactActivity.create({
        data: {
          tenantId: TENANT_ID,
          contactId: profile.crmContactId,
          type: "call",
          subject: `Outbound call by Mercer`,
          body: summary.slice(0, 500),
          meta: {
            direction: "outbound",
            agent: "mercer",
            qualification,
            sentiment: profile.sentiment,
            duration,
            painPoints,
            actionItems,
          },
        },
      });
    } catch (err: any) {
      console.error("[mercer-postcall] ContactActivity save failed:", err?.message);
    }
  }

  // 4. Audit log
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        actorType: "agent",
        actorExternalId: "mercer",
        level: "info",
        action: "mercer.voice.outbound_completed",
        entityType: "crm_contact",
        message: `Mercer outbound call: ${profile.name ?? "Unknown"} (${qualification}) -- ${Math.ceil(duration / 60)}min`,
        meta: {
          sessionId,
          qualification,
          sentiment: profile.sentiment,
          duration,
          painPoints,
          hasActionItems: actionItems.length > 0,
          summary: summary.slice(0, 200),
        },
        timestamp: new Date(),
      },
    });
  } catch { /* audit is best-effort */ }

  // 5. Slack summary
  try {
    const channel = await getChannelByName("phone-calls", true);
    if (channel) {
      const qualLabel = qualification === "hot_lead" ? "HOT LEAD"
        : qualification === "warm_lead" ? "Warm Lead"
        : qualification === "not_interested" ? "Not Interested"
        : qualification === "callback_later" ? "Callback Later"
        : qualification === "wrong_number" ? "Wrong Number"
        : "Unknown";

      const msg = [
        `*Mercer Outbound Call Complete*`,
        `Lead: *${profile.name ?? "Unknown"}* ${profile.company ? `@ ${profile.company}` : ""}`,
        `Qualification: *${qualLabel}*`,
        `Duration: ${Math.ceil(duration / 60)}min`,
        summary ? `Summary: ${summary}` : "",
        painPoints.length ? `Pain Points: ${painPoints.join(", ")}` : "",
        actionItems.length ? `Action Items: ${actionItems.join(", ")}` : "",
      ].filter(Boolean).join("\n");

      await postAsAgent(channel.id, "mercer", msg);
    }
  } catch { /* best-effort */ }

  endSession(sessionId);
}
