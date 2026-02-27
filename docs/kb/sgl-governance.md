# System Governance Language (SGL)

## What is SGL?

System Governance Language (SGL) is a domain-specific language (DSL) created for Atlas UX that defines the rules, constraints, and behavioral boundaries governing all AI agent activity. SGL is the constitution of the platform — every agent action is evaluated against SGL policies before execution.

SGL exists because autonomous AI agents need more than just instructions. They need enforceable governance that operates consistently regardless of the complexity or novelty of a situation.

## Core Principles

SGL is built on four foundational principles:

1. **Safety First** — No action should cause irreversible harm without explicit human approval.
2. **Transparency** — Every decision and action must be explainable and auditable.
3. **Least Privilege** — Agents operate with the minimum authority needed for their role.
4. **Escalation by Default** — When in doubt, escalate to a human rather than guessing.

## Rule Structure

SGL rules follow a declarative format that specifies conditions, constraints, and consequences:

### Permission Rules
Define what an agent is allowed to do within its role scope. Permissions are additive — an agent has no permissions by default and must be explicitly granted each capability.

### Constraint Rules
Define hard limits that cannot be exceeded regardless of confidence or context:
- **Spend limits** — Maximum dollar amount per transaction and per day
- **Action caps** — Maximum number of actions per day per agent
- **Posting frequency** — Maximum social media posts per platform per day
- **Data access** — Which data categories an agent can read or modify

### Escalation Rules
Define when an agent must pause and request human approval:
- Spend above `AUTO_SPEND_LIMIT_USD`
- Risk tier 2 or higher
- Actions outside the agent's defined role
- Confidence score below threshold
- Recurring financial commitments
- Actions affecting external parties (customers, vendors)

## Risk Tiers

SGL defines five risk tiers that categorize agent actions:

| Tier | Level | Description | Approval Required |
|---|---|---|---|
| 0 | Minimal | Read-only operations, internal logging | No |
| 1 | Low | Routine tasks within normal parameters | No (if confidence is high) |
| 2 | Moderate | Actions with external impact or moderate cost | Yes — Decision Memo |
| 3 | High | Significant financial or reputational impact | Yes — Senior review |
| 4 | Critical | Irreversible actions, large spend, legal implications | Yes — Multi-party approval |

## Approval Triggers

The following conditions automatically trigger an approval workflow:

- **Financial**: Any transaction above `AUTO_SPEND_LIMIT_USD`
- **Recurring charges**: All recurring commitments are blocked by default during Alpha
- **External communications**: First-time contact with new external parties
- **Data deletion**: Any permanent data removal
- **Configuration changes**: Modifications to system settings or agent parameters
- **Multi-agent coordination**: Actions requiring multiple agents to execute in sequence

## Policy Enforcement

SGL policies are enforced at multiple levels:

### Engine Level
The orchestration engine evaluates every job against SGL rules before dispatching to an agent. Jobs that violate constraints are rejected before execution begins.

### Agent Level
Each agent carries its own policy context derived from SGL. The agent's reasoning process includes policy compliance as a mandatory check.

### Audit Level
Post-execution, the audit system verifies that completed actions remained within policy bounds. Violations are flagged for review.

## The Execution Constitution

Alongside SGL, the `EXECUTION_CONSTITUTION.md` provides narrative guidance for agent behavior — principles like "do no harm," "prefer reversible actions," and "always explain your reasoning." While SGL provides machine-enforceable rules, the Execution Constitution provides the philosophical framework.

## Customization

Organizations can customize SGL policies within the bounds set by Atlas UX's platform-level constraints. This means:
- Spend limits can be tightened (but not loosened beyond platform maximums)
- Action caps can be reduced
- Additional approval requirements can be added
- Risk tier assignments can be elevated for specific action types

## Key Takeaways

1. SGL is a formal governance language, not a suggestion — violations are blocked, not just logged.
2. Risk tiers provide a clear, graduated framework for when human oversight is required.
3. The combination of SGL rules and the Execution Constitution creates both hard constraints and soft guidance for agent behavior.
4. All SGL enforcement is auditable and transparent.
