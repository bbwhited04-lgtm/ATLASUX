/**
 * RTMS Client — Zoom Real-Time Media Streams for Lucy's meeting presence.
 *
 * Flow:
 *   Zoom meeting starts -> webhook fires meeting.rtms_started
 *   -> Connect to signaling WebSocket (handshake msg_type 1)
 *   -> Get media server URL (msg_type 2)
 *   -> Connect to media WebSocket (handshake msg_type 3, audio 16kHz PCM mono)
 *   -> Send start streaming via signaling (msg_type 7)
 *   -> Receive audio (msg_type 14) as base64 PCM
 *   -> Pipe to Google STT -> Lucy Brain -> TTS -> (transcript only for now)
 *   -> Receive transcripts (msg_type 17) for ContextRing
 */

import crypto from "crypto";
import WebSocket from "ws";
import { SpeechClient } from "@google-cloud/speech";
import { readFileSync } from "fs";
import {
  createSession,
  addTranscriptEntry,
  getSession,
} from "./contextRing.js";
import { generateResponse } from "./lucyBrain.js";
import { synthesizeSpeech } from "./ttsEngine.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";
import { processEndedSession } from "./postCallProcessor.js";

const CLIENT_ID = process.env.ZOOM_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET ?? "";
const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Active RTMS Sessions ─────────────────────────────────────────────────────

interface RTMSSession {
  meetingUuid: string;
  streamId: string;
  sessionId: string;
  signalingWs: WebSocket | null;
  mediaWs: WebSocket | null;
  sttStream: ReturnType<InstanceType<typeof SpeechClient>["streamingRecognize"]> | null;
  sttRestartTimer: ReturnType<typeof setTimeout> | null;
  sttLastRestart: number;
  isProcessing: boolean;
  silenceTimer: ReturnType<typeof setTimeout> | null;
}

const activeSessions = new Map<string, RTMSSession>();

// ── Lazy STT Client ──────────────────────────────────────────────────────────

