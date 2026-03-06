/**
 * Workflow Hook — tracks workflow success/failure patterns.
 *
 * Trigger: after WORKFLOW_COMPLETE audit log entry.
 * Cost: zero LLM cost for most runs. Only stores a memory when failures cluster
 *        (3+ failures for the same workflow in a rolling 7-day window).
 */

import { prisma } from "../../db/prisma.js";
import { getSystemState, setSystemState } from "../../services/systemState.js";
import { storeOrgMemory } from "../agent/orgMemory.js";

const FAILURE_THRESHOLD = 3;
const WINDOW_DAYS = 7;

export async function runWorkflowHook(params: {
  tenantId: string;
  workflowId: string;
  ok: boolean;
  message: string;
  intentId: string;
}): Promise<void> {
  const { tenantId, workflowId, ok, message, intentId } = params;

  if (!workflowId) return;

  const stateKey = `org-brain:wf-failures:${workflowId}`;

  if (ok) {
    // On success, store a lightweight success counter (no memory created)
    // but reset failure streak if it was building
    try {
      const state = await getSystemState(stateKey);
      const val = state?.value as any;
      if (val?.count >= FAILURE_THRESHOLD) {
        // The workflow recovered after a failure streak — store positive outcome
        await storeOrgMemory({
          tenantId,
          category: "outcome",
          content: `Workflow ${workflowId} recovered after ${val.count} consecutive failures. It is now running successfully again.`,
          source: "hook:workflow",
          tags: [workflowId, "recovery"],
        });
      }
      // Reset failure counter
      await setSystemState(stateKey, { count: 0, lastFail: null });
    } catch { /* non-fatal */ }
    return;
  }

  // ── Failure path ────────────────────────────────────────────────────────
  try {
    const state = await getSystemState(stateKey);
    const val = (state?.value as any) ?? { count: 0, failures: [] };
    const now = new Date();
    const cutoff = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);

    // Track failure timestamps within the rolling window
    const failures: string[] = (val.failures ?? [])
      .filter((ts: string) => new Date(ts) > cutoff);
    failures.push(now.toISOString());

    await setSystemState(stateKey, {
      count: failures.length,
      lastFail: now.toISOString(),
      lastMessage: message.slice(0, 500),
      failures,
    });

    // Only create a memory when failures cluster
    if (failures.length >= FAILURE_THRESHOLD && failures.length % FAILURE_THRESHOLD === 0) {
      await storeOrgMemory({
        tenantId,
        category: "pattern",
        content: `Workflow ${workflowId} has failed ${failures.length} times in the last ${WINDOW_DAYS} days. Last error: ${message.slice(0, 300)}. This recurring failure may indicate a broken API key, rate limit, or upstream service issue.`,
        source: "hook:workflow",
        tags: [workflowId, "failure-pattern"],
      });

      console.log(`[org-brain:workflow] Pattern detected: ${workflowId} failed ${failures.length}x in ${WINDOW_DAYS}d`);
    }
  } catch (err) {
    console.error("[org-brain:workflow] Hook failed:", err);
  }
}
