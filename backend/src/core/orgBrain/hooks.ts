/**
 * Org Brain Hook Dispatcher — routes events to the appropriate auto-learning hook.
 *
 * All hooks are fire-and-forget to avoid blocking the main request path.
 * If a hook fails, it logs and moves on — hooks must never crash the caller.
 */

import { runMeetingHook } from "./meetingHook.js";
import { runWorkflowHook } from "./workflowHook.js";

export type OrgBrainEvent =
  | "meeting_processed"
  | "workflow_complete";

export async function dispatchOrgBrainHook(params: {
  tenantId: string;
  event: OrgBrainEvent;
  entityId: string;
  data?: any;
}): Promise<void> {
  const { tenantId, event, entityId, data } = params;

  try {
    switch (event) {
      case "meeting_processed":
        runMeetingHook({ tenantId, meetingNoteId: entityId }).catch(() => {});
        break;
      case "workflow_complete":
        runWorkflowHook({
          tenantId,
          workflowId: data?.workflowId ?? "",
          ok: data?.ok ?? false,
          message: data?.message ?? "",
          intentId: entityId,
        }).catch(() => {});
        break;
    }
  } catch {
    // Swallow — hooks must never crash the caller
  }
}
