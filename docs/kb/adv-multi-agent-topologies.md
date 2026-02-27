# Multi-Agent System Topologies

> Deep dive into communication architectures for multi-agent systems, from single-agent
> setups to complex hierarchical deployments. Covers interoperability protocols (A2A, MCP)
> and framework implementations.
> Audience: Platform engineers, AI architects, and agent system designers.

---

## 1. Overview

A multi-agent topology defines how agents discover, communicate with, and delegate to
one another. The topology you choose determines the control flow, fault tolerance,
scalability ceiling, and communication overhead of your entire system. There is no
universally correct topology — the right choice depends on the problem domain, the
number of agents, and the degree of autonomy each agent requires.

This document examines six canonical topologies, evaluates their trade-offs, covers two
emerging interoperability protocols (Google's A2A and Anthropic's MCP), and maps
everything back to Atlas UX's 30+ agent hierarchy.

---

## 2. The Six Communication Topologies

### 2.1 Single Agent

The simplest possible architecture: one agent with access to tools and memory.

**Structure:**
```
[User] <---> [Agent] <---> [Tools / APIs / Memory]
```

**How it works:**
- A single LLM-backed agent receives requests, reasons over them, selects tools,
  executes actions, and returns results.
- The agent manages its own context window, tool selection, and error recovery.
- There is no delegation, no peer communication, no supervisory layer.

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | Maximum — one agent, one decision-maker |
| Autonomy | N/A — no peers to share autonomy with |
| Scalability | Poor — bounded by one agent's context window and throughput |
| Fault tolerance | None — if the agent fails, everything fails |
| Communication overhead | Zero — no inter-agent messaging |
| Complexity | Minimal — easiest to build, test, and debug |

**When to use:**
- Simple task automation (one domain, limited tool set)
- Prototyping before scaling to multi-agent
- Tasks where a single expert is sufficient (e.g., a code review agent)

**Atlas UX parallel:** No single Atlas UX agent operates in true isolation. Even the
most specialized publisher agent (e.g., Kelly for X/Twitter) receives directives from
Sunday and reports outcomes to the engine loop. However, during a single engine tick,
an individual agent's execution resembles a single-agent topology — the agent reasons,
selects tools, and produces output within its tick window.

---

### 2.2 Network Topology (Peer-to-Peer)

Every agent can communicate directly with every other agent. No central coordinator.

**Structure:**
```
    [Agent A] <---> [Agent B]
        ^               ^
        |               |
        v               v
    [Agent D] <---> [Agent C]
```

**How it works:**
- Agents maintain awareness of all peers and their capabilities.
- Any agent can send a message to any other agent directly.
- Routing decisions are made locally by each agent — "Who should I ask about this?"
- There is no single point of failure, but also no single point of coordination.

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | Minimal — no central authority governs message flow |
| Autonomy | Maximum — every agent decides who to talk to and when |
| Scalability | Poor — O(n^2) potential connections; discovery becomes expensive |
| Fault tolerance | Excellent — loss of any single agent does not break the network |
| Communication overhead | High — agents must discover, negotiate, and route messages themselves |
| Complexity | High — debugging emergent behaviors is difficult |

**When to use:**
- Small teams of equally capable agents (3-5)
- Research or brainstorming tasks where free-form collaboration is valuable
- Scenarios where no natural hierarchy exists

**Atlas UX parallel:** The platform intel sweep (WF-093 through WF-105) has a mild
network flavor — 13 agents independently scan their platforms and write findings to the
knowledge base. However, Atlas UX constrains peer-to-peer communication with the
`reportsTo` chain: agents can only delegate to agents within their reporting line. This
prevents the O(n^2) explosion that pure network topologies suffer from at scale.

**Dangers at scale:**
- Message storms: Agent A asks B, B asks C, C asks A — circular communication loops.
- Redundant work: Multiple agents independently pursue the same subtask.
- Inconsistent state: Without a coordinator, agents may act on conflicting information.

---

### 2.3 Supervisor Topology (Central Hub)

A single supervisor agent routes all work and communication. Worker agents only talk
to the supervisor, never to each other.

**Structure:**
```
              [Supervisor]
             /    |    \
            v     v     v
      [Worker] [Worker] [Worker]
```

