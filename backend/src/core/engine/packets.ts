import type { IntentRecord, PacketBundle } from "./types.js";
import { runSubroutines } from "./subroutines/index.js";
import { prisma } from "../../prisma.js";

export async function buildPackets(intent: IntentRecord): Promise<PacketBundle> {
  const packets = await runSubroutines(intent);

  // Store packets (Json) if you have a table; otherwise attach to audit meta
  await prisma.auditLog.create({
    data: {
      tenantId: intent.tenantId,
      actorUserId: intent.createdBy,
      actorType: "user",
      level: "info",
      action: "PACKETS_BUILT",
      entityType: "intent",
      entityId: intent.id,
      message: `Built ${packets.length} packets`,
      meta: { packets },
      timestamp: new Date(),
    },
  });

  return { intentId: intent.id, packets };
}

