# SGL Governance (Statutory Guardrail Layer)

The Statutory Guardrail Layer (SGL) defines non-overridable execution boundaries for Atlas UX. No agent, tenant, administrator, or founder may bypass these constraints.

## Policy Source

The SGL specification lives in `policies/SGL.md`. The implementation is in `backend/src/core/sgl.ts`.

## Decision Outputs

Every intent is evaluated by SGL before execution. The evaluation returns one of three decisions:

| Decision | Meaning | Action Taken |
|----------|---------|--------------|
| `ALLOW` | Safe to proceed | Intent is executed |
| `REVIEW` | Requires human approval | Intent status set to `AWAITING_HUMAN` |
| `BLOCK` | Prohibited action | Intent status set to `BLOCKED_SGL` |

## Implementation — `sgl.ts`

The `sglEvaluate()` function in `backend/src/core/sgl.ts`:

```typescript
export function sglEvaluate(intent: Intent): {
  decision: SglDecision;
  reasons: string[];
  needsHuman: boolean;
} {
  // Single executor rule
  if (intent.actor !== "ATLAS")
    return { decision: "BLOCK", reasons: ["ONLY_ATLAS_EXECUTES"], needsHuman: false };

  // Regulated actions
  const regulated = new Set(["GOV_FILING_IRS", "BANK_TRANSFER", "CRYPTO_TRADE_EXECUTE"]);
  if (regulated.has(intent.type))
    return { decision: "REVIEW", reasons: ["REGULATED_ACTION"], needsHuman: true };

  // PHI present
  if (intent.dataClass === "PHI")
    return { decision: "REVIEW", reasons: ["PHI_PRESENT"], needsHuman: true };

  // Spend threshold ($250+)
  if ((intent.spendUsd ?? 0) >= 250)
    return { decision: "REVIEW", reasons: ["SPEND_THRESHOLD"], needsHuman: true };

  return { decision: "ALLOW", reasons: [], needsHuman: false };
}
```

## Evaluation Rules

### BLOCK (Non-Overridable Prohibitions)

The following actions are always blocked:

- Non-Atlas actor attempting execution (`ONLY_ATLAS_EXECUTES`)
- Statutory violations (federal, state, international law)
- PHI/HIPAA unsafe handling
- Copyright or trademark infringement
- Fraudulent or deceptive claims
- Unauthorized bank transfers
- Government filings without human signature
- Attempts to modify SGL logic itself

### REVIEW (Requires Human Approval)

These trigger a human review flow:

| Trigger | Reason Code | Description |
|---------|-------------|-------------|
| Regulated intent types | `REGULATED_ACTION` | IRS filings, bank transfers, crypto trades |
| PHI data class | `PHI_PRESENT` | Protected Health Information detected |
| Spend >= $250 | `SPEND_THRESHOLD` | Financial spend above auto-approve limit |
| Risk tier >= 2 | (decision memo) | High-risk actions from decision memo system |

### ALLOW

All other actions are allowed to proceed through the engine execution pipeline.

## Execution Gate — `atlasGate.ts`

The `atlasExecuteGate()` function in `backend/src/core/exec/atlasGate.ts` integrates SGL into the engine pipeline:

1. Constructs an intent object with tenant, actor, type, payload, data class, and spend
2. Calls `sglEvaluate(intent)`
3. Hashes the payload (SHA-256) for audit trail integrity
4. Writes `SGL_EVALUATED` to the audit log with the decision
5. Returns the gate result:
   - `ALLOW` -> `{ ok: true }`
   - `REVIEW` -> `{ ok: false, code: "HUMAN_APPROVAL_REQUIRED" }`
   - `BLOCK` -> `{ ok: false, code: "SGL_BLOCK" }`

## Decision Memo Integration

For `REVIEW` decisions, the engine creates a `decision_memo` record requiring human approval. The memo includes:

- Agent name and rationale
- Estimated cost
- Risk tier
- Confidence score
- Expected benefit

The human approves or rejects via the Decisions Inbox UI (`/app/business-manager?tab=decisions`).

## Tamper Protection

From `policies/SGL.md`:

- Attempts to alter or bypass SGL are logged
- Trigger restricted execution state
- Require compliance review
- SGL logic is versioned and may only change through code update, version increment, audit record, and board acknowledgment

## Execution Constitution

`policies/EXECUTION_CONSTITUTION.md` reinforces SGL with additional rules:

1. **Single Executor Rule** — Atlas is the sole execution layer; all other agents are advisory
2. **Pre-Execution Requirements** — Intent must be validated, SGL must return ALLOW, human approval required if flagged
3. **Human Authorization** — Regulated actions require explicit approval, payload hash, timestamp, and approver identity
4. **State Transitions** — All state changes emit audit events
5. **External Side Effects** — Only Atlas may call APIs, move funds, provision accounts, publish content, or send communications

## Audit Trail

Every SGL evaluation is logged:

```
action: "SGL_EVALUATED"
level: "security" (BLOCK) | "warn" (REVIEW) | "info" (ALLOW)
meta: { sgl: { decision, reasons, needsHuman }, intentType, payloadHash }
```
