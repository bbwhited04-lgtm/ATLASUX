import type { IntentRecord, Packet } from "../types.js";

export async function jennyPacket(intent: IntentRecord): Promise<Packet> {
  const intentType = intent.intentType || "UNKNOWN";
  return {
    agent: "JENNY",
    summary: `UX/comms packet for ${intentType}.`,
    data: {
      uiCopyHint: "Keep confirmations short and explicit (what happened, when, and next step).",
      toast: "Done.",
    },
  };
}
