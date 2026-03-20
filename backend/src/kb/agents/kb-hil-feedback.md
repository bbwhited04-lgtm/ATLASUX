# Human-in-the-Loop Knowledge Curation for AI Agent Systems

## Introduction

Automation is fast but imperfect. A fully automated knowledge base pipeline can chunk, embed, classify, and index thousands of documents per hour — but it will also silently miscategorize articles, merge concepts that should remain separate, and propagate errors from one document into the embeddings of many chunks. Human-in-the-loop (HIL) curation adds the judgment layer that pure automation lacks: domain experts who validate classifications, approve risky changes, catch errors that algorithms miss, and make decisions that require contextual understanding beyond what current AI can provide. This article examines the patterns for integrating human oversight into knowledge base management, balancing automation speed against human quality, and designing systems that know when to act autonomously and when to ask for help.

## Why Pure Automation Is Not Enough

### The Error Amplification Problem

In a fully automated KB pipeline, a single error can propagate widely. If the entity extraction step misidentifies "Twilio" as a person rather than a service, every chunk mentioning Twilio gets miscategorized metadata. Every retrieval query about "communication services" misses those chunks. The error is invisible until someone notices that questions about SMS capabilities consistently return poor results.

Automation errors fall into categories that algorithms handle differently:

| Error Type | Detection Difficulty | Automation Fix | Human Fix |
|------------|---------------------|---------------|-----------|
| Missing content | Detectable via query gaps | Can identify gap | Must write content |
| Stale content | Detectable via timestamps | Can flag staleness | Must validate currency |
| Miscategorized content | Hard to detect at scale | Can re-classify | Must verify classification |
| Contradictory content | Very hard to detect | Can flag similarity | Must determine truth |
| Sensitive content | Context-dependent | Cannot reliably judge | Must evaluate context |
| Duplicate content | Detectable via similarity | Can merge mechanically | Must choose canonical version |

### The Judgment Gap

Certain decisions require judgment that current AI cannot reliably provide:

- **Should this article be Tier 1 or Tier 2?** Requires understanding the business priority of the content, not just its semantic properties.
- **Are these two articles duplicates or complementary?** Two articles about "appointment booking" might cover different aspects (customer-facing vs admin) that look similar in embedding space but serve different purposes.
- **Is this outdated or still valid?** An article about pricing from 6 months ago might still be accurate, or the pricing might have changed. Only someone who knows the current pricing can decide.
- **Should this merge into an existing article or remain separate?** Architectural decisions about KB structure require understanding of how agents use the knowledge, not just its semantic content.

## HIL Patterns for Knowledge Base Management

### Pattern 1: Approval Workflows

High-risk KB changes require human approval before execution. The system proposes the change, and a human reviewer accepts, modifies, or rejects it.

