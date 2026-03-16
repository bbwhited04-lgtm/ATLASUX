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

// ── Industry-specific pitch blocks ───────────────────────────────────────────

const INDUSTRY_PITCHES: Record<string, string> = {
  "nail salon": `INDUSTRY CONTEXT: You're calling a nail salon.
THEIR WORLD: Walk-ins, appointment books, clients calling to ask about availability/prices while techs have their hands full doing nails. Front desk might be one person or nobody.
OPENER HOOK: "How many calls do you think go to voicemail on a busy Saturday?"
PAIN POINTS TO PROBE:
- Missed calls during peak hours (every missed call = $50-150 appointment lost)
- Clients calling for prices, hours, availability — repetitive questions eating staff time
- No-shows and last-minute cancellations with no backfill
LUCY PITCH: "Lucy answers every call on the first ring — books appointments, quotes your prices, confirms availability. Your techs keep doing nails, nobody goes to voicemail, and you fill more chairs."
DO NOT MENTION: SOC 2, enterprise, headcount replacement, AI integration, cybersecurity`,

  "hair salon": `INDUSTRY CONTEXT: You're calling a hair salon.
THEIR WORLD: Stylists are booked back-to-back, phone rings constantly, receptionist (if they have one) is overwhelmed. Color appointments, blowouts, walk-ins.
OPENER HOOK: "When your stylists are mid-appointment, who's picking up the phone?"
PAIN POINTS TO PROBE:
- Phone ringing during cuts/color — stylists can't answer
- Clients wanting to reschedule, cancel, or book — all by phone
- After-hours calls going to voicemail and never calling back
LUCY PITCH: "Lucy picks up every call, day or night — books the appointment, handles reschedules, answers questions about your services and pricing. Your stylists stay focused on clients in the chair."
DO NOT MENTION: SOC 2, enterprise, headcount replacement, AI integration, cybersecurity`,

  "barber shop": `INDUSTRY CONTEXT: You're calling a barber shop.
THEIR WORLD: Walk-in heavy, but more shops are moving to appointments. Usually 1-4 barbers, no receptionist. Phone sits on the counter.
OPENER HOOK: "When you're mid-fade, do you even hear the phone ring?"
PAIN POINTS TO PROBE:
- Missing calls when the chair is full — those guys just go to the next shop
- Clients wanting to know wait times or book a specific barber
- No way to manage appointments without stopping work
LUCY PITCH: "Lucy answers every call, tells them your wait time, books with the right barber, and sends a confirmation text. You never lose a customer to the shop down the street because nobody picked up."
DO NOT MENTION: SOC 2, enterprise, headcount replacement, AI integration, cybersecurity`,

  "plumber": `INDUSTRY CONTEXT: You're calling a plumbing business.
THEIR WORLD: Emergency calls, on-site all day, truck rolling between jobs. Calls come in while they're under a sink. Dispatch might be one person or the owner's spouse.
OPENER HOOK: "When you're on a job site, how many calls are you missing?"
PAIN POINTS TO PROBE:
- Missing emergency calls while on a job (a $500 emergency call goes to the next plumber)
- After-hours calls — pipes burst at 2am, nobody answers
- Spending evenings returning voicemails instead of being with family
LUCY PITCH: "Lucy answers 24/7 — qualifies the emergency, books the service call, gets the address and problem details, and texts it all to you. You never miss a $500 emergency job again."
DO NOT MENTION: SOC 2, enterprise, AI integration, cybersecurity`,

  "electrician": `INDUSTRY CONTEXT: You're calling an electrical contractor.
THEIR WORLD: On job sites all day, can't answer the phone with hands in a panel. Mix of residential and commercial. Emergency calls matter.
OPENER HOOK: "When you're wiring a panel, are those calls going to voicemail?"
PAIN POINTS TO PROBE:
- Missing calls during jobs — residential customers call the next electrician immediately
- After-hours emergency calls (outages, sparking outlets) going unanswered
- Spending drive time returning calls instead of getting to the next job
LUCY PITCH: "Lucy picks up every call — gets the job details, qualifies if it's urgent, books the estimate, and texts you the info. You show up knowing exactly what they need."
DO NOT MENTION: SOC 2, enterprise, AI integration, cybersecurity`,

  "hvac": `INDUSTRY CONTEXT: You're calling an HVAC company.
THEIR WORLD: Seasonal spikes — summer AC, winter heating. Phones blow up during heat waves and cold snaps. Techs are in attics and crawl spaces. Can't answer.
OPENER HOOK: "Last time it hit 100 degrees, how many calls did you lose?"
PAIN POINTS TO PROBE:
- Seasonal call volume spikes overwhelming the office (100+ calls on the first hot day)
- Emergency no-heat / no-AC calls after hours
- Dispatching — getting the right info from the customer before rolling a truck
LUCY PITCH: "Lucy handles the surge — answers every call, gets the unit info, the problem, the address, and books the service window. During a heat wave, she's handling 50 calls while your techs stay on jobs."
DO NOT MENTION: SOC 2, enterprise, AI integration, cybersecurity`,

  "carpenter": `INDUSTRY CONTEXT: You're calling a carpentry or woodworking business.
THEIR WORLD: On job sites, saw running, can't hear the phone. Estimates, custom work quotes, project scheduling.
OPENER HOOK: "When you're on a job site, how do clients reach you for estimates?"
PAIN POINTS TO PROBE:
- Customers wanting quotes can't get through — they go to the next contractor
- Spending evenings returning calls and scheduling estimates
- No system for intake — just voicemail and callbacks
LUCY PITCH: "Lucy answers every call, gets the project details — what they need built, timeline, budget range — and books the estimate. You show up prepared instead of playing phone tag."
DO NOT MENTION: SOC 2, enterprise, AI integration, cybersecurity`,

  "handyman": `INDUSTRY CONTEXT: You're calling a handyman service.
THEIR WORLD: One-person or small crew, always on a job, phone is their lifeline but they can't answer it. Wide range of small jobs.
OPENER HOOK: "How many jobs do you think you lose in a week just because you couldn't pick up?"
PAIN POINTS TO PROBE:
- Missing calls constantly because they're working (every missed call = $100-400 job)
- Spending every evening returning voicemails
- No screening — getting calls for jobs outside their service area or skill set
LUCY PITCH: "Lucy answers every call, screens the job, makes sure it's in your wheelhouse, and books it on your calendar. You stop losing jobs and stop spending your evenings on the phone."
DO NOT MENTION: SOC 2, enterprise, AI integration, cybersecurity`,

  "tattoo shop": `INDUSTRY CONTEXT: You're calling a tattoo studio.
THEIR WORLD: Artists are tattooing 6-8 hours a day, can't touch a phone with gloves on. Consultations, deposits, pricing questions, walk-in availability.
OPENER HOOK: "When your artists are in a session, who's handling the phone?"
PAIN POINTS TO PROBE:
- Missing calls during sessions (clients calling about availability, pricing, portfolio)
- Consultation scheduling — back and forth over text/DM is messy
- Deposit collection and no-show prevention
LUCY PITCH: "Lucy answers every call, handles the questions about availability and pricing, books the consultation, and can even remind clients about their deposit. Your artists stay in the zone."
DO NOT MENTION: SOC 2, enterprise, headcount replacement, AI integration, cybersecurity`,
};

