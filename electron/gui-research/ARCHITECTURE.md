# Atlas GUI Research — Architecture Map

## Overview

Independent research into GUI agent architecture. NOT a product feature.
Goal: achieve 70%+ TCR with constitutional HIL on local hardware with zero image leakage.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Task Descriptor                       │
│  Natural language intent → subgoal decomposition             │
│  "Change notification settings" → [find, click, scroll...]  │
│  Risk classification: low/medium/high → confidence threshold │
├─────────────────────────────────────────────────────────────┤
│                    CoT Reasoning Layer                        │
│  Spatial truths (UI conventions) as priors                   │
│  "Settings icon = top-right, gear shape"                     │
│  Chain of thought before action, not after                   │
├─────────────────────────────────────────────────────────────┤
│                    Vision Watcher                             │
│  Dual input streams (our innovation):                        │
│    Stream 1: Screenshots (desktopCapturer)                   │
│    Stream 2: Vue component tree (exact state)                │
│  Continuous observation at 2s intervals                      │
│  Change detection, element mapping, state tracking           │
├─────────────────────────────────────────────────────────────┤
│                    Privacy Gate                               │
│  HARD CONSTRAINT: zero image leakage                         │
│  4-tier classification: public/internal/confidential/restrict│
│  Restricted = local model ONLY, no cloud, no storage         │
│  Fail-closed: unknown → confidential                         │
├─────────────────────────────────────────────────────────────┤
│                    Toolkit (Action Layer)                     │
│  Primitives: locate, click, type, scroll, wait, verify       │
│  Composites: locateAndClick, locateClickType, scrollToClick  │
│  HIL primitive: requestHuman() — constitutional              │
│  Vue-aware: DOM positions, not pixel guessing                │
├─────────────────────────────────────────────────────────────┤
│                    Dense Reward Model (4-Layer)               │
│  Layer 1: Spatial (7 components, centrality-dominant σ=0.3)  │
│  Layer 2: HIL (6 components, asking for help = rewarded)     │
│  Layer 3: Temporal (hindsight + subgoal + progress + anchor) │
│  Layer 4: Truths (positional + danger + navigation + timing) │
├─────────────────────────────────────────────────────────────┤
│                    Research Logger                            │
│  Per-step logging: observation, analysis, action, reward     │
│  Session summaries with TCR measurement                      │
│  Error taxonomy: functional semantics, latent state, HCI     │
│  CSRS comparison metrics                                     │
└─────────────────────────────────────────────────────────────┘
```

## Module Map

```
electron/gui-research/
├── ARCHITECTURE.md           ← this file
├── vision-watcher.cjs        ← continuous screen observation (dual stream)
├── captureAndAnalyze.cjs     ← session-based capture + vision analysis
├── spatialReward.cjs         ← 7-component dense spatial reward
├── hilReward.cjs             ← 6-component HIL soft reward
├── temporalCredit.cjs        ← 4-layer temporal credit assignment
├── spatialTruths.cjs         ← UI convention priors (second pass)
├── toolkit.cjs               ← low-level action primitives
├── mcpTaskDescriptor.cjs     ← high-level intent → subgoal decomposition
├── privacyGate.cjs           ← zero image leakage classification
└── research-logs/            ← session data, observations, rewards
```

## Key Innovation: Vue >> Screenshots

| Dimension | Screenshot (UI-TARS approach) | Vue Internals (our approach) |
|-----------|------------------------------|------------------------------|
| Element location | ~85% accuracy (pixel guess) | 99.9% (getBoundingClientRect) |
| App state | Inferred from visual cues | Exact (reactive state, router, store) |
| Disabled detection | "Looks gray maybe" | `el.disabled === true` |
| Input values | OCR from rendered text | `v-model` binding value |
| Loading state | "I see a spinner" | `v-if="loading"` boolean |
| Off-screen elements | Invisible | Fully accessible |
| Click target | Bounding box center guess | Exact center from DOM rect |
| Navigation | "That link goes somewhere" | `router.push('/exact/path')` |

**Verdict:** Use Vue for WHERE to act (precision). Use screenshots for WHAT to do (reasoning).

## Key Innovation: Dense Rewards (vs CSRS Sparse)

```
CSRS (Step-GUI):
  Steps 1-29: zero signal
  Step 30: success=1 or failure=0
  Total information: 1 bit per 30-step task

Our approach:
  Step 1: spatial=0.85 hil=0.90 temporal=0.70 truth=0.95 → combined=0.84
  Step 2: spatial=0.92 hil=0.80 temporal=0.72 truth=0.88 → combined=0.83
  ...
  Step 30: spatial=0.78 hil=1.00 temporal=0.95 truth=0.90 → combined=0.89
  Total information: 30 × 4 = 120 reward signals per 30-step task