```typescript
interface KBChangeProposal {
  id: string;
  type: "merge" | "delete" | "reclassify" | "create" | "modify_tier";
  description: string;
  rationale: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  proposedBy: string;       // Agent or system that proposed the change
  affectedChunkIds: string[];
  beforeState: unknown;
  proposedState: unknown;
  estimatedImpact: {
    queriesAffected: number;
    retrievalScoreChange: number;  // Estimated
  };
  status: "pending" | "approved" | "rejected" | "expired";
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  expiresAt: Date;          // Auto-expire if not reviewed
}

class ApprovalWorkflow {
  private riskThresholds = {
    low: "auto_approve",      // Re-embed, relink
    medium: "queue_review",   // Reclassify, modify metadata
    high: "require_approval", // Merge, delete
    critical: "require_dual_approval", // Delete Tier 1, modify policies
  };

  async proposeChange(change: Partial<KBChangeProposal>): Promise<string> {
    const riskLevel = this.assessRisk(change);
    const action = this.riskThresholds[riskLevel];

    const proposal: KBChangeProposal = {
      id: crypto.randomUUID(),
      riskLevel,
      status: action === "auto_approve" ? "approved" : "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ...change as any,
    };

    await prisma.kbChangeProposal.create({ data: proposal });

    if (action === "auto_approve") {
      await this.executeChange(proposal);
    } else {
      await this.notifyReviewers(proposal);
    }

    return proposal.id;
  }

  private assessRisk(change: Partial<KBChangeProposal>): string {
    if (change.type === "delete" && change.beforeState?.tier === 1) return "critical";
    if (change.type === "delete") return "high";
    if (change.type === "merge") return "high";
    if (change.type === "modify_tier") return "medium";
    if (change.type === "reclassify") return "medium";
    if (change.type === "create") return "low";
    return "medium";
  }

  private async notifyReviewers(proposal: KBChangeProposal): Promise<void> {
    // Send to Slack review channel
    await slack.postMessage({
      channel: "#kb-reviews",
      text: `KB Change Proposal: ${proposal.type}\n` +
            `Risk: ${proposal.riskLevel}\n` +
            `Description: ${proposal.description}\n` +
            `Rationale: ${proposal.rationale}\n` +
            `Affected chunks: ${proposal.affectedChunkIds.length}\n` +
            `Review at: ${REVIEW_DASHBOARD_URL}/proposals/${proposal.id}`,
    });
  }
}
```

### Pattern 2: Review Queues

Rather than blocking on approval for each change, batch changes into a review queue that humans process periodically:

```typescript
interface ReviewQueue {
  id: string;
  name: string;
  description: string;
  reviewFrequency: "daily" | "weekly" | "on_demand";
  items: ReviewItem[];
  assignedTo: string[];
  lastReviewedAt: Date;
}

interface ReviewItem {
  id: string;
  queueId: string;
  type: "new_article" | "suggested_update" | "conflict" | "stale_content" | "quality_issue";
  priority: "low" | "medium" | "high";
  content: unknown;
  context: string;          // Why this item needs review
  suggestedAction: string;  // What the system recommends
  status: "pending" | "reviewed" | "deferred";
  createdAt: Date;
}

// Review queues for different KB aspects
const reviewQueues: ReviewQueue[] = [
  {
    id: "content-quality",
    name: "Content Quality Review",
    description: "Articles flagged by auto-eval as low-quality or inconsistent",
    reviewFrequency: "weekly",
    items: [],
    assignedTo: ["content-team"],
    lastReviewedAt: new Date(),
  },
  {
    id: "classification-disputes",
    name: "Classification Disputes",
    description: "Articles where auto-classification confidence is below 70%",
    reviewFrequency: "weekly",
    items: [],
    assignedTo: ["domain-experts"],
    lastReviewedAt: new Date(),
  },
  {
    id: "merge-candidates",
    name: "Merge Candidates",
    description: "Article pairs with >90% content similarity that may be duplicates",
    reviewFrequency: "weekly",
    items: [],
    assignedTo: ["kb-admin"],
    lastReviewedAt: new Date(),
  },
];
```

### Pattern 3: Escalation Chains

When automated systems encounter situations they cannot handle, they escalate through a chain of increasingly capable reviewers:

