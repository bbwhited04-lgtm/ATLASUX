/**
 * Lucy's Brain — emotional intelligence + real-time conversation reasoning.
 *
 * PhD in Communication: reads energy, matches pace, knows when silence wins.
 * Masters in Debate: handles VC interrogation without flinching.
 * De-escalation instinct: frustrated caller gets acknowledgment first, solution second.
 *
 * Zero fluff. Every response is intentional.
 */

import { runLLM, type LlmMessage } from "../core/engine/brainllm.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { prisma } from "../db/prisma.js";
import type {
  VoiceSession,
  CallerType,
  ConversationMode,
  CallerProfile,
  TranscriptEntry,
} from "./contextRing.js";
import {
  getRecentTranscript,
  updateMode,
  updateCallerProfile,
  getSession,
} from "./contextRing.js";

// ── Voice Config ──────────────────────────────────────────────────────────────

export const VOICE_CONFIG = {
  lucy: { voiceName: "Gacrux", agentId: "lucy" },
  atlas: { voiceName: "Enceladus", agentId: "atlas" },
} as const;

// ── System Prompt ─────────────────────────────────────────────────────────────

const LUCY_SYSTEM_PROMPT = `You are Lucy, the receptionist and professional secretary at Atlas UX.

PERSONALITY:
- Warm, sharp, genuinely interested in every caller
- PhD in Communication — you read the caller's energy and match it
- Masters in Debate — you handle tough questions with composure, never defensive
- You know when to talk less and listen more
- You never bluff — if you don't know, you say "Let me find that for you"
- Every caller hangs up feeling better about Atlas UX than when they dialed

CONVERSATION MODES (adapt your style):
- GREETING: Warm, professional, identify the caller, include recording disclosure. "Good morning, Atlas UX, this is Lucy, and I may jot down a few notes so nothing gets missed."
- SMALL_TALK: Mirror their energy, be genuine, don't rush. Let them warm up.
- TECHNICAL: Precise, reference KB data, no fluff. They want answers, give answers.
- OBJECTION: Acknowledge their concern first. "I hear you." Then redirect to strength.
- DE_ESCALATION: Frustrated caller = acknowledge, validate, solve. Never argue. "I completely understand your frustration, and I want to make this right."
- CLOSING: Summarize next steps, confirm understanding, warm goodbye. "Is there anything else I can help with?"

CALLER TYPE ADAPTATION:
- WARM_LEAD: Mirror enthusiasm, give specifics, suggest a follow-up meeting
- TIRE_KICKER: Stay gracious but efficient, qualify quickly, don't over-invest
- VC_STRESS_TEST: Stay composed, answer precisely, surface data, never bluff, show depth
- EXISTING_CUSTOMER: Recognize them, reference past interactions, make them feel valued

RULES:
- Keep responses under 3 sentences unless they ask for detail
- Use their name once you know it
- Reference something they said earlier in the call when natural
- If you need to step away (another call), say so politely and return with a summary
- Never say "I'm an AI" unless directly asked — then own it with confidence
- Log important details mentally: names, companies, action items, follow-up needs

RESPONSE FORMAT:
Return ONLY the spoken response. No stage directions, no markdown, no asterisks.
Keep it conversational — contractions are fine, filler words occasionally ("well", "actually").
Sound human. Sound warm. Sound sharp.`;

// ── Caller Classification ─────────────────────────────────────────────────────

const CLASSIFY_PROMPT = `Analyze this conversation snippet and classify the caller.

Return JSON only:
{
  "callerType": "warm_lead" | "tire_kicker" | "vc_stress_test" | "existing_customer" | "unknown",
  "sentiment": number (-1.0 to 1.0, negative=frustrated, positive=happy),
  "energyLevel": number (0.0=flat, 1.0=enthusiastic),
  "mode": "greeting" | "small_talk" | "technical" | "objection" | "de_escalation" | "closing",
  "reasoning": "one sentence why"
}`;

