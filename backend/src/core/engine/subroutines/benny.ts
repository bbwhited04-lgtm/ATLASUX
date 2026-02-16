import type { IntentRecord, Packet } from "../types.js";

export async function bennyPacket(intent: IntentRecord): Promise<Packet> {
  const intentType = intent.intentType || "UNKNOWN";
  return {
    agent: "BENNY",
    summary: `Safety packet for ${intentType}.`,
    data: {
      policy: "TRUTH_AT_ALL_TIMES",
      notes: ["No execution happens in subroutines; advisory only."],
    },
  };
}