```typescript
interface EscalationLevel {
  level: number;
  name: string;
  handler: string;            // Role or person
  maxResponseTimeHours: number;
  capabilities: string[];     // What this level can decide
}

const escalationChain: EscalationLevel[] = [
  {
    level: 0,
    name: "Auto-Heal",
    handler: "system",
    maxResponseTimeHours: 0,   // Immediate
    capabilities: ["re-embed", "relink", "reclassify_within_tier"],
  },
  {
    level: 1,
    name: "KB Admin",
    handler: "kb-admin-role",
    maxResponseTimeHours: 24,
    capabilities: ["modify_tier", "merge_articles", "approve_new_content"],
  },
  {
    level: 2,
    name: "Domain Expert",
    handler: "domain-expert-role",
    maxResponseTimeHours: 72,
    capabilities: ["validate_accuracy", "resolve_contradictions", "approve_deletions"],
  },
  {
    level: 3,
    name: "Platform Admin",
    handler: "platform-admin",
    maxResponseTimeHours: 168,  // 1 week
    capabilities: ["structural_changes", "policy_updates", "tier_1_modifications"],
  },
];

class EscalationManager {
  async escalate(issue: KBIssue, currentLevel: number = 0): Promise<void> {
    const level = escalationChain[currentLevel];

    if (currentLevel === 0 && level.capabilities.includes(issue.requiredCapability)) {
      // Auto-handle
      await this.autoResolve(issue);
      return;
    }

    // Create escalation ticket
    const ticket = await prisma.escalationTicket.create({
      data: {
        issueId: issue.id,
        level: currentLevel,
        handler: level.handler,
        description: issue.description,
        deadline: new Date(Date.now() + level.maxResponseTimeHours * 3600000),
        status: "open",
      },
    });

    await this.notifyHandler(level, ticket);

    // Schedule auto-escalation if not resolved in time
    await this.scheduleAutoEscalation(ticket, currentLevel + 1);
  }
}
```

## Balancing Automation Speed vs Human Quality

### The Automation Spectrum

Not all KB operations require the same level of human oversight. The key is classifying operations by risk and reversibility:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Risk / Impact                             │
│                                                                  │
│  Low Risk                          High Risk                     │
│  ◄────────────────────────────────────────────────────────────►  │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────┐│
│  │ Auto-Execute │  │ Auto + Log   │  │ Propose +   │  │ Human  ││
│  │ (No review)  │  │ (Reviewable) │  │ Wait        │  │ Only   ││
│  └─────────────┘  └──────────────┘  └─────────────┘  └────────┘│
│                                                                  │
│  Examples:         Examples:         Examples:        Examples:  │
│  - Re-embed        - Reclassify      - Merge articles - Write   │
│  - Relink refs     - Update metadata - Delete content   new     │
│  - Fix typos       - Add tags        - Change tier 1   content  │
│  - Update dates    - Re-chunk        - Modify policies - Policy │
│                                                          changes│
└──────────────────────────────────────────────────────────────────┘
```

### Cost-Benefit Framework

```python
def should_automate(operation: KBOperation) -> str:
    """Decide automation level based on risk, reversibility, and frequency."""

    # Easily reversible + low impact = automate fully
    if operation.reversible and operation.impact_score < 0.3:
        return "auto_execute"

    # Reversible + moderate impact = automate with logging
    if operation.reversible and operation.impact_score < 0.6:
        return "auto_with_log"

    # Irreversible or high impact = require approval
    if not operation.reversible or operation.impact_score >= 0.6:
        return "require_approval"

    # Irreversible + affects Tier 1 = human only
    if not operation.reversible and operation.affects_tier_1:
        return "human_only"

    return "require_approval"  # Default to safe option
```

### Measuring the Human Cost

Every human review takes time. Tracking review costs helps optimize the automation boundary:

```typescript
interface ReviewMetrics {
  totalReviewsPerWeek: number;
  avgReviewTimeMinutes: number;
  reviewerHourlyRate: number;  // For ROI calculation
  autoApprovalRate: number;    // % of proposals that humans approve unchanged
  falseAlarmRate: number;      // % of escalations that were unnecessary
}

// If auto-approval rate > 95% for a change type, consider automating it
// If false alarm rate > 50%, tighten the escalation criteria
```

## Decision Memo Pattern for Risky KB Changes

### What Is a Decision Memo?

A decision memo is a structured document that captures the context, rationale, and risk assessment for a proposed change. It forces the proposer (whether human or AI agent) to articulate why the change is needed and what could go wrong.

```typescript
interface DecisionMemo {
  id: string;
  title: string;
  proposedBy: string;        // Agent or human
  createdAt: Date;