**How it works:**
- The supervisor receives all incoming tasks and decides which worker handles each one.
- Workers execute their assigned tasks and report results back to the supervisor.
- The supervisor aggregates results, handles errors, and produces the final output.
- Workers are stateless from each other's perspective — they share no direct state.

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | Maximum — supervisor sees and routes everything |
| Autonomy | Low for workers — they execute what they are told |
| Scalability | Moderate — supervisor becomes a bottleneck under high load |
| Fault tolerance | Low — supervisor failure is catastrophic; worker failure is isolated |
| Communication overhead | Low — star topology, all messages go through one node |
| Complexity | Low — clear separation of routing logic and execution logic |

**Implementation pattern:**
```
Supervisor Loop:
  1. Receive task
  2. Analyze task requirements
  3. Select worker agent(s) based on capability matching
  4. Delegate subtask(s) to selected worker(s)
  5. Collect results
  6. If quality check passes: return aggregated result
  7. If quality check fails: re-delegate or escalate
```

**When to use:**
- Task routing where the supervisor has domain knowledge to assign work
- Quality control scenarios where all output must be reviewed centrally
- Systems where auditability requires a single point of observation

**Atlas UX parallel:** Atlas (CEO) operates as a supervisor for strategic directives.
When Atlas receives a high-level objective like "Prepare Q2 marketing plan," it
decomposes the objective and delegates subtasks to department heads. Each department
head reports results back to Atlas, who synthesizes the final plan.

The engine loop itself acts as an infrastructure-level supervisor — it claims jobs,
dispatches them to agents, and manages their lifecycle. The difference is that the
engine loop is not an LLM agent; it is deterministic code.

---

### 2.4 Supervisor-as-Tool Topology

The supervisor is available as a support resource, but workers drive their own
execution. Workers call the supervisor when they need routing help, arbitration,
or access to capabilities beyond their scope.

**Structure:**
```
      [Worker A] --calls--> [Supervisor-Tool]
      [Worker B] --calls--> [Supervisor-Tool]
      [Worker C] --calls--> [Supervisor-Tool]
```

**How it works:**
- Worker agents are the primary actors. They receive tasks and execute autonomously.
- The supervisor is exposed as a callable tool (not a controlling orchestrator).
- Workers invoke the supervisor when they need help: routing a subtask to a peer,
  resolving an ambiguity, requesting authorization, or accessing a shared resource.
- The supervisor responds to requests but does not proactively initiate work.

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | Moderate — workers have initiative, supervisor has authority when invoked |
| Autonomy | High for workers — they decide when to ask for help |
| Scalability | Good — supervisor is only engaged when needed, not on every task |
| Fault tolerance | Good — workers continue independently if supervisor is unavailable |
| Communication overhead | Low to moderate — only when workers choose to invoke |
| Complexity | Moderate — requires workers to know when to escalate |

**When to use:**
- Experienced agent teams that can operate independently most of the time
- Scenarios where the supervisor's token budget is expensive and should be conserved
- Systems where worker agents have specialized domain knowledge the supervisor lacks

**Atlas UX parallel:** The relationship between Sunday (Communications Director) and
the social publisher agents (Kelly, Fran, Dwight, Timmy, etc.) partially resembles this
pattern. Publisher agents execute their posting workflows autonomously but can invoke
Sunday for content review, editorial guidance, or cross-platform coordination. Sunday
does not micromanage every post — publishers call Sunday when they need creative
direction or when content falls outside their pre-approved templates.

---

### 2.5 Hierarchical Topology (Multi-Layer)

Multiple supervisors organized in layers, each managing a team of agents or
sub-supervisors. Resembles a corporate org chart.

**Structure:**
```
                    [CEO]
                   /     \
             [VP-Eng]   [VP-Sales]
             /    \         |
        [Dev-1] [Dev-2] [SDR-1]
```

**How it works:**
- Top-level supervisor decomposes strategic objectives into departmental goals.
- Mid-level supervisors decompose departmental goals into individual tasks.
- Leaf agents execute tasks and report up through the chain.
- Each layer has its own authority level, approval thresholds, and escalation rules.
- Communication flows primarily up and down the hierarchy, not laterally.

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | High — layered oversight with multiple checkpoints |
| Autonomy | Graduated — more autonomy at lower layers for routine tasks |
| Scalability | Excellent — add layers or widen existing layers as needed |
| Fault tolerance | Good — mid-level supervisor failure affects only one department |
| Communication overhead | Moderate — messages traverse layers; latency increases with depth |
| Complexity | High — requires well-defined authority boundaries at each layer |

**Scalability advantage:** Adding a new agent only requires plugging into the
appropriate layer. The CEO does not need to know about every leaf agent. This is why
hierarchical topologies dominate large-scale multi-agent deployments.

