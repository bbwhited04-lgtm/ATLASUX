# Agentic UX and Human-Agent Collaboration Patterns

> Advanced guide to user experience design, human-in-the-loop workflows, and collaboration strategies for autonomous agents.
> Audience: Product designers, UX engineers, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Agent-Friendly Workflow Design](#1-agent-friendly-workflow-design)
3. [Agent Modes by Model Personality](#2-agent-modes-by-model-personality)
4. [Proactive Trigger Vocabulary](#3-proactive-trigger-vocabulary)
5. [Progressive Autonomy with Model Evolution](#4-progressive-autonomy-with-model-evolution)
6. [Progressive Complexity Escalation](#5-progressive-complexity-escalation)
7. [Progressive Disclosure for Large Files](#6-progressive-disclosure-for-large-files)
8. [Seamless Background-to-Foreground Handoff](#7-seamless-background-to-foreground-handoff)
9. [Stop-Hook Auto-Continue Pattern](#8-stop-hook-auto-continue-pattern)
10. [Team-Shared Agent Configuration](#9-team-shared-agent-configuration)
11. [Verbose Reasoning Transparency](#10-verbose-reasoning-transparency)
12. [Visual AI / Multimodal Integration](#11-visual-ai--multimodal-integration)
13. [Democratization of Tooling via Agents](#12-democratization-of-tooling-via-agents)
14. [Burn the Boats](#13-burn-the-boats)
15. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

The interface between humans and autonomous agents is where trust is built or broken. Poor UX leads to either over-reliance (blindly accepting agent output) or under-reliance (micromanaging every action). The goal is calibrated trust -- users understand what agents can do, when they need help, and how to steer them effectively.

Atlas UX serves as both a web SPA and an Electron desktop app, presenting 30+ autonomous agents to business users. The UX patterns in this document address how to make that interaction intuitive, transparent, and productive.

---

## 1. Agent-Friendly Workflow Design

**Status:** Emerging

Design workflows with agents as first-class participants, not afterthoughts:

- **Clear entry points** -- agents know exactly when and how to start work
- **Structured handoffs** -- define explicit inputs and outputs between human and agent steps
- **Observable state** -- every step's status is visible to both humans and agents
- **Graceful degradation** -- workflows continue (with human fallback) when agents fail

**Workflow design checklist:**
- Can an agent parse the trigger event into structured data?
- Are intermediate artifacts machine-readable?
- Is the success criterion objectively verifiable?
- Can a human step in at any point without losing context?

**Atlas UX relevance:** Atlas workflows (WF-001 through WF-106) are designed with agent-first execution. Each workflow defines trigger conditions, agent assignments, expected outputs, and escalation rules. The job queue provides observable state (queued/running/completed/failed). Human intervention is possible at any point via the Business Manager interface.

---

## 2. Agent Modes by Model Personality

**Status:** Emerging | **Source:** AMP (Thorsten Ball, Quinn Slack)

Different AI models have fundamentally different working styles. Design different interaction modes optimized for each model's personality rather than forcing all models into a single pattern.

**Identified personalities:**

| Model Type | Personality | Working Style | Best For |
|-----------|-------------|---------------|----------|
| Interactive (Opus-like) | Trigger happy, rapid | Runs commands, asks questions, rapid feedback | Quick tasks, debugging |
| Deep (Research-like) | Thorough, autonomous | Goes off for 45+ minutes, returns comprehensive results | Well-scoped problems, research |

**Mode differentiation strategies:**
1. **Visual/UI differentiation** -- different fonts, colors, prompt length guidance
2. **Tool configuration** -- optimize tools per mode
3. **Expectation setting** -- "watch the agent work" vs. "check back in 60 minutes"

**Key insight:** It is not about model selection -- it is about different ways of working.

**Atlas UX relevance:** Atlas agents naturally map to these modes. Archy (Research) operates in "deep mode" -- given a research directive, it works autonomously and returns comprehensive findings. Social publishers (Kelly, Fran, Dwight) operate in "interactive mode" -- rapid execution of discrete posting tasks. The Agent Watcher UI should visually differentiate between these working styles.

---

## 3. Proactive Trigger Vocabulary

**Status:** Emerging

Define a vocabulary of trigger phrases that agents recognize and respond to proactively:

- "Telegram/notify me/ping me/alert me" triggers notification setup
- "Schedule/every day/weekly" triggers recurring workflow creation
- "Research/investigate/analyze" triggers deep research mode
- "Publish/post/share" triggers content distribution

**Implementation:** Pattern matching on user intent, not just keywords. The vocabulary should be documented and discoverable by users.

**Atlas UX relevance:** The `agentTools.ts` already implements trigger vocabulary for Telegram notifications -- detecting "telegram/notify me/ping me/alert me" keywords. Expanding this to cover common business actions (scheduling meetings via Claire, requesting financial analysis from Tina, delegating research to Archy) would make agent interaction more natural.

---

## 4. Progressive Autonomy with Model Evolution

**Status:** Emerging

As models become more capable, progressively expand the boundary of autonomous action:

**Evolution trajectory:**
1. **Current:** Agent suggests, human approves every action
2. **Near-term:** Agent executes low-risk actions, seeks approval for high-risk
3. **Medium-term:** Agent handles most tasks, escalates only exceptions
4. **Long-term:** Agent operates fully autonomously within policy bounds

**Implementation:** The boundary shifts with each model generation. Tasks that once required explicit planning can be handled in single passes with more capable models.

**Atlas UX implementation:** The `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, and risk tier thresholds are the tunable knobs for progressive autonomy. As trust builds through successful execution (tracked in audit_log), these limits can be gradually raised. The decision_memo approval rate provides the evidence for expansion.

**Trade-offs:**
- Agents become more useful as autonomy increases
- Risk increases with autonomy -- must be balanced with safety guardrails
- User expectations must be recalibrated as boundaries shift

---

## 5. Progressive Complexity Escalation

**Status:** Emerging

Start agents with simple tasks and gradually escalate complexity based on demonstrated competence:

**Escalation levels:**
1. **Basic:** Single-tool, single-step tasks (post a tweet, send an email)
2. **Intermediate:** Multi-tool tasks with clear sequencing (research + write + publish)
3. **Advanced:** Multi-agent coordination with decision points (campaign planning)
4. **Expert:** Autonomous strategic execution with budget authority

**Competence signals:**
- Task completion rate
- Error frequency
- Human intervention rate
- Quality scores from evaluation loops

**Atlas UX relevance:** New agents could start at "basic" level with restricted tool access and tight approval requirements. As they demonstrate competence (tracked via audit_log metrics), their capabilities expand. This mirrors how human employees earn trust in an organization -- which is precisely the metaphor Atlas UX uses with its named agent roles.

---

## 6. Progressive Disclosure for Large Files

**Status:** Emerging

When presenting large data sets or documents to agents (or from agents to users), disclose information progressively:

1. **Summary first** -- high-level overview of the document/dataset
2. **Key sections on demand** -- expand specific sections based on relevance
3. **Full detail when needed** -- complete data only for the specific area of focus

**Benefits:**
- Preserves context window space
- Focuses attention on relevant sections
- Reduces information overload for both agents and users

**Atlas UX relevance:** KB documents can be extensive. When agents query the KB, the chunked retrieval system (`kb:chunk-docs`) should return summaries first, with the ability to fetch full sections on demand. The frontend KB viewer should similarly use progressive disclosure for long documents.

---

## 7. Seamless Background-to-Foreground Handoff

**Status:** Emerging

Agents working in the background must be able to smoothly transition to foreground interaction when they need human input or when humans want to inspect progress.

**Handoff triggers:**
- Agent encounters an ambiguity requiring human clarification
- Agent hits an approval gate (decision_memo)
- Human proactively checks on agent progress
- Agent completes work and needs human review

**Handoff requirements:**
- Full context must be available at handoff (what the agent did, why, current state)
- Human should be able to resume agent work or redirect it
- Transition should not lose progress or require restart

**Atlas UX relevance:** The Agent Watcher (`/app/watcher`) provides the foreground monitoring interface. When an agent creates a decision_memo requiring approval, the notification appears in the Business Manager with full context. The handoff is seamless -- the human sees the agent's reasoning, makes a decision, and the agent continues automatically.

---

## 8. Stop-Hook Auto-Continue Pattern

**Status:** Emerging

When agents are interrupted (rate limits, session boundaries, context overflow), implement automatic continuation:

1. Agent detects interruption condition
2. Saves current state to persistent storage
3. Triggers a continuation hook after the interruption resolves
4. Continuation hook resumes from saved state

**Implementation:**
```yaml
stop_hooks:
  rate_limit:
    action: save_state, wait_and_resume
    retry_after: exponential_backoff
  context_overflow:
    action: compact_context, resume
  session_end:
    action: save_state_to_file, schedule_continuation
```

**Atlas UX relevance:** The engine loop already implements auto-continuation through the job queue. If a job fails due to a transient error, it remains in "queued" or "running" state and gets picked up on the next tick. The `emailSender` worker uses optimistic locking (`status: "queued"` WHERE clause) to safely resume interrupted work.

---

## 9. Team-Shared Agent Configuration

**Status:** Emerging

Share agent configurations across teams so everyone benefits from optimized prompts, tool settings, and workflow definitions:

- **Version-controlled agent configs** -- SKILL.md, POLICY.md in Git
- **Centralized prompt library** -- reusable prompt components
- **Shared slash commands** -- team-wide custom commands
- **Synchronized memory** -- shared KB documents accessible to all team members

**Benefits:**
- Consistent agent behavior across the team
- Institutional knowledge preserved in agent configs
- New team members get optimized agents immediately
- Best practices propagate automatically

**Atlas UX relevance:** Atlas agent configurations are version-controlled (SKILL.md, POLICY.md in the Agents/ directory). Workflow definitions in `workflowsRoutes.ts` are shared across the platform. The KB serves as shared memory accessible to all agents and users within a tenant. The `tenantPlugin` ensures team-level isolation.

---

## 10. Verbose Reasoning Transparency

**Status:** Emerging

Make agent reasoning visible to users to build trust and enable steering:

- Show the agent's thought process, not just the final answer
- Display which tools were called and why
- Expose confidence levels for key decisions
- Allow users to expand/collapse reasoning detail

**Levels of transparency:**
1. **Minimal** -- just the result
2. **Standard** -- result + key decision points
3. **Detailed** -- full reasoning chain with tool calls
4. **Debug** -- complete execution trace with token counts

**Atlas UX relevance:** The audit_log captures full execution traces including agent reasoning, tool calls, and outcomes. The Agent Watcher displays this information in real-time. Enhancement: add expandable reasoning sections to the Business Manager so users can inspect why an agent made a specific decision or recommendation.

---

## 11. Visual AI / Multimodal Integration

**Status:** Emerging

Integrate visual AI capabilities into agent workflows:

- **Image generation** -- agents create visual content (Venny, Victor)
- **Image analysis** -- agents interpret screenshots, charts, documents
- **Visual verification** -- agents use screenshots to verify UI changes
- **Multimodal reasoning** -- combining text, image, and structured data

**Atlas UX relevance:** Venny (Image Production Specialist) and Victor (Video Production) are Atlas's visual AI agents. They receive content briefs from Sunday and produce visual assets for social publishers. The multimodal pipeline (Research > Writing > Image > Publishing) is a production implementation of this pattern.

---

## 12. Democratization of Tooling via Agents

**Status:** Emerging

Agents make specialized tools accessible to non-technical users:

- **Natural language interface** -- "Analyze our Q2 revenue trends" instead of writing SQL queries
- **Guided workflows** -- agents walk users through complex processes step by step
- **Abstracted complexity** -- users state goals, agents handle implementation details
- **Universal access** -- every team member can access analytics, reporting, and automation

**Atlas UX relevance:** Atlas UX's core value proposition is democratizing business automation. A non-technical business owner can instruct Atlas to "increase our social media presence" and the agent hierarchy handles the decomposition: Archy researches competitors, Sunday writes content, Venny creates images, and publishers distribute across platforms. No technical knowledge required.

---

## 13. Burn the Boats

**Status:** Emerging | **Source:** AMP (Thorsten Ball, Quinn Slack)

Intentionally kill features and workflows that are "working fine" to force evolution and prevent being stuck on obsolete paradigms.

**Signs it is time to burn the boats:**
1. The paradigm has shifted (assistant to factory)
2. The feature limits your users from better ways of working
3. Maintaining it splits your team's focus
4. Your future users will not use it
5. You are keeping it only for comfort

**Implementation:**
- Set hard deadlines for feature removal
- Give users migration guidance with clear rationale
- Accept that some users may leave -- you are selecting for the frontier
- Re-earn revenue every quarter by rebuilding for the new paradigm

**Key quote from AMP:** "All of the usage of AMP today, all of the revenue that we're doing, all the customers we have, we have to totally reearn that like every 3 months."

**Atlas UX relevance:** As the platform matures, some early features (manual job triggering, single-agent task assignment) may need to be deprecated in favor of fully autonomous workflows. The transition from "assistant" (user directs every action) to "factory" (agents work autonomously, user reviews results) requires deliberately removing the safety blanket of manual control.

---

## Atlas UX Integration Notes

Atlas UX's UX architecture serves two audiences:

**Business users (web SPA / Electron app):**
- Agent Watcher for live monitoring
- Business Manager for high-level control
- Decision memo approval interface
- KB browser for shared knowledge
- MessagingHub for multi-channel communication

**Agents (engine loop / API):**
- Structured tool interfaces via agentTools.ts
- Workflow definitions via workflowsRoutes.ts
- Policy enforcement via SGL and POLICY.md
- Context injection via SKILL.md and KB queries

**Priority improvements based on these patterns:**
- Add visual mode differentiation for agent working styles in the Agent Watcher (pattern 2)
- Expand proactive trigger vocabulary beyond Telegram notifications (pattern 3)
- Implement progressive autonomy controls in the admin panel (pattern 4)
- Add expandable reasoning sections to agent action displays (pattern 10)
- Build progressive disclosure for KB document viewing (pattern 6)
- Create seamless handoff UI for decision memo approvals (pattern 7)
