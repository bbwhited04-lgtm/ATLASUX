-- Agent memory table for deep agent pipeline.
-- Stores per-agent, per-session conversation turns (user + assistant) in Postgres.
-- Used by Planning and Verification sub-agents to maintain context across turns.

CREATE TABLE agent_memory (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id   TEXT        NOT NULL,
  session_id TEXT        NOT NULL,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookups by session
CREATE INDEX agent_memory_session_idx ON agent_memory(tenant_id, agent_id, session_id);
-- Fast time-ordered retrieval within a session
CREATE INDEX agent_memory_time_idx    ON agent_memory(tenant_id, agent_id, session_id, created_at DESC);
