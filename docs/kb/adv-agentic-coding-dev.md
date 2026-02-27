# Agentic Coding and Development Patterns

> Advanced guide to coding agents, CI/CD integration, and development workflow patterns for autonomous systems.
> Audience: Platform engineers, DevOps teams, and Atlas UX developers.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Background Agent with CI Feedback](#1-background-agent-with-ci-feedback)
3. [Coding Agent CI Feedback Loop](#2-coding-agent-ci-feedback-loop)
4. [Asynchronous Coding Agent Pipeline](#3-asynchronous-coding-agent-pipeline)
5. [Agent-Assisted Scaffolding](#4-agent-assisted-scaffolding)
6. [Agent-Powered Codebase QA and Onboarding](#5-agent-powered-codebase-qa-and-onboarding)
7. [AI-Assisted Code Review Verification](#6-ai-assisted-code-review-verification)
8. [CLI-First Skill Design](#7-cli-first-skill-design)
9. [Codebase Optimization for Agents](#8-codebase-optimization-for-agents)
10. [Compounding Engineering Pattern](#9-compounding-engineering-pattern)
11. [Disposable Scaffolding over Durable Features](#10-disposable-scaffolding-over-durable-features)
12. [Frontier-Focused Development](#11-frontier-focused-development)
13. [Shipping as Research](#12-shipping-as-research)
14. [Specification-Driven Agent Development](#13-specification-driven-agent-development)
15. [Subagent Compilation Checker](#14-subagent-compilation-checker)
16. [Abstracted Code Representation for Review](#15-abstracted-code-representation-for-review)
17. [Merged Code-Language Skill Model](#16-merged-code-language-skill-model)
18. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

Coding agents are the most mature category of autonomous agents, with production validation at companies like Cursor, Anthropic, and AMP. The patterns in this document cover the full development lifecycle: from scaffolding new projects, through iterative development with CI feedback, to code review and deployment.

Atlas UX is itself built with coding agents (Claude Code), making these patterns both informative and directly applicable to the platform's own development workflow.

---

## 1. Background Agent with CI Feedback

**Status:** Validated in production | **Source:** Quinn Slack (AMP)

Run the agent asynchronously in the background with CI as the objective feedback channel:

1. Agent pushes a branch
2. Waits for CI results
3. Patches failures
4. Repeats until stopping conditions are met
5. Users are only pulled in for approvals, ambiguous failures, or final review

```
Dev -> Agent: "Upgrade to React 19"
Agent -> Git: push branch react19-upgrade
Agent -> CI: trigger tests
CI -> Agent: 12 failures
Agent -> Files: patch imports
Agent -> CI: re-run
CI -> Agent: all green
Agent -> Dev: PR ready
```

**Key mechanics:**
- Branch-per-task isolation
- CI log ingestion into structured failure signals
- Retry budget and stop rules to avoid infinite churn
- Notification on terminal states (green, blocked, needs-human)

**Atlas UX relevance:** Atlas's development workflow uses this pattern daily. Commits are pushed, Vercel and Render builds provide CI feedback, and failures are addressed iteratively. The `render.yaml` build configuration (`npm install && npm run build`) serves as the CI gate.

---

## 2. Coding Agent CI Feedback Loop

**Status:** Best practice | **Source:** Quinn Slack, Will Brown

Run the coding agent asynchronously against CI, allowing it to push branches, ingest partial CI feedback, iteratively patch, and notify when green:

**Async CI loop:**
```
Agent -> GitRepo: create branch
Agent -> CI: trigger tests remotely
loop every 30s:
    CI -> Agent: partial failures or success
    Agent -> Files: patch specific failures
    Agent -> CI: re-run only failing tests
CI -> Agent: all tests green
Agent -> User: "PR is ready to merge"
```

**Implementation details:**
- Error parsing modules translate CI logs into structured diagnostics (`{file, line, error}`)
- Prioritized re-runs target only patched files
- Overlaps code generation and test runs across branches

**Atlas UX relevance:** The backend build process (`tsc compile to ./dist`) provides immediate type-checking feedback. When Prisma schema changes cause type errors, the agent iteratively fixes route handlers, services, and tests until the build passes. The `npx prisma migrate dev` command serves as a database-level CI gate.

---

## 3. Asynchronous Coding Agent Pipeline

**Status:** Emerging

Structure coding work as an asynchronous pipeline where multiple agents handle different stages:

1. **Planning agent** -- analyzes requirements, creates implementation plan
2. **Coding agent** -- implements code changes per the plan
3. **Testing agent** -- writes and runs tests for the changes
4. **Review agent** -- performs code review and suggests improvements
5. **Integration agent** -- handles merge conflicts and deployment

Each stage operates independently, passing artifacts through the pipeline.

**Atlas UX relevance:** Atlas's own development follows a similar pipeline: research (reading codebase), planning (identifying changes needed), implementation (writing code), testing (build verification), and deployment (push to Render). The MEMORY.md file serves as the planning artifact passed between development sessions.

---

## 4. Agent-Assisted Scaffolding

**Status:** Emerging

Use agents to generate project scaffolding and boilerplate:

- Initial project structure and configuration
- Route/endpoint scaffolding
- Component templates
- Test file stubs
- Database migration templates

**Best practices:**
- Scaffold should follow existing project conventions
- Generated code should compile and pass linting immediately
- Include placeholder implementations, not empty files
- Scaffold tests alongside implementation files

**Atlas UX relevance:** New agent configurations (SKILL.md, POLICY.md) could be scaffolded by an agent that understands the existing agent roster. When adding a new specialist agent, the scaffolding agent generates the configuration files, database seeds, workflow definitions, and route registrations based on the agent's role.

---

## 5. Agent-Powered Codebase QA and Onboarding

**Status:** Emerging

Deploy agents as interactive codebase guides for new team members:

- Answer questions about architecture and design decisions
- Explain how specific features are implemented
- Navigate the codebase to find relevant files
- Generate documentation for undocumented code
- Run through common development workflows

**Implementation:**
- Index the codebase into a searchable knowledge base
- Provide the agent with architectural context (CLAUDE.md)
- Allow the agent to read and explain any file
- Track common questions to improve documentation

**Atlas UX relevance:** The CLAUDE.md file already serves as the architectural guide for Claude Code sessions. The KB documents (200+ articles) provide domain knowledge. A dedicated onboarding agent could walk new developers through Atlas's architecture: the engine loop, agent hierarchy, SGL policies, and multi-tenant data model.

---

## 6. AI-Assisted Code Review Verification

**Status:** Emerging

Use agents to verify that code changes align with requirements and maintain quality:

- **Requirement verification** -- does the change address the stated requirement?
- **Regression detection** -- does the change break existing functionality?
- **Style consistency** -- does the code follow project conventions?
- **Security check** -- does the change introduce vulnerabilities?
- **Performance impact** -- does the change affect performance characteristics?

**Atlas UX relevance:** Larry (Auditor) could serve as an automated code review agent for Atlas's own codebase. Every PR could be reviewed against: multi-tenant isolation (does the query include `tenantId`?), audit logging (is the mutation logged?), and safety constraints (are spend limits respected?).

---

## 7. CLI-First Skill Design

**Status:** Emerging

Design agent skills as CLI commands first, then wrap them in higher-level interfaces:

- Every skill should be invocable from the command line
- Skills should accept structured input (JSON, YAML) and produce structured output
- CLI skills can be composed via pipes and scripts
- UI interactions are wrappers around CLI skills

**Benefits:**
- Testable in isolation
- Composable via scripting
- Automatable via cron/CI
- Debuggable via command history

**Atlas UX relevance:** Backend workers are already CLI-first: `npm run worker:engine`, `npm run worker:email`, `npm run kb:ingest-agents`, `npm run kb:chunk-docs`. Each can be invoked independently, composed into pipelines, and automated. New agent capabilities should follow this pattern.

---

## 8. Codebase Optimization for Agents

**Status:** Emerging

Structure codebases to be agent-friendly:

- **Reduced indirection** -- 2 levels of indirection instead of N
- **Clear naming** -- descriptive function and variable names
- **Co-located concerns** -- related code in the same file or directory
- **Explicit types** -- TypeScript interfaces over `any` types
- **Modular architecture** -- small, focused files over monolithic ones

**Specific recommendations:**
- Keep files under 500 lines
- Use explicit imports over wildcard re-exports
- Write JSDoc comments on public APIs
- Maintain consistent patterns across the codebase
- Avoid clever abstractions that obscure intent

**Atlas UX relevance:** Atlas components range from 10-70KB each, which can be challenging for agents. The architecture already follows good patterns: routes are organized under `/v1/`, plugins are modular (`authPlugin`, `tenantPlugin`, `auditPlugin`), and services are separated. The `CLAUDE.md` and `MEMORY.md` files provide the contextual documentation agents need.

---

## 9. Compounding Engineering Pattern

**Status:** Emerging

Invest in agent infrastructure that compounds over time:

- **Skills library** -- each solved problem becomes a reusable skill
- **Prompt library** -- refined prompts become institutional knowledge
- **Test suite** -- each bug fix adds a regression test
- **Documentation** -- each feature adds to the knowledge base

**Compounding loop:**
```
Solve problem -> Create skill/test/doc -> Next problem is easier
                                          -> Solve -> Create more -> ...
```

**Atlas UX relevance:** Every KB document, workflow definition, and agent configuration compounds the platform's capabilities. The seedAiKb.ts (200+ documents) is a massive compounding investment. Each successful agent execution adds to the audit_log, improving future decision-making. The MEMORY.md file captures cross-session learning that compounds across development sessions.

---

## 10. Disposable Scaffolding over Durable Features

**Status:** Emerging

Build temporary scaffolding to test ideas quickly, then replace with production-quality implementations:

- **Scaffolding** -- quick prototypes, hardcoded values, simplified logic
- **Durable features** -- tested, documented, production-ready code

**Rules:**
- Scaffolding has explicit expiration dates
- Never ship scaffolding to production without a conversion plan
- Use scaffolding to validate approach before investing in durability
- Mark scaffolding clearly in code (TODO comments, separate branches)

**Atlas UX relevance:** Several Atlas features started as scaffolding: the mobile pairing backend (in-memory store with 10-min TTL), placeholder OAuth configurations (waiting for provider approvals), and the initial email sender (Resend placeholder). Each is documented in MEMORY.md with clear conversion plans.

---

## 11. Frontier-Focused Development

**Status:** Emerging

Build for the frontier of AI capabilities, not for today's limitations:

- Design interfaces that work with tomorrow's more capable models
- Build autonomy controls that can expand, not just restrict
- Invest in evaluation infrastructure that scales with capability
- Accept that features built today may be obsolete in 3 months

**Atlas UX relevance:** Atlas's architecture is designed for progressive autonomy. The `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, and risk tier thresholds are all tunable. The decision_memo system can be relaxed as models become more reliable. The engine loop is model-agnostic (`ai.ts` supports OpenAI, DeepSeek, OpenRouter, Cerebras).

---

## 12. Shipping as Research

**Status:** Emerging

Treat shipping product features as a research methodology:

- Deploy agent capabilities to real users quickly
- Collect real-world performance data, not synthetic benchmarks
- Iterate based on production failures, not hypothetical edge cases
- Accept imperfection in exchange for learning velocity

**Atlas UX relevance:** Atlas is in Alpha specifically because shipping is the fastest way to discover real failure modes. The 7-day stability test with built-in approval workflows is designed to generate production data about agent behavior. Every commit updates the landing page Dev Updates section -- treating each deployment as a publishable research result.

---

## 13. Specification-Driven Agent Development

**Status:** Emerging

Write specifications before code, then use agents to implement against the spec:

1. Human writes detailed specification
2. Agent generates implementation
3. Agent generates tests from specification
4. Tests verify implementation matches spec
5. Spec and tests become living documentation

**Atlas UX relevance:** Workflow definitions (WF-001 through WF-106) serve as specifications. Each defines trigger conditions, agent assignments, expected outputs, and timing. The engine executes against these specifications. SGL.md is the specification for agent governance behavior.

---

## 14. Subagent Compilation Checker

**Status:** Emerging

Spawn a dedicated subagent after code changes to verify compilation:

1. Main coding agent makes changes
2. Subagent runs `tsc` (or equivalent compiler)
3. Subagent reports any type errors
4. Main agent fixes issues before proceeding

**Benefits:**
- Catches type errors early without consuming main agent context
- Compilation check runs in parallel with continued planning
- Clean separation of concerns (coding vs. verification)

**Atlas UX relevance:** Atlas uses TypeScript throughout. After backend changes, running `npm run build` (tsc compile) catches type errors immediately. The frontend build (`npm run build`) catches React and import errors. These compilation checks are the first feedback loop in the development cycle.

---

## 15. Abstracted Code Representation for Review

**Status:** Emerging

When reviewing large codebases, present abstracted representations rather than raw code:

- **Function signatures** instead of full implementations
- **Dependency graphs** instead of import lists
- **State machine diagrams** instead of conditional logic
- **Data flow summaries** instead of raw transformations

**Atlas UX relevance:** The CLAUDE.md file provides this abstracted representation. Instead of reading every route file, it describes the architecture: "30+ route files, all mounted under /v1" with key patterns like `tenantPlugin`, `authPlugin`, and `auditPlugin`. This abstraction layer enables effective agent reasoning about the codebase.

---

## 16. Merged Code-Language Skill Model

**Status:** Emerging

Models that understand both natural language and code simultaneously are more effective at coding tasks than models trained separately on each:

- Natural language requirements map directly to code patterns
- Code explanations are more accurate when the model understands both modalities
- Debugging benefits from reasoning about code in natural language
- Documentation generation is more natural

**Atlas UX relevance:** Atlas agents use natural language reasoning (ORCHESTRATION_REASONING) to generate structured outputs (job payloads, API calls, content). The merged code-language capability is what enables agents like Sunday to translate research findings into publishable blog posts, or Tina to translate financial analysis into spending recommendations.

---

## Atlas UX Integration Notes

Atlas UX's development workflow already incorporates many of these patterns:

**In daily use:**
- Background agent with CI feedback (Vercel/Render builds as CI)
- CLI-first skill design (all workers are CLI commands)
- Specification-driven development (workflow definitions as specs)
- Compounding engineering (KB documents, MEMORY.md, CLAUDE.md)
- Shipping as research (Alpha deployment with stability testing)

**Development tooling:**
- TypeScript compilation as first feedback loop
- Prisma migrations as database-level verification
- Git commit discipline (every commit updates landing page)
- CLAUDE.md as abstracted codebase representation

**Priority improvements:**
- Add automated code review verification for PRs (pattern 6)
- Build agent-powered codebase onboarding (pattern 5)
- Implement compilation checker subagent in the development workflow (pattern 14)
- Create agent-scaffolding tool for new agent configurations (pattern 4)
- Formalize disposable scaffolding tracking with expiration dates (pattern 10)
