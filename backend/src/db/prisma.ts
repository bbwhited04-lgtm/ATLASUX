import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton (prevents too many clients in dev/hot reload)
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Execute a callback within a transaction that sets `app.tenant_id`
 * for PostgreSQL Row-Level Security policies.
 *
 * Usage:
 *   const rows = await withTenant(tenantId, (tx) =>
 *     tx.asset.findMany({ where: { tenantId } })
 *   );
 *
 * The SET LOCAL is scoped to the transaction and automatically
 * cleared when the transaction commits or rolls back.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(tenantId)) {
    throw new Error(`Invalid tenantId format: ${tenantId}`);
  }
  return prisma.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    return fn(tx);
  });
}
