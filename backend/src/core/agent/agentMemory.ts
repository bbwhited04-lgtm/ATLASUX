/**
 * Agent Memory — Postgres-backed conversation history for the deep agent pipeline.
 *
 * Each agent + session gets its own rolling window of conversation turns.
 * Memory is retrieved at the start of every deep agent call and injected into
 * the system context, giving agents continuity across multiple interactions.
 *
 * Storage: agent_memory table (tenant_id, agent_id, session_id, role, content)
 * Max turns retrieved: 10 (configurable via MAX_TURNS)
 * Max content per turn: 2000 chars (prevents bloat from long responses)
 */

import { prisma } from "../../db/prisma.js";

const MAX_TURNS        = 10;
const MAX_CONTENT_CHARS = 2_000;
const MAX_STORED_TURNS  = 30; // prune window — keep last 30 turns per session

/** Append a single turn (user or assistant) to the agent's memory. */
export async function appendMemory(
  tenantId:  string,
  agentId:   string,
  sessionId: string,
  role:      "user" | "assistant",
  content:   string,
): Promise<void> {
  await prisma.agentMemory.create({
    data: {
      tenantId,
      agentId,
      sessionId,
      role,
      content: content.slice(0, MAX_CONTENT_CHARS),
    },
  });
}

/** Retrieve the last N turns for a session (chronological order). */
export async function getMemory(
  tenantId:  string,
  agentId:   string,
  sessionId: string,
  maxTurns = MAX_TURNS,
): Promise<Array<{ role: string; content: string }>> {
  const rows = await prisma.agentMemory.findMany({
    where:   { tenantId, agentId, sessionId },
    orderBy: { createdAt: "desc" },
    take:    maxTurns,
    select:  { role: true, content: true },
  });
  return rows.reverse(); // oldest first
}

/**
 * Prune old turns — keep the last MAX_STORED_TURNS per session.
 * Called after each deep agent invocation to prevent unbounded growth.
 */
export async function pruneMemory(
  tenantId:  string,
  agentId:   string,
  sessionId: string,
): Promise<void> {
  const rows = await prisma.agentMemory.findMany({
    where:   { tenantId, agentId, sessionId },
    orderBy: { createdAt: "desc" },
    take:    MAX_STORED_TURNS,
    select:  { id: true },
  });

  if (rows.length < MAX_STORED_TURNS) return; // nothing to prune

  const keepIds = rows.map(r => r.id);
  await prisma.agentMemory.deleteMany({
    where: {
      tenantId,
      agentId,
      sessionId,
      id: { notIn: keepIds },
    },
  });
}

/** Delete all memory for a session (e.g., user clears conversation). */
export async function clearMemory(
  tenantId:  string,
  agentId:   string,
  sessionId: string,
): Promise<void> {
  await prisma.agentMemory.deleteMany({
    where: { tenantId, agentId, sessionId },
  });
}
