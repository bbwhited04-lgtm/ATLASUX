/**
 * Audio Transcoder — converts between Twilio and Google audio formats.
 *
 * Twilio Media Streams: 8kHz, mono, mu-law (base64 encoded)
 * Google STT: 16kHz, mono, LINEAR16 (PCM signed 16-bit LE)
 * Google TTS: configurable output, we request LINEAR16 16kHz
 *
 * All conversions are deterministic. Zero tokens spent.
 */

// ── Mu-law decode table (ITU-T G.711) ────────────────────────────────────────

const MULAW_DECODE_TABLE = new Int16Array(256);
(() => {
  for (let i = 0; i < 256; i++) {
    let mu = ~i & 0xff;
    const sign = mu & 0x80;
    mu &= 0x7f;
    const exponent = (mu >> 4) & 0x07;
    const mantissa = mu & 0x0f;
    let sample = ((mantissa << 1) + 33) << (exponent + 2);
    sample -= 0x84;
    MULAW_DECODE_TABLE[i] = sign ? -sample : sample;
  }
})();

// ── Mu-law encode (LINEAR16 -> mulaw byte) ───────────────────────────────────

const MULAW_MAX = 0x1fff;
const MULAW_BIAS = 33;

function encodeMulawSample(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  sample += MULAW_BIAS;

  let exponent = 7;
  const mask = 0x4000;
  for (; exponent > 0; exponent--) {
    if (sample & (mask >> (7 - exponent))) break;
  }

  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  const encoded = ~(sign | (exponent << 4) | mantissa) & 0xff;
  return encoded;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Decode base64 mulaw (8kHz) from Twilio to LINEAR16 PCM buffer (8kHz).
 * Does NOT upsample — call upsample8to16 if feeding to Google STT.
 */
export function mulawToLinear16(base64Mulaw: string): Buffer {
  const mulaw = Buffer.from(base64Mulaw, "base64");
  const pcm = Buffer.alloc(mulaw.length * 2);

  for (let i = 0; i < mulaw.length; i++) {
    const sample = MULAW_DECODE_TABLE[mulaw[i]];
    pcm.writeInt16LE(sample, i * 2);
  }

  return pcm;
}

/**
 * Upsample 8kHz LINEAR16 to 16kHz LINEAR16 (simple linear interpolation).
 * Google STT wants 16kHz for best accuracy.
 */
export function upsample8to16(pcm8k: Buffer): Buffer {
  const sampleCount = pcm8k.length / 2;
  const pcm16k = Buffer.alloc(sampleCount * 4); // 2x samples, 2 bytes each

  for (let i = 0; i < sampleCount; i++) {
    const sample = pcm8k.readInt16LE(i * 2);
    const nextSample = i < sampleCount - 1 ? pcm8k.readInt16LE((i + 1) * 2) : sample;
    const interpolated = Math.round((sample + nextSample) / 2);

    pcm16k.writeInt16LE(sample, i * 4);
    pcm16k.writeInt16LE(interpolated, i * 4 + 2);
  }

  return pcm16k;
}

/**
 * Downsample 16kHz LINEAR16 to 8kHz (drop every other sample).
 */
export function downsample16to8(pcm16k: Buffer): Buffer {
  const sampleCount = pcm16k.length / 2;
  const pcm8k = Buffer.alloc(Math.ceil(sampleCount / 2) * 2);

  for (let i = 0; i < sampleCount; i += 2) {
    const sample = pcm16k.readInt16LE(i * 2);
    pcm8k.writeInt16LE(sample, (i / 2) * 2);
  }

  return pcm8k;
}

/**
 * Encode LINEAR16 PCM (8kHz) to mulaw buffer, then base64 for Twilio playback.
 */
export function linear16ToMulawBase64(pcm8k: Buffer): string {
  const sampleCount = pcm8k.length / 2;
  const mulaw = Buffer.alloc(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sample = pcm8k.readInt16LE(i * 2);
    mulaw[i] = encodeMulawSample(sample);
  }

  return mulaw.toString("base64");
}

/**
 * Full pipeline: Twilio base64 mulaw -> 16kHz LINEAR16 for Google STT.
 */
export function twilioToGoogleSTT(base64Mulaw: string): Buffer {
  const pcm8k = mulawToLinear16(base64Mulaw);
  return upsample8to16(pcm8k);
}

/**
 * Full pipeline: Google TTS LINEAR16 (16kHz) -> base64 mulaw for Twilio.
 */
export function googleTTSToTwilio(pcm16k: Buffer): string {
  const pcm8k = downsample16to8(pcm16k);
  return linear16ToMulawBase64(pcm8k);
}
