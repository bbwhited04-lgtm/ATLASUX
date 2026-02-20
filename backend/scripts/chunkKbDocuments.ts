/* eslint-disable no-console */
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

type Chunk = {
  idx: number;
  charStart: number;
  charEnd: number;
  content: string;
};

function makeChunksByChars(body: string, targetSize: number, softWindow: number): Chunk[] {
  const s = body ?? "";
  const len = s.length;
  if (len === 0) return [];

  const chunks: Chunk[] = [];
  let pos = 0;
  let idx = 0;

  while (pos < len) {
    let end = Math.min(pos + targetSize, len);

    // Try to end on a newline boundary to keep chunks readable
    if (end < len) {
      const forward = s.indexOf("\n", end);
      if (forward !== -1 && forward - end <= softWindow) {
        end = forward + 1;
      } else {
        const back = s.lastIndexOf("\n", end);
        if (back > pos + 200) {
          end = back + 1;
        }
      }
    }

    if (end <= pos) end = Math.min(pos + targetSize, len); // safety
    const content = s.slice(pos, end);

    chunks.push({
      idx,
      charStart: pos,
      charEnd: end,
      content,
    });

    idx++;
    pos = end;
  }

  return chunks;
}

async function main() {
  const tenantId = (process.env.TENANT_ID || "").trim();
  if (!tenantId) throw new Error("TENANT_ID missing in backend/.env");

  const targetSize = Number(process.env.KB_CHUNK_SIZE ?? 4000);
  const softWindow = Number(process.env.KB_CHUNK_SOFT_WINDOW ?? 600);

  console.log("Chunking KB documents for tenant:", tenantId);
  console.log("Chunk size (chars):", targetSize, "softWindow:", softWindow);

  const docs = await prisma.kbDocument.findMany({
    where: { tenantId },
    select: { id: true, title: true, slug: true, body: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });

  let totalChunks = 0;
  let processed = 0;

  for (const doc of docs) {
    const body = doc.body ?? "";
    // Skip tiny docs
    if (body.length <= targetSize) continue;

    // If chunks exist and are fresh, skip
    const existing = await prisma.kbChunk.findFirst({
      where: { documentId: doc.id },
      select: { sourceUpdatedAt: true },
      orderBy: { idx: "asc" },
    });

    if (existing && existing.sourceUpdatedAt.getTime() === doc.updatedAt.getTime()) {
      continue;
    }

    const chunks = makeChunksByChars(body, targetSize, softWindow);

    await prisma.$transaction(async (tx) => {
      await tx.kbChunk.deleteMany({ where: { documentId: doc.id } });
      if (chunks.length > 0) {
        await tx.kbChunk.createMany({
          data: chunks.map((c) => ({
            tenantId,
            documentId: doc.id,
            idx: c.idx,
            charStart: c.charStart,
            charEnd: c.charEnd,
            content: c.content,
            sourceUpdatedAt: doc.updatedAt,
          })),
        });
      }
    });

    processed++;
    totalChunks += chunks.length;
    console.log(`✅ Chunked: ${doc.title} (${doc.slug}) -> ${chunks.length} chunks`);
  }

  console.log(`Done. Processed ${processed} docs. Total chunks written: ${totalChunks}.`);
}

main()
  .catch((e) => {
    console.error("❌ Chunking failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
