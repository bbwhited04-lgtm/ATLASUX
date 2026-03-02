/**
 * seedComplianceDocs.ts
 *
 * Seeds all compliance policy documents and implementation plans
 * into the KB (kb_documents table) in Supabase for the Dead App Corp tenant.
 *
 * Usage: cd backend && npx tsx scripts/seedComplianceDocs.ts
 */

import { PrismaClient, KbDocumentStatus } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391"; // Dead App Corp
const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";

interface DocEntry {
  file: string;
  title: string;
  slug: string;
  tag: string;
}

const POLICY_DIR = path.resolve(__dirname, "../../policies");
const PLANS_DIR = path.resolve(__dirname, "../../docs/plans");

const docs: DocEntry[] = [
  // ── Policy documents ──
  { file: `${POLICY_DIR}/COMPLIANCE_INDEX.md`, title: "Compliance Framework Index", slug: "compliance-index", tag: "compliance" },
  { file: `${POLICY_DIR}/SOC2_COMPLIANCE.md`, title: "SOC 2 Type II Compliance", slug: "soc2-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/ISO27001_COMPLIANCE.md`, title: "ISO 27001:2022 Compliance", slug: "iso27001-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/HIPAA_COMPLIANCE.md`, title: "HIPAA Compliance", slug: "hipaa-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/PCI_DSS_COMPLIANCE.md`, title: "PCI DSS v4.0 Compliance", slug: "pci-dss-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/NIST_800_53_COMPLIANCE.md`, title: "NIST 800-53 Rev 5 Compliance", slug: "nist-800-53-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/GDPR_COMPLIANCE.md`, title: "GDPR Compliance", slug: "gdpr-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/HITRUST_CSF_COMPLIANCE.md`, title: "HITRUST CSF v11 Compliance", slug: "hitrust-csf-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/FISMA_NIST_COMPLIANCE.md`, title: "FISMA/NIST Compliance", slug: "fisma-nist-compliance", tag: "compliance" },
  { file: `${POLICY_DIR}/DPIA.md`, title: "Data Protection Impact Assessment (DPIA)", slug: "dpia", tag: "compliance" },
  { file: `${POLICY_DIR}/BAA_TEMPLATE.md`, title: "HIPAA Business Associate Agreement Template", slug: "baa-template", tag: "compliance" },
  { file: `${POLICY_DIR}/ISMS_SCOPE.md`, title: "ISO 27001 ISMS Scope Document", slug: "isms-scope", tag: "compliance" },
  { file: `${POLICY_DIR}/DATA_RETENTION.md`, title: "Data Retention Policy", slug: "data-retention-policy", tag: "policy" },
  { file: `${POLICY_DIR}/INCIDENT_RESPONSE.md`, title: "Incident Response Procedures", slug: "incident-response", tag: "policy" },
  { file: `${POLICY_DIR}/RISK_MANAGEMENT.md`, title: "Risk Management Framework", slug: "risk-management", tag: "policy" },
  { file: `${POLICY_DIR}/VENDOR_MANAGEMENT.md`, title: "Third-Party Vendor Management", slug: "vendor-management", tag: "policy" },
  { file: `${POLICY_DIR}/SGL.md`, title: "Statutory Guardrail Layer (SGL)", slug: "sgl-statutory-guardrail-layer", tag: "policy" },
  { file: `${POLICY_DIR}/EXECUTION_CONSTITUTION.md`, title: "Execution Constitution", slug: "execution-constitution", tag: "policy" },

  // ── Implementation plans ──
  { file: `${PLANS_DIR}/2026-03-03-compliance-hardening-design.md`, title: "Compliance Hardening — Design Doc", slug: "compliance-hardening-design", tag: "plan" },
  { file: `${PLANS_DIR}/2026-03-03-compliance-hardening-plan.md`, title: "Compliance Hardening — Implementation Plan", slug: "compliance-hardening-plan", tag: "plan" },
  { file: `${PLANS_DIR}/2026-03-01-rls-enforcement-design.md`, title: "RLS Enforcement — Design Doc", slug: "rls-enforcement-design", tag: "plan" },
  { file: `${PLANS_DIR}/2026-03-01-rls-enforcement-plan.md`, title: "RLS Enforcement — Implementation Plan", slug: "rls-enforcement-plan", tag: "plan" },
];

async function main() {
  console.log(`Seeding ${docs.length} compliance docs into tenant ${TENANT_ID}...\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    // Read file
    if (!fs.existsSync(doc.file)) {
      console.log(`  SKIP  ${doc.slug} — file not found: ${doc.file}`);
      skipped++;
      continue;
    }

    const body = fs.readFileSync(doc.file, "utf-8");

    // Upsert the KB tag
    const tag = await prisma.kbTag.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: doc.tag } },
      create: { tenantId: TENANT_ID, name: doc.tag },
      update: {},
    });

    // Check if doc already exists
    const existing = await prisma.kbDocument.findUnique({
      where: { tenantId_slug: { tenantId: TENANT_ID, slug: doc.slug } },
    });

    if (existing) {
      // Update body if content changed
      if (existing.body !== body) {
        await prisma.kbDocument.update({
          where: { id: existing.id },
          data: { body, title: doc.title, status: KbDocumentStatus.published },
        });
        console.log(`  UPDATE  ${doc.slug}`);
        updated++;
      } else {
        console.log(`  EXISTS  ${doc.slug} (unchanged)`);
        skipped++;
      }
    } else {
      // Create new document
      const newDoc = await prisma.kbDocument.create({
        data: {
          tenantId: TENANT_ID,
          title: doc.title,
          slug: doc.slug,
          body,
          status: KbDocumentStatus.published,
          createdBy: SYSTEM_ACTOR,
        },
      });

      // Link tag
      await prisma.kbTagOnDocument.create({
        data: { documentId: newDoc.id, tagId: tag.id },
      });

      console.log(`  CREATE  ${doc.slug}`);
      created++;
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
