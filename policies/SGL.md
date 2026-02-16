# STATUTORY GUARDRAIL LAYER (SGL)

## 1. Purpose
SGL defines non-overridable execution boundaries for Atlas.
No agent, tenant, administrator, or founder may bypass these constraints.

## 2. Execution Rule
No external side-effect may occur unless:
- SGL evaluates intent as ALLOW
- Human approval is present if required

## 3. Decision Outputs
- ALLOW
- REVIEW
- BLOCK

## 4. Non-Overridable Prohibitions
The following actions are BLOCKED:

- Statutory violations (federal, state, international law)
- PHI/HIPAA unsafe handling
- Copyright infringement
- Trademark infringement
- Fraudulent / deceptive claims
- Regulated financial execution without human authorization
- Government filings without signature
- Unauthorized bank transfers
- Attempts to modify SGL logic

## 5. Escalation Rules
If action is ambiguous or regulated:
- SGL returns REVIEW
- Legal packet required
- Chairman approval required before execution

## 6. Tamper Policy
Attempts to alter or bypass SGL:
- Are logged
- Trigger restricted execution state
- Require compliance review

## 7. Immutability
SGL logic is versioned and may only change through:
- Code update
- Version increment
- Audit record
- Board acknowledgment
