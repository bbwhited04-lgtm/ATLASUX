/**
 * Check what Atlas receives — email jobs, audit trail, workflow reports.
 * Usage: cd backend && npx tsx src/scripts/checkAtlasReports.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Email jobs (sent TO Atlas or FROM agents)
  const emailJobs = await prisma.job.findMany({
    where: {
      jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, status: true, createdAt: true, input: true, output: true, finishedAt: true },
  });

  console.log(`\n=== Email Jobs (${emailJobs.length} found) ===\n`);
  if (emailJobs.length === 0) {
    console.log("No email jobs found in the database.");
  }
  for (const j of emailJobs) {
    const input = j.input as any;
    const date = j.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" });
    console.log(`[${j.status}] ${date}`);
    console.log(`  To: ${input?.to ?? "?"}`);
    console.log(`  Subject: ${input?.subject ?? "?"}`);
    console.log(`  From Agent: ${input?.fromAgent ?? "?"}`);
    console.log(`  Body: ${(input?.text ?? input?.html ?? "").toString().slice(0, 200)}`);
    console.log("─".repeat(60));
  }

  // 2. Scheduler firings
  const schedulerAudits = await prisma.auditLog.findMany({
    where: { action: "SCHEDULER_JOB_FIRED" },
    orderBy: { timestamp: "desc" },
    take: 30,
    select: { action: true, message: true, timestamp: true, meta: true },
  });

  console.log(`\n=== Scheduler Firings (${schedulerAudits.length} found) ===\n`);
  if (schedulerAudits.length === 0) {
    console.log("No scheduler jobs have fired yet.");
    console.log("The scheduler worker needs to be running: npm run worker:engine");
  }
  for (const a of schedulerAudits) {
    const date = a.timestamp?.toLocaleString("en-US", { timeZone: "America/Chicago" }) ?? "?";
    console.log(`${date} | ${a.message}`);
  }

  // 3. Workflow completions
  const wfAudits = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { startsWith: "WF_" } },
        { action: { startsWith: "WORKFLOW" } },
        { action: { contains: "COMPLETED" } },
      ],
    },
    orderBy: { timestamp: "desc" },
    take: 30,
    select: { action: true, message: true, timestamp: true, level: true, meta: true },
  });

  console.log(`\n=== Workflow Audit Trail (${wfAudits.length} found) ===\n`);
  for (const a of wfAudits) {
    const date = a.timestamp?.toLocaleString("en-US", { timeZone: "America/Chicago" }) ?? "?";
    console.log(`${date} | ${a.level} | ${a.action}`);
    console.log(`  ${a.message}`);
  }

  // 4. Agent inbox events
  try {
    const inboxEvents = await (prisma as any).agent_inbox_events.findMany({
      where: { agent_id: "atlas" },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    console.log(`\n=== Atlas Agent Inbox Events (${inboxEvents.length} found) ===\n`);
    for (const e of inboxEvents) {
      const date = e.created_at.toLocaleString("en-US", { timeZone: "America/Chicago" });
      console.log(`${date} | ${e.event_type} | from: ${e.from_agent}`);
      console.log(`  ${(e.summary ?? e.payload?.subject ?? "").toString().slice(0, 200)}`);
      console.log("─".repeat(60));
    }
  } catch {
    console.log("\n=== Atlas Agent Inbox Events ===\n");
    console.log("agent_inbox_events table not found (may not be in schema yet).");
  }

  // 5. Intent queue (engine runs)
  const intents = await prisma.intent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, createdAt: true, payload: true, intentType: true },
  });

  console.log(`\n=== Recent Intents (${intents.length} found) ===\n`);
  for (const i of intents) {
    const date = i.createdAt?.toLocaleString("en-US", { timeZone: "America/Chicago" }) ?? "?";
    const payload = i.payload as any;
    console.log(`[${i.status}] ${date} | ${i.intentType}`);
    console.log(`  Agent: ${payload?.agentId ?? "?"} | WF: ${payload?.workflowId ?? "?"}`);
    console.log(`  Trace: ${payload?.traceId ?? ""}`);
    console.log("─".repeat(60));
  }

  // 6. Overall counts
  const [totalEmails, totalJobs, totalAudits, totalIntents] = await Promise.all([
    prisma.job.count({ where: { jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] } } }),
    prisma.job.count(),
    prisma.auditLog.count(),
    prisma.intent.count(),
  ]);

  console.log("\n=== Summary ===");
  console.log(`  Total email jobs: ${totalEmails}`);
  console.log(`  Total jobs: ${totalJobs}`);
  console.log(`  Total audit logs: ${totalAudits}`);
  console.log(`  Total intents: ${totalIntents}`);

  await prisma.$disconnect();
}

main().catch(console.error);
