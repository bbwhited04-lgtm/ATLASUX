/**
 * Mercer Post-Call Processor — log results, update CRM, alert Slack.
 *
 * After every outbound call:
 *   1. Generate call summary
 *   2. Update CRM contact with qualification + notes
 *   3. Log to ContactActivity
 *   4. Audit trail
 *   5. Slack notification
 *   6. SMS follow-up if no answer / voicemail / wrong number
 */

import { prisma } from "../db/prisma.js";
import { getFullTranscriptText, endSession, getSession } from "./contextRing.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";
import { runLLM, type LlmMessage } from "../core/engine/brainllm.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

const SMS_FOLLOWUP_MESSAGE = `Missing calls? We have the solution! Lucy at Atlas UX answers every call, books appointments & never puts anyone on hold. Free trial at https://Atlasux.cloud`;

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

  // 6. SMS follow-up if no answer or wrong number
  const noAnswerQualifications = ["wrong_number", "unknown"];
  const shortCall = duration < 15; // less than 15 seconds = probably didn't connect
  if (noAnswerQualifications.includes(qualification) || shortCall) {
    await queueFollowUpSms(profile.phone ?? "", profile.name);
  }

  endSession(sessionId);
}

/**
 * Queue an SMS follow-up for calls that didn't connect.
 * Called from post-call processor and from Twilio status callback.
 */
export async function queueFollowUpSms(phone: string, contactName?: string | null): Promise<void> {
  if (!phone) return;

  // Normalize phone
  const normalized = phone.replace(/\D/g, "");
  const to = normalized.startsWith("1") ? `+${normalized}` : `+1${normalized}`;

  // Check if we already sent this SMS recently (within 7 days)
  const recentSms = await prisma.auditLog.findFirst({
    where: {
      tenantId: TENANT_ID,
      action: "mercer.sms.followup",
      meta: { path: ["to"], equals: to },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  if (recentSms) return; // Already sent recently

  // Queue SMS job
  try {
    await prisma.job.create({
      data: {
        tenantId: TENANT_ID,
        jobType: "SMS_SEND",
        status: "queued",
        priority: 30,
        input: { to, message: SMS_FOLLOWUP_MESSAGE },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        actorType: "agent",
        actorExternalId: "mercer",
        action: "mercer.sms.followup",
        entityType: "sms",
        message: `SMS follow-up queued for ${contactName ?? to} (no answer)`,
        meta: { to, contactName },
        timestamp: new Date(),
      },
    });

    console.log(`[mercer-postcall] SMS follow-up queued for ${to}`);
  } catch (err: any) {
    console.error("[mercer-postcall] Failed to queue SMS follow-up:", err?.message);
  }
}
