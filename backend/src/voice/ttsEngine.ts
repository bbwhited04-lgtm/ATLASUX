/**
 * TTS Engine — text-to-speech via Gemini 2.5 Flash TTS.
 *
 * Voices:
 *   Lucy  → Gacrux (female, warm, professional)
 *   Atlas → Enceladus (male, authoritative)
 *
 * Returns LINEAR16 PCM at 16kHz for downstream processing.
 * Falls back to Google Cloud TTS if Gemini is unavailable.
 */

import { readFileSync } from "fs";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { VOICE_CONFIG } from "./lucyBrain.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TTS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// Fallback Google Cloud TTS client
let cloudTtsClient: TextToSpeechClient | null = null;
function getCloudTtsClient(): TextToSpeechClient {
  if (!cloudTtsClient) {
    const inlineJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT || "";
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    if (inlineJson) {
      const creds = JSON.parse(inlineJson);
      cloudTtsClient = new TextToSpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else if (keyFile) {
      const creds = JSON.parse(readFileSync(keyFile, "utf8"));
      cloudTtsClient = new TextToSpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else {
      cloudTtsClient = new TextToSpeechClient();
    }
  }
  return cloudTtsClient;
}

// ── Gemini 2.5 Flash TTS ─────────────────────────────────────────────────────

export async function synthesizeSpeech(
  text: string,
  agent: "lucy" | "atlas" = "lucy",
): Promise<Buffer | null> {
  if (!text?.trim()) return null;

  const voiceName = agent === "atlas"
    ? (process.env.ATLAS_VOICE_NAME || VOICE_CONFIG.atlas.voiceName)
    : (process.env.LUCY_VOICE_NAME || VOICE_CONFIG.lucy.voiceName);

  // Use Google Cloud TTS for now (clean 16kHz output, no resampling needed)
  // Gemini TTS can be re-enabled once 24kHz→16kHz resampling is validated
  return cloudTTS(text, agent);
}

async function geminiTTS(text: string, voiceName: string): Promise<Buffer | null> {
  const body = {
    contents: [
      {
        parts: [{ text }],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(`${GEMINI_TTS_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini TTS HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as any;

  // Extract audio from response
  const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("No audio data in Gemini TTS response");
  }

  // Gemini returns base64-encoded audio (PCM LINEAR16 at 24kHz by default)
  const rawBuffer = Buffer.from(audioData, "base64");

  // Resample from 24kHz to 16kHz for our pipeline
  return resample24to16(rawBuffer);
}

// ── Fallback: Google Cloud TTS ────────────────────────────────────────────────

async function cloudTTS(text: string, agent: "lucy" | "atlas"): Promise<Buffer | null> {
  try {
    const client = getCloudTtsClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: agent === "atlas" ? "en-US-Neural2-J" : "en-US-Neural2-F",
      },
      audioConfig: {
        audioEncoding: "LINEAR16" as any,
        sampleRateHertz: 16000,
      },
    });

    return response.audioContent ? Buffer.from(response.audioContent as Uint8Array) : null;
  } catch (err: any) {
    console.error("[tts] Cloud TTS also failed:", err?.message);
    return null;
  }
}

// ── Audio Resampling ──────────────────────────────────────────────────────────

function resample24to16(pcm24k: Buffer): Buffer {
  // 24kHz -> 16kHz = keep 2 out of every 3 samples
  const sampleCount = pcm24k.length / 2;
  const outSamples = Math.floor(sampleCount * 2 / 3);
  const pcm16k = Buffer.alloc(outSamples * 2);

  let outIdx = 0;
  for (let i = 0; i < sampleCount && outIdx < outSamples; i++) {
    // Simple decimation: for every 3 input samples, output 2
    const phase = i % 3;
    if (phase < 2) {
      const sample = pcm24k.readInt16LE(i * 2);
      pcm16k.writeInt16LE(sample, outIdx * 2);
      outIdx++;
    }
  }

  return pcm16k;
}
