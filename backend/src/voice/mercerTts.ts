/**
 * Mercer TTS — male voice synthesis via Google Cloud TTS.
 *
 * Voice: en-US-Neural2-J (male, professional, confident)
 * Output: LINEAR16 PCM at 16kHz for Twilio pipeline.
 */

import { readFileSync } from "fs";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

let ttsClient: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (!ttsClient) {
    const inlineJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT || "";
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    if (inlineJson) {
      const creds = JSON.parse(inlineJson);
      ttsClient = new TextToSpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else if (keyFile) {
      const creds = JSON.parse(readFileSync(keyFile, "utf8"));
      ttsClient = new TextToSpeechClient({
        projectId: creds.project_id,
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
      });
    } else {
      ttsClient = new TextToSpeechClient();
    }
  }
  return ttsClient;
}

export async function synthesizeMercerSpeech(text: string): Promise<Buffer | null> {
  if (!text?.trim()) return null;

  try {
    const client = getClient();
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: process.env.MERCER_VOICE_NAME || "en-US-Neural2-J",
      },
      audioConfig: {
        audioEncoding: "LINEAR16" as any,
        sampleRateHertz: 16000,
        speakingRate: Number(process.env.MERCER_VOICE_SPEAKING_RATE || "1.0"),
      },
    });

    return response.audioContent ? Buffer.from(response.audioContent as Uint8Array) : null;
  } catch (err: any) {
    console.error("[mercer-tts] Synthesis failed:", err?.message);
    return null;
  }
}
