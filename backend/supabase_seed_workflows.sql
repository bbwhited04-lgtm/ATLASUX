-- Atlas UX — Supabase seed: workflows + workflow_steps + atlas_workflows
-- Generated: 2026-02-23T14:43:54.460190Z
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflows') THEN
    CREATE TABLE workflows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_key text UNIQUE NOT NULL,
      agent_key text NOT NULL,
      name text NOT NULL,
      version text NOT NULL DEFAULT '1.0.0',
      status text NOT NULL DEFAULT 'ready',
      trigger jsonb NOT NULL DEFAULT '{}'::jsonb,
      policy jsonb NOT NULL DEFAULT '{}'::jsonb,
      outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflow_steps') THEN
    CREATE TABLE workflow_steps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_key text NOT NULL,
      step_order int NOT NULL,
      step_id text NOT NULL,
      step_type text NOT NULL,
      description text NULL,
      config jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT workflow_steps_workflow_key_fkey
        FOREIGN KEY (workflow_key) REFERENCES workflows(workflow_key)
        ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX workflow_steps_workflow_step_id_uq ON workflow_steps(workflow_key, step_id);
    CREATE UNIQUE INDEX workflow_steps_workflow_step_order_uq ON workflow_steps(workflow_key, step_order);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='atlas_workflows') THEN
    CREATE TABLE atlas_workflows (
      workflow_id text PRIMARY KEY,
      agent_key text NOT NULL,
      workflow_doc jsonb NOT NULL,
      status text NOT NULL DEFAULT 'ready',
      version text NULL,
      name text NULL,
      trigger_type text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agents') THEN
    -- Add FK only if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name='workflows_agent_key_fkey' AND table_name='workflows'
    ) THEN
      ALTER TABLE workflows
        ADD CONSTRAINT workflows_agent_key_fkey
        FOREIGN KEY (agent_key) REFERENCES agents(agent_key)
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- === SEED DATA ===
-- (Native/WF-* workflow inserts go here)
