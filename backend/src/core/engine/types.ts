export type EngineStatus =
  | "DRAFT"
  | "VALIDATING"
  | "BLOCKED_SGL"
  | "REVIEW_REQUIRED"
  | "AWAITING_HUMAN"
  | "APPROVED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED";

export type IntentRecord = {
  id: string;
  tenantId: string;
  createdBy: string;          // userId
  intentType: string;         // e.g. "SHOPIFY_PRODUCT_CREATE"
  payload: any;
  status: EngineStatus;
  sglDecision?: "ALLOW" | "REVIEW" | "BLOCK";
  sglReasons?: string[];
  createdAt: Date;
};

export type Packet = {
  agent: "BINKY" | "TREASURER" | "SECRETARY" | "JENNY" | "BENNY";
  summary: string;
  data: any;
};

export type PacketBundle = {
  intentId: string;
  packets: Packet[];
};

