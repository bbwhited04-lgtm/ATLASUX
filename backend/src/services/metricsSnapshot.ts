import { prisma } from "../db/prisma.js";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type MetricsSnapshotData = {
  date: string; // YYYY-MM-DD (UTC)
  window: {
    from: string;
    to: string;
  };
  jobs: {
    email: {
      queued24h: number;
      sent24h: number;
      failed24h: number;
      total: number;
    };
    total24h: number;
  };
  intents: {
    byStatus24h: Record<string, number>;
    total24h: number;
  };
  ledger: {
    netCents24h: number;
    byCategoryCents24h: Record<string, number>;
    totalEntries24h: number;
  };
  stripe: {
    productsCreated24h: number;
  };
};

export async function computeMetricsSnapshot(args: {
  tenantId: string;
  now?: Date;
}): Promise<MetricsSnapshotData> {
  const now = args.now ?? new Date();
  const to = now;
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalJobs24h,
    emailJobs24h,
    emailJobsTotal,
    intents24h,
    ledger24h,
    stripeProducts24h,
  ] = await Promise.all([
    prisma.job.count({ where: { tenantId: args.tenantId, createdAt: { gte: from, lte: to } } }),
    prisma.job.groupBy({
      by: ["status"],
      where: { tenantId: args.tenantId, jobType: "EMAIL_SEND", createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.job.count({ where: { tenantId: args.tenantId, jobType: "EMAIL_SEND" } }),
    prisma.intent.groupBy({
      by: ["status"],
      where: { tenantId: args.tenantId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { tenantId: args.tenantId, occurredAt: { gte: from, lte: to } },
      select: { entryType: true, category: true, amountCents: true },
    }),
    prisma.auditLog.count({
      where: { tenantId: args.tenantId, action: "STRIPE_PRODUCT_CREATED", createdAt: { gte: from, lte: to } },
    }),
  ]);

  const statusCount = (rows: Array<{ status: any; _count: { _all: number } }>) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[String(r.status)] = r._count._all;
      return acc;
    }, {});

  const emailStatus = statusCount(emailJobs24h as any);
  const intentsByStatus = statusCount(intents24h as any);

  const byCategory: Record<string, number> = {};
  let netCents = 0;
  for (const e of ledger24h) {
    const cents = Number(e.amountCents);
    const signed = e.entryType === "credit" ? cents : -cents;
    netCents += signed;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + signed;
  }

  return {
    date: isoDate(startOfUtcDay(now)),
    window: { from: from.toISOString(), to: to.toISOString() },
    jobs: {
      email: {
        queued24h: emailStatus["queued"] ?? 0,
        sent24h: emailStatus["succeeded"] ?? 0,
        failed24h: emailStatus["failed"] ?? 0,
        total: emailJobsTotal,
      },
      total24h: totalJobs24h,
    },
    intents: {
      byStatus24h: intentsByStatus,
      total24h: Object.values(intentsByStatus).reduce((a, b) => a + b, 0),
    },
    ledger: {
      netCents24h: netCents,
      byCategoryCents24h: byCategory,
      totalEntries24h: ledger24h.length,
    },
    stripe: {
      productsCreated24h: stripeProducts24h,
    },
  };
}

export async function upsertDailySnapshot(args: {
  tenantId: string;
  snapshot: MetricsSnapshotData;
}) {
  // Store by UTC date
  const date = new Date(args.snapshot.date + "T00:00:00.000Z");

  const saved = await prisma.metricsSnapshot.upsert({
    where: { tenantId_date: { tenantId: args.tenantId, date } },
    create: {
      tenantId: args.tenantId,
      date,
      data: args.snapshot as any,
    },
    update: {
      data: args.snapshot as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: args.tenantId,
      actorType: "system",
      level: "info",
      action: "METRICS_SNAPSHOT_UPSERTED",
      entityType: "metrics_snapshot",
      entityId: saved.id,
      message: `Metrics snapshot stored for ${args.snapshot.date}`,
      meta: { date: args.snapshot.date },
      timestamp: new Date(),
    },
  });

  return saved;
}

export async function getLatestSnapshot(tenantId: string) {
  return prisma.metricsSnapshot.findFirst({
    where: { tenantId },
    orderBy: { date: "desc" },
  });
}