**Latency cost:** A directive from the CEO to a leaf agent must traverse every
intermediate layer. In a 4-layer hierarchy, a simple task assignment requires at least
3 hops. Each hop adds LLM inference latency.

**When to use:**
- Large agent teams (10+ agents)
- Systems with natural departmental boundaries
- Scenarios requiring layered approval authority (e.g., spending limits)
- Organizations where accountability must follow a chain of command

**Atlas UX implementation — this is our primary topology:**

```
Layer 0 — Board:     chairman
Layer 1 — Executive: atlas (CEO), binky (CRO)
Layer 2 — Governors: tina (CFO), larry (Auditor), jenny (CLO), benny (IP)
Layer 3 — Specialists: sunday, archy, daily-intel, petra, sandy, frank,
                        porter, claire, mercer, cheryl, venny, victor
Layer 4 — Publishers: kelly, fran, dwight, timmy, terry, cornwall, link,
                       emma, donna, reynolds, penny
```

**Authority cascade in Atlas UX:**
- AUTO_SPEND_LIMIT_USD is the CEO's limit. Department heads inherit a fraction.
- Risk assessment happens at every layer — a task flagged as risk tier 2+ by any
  layer triggers a decision memo that must be approved before execution.
- The `reportsTo` field on each agent configuration enforces the hierarchy. An agent
  cannot delegate to an agent outside its reporting chain without Atlas's explicit
  approval (cross-department choreography rule).

**How decomposition flows through Atlas UX's hierarchy:**
```
Atlas: "Launch blog content series on AI safety"
  -> Binky: "Coordinate content strategy with Research and Publishing"
     -> Archy: "Research 5 AI safety topics with source citations"
     -> Sunday: "Write 5 blog posts from Archy's research"
        -> Venny: "Create header images for each post"
        -> Reynolds: "Publish finalized posts to blog platform"
  -> Tina: "Allocate content budget, approve any paid promotion"
  -> Larry: "Verify content complies with platform policies"
```

---

### 2.6 Custom / Hybrid Topology

Real-world systems rarely use a single pure topology. Custom topologies combine
elements from multiple patterns based on the specific requirements of each subsystem.

**Structure:** Varies. Typically a hierarchical backbone with network clusters or
supervisor nodes at specific points.

**How it works:**
- The system architects define topology rules per subsystem or workflow type.
- Some workflows use strict hierarchy (budget approvals).
- Others use peer-to-peer within a bounded cluster (publisher agents collaborating
  on a cross-platform campaign).
- Supervisor-as-tool patterns appear at integration boundaries (e.g., an agent
  calling MCP-exposed tools from an external system).

**Trade-offs:**

| Dimension | Assessment |
|-----------|------------|
| Control | Configurable — tight where needed, loose where beneficial |
| Autonomy | Configurable — varies by subsystem |
| Scalability | Depends on design — can be excellent if layered well |
| Fault tolerance | Depends on design — can be excellent with redundancy |
| Communication overhead | Moderate — varies by subsystem |
| Complexity | Highest — requires careful documentation and monitoring |

**When to use:**
- Production systems with diverse workflow types
- Systems that have evolved organically and need to be formalized
- Any system where no single pure topology satisfies all requirements

**Atlas UX is a hybrid system:**
- **Hierarchical** backbone for org structure and authority cascade
- **Supervisor** pattern for Atlas's strategic orchestration
- **Pipeline** for content production (Archy -> Sunday -> Venny -> Publishers)
- **Broadcast** for platform intel sweeps (WF-093 through WF-105)
- **Peer-to-peer** clusters within the publisher team for cross-platform coordination
- **Supervisor-as-tool** for Sunday's relationship with publisher agents

---

## 3. Topology Comparison Matrix

| Topology | Agents | Control | Scalability | Fault Tolerance | Overhead | Best For |
|----------|--------|---------|-------------|-----------------|----------|----------|
| Single | 1 | Total | None | None | None | Simple tasks, prototypes |
| Network | 2-5 | None | Poor | Excellent | High | Small collaborative teams |
| Supervisor | 3-10 | High | Moderate | Low (SPOF) | Low | Task routing, QA |
| Supervisor-as-Tool | 3-10 | Moderate | Good | Good | Low-Med | Autonomous expert teams |
| Hierarchical | 10+ | High | Excellent | Good | Moderate | Large organizations |
| Custom/Hybrid | Any | Variable | Variable | Variable | Variable | Production systems |

---

## 4. Google's Agent-to-Agent Protocol (A2A)

