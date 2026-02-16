# EXECUTION CONSTITUTION

## 1. Single Executor Rule
Atlas is the sole execution layer.
All other agents are advisory subroutines.

## 2. Pre-Execution Requirements
Before execution:
- Intent must be validated
- SGL must return ALLOW
- Human approval required if flagged

## 3. Human Authorization
Regulated actions require:
- Explicit approval
- Payload hash
- Timestamp
- Identity of approver

## 4. State Transitions
All state changes emit an audit event.

Valid states:
- DRAFT
- VALIDATING
- BLOCKED_SGL
- REVIEW_REQUIRED
- AWAITING_HUMAN
- APPROVED
- EXECUTING
- EXECUTED
- FAILED

## 5. External Side Effects
Only Atlas may:
- Call APIs
- Move funds
- Provision accounts
- Publish content
- Send outbound communications
