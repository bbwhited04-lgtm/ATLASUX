-- Tool proposals table for WF-107 Atlas Tool Discovery & Proposal.
-- Atlas generates numbered tool suggestions for each agent and emails Billy
-- for approve/deny. On approval, tool is added to KB and agent SKILL.md.

CREATE TABLE tool_proposals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id       TEXT        NOT NULL,
  tool_name      TEXT        NOT NULL,
  tool_purpose   TEXT        NOT NULL,
  tool_impl      TEXT,
  approval_token TEXT        NOT NULL UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  run_id         TEXT,
  decided_at     TIMESTAMPTZ,
  decided_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tool_proposals_status_idx ON tool_proposals(tenant_id, status);
CREATE INDEX tool_proposals_token_idx  ON tool_proposals(approval_token);