### 4.1 What A2A Solves

As multi-agent systems proliferate, a critical problem emerges: agents built by
different teams, using different frameworks, running on different infrastructure, need
to discover and communicate with each other. A2A is Google's open protocol for
agent interoperability.

### 4.2 Agent Card: Discovery via JSON Metadata

Every A2A-compliant agent publishes a machine-readable Agent Card at a well-known URL:

```
GET https://agent.example.com/.well-known/agent.json
```

The Agent Card contains:
```json
{
  "name": "research-agent",
  "description": "Performs deep market research with citation tracking",
  "version": "2.1.0",
  "capabilities": [
    {
      "name": "market_research",
      "description": "Multi-source market analysis with competitive landscape",
      "inputSchema": { "type": "object", "properties": { "topic": { "type": "string" } } },
      "outputSchema": { "type": "object", "properties": { "report": { "type": "string" } } }
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  },
  "protocols": ["a2a/1.0"],
  "endpoints": {
    "rpc": "https://agent.example.com/a2a/rpc"
  }
}
```

**Key fields:**
- `capabilities` — what the agent can do, with typed input/output schemas
- `authentication` — how to authorize requests
- `endpoints.rpc` — where to send JSON-RPC requests

**Discovery pattern:** A client agent can crawl known agent registries or directly
fetch `/.well-known/agent.json` from a known host to discover available agents and
their capabilities at runtime.

### 4.3 Communication: HTTP + JSON-RPC 2.0

A2A uses standard HTTP as the transport layer with JSON-RPC 2.0 as the message format.
This means any language, any framework, any infrastructure can participate.

**Request example:**
```json
{
  "jsonrpc": "2.0",
  "method": "market_research",
  "params": {
    "topic": "AI employee platforms market size 2026",
    "depth": "comprehensive",
    "sources": ["academic", "industry", "news"]
  },
  "id": "req-abc-123"
}
```

**Response example:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "report": "The AI employee platform market is projected to reach...",
    "sources": ["source1.com", "source2.com"],
    "confidence": 0.87
  },
  "id": "req-abc-123"
}
```

### 4.4 Streaming via Server-Sent Events (SSE)

For long-running tasks, A2A supports SSE streaming. The client sends a standard
JSON-RPC request and receives incremental updates via an SSE connection:

```
POST /a2a/rpc
Content-Type: application/json
Accept: text/event-stream

{"jsonrpc":"2.0","method":"deep_research","params":{...},"id":"req-456"}
```

**SSE stream:**
```
event: progress
data: {"status": "searching", "progress": 0.2, "message": "Scanning 47 sources..."}

event: progress
data: {"status": "analyzing", "progress": 0.6, "message": "Cross-referencing findings..."}

