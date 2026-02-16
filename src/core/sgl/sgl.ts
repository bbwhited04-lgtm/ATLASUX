export type SglDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type Intent = {
  tenantId: string;
  actor: { type: "ATLAS" | "SUBROUTINE" | "HUMAN"; id?: string };
  intentType: string;
  payload: any;
  dataClass?: "NONE" | "PII" | "PHI";
  spendImpactUsd?: number;
  jurisdiction?: { country?: string; state?: string };
};

export type SglResult = {
  decision: SglDecision;
  reasons: string[];
  requiresHumanApproval: boolean;
};

const BLOCK = (reasons: string[]): SglResult => ({
  decision: "BLOCK",
  reasons,
  requiresHumanApproval: false,
});

const REVIEW = (reasons: string[], requiresHumanApproval = true): SglResult => ({
  decision: "REVIEW",
  reasons,
  requiresHumanApproval,
});

const ALLOW = (): SglResult => ({
  decision: "ALLOW",
  reasons: [],
  requiresHumanApproval: false,
});

export function sglEvaluate(intent: Intent): SglResult {
  // 0) Only Atlas may execute (subroutines can draft, not act)
  if (intent.actor.type !== "ATLAS") {
    return BLOCK(["ONLY_ATLAS_EXECUTES"]);
  }

  // 1) PHI/HIPAA hard walls (keep this conservative)
  if (intent.dataClass === "PHI") {
    return REVIEW(["PHI_PRESENT_REQUIRES_LEGAL_REVIEW_AND_HUMAN_APPROVAL"], true);
  }

  // 2) Regulated actions: require human approval (even if otherwise allowed)
  const regulated = new Set([
    "GOV_FILING_IRS",
    "GOV_FILING_STATE",
    "BANK_TRANSFER",
    "CRYPTO_TRADE_EXECUTE",
    "BROKER_ORDER_EXECUTE",
  ]);
  if (regulated.has(intent.intentType)) {
    return REVIEW(["REGULATED_ACTION_REQUIRES_HUMAN_APPROVAL"], true);
  }

  // 3) High spend threshold example (tune later)
  if ((intent.spendImpactUsd ?? 0) >= 250) {
    return REVIEW(["SPEND_THRESHOLD_REQUIRES_HUMAN_APPROVAL"], true);
  }

  // 4) Default allow
  return ALLOW();
}