let sttClient: SpeechClient | null = null;
function getSTTClient(): SpeechClient {
  if (!sttClient) {
    const inlineJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT || "";
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    if (inlineJson) {
      const creds = JSON.parse(inlineJson);
      sttClient = new SpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else if (keyFile) {
      const creds = JSON.parse(readFileSync(keyFile, "utf8"));
      sttClient = new SpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else {
      sttClient = new SpeechClient();
    }
  }
  return sttClient;
}

// ── HMAC Signature ───────────────────────────────────────────────────────────

function generateSignature(meetingUuid: string, streamId: string): string {
  const message = `${CLIENT_ID},${meetingUuid},${streamId}`;
  return crypto.createHmac("sha256", CLIENT_SECRET).update(message).digest("hex");
}

// ── Public API ───────────────────────────────────────────────────────────────

export function startRTMS(
  meetingUuid: string,
  streamId: string,
  serverUrl: string,
  meetingTopic?: string,
): void {
  if (activeSessions.has(streamId)) {
    console.log(`[rtms] Session already active for stream ${streamId}`);
    return;
  }

  const sessionId = `zoom-${meetingUuid}`;

  // Create ContextRing session
  createSession(sessionId, "zoom", {
    notes: [`Meeting: ${meetingTopic ?? "(No topic)"}`],
  });

  const session: RTMSSession = {
    meetingUuid,
    streamId,
    sessionId,
    signalingWs: null,
    mediaWs: null,
    sttStream: null,
    sttRestartTimer: null,
    sttLastRestart: 0,
    isProcessing: false,
    silenceTimer: null,
  };

  activeSessions.set(streamId, session);
  connectToSignaling(session, serverUrl);

  // Alert on Slack
  alertSlack(`Meeting RTMS started: *${meetingTopic ?? meetingUuid}*`);
  console.log(`[rtms] Starting RTMS for meeting ${meetingUuid}, stream ${streamId}`);
}

export function stopRTMS(streamId: string): void {
  const session = activeSessions.get(streamId);
  if (!session) return;

  cleanup(session);
  activeSessions.delete(streamId);
  console.log(`[rtms] Stopped RTMS for stream ${streamId}`);
}

// ── Signaling WebSocket ──────────────────────────────────────────────────────

function connectToSignaling(session: RTMSSession, serverUrl: string): void {
  const ws = new WebSocket(serverUrl);
  session.signalingWs = ws;

  ws.on("open", () => {
    console.log(`[rtms] Signaling connected for ${session.meetingUuid}`);
    ws.send(JSON.stringify({
      msg_type: 1,
      protocol_version: 1,
      meeting_uuid: session.meetingUuid,
      rtms_stream_id: session.streamId,
      sequence: Math.floor(Math.random() * 1e9),
      signature: generateSignature(session.meetingUuid, session.streamId),
    }));
  });

  ws.on("message", (data: Buffer | string) => {
    const msg = JSON.parse(typeof data === "string" ? data : data.toString());

    if (msg.msg_type === 2 && msg.status_code === 0) {
      // Handshake success — connect to media server
      const mediaUrl = msg.media_server?.server_urls?.all;
      if (mediaUrl) {
        connectToMedia(session, mediaUrl);
      } else {
        console.error("[rtms] No media server URL in handshake response");
      }
    } else if (msg.msg_type === 2 && msg.status_code !== 0) {
      console.error(`[rtms] Signaling handshake failed: status ${msg.status_code}`);
    } else if (msg.msg_type === 12) {
      // Keep-alive
      ws.send(JSON.stringify({ msg_type: 13, timestamp: msg.timestamp }));
    }
  });

  ws.on("error", (err) => {
    console.error("[rtms] Signaling WebSocket error:", err.message);
  });

  ws.on("close", () => {
    console.log("[rtms] Signaling WebSocket closed");
  });
}

// ── Media WebSocket ──────────────────────────────────────────────────────────

function connectToMedia(session: RTMSSession, mediaUrl: string): void {
  const ws = new WebSocket(mediaUrl);
  session.mediaWs = ws;

  ws.on("open", () => {
    console.log(`[rtms] Media connected for ${session.meetingUuid}`);
    ws.send(JSON.stringify({
      msg_type: 3,
      protocol_version: 1,
      meeting_uuid: session.meetingUuid,
      rtms_stream_id: session.streamId,
      signature: generateSignature(session.meetingUuid, session.streamId),
      media_type: 32, // All media types (audio + transcript)
      payload_encryption: false,
      media_params: {
        audio: {
          content_type: 1, // RAW_AUDIO
          sample_rate: 1,  // SR_16K — matches our STT pipeline
          channel: 1,      // MONO
          codec: 1,        // L16 (LINEAR16)
          data_opt: 1,     // AUDIO_MIXED_STREAM
          send_rate: 100,  // 100ms chunks
        },
      },
    }));
  });

  ws.on("message", (data: Buffer | string) => {
    const msg = JSON.parse(typeof data === "string" ? data : data.toString());
    handleMediaMessage(session, msg);
  });

  ws.on("error", (err) => {
    console.error("[rtms] Media WebSocket error:", err.message);
  });

  ws.on("close", () => {
    console.log("[rtms] Media WebSocket closed");
    if (session.sttStream) {
      try { session.sttStream.end(); } catch { /* ignore */ }
    }
    if (session.sttRestartTimer) clearTimeout(session.sttRestartTimer);
  });
}

// ── Media Message Handler ────────────────────────────────────────────────────

function handleMediaMessage(session: RTMSSession, msg: any): void {
  switch (msg.msg_type) {
    case 4: // MEDIA_HANDSHAKE_RESP
      if (msg.status_code === 0) {
        console.log("[rtms] Media handshake success — starting stream");
        // Send start streaming command to SIGNALING socket
        session.signalingWs?.send(JSON.stringify({
          msg_type: 7,
          rtms_stream_id: session.streamId,
        }));
        // Start STT stream for audio processing
        createSTTStream(session);
      } else {
        console.error(`[rtms] Media handshake failed: status ${msg.status_code}`);
      }
      break;

    case 12: // KEEP_ALIVE_REQ
      session.mediaWs?.send(JSON.stringify({ msg_type: 13, timestamp: msg.timestamp }));
      break;

    case 14: // MEDIA_DATA_AUDIO
      handleAudioData(session, msg);
      break;

    case 17: // MEDIA_DATA_TRANSCRIPT
      handleTranscriptData(session, msg);
      break;
  }
}

// ── Audio Processing (STT) ───────────────────────────────────────────────────

function createSTTStream(session: RTMSSession): void {
  const now = Date.now();
  if (now - session.sttLastRestart < 3000) return;
  session.sttLastRestart = now;

  if (session.sttStream) {
    try { session.sttStream.end(); } catch { /* ignore */ }
  }

  const sttStream = getSTTClient().streamingRecognize({
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
      model: "telephony",
      useEnhanced: true,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: 6,
      },
    },
    interimResults: true,
  });

  sttStream.on("data", (response: any) => {
    const results = response.results;
    if (!results?.length) return;

    const result = results[0];
    const transcript = result.alternatives?.[0]?.transcript?.trim();
    if (!transcript) return;

    const isFinal = result.isFinal;
    const speakerTag = result.alternatives?.[0]?.words?.[0]?.speakerTag ?? 0;

    addTranscriptEntry(session.sessionId, {
      ts: Date.now(),
      speaker: `Speaker ${speakerTag}`,
      speakerRole: "participant",
      speakerTag,
      text: transcript,
      isFinal,
      source: "zoom",
    });

    // Respond to final transcripts that mention Lucy or ask questions
    if (isFinal && transcript.length > 5 && shouldLucyRespond(transcript)) {
      if (session.silenceTimer) clearTimeout(session.silenceTimer);
      session.silenceTimer = setTimeout(() => {
        handleMeetingUtterance(session, transcript, `Speaker ${speakerTag}`);
      }, 1000);
    }
  });

  sttStream.on("error", (err: any) => {
    console.error("[rtms] STT stream error:", err?.message);
    if (session.mediaWs?.readyState === WebSocket.OPEN) {
      createSTTStream(session);
    }
  });

  session.sttStream = sttStream;

  // Auto-restart before Google's 5-min limit
  if (session.sttRestartTimer) clearTimeout(session.sttRestartTimer);
  session.sttRestartTimer = setTimeout(() => createSTTStream(session), 4.5 * 60 * 1000);
}

