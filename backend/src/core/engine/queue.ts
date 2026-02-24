import { prisma } from "../../prisma.js";

export async function claimNextIntent() {
  // Atomic claim via single UPDATE ... RETURNING to eliminate race condition.
  // FOR UPDATE SKIP LOCKED ensures only one worker claims each intent even under concurrency.
  const rows = await prisma.$queryRaw<any[]>`
    UPDATE intents
    SET status = 'VALIDATING'
    WHERE id = (
      SELECT id FROM intents
      WHERE status = 'DRAFT'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;
  return rows[0] ?? null;
}
