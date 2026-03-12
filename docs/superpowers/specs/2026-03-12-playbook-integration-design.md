# Atlas Playbook ↔ Atlas UX Integration

**Date:** 2026-03-12
**Status:** Approved

## Overview

Integrate the `atlas-playbook/` strategic knowledge library into Atlas UX's existing KB pipeline, agent tools, workflow system, and query classifier. Owner-tenant only.

## Layer 1: KB Ingestion

Extend `backend/scripts/ingestAgentsToKb.ts` to walk `atlas-playbook/agents/` and `atlas-playbook/frameworks/`. Each markdown file becomes a `KbDocument` with:
- Slugs: `playbook/agent/{name}`, `playbook/framework/{name}`
- Category tag: `playbook`
- Status: `published`
- Owner-tenant scoped

Existing `kb:chunk-docs` script handles chunking and Pinecone upsert.

## Layer 2: Playbook Search Tool

New tool `search_playbook` in `agentTools.ts`:
- Wraps existing KB search, filtered to `playbook/*` slugs
- Available to all deepMode agents (Atlas, Binky, Tina, Cheryl, Larry)
- Returns structured results with source file reference

## Layer 3: SMART-LOADER Workflows

Registered in `backend/src/workflows/registry.ts`:
- **WF-400**: Strategic Review — Market & Strategy (Phase A)
- **WF-401**: Strategic Review — Product & Engineering (Phase B)
- **WF-402**: Strategic Review — Launch & Revenue (Phase C)
- **WF-403**: Strategic Review — Advisor Review (Phase D)
- **WF-404**: Quick Playbook Lookup (single-topic SMART-LOADER routing)

All owned by Atlas. Outputs stored as org memory with source `atlas-playbook`.

## Layer 4: Query Classifier Patterns

Add keyword patterns to `queryClassifier.ts` routing playbook-related questions to `FULL_RAG` tier:
- "pricing strategy", "unit economics", "revenue model"
- "Lucy edge cases", "Mercer compliance", "call script"
- "launch plan", "first customers", "GTM"
- "positioning", "competitive", "market sizing"
- "onboarding flow", "churn", "retention"

## Constraints

- No new Prisma models (uses existing KbDocument/KbChunk)
- No frontend changes
- No changes to deep agent pipeline
- No new dependencies
- SGL compliant (no external side-effects, no regulated actions)
- Owner-tenant only