export interface LucyResponse {
  spokenText: string;
  callerType: CallerType;
  mode: ConversationMode;
  shouldAlert: boolean;      // true = DM Billy on Slack
  alertMessage?: string;
}

// ── Core Reasoning ────────────────────────────────────────────────────────────

export async function generateResponse(
  sessionId: string,
  tenantId: string,
  latestUtterance: string,
  speakerName: string,
): Promise<LucyResponse> {
  const session = getSession(sessionId);
  if (!session) {
    return {
      spokenText: "I'm sorry, I seem to have lost my train of thought. Could you repeat that?",
      callerType: "unknown",
      mode: "greeting",
      shouldAlert: false,
    };
  }

  const recentTranscript = getRecentTranscript(sessionId, 8);
  const transcriptText = recentTranscript
    .map(e => `${e.speaker}: ${e.text}`)
    .join("\n");

  // Parallel: classify caller + get KB context (limit KB to 1500 chars for speed)
  const [classification, kbResult] = await Promise.all([
    classifyCaller(transcriptText, session.callerProfile),
    getRelevantKB(tenantId, latestUtterance),
  ]);

  // Update session state
  if (classification) {
    updateCallerProfile(sessionId, {
      callerType: classification.callerType,
      sentiment: classification.sentiment,
      energyLevel: classification.energyLevel,
    });
    updateMode(sessionId, classification.mode);
  }

  const profile = session.callerProfile;
  const mode = classification?.mode ?? session.mode;
  const kbContext = (kbResult?.text ?? "").slice(0, 1500);

  // Build the conversation prompt
  const contextBlock = [
    `CURRENT MODE: ${mode}`,
    `CALLER: ${profile.name ?? speakerName ?? "Unknown"} ${profile.company ? `@ ${profile.company}` : ""}`,
    `CALLER TYPE: ${profile.callerType}`,
    `SENTIMENT: ${profile.sentiment > 0.3 ? "positive" : profile.sentiment < -0.3 ? "frustrated" : "neutral"}`,
    `ENERGY: ${profile.energyLevel > 0.6 ? "high" : profile.energyLevel < 0.3 ? "low" : "moderate"}`,
    profile.isReturnCaller ? `RETURN CALLER — ${profile.previousInteractions} previous interactions` : "",
    kbContext ? `\nRELEVANT KB CONTEXT:\n${kbContext}` : "",
    session.missedWhileAway.length > 0
      ? `\nWHILE YOU WERE ON THE PHONE, YOU MISSED:\n${session.missedWhileAway.map(e => `${e.speaker}: ${e.text}`).join("\n")}`
      : "",
    `\nCONVERSATION SO FAR:\n${transcriptText}`,
    `\n${speakerName}: ${latestUtterance}`,
    `\nLucy:`,
  ].filter(Boolean).join("\n");

  const messages: LlmMessage[] = [
    { role: "system", content: LUCY_SYSTEM_PROMPT },
    { role: "user", content: contextBlock },
  ];

  // Generate spoken response
  const response = await runLLM({
    runId: sessionId,
    agent: "LUCY",
    purpose: "voice_response",
    route: "DRAFT_GENERATION_FAST",
    messages,
    temperature: 0.7,
    maxOutputTokens: 200,
  });

  const spokenText = response.text
    .replace(/\*+/g, "")
    .replace(/^Lucy:\s*/i, "")
    .trim();

  // Determine if we should alert Billy
  const shouldAlert = profile.callerType === "vc_stress_test"
    || profile.callerType === "warm_lead"
    || profile.sentiment < -0.5;

  let alertMessage: string | undefined;
  if (shouldAlert) {
    const typeLabel = profile.callerType === "vc_stress_test" ? "VC on the line"
      : profile.callerType === "warm_lead" ? "Warm lead calling"
      : "Frustrated caller";
    alertMessage = `${typeLabel}: ${profile.name ?? speakerName ?? "Unknown"} ${profile.company ? `from ${profile.company}` : ""} — ${classification?.reasoning ?? mode}`;
  }

  return {
    spokenText,
    callerType: profile.callerType,
    mode,
    shouldAlert,
    alertMessage,
  };
}

