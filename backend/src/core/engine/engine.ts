import { claimNextIntent } from "./queue.js";
import { buildPackets } from "./packets.js";
import { prisma } from "../../prisma.js";
import { atlasExecuteGate } from "../exec/atlasGate.js";
import { getWorkflowHandler } from "../../workflows/registry.js";

// This is the ONLY place that should ever call execution functions later.
export async function engineTick() {
  const intent = await claimNextIntent();
  if (!intent) return { ran: false };

  const requestedBy =
    (intent.payload && typeof intent.payload === "object" && !Array.isArray(intent.payload)
      ? (intent.payload as any).requestedBy
      : null) ??
    intent.agentId ??
    intent.tenantId;

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: requestedBy,
        actorType: "user",
        level: "info",
        action: "ENGINE_CLAIMED_INTENT",
        entityType: "intent",
        entityId: intent.id,
        message: `Engine claimed intent ${intent.intentType}`,
        meta: {},
        timestamp: new Date(),
      },
    });

    await buildPackets(intent as any);
    type IntentPayload = {
      dataClass?: string;
      spendUsd?: number;
      [k: string]: unknown;
    };

    const payload: IntentPayload =
      intent.payload &&
      typeof intent.payload === "object" &&
      !Array.isArray(intent.payload)
        ? (intent.payload as IntentPayload)
        : {};

    // Gate (SGL + human-in-loop)
    const gate = await atlasExecuteGate({
      tenantId: intent.tenantId,
      userId: requestedBy,
      intentType: intent.intentType,
      payload: intent.payload,
      dataClass:
      (payload.dataClass === "NONE" || payload.dataClass === "PII" || payload.dataClass === "PHI"
        ? payload.dataClass
        : "NONE"),
      spendUsd: (typeof payload.spendUsd === "number" ? payload.spendUsd : 0),
    });

    if (!gate.ok) {
      await prisma.intent.update({
        where: { id: intent.id },
        data: {
          status: gate.code === "HUMAN_APPROVAL_REQUIRED" ? "AWAITING_HUMAN" : "BLOCKED_SGL",
          sglResult: gate.code,
        },
      });
      return { ran: true, result: gate };
    }

    // If we get here, execution is permitted.
// Execute workflow for ENGINE_RUN intents (cloud surface)
let execOutput: any = null;
if (intent.intentType === "ENGINE_RUN") {
  const p: any = payload;
  const workflowId = String(p.workflowId ?? "");
  const agentId = String(p.agentId ?? "");
  const handler = getWorkflowHandler(workflowId);
  if (!handler) {
    await prisma.intent.update({ where: { id: intent.id }, data: { status: "FAILED" } });
    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: requestedBy,
        actorType: "user",
        level: "error",
        action: "WORKFLOW_NOT_FOUND",
        entityType: "intent",
        entityId: intent.id,
        message: `No workflow handler for ${workflowId}`,
        meta: { workflowId, agentId },
        timestamp: new Date(),
      },
    });
    return { ran: true, result: { ok: false, error: "WORKFLOW_NOT_FOUND", workflowId } };
  }

  await prisma.intent.update({ where: { id: intent.id }, data: { status: "VALIDATING" } });

  const res = await handler({
    tenantId: intent.tenantId,
    requestedBy,
    agentId,
    workflowId,
    input: p.input ?? {},
    traceId: p.traceId ?? null,
    intentId: intent.id,
  });

  execOutput = res;

  await prisma.auditLog.create({
    data: {
      tenantId: intent.tenantId,
      actorUserId: requestedBy,
      actorType: "user",
      level: res.ok ? "info" : "error",
      action: "WORKFLOW_COMPLETE",
      entityType: "intent",
      entityId: intent.id,
      message: `[${workflowId}] ${res.ok ? "Completed" : "Failed"}: ${res.message ?? ""}`,
      meta: { workflowId, agentId, ok: res.ok, output: res.output ?? null },
      timestamp: new Date(),
    },
  });
}

await prisma.intent.update({
  where: { id: intent.id },
  data: { status: execOutput?.ok === false ? "FAILED" : "EXECUTED" },
});

await prisma.auditLog.create({
  data: {
    tenantId: intent.tenantId,
    actorUserId: requestedBy,
    actorType: "user",
    level: "info",
    action: "ENGINE_EXECUTED_INTENT",
    entityType: "intent",
    entityId: intent.id,
    message: `Executed intent ${intent.intentType}`,
    meta: { output: execOutput ?? null },
    timestamp: new Date(),
  },
});

return { ran: true, result: execOutput ?? { ok: true } };

  } catch (e: any) {
    await prisma.intent.update({
      where: { id: intent.id },
      data: { status: "FAILED" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: requestedBy,
        actorType: "user",
        level: "error",
        action: "ENGINE_FAILED",
        entityType: "intent",
        entityId: intent.id,
        message: e?.message ?? "Engine failed",
        meta: {},
        timestamp: new Date(),
      },
    });

    return { ran: true, error: e?.message ?? String(e) };
  }
}

