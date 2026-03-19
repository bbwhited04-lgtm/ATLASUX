/**
 * Background worker: Treatment Pipeline
 *
 * Polls the treatments table every TREATMENT_POLL_MS (default 5000)
 * for treatments in active states and advances them through the pipeline.
 *
 * PM2-managed alongside the engine loop.
 */

import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { processTreatmentTick } from "../services/treatment/orchestrator.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const ACTIVE_STATUSES = [
  "queued",
  "downloading",
  "transcribing",
  "detecting",
  "scoring",
  "awaiting_approval",
  "extracting",
  "treating",
  "formatting",
  "awaiting_publish",
  "delivering",
];

async function main() {
  const pollMs = Math.max(1000, Number(process.env.TREATMENT_POLL_MS ?? 5000));

  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  process.stdout.write(`[treatmentWorker] started (poll every ${pollMs}ms)\n`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stopping) {
      process.stdout.write("[treatmentWorker] stopping\n");
      process.exit(0);
    }

    try {
      const treatments = await prisma.treatment.findMany({
        where: { status: { in: ACTIVE_STATUSES as any } },
        orderBy: { createdAt: "asc" },
        take: 3,
      });

      for (const t of treatments) {
        try {
          await processTreatmentTick(t.id);
        } catch (err: any) {
          process.stderr.write(`[treatmentWorker] tick error for ${t.id}: ${err?.message ?? err}\n`);
          await prisma.treatment.update({
            where: { id: t.id },
            data: { status: "failed" as any, error: err?.message ?? String(err) },
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      process.stderr.write(`[treatmentWorker] poll error: ${err?.message ?? err}\n`);
    }

    await sleep(pollMs);
  }
}

main().catch((e) => {
  process.stderr.write(`[treatmentWorker] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
