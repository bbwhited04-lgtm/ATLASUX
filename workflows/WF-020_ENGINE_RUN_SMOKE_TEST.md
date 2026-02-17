# WF-020 — Engine Run Smoke Test (ATLAS)

**Owner Agent:** ATLAS  
**Goal:** Verify cloud-surface engine is operational end-to-end.

## Trigger
- POST /v1/engine/run

## Inputs
```json
{
  "tenantId": "uuid",
  "agentId": "string",
  "workflowId": "WF-###",
  "input": {},
  "traceId": "string"
}
```

## Steps
1. Create Intent (status DRAFT)
2. Write audit: ENGINE_RUN_REQUESTED
3. (Option A) return intentId immediately for async processing
4. (Option B) optionally call /tick to process one cycle (dev only)

## Outputs
- intentId
- audit events