  // Context
  background: string;        // What situation triggered this proposal
  currentState: string;      // How things work now
  proposedChange: string;    // What would change

  // Analysis
  rationale: string;         // Why the change is needed
  alternatives: string[];    // Other options considered
  risks: Risk[];
  mitigations: string[];     // How risks will be managed
  rollbackPlan: string;      // How to undo if something goes wrong

  // Impact
  affectedAreas: string[];   // KB sections, agent behaviors
  estimatedEffort: string;   // Hours, complexity
  expectedBenefit: string;   // What improves

  // Approval
  requiredApprovers: string[];
  approvals: Approval[];
  status: "draft" | "pending" | "approved" | "rejected" | "implemented";
}

interface Risk {
  description: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
}
```

### When Decision Memos Are Required

Atlas UX requires decision memos for:
- **Deleting any Tier 1 content** (core product documentation)
- **Merging articles** that serve different audience segments
- **Changing the tier** of any article (especially promotion to Tier 1)
- **Modifying safety-related content** (policies, constraints, agent behavior rules)
- **Bulk operations** affecting more than 10 articles at once
- **Schema changes** that affect how metadata is structured

## Annotation Tools and Interfaces

### Review Dashboard Design

An effective review interface surfaces the right information for quick decisions:

```typescript
interface ReviewDashboardItem {
  // What changed
  proposalId: string;
  changeType: string;
  summary: string;

  // Context for the reviewer
  beforeSnapshot: string;     // Content before change
  afterSnapshot: string;      // Content after change
  diffView: string;           // Side-by-side diff

  // Impact analysis
  affectedQueries: string[];  // Golden queries that would be impacted
  retrievalScoreChange: number;
  chunkCount: number;

  // Recommendation
  systemRecommendation: "approve" | "reject" | "needs_review";
  confidence: number;
  reasoning: string;

  // Actions
  actions: ("approve" | "reject" | "modify" | "defer" | "escalate")[];
}
```

### Bulk Review Operations

For efficiency, reviewers should be able to process multiple similar items at once:

```typescript
class BulkReviewer {
  async reviewBatch(items: ReviewDashboardItem[], decision: string, notes: string): Promise<void> {
    for (const item of items) {
      await prisma.kbChangeProposal.update({
        where: { id: item.proposalId },
        data: {
          status: decision === "approve" ? "approved" : "rejected",
          reviewedBy: this.currentUser,
          reviewNotes: notes,
          reviewedAt: new Date(),
        },
      });

      if (decision === "approve") {
        await this.executeChange(item.proposalId);
      }
    }

    // Log the batch review in audit trail
    await prisma.auditLog.create({
      data: {
        action: "kb_bulk_review",
        details: {
          itemCount: items.length,
          decision,
          notes,
          itemIds: items.map(i => i.proposalId),
        },
      },
    });
  }
}
```

### Quality Annotation for Training Data

When reviewers correct KB issues, their corrections become training data for improving automation:

```typescript
interface CorrectionAnnotation {
  originalClassification: string;   // What the system predicted
  correctedClassification: string;  // What the human chose
  chunkId: string;
  reviewerId: string;
  timestamp: Date;
  confidence: number;               // Reviewer's confidence in their correction
  notes: string;
}