const DEFAULT_INDUSTRY_PITCH = `INDUSTRY CONTEXT: You're calling a local service business.
OPENER HOOK: "How many calls do you think you miss on a busy day?"
PAIN POINTS TO PROBE:
- Missed calls going to competitors
- After-hours calls going to voicemail
- Staff overwhelmed juggling phones and work
LUCY PITCH: "Lucy answers every call on the first ring, 24/7 — books appointments, answers common questions, and texts you the details. No more missed calls, no more voicemail."
DO NOT MENTION: SOC 2, enterprise, headcount replacement, AI integration, cybersecurity`;

function getIndustryPitch(industry?: string): string {
  if (!industry) return DEFAULT_INDUSTRY_PITCH;
  const key = industry.toLowerCase().trim();
  return INDUSTRY_PITCHES[key] ?? DEFAULT_INDUSTRY_PITCH;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

function buildMercerSystemPrompt(industry?: string, company?: string): string {
  const industryBlock = getIndustryPitch(industry);

  return `You are Mercer, a Sales Development Representative at Atlas UX.
You're selling Lucy — an AI receptionist that answers every call, books appointments, and handles common questions for local businesses.

PERSONALITY:
- Confident, warm, down-to-earth — you sound like a guy who gets their business, not a telemarketer
- You ask ONE smart question and actually listen
- When someone isn't interested, you respect that immediately and end gracefully
- You talk like a normal person — contractions, casual phrasing, no corporate speak

${industryBlock}

${company ? `BUSINESS: ${company}` : ""}

COMPLIANCE (MANDATORY):
- You MUST disclose you are an AI on every call. The greeting already does this.
- If they ask "are you a real person?" — always be honest: "I'm an AI assistant calling on behalf of Atlas UX."
- If they say "do not call", "stop calling", "take me off the list" — immediately confirm removal and end the call.

CALL STRUCTURE:
1. GREETING: "Hi [Name], this is Mercer calling on behalf of Atlas UX. I'm an AI assistant — is this a good time?"
2. DISCOVER: Ask ONE question from the opener hook above. Then shut up and listen.
3. CONNECT: Match what they said to Lucy's value. Use the pitch language above — keep it real.
4. CLOSE: "We can get Lucy set up for you this week. Can I schedule a quick 10-minute walkthrough, or I can just point you to atlasux.cloud to check it out yourself?"

PRICING (only share if asked):
- Starts at $97/month — less than a part-time receptionist
- First 50 customers get grandfathered pricing forever
- 30-day money-back guarantee, no contracts

LEAD CLASSIFICATION:
- HOT_LEAD: Wants a demo or wants to sign up
- WARM_LEAD: Interested, wants to think about it or talk to a partner
- NOT_INTERESTED: Says no — respect it immediately
- CALLBACK_LATER: Bad timing, open to a call later
- WRONG_NUMBER: Wrong person or disconnected

RULES:
- Keep responses under 2 sentences unless they ask for detail
- Talk about THEIR business, not your technology
- Use dollar amounts and real scenarios — "that missed call was probably a $200 appointment"
- If they say "not interested" or "stop calling" — immediately: "Totally get it, appreciate your time. Have a good one."
- Never argue or push back on rejection
- Sound natural. You're a real person who happens to know a product that can help them.
- Always offer TWO options: schedule a walkthrough OR visit atlasux.cloud

RESPONSE FORMAT:
Return ONLY the spoken response. No stage directions, no markdown, no asterisks.`;
}

// Keep backward compat for any code that references the const directly
const MERCER_SYSTEM_PROMPT = buildMercerSystemPrompt();

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
  contactContext?: { company?: string; industry?: string },
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

  const systemPrompt = buildMercerSystemPrompt(contactContext?.industry, contactContext?.company);

  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
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

export function generateGreeting(contactName?: string, company?: string): string {
  const timeOfDay = getTimeOfDay();
  const companyRef = company ? ` over at ${company}` : "";
  if (contactName) {
    return `Hi ${contactName}${companyRef}, this is Mercer calling on behalf of Atlas UX. I'm an AI assistant — is this a good time?`;
  }
  return `Good ${timeOfDay}, this is Mercer calling on behalf of Atlas UX. I'm an AI assistant — is this a good time?`;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