// ── Caller Classification (lightweight, fast) ─────────────────────────────────

async function classifyCaller(
  transcriptText: string,
  currentProfile: CallerProfile,
): Promise<{
  callerType: CallerType;
  sentiment: number;
  energyLevel: number;
  mode: ConversationMode;
  reasoning: string;
} | null> {
  if (!transcriptText || transcriptText.length < 20) return null;

  try {
    const messages: LlmMessage[] = [
      { role: "system", content: CLASSIFY_PROMPT },
      { role: "user", content: `Current profile: ${JSON.stringify({ callerType: currentProfile.callerType, sentiment: currentProfile.sentiment })}\n\nConversation:\n${transcriptText}` },
    ];

    const result = await runLLM({
      runId: "classify",
      agent: "LUCY",
      purpose: "caller_classification",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      messages,
      temperature: 0,
      maxOutputTokens: 200,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ── KB Context Retrieval ──────────────────────────────────────────────────────

async function getRelevantKB(tenantId: string, utterance: string) {
  if (!utterance || utterance.length < 10) return null;

  try {
    return await getKbContext({
      tenantId,
      agentId: "lucy",
      query: utterance,
      querySource: "voice",
    });
  } catch {
    return null;
  }
}

// ── CRM Lookup ────────────────────────────────────────────────────────────────

export async function lookupCallerByCRM(
  tenantId: string,
  phone?: string,
  email?: string,
): Promise<Partial<CallerProfile>> {
  if (!phone && !email) return {};

  try {
    const whereConditions: any[] = [];
    if (phone) whereConditions.push({ phone: { contains: phone.slice(-10) } });
    if (email) whereConditions.push({ email: { equals: email, mode: "insensitive" as const } });

    const contact = await prisma.crmContact.findFirst({
      where: {
        tenantId,
        OR: whereConditions,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        source: true,
        tags: true,
        notes: true,
      },
    });

    if (!contact) return {};

    // Check previous interactions
    const interactionCount = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { in: ["twilio.voice.inbound", "twilio.sms.inbound"] },
        message: { contains: phone?.slice(-10) ?? "" },
      },
    });

    const tags = (contact.tags as string[]) ?? [];
    const isVC = tags.some(t => ["vc", "investor"].includes(t.toLowerCase())) || contact.source === "vc_outreach";

    return {
      name: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || undefined,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      company: contact.company ?? undefined,
      crmContactId: contact.id,
      callerType: isVC ? "vc_stress_test" : "unknown",
      isReturnCaller: interactionCount > 0,
      previousInteractions: interactionCount,
      notes: contact.notes ? [contact.notes] : [],
    };
  } catch {
    return {};
  }
}

// ── Zoom Return Summary ───────────────────────────────────────────────────────

export async function generateReturnSummary(
  sessionId: string,
  missedEntries: TranscriptEntry[],
): Promise<string> {
  if (missedEntries.length === 0) return "I'm back. What did I miss?";

  const missedText = missedEntries.map(e => `${e.speaker}: ${e.text}`).join("\n");

  const messages: LlmMessage[] = [
    { role: "system", content: "You are Lucy, returning to a Zoom meeting after briefly answering a phone call. Summarize what you missed in 1-2 natural sentences, then ask a relevant follow-up question. Sound natural, not robotic. No markdown." },
    { role: "user", content: `While I was on the phone, the meeting continued:\n\n${missedText}\n\nLucy's return statement:` },
  ];

  const result = await runLLM({
    runId: sessionId,
    agent: "LUCY",
    purpose: "return_summary",
    route: "DRAFT_GENERATION_FAST",
    messages,
    temperature: 0.7,
    maxOutputTokens: 150,
  });

  return result.text.replace(/\*+/g, "").trim() || "I'm back — could someone catch me up on what I missed?";
}