event: result
data: {"jsonrpc": "2.0", "result": {...}, "id": "req-456"}
```

This is particularly valuable for research agents and content generation agents
where execution can take minutes rather than seconds.

### 4.5 Atlas UX and A2A

Atlas UX agents currently communicate through the internal job queue and engine loop.
A2A becomes relevant when:
- External agents need to interact with Atlas UX agents (partner integrations)
- Atlas UX agents need to consume capabilities from external A2A-compliant agents
- The platform evolves to support multi-tenant agent marketplaces

An A2A adapter for Atlas UX would expose each agent's capabilities as an Agent Card
and translate JSON-RPC calls into internal job queue entries.

---

## 5. Anthropic's Model Context Protocol (MCP)

### 5.1 What MCP Solves

MCP addresses a different but complementary problem to A2A: how do agents access
tools, data sources, and external systems through a standardized interface?

While A2A is agent-to-agent, MCP is agent-to-tool (or more precisely,
model-to-context).

### 5.2 Architecture: Server-Client Model

```
[LLM / Agent] <---> [MCP Client] <---> [MCP Server: Tools + Resources]
```

- **MCP Server:** Exposes tools (functions the agent can call), resources (data the
  agent can read), and prompts (templates the agent can use).
- **MCP Client:** Embedded in the agent's runtime; discovers and invokes server
  capabilities.
- **Transport:** Stdio (local), HTTP+SSE (remote), or custom transports.

### 5.3 Tool Exposure via MCP

An MCP server exposes tools with typed schemas:

```json
{
  "name": "send_email",
  "description": "Send an email via Microsoft Graph API",
  "inputSchema": {
    "type": "object",
    "properties": {
      "to": { "type": "string", "description": "Recipient email address" },
      "subject": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["to", "subject", "body"]
  }
}
```

The agent discovers available tools at connection time, then calls them by name with
typed parameters. The MCP server handles execution, authentication, and error wrapping.

### 5.4 MCP Complements A2A

The two protocols occupy different layers:

| Layer | Protocol | Purpose |
|-------|----------|---------|
| Agent-to-Agent | A2A | Discovery, delegation, inter-agent communication |
| Agent-to-Tool | MCP | Tool access, data retrieval, context provision |

An agent might use A2A to discover a peer agent's capabilities, then use MCP to invoke
the tools exposed by that peer. The protocols are designed to work together, not compete.

### 5.5 Atlas UX Tool Ecosystem and MCP

Atlas UX's `agentTools.ts` already implements a tool registry pattern that is
structurally similar to MCP:

```typescript
// Current Atlas UX tool definition pattern
{
  name: "send_telegram_message",
  description: "Send a message via Telegram bot",
  parameters: {
    type: "object",
    properties: {
      chat_id: { type: "string" },
      message: { type: "string" }
    }
  }
}
```

Migrating to MCP would provide:
- Standardized tool discovery across all agent frameworks
- Built-in authorization scope management
- Tool versioning and deprecation support
- Third-party tool marketplace compatibility

---

## 6. Framework Implementations

### 6.1 CrewAI: Crew and Process

CrewAI models multi-agent systems using two core concepts:

**Crew:** A team of agents with defined roles, tools, and a shared objective.
**Process:** The execution strategy that determines how agents collaborate.

```python
# CrewAI topology selection
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    process=Process.sequential   # Pipeline topology
    # process=Process.hierarchical  # Supervisor topology with manager
)
```

**Process types:**
- `Process.sequential` — Pipeline topology. Tasks execute in order. Output of task N
  becomes input of task N+1.
- `Process.hierarchical` — Supervisor topology. A manager agent decomposes work and
  delegates to specialists. CrewAI automatically creates the manager.

**Mapping to Atlas UX:** CrewAI's sequential process maps to Atlas UX's content
pipeline (Archy -> Sunday -> Venny -> Publishers). CrewAI's hierarchical process maps
to Atlas's strategic decomposition pattern.

### 6.2 Google ADK: SequentialAgent and ParallelAgent

Google's Agent Development Kit (ADK) provides first-class topology primitives:

**SequentialAgent:** Executes a list of sub-agents in order.
```python
pipeline = SequentialAgent(
    name="content_pipeline",
    sub_agents=[research_agent, writing_agent, image_agent, publish_agent]
)
```

**ParallelAgent:** Executes sub-agents concurrently, collects all results.
```python
intel_sweep = ParallelAgent(
    name="platform_intel",
    sub_agents=[x_scanner, fb_scanner, reddit_scanner, linkedin_scanner]
)
```

**LoopAgent:** Repeats a sub-agent until a termination condition is met.
```python
refinement = LoopAgent(
    name="content_refinement",
    sub_agent=editor_agent,
    max_iterations=5
)
```

**Composition:** ADK agents compose naturally. A SequentialAgent can contain a
ParallelAgent as one of its steps:
```python
full_workflow = SequentialAgent(
    name="full_content_workflow",
    sub_agents=[
        intel_sweep,          # ParallelAgent: gather data
        research_agent,       # Single agent: synthesize
        refinement,           # LoopAgent: polish
        publish_parallel      # ParallelAgent: multi-platform publish
    ]
)
```

**Mapping to Atlas UX:** ADK's composition model closely mirrors how Atlas UX workflows
chain agents. WF-106 (Atlas Daily Aggregation) is effectively a SequentialAgent
containing a ParallelAgent (13-agent intel sweep) followed by Atlas's synthesis step.

### 6.3 LangGraph: State Machines and Conditional Routing

LangGraph models agent topologies as directed graphs where nodes are agents (or
functions) and edges define control flow.

```python
from langgraph.graph import StateGraph

workflow = StateGraph(AgentState)
workflow.add_node("researcher", research_agent)
workflow.add_node("writer", writing_agent)
workflow.add_node("reviewer", review_agent)

