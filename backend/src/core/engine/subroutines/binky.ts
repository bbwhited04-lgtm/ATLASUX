import type { IntentRecord, Packet } from "../types.js";

export async function binkyPacket(intent: IntentRecord): Promise<Packet> {
  const intentType = intent.intentType || "UNKNOWN";
  const hasSources = Array.isArray(intent?.payload?.sources) && intent.payload.sources.length > 0;

  return {
    agent: "BINKY",
    summary: hasSources
      ? `Research packet ready for ${intentType} (sources provided).`
      : `Research packet for ${intentType}: no sources attached yet.`,
    data: {
      intentType,
      sources: intent?.payload?.sources ?? [],
      recommendation: hasSources ? "ALLOW" : "REVIEW",
      notes: hasSources ? [] : ["Attach sources/citations for BINKY research packet."],
    },
  };
}
