# Operations Management

## Purpose

This document equips Atlas UX agents — especially Petra (PM) — with frameworks for designing efficient processes, eliminating bottlenecks, managing capacity, and optimizing workflows. Operations management determines whether strategic intentions become operational reality.

---

## 1. Process Design & Optimization

### Process Flow Analysis

Every process can be decomposed into five element types:

| Symbol | Element | Description | Value-Adding? |
|--------|---------|-------------|---------------|
| O | **Operation** | Transforms inputs (assembling, computing, creating) | Yes |
| → | **Transport** | Moves items between locations/stages | No |
| □ | **Inspection** | Checks quality or conformance | No (necessary waste) |
| D | **Delay** | Waiting for the next step | No |
| ▽ | **Storage** | Held in inventory or queue | No |

**Key insight**: Typically only 5-15% of total process time is value-adding. The rest is waste. Process optimization focuses on eliminating or minimizing non-value-adding steps.

### Process Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Cycle Time** | Time to complete one unit from start to finish | Measures total elapsed time |
| **Processing Time** | Actual time spent working on the unit | Measures value-adding time |
| **Process Efficiency** | Processing Time / Cycle Time | Measures waste ratio |
| **Throughput** | Units completed per unit time | Measures output rate |
| **Throughput Time** | Work in Process / Throughput Rate | Little's Law |
| **Utilization** | Actual Output / Maximum Capacity | Measures resource usage |

### Little's Law

The most important equation in operations management:

```
L = λ × W
```

Where:
- L = Average number of items in the system (WIP)
- λ = Average arrival rate (throughput)
- W = Average time an item spends in the system (cycle time)

**Implications**: To reduce cycle time (W) without reducing throughput (λ), you must reduce WIP (L). This is the mathematical foundation for lean/pull systems.

---

## 2. Theory of Constraints (TOC)

Eliyahu Goldratt's framework: every system has exactly one constraint (bottleneck) that limits total output. Optimizing anything other than the bottleneck is wasted effort.

### The Five Focusing Steps

1. **IDENTIFY** the constraint — Find the step with the longest queue, highest utilization, or lowest throughput
2. **EXPLOIT** the constraint — Maximize the bottleneck's output without adding resources (eliminate idle time, reduce setup time, ensure it never waits for inputs)
3. **SUBORDINATE** everything else — Pace all other steps to the bottleneck's capacity. Running non-bottleneck steps faster just creates excess WIP
4. **ELEVATE** the constraint — Invest to increase the bottleneck's capacity (add resources, upgrade equipment, redesign the step)
5. **REPEAT** — When this constraint is broken, a new one emerges. Return to Step 1

### Drum-Buffer-Rope

- **Drum**: The bottleneck sets the pace for the entire system
- **Buffer**: Maintain a time or inventory buffer before the bottleneck so it never starves
- **Rope**: Release new work into the system at the bottleneck's pace, not faster

### Agent Application

Petra must identify bottlenecks in agent workflows. If the content creation pipeline produces faster than the approval workflow can process, stacking more content tasks is waste. The approval workflow is the drum. All content scheduling should be subordinated to approval throughput.

---

## 3. Lean Principles

Derived from the Toyota Production System (TPS). The five lean principles:

### 1. Define Value
Value is defined by the customer, not the producer. Only the customer can determine what they are willing to pay for.

### 2. Map the Value Stream
Identify every step in the process, classify as value-adding, necessary waste, or pure waste. Use a Value Stream Map (VSM) to visualize material and information flow.

### 3. Create Flow
Eliminate batching and queuing. Ideally, work flows continuously from start to finish without stops. One-piece flow is the ideal (but not always practical).

### 4. Establish Pull
Produce only when the next step (or customer) signals demand. Do not push work into the system based on forecasts. Kanban boards implement pull systems visually.

### 5. Pursue Perfection
Continuous improvement (Kaizen). The process is never "done." Regularly identify and eliminate the next layer of waste.

### The Eight Wastes (TIMWOODS)

| Waste | Definition | Agent Example |
|-------|-----------|---------------|
| **T**ransportation | Unnecessary movement of materials/information | Redundant data transfers between agents |
| **I**nventory | Excess WIP or finished goods | Backlog of unprocessed tasks in queues |
| **M**otion | Unnecessary movement of people/agents | Agent switching between unrelated tasks |
| **W**aiting | Idle time between process steps | Agent waiting for approval, API response, or dependency |
| **O**verproduction | Making more than needed, or making it too soon | Creating content nobody requested |
| **O**verprocessing | Doing more work than the customer requires | Excessive report formatting, unnecessary analysis depth |
| **D**efects | Rework, errors, corrections | Tasks that fail review and must be redone |
| **S**kills underutilization | Not leveraging available capabilities | Senior agent doing routine tasks |

---

## 4. Six Sigma — DMAIC

Six Sigma targets process variation reduction. The goal is 3.4 defects per million opportunities.

### DMAIC Methodology

**Define**: What is the problem? Who is the customer? What are the requirements? Create a project charter with scope, goals, timeline, and team.

**Measure**: What is the current performance? Establish baseline metrics. Identify what data to collect and ensure measurement system accuracy.

**Analyze**: What are the root causes? Use tools:
- **Fishbone (Ishikawa) diagram**: Map potential causes across categories (People, Process, Equipment, Materials, Environment, Management)
- **Pareto analysis**: 80/20 rule — 80% of problems come from 20% of causes. Focus on the vital few
- **5 Whys**: Ask "why" repeatedly until you reach the root cause, not just symptoms
- **Scatter plots and correlation**: Identify relationships between variables

