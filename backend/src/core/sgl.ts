export type SglDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type Intent = {
  tenantId: string;
  actor: "ATLAS";
  type: string;          // e.g. "CHAT_CALL", "PHONE_PROVISION", "CRYPTO_TRADE_EXECUTE"
  payload: any;
  dataClass?: "NONE" | "PII" | "PHI";
  spendUsd?: number;
};

export function sglEvaluate(intent: Intent): { decision: SglDecision; reasons: string[]; needsHuman: boolean } {
  // Single executor rule (enforced by design: actor must be ATLAS)
  if (intent.actor !== "ATLAS") return { decision: "BLOCK", reasons: ["ONLY_ATLAS_EXECUTES"], needsHuman: false };

  // Regulated / high-risk examples
  const regulated = new Set(["GOV_FILING_IRS", "BANK_TRANSFER", "CRYPTO_TRADE_EXECUTE"]);
  if (regulated.has(intent.type)) return { decision: "REVIEW", reasons: ["REGULATED_ACTION"], needsHuman: true };

  if (intent.type === "BROWSER_TASK") return { decision: "REVIEW", reasons: ["BROWSER_AUTOMATION"], needsHuman: true };

  if (intent.dataClass === "PHI") return { decision: "REVIEW", reasons: ["PHI_PRESENT"], needsHuman: true };

  if ((intent.spendUsd ?? 0) >= 250) return { decision: "REVIEW", reasons: ["SPEND_THRESHOLD"], needsHuman: true };

  return { decision: "ALLOW", reasons: [], needsHuman: false };
}
