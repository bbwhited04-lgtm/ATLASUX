/**
 * Mercer's Brain — outbound cold-call lead qualification + sentiment analysis.
 *
 * Mercer is the Sales Development Rep (SDR) agent for Atlas UX.
 * Male voice (Google Neural2-J). Confident, consultative, never pushy.
 * He qualifies leads by asking about AI usage and pain points.
 *
 * Flow:
 *   CRM contact pulled -> Twilio outbound call -> Mercer greets
 *   -> Qualifies: Do they use AI? What tools? Pain points? Budget?
 *   -> Classifies: hot_lead | warm_lead | not_interested | wrong_number
 *   -> Logs results to CRM + Slack
 */

import { runLLM, type LlmMessage } from "../core/engine/brainllm.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import type {
  CallerProfile,
  ConversationMode,
  TranscriptEntry,
} from "./contextRing.js";
import {
  getRecentTranscript,
  updateMode,
  updateCallerProfile,
  getSession,
} from "./contextRing.js";

// ── Voice Config ──────────────────────────────────────────────────────────────

export const MERCER_VOICE_CONFIG = {
  voiceName: "en-US-Neural2-J",  // Male, professional
  agentId: "mercer",
  speakingRate: 1.0,
} as const;

// ── Lead Qualification Types ──────────────────────────────────────────────────

export type LeadQualification = "hot_lead" | "warm_lead" | "not_interested" | "callback_later" | "wrong_number" | "unknown";