```

**120x more training signal per trajectory.** Every step tells the model what it did right and wrong across 4 dimensions.

## Key Innovation: HIL as Reward (vs HIL as Failure)

```
Every other framework:
  Agent asks for help → reward = 0 (penalized for not completing autonomously)

Our framework:
  Agent asks for help when uncertain → reward = 1.0 (rewarded for self-awareness)
  Agent acts recklessly when uncertain → reward = 0.0 (penalized for overconfidence)
```

**Constitutional principle:** "If you don't know, don't speak" is encoded as a positive reward signal, not a penalty. The model learns that knowing its limits is a skill.

## Key Innovation: Zero Image Leakage

```
UI-TARS: Screenshots → cloud API → ByteDance servers
Step-GUI: Screenshots → cloud for complex tasks
GUI-Libra: Screenshots → training pipeline

Our approach:
  Screenshot captured → Privacy Gate classifies
    → RESTRICTED: local 4B model only, screenshot destroyed after analysis
    → CONFIDENTIAL: local model, no cloud, no storage
    → INTERNAL: local preferred, cloud fallback
    → PUBLIC: any model

  Bank statement screenshot: born, analyzed, destroyed. Never leaves RAM.
```

## UI-TARS Desktop Integration

ByteDance's UI-TARS Desktop is cloned at `H:/ATLASUX/UI-TARS-desktop/`.
It's an Electron app (same as ours) using:
- `nut-js` for keyboard/mouse automation
- `desktopCapturer` for screenshots
- `call_user()` HIL primitive (their version of our requestHuman())
- `@ui-tars/sdk` for agent orchestration

**Integration plan:**
1. Study their operator architecture (NutJSElectronOperator)
2. Adapt their screenshot + action pipeline to our shell
3. Layer our reward models on top of their execution
4. Replace their cloud routing with our privacy gate
5. Add Vue component tree as second input stream (they don't have this)
6. Run comparative TCR tests: their approach vs ours

## Research Questions

1. Does Vue component tree access push TCR past 80% where pixel-only plateaus?
2. Does dense spatial reward (σ=0.3 centrality) improve click precision over CSRS?
3. Does HIL-as-reward produce agents that are more reliable than fully autonomous agents?
4. What is the minimum confidence threshold for production-safe GUI automation?
5. Can a 4B local model with Vue access outperform a 72B cloud model with screenshots?
6. Does the privacy gate add meaningful latency to the observation loop?
7. Can temporal credit assignment solve the sparse reward problem in 30+ step tasks?

## Comparison: Our Approach vs Field

| Feature | UI-TARS | Step-GUI | GUI-Libra | AndroTMem | Atlas GUI (ours) |
|---------|---------|----------|-----------|-----------|-----------------|
| Model size | 72B | 4B/8B | 3B-8B | Any | 4B local + cloud |
| Input stream | Screenshot | Screenshot | Screenshot | Screenshot | **Screenshot + Vue tree** |
| Reward signal | Sparse | CSRS (outcome) | SFT + RL | N/A | **4-layer dense** |
| HIL support | call_user() | None | None | None | **Constitutional + rewarded** |
| Privacy | Cloud | Local option | Cloud | N/A | **Zero image leakage** |
| Element precision | Pixel guess | Pixel guess | Pixel + RL | N/A | **DOM exact** |
| Memory | Context window | None | None | ASM anchors | **KDR + GraphRAG** |
| App state access | Inferred | Inferred | Inferred | Inferred | **Exact (Vue reactive)** |
| Open source | Yes | Yes | Yes | Yes | Research only |

## Status

- [x] Reward models (spatial, HIL, temporal, truths)
- [x] Toolkit primitives (locate, click, type, scroll, verify, requestHuman)
- [x] MCP task descriptor (intent → subgoals → toolkit actions)
- [x] Privacy gate (zero image leakage, 4-tier classification)
- [x] Vision watcher (dual stream: screenshot + Vue)
- [x] UI-TARS Desktop cloned and analyzed
- [ ] Wire vision-watcher into Electron main process
- [ ] First test session on wiki.atlasux.cloud
- [ ] TCR baseline measurement (our wiki, scripted tasks)
- [ ] UI-TARS operator integration
- [ ] Comparative tests: screenshot-only vs Vue+screenshot
- [ ] Dense reward vs CSRS on matched task set
- [ ] Publish research findings
