/**
 * Zoom Bot — Lucy's meeting presence (Phase 1: transcript + chat).
 *
 * Phase 1: Lucy monitors Zoom meetings via webhooks + cloud transcript.
 *          She posts responses in Zoom chat when addressed.
 *          Full transcript flows into ContextRing for shared memory.
 *
 * Phase 2: Native Meeting SDK bot with bidirectional audio (future).
 *          Lucy speaks and listens in real-time inside the meeting.
 */

import {
  createSession,
  addTranscriptEntry,
  endSession,
  getSession,
  markMissedEntries,
  type TranscriptEntry,
} from "./contextRing.js";
import { generateResponse, generateReturnSummary } from "./lucyBrain.js";
import { processEndedSession } from "./postCallProcessor.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Meeting Session Management ────────────────────────────────────────────────

export function startMeetingSession(meetingId: string, title: string): string {
  const sessionId = `zoom-${meetingId}`;
  createSession(sessionId, "zoom", {
    notes: [`Meeting: ${title}`],
  });
  console.log(`[lucy-zoom] Session started: ${sessionId} — ${title}`);
  return sessionId;
}

export function addMeetingTranscript(
  meetingId: string,
  speaker: string,
  text: string,
  speakerTag?: number,
): void {
  const sessionId = `zoom-${meetingId}`;
  addTranscriptEntry(sessionId, {
    ts: Date.now(),
    speaker,
    speakerRole: speaker.toLowerCase() === "lucy" ? "lucy" : "participant",
    speakerTag,
    text,
    isFinal: true,
    source: "zoom",
  });
}

export async function handleMeetingQuestion(
  meetingId: string,
  speaker: string,
  question: string,
): Promise<string> {
  const sessionId = `zoom-${meetingId}`;
  const response = await generateResponse(sessionId, TENANT_ID, question, speaker);

  // Log Lucy's response
  addTranscriptEntry(sessionId, {
    ts: Date.now(),
    speaker: "Lucy",
    speakerRole: "lucy",
    text: response.spokenText,
    isFinal: true,
    source: "zoom",
  });

  return response.spokenText;
}

export async function handleLucyReturn(
  meetingId: string,
  leftAt: number,
): Promise<string> {
  const sessionId = `zoom-${meetingId}`;
  const missed = markMissedEntries(sessionId, leftAt);
  return generateReturnSummary(sessionId, missed);
}

export function endMeetingSession(meetingId: string): void {
  const sessionId = `zoom-${meetingId}`;
  // Process post-meeting (async, don't block)
  processEndedSession(sessionId).catch(() => {});
  console.log(`[lucy-zoom] Session ended: ${sessionId}`);
}
