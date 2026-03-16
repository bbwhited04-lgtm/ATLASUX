import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const p = new PrismaClient();

const TENANT_ID = '9a8a332c-c47d-4792-a0d4-56ad4e4a3391';
const USER_ID = '466d4ceb-b4eb-402e-ae99-cae6a23296b0';
const content = fs.readFileSync('docs/kb/brand-playbook.md', 'utf8');
const title = 'Brand Playbook — Mandatory Guide for All Agents';
const slug = 'brand-playbook';

// Upsert document
const existing = await p.kbDocument.findFirst({ where: { tenantId: TENANT_ID, slug } });
let docId;

if (existing) {
  await p.kbDocument.update({ where: { id: existing.id }, data: { body: content, title, status: 'published' } });
  docId = existing.id;
  console.log('Updated KB doc:', docId);
} else {
  const doc = await p.kbDocument.create({
    data: { tenantId: TENANT_ID, title, slug, body: content, status: 'published', createdBy: USER_ID },
  });
  docId = doc.id;
  console.log('Created KB doc:', docId);
}

// Tags
const brandTag = await p.kbTag.upsert({ where: { tenantId_name: { tenantId: TENANT_ID, name: 'brand' } }, create: { tenantId: TENANT_ID, name: 'brand' }, update: {} });
const mandatoryTag = await p.kbTag.upsert({ where: { tenantId_name: { tenantId: TENANT_ID, name: 'mandatory' } }, create: { tenantId: TENANT_ID, name: 'mandatory' }, update: {} });

await p.kbTagOnDocument.upsert({ where: { documentId_tagId: { documentId: docId, tagId: brandTag.id } }, create: { documentId: docId, tagId: brandTag.id }, update: {} });
await p.kbTagOnDocument.upsert({ where: { documentId_tagId: { documentId: docId, tagId: mandatoryTag.id } }, create: { documentId: docId, tagId: mandatoryTag.id }, update: {} });

// Chunk by ## sections — matches KbChunk schema: idx, charStart, charEnd, content, sourceUpdatedAt
await p.kbChunk.deleteMany({ where: { documentId: docId } });

const sectionRegex = /^## /gm;
const sections = [];
let match;
let lastIdx = 0;
while ((match = sectionRegex.exec(content)) !== null) {
  if (lastIdx > 0) {
    sections.push({ start: lastIdx, end: match.index });
  }
  lastIdx = match.index;
}
// Push the last section
if (lastIdx > 0) {
  sections.push({ start: lastIdx, end: content.length });
}
// Also push the header (before first ##)
if (sections.length > 0 && sections[0].start > 0) {
  sections.unshift({ start: 0, end: sections[0].start });
}

const now = new Date();
const chunks = sections.map((s, i) => ({
  tenantId: TENANT_ID,
  documentId: docId,
  idx: i,
  charStart: s.start,
  charEnd: s.end,
  content: content.slice(s.start, s.end).trim(),
  sourceUpdatedAt: now,
}));

await p.kbChunk.createMany({ data: chunks });
console.log(`${chunks.length} chunks created`);
console.log('Brand Playbook is LIVE in KB [brand, mandatory]');

await p.$disconnect();
