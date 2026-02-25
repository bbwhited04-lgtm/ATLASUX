import { prisma } from "../../prisma.js";

export async function claimNextIntent() {
  // Atomic claim via single UPDATE ... RETURNING to eliminate race condition.
  // FOR UPDATE SKIP LOCKED ensures only one worker claims each intent even under concurrency.
  // NOTE: Raw SQL returns snake_case columns — explicitly alias to camelCase so
  //       engine.ts can read intent.intentType, intent.tenantId, intent.agentId etc.
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
    RETURNING
      id,
      tenant_id        AS "tenantId",
      agent_id         AS "agentId",
      intent_type      AS "intentType",
      status,
      payload,
      sgl_result       AS "sglResult",
      created_at       AS "createdAt"
  `;
  return rows[0] ?? null;
}
