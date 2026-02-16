import { prisma } from "../../prisma.js";

export async function claimNextIntent() {
  // Simple polling queue: pick oldest DRAFT and flip to VALIDATING atomically-ish
  // For v1, acceptable. Later you can do SKIP LOCKED with raw SQL.
  const next = await prisma.intent.findFirst({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
  });

  if (!next) return null;

  return prisma.intent.update({
    where: { id: next.id },
    data: { status: "VALIDATING" },
  });
}

