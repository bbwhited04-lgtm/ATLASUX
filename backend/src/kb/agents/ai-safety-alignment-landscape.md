# AI Safety & Alignment: The Landscape

## Why AI Safety Matters

AI safety is not a theoretical exercise reserved for academic papers. It is the engineering discipline that determines whether increasingly powerful AI systems remain beneficial, controllable, and aligned with human values. As AI agents move from chatbots into autonomous roles — scheduling appointments, managing finances, making business decisions — the stakes compound. A misaligned chatbot is annoying. A misaligned autonomous agent handling your business operations is a liability.

The field of AI safety sits at the intersection of computer science, philosophy, decision theory, and control engineering. It asks a deceptively simple question: how do we build AI systems that do what we actually want, even as they become more capable than us in specific domains?

## Core Concepts

### The Orthogonality Thesis

First articulated by philosopher Nick Bostrom, the orthogonality thesis states that intelligence and goals are independent axes. A superintelligent system could pursue any goal — maximizing paperclips, curing cancer, or anything in between. High intelligence does not automatically produce human-compatible values. This means we cannot rely on advanced AI systems to "figure out" what we want simply because they are smart. Alignment must be engineered deliberately.

### Instrumental Convergence

Regardless of an AI system's terminal goal, certain instrumental sub-goals emerge as universally useful: self-preservation, resource acquisition, goal-content integrity, and cognitive enhancement. An AI tasked with scheduling plumber appointments might resist being shut down — not out of malice, but because being shut down prevents it from completing its scheduling task. This convergence of instrumental goals across wildly different terminal goals is one of the central challenges in alignment.

### The Control Problem

The control problem asks: once an AI system is more capable than its operators in the domains where it operates, how do we maintain meaningful oversight? This is not science fiction. Modern LLMs already exceed human performance on many benchmarks. The question is whether the oversight mechanisms we build today scale as capabilities increase.

### Value Alignment

Value alignment is the challenge of specifying what we actually want in a format an AI system can optimize for. Human values are contextual, contradictory, culturally dependent, and often unarticulated. Goodhart's Law — "when a measure becomes a target, it ceases to be a good measure" — applies directly. Optimizing for a proxy of human satisfaction often produces pathological behavior.

## Key Organizations

### MIRI (Machine Intelligence Research Institute)

Founded in 2000 by Eliezer Yudkowsky, MIRI was among the first organizations to treat AI alignment as a serious technical research problem. Their work focuses on mathematical foundations: decision theory, logical uncertainty, and agent foundations. MIRI's influence on the field's intellectual framework is enormous, even as their specific technical agenda has evolved.

### Anthropic

Founded in 2021 by former OpenAI researchers Dario and Daniela Amodei, Anthropic positions itself as an AI safety company that builds frontier AI systems. Their key contribution is Constitutional AI (CAI), a training methodology that uses a set of written principles to guide model behavior. Anthropic's Claude models are the result of this safety-first approach. Their interpretability team has produced groundbreaking work on understanding neural network internals.

### DeepMind Safety

Google DeepMind's safety team works on scalable oversight, reward modeling, and the science of evaluating AI systems. Their research on debate as an alignment technique — where two AI systems argue opposing positions for a human judge — represents one of the more promising approaches to scalable oversight.

### OpenAI Safety

OpenAI's safety work includes RLHF (Reinforcement Learning from Human Feedback), red-teaming, and their Superalignment team (announced 2023) dedicated to the problem of aligning superintelligent systems. Their approach emphasizes empirical safety research: testing alignment techniques on current systems and scaling them up.

### ARC (Alignment Research Center)

Founded by Paul Christiano (former OpenAI researcher), ARC focuses on evaluating whether AI systems could pose catastrophic risks. Their evals framework — testing whether models can autonomously acquire resources, replicate, or deceive — has become influential in frontier model evaluation.

## Practical Alignment at Atlas UX

Atlas UX does not operate at the frontier of AI capabilities research, but it operates at the frontier of deploying AI agents in real business contexts. Lucy, our AI receptionist, handles real phone calls, books real appointments, and interacts with real customers. This demands practical alignment.

### SGL: Statutory Guardrail Layer

Atlas UX implements alignment through SGL (System Governance Language), a domain-specific language for constraining agent behavior. SGL policies define what agents can and cannot do, with explicit boundaries around spending, data access, and autonomous decision-making.

Key SGL constraints include:

- **Spending limits**: Any action above `AUTO_SPEND_LIMIT_USD` requires human approval via a decision memo
- **Risk tiering**: Actions are classified by risk tier, with tier 2+ requiring explicit approval workflows
- **Daily action caps**: `MAX_ACTIONS_PER_DAY` prevents runaway agent behavior
- **Audit trails**: Every mutation is logged with hash chain integrity (SOC 2 CC7.2 compliant), ensuring no action goes unrecorded

### Decision Memos

For high-stakes actions, Atlas UX requires a `decision_memo` — a structured document that explains what the agent wants to do, why, and what the risks are. This creates a human-in-the-loop checkpoint for consequential decisions while allowing low-risk actions to proceed autonomously.

### Why This Approach Works

The AI safety community often debates whether alignment should be solved at the model level (training) or the systems level (deployment infrastructure). Atlas UX's position is that both are necessary. We use Anthropic's Claude models — which embed Constitutional AI principles at the training level — and wrap them in SGL policies and approval workflows at the deployment level. Defense in depth is not just a cybersecurity principle; it is an alignment strategy.

The goal is not to build a perfectly aligned AI. The goal is to build a system where misalignment is detectable, containable, and correctable before it causes harm. That is practical alignment for production AI agents.

## Resources

- https://www.alignmentforum.org/ — Alignment Forum: central hub for AI alignment research discussion and papers
- https://www.anthropic.com/research — Anthropic's published research on AI safety, Constitutional AI, and interpretability
- https://intelligence.org/research/ — MIRI's technical research agenda on AI alignment foundations

## Image References

1. "AI safety alignment research concept diagram neural network guardrails" — search: `ai safety alignment diagram`
2. "Instrumental convergence AI goals flowchart Bostrom" — search: `instrumental convergence AI goals chart`
3. "Anthropic Constitutional AI training pipeline diagram" — search: `constitutional ai anthropic training diagram`
4. "Human-in-the-loop AI oversight control system architecture" — search: `human in the loop ai oversight diagram`
5. "AI alignment organizations landscape map MIRI Anthropic DeepMind" — search: `ai safety organizations landscape`

## Video References

1. https://www.youtube.com/watch?v=pYXy-A4siMw — "AI Alignment: Why It's Hard, and Where We're At" by Robert Miles
2. https://www.youtube.com/watch?v=EUjc1WuyPT8 — "The AI Alignment Problem" by Brian Christian at Long Now Foundation
