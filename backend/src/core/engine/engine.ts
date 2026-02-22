import { claimNextIntent } from "./queue.js";
import { buildPackets } from "./packets.js";
import { prisma } from "../../prisma.js";
import { atlasExecuteGate } from "../exec/atlasGate.js";
import { getWorkflowHandler } from "../../workflows/registry.js";

type IntentPayload = {
  requestedBy?: unknown;
  dataClass?: unknown;
  spendUsd?: unknown;

  // workflow execution payload
  workflowId?: unknown;
  agentId?: unknown;
  input?: unknown;
  traceId?: unknown;

  [k: string]: unknown;
};

function safeObjectPayload(payload: unknown): IntentPayload {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return payload as IntentPayload;
  return {};
}

function normalizeDataClass(v: unknown): "NONE" | "PII" | "PHI" {
  return v === "NONE" || v === "PII" || v === "PHI" ? v : "NONE";
}

function normalizeSpendUsd(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

async function writeAudit(opts: {
  tenantId: string | null | undefined;
  requestedBy: string;
  level: "info" | "error" | "warn";
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  message?: string | null;
  meta?: any;
}) {
  // IMPORTANT: actorUserId MUST be null unless you are 100% sure it exists in app_users.id
  // requestedBy can be stored as actorExternalId for traceability.
  await prisma.auditLog.create({
    data: {
      tenantId: opts.tenantId ?? null,
      actorUserId: null,
      actorExternalId: opts.requestedBy,
      actorType: "system",
      level: opts.level as any,
      action: opts.action,
      entityType: opts.entityType ?? null,
      entityId: opts.entityId ?? null,
      message: opts.message ?? null,
      meta: opts.meta ?? {},
      timestamp: new Date(),
    },
  });
}

// This is the ONLY place that should ever call execution functions later.
export async function engineTick() {
  const intent = await claimNextIntent();
  if (!intent) return { ran: false };

  const payload = safeObjectPayload(intent.payload);

  // Keep this always a string (some payloads/agentId can be null/undefined)
  const requestedBy = String(
    (payload.requestedBy as any) ?? intent.agentId ?? intent.tenantId ?? "unknown",
  );

  let execOutput: any = null;

  try {
    await writeAudit({
      tenantId: intent.tenantId,
      requestedBy,
      level: "info",
      action: "ENGINE_CLAIMED_INTENT",
      entityType: "intent",
      entityId: intent.id,
      message: `Engine claimed intent ${intent.intentType}`,
    });

    await buildPackets(intent as any);

    // Gate (SGL + human-in-loop)
    const gate = await atlasExecuteGate({
      tenantId: intent.tenantId,
      // NOTE: this is NOT necessarily a DB uuid. It’s your “actor external id”.
      userId: requestedBy,
      intentType: intent.intentType ?? "unknown",
      payload: intent.payload,
      dataClass: normalizeDataClass(payload.dataClass),
      spendUsd: normalizeSpendUsd(payload.spendUsd),
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

    // Execute workflow for ENGINE_RUN intents (cloud surface)
    if (intent.intentType === "ENGINE_RUN") {
      const workflowId = String(payload.workflowId ?? "");
      const agentId = String(payload.agentId ?? "");

      const handler = getWorkflowHandler(workflowId);

      if (!handler) {
        await prisma.intent.update({
          where: { id: intent.id },
          data: { status: "FAILED" },
        });

        await writeAudit({
          tenantId: intent.tenantId,
          requestedBy,
          level: "error",
          action: "WORKFLOW_NOT_FOUND",
          entityType: "intent",
          entityId: intent.id,
          message: `No workflow handler for ${workflowId}`,
          meta: { workflowId, agentId },
        });

        return { ran: true, result: { ok: false, error: "WORKFLOW_NOT_FOUND", workflowId } };
      }

      await prisma.intent.update({
        where: { id: intent.id },
        data: { status: "VALIDATING" },
      });

      const res = await handler({
        tenantId: intent.tenantId,
        requestedBy,
        agentId,
        workflowId,
        input: (payload.input as any) ?? {},
        traceId: (payload.traceId as any) ?? null,
        intentId: intent.id,
      });

      execOutput = res;

      await writeAudit({
        tenantId: intent.tenantId,
        requestedBy,
        level: res?.ok ? "info" : "error",
        action: "WORKFLOW_COMPLETE",
        entityType: "intent",
        entityId: intent.id,
        message: `[${workflowId}] ${res?.ok ? "Completed" : "Failed"}: ${res?.message ?? ""}`,
        meta: { workflowId, agentId, ok: res?.ok ?? false, output: res?.output ?? null },
      });
    }

    await prisma.intent.update({
      where: { id: intent.id },
      data: { status: execOutput?.ok === false ? "FAILED" : "EXECUTED" },
    });

    await writeAudit({
      tenantId: intent.tenantId,
      requestedBy,
      level: "info",
      action: "ENGINE_EXECUTED_INTENT",
      entityType: "intent",
      entityId: intent.id,
      message: `Executed intent ${intent.intentType}`,
      meta: { output: execOutput ?? null },
    });

    return { ran: true, result: execOutput ?? { ok: true } };
  } catch (e: any) {
    await prisma.intent.update({
      where: { id: intent.id },
      data: { status: "FAILED" },
    });

    await writeAudit({
      tenantId: intent.tenantId,
      requestedBy,
      level: "error",
      action: "ENGINE_FAILED",
      entityType: "intent",
      entityId: intent.id,
      message: e?.message ?? "Engine failed",
      meta: {},
    });

    return { ran: true, error: e?.message ?? String(e) };
  }
}