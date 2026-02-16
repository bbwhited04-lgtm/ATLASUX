import { prisma } from "../../db/prisma.js";
import { sglEvaluate } from "../sgl.js";
import crypto from "crypto";

function hashPayload(payload: any) {
  return crypto.createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}

export async function atlasExecuteGate(params: {
  tenantId: string;
  userId: string;
  intentType: string;
  payload: any;
  dataClass?: "NONE" | "PII" | "PHI";
  spendUsd?: number;
}) {
  const intent = {
    tenantId: params.tenantId,
    actor: "ATLAS" as const,
    type: params.intentType,
    payload: params.payload,
    dataClass: params.dataClass ?? "NONE",
    spendUsd: params.spendUsd ?? 0,
  };

  const sgl = sglEvaluate(intent);
  const payloadHash = hashPayload(params.payload);

  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorUserId: params.userId,
      actorType: "user",
      level: sgl.decision === "BLOCK" ? "security" : sgl.decision === "REVIEW" ? "warn" : "info",
      action: "SGL_EVALUATED",
      entityType: "intent",
      entityId: null,
      message: `SGL ${sgl.decision} for ${params.intentType}`,
      meta: { sgl, intentType: params.intentType, payloadHash },
      timestamp: new Date(),
    },
  });

  if (sgl.decision === "BLOCK") return { ok: false as const, status: 403, code: "SGL_BLOCK", reasons: sgl.reasons };
  if (sgl.decision === "REVIEW") return { ok: false as const, status: 428, code: "HUMAN_APPROVAL_REQUIRED", reasons: sgl.reasons };

  return { ok: true as const };
}
