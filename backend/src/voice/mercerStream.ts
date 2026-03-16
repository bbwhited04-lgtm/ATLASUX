/**
 * Mercer Media Stream Handler — outbound cold call voice pipeline.
 *
 * Same architecture as Lucy's twilioStream.ts but for outbound calls.
 * Uses male Google Neural2-J voice via TTS engine.
 *
 * Flow:
 *   Twilio outbound call -> <Connect><Stream> -> WebSocket opened
 *   -> Twilio sends mulaw audio chunks
 *   -> Transcode to LINEAR16 -> Google STT (streaming)
 *   -> STT returns transcript -> Mercer's brain generates response
 *   -> TTS synthesizes speech (male voice) -> transcode to mulaw -> Twilio
 *   -> Lead hears Mercer speak
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
import { generateMercerResponse, generateGreeting, MERCER_VOICE_CONFIG } from "./mercerBrain.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";
import { synthesizeMercerSpeech } from "./mercerTts.js";
import { processEndedOutboundCall } from "./mercerPostCall.js";
import { addToDnc } from "./outboundDialer.js";
import {
  startCostTracking,
  recordLLMUsage,
  recordTTSUsage,
  finalizeCostRecord,
} from "./callCostTracker.js";

// DNC keyword patterns — TCPA compliance
const DNC_PATTERNS = [
  /\bdo\s*n[o']?t\s+call\b/i,
  /\bstop\s+calling\b/i,
  /\bremove\s+(my|this)\s+number\b/i,
  /\btake\s+me\s+off\b/i,
  /\bput\s+me\s+on\s+(the\s+)?do\s*n[o']?t\s+call/i,
  /\bno\s+more\s+calls\b/i,
];

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

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutboundStreamState {
  sessionId: string;
  streamSid: string;
  callSid: string;
  contactPhone: string;
  contactName: string;
  contactId?: string;
  contactCompany?: string;
  contactIndustry?: string;
  ws: WebSocket;
  sttStream: ReturnType<InstanceType<typeof SpeechClient>["streamingRecognize"]> | null;
  sttRestartTimer: ReturnType<typeof setTimeout> | null;
  sttLastRestart: number;
  isProcessing: boolean;
  silenceTimer: ReturnType<typeof setTimeout> | null;
}

// ── STT Stream ────────────────────────────────────────────────────────────────

function createSTTStream(state: OutboundStreamState): void {
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

    const entry: TranscriptEntry = {
      ts: Date.now(),
      speaker: state.contactName || state.contactPhone,
      speakerRole: "caller",
      text: transcript,
      isFinal,
      source: "phone",
    };

    addTranscriptEntry(state.sessionId, entry);

    if (isFinal && transcript.length > 2) {
      if (state.silenceTimer) clearTimeout(state.silenceTimer);
      state.silenceTimer = setTimeout(() => {
        handleLeadUtterance(state, transcript);
      }, 800);
    }
  });

  sttStream.on("error", (err: any) => {
    console.error("[mercer-phone] STT stream error:", err?.message);
    if (state.ws.readyState === 1) {
      createSTTStream(state);
    }
  });

  state.sttStream = sttStream;

  if (state.sttRestartTimer) clearTimeout(state.sttRestartTimer);
  state.sttRestartTimer = setTimeout(() => createSTTStream(state), 4.5 * 60 * 1000);
}

// ── Handle Lead Speech ────────────────────────────────────────────────────────

async function handleLeadUtterance(state: OutboundStreamState, transcript: string): Promise<void> {
  if (state.isProcessing) return;
  state.isProcessing = true;

  // ── DNC keyword detection — auto-add to Do Not Call list ──
  const isDncRequest = DNC_PATTERNS.some(p => p.test(transcript));
  if (isDncRequest) {
    console.log(`[mercer-phone] DNC keyword detected from ${state.contactPhone}: "${transcript}"`);
    await addToDnc(state.contactPhone, "caller_request");

    // Acknowledge and end call gracefully
    const farewell = "Absolutely, I've removed your number from our list. You won't receive any more calls from us. Sorry to bother you, have a great day.";
    const farewellAudio = await synthesizeMercerSpeech(farewell);
    if (farewellAudio && state.ws.readyState === 1) {
      const mulaw = googleTTSToTwilio(farewellAudio);
      const chunkSize = 640;
      for (let i = 0; i < mulaw.length; i += chunkSize) {
        state.ws.send(JSON.stringify({
          event: "media",
          streamSid: state.streamSid,
          media: { payload: mulaw.slice(i, i + chunkSize) },
        }));
      }
    }

    addTranscriptEntry(state.sessionId, {
      ts: Date.now(),
      speaker: "Mercer",
      speakerRole: "lucy",
      text: farewell,
      isFinal: true,
      source: "phone",
    });

    // End call after farewell plays
    setTimeout(() => {
      try {
        state.ws.send(JSON.stringify({ event: "stop", streamSid: state.streamSid }));
        state.ws.close();
      } catch { /* ignore */ }
    }, 4000);
    state.isProcessing = false;
    return;
  }

  try {
    const response = await generateMercerResponse(
      state.sessionId,
      TENANT_ID,
      transcript,
      state.contactName || state.contactPhone,
      { company: state.contactCompany, industry: state.contactIndustry },
    );

    // Track LLM usage (estimate tokens from response length)
    const estimatedTokens = Math.ceil((transcript.length + response.spokenText.length) / 4);
    recordLLMUsage(state.callSid, estimatedTokens);

    // Synthesize with male voice
    const audioContent = await synthesizeMercerSpeech(response.spokenText);
    recordTTSUsage(state.callSid, response.spokenText.length);

    if (audioContent && state.ws.readyState === 1) {
      const mulawBase64 = googleTTSToTwilio(audioContent);
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

    addTranscriptEntry(state.sessionId, {
      ts: Date.now(),
      speaker: "Mercer",
      speakerRole: "lucy",  // reuse role for agent
      text: response.spokenText,
      isFinal: true,
      source: "phone",
    });

    if (response.shouldAlert && response.alertMessage) {
      alertOnSlack(response.alertMessage);
    }

    // End call if lead says not interested or wrong number
    if (response.shouldEndCall) {
      console.log(`[mercer-phone] Ending call — qualification: ${response.qualification}`);
      // Let the farewell play, then hang up after 3 seconds
      setTimeout(() => {
        try {
          state.ws.send(JSON.stringify({ event: "stop", streamSid: state.streamSid }));
          state.ws.close();
        } catch { /* ignore */ }
      }, 3000);
    }
  } catch (err: any) {
    console.error("[mercer-phone] Response error:", err?.message);
  } finally {
    state.isProcessing = false;
  }
}

