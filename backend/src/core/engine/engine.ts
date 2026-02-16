import { claimNextIntent } from "./queue.js";
import { buildPackets } from "./packets.js";
import { prisma } from "../../prisma.js";
import { atlasExecuteGate } from "../exec/atlasGate.js";

// This is the ONLY place that should ever call execution functions later.
export async function engineTick() {
  const intent = await claimNextIntent();
  if (!intent) return { ran: false };

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: intent.createdBy,
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
      userId: intent.createdBy,
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

    // If we get here, execution is permitted (for now we just mark executed)
    await prisma.intent.update({
      where: { id: intent.id },
      data: { status: "EXECUTED" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: intent.createdBy,
        actorType: "user",
        level: "info",
        action: "ENGINE_EXECUTED_INTENT",
        entityType: "intent",
        entityId: intent.id,
        message: `Executed intent ${intent.intentType}`,
        meta: {},
        timestamp: new Date(),
      },
    });

    return { ran: true, result: { ok: true } };
  } catch (e: any) {
    await prisma.intent.update({
      where: { id: intent.id },
      data: { status: "FAILED" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: intent.tenantId,
        actorUserId: intent.createdBy,
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

