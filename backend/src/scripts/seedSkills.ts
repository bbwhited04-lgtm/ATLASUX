import { prisma } from "../db/prisma.js";
import { KbDocumentStatus } from "@prisma/client";

const TENANT_ID = process.env.TENANT_ID ?? "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const CREATED_BY = process.env.SEED_CREATED_BY ?? "00000000-0000-0000-0000-000000000001";

const docs = [
  {
    slug: "atlas-sprint-planning",
    title: "Sprint Planning & Agile Project Management",
    tags: ["atlas", "engineering", "sprint", "agile", "project-management"],
    body: `# Sprint Planning & Agile Project Management

## Core Concepts
Sprint planning decomposes a release goal into a time-boxed iteration (typically 1–2 weeks) containing a ranked backlog of atomic tasks. Each task must be independently testable, estimable, and deliverable.

## Sprint Planning Protocol
1. **Sprint Goal**: Single sentence describing the business outcome.
2. **Capacity Planning**: Calculate available agent-hours after subtracting meetings, reviews, and buffer (≥20%).
3. **Backlog Refinement**: All items must have acceptance criteria, dependencies mapped, and estimates in story points (Fibonacci: 1,2,3,5,8,13).
4. **Task Selection**: Select from the top of the prioritized backlog until capacity is reached. Never exceed 85% fill rate.
5. **Daily Standups**: Three questions — What was completed? What is in progress? What is blocked?
6. **Sprint Review**: Demo working software only. No partial credit.
7. **Sprint Retrospective**: What went well? What needs improvement? What action items carry forward?

## Velocity Tracking
- Track velocity (story points completed per sprint) over rolling 4-sprint window.
- Use velocity ± 1 std dev as planning ceiling, not target.
- Velocity drops >20% trigger a capacity/impediment review.

## Agent Sprint Planning (Atlas-specific)
- Atlas assigns sprint tasks to agents with RACI matrix (Responsible, Accountable, Consulted, Informed).
- Each agent task has: owner, deadline, dependencies, definition of done.
- Petra manages the Planner board; Atlas reviews and approves sprint plan.
- Blocked tasks escalate to Atlas within 2 hours; unblocked within 24 hours.

## Prioritization Frameworks
- **MoSCoW**: Must-have, Should-have, Could-have, Won't-have.
- **WSJF** (Weighted Shortest Job First): (User Value + Time Criticality + Risk Reduction) / Job Duration.
- **RICE**: Reach × Impact × Confidence / Effort.
- **Kano Model**: Basic, Performance, Excitement features.

## Definition of Done
Every task is done when: code reviewed, tests passing, docs updated, acceptance criteria verified, deployed to staging.`,
  },
  {
    slug: "atlas-code-discovery",
    title: "Code Discovery & Codebase Intelligence",
    tags: ["atlas", "engineering", "code-discovery", "codebase-analysis"],
    body: `# Code Discovery & Codebase Intelligence

## Purpose
Code discovery is the systematic process of understanding an unfamiliar codebase before making changes — mapping architecture, dependencies, entry points, data flows, and anti-patterns.

## Discovery Protocol
1. **Orientation**: Read README, CLAUDE.md, package.json, and any existing architecture docs.
2. **Entry Points**: Find main(), server start, route registration, CLI entrypoints.
3. **Data Model**: Read Prisma schema (or equivalent ORM) — understand all entities and relationships.
4. **Request Lifecycle**: Trace one complete request from HTTP → route → handler → service → DB → response.
5. **Dependency Graph**: Map which modules import which. Identify circular dependencies.
6. **Test Coverage**: Find test directories; identify untested critical paths.
7. **Environment Config**: Read .env.example; understand all required variables.

## Static Analysis Signals
- Unused imports/exports = dead code candidates.
- Long functions (>50 lines) = decomposition targets.
- Repeated logic (3+ occurrences) = abstraction candidates.
- God objects/files (>300 lines, >10 responsibilities) = refactor targets.
- Magic numbers/strings = constant extraction targets.

## Codebase Mapping Tools
- **Glob patterns**: Find files by extension, naming convention.
- **Grep/ripgrep**: Find usages, function definitions, import patterns.
- **AST analysis**: Parse TypeScript/JavaScript to extract call graphs.
- **Dependency-cruiser**: Generate visual dependency graphs.

## Atlas Code Discovery Pattern
When asked to work on a feature or bug:
1. Never modify code you haven't read.
2. Read the target file + its direct dependencies.
3. Check git log for recent changes to the file.
4. Run existing tests before making changes.
5. Map the blast radius: what else calls this code?
6. Document findings in MEMORY.md before editing.

## Anti-Patterns to Flag
- Secrets in source (API keys, passwords).
- SQL concatenation (injection risk).
- Missing error handling on async operations.
- Hardcoded tenant/user IDs.
- Direct DB calls from UI components.
- Unvalidated user input reaching DB queries.`,
  },
  {
    slug: "atlas-ai-module-generation",
    title: "AI Module Generation & Prompt Engineering",
    tags: ["atlas", "engineering", "ai", "module-generation", "prompt-engineering"],
    body: `# AI Module Generation & Prompt Engineering

## Core Principles
AI module generation is the structured process of designing, prompting, and validating AI-powered components within a larger system. Each AI module should be: deterministic (same input → same class of output), testable, bounded, and auditable.

## Module Design Pattern
1. **Define the contract**: Input schema → Processing → Output schema. Document all three.
2. **System prompt engineering**: Role + Context + Instructions + Constraints + Output format.
3. **Temperature strategy**: 0.0 for extraction/classification; 0.2–0.4 for structured generation; 0.7+ only for creative tasks.
4. **Token budget**: Set max_tokens explicitly. Estimate: ~4 chars/token. Leave 20% headroom.
5. **Output parsing**: Never rely on free-form text. Always use structured output (JSON mode, Zod validation, or regex extraction).
6. **Fallback strategy**: If parsing fails → retry with explicit error context → fallback to default → log + alert.

## Prompt Engineering Techniques
- **Chain of Thought (CoT)**: "Think step by step before answering."
- **Few-shot examples**: Provide 2–5 labeled input/output pairs.
- **Role prompting**: "You are an expert [role] with [specific expertise]."
- **Negative examples**: "Do not include [X]. Never [Y]."
- **Format anchoring**: "Respond ONLY with valid JSON matching this schema: {schema}."
- **Self-consistency**: Generate N responses, vote on most common answer.
- **Retrieval augmentation**: Inject relevant KB chunks before the question.

## Atlas Module Generation Standards
- Every AI call goes through a typed wrapper (never raw fetch to LLM API).
- All prompts are version-controlled in code, not stored in DB.
- Token usage and cost are logged to LedgerEntry (category: token_spend).
- AI module outputs are validated before use downstream.
- Retry logic: max 3 attempts with exponential backoff (1s, 2s, 4s).

## Module Composition
- Modules should be single-responsibility: one task, one output.
- Chain modules with explicit data contracts between each step.
- Use queued Jobs for long-running AI tasks (never block HTTP request).
- Stream responses to UI using Server-Sent Events when latency > 2s.

## Evaluation Framework
- **Functional correctness**: Does output match expected schema?
- **Semantic correctness**: Is the content accurate for the use case?
- **Consistency**: Run same prompt 10 times — is variance acceptable?
- **Regression testing**: Maintain golden dataset of input/output pairs; run on every prompt change.`,
  },
  {
    slug: "atlas-atomic-task-decomposition",
    title: "Atomic Task Decomposition",
    tags: ["atlas", "engineering", "tasks", "decomposition", "planning"],
    body: `# Atomic Task Decomposition

## Definition
An atomic task is the smallest unit of work that:
- Can be completed independently (no pending dependencies).
- Has a single, verifiable outcome.
- Can be assigned to exactly one agent/person.
- Has a clear definition of done.
- Takes ≤ 4 hours of focused work.

## Decomposition Algorithm
1. **Start with the goal**: State the desired outcome in one sentence.
2. **List blockers**: What must be true before this can start?
3. **Identify outputs**: What artifacts does this produce? (code, doc, decision, message)
4. **Split if needed**: If a task produces >1 artifact type, split it.
5. **Assign owner**: One person/agent. Not "team" or "everyone."
6. **Set acceptance criteria**: Specific, measurable conditions for done.
7. **Estimate**: Use t-shirt sizes (XS/S/M/L/XL) or story points.

## Task Dependency Graph
- Use directed acyclic graph (DAG) — no circular dependencies.
- Critical path = longest chain of dependent tasks.
- Parallelizable tasks = tasks with no shared dependencies.
- Buffer time = 20% of critical path duration.

## Atlas Task Schema
\`\`\`
{
  id: string,
  title: string,           // Imperative: "Create X", "Fix Y", "Review Z"
  description: string,
  owner: agentId,
  status: pending | in_progress | blocked | completed | cancelled,
  priority: 1-5,
  estimateHours: number,
  blockedBy: taskId[],
  blocks: taskId[],
  acceptanceCriteria: string[],
  tags: string[]
}
\`\`\`

## Common Anti-Patterns
- "Investigate X" — too vague. Split into: "Read X docs", "Test X behavior", "Document findings."
- "Fix all bugs" — not atomic. One bug = one task.
- "Build the API" — too large. Split into endpoint-level tasks.
- "Coordinate with team" — not a task outcome. Replace with: "Send coordination email to [person] re: [decision]."

## Decomposition by Domain
- **Feature**: Epic → Stories → Tasks → Subtasks.
- **Bug**: Reproduce → Root cause analysis → Fix → Verify → Document.
- **Research**: Question → Search strategy → Analysis → Synthesis → Output doc.
- **Decision**: Define options → Gather evidence → Score with criteria → Choose → Document rationale.`,
  },
  {
    slug: "atlas-state-management-loop-detection",
    title: "State Management & Loop Detection",
    tags: ["atlas", "engineering", "state-machine", "loop-detection", "reliability"],
    body: `# State Management & Loop Detection

## State Machine Fundamentals
A state machine defines: States (what the system IS), Events (what can happen), Transitions (how events move between states), Guards (conditions that must be true), Actions (side effects on transition).

## Atlas Job State Machine
\`\`\`
queued → running → succeeded
queued → running → failed
queued → cancelled
running → blocked → queued (retry)
\`\`\`
- State transitions must be atomic (DB transaction).
- Invalid transitions must throw (no silent state corruption).
- State history must be logged (audit trail).

## Loop Detection Algorithms
### Cycle Detection in Dependency Graphs
- **DFS with color marking**: WHITE (unvisited) → GRAY (in-stack) → BLACK (done). GRAY→GRAY edge = cycle.
- **Kahn's Algorithm (topological sort)**: If any nodes remain after sort, a cycle exists.
- **Floyd's Algorithm (linked lists/chains)**: Fast/slow pointer; if they meet, cycle exists.

### Infinite Loop Detection in Agent Systems
1. **Counter threshold**: If same agent processes same entity N times in T minutes → alert.
2. **Hash comparison**: If output of step N equals input of step N → halt.
3. **State fingerprinting**: Hash (agent_id, task_id, input_hash, attempt_number). If duplicate found → loop detected.
4. **Time-based circuit breaker**: If task hasn't progressed in X minutes → auto-cancel + alert.

## Atlas Loop Prevention
- Max retries per job: 3 (configurable per job type).
- Retry backoff: exponential (1min, 4min, 16min).
- Agent self-calls: forbidden (no agent can invoke itself).
- Circular escalation detection: Larry → Atlas → Larry chain → alert chairman.
- Dead letter queue: Failed-max-retries jobs go to DLQ for manual review.

## State Consistency Patterns
- **Optimistic locking**: version field on all mutable entities; increment on update; conflict = retry.
- **Idempotency keys**: Each operation has a unique key; duplicate keys → return cached result.
- **Saga pattern**: Long-running multi-step transactions with compensating actions for each step.
- **Event sourcing**: Store events, not current state; derive state by replaying events.

## Monitoring State Health
- Dashboard: jobs by state with counts + age.
- Alert: any job stuck in "running" > 30 minutes.
- Alert: any job retried > 2 times in 1 hour.
- Alert: job queue depth > 100.
- Weekly: identify top 5 most-failed job types.`,
  },
  {
    slug: "atlas-progressive-disclosure",
    title: "Progressive Disclosure & UX Information Architecture",
    tags: ["atlas", "ux", "progressive-disclosure", "information-architecture"],
    body: `# Progressive Disclosure & UX Information Architecture

## Definition
Progressive disclosure is the UX principle of presenting only the information needed at the current step, revealing additional complexity only when the user requests it or demonstrates readiness.

## Core Rules
1. **First scan, then read**: Users scan before they read. Put the most important info first.
2. **Show, don't overload**: Default view shows 20% of info that covers 80% of use cases.
3. **Expand on demand**: Advanced options, details, and edge cases are hidden behind "Show more," accordions, or drill-downs.
4. **Context awareness**: Different user expertise levels see different default detail levels.
5. **No dead ends**: Every disclosed level must provide a path forward.

## Information Architecture Patterns
- **Hub and Spoke**: Central dashboard → module-specific detail pages.
- **Wizard/Stepper**: Multi-step flow reveals next step only after current is complete.
- **Progressive Forms**: Start with required fields; optional fields appear after basics are complete.
- **Tooltip/Popover**: Technical details available inline without leaving context.
- **Drill-down Tables**: Summary row → expand for detail rows → modal for full record.

## Atlas UI Application
- **Dashboard**: KPI cards only (counts, statuses). No raw data.
- **Agent Chat**: Responses collapsed to first paragraph; "Show full response" for details.
- **Audit Log**: Most recent 10 entries; "Load more" / date filter for history.
- **Job Queue**: Active jobs only; completed jobs behind "Show history" toggle.
- **KB Documents**: Title + 2-line summary; full content behind "Read more."

## Cognitive Load Management
- Miller's Law: humans hold 7±2 items in working memory. Never present >7 choices at once.
- Hick's Law: Decision time ∝ log(n options). Fewer choices = faster decisions.
- Progressive onboarding: New users see simplified UI; features unlock as they demonstrate usage.

## Implementation Guidelines
- Use skeleton loaders (not spinners) for loading states — they show structure.
- Disable (not hide) unavailable actions — explains why they're unavailable.
- Surface the most common action as primary CTA; secondary actions in dropdown.
- Error messages: plain language first, technical details in collapsible section.`,
  },
  {
    slug: "atlas-composability",
    title: "Composability & Modular System Design",
    tags: ["atlas", "engineering", "composability", "modularity", "system-design"],
    body: `# Composability & Modular System Design

## Definition
A composable system is built from independent, interchangeable components that can be combined in different configurations to produce new capabilities without modifying the components themselves.

## UNIX Philosophy (Applied)
1. Each module does one thing well.
2. Modules communicate through well-defined interfaces (pipes/APIs/events).
3. Build for composition from day one — small sharp tools > large monolithic blobs.

## Composability Principles
### Single Responsibility
Each function, module, agent, and service has exactly one reason to change.

### Open/Closed Principle
Open for extension (add new behavior by adding new code), closed for modification (don't change existing working code to add features).

### Interface Segregation
Expose only what callers need. No fat interfaces. Clients should not depend on methods they don't use.

### Dependency Inversion
High-level modules (Atlas) should not depend on low-level modules (email sender). Both should depend on abstractions (IEmailProvider interface).

## Atlas Composability Patterns
- **Agent composition**: Agents are composed into pipelines (input → agent A → agent B → output).
- **Tool composition**: Each agent tool is independent; tools can be reused across agents.
- **Job composition**: Complex operations are broken into chained jobs (Job A output → Job B input).
- **Route composition**: Fastify plugin pattern — each route file registers independently.

## Anti-Patterns to Avoid
- **Spaghetti dependencies**: Module A → B → C → A (circular).
- **Leaky abstractions**: Implementation details leaking through the interface.
- **Over-abstraction**: Building a generic framework for one use case.
- **Tight coupling**: Class A creates instances of Class B (use dependency injection instead).

## Plugin Architecture (Fastify)
\`\`\`typescript
// Good — composable, independently testable
app.register(async (plugin) => {
  plugin.get('/health', handler);
}, { prefix: '/v1' });
\`\`\`

## Event-Driven Composability
- Producers emit events without knowing who consumes them.
- Consumers react without knowing who produced.
- New capabilities = new consumers. No producer changes needed.
- Atlas event bus: job.created → email worker (notify) + audit (log) + analytics (count).`,
  },
  {
    slug: "atlas-deterministic-output",
    title: "Deterministic Output & Reproducibility",
    tags: ["atlas", "engineering", "determinism", "reproducibility", "testing"],
    body: `# Deterministic Output & Reproducibility

## Definition
A deterministic system produces the same output for the same input, every time, regardless of when or where it runs. Reproducibility is the property that a process can be repeated to verify its results.

## Why Determinism Matters in AI Systems
- **Testing**: Non-deterministic outputs cannot be unit tested with equality checks.
- **Debugging**: Cannot reproduce bugs if behavior changes between runs.
- **Trust**: Users and operators must be able to predict system behavior.
- **Audit**: Every output must be traceable to its inputs.
- **Compliance**: Regulated industries require reproducible decisions.

## Sources of Non-Determinism
1. **LLM temperature > 0**: Sampling introduces variance. Set temperature=0 for deterministic tasks.
2. **Random seeds**: Use fixed seeds for random number generation in reproducible experiments.
3. **Time-dependent logic**: Date.now(), new Date() — inject clock as dependency.
4. **Ordering assumptions**: Object.keys() order is insertion-order but not guaranteed semantically. Sort explicitly.
5. **Race conditions**: Parallel operations completing in different orders.
6. **External API calls**: Response content may change. Cache or mock for tests.
7. **Floating point**: Different CPUs may produce slightly different float results. Use integer math (cents not dollars).

## Atlas Determinism Standards
- All financial calculations use BigInt (cents), never float.
- Job IDs are UUID v4 (random but unique, not sequential).
- Agent decisions that affect users must log their input + reasoning.
- LLM calls for classification/extraction: temperature=0.
- Date/time: always UTC, always ISO 8601 string, always from DB server clock.
- Sort all arrays before hashing or comparing.

## Reproducible Builds
- Lock file committed (package-lock.json / yarn.lock).
- Exact dependency versions in production builds.
- Environment variables validated at startup — fail if missing required vars.
- DB migrations are numbered, ordered, and irreversible.

## Testing for Determinism
- Run same test 3× — assert identical results.
- Golden file tests: save expected output, compare on every run.
- Snapshot tests for UI components.
- Property-based testing (fast-check): generate random inputs, verify invariants hold.

## Output Verification Chain
Input → Hash → Process → Output → Hash → Log (input_hash, output_hash, agent_id, timestamp)
- If output_hash changes for same input_hash → alert (non-determinism detected).
- Store output fingerprints for audit replay.`,
  },
];