**Improve**: What changes will address root causes? Design solutions, pilot test, validate results. Use design of experiments (DOE) to test multiple factors efficiently.

**Control**: How do we sustain the improvement? Implement control charts, standard operating procedures, monitoring dashboards. Ensure the process does not regress.

### Process Capability

```
Cp = (Upper Spec Limit - Lower Spec Limit) / (6 × σ)
```

- Cp < 1.0: Process is not capable (produces defects)
- Cp = 1.0: Barely capable
- Cp = 1.33: Capable
- Cp ≥ 2.0: Six Sigma level

---

## 5. Quality Management

### Total Quality Management (TQM)

Organization-wide commitment to continuous improvement and customer satisfaction. Principles:
1. Customer focus in all decisions
2. Total employee involvement
3. Process-centered thinking
4. Integrated system approach
5. Strategic and systematic improvement
6. Fact-based decision making
7. Clear and frequent communication

### Cost of Quality

| Category | Type | Examples |
|----------|------|----------|
| **Prevention costs** | Investment to prevent defects | Training, process design, quality planning |
| **Appraisal costs** | Cost of measuring and inspecting | Testing, audits, reviews |
| **Internal failure costs** | Defects caught before delivery | Rework, scrap, retesting |
| **External failure costs** | Defects caught after delivery | Returns, warranties, reputation damage, lawsuits |

**Key insight**: Prevention costs are the cheapest. External failure costs are 10-100x more expensive than prevention. Invest in getting it right the first time.

---

## 6. Capacity Planning

### Capacity Measurement

```
Design Capacity: Maximum output under ideal conditions
Effective Capacity: Maximum output accounting for maintenance, breaks, changeovers
Actual Output: What is actually produced

Utilization = Actual Output / Design Capacity
Efficiency = Actual Output / Effective Capacity
```

### Capacity Strategies

- **Lead strategy**: Add capacity before demand materializes. Higher risk, captures market opportunity.
- **Lag strategy**: Add capacity after demand is confirmed. Lower risk, may miss opportunities.
- **Match strategy**: Add capacity incrementally to match demand. Balanced approach.

### Queuing Theory Basics

When demand is variable and capacity is fixed, queues form. Key relationships:

```
ρ = λ / μ  (utilization ratio)
```

Where λ = arrival rate, μ = service rate.

**Critical insight**: Average wait time increases exponentially as utilization approaches 100%. At 80% utilization, waits are manageable. At 95%, waits explode. Never plan for 100% utilization.

| Utilization | Relative Wait Time |
|-------------|-------------------|
| 50% | 1x (baseline) |
| 70% | 2.3x |
| 80% | 4x |
| 90% | 9x |
| 95% | 19x |
| 99% | 99x |

### Agent Application

Petra must plan agent capacity with utilization targets of 70-80%, not higher. This allows agents to handle demand variability and unexpected tasks without queue explosions.

---

## 7. Inventory Management

### Economic Order Quantity (EOQ)

```
EOQ = √(2DS / H)
```

Where:
- D = Annual demand
- S = Order/setup cost per order
- H = Holding cost per unit per year

### Just-In-Time (JIT)

Deliver the right items, in the right quantity, at the right time. Minimizes inventory holding costs but requires reliable supply and smooth demand. Highly sensitive to disruption.

### Safety Stock

```
Safety Stock = Z × σd × √L
```

Where:
- Z = Service level z-score (95% = 1.65, 99% = 2.33)
- σd = Standard deviation of daily demand
- L = Lead time in days

### Reorder Point

```
ROP = (Average Daily Demand × Lead Time) + Safety Stock
```

---

## 8. Project Scheduling — Critical Path Method (CPM)

### Building a Project Network

1. List all activities with durations and dependencies
2. Draw the network diagram (Activity-on-Node)
3. Forward pass: Calculate earliest start (ES) and earliest finish (EF) for each activity
4. Backward pass: Calculate latest start (LS) and latest finish (LF) from project end
5. Calculate slack: Slack = LS - ES = LF - EF
6. **Critical path**: The longest path through the network — all activities with zero slack

**Key insight**: The critical path determines the minimum project duration. Shortening any non-critical activity does not reduce the project timeline. To accelerate the project, you must shorten critical-path activities (crashing) or re-sequence them (fast-tracking).

### Crashing

Adding resources to critical-path activities to reduce their duration. Always crash the cheapest critical-path activity first. Check: does crashing create a new critical path?

### PERT (Three-Point Estimation)

```
Expected Time = (Optimistic + 4×Most Likely + Pessimistic) / 6
Variance = ((Pessimistic - Optimistic) / 6)²
```

---

## 9. Operations Decision Framework for Agents

When Petra or any operations-focused agent evaluates a process:

1. **Map the current process**: Identify all steps, classify value-add vs waste
2. **Identify the bottleneck**: Where is the constraint? (TOC Step 1)
3. **Measure baseline performance**: Cycle time, throughput, defect rate, utilization
4. **Apply DMAIC**: Define the problem, measure, analyze root causes, improve, control
5. **Eliminate waste**: Scan for TIMWOODS categories
6. **Validate capacity**: Is utilization below 80%? Are queues manageable?
7. **Establish pull**: Are we producing based on demand signals or pushing based on capacity?
8. **Monitor and iterate**: Continuous improvement, not one-time fixes

---

## References

- Goldratt, E. (1984). *The Goal*
- Womack, J. & Jones, D. (1996). *Lean Thinking*
- Ohno, T. (1988). *Toyota Production System*
- Pyzdek, T. *The Six Sigma Handbook*
- Heizer, J. & Render, B. *Operations Management*
- Hopp, W. & Spearman, M. *Factory Physics*