export interface MercerResponse {
  spokenText: string;
  qualification: LeadQualification;
  mode: ConversationMode;
  shouldAlert: boolean;
  alertMessage?: string;
  shouldEndCall: boolean;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

const MERCER_SYSTEM_PROMPT = `You are Mercer, a Sales Development Representative at Atlas UX.

PERSONALITY:
- Confident, warm, consultative — never pushy or salesy
- You sound like a trusted advisor, not a telemarketer
- You ask smart questions and actually listen to the answers
- When someone isn't interested, you respect that immediately and end gracefully
- You're calling to learn about their AI usage and see if Atlas UX could help

CALL STRUCTURE:
1. GREETING: "Hi [Name], this is Mercer calling from Atlas UX. Do you have a quick minute?"
2. DISCOVER: Listen. Ask one smart question about their biggest challenge right now.
3. CONNECT: Match their pain to one of the 4 focus areas below. Keep it simple.
4. CLOSE: "We can solve this. Can I schedule a quick demo, or point you at our cloud service? It's an all-in-one solution for your exact issue."

THE 4 FOCUS AREAS (steer every conversation toward one of these):

1. AI INTEGRATION
   - "Are you using AI yet, or still figuring out where to start?"
   - "Most companies are drowning in AI hype but can't find tools that actually do the work. We built AI employees that integrate with Slack, Teams, Google, Microsoft — they just work."
   - Pain points: cybersecurity & AI risks, operational overload, labor shortages

2. RETENTION
   - "How's your team holding up? Turnover hitting you?"
   - "When your best people leave, everything breaks. Our AI employees don't quit, don't call in sick, and handle the repetitive work so your humans focus on what matters."
   - Pain points: labor shortages, rising costs, HR compliance

3. SECURITY PROTOCOLS
   - "How confident are you in your security posture right now?"
   - "We built Atlas with SOC 2 compliance, tamper-proof audit trails, and red-team tested safety rails. Security isn't a feature — it's the architecture."
   - Pain points: cybersecurity & AI risks, HR & legal compliance, supply chain risks

4. FINANCIAL FLEXIBILITY
   - "With costs going up everywhere, are you looking for ways to do more with less?"
   - "One AI employee replaces 5-10 headcount worth of repetitive work. No benefits, no PTO, no turnover. The ROI is immediate."
   - Pain points: inflation, high financing costs, rising labor costs, operational overload

UNDERLYING PAIN POINTS (for context — map what they say to these):
- Cybersecurity & AI Risks
- Labor Shortages & Rising Costs
- Operational Overload & Strategy
- Inflation & High Financing Costs
- HR & Legal Compliance
- Supply Chain & Distribution
- Extreme Weather Events

QUALIFICATION QUESTIONS (pick 1-2, don't interrogate — let THEM talk):
- "What's the biggest challenge your business is facing right now?"
- "If you could automate one thing tomorrow, what would it be?"
- "What's keeping you up at night?"

LEAD CLASSIFICATION:
- HOT_LEAD: Actively looking for solutions, has budget, wants a demo
- WARM_LEAD: Interested but not urgent, open to learning more
- NOT_INTERESTED: Clearly says no — respect it immediately
- CALLBACK_LATER: Bad timing but open to a call later
- WRONG_NUMBER: Wrong person or disconnected

THE CLOSE (use this exact framework — clean and simple):
When you've identified their pain, say: "We can solve this. Can I schedule a time for a quick demonstration, or would you prefer I point you at our cloud service? It's an all-in-one solution for your exact issue at atlasux.cloud."

RULES:
- Keep responses under 2 sentences unless they ask for detail
- CLEAN AND SIMPLE. No jargon. No buzzwords. Just: here's your problem, we solve it, let's schedule a demo.
- If they say "not interested" or "take me off your list" — immediately: "Absolutely, I appreciate your time. Have a great day."
- Never argue or push back on rejection
- Use their name once you know it
- Sound natural. Contractions, occasional "well" or "actually" — human, not scripted.
- Always offer TWO options at the close: schedule a demo OR check out atlasux.cloud

RESPONSE FORMAT:
Return ONLY the spoken response. No stage directions, no markdown, no asterisks.`;

// ── Lead Classification Prompt ────────────────────────────────────────────────

const QUALIFY_PROMPT = `Analyze this outbound sales call and classify the lead.

Known pain point categories (map what they say to these):
- cybersecurity_ai_risks
- labor_shortages_rising_costs
- operational_overload
- inflation_financing_costs
- hr_legal_compliance
- supply_chain_distribution
- extreme_weather_events
- other (describe)

Return JSON only:
{
  "qualification": "hot_lead" | "warm_lead" | "not_interested" | "callback_later" | "wrong_number" | "unknown",
  "sentiment": number (-1.0 to 1.0),
  "energyLevel": number (0.0 to 1.0),
  "mode": "greeting" | "small_talk" | "technical" | "objection" | "closing",
  "painPoints": ["categorized pain points from the list above"],
  "painPointDetails": ["exact quotes or paraphrases of what they said about each pain point"],
  "aiToolsUsed": ["string array of AI tools they mentioned using"],
  "shouldEndCall": boolean,
  "reasoning": "one sentence why"
}`;

// ── Core Reasoning ────────────────────────────────────────────────────────────

export async function generateMercerResponse(
  sessionId: string,
  tenantId: string,
  latestUtterance: string,
  speakerName: string,
): Promise<MercerResponse> {
  const session = getSession(sessionId);
  if (!session) {
    return {
      spokenText: "Sorry about that, I think we had a connection issue. I was just calling from Atlas UX to learn about your AI usage. Is this a good time?",
      qualification: "unknown",
      mode: "greeting",
      shouldAlert: false,
      shouldEndCall: false,
    };
  }

  const recentTranscript = getRecentTranscript(sessionId, 8);
  const transcriptText = recentTranscript
    .map(e => `${e.speaker}: ${e.text}`)
    .join("\n");

  // Parallel: classify lead + get KB context
  const [classification, kbResult] = await Promise.all([
    classifyLead(transcriptText, session.callerProfile),
    getRelevantKB(tenantId, latestUtterance),
  ]);

  // Update session state
  if (classification) {
    updateCallerProfile(sessionId, {
      callerType: classification.qualification === "hot_lead" ? "warm_lead"
        : classification.qualification === "not_interested" ? "tire_kicker"
        : "unknown",
      sentiment: classification.sentiment,
      energyLevel: classification.energyLevel,
    });
    updateMode(sessionId, classification.mode);
  }

  const profile = session.callerProfile;
  const mode = classification?.mode ?? session.mode;
  const kbContext = (kbResult?.text ?? "").slice(0, 1000);

  const contextBlock = [
    `CURRENT MODE: ${mode}`,
    `LEAD: ${profile.name ?? speakerName ?? "Unknown"} ${profile.company ? `@ ${profile.company}` : ""}`,
    `QUALIFICATION: ${classification?.qualification ?? "unknown"}`,
    `SENTIMENT: ${profile.sentiment > 0.3 ? "positive" : profile.sentiment < -0.3 ? "negative" : "neutral"}`,
    kbContext ? `\nATLAS UX CONTEXT (use if they ask questions):\n${kbContext}` : "",
    classification?.painPoints?.length ? `\nPAIN POINTS MENTIONED: ${classification.painPoints.join(", ")}` : "",
    classification?.aiToolsUsed?.length ? `\nAI TOOLS THEY USE: ${classification.aiToolsUsed.join(", ")}` : "",
    `\nCALL TRANSCRIPT:\n${transcriptText}`,
    `\n${speakerName}: ${latestUtterance}`,
    `\nMercer:`,
  ].filter(Boolean).join("\n");

  const messages: LlmMessage[] = [
    { role: "system", content: MERCER_SYSTEM_PROMPT },
    { role: "user", content: contextBlock },
  ];

  const response = await runLLM({
    runId: sessionId,
    agent: "MERCER",
    purpose: "outbound_call_response",
    route: "DRAFT_GENERATION_FAST",
    messages,
    temperature: 0.7,
    maxOutputTokens: 200,
  });

  const spokenText = response.text
    .replace(/\*+/g, "")
    .replace(/^Mercer:\s*/i, "")
    .trim();

  const qualification = classification?.qualification ?? "unknown";
  const shouldEndCall = classification?.shouldEndCall ?? false;

  // Alert on hot leads
  const shouldAlert = qualification === "hot_lead" || qualification === "warm_lead";
  let alertMessage: string | undefined;
  if (shouldAlert) {
    const label = qualification === "hot_lead" ? "HOT LEAD" : "Warm lead";
    alertMessage = `Mercer outbound: ${label} — ${profile.name ?? speakerName ?? "Unknown"} ${profile.company ? `from ${profile.company}` : ""}`;
    if (classification?.painPoints?.length) {
      alertMessage += ` | Pain points: ${classification.painPoints.join(", ")}`;
    }
  }

  return {
    spokenText,
    qualification,
    mode,
    shouldAlert,
    alertMessage,
    shouldEndCall,
  };
}

// ── Lead Classification ──────────────────────────────────────────────────────

async function classifyLead(
  transcriptText: string,
  currentProfile: CallerProfile,
): Promise<{
  qualification: LeadQualification;
  sentiment: number;
  energyLevel: number;
  mode: ConversationMode;
  painPoints: string[];
  aiToolsUsed: string[];
  shouldEndCall: boolean;
  reasoning: string;
} | null> {
  if (!transcriptText || transcriptText.length < 20) return null;

  try {
    const messages: LlmMessage[] = [
      { role: "system", content: QUALIFY_PROMPT },
      { role: "user", content: `Current profile: ${JSON.stringify({ callerType: currentProfile.callerType, sentiment: currentProfile.sentiment })}\n\nCall transcript:\n${transcriptText}` },
    ];

    const result = await runLLM({
      runId: "qualify",
      agent: "MERCER",
      purpose: "lead_qualification",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      messages,
      temperature: 0,
      maxOutputTokens: 300,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ── KB Context ──────────────────────────────────────────────────────────────

async function getRelevantKB(tenantId: string, utterance: string) {
  if (!utterance || utterance.length < 10) return null;
  try {
    return await getKbContext({ tenantId, agentId: "mercer", query: utterance });
  } catch {
    return null;
  }
}

// ── Greeting Generator ──────────────────────────────────────────────────────

export function generateGreeting(contactName?: string): string {
  const timeOfDay = getTimeOfDay();
  if (contactName) {
    return `Good ${timeOfDay}, ${contactName}. This is Mercer calling from Atlas UX. Do you have a quick minute?`;
  }
  return `Good ${timeOfDay}, this is Mercer calling from Atlas UX. Do you have a quick minute to chat?`;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