async function main() {
  console.log(`Seeding ${docs.length} documents...`);
  let created = 0, updated = 0;

  for (const doc of docs) {
    // Upsert tags
    const tagIds: string[] = [];
    for (const tagName of doc.tags) {
      const tag = await prisma.kbTag.upsert({
        where: { tenantId_name: { tenantId: TENANT_ID, name: tagName } },
        create: { tenantId: TENANT_ID, name: tagName },
        update: {},
      });
      tagIds.push(tag.id);
    }

    const existing = await prisma.kbDocument.findFirst({ where: { tenantId: TENANT_ID, slug: doc.slug } });
    if (existing) {
      await prisma.kbDocument.update({
        where: { id: existing.id },
        data: {
          title: doc.title, body: doc.body,
          status: KbDocumentStatus.published, updatedBy: CREATED_BY,
          tags: { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) },
        },
      });
      console.log(`  updated: ${doc.slug}`);
      updated++;
    } else {
      await prisma.kbDocument.create({
        data: {
          tenantId: TENANT_ID, slug: doc.slug, title: doc.title, body: doc.body,
          status: KbDocumentStatus.published, createdBy: CREATED_BY, updatedBy: CREATED_BY,
          tags: { create: tagIds.map(tagId => ({ tagId })) },
        },
      });
      console.log(`  created: ${doc.slug}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Total: ${created + updated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
