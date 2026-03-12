# Atlas UX Playbook — Smart Loader

## Read this file first. Always. Before any other playbook file.

This routes your request to the right agents and frameworks. Never load everything at once.

---

## Step 1: Classify the Request

```
PATTERN A — SINGLE TOPIC: "Write Lucy's call script" / "Pricing analysis"
→ Load: 1-2 agents + 1 framework. Done in 1 turn.

PATTERN B — MULTI-TOPIC: "Marketing strategy" / "Launch plan"
→ Load: 2-3 agents + 1 framework. Done in 1-2 turns.

PATTERN C — FULL PRODUCT REVIEW: "Full Atlas UX audit"
→ Phased execution across 3-4 turns. See Phase Plan below.

PATTERN D — CONTINUE PREVIOUS: References past work or pastes a KDR.
→ Read the KDR. Resume from where they left off.

PATTERN E — QUICK ANSWER: "Checklist for X" / "What should Lucy say when..."
→ Load: 1 framework only. Quick response.
```

## Step 2: Agent Routing

```
REQUEST CONTAINS              → PRIMARY AGENT(S)     → FRAMEWORK
─────────────────────────────────────────────────────────────────
"Lucy" / "inbound" / "calls"  → 04 (PRD) + 09 (Sec)  → stress-test
"Mercer" / "outbound" / "cold"→ 15 (Marketing)        → launch-engine
"pricing" / "tiers"           → 18 (Finance) + 03     → consulting
"landing page" / "conversion" → 14 (Launch) + 15      → launch-engine
"streaming" / "content"       → 15 (Marketing)        → launch-engine
"roadmap" / "strategy"        → 03 (Strategy)         → founders-playbook
"MVP" / "build" / "feature"   → 04 (PRD) + 06 (Eng)  → mvp-framework
"security" / "data"           → 09 (Security)         → stress-test
"churn" / "support"           → 17 (CX)               → checklists
"persona" / "market"          → 02 (Discovery)        → consulting
"money" / "revenue" / "burn"  → 18 (Finance)          → founders-playbook
"launch" / "first customers"  → 14 (Launch)           → launch-engine
"checklist for"               → (none)                → checklists
"edge cases" / "what if"      → 01 (Advisor)          → stress-test
"review everything"           → Phase Plan (below)
```

## Step 3: Context Budget

```
HARD RULES:
□ Never load more than 4 agent files in a single turn
□ SMART-LOADER is the only file always in context
□ For full reviews: execute in phases, output KDR between each
□ Always load the Advisor (01) alongside any other agent when budget allows
```

## Step 4: Atlas UX Phase Plan

For full product reviews:

```
PHASE A — MARKET & STRATEGY (Turn 1):
  Load: Agent 02 (Discovery) + Agent 03 (Strategy) + consulting-frameworks
  Output: Trade business personas + positioning + pricing validation
  → Output KDR-A

PHASE B — PRODUCT & ENGINEERING (Turn 2):
  Load: Agent 04 (PRD) + Agent 06 (Engineering) + Agent 09 (Security)
  Input: KDR-A
  Output: Lucy/Mercer specs + architecture + security audit
  → Output KDR-B

PHASE C — LAUNCH & REVENUE (Turn 3):
  Load: Agent 14 (Launch) + Agent 15 (Marketing) + Agent 18 (Finance)
  Input: KDR-A + KDR-B
  Output: GTM plan + streaming strategy + unit economics
  → Output KDR-C

PHASE D — ADVISOR REVIEW (Turn 4):
  Load: Agent 01 (Advisor) + Agent 17 (CX)
  Input: All KDRs
  Output: Blind spots + customer success plan + final recommendations
  → Output MASTER KDR
```

---

## KDR (Key Decision Record) System

After every phase, output a KDR block. These survive chat compaction and can be
pasted into new conversations to resume exactly where you left off.

```
╔══════════════════════════════════════════════════╗
║ KDR: ATLAS UX — PHASE [X] COMPLETE              ║
║ Date: [Date] | Phase: [X of Y]                   ║
╠══════════════════════════════════════════════════╣
║ PRODUCT: Atlas UX                                ║
║ TYPE: B2B SaaS — AI voice agents for trades      ║
║ MARKETS: US small businesses (trades)            ║
║ USERS: Trade business owners (salons, plumbers…) ║
║ PROBLEM: Missed calls = lost customers           ║
║ SOLUTION: Lucy answers, Mercer prospects         ║
║                                                  ║
║ DECISIONS MADE THIS PHASE:                       ║
║ 1. [Decision]: [Choice] → because [reason]       ║
║                                                  ║
║ KEY SPECS:                                       ║
║ • Revenue: SaaS $39-$249/mo + Enterprise $35-40  ║
║ • Agents: Lucy (inbound), Mercer (outbound)      ║
║ • Marketing: Multi-stream + short-form video     ║
║                                                  ║
║ OPEN ITEMS:                                      ║
║ • [What still needs to be decided/built]         ║
║                                                  ║
║ NEXT: Phase [X+1] — [What it covers]             ║
╚══════════════════════════════════════════════════╝
```

### Memory Rules
1. Output a KDR after every phase — non-negotiable
2. Capture ALL decisions, not just major ones
3. When pasting a KDR into a new chat, trust it as ground truth
4. Number all decisions sequentially across phases
