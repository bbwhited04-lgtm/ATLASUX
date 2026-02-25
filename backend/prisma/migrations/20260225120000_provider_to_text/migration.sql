-- Change integrations.provider from enum to plain text.
-- This allows storing any provider key (meta, x, reddit, tumblr, linkedin, pinterest, etc.)
-- without being blocked by enum constraints.
-- NOTE: No transaction wrapper needed — ALTER COLUMN TYPE is safe in PG14+.
ALTER TABLE integrations ALTER COLUMN provider TYPE TEXT;
DROP TYPE IF EXISTS integration_provider CASCADE;
