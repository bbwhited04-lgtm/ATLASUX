export type SglDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type Intent = {
  tenantId: string;
  actor: "ATLAS";
  type: string;
  payload: any;
  dataClass?: "NONE" | "PII" | "PHI";
  spendUsd?: number;
};

export function sglEvaluate(intent: Intent): { decision: SglDecision; reasons: string[]; needsHuman: boolean } {
  if (intent.actor !== "ATLAS") return { decision: "BLOCK", reasons: ["ONLY_ATLAS_EXECUTES"], needsHuman: false };

  // For now: chat is allowed unless PHI is explicitly declared (we can add PHI detection later)
  if (intent.dataClass === "PHI") return { decision: "REVIEW", reasons: ["PHI_PRESENT_REQUIRES_REVIEW"], needsHuman: true };

  // Future regulated intent types get REVIEW automatically
  const regulated = new Set(["GOV_FILING_IRS", "BANK_TRANSFER", "CRYPTO_TRADE_EXECUTE"]);
  if (regulated.has(intent.type)) return { decision: "REVIEW", reasons: ["REGULATED_ACTION"], needsHuman: true };

  return { decision: "ALLOW", reasons: [], needsHuman: false };
}
