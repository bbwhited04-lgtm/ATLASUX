# Workflow Catalog (Atlas UX)

This folder defines **workflow maps** used by the engine for cloud-surface testing.

## Active Workflows

- **WF-001** Support Intake (CHERYL)
- **WF-002** Support Escalation (CHERYL → Executive owners)
- **WF-010** Daily Executive Brief (BINKY)
- **WF-020** Engine Run Smoke Test (ATLAS)

## Workflow Spec Format

Each workflow file includes:

- Workflow ID + Owner Agent
- Trigger + Inputs (JSON shape)
- Steps (deterministic, numbered)
- Tool Calls (allowed per step)
- Audit Events (what gets written)
- Escalation rules
- Outputs (definition of done)
- Test cases

Truth at all times. Everything is traceable.