workflow.add_edge("researcher", "writer")
workflow.add_conditional_edges("reviewer", quality_check, {
    "pass": END,
    "fail": "writer"   # Loop back for revision
})
```

**Topology flexibility:** LangGraph can model any topology because it is a general
graph framework. Supervisor, hierarchical, network, and custom topologies are all
expressible as graph structures.

**Conditional routing:** Edges can be conditional — the output of one node determines
which node executes next. This enables dynamic topology changes at runtime based on
task requirements or agent output quality.

---

## 7. Designing Your Topology: Decision Framework

### 7.1 Start with These Questions

1. **How many agents do you have?**
   - 1: Single agent (trivial)
   - 2-5: Network or supervisor
   - 6-15: Supervisor or hierarchical
   - 15+: Hierarchical or custom hybrid

2. **Is there a natural authority hierarchy?**
   - Yes: Hierarchical topology maps cleanly
   - No: Network or supervisor-as-tool

3. **Do agents need to talk to each other, or only to a coordinator?**
   - Peer communication needed: Network elements
   - Central coordination sufficient: Supervisor

4. **How important is fault tolerance?**
   - Critical: Avoid single-supervisor SPOF; add redundancy or use network
   - Moderate: Supervisor with failover is sufficient

5. **What is your latency budget?**
   - Tight (< 5s): Minimize hops; prefer flat topologies
   - Relaxed (minutes): Hierarchical decomposition is fine

### 7.2 Evolution Path

Most systems follow this evolution:

```
Single Agent -> Supervisor -> Hierarchical -> Custom Hybrid
```

Atlas UX followed this path. Early prototypes used Atlas as a single agent. As agent
count grew, a supervisor pattern emerged. When the agent roster hit 30+, hierarchical
decomposition with the `reportsTo` chain became necessary for scalability and
accountability.

---

## 8. Anti-Patterns

### 8.1 Premature Network Topology

Deploying a fully connected peer-to-peer network with 20+ agents. The O(n^2)
communication paths create message storms, circular dependencies, and debugging
nightmares. Start with hierarchy, add peer connections only where proven necessary.

### 8.2 Single Supervisor Bottleneck

Routing all work through one supervisor without delegation authority. As task volume
grows, the supervisor becomes a latency bottleneck and a single point of failure.
Solution: add mid-level supervisors (Atlas UX's department head pattern).

### 8.3 Topology Without Authority Model

Defining how agents communicate without defining who can authorize what. Communication
topology and authority topology must be designed together. Atlas UX's SGL policies
bind authority levels to each layer of the hierarchy.

### 8.4 Ignoring Communication Cost

Every inter-agent message is (at minimum) an LLM inference call. A 4-layer hierarchy
with 3 hops per task means 3x the token cost of a flat supervisor. Account for this
in your token budget and latency estimates.

### 8.5 Static Topology for Dynamic Workloads

Using a fixed topology when workload characteristics vary significantly. A content
pipeline needs sequential handoffs; an emergency response needs broadcast. Design
your system to support multiple topologies activated by workflow type (as Atlas UX
does with its workflow registry).

---

## 9. Atlas UX Topology Summary

Atlas UX implements a **hierarchical backbone with hybrid overlays**:

```
Primary: Hierarchical (org chart with reportsTo chain)
Overlay 1: Pipeline (content production — research to publish)
Overlay 2: Broadcast (intel sweeps — parallel platform scanning)
Overlay 3: Supervisor-as-Tool (Sunday supporting publisher agents)
Overlay 4: Map-Reduce (daily aggregation — parallel gather, serial synthesis)
```

The engine loop (`workers/engineLoop.ts`) is topology-agnostic. It processes jobs from
the queue regardless of which topology created them. Topology is encoded in how jobs
reference each other (dependencies, delegation chains) and how agents are configured
(reportsTo, authority levels, tool access).

This separation of topology (job creation patterns) from execution (engine loop
processing) is what allows Atlas UX to support multiple simultaneous topologies
without engine loop modifications.

---

## 10. Key Takeaways

1. **Choose topology based on team size, authority needs, and latency budget.** There is
   no universal best topology.

2. **Hierarchical is the default for production systems with 10+ agents.** It scales,
   it is auditable, and it maps to natural organizational structures.

3. **A2A enables inter-system agent communication** via discoverable Agent Cards and
   standard JSON-RPC. Use it when agents from different systems need to interoperate.

4. **MCP standardizes tool access** and complements A2A. Together they cover the full
   spectrum of agent-to-agent and agent-to-tool communication.

5. **Real systems are hybrids.** Atlas UX uses hierarchical as the backbone but
   activates pipeline, broadcast, supervisor-as-tool, and map-reduce overlays based on
   workflow type.

6. **Separate topology from execution.** The engine loop should be topology-agnostic.
   Topology is encoded in job relationships, not in the loop itself.

7. **Design authority alongside communication.** Every topology needs a corresponding
   authority model that defines who can approve, delegate, and escalate.
