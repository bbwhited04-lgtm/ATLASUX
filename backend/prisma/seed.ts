// backend/prisma/seed.ts
/* eslint-disable no-console */
import { PrismaClient, KbDocumentStatus } from "@prisma/client";

const prisma = new PrismaClient();

type SeedDoc = {
  title: string;
  slug: string;
  body: string;
  // optional override per doc if you want
  status?: KbDocumentStatus;
};

async function resolveTenantId(): Promise<string> {
  const tenantId = process.env.TENANT_ID?.trim();
  if (!tenantId) throw new Error("TENANT_ID missing in backend/.env");
  return tenantId;
}

async function resolveCreatedByUuid(): Promise<string> {
  // Must be a UUID, because schema says @db.Uuid
  const createdBy = process.env.SEED_CREATED_BY?.trim();
  if (createdBy) return createdBy;

  // Fallback: use the tenantId itself (UUID) as the actor.
  // This is not semantically perfect, but it unblocks seeding without needing a user table lookup.
  // Replace later with a real user id once your auth/user table is wired.
  const tenantId = await resolveTenantId();
  console.warn("SEED_CREATED_BY missing; falling back to TENANT_ID as createdBy UUID (temporary).");
  return tenantId;
}

function pickDefaultStatus(): KbDocumentStatus {
  // Your schema default is `draft` (lowercase), so this exists.
  return KbDocumentStatus.draft;
}

async function upsertKbDocs(opts: {
  tenantId: string;
  createdBy: string;
  docs: SeedDoc[];
}) {
  const { tenantId, createdBy, docs } = opts;

  for (const doc of docs) {
    const status = doc.status ?? pickDefaultStatus();

    await prisma.kbDocument.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: doc.slug,
        },
      },
      update: {
        title: doc.title,
        body: doc.body,
        // keep status stable unless you want seeds to enforce it:
        // status,
        updatedBy: createdBy,
      },
      create: {
        tenantId,
        title: doc.title,
        slug: doc.slug,
        body: doc.body,
        status,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }
}

async function main() {
  const tenantId = await resolveTenantId();
  const createdBy = await resolveCreatedByUuid();

  console.log("KB seed context:", { tenantId, createdBy });

  const docs: SeedDoc[] = [
    {
      title: "ATLAS Policy — Command & Governance",
      slug: "atlas-policy-command-governance",
      body: [
        "# ATLAS Policy — Command & Governance",
        "",
        "## North Star",
        "- Truth at all times.",
        "- No drift.",
        "- No untracked spend.",
        "",
        "## Authority Chain",
        "Atlas → Executive Team → Sub Agents",
        "",
        "## Hard Rules",
        "- If ledger write fails → graceful halt / degrade safely.",
        "- Every privileged action must produce an audit entry.",
        "- Every tool call must be traceable.",
      ].join("\n"),
    },
    {
      title: "SOUL LOCK — Truth Compliance",
      slug: "soul-lock-truth-compliance",
      body: [
        "# SOUL LOCK — Truth Compliance",
        "",
        "## Immutable Rules",
        "- Truth at all times; no lies, no gimmicks.",
        "- If uncertain, label it uncertain—do not present as fact.",
        "",
        "## Citations",
        "- Non-obvious claims require source + date + org name.",
        "",
        "## Failure Mode",
        "- If audit trail cannot be written, stop and report why.",
      ].join("\n"),
    },
    {
      title: "Audit Rules — Ledger Requirements",
      slug: "audit-rules-ledger-requirements",
      body: [
        "# Audit Rules — Ledger Requirements",
        "",
        "## Required Fields (minimum)",
        "- tenant",
        "- actor (agent/user)",
        "- action",
        "- target (resource/context)",
        "- timestamp (UTC)",
        "- cost estimate + actual (if available)",
        "- outcome (success/fail) + error details",
        "",
        "## Enforcement",
        "- No privileged action without an audit entry.",
        "- Ledger failure triggers a graceful halt for privileged actions.",
      ].join("\n"),
    },
    {
      title: "Agent Communications — Protocol",
      slug: "agent-comms-protocol",
      body: [
        "# Agent Communications — Protocol",
        "",
        "## Pattern",
        "- Atlas delegates → sub-agent produces report → Atlas consolidates.",
        "",
        "## Traceability",
        "- Critical actions must be logged and/or emailed.",
        "",
        "## Escalation",
        "- CTO/CFO/CLO/Auditor review and approve changes per policy gates.",
        "",
        "## Daily Intel",
        "- Daily-Intel is the shared source-of-truth feed other agents reference.",
      ].join("\n"),
    },
    {
      title: "KB Usage — How the Team Builds Knowledge",
      slug: "kb-usage-how-to-build",
      body: [
        "# KB Usage — How the Team Builds Knowledge",
        "",
        "## Purpose",
        "A single tenant-scoped KB for policies, playbooks, rules, and procedures.",
        "",
        "## Versioning",
        "- Update documents instead of duplicating.",
        "- Keep slugs stable; titles can evolve.",
        "",
        "## Governance",
        "- Exec roles can author/edit; others read-only until expanded.",
      ].join("\n"),
    },
  ];

  await upsertKbDocs({ tenantId, createdBy, docs });

  console.log("✅ KB seed complete");
}

main()
  .catch((e) => {
    console.error("❌ KB seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
