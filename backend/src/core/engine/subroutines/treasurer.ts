import type { IntentRecord, Packet } from "../types.js";

export async function treasurerPacket(intent: IntentRecord): Promise<Packet> {
  const spend = Number(intent?.payload?.spendUsd ?? 0);
  const summary =
    spend > 0
      ? `Estimated spend impact: $${spend.toFixed(2)}`
      : "No spend impact detected";

  return {
    agent: "TREASURER",
    summary,
    data: {
      spendUsd: spend,
      recommendation: spend >= 250 ? "REVIEW" : "ALLOW",
      notes: spend >= 250 ? ["Spend threshold exceeded"] : [],
    },
  };
}