function handleAudioData(session: RTMSSession, msg: any): void {
  if (!session.sttStream || session.sttStream.destroyed) return;

  try {
    // RTMS sends audio as base64-encoded PCM (16kHz, 16-bit, mono)
    const pcmBuffer = Buffer.from(msg.content?.data ?? msg.content, "base64");
    session.sttStream.write(pcmBuffer);
  } catch {
    // Stream died — recreate
    if (session.mediaWs?.readyState === WebSocket.OPEN) {
      createSTTStream(session);
    }
  }
}

// ── Transcript Processing (Zoom's built-in transcription) ────────────────────

function handleTranscriptData(session: RTMSSession, msg: any): void {
  const userName = msg.content?.user_name ?? "Unknown";
  const text = msg.content?.data ?? msg.content ?? "";
  if (!text) return;

  addTranscriptEntry(session.sessionId, {
    ts: Date.now(),
    speaker: userName,
    speakerRole: "participant",
    text: String(text),
    isFinal: true,
    source: "zoom",
  });

  // Also check if Lucy should respond to transcript
  if (shouldLucyRespond(String(text))) {
    if (session.silenceTimer) clearTimeout(session.silenceTimer);
    session.silenceTimer = setTimeout(() => {
      handleMeetingUtterance(session, String(text), userName);
    }, 1000);
  }
}

// ── Lucy Response Logic ──────────────────────────────────────────────────────

function shouldLucyRespond(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("lucy") ||
    lower.includes("atlas") ||
    lower.endsWith("?") ||
    lower.includes("what do you think") ||
    lower.includes("can you") ||
    lower.includes("tell me")
  );
}

async function handleMeetingUtterance(
  session: RTMSSession,
  transcript: string,
  speaker: string,
): Promise<void> {
  if (session.isProcessing) return;
  session.isProcessing = true;

  try {
    const response = await generateResponse(
      session.sessionId,
      TENANT_ID,
      transcript,
      speaker,
    );

    // Log Lucy's response to ContextRing
    addTranscriptEntry(session.sessionId, {
      ts: Date.now(),
      speaker: "Lucy",
      speakerRole: "lucy",
      text: response.spokenText,
      isFinal: true,
      source: "zoom",
    });

    // Post Lucy's response to Slack so the team can see it
    alertSlack(`*Lucy* (in meeting): ${response.spokenText}`);

    // Note: RTMS is receive-only for audio. Lucy can't speak into the meeting
    // via RTMS. For bidirectional audio, we'd need the native Meeting SDK.
    // For now, Lucy's responses go to Slack + ContextRing for the team to relay.

    if (response.shouldAlert && response.alertMessage) {
      alertSlack(response.alertMessage);
    }
  } catch (err: any) {
    console.error("[rtms] Response error:", err?.message);
  } finally {
    session.isProcessing = false;
  }
}

// ── Slack Alerts ─────────────────────────────────────────────────────────────

async function alertSlack(message: string): Promise<void> {
  try {
    const channel = await getChannelByName("phone-calls", true);
    if (channel) {
      await postAsAgent(channel.id, "lucy", message);
    }
  } catch { /* best-effort */ }
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

function cleanup(session: RTMSSession): void {
  if (session.sttStream) {
    try { session.sttStream.end(); } catch { /* ignore */ }
  }
  if (session.sttRestartTimer) clearTimeout(session.sttRestartTimer);
  if (session.silenceTimer) clearTimeout(session.silenceTimer);
  if (session.mediaWs?.readyState === WebSocket.OPEN) session.mediaWs.close();
  if (session.signalingWs?.readyState === WebSocket.OPEN) session.signalingWs.close();

  // Process post-meeting
  processEndedSession(session.sessionId).catch(() => {});
}