// ── Slack Alert ───────────────────────────────────────────────────────────────

async function alertOnSlack(message: string): Promise<void> {
  try {
    const channel = await getChannelByName("phone-calls", true);
    if (channel) {
      await postAsAgent(channel.id, "mercer", `Outbound: ${message}`);
    }
  } catch { /* best-effort */ }
}

// ── WebSocket Handler ─────────────────────────────────────────────────────────

export async function handleMercerMediaStream(
  ws: WebSocket,
  contactInfo: { phone: string; name: string; contactId?: string; company?: string; industry?: string },
): Promise<void> {
  let state: OutboundStreamState | null = null;

  ws.on("message", async (data: Buffer | string) => {
    const msg = JSON.parse(typeof data === "string" ? data : data.toString());

    switch (msg.event) {
      case "connected":
        console.log("[mercer-phone] Outbound WebSocket connected");
        break;

      case "start": {
        if (state) break;

        const { callSid, streamSid } = msg.start;
        const sessionId = `mercer-${callSid}`;

        const session = createSession(sessionId, "phone", {
          phone: contactInfo.phone,
          name: contactInfo.name,
          crmContactId: contactInfo.contactId,
        });
        session.callSid = callSid;
        session.streamSid = streamSid;

        state = {
          sessionId,
          streamSid,
          callSid,
          contactPhone: contactInfo.phone,
          contactName: contactInfo.name,
          contactId: contactInfo.contactId,
          contactCompany: contactInfo.company,
          contactIndustry: contactInfo.industry,
          ws,
          sttStream: null,
          sttRestartTimer: null,
          sttLastRestart: 0,
          isProcessing: false,
          silenceTimer: null,
        };

        createSTTStream(state);

        // Start cost tracking for this call
        startCostTracking(callSid, TENANT_ID, "outbound");

        // Mercer's opening line
        const greeting = generateGreeting(contactInfo.name || undefined, contactInfo.company || undefined);
        const greetingAudio = await synthesizeMercerSpeech(greeting);
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

        // Track TTS cost for greeting
        recordTTSUsage(callSid, greeting.length);

        addTranscriptEntry(sessionId, {
          ts: Date.now(),
          speaker: "Mercer",
          speakerRole: "lucy",
          text: greeting,
          isFinal: true,
          source: "phone",
        });

        console.log(`[mercer-phone] Outbound session started: ${sessionId} -> ${contactInfo.phone}`);
        break;
      }

      case "media": {
        if (!state?.sttStream || state.sttStream.destroyed) break;
        const pcm16k = twilioToGoogleSTT(msg.media.payload);
        try {
          state.sttStream.write(pcm16k);
        } catch {
          if (state.ws.readyState === 1) createSTTStream(state);
        }
        break;
      }

      case "stop": {
        if (state) {
          console.log(`[mercer-phone] Outbound call ended: ${state.sessionId}`);
          if (state.sttStream) state.sttStream.end();
          if (state.sttRestartTimer) clearTimeout(state.sttRestartTimer);
          if (state.silenceTimer) clearTimeout(state.silenceTimer);
          finalizeCostRecord(state.callSid).catch(() => {});
          processEndedOutboundCall(state.sessionId).catch(() => {});
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
      finalizeCostRecord(state.callSid).catch(() => {});
      processEndedOutboundCall(state.sessionId).catch(() => {});
    }
  });
}
