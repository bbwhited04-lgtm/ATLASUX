import { createHash } from "node:crypto";
import { prisma } from "../db/prisma.js";

// In-memory cache of latest hash per tenant (avoids DB read on every insert)
const latestHash = new Map<string, string>();

const GENESIS_HASH = "0".repeat(64); // SHA-256 of nothing — chain anchor

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Compute and return the hash chain fields for a new audit log entry.
 * Call this BEFORE inserting the row.
 */
export async function computeAuditHash(args: {
  tenantId: string | null;
  action: string;
  entityId: string | null;
  timestamp: Date;
  actorUserId: string | null;
}): Promise<{ prevHash: string; recordHash: string }> {
  const key = args.tenantId ?? "__global__";

  // Try cache first, fall back to DB
  let prevHash = latestHash.get(key);
  if (!prevHash) {
    const latest = await prisma.auditLog.findFirst({
      where: { tenantId: args.tenantId ?? undefined, recordHash: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { recordHash: true },
    });
    prevHash = latest?.recordHash ?? GENESIS_HASH;
  }

  const payload = [
    prevHash,
    args.tenantId ?? "",
    args.action,
    args.entityId ?? "",
    args.timestamp.toISOString(),
    args.actorUserId ?? "",
  ].join("|");

  const recordHash = sha256(payload);

  // Update cache
  latestHash.set(key, recordHash);

  return { prevHash, recordHash };
}

/**
 * Verify the hash chain for a tenant. Returns broken links.
 */
export async function verifyAuditChain(tenantId: string): Promise<{
  total: number;
  verified: number;
  broken: Array<{ id: string; expected: string; actual: string; createdAt: Date }>;
}> {
  const rows = await prisma.auditLog.findMany({
    where: { tenantId, recordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      tenantId: true,
      action: true,
      entityId: true,
      createdAt: true,
      timestamp: true,
      actorUserId: true,
      prevHash: true,
      recordHash: true,
    },
  });

  const broken: Array<{ id: string; expected: string; actual: string; createdAt: Date }> = [];
  let lastHash = GENESIS_HASH;

  for (const row of rows) {
    if ((row as any).prevHash !== lastHash) {
      broken.push({
        id: row.id,
        expected: lastHash,
        actual: (row as any).prevHash ?? "null",
        createdAt: row.createdAt,
      });
    }

    const ts = (row as any).timestamp ?? row.createdAt;
    const payload = [
      (row as any).prevHash ?? "",
      row.tenantId ?? "",
      row.action,
      row.entityId ?? "",
      (ts instanceof Date ? ts : new Date(ts)).toISOString(),
      row.actorUserId ?? "",
    ].join("|");
    const expected = sha256(payload);

    if ((row as any).recordHash !== expected) {
      broken.push({
        id: row.id,
        expected,
        actual: (row as any).recordHash ?? "null",
        createdAt: row.createdAt,
      });
    }

    lastHash = (row as any).recordHash ?? lastHash;
  }

  return { total: rows.length, verified: rows.length - broken.length, broken };
}
