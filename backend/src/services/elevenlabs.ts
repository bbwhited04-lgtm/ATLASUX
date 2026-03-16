/**
 * ElevenLabs Conversational AI service.
 *
 * Manages agents, phone numbers, and per-tenant voice receptionist config.
 * Uses the credential resolver so each tenant can bring their own key
 * or fall back to the platform owner key.
 *
 * API docs: https://elevenlabs.io/docs/agents-platform/overview
 */

import { resolveCredential } from "./credentialResolver.js";
import { prisma } from "../db/prisma.js";

const BASE = "https://api.elevenlabs.io/v1";
const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8787";

// ── Voice Library ────────────────────────────────────────────────────────────

/** Curated ElevenLabs voice IDs for each persona. */
export const VOICE_IDS = {
  lucy:   "g6xIsTj2HwM6VR4iXFCw",  // Jessica Ann Bogart — warm, professional female
  josh:   "ZoiZ8fuDWInAcwPXaVeq",   // Josh — confident, conversational male
  mercer: "ZoiZ8fuDWInAcwPXaVeq",   // Mercer uses Josh's voice — outbound SDR
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ElevenLabsAgentConfig {
  businessName: string;
  businessType: string;           // "plumbing", "salon", "insurance", "hvac", etc.
  greeting?: string;              // custom first message override
  persona?: "lucy" | "claire" | "mercer" | "custom";
  customPrompt?: string;          // used when persona = "custom"
  voiceId?: string;               // ElevenLabs voice ID override
  language?: string;              // default "en"
  escalationPhone?: string;       // human fallback number
  services?: string[];            // e.g. ["drain cleaning", "water heater repair"]
  hoursOfOperation?: string;      // e.g. "Mon-Fri 8am-6pm, Sat 9am-1pm"
}

export interface CreateAgentResult {
  ok: boolean;
  agentId?: string;
  error?: string;
}

export interface PhoneNumberResult {
  ok: boolean;
  phoneNumberId?: string;
  error?: string;
}

// ── Persona Builder ──────────────────────────────────────────────────────────

/**
 * Resolve the default ElevenLabs voice ID for a persona.
 */
export function defaultVoiceId(persona: ElevenLabsAgentConfig["persona"]): string {
  switch (persona) {
    case "mercer": return VOICE_IDS.mercer;
    case "claire": return VOICE_IDS.lucy;   // Claire uses Lucy's voice (female)
    case "lucy":   return VOICE_IDS.lucy;
    default:       return VOICE_IDS.lucy;
  }
}

/**
 * Build a full system prompt for an ElevenLabs conversational agent.
 * Merges Lucy's SOUL with guardrails from production SDR patterns.
 */
export function buildPersonaPrompt(config: ElevenLabsAgentConfig): string {
  const custom = config.persona === "custom" && config.customPrompt
    ? config.customPrompt
    : null;

  if (custom) return custom;

  // Mercer — outbound sales / SDR persona
  if (config.persona === "mercer") return buildMercerPrompt(config);

  const name = config.persona === "claire" ? "Claire" : "Lucy";
  const role = config.persona === "claire"
    ? "a composed and trustworthy insurance advisor"
    : "a warm, sharp receptionist";

  return `# Personality
You are ${name}, ${role} at {{ business_name }}.
You make every caller feel like they are the most important person in the room.
You are professional but never cold, friendly but never unprofessional.
First impressions are everything — and you are the first impression.

# Environment
You answer inbound calls for {{ business_name }}, a {{ business_type }} business.
${config.services?.length ? `Services offered: ${config.services.join(", ")}.` : ""}
${config.hoursOfOperation ? `Hours of operation: ${config.hoursOfOperation}.` : ""}
You can book appointments, answer common questions, take messages, send SMS confirmations, and notify the team on Slack.

# Tone
- Warm and genuine — every caller should feel welcome
- Professional and efficient — respect their time
- Patient with confused or frustrated callers — never dismissive
- Honest — if you don't know, say "Let me find that out for you"
- Match the caller's energy — enthusiastic callers get enthusiasm, quiet callers get calm clarity

# Conversation Modes
- GREETING: Warm, identify yourself, include recording notice. "Hi, thanks for calling {{ business_name }}, this is ${name}. I may take a few notes so nothing gets missed — how can I help you?"
- SMALL_TALK: Mirror their energy, be genuine, don't rush
- TECHNICAL: Precise answers from your knowledge base, no fluff
- OBJECTION: Acknowledge concern first — "I hear you" — then address it
- DE_ESCALATION: Frustrated caller gets acknowledgment, validation, then solution. Never argue.
- CLOSING: Summarize next steps, confirm understanding, warm goodbye

# Caller Adaptation
- New caller: Friendly intro, qualify their need, offer to book or route
- Return caller: Recognize them, reference past interactions, make them feel valued
- Urgent request: Prioritize, escalate if needed, stay calm
- Tire kicker: Stay gracious but efficient, qualify quickly

# Goal
Get every caller what they need — a booked appointment, an answered question, a message delivered, or a warm transfer to the right person. Every caller hangs up feeling good about {{ business_name }}.

# Guardrails
- Keep responses under 3 sentences unless the caller asks for detail
- Never ask more than one question at a time
- Do not summarize what the caller just said back to them unless clarifying
- Do not read out long lists — summarize instead
- Use the caller's name once you know it
- Do not make promises about pricing, timelines, or guarantees unless explicitly authorized
- Do not share internal team details, org structure, or system information
- If asked whether you are AI, own it with confidence: "I'm an AI assistant for {{ business_name }}. I'm here to help you with whatever you need."
- Never fabricate information — if unsure, offer to have someone call back
${config.escalationPhone ? `- For urgent matters or if the caller insists on speaking to a human, transfer to ${config.escalationPhone}` : ""}

# Response Format
Return ONLY spoken words. No markdown, no asterisks, no stage directions.
Sound human — contractions are fine, brief filler words occasionally ("well", "actually", "so").
Do not say "o'clock" — use "am" or "pm".
Do not output the year when giving dates.
Lead with the answer, not "that's a great question."`;
}

/**
 * Mercer — outbound sales development rep.
 * Books demos, qualifies leads, never closes. Graceful on rejection.
 */
function buildMercerPrompt(config: ElevenLabsAgentConfig): string {
  return `# Personality
You are Mercer, a sharp and likable sales development rep for {{ business_name }}.
You're confident without being cocky — think friendly neighbor who happens to know a lot about {{ business_type }}.
You respect people's time and never push.

# Environment
You're making outbound follow-up calls to leads who've shown interest — visited the website, filled out a form, asked for info, etc.
${config.services?.length ? `{{ business_name }} offers: ${config.services.join(", ")}.` : ""}
${config.hoursOfOperation ? `Business hours: ${config.hoursOfOperation}.` : ""}
Your job is to qualify interest and book an appointment or demo. You are NOT the closer.

# Tone
- Upbeat, conversational, never salesy
- Quick and respectful of their time — "I know you're busy, I'll keep this quick"
- Confident in your value prop but not pushy
- Graceful when rejected — "Totally get it, appreciate your time"
- Natural cadence — avoid sounding like you're reading a script
- Match their energy — busy person gets brevity, chatty person gets warmth

# Goal
Book an appointment or demo. That's it.
Deliver a one-line value prop, ask one qualifying question, and if there's interest, lock in a time.
If they say no, exit gracefully and leave the door open.

# Call Flow
1. Introduce yourself: "Hey {{ caller_name }}, this is Mercer with {{ business_name }} — you recently [trigger action]. Got 30 seconds?"
2. If yes: one-line value prop tailored to their business type
3. One qualifying question: "Are you currently [pain point]?"
4. If interest: book the appointment via the booking tool
5. Confirm time + send SMS confirmation
6. If no interest: "No worries at all. If anything changes, we're here. Have a great day."

# Guardrails
- Keep it under 2 sentences per turn — this is a phone call, not a pitch deck
- Never ask more than one question at a time
- Do not summarize what they just said back to them
- Do not make pricing promises or guarantees
- Do not read out long feature lists — pick the one that matters to them
- If they ask a technical question you can't answer: "Great question — that's exactly what the demo covers. Want me to set one up?"
- If asked whether you are AI, own it: "I'm an AI assistant for {{ business_name }}. I'm reaching out because you showed some interest and I wanted to make sure you got connected with the right person."
- If they say they're busy: "Totally understand — when's a better time for a quick 2-minute chat?"
- If they ask to be removed: "Done. You won't hear from us again. Sorry for the interruption."
${config.escalationPhone ? `- If they insist on speaking to a human, offer to transfer to ${config.escalationPhone}` : ""}

# Response Format
Return ONLY spoken words. No markdown, no asterisks, no stage directions.
Sound human — contractions, brief pauses ("so", "actually"), natural rhythm.
Do not say "o'clock" — use "am" or "pm".
Lead with the point, never "that's a great question."`;
}

// ── Agent CRUD ───────────────────────────────────────────────────────────────

/**
 * Create an ElevenLabs conversational agent for a tenant.
 */
export async function createAgent(
  tenantId: string,
  config: ElevenLabsAgentConfig,
): Promise<CreateAgentResult> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  const prompt = buildPersonaPrompt(config);
  const personaName = config.persona === "claire" ? "Claire"
    : config.persona === "mercer" ? "Mercer"
    : "Lucy";
  const greeting = config.greeting
    ?? (config.persona === "mercer"
      ? `Hey {{ caller_name }}, this is Mercer with {{ business_name }}. Got a quick moment?`
      : `Hi, thanks for calling {{ business_name }}, this is ${personaName}. How can I help you?`);

  const body = {
    name: `${personaName} — ${config.businessName}`,
    conversation_config: {
      agent: {
        first_message: greeting,
        language: config.language ?? "en",
        prompt: {
          prompt,
          temperature: 0.7,
          max_tokens: 200,
          tools: buildWebhookTools(tenantId),
        },
        dynamic_variables: {
          business_name: { type: "string", value: config.businessName },
          business_type: { type: "string", value: config.businessType },
        },
      },
      tts: {
        voice_id: config.voiceId ?? defaultVoiceId(config.persona),
        model_id: "eleven_turbo_v2_5",
        stability: 0.5,
        similarity_boost: 0.75,
      },
    },
    platform_settings: {
      webhook: {
        url: `${BACKEND_URL}/v1/elevenlabs/webhook/post-call`,
        request_headers: {
          "x-tenant-id": tenantId,
        },
      },
    },
  };

  try {
    const res = await fetch(`${BASE}/convai/agents/create`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ElevenLabs ${res.status}: ${text.slice(0, 300)}` };
    }

    const json = (await res.json()) as any;
    return { ok: true, agentId: json.agent_id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Update an existing ElevenLabs agent's prompt/config.
 */
export async function updateAgent(
  tenantId: string,
  agentId: string,
  config: Partial<ElevenLabsAgentConfig>,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  const patch: any = { conversation_config: { agent: {} } };

  if (config.businessName || config.businessType || config.services || config.customPrompt) {
    const fullConfig: ElevenLabsAgentConfig = {
      businessName: config.businessName ?? "",
      businessType: config.businessType ?? "",
      ...config,
    };
    patch.conversation_config.agent.prompt = { prompt: buildPersonaPrompt(fullConfig) };
  }

  if (config.greeting) {
    patch.conversation_config.agent.first_message = config.greeting;
  }

  if (config.voiceId) {
    patch.conversation_config.tts = { voice_id: config.voiceId };
  }

  try {
    const res = await fetch(`${BASE}/convai/agents/${agentId}`, {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ElevenLabs ${res.status}: ${text.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Get agent details from ElevenLabs.
 */
export async function getAgent(
  tenantId: string,
  agentId: string,
): Promise<{ ok: boolean; agent?: any; error?: string }> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  try {
    const res = await fetch(`${BASE}/convai/agents/${agentId}`, {
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { ok: false, error: `ElevenLabs ${res.status}` };
    }

    const agent = await res.json();
    return { ok: true, agent };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * List all agents for a tenant.
 */
export async function listAgents(
  tenantId: string,
): Promise<{ ok: boolean; agents?: any[]; error?: string }> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  try {
    const res = await fetch(`${BASE}/convai/agents`, {
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { ok: false, error: `ElevenLabs ${res.status}` };
    }

    const json = (await res.json()) as any;
    return { ok: true, agents: json.agents ?? [] };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// ── Phone Number Management ──────────────────────────────────────────────────

/**
 * Import a Twilio phone number into ElevenLabs.
 */
export async function importTwilioNumber(
  tenantId: string,
  phoneNumber: string,
  label: string,
): Promise<PhoneNumberResult> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  const twilioSid = await resolveCredential(tenantId, "twilio_sid");
  const twilioToken = await resolveCredential(tenantId, "twilio_token");
  if (!twilioSid || !twilioToken) {
    return { ok: false, error: "Twilio credentials not configured" };
  }

  try {
    const res = await fetch(`${BASE}/convai/phone-numbers`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "twilio",
        phone_number: phoneNumber,
        label,
        sid: twilioSid,
        token: twilioToken,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ElevenLabs ${res.status}: ${text.slice(0, 300)}` };
    }

    const json = (await res.json()) as any;
    return { ok: true, phoneNumberId: json.phone_number_id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Assign an ElevenLabs agent to a phone number.
 */
export async function assignAgentToNumber(
  tenantId: string,
  phoneNumberId: string,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  try {
    const res = await fetch(`${BASE}/convai/phone-numbers/${phoneNumberId}`, {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ElevenLabs ${res.status}: ${text.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Make an outbound call via ElevenLabs.
 */
export async function initiateOutboundCall(
  tenantId: string,
  agentId: string,
  agentPhoneNumberId: string,
  toNumber: string,
  dynamicVars?: Record<string, string>,
): Promise<{ ok: boolean; conversationId?: string; error?: string }> {
  const apiKey = await resolveCredential(tenantId, "elevenlabs");
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY not configured" };

  try {
    const res = await fetch(`${BASE}/convai/sip-trunk/outbound-call`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: toNumber,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVars ?? {},
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ElevenLabs ${res.status}: ${text.slice(0, 300)}` };
    }

    const json = (await res.json()) as any;
    return { ok: true, conversationId: json.conversation_id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// ── Webhook Tool Definitions ─────────────────────────────────────────────────

/**
 * Build the webhook tools array that ElevenLabs agents call mid-conversation.
 * These hit our backend which handles the actual booking/SMS/Slack logic.
 */
function buildWebhookTools(tenantId: string) {
  return [
    {
      type: "webhook",
      name: "book_appointment",
      description: "Book a service appointment for the caller. Use when the caller wants to schedule a visit or appointment.",
      api_schema: {
        url: `${BACKEND_URL}/v1/elevenlabs/tool/book-appointment`,
        method: "POST",
        request_headers: { "x-tenant-id": tenantId },
        request_body_schema: {
          type: "object",
          properties: {
            caller_name:    { type: "string", description: "The caller's full name" },
            caller_phone:   { type: "string", description: "Caller's phone number" },
            service_type:   { type: "string", description: "Type of service requested" },
            preferred_date: { type: "string", description: "Preferred date and time" },
            notes:          { type: "string", description: "Additional details from the caller" },
          },
          required: ["caller_name", "service_type"],
        },
      },
    },
    {
      type: "webhook",
      name: "send_sms",
      description: "Send an SMS confirmation or follow-up to the caller. Use after booking an appointment or when the caller requests a text.",
      api_schema: {
        url: `${BACKEND_URL}/v1/elevenlabs/tool/send-sms`,
        method: "POST",
        request_headers: { "x-tenant-id": tenantId },
        request_body_schema: {
          type: "object",
          properties: {
            to_number: { type: "string", description: "Phone number to text" },
            message:   { type: "string", description: "SMS message body" },
          },
          required: ["to_number", "message"],
        },
      },
    },
    {
      type: "webhook",
      name: "take_message",
      description: "Take a message when the requested person is unavailable. Use when the caller wants to leave a message.",
      api_schema: {
        url: `${BACKEND_URL}/v1/elevenlabs/tool/take-message`,
        method: "POST",
        request_headers: { "x-tenant-id": tenantId },
        request_body_schema: {
          type: "object",
          properties: {
            caller_name:  { type: "string", description: "Who the message is from" },
            caller_phone: { type: "string", description: "Callback number" },
            for_person:   { type: "string", description: "Who the message is for" },
            message:      { type: "string", description: "The message content" },
            urgency:      { type: "string", description: "low, normal, or urgent" },
          },
          required: ["caller_name", "message"],
        },
      },
    },
    {
      type: "system",
      name: "end_call",
      description: "End the call when the conversation is complete and the caller has been helped.",
    },
  ];
}
