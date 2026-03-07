/**
 * ContextRing — shared conversational memory across Lucy voice instances.
 *
 * One brain, multiple ears. The Zoom Lucy and Phone Lucy are the same person.
 * This ring holds everything Lucy knows about the current conversation(s).
 *
 * In-memory for now (single-process). If we scale to multi-process,
 * swap to Redis pub/sub with zero code changes to consumers.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type SpeakerRole = "lucy" | "atlas" | "caller" | "host" | "participant" | "unknown";

export interface TranscriptEntry {
  ts: number;               // unix ms
  speaker: string;          // display name or phone number
  speakerRole: SpeakerRole;
  speakerTag?: number;      // Google STT diarization tag
  text: string;
  isFinal: boolean;         // false = interim result
  source: "zoom" | "phone"; // which instance captured this
}

export type CallerType = "warm_lead" | "tire_kicker" | "vc_stress_test" | "existing_customer" | "unknown";

export type ConversationMode =
  | "greeting"          // first 10 seconds — warm, identify caller
  | "small_talk"        // casual, building rapport
  | "technical"         // caller asking detailed questions
  | "objection"         // pushback, skepticism
  | "de_escalation"     // frustrated caller — acknowledge, calm, solve
  | "closing"           // wrapping up, next steps
  | "on_hold";          // Lucy stepped away (phone handoff)

export interface CallerProfile {
  phone?: string;
  email?: string;
  name?: string;
  company?: string;
  crmContactId?: string;
  callerType: CallerType;
  sentiment: number;        // -1.0 (angry) to 1.0 (delighted)
  energyLevel: number;      // 0.0 (flat) to 1.0 (enthusiastic)
  isReturnCaller: boolean;
  previousInteractions: number;
  notes: string[];          // running observations
}

export interface VoiceSession {
  id: string;
  source: "zoom" | "phone";
  startedAt: number;
  active: boolean;
  meetingId?: string;       // Zoom meeting ID
  callSid?: string;         // Twilio call SID
  streamSid?: string;       // Twilio stream SID
  callerProfile: CallerProfile;
  mode: ConversationMode;
  transcript: TranscriptEntry[];
  missedWhileAway: TranscriptEntry[]; // entries captured while Lucy was on another call
}

// ── ContextRing ───────────────────────────────────────────────────────────────

const sessions = new Map<string, VoiceSession>();
const MAX_TRANSCRIPT_ENTRIES = 500; // per session, ~25 min at normal pace

export function createSession(
  id: string,
  source: "zoom" | "phone",
  profile: Partial<CallerProfile> = {},
): VoiceSession {
  const session: VoiceSession = {
    id,
    source,
    startedAt: Date.now(),
    active: true,
    callerProfile: {
      callerType: "unknown",
      sentiment: 0.5,
      energyLevel: 0.5,
      isReturnCaller: false,
      previousInteractions: 0,
      notes: [],
      ...profile,
    },
    mode: "greeting",
    transcript: [],
    missedWhileAway: [],
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): VoiceSession | undefined {
  return sessions.get(id);
}

export function getAllActiveSessions(): VoiceSession[] {
  return [...sessions.values()].filter(s => s.active);
}

export function addTranscriptEntry(sessionId: string, entry: TranscriptEntry): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  // Replace interim with final for same speaker
  if (entry.isFinal && session.transcript.length > 0) {
    const last = session.transcript[session.transcript.length - 1];
    if (!last.isFinal && last.speaker === entry.speaker && last.source === entry.source) {
      session.transcript[session.transcript.length - 1] = entry;
      return;
    }
  }

  session.transcript.push(entry);

  // Trim oldest entries if over limit
  if (session.transcript.length > MAX_TRANSCRIPT_ENTRIES) {
    session.transcript.splice(0, session.transcript.length - MAX_TRANSCRIPT_ENTRIES);
  }
}

/** Get entries another session missed while Lucy was handling a different call. */
export function markMissedEntries(zoomSessionId: string, sinceTs: number): TranscriptEntry[] {
  const session = sessions.get(zoomSessionId);
  if (!session) return [];
  const missed = session.transcript.filter(e => e.ts >= sinceTs && e.isFinal && e.speakerRole !== "lucy");
  session.missedWhileAway = missed;
  return missed;
}

export function getRecentTranscript(sessionId: string, lastN: number = 20): TranscriptEntry[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return session.transcript.filter(e => e.isFinal).slice(-lastN);
}

export function updateMode(sessionId: string, mode: ConversationMode): void {
  const session = sessions.get(sessionId);
  if (session) session.mode = mode;
}

export function updateCallerProfile(sessionId: string, updates: Partial<CallerProfile>): void {
  const session = sessions.get(sessionId);
  if (session) Object.assign(session.callerProfile, updates);
}

export function endSession(id: string): VoiceSession | undefined {
  const session = sessions.get(id);
  if (session) {
    session.active = false;
    // Keep in map for post-call summary, clean up after 10 min
    setTimeout(() => sessions.delete(id), 10 * 60 * 1000);
  }
  return session;
}

export function getFullTranscriptText(sessionId: string): string {
  const session = sessions.get(sessionId);
  if (!session) return "";
  return session.transcript
    .filter(e => e.isFinal)
    .map(e => `[${e.speakerRole}/${e.speaker}]: ${e.text}`)
    .join("\n");
}
