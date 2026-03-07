/**
 * Twilio Media Stream Handler — Lucy's phone ear and mouth.
 *
 * Flow:
 *   Twilio call -> TwiML <Connect><Stream> -> WebSocket opened
 *   -> Twilio sends mulaw audio chunks
 *   -> We transcode to LINEAR16 and pipe to Google STT (streaming)
 *   -> STT returns transcript
 *   -> Lucy's brain generates response
 *   -> Gemini 2.5 Flash TTS synthesizes speech (Gacrux voice)
 *   -> We transcode to mulaw and send back to Twilio
 *   -> Caller hears Lucy speak
 */

import type { WebSocket } from "ws";
import { readFileSync } from "fs";
import { SpeechClient } from "@google-cloud/speech";
import { twilioToGoogleSTT, googleTTSToTwilio } from "./audioTranscoder.js";
import {
  createSession,
  addTranscriptEntry,
  endSession,
  getSession,
  type TranscriptEntry,
} from "./contextRing.js";
import { generateResponse, lookupCallerByCRM, VOICE_CONFIG } from "./lucyBrain.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";
import { synthesizeSpeech } from "./ttsEngine.js";
import { processEndedSession } from "./postCallProcessor.js";

// Lazy-init so dotenv has loaded by the time we create the client
let sttClient: SpeechClient | null = null;
function getSTTClient(): SpeechClient {
  if (!sttClient) {
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    console.log(`[lucy-phone] STT init with keyFile: ${keyFile}`);
    if (keyFile) {
      const creds = JSON.parse(readFileSync(keyFile, "utf8"));
      sttClient = new SpeechClient({
        projectId: creds.project_id,
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
      });
    } else {
      sttClient = new SpeechClient();
    }
  }
  return sttClient;
}

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StreamState {
  sessionId: string;
  streamSid: string;
  callSid: string;
  callerNumber: string;
  ws: WebSocket;
  sttStream: ReturnType<InstanceType<typeof SpeechClient>["streamingRecognize"]> | null;
  sttRestartTimer: ReturnType<typeof setTimeout> | null;
  sttLastRestart: number;
  isProcessing: boolean;
  lastSpeechTs: number;
  silenceTimer: ReturnType<typeof setTimeout> | null;
}

// ── Google STT Streaming ──────────────────────────────────────────────────────

function createSTTStream(state: StreamState): void {
  // Cooldown: don't restart more than once per 3 seconds
  const now = Date.now();
  if (now - state.sttLastRestart < 3000) return;
  state.sttLastRestart = now;

  if (state.sttStream) {
    try { state.sttStream.end(); } catch { /* ignore */ }
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
        maxSpeakerCount: 2,
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

    const entry: TranscriptEntry = {
      ts: Date.now(),
      speaker: state.callerNumber,
      speakerRole: "caller",
      speakerTag,
      text: transcript,
      isFinal,
      source: "phone",
    };

    addTranscriptEntry(state.sessionId, entry);

    // Only respond to final transcripts with substance
    if (isFinal && transcript.length > 2) {
      // Reset silence timer
      if (state.silenceTimer) clearTimeout(state.silenceTimer);
      // Small delay to allow speaker to continue (don't interrupt)
      state.silenceTimer = setTimeout(() => {
        handleCallerUtterance(state, transcript);
      }, 800);
    }
  });

  sttStream.on("error", (err: any) => {
    console.error("[lucy-phone] STT stream error:", err?.message);
    // Auto-restart on any error (duration limit, destroyed stream, etc.)
    if (state.ws.readyState === 1) {
      createSTTStream(state);
    }
  });

  state.sttStream = sttStream;

  // Auto-restart before 5 min limit (Google hard cap)
  if (state.sttRestartTimer) clearTimeout(state.sttRestartTimer);
  state.sttRestartTimer = setTimeout(() => createSTTStream(state), 4.5 * 60 * 1000);
}

// ── Handle Caller Speech ──────────────────────────────────────────────────────

