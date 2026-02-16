import { sglEvaluate, Intent } from "../sgl/sgl";
import { hashPayload } from "../audit/audit";

export type GateOutcome =
  | { ok: true; sgl: ReturnType<typeof sglEvaluate> }
  | { ok: false; status: number; code: string; message: string; sgl: ReturnType<typeof sglEvaluate> };

export async function preExecuteGate(opts: {
  intent: Intent;
  // you wire these to your supabase db calls
  emitAudit: (event: {
    tenantId: string;
    intentType: string;
    eventType: string;
    eventData: any;
  }) => Promise<void>;
  hasValidHumanApproval: (params: {
    tenantId: string;
    intentType: string;
    payloadHash: string;
  }) => Promise<boolean>;
}): Promise<GateOutcome> {
  const { intent, emitAudit, hasValidHumanApproval } = opts;

  const sgl = sglEvaluate(intent);
  const payloadHash = hashPayload(intent.payload);

  await emitAudit({
    tenantId: intent.tenantId,
    intentType: intent.intentType,
    eventType: "SGL_EVALUATED",
    eventData: {
      decision: sgl.decision,
      reasons: sgl.reasons,
      requiresHumanApproval: sgl.requiresHumanApproval,
      payloadHash,
    },
  });

  if (sgl.decision === "BLOCK") {
    await emitAudit({
      tenantId: intent.tenantId,
      intentType: intent.intentType,
      eventType: "EXECUTION_BLOCKED",
      eventData: { reasons: sgl.reasons, payloadHash },
    });

    return {
      ok: false,
      status: 403,
      code: "SGL_BLOCK",
      message: "Action blocked by SGL.",
      sgl,
    };
  }

  if (sgl.decision === "REVIEW") {
    const approved = await hasValidHumanApproval({
      tenantId: intent.tenantId,
      intentType: intent.intentType,
      payloadHash,
    });

    if (!approved) {
      await emitAudit({
        tenantId: intent.tenantId,
        intentType: intent.intentType,
        eventType: "AWAITING_HUMAN_APPROVAL",
        eventData: { reasons: sgl.reasons, payloadHash },
      });

      return {
        ok: false,
        status: 428, // Precondition Required
        code: "HUMAN_APPROVAL_REQUIRED",
        message: "Human approval required before execution.",
        sgl,
      };
    }
  }

  return { ok: true, sgl };
}
