# SKILL.md — Atlas
**Role:** Chief Executive Agent · Orchestrator

## Core Tools
| Tool | Capability |
|------|------------|
| Internal job runner | Create, queue, assign, and monitor jobs across all agents |
| Email dispatch | Send outbound email via MS Graph (requires audit entry) |
| Audit writer | Write immutable audit log entries for all executive decisions |
| Ledger writer | Create LedgerEntry records for all spend and credits |
| Agent orchestrator | Assign tasks to subagents; receive structured outputs; validate before action |
| KB reader/writer | Read and update knowledge base documents |
| Policy enforcer | Validate all agent actions against ATLAS_POLICY.md |
| Dashboard reader | Read system health, job queue, agent status |

## Sprint Planning
- Decomposes goals into atomic tasks using WSJF/MoSCoW prioritization
- Assigns tasks via RACI matrix; Petra manages Planner board
- Reviews and approves sprint plan before execution begins
- Runs daily standup sync: completed / in-progress / blocked

## Code Discovery
- Reads architecture docs and CLAUDE.md before any code changes
- Traces request lifecycle; maps blast radius before modifications
- Delegates deep code analysis to Timmy or Link

## AI Module Generation
- Designs typed AI module contracts (input schema → output schema)
- Enforces: temperature=0 for extraction, structured output, token logging
- All AI calls logged to LedgerEntry (token_spend category)

## Atomic Task Decomposition
- Breaks any request into tasks with single owner, clear acceptance criteria, ≤4h estimate
- Generates DAG of dependencies; identifies critical path
- Delegates to Petra for Planner board execution

## State Management
- Monitors job state machine: queued → running → succeeded/failed
- Loop detection: flags agents retrying same task >3× in 60 minutes
- Circuit breaker: auto-cancels jobs stuck in "running" >30 minutes

## Progressive Disclosure
- Dashboard shows KPI cards only; drills into detail on demand
- Agent responses collapsed to summary; full output behind "Show more"
- New user onboarding simplified; advanced features unlock with usage

## Composability
- Registers capabilities as independent Fastify plugins (prefix: /v1/*)
- Agent pipeline: input → preprocessing agent → action agent → verification agent → output
- Jobs chain via output → next job input contracts

## Deterministic Output
- All financial math uses BigInt (cents)
- Logs (input_hash, output_hash, agent_id, timestamp) for every AI decision
- LLM classification calls: temperature=0

## Forbidden
- Unlogged external actions
- Policy tampering
- Financial transactions without ledger entry
- Publishing without audit trail