// Accumulate corrections to retrain/fine-tune classification models
class AnnotationAccumulator {
  async recordCorrection(annotation: CorrectionAnnotation): Promise<void> {
    await prisma.classificationCorrections.create({ data: annotation });

    // Check if we have enough corrections to retrain
    const correctionCount = await prisma.classificationCorrections.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    if (correctionCount >= 50) {
      await this.triggerRetraining();
    }
  }
}
```

## Atlas UX: Safe Auto-Heal vs Human-Approved Actions

Atlas UX divides KB maintenance actions into two categories based on risk and reversibility:

### Safe Auto-Heal Actions (No Human Required)

These actions execute automatically because they are low-risk and easily reversible:

1. **Re-embed stale chunks:** When embedding models are updated or chunks have not been re-embedded in 30+ days, the system automatically re-generates embeddings. Reversible by re-embedding with the previous model.

2. **Relink broken references:** When internal cross-references between articles point to renamed or moved targets, the system automatically updates the links. Reversible by restoring the previous link.

3. **Reclassify within the same tier:** When metadata extraction confidence is low and subsequent re-analysis produces a higher-confidence classification within the same tier, the system automatically updates the metadata. Reversible by restoring previous classification.

4. **Fix formatting errors:** Broken markdown, unclosed code blocks, and malformed tables are automatically corrected. Reversible by restoring original content.

### Human-Approved Actions (Decision Memo Required)

These actions require explicit human approval because they are higher-risk or involve judgment calls:

1. **Merge articles:** Combining two articles into one destroys the original structure. Requires judgment about which content to keep, how to combine it, and whether both articles served different purposes.

2. **Delete content:** Removing articles or chunks from the KB is irreversible (without backup restoration). Requires verification that the content is truly obsolete and not referenced by other articles or agents.

3. **Change tier assignments:** Promoting an article from Tier 3 to Tier 1 changes its retrieval priority across all queries. Requires judgment about whether the content meets Tier 1 quality and authority standards.

4. **Modify safety-related content:** Any change to agent behavior rules, safety policies, or constraint definitions requires human review because errors could cause agents to behave unsafely.

This two-tier approach ensures that the knowledge base self-heals for routine maintenance while escalating consequential changes to human reviewers who can apply the judgment that automation lacks.

## Conclusion

Human-in-the-loop curation is not a failure of automation — it is a feature of responsible systems. The most effective knowledge base management architectures use automation for speed and scale while preserving human judgment for decisions that require contextual understanding, risk assessment, and domain expertise. The key design decisions are where to draw the automation boundary (which operations auto-execute vs require approval), how to structure review workflows for efficiency (queues, batch review, escalation chains), and how to capture human corrections as training data to gradually expand the automation boundary. A system that never asks for human input is not fully automated — it is unmonitored.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Human-in-the-loop_machine_learning.svg/400px-Human-in-the-loop_machine_learning.svg.png — Human-in-the-loop machine learning cycle showing the feedback between automation and human review
2. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Precision_and_recall.svg/400px-Precision_and_recall.svg.png — Precision-recall trade-off applicable to the automation vs human review decision
3. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Feedback_loop.svg/400px-Feedback_loop.svg.png — Feedback loop showing how human corrections improve automated classification over time
4. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Hierarchical_clustering_diagram.svg/400px-Hierarchical_clustering_diagram.svg.png — Hierarchical diagram representing the escalation chain from auto-heal to human review
5. https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopology-Star.svg/400px-NetworkTopology-Star.svg.png — Star topology showing the review dashboard as the central hub for human reviewers

## Videos

1. https://www.youtube.com/watch?v=j6SFw5cYkOE — "Human-in-the-Loop Machine Learning" by Robert Munro explaining active learning and annotation workflows
2. https://www.youtube.com/watch?v=TL8fXKJlPGw — "Building Annotation Tools for ML" by Explosion AI (spaCy team) covering annotation interface design and workflow optimization

## References

1. Monarch, R. M. (2021). "Human-in-the-Loop Machine Learning: Active Learning and Annotation for Human-Centered AI." Manning Publications. https://www.manning.com/books/human-in-the-loop-machine-learning
2. Settles, B. (2012). "Active Learning." Synthesis Lectures on Artificial Intelligence and Machine Learning. Morgan & Claypool Publishers. https://burrsettles.com/pub/settles.activelearning.pdf
3. Amershi, S., Cakmak, M., Knox, W. B., & Kulesza, T. (2014). "Power to the People: The Role of Humans in Interactive Machine Learning." AI Magazine, 35(4). https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/2513
