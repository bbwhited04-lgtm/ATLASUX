# Approval Workflows

Atlas UX includes a human-in-the-loop approval system that ensures AI agents cannot take high-risk actions without your explicit permission. This is one of the platform's core safety features.

## How It Works

When an AI agent wants to perform an action that exceeds its authority, it creates a **decision memo** -- a formal proposal that explains what it wants to do, why, and how much it will cost. The action is paused until a human reviews and approves (or rejects) the memo.

## When Approval Is Required

An agent must create a decision memo when any of these conditions are met:

| Condition | Threshold |
|-----------|-----------|
| **Spending above the auto-spend limit** | Any action costing more than the configured `AUTO_SPEND_LIMIT_USD` |
| **Recurring charges** | Any action that would create a recurring payment or subscription |
| **Risk tier 2 or higher** | Actions the agent assesses as medium or high risk |
| **Confidence below threshold** | When the agent's confidence score is below `CONFIDENCE_AUTO_THRESHOLD` |

## Viewing Decision Memos

1. Navigate to **Business Manager > Decisions** tab (or go to `/app/business-manager?tab=decisions`).
2. You will see a list of pending memos on the left. Each shows:
   - Agent name (who proposed it)
   - Title (what they want to do)
   - Estimated cost
   - Risk tier
   - Confidence score
   - Status (Awaiting Human, Approved, Rejected)

3. Click on a memo to see full details on the right, including:
   - Rationale (why the agent thinks this is a good idea)
   - Billing type (one-time, recurring, etc.)
   - Expected benefit
   - Payload data (technical details of the proposed action)

## Approving a Decision

1. Select a pending memo (status: "Awaiting Human").
2. Review the rationale, cost, and risk tier carefully.
3. Click **Approve**.
4. Type a confirmation note if prompted.
5. Click **Confirm Approval**.

Once approved, the agent will proceed with the action. The memo status changes to "Approved" and the approval is logged in the audit trail.

## Rejecting a Decision

1. Select a pending memo.
2. Click **Reject**.
3. Enter a reason for the rejection (this helps the agent learn).
4. Click **Confirm Rejection**.

The agent will not proceed with the action. The memo status changes to "Rejected."

## Filtering Decisions

Use the status filter at the top of the Decisions inbox:

- **Awaiting Human** -- Show only memos that need your review (default)
- **All** -- Show all memos including approved and rejected ones

## Decision Memo Fields

| Field | Description |
|-------|------------|
| **Agent** | The agent that created the memo |
| **Title** | A summary of the proposed action |
| **Rationale** | The agent's reasoning for why this action should be taken |
| **Estimated Cost** | How much the action will cost in USD |
| **Billing Type** | One-time, recurring, or other payment structure |
| **Risk Tier** | 1 (low), 2 (medium), or 3 (high) |
| **Confidence** | The agent's confidence score (0-1) that this is the right action |
| **Expected Benefit** | What the agent expects to gain from this action |
| **Status** | Awaiting Human, Approved, Rejected, or Auto-Approved |

## Spend Limits and Safety Caps

In addition to per-action approvals, the platform enforces global safety limits:

- **Daily action cap** -- Limits the total number of actions any agent can take per day (`MAX_ACTIONS_PER_DAY`).
- **Daily posting cap** -- Limits social media posts per day.
- **Auto-spend limit** -- Actions below this dollar amount can proceed without approval.
- **Recurring purchase block** -- Recurring charges are blocked by default and always require approval.

These limits are configured in the backend environment and cannot be changed from the UI.

## Pending Decisions on the Dashboard

The main Dashboard shows a "Pending Decisions" counter. If this number is greater than zero, you have memos waiting for your review. Click the counter to jump directly to the Decisions inbox.

## Tips

- Check the Decisions inbox at least once a day to avoid blocking agent work.
- Pay close attention to the risk tier and estimated cost before approving.
- If you reject a memo, provide a clear reason so the agent can adjust its approach.
- All approvals and rejections are permanently logged in the audit trail for compliance.

## Related Guides

- [Business Manager](./business-manager.md) -- The Decisions tab lives inside Business Manager
- [Agents Hub](./agents-hub.md) -- Understand agent authority and constraints
- [Security](./security.md) -- SGL guardrails and audit trail
- [Agent Watcher](./agent-watcher.md) -- See approvals and rejections in real time