async function handleCallerUtterance(state: StreamState, transcript: string): Promise<void> {
  if (state.isProcessing) return;
  state.isProcessing = true;

  try {
    const session = getSession(state.sessionId);
    if (!session) return;

    // Generate Lucy's response
    const response = await generateResponse(
      state.sessionId,
      TENANT_ID,
      transcript,
      session.callerProfile.name ?? state.callerNumber,
    );

    // Synthesize speech via Gemini TTS
    const audioContent = await synthesizeSpeech(response.spokenText, "lucy");

    // Send audio back to Twilio
    if (audioContent && state.ws.readyState === 1) {
      const mulawBase64 = googleTTSToTwilio(audioContent);
      // Send in chunks (~40ms of 8kHz mulaw each)
      const chunkSize = 640;
      for (let i = 0; i < mulawBase64.length; i += chunkSize) {
        const chunk = mulawBase64.slice(i, i + chunkSize);
        state.ws.send(JSON.stringify({
          event: "media",
          streamSid: state.streamSid,
          media: { payload: chunk },
        }));
      }
    }

    // Log Lucy's response to transcript
    addTranscriptEntry(state.sessionId, {
      ts: Date.now(),
      speaker: "Lucy",
      speakerRole: "lucy",
      text: response.spokenText,
      isFinal: true,
      source: "phone",
    });

    // Slack alert if needed
    if (response.shouldAlert && response.alertMessage) {
      alertOnSlack(response.alertMessage);
    }
  } catch (err: any) {
    console.error("[lucy-phone] Response error:", err?.message);
  } finally {
    state.isProcessing = false;
  }
}

// ── Slack Alert ───────────────────────────────────────────────────────────────

async function alertOnSlack(message: string): Promise<void> {
  try {
    const channel = await getChannelByName("phone-calls", true);
    if (channel) {
      await postAsAgent(channel.id, "lucy", `Phone: ${message}`);
    }
  } catch { /* best-effort */ }
}

// ── WebSocket Handler (exported for route registration) ───────────────────────

export async function handleTwilioMediaStream(ws: WebSocket): Promise<void> {
  let state: StreamState | null = null;

  ws.on("message", async (data: Buffer | string) => {
    const msg = JSON.parse(typeof data === "string" ? data : data.toString());

    switch (msg.event) {
      case "connected":
        console.log("[lucy-phone] WebSocket connected");
        break;

      case "start": {
        // Only process the first start event per connection
        if (state) break;

        const { callSid, streamSid, customParameters } = msg.start;
        const callerNumber = customParameters?.from ?? "unknown";
        const sessionId = `phone-${callSid}`;

        // CRM lookup
        const crmProfile = await lookupCallerByCRM(TENANT_ID, callerNumber);

        const session = createSession(sessionId, "phone", {
          phone: callerNumber,
          ...crmProfile,
        });
        session.callSid = callSid;
        session.streamSid = streamSid;

        state = {
          sessionId,
          streamSid,
          callSid,
          callerNumber,
          ws,
          sttStream: null,
          sttRestartTimer: null,
          sttLastRestart: 0,
          isProcessing: false,
          lastSpeechTs: Date.now(),
          silenceTimer: null,
        };

        createSTTStream(state);

        // Lucy's greeting
        const greeting = crmProfile.name
          ? `Good ${getTimeOfDay()}, ${crmProfile.name}! This is Lucy at Atlas UX. Great to hear from you again. How can I help you today?`
          : `Good ${getTimeOfDay()}, thank you for calling Atlas UX. This is Lucy. How can I help you today?`;

        const greetingAudio = await synthesizeSpeech(greeting, "lucy");
        if (greetingAudio && ws.readyState === 1) {
          const mulaw = googleTTSToTwilio(greetingAudio);
          const chunkSize = 640;
          for (let i = 0; i < mulaw.length; i += chunkSize) {
            ws.send(JSON.stringify({
              event: "media",
              streamSid,
              media: { payload: mulaw.slice(i, i + chunkSize) },
            }));
          }
        }

        addTranscriptEntry(sessionId, {
          ts: Date.now(),
          speaker: "Lucy",
          speakerRole: "lucy",
          text: greeting,
          isFinal: true,
          source: "phone",
        });

        console.log(`[lucy-phone] Session started: ${sessionId} from ${callerNumber}`);
        break;
      }

      case "media": {
        if (!state?.sttStream || state.sttStream.destroyed) break;
        const pcm16k = twilioToGoogleSTT(msg.media.payload);
        try {
          state.sttStream.write(pcm16k);
          state.lastSpeechTs = Date.now();
        } catch {
          // Stream died — recreate it
          if (state.ws.readyState === 1) createSTTStream(state);
        }
        break;
      }

      case "stop": {
        if (state) {
          console.log(`[lucy-phone] Call ended: ${state.sessionId}`);
          if (state.sttStream) state.sttStream.end();
          if (state.sttRestartTimer) clearTimeout(state.sttRestartTimer);
          if (state.silenceTimer) clearTimeout(state.silenceTimer);
          // Process post-call (async, don't block)
          processEndedSession(state.sessionId).catch(() => {});
          state = null;
        }
        break;
      }
    }
  });

  ws.on("close", () => {
    if (state) {
      if (state.sttStream) state.sttStream.end();
      if (state.sttRestartTimer) clearTimeout(state.sttRestartTimer);
      if (state.silenceTimer) clearTimeout(state.silenceTimer);
      processEndedSession(state.sessionId).catch(() => {});
    }
  });
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
