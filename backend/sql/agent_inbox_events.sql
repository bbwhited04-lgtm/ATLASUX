-- Alpha: inbound email events
-- Run this in Supabase SQL editor (once) before enabling /v1/email/inbound persistence.

create table if not exists agent_inbox_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  agent_key text not null,
  inbox_email text not null,
  provider text not null default 'manual',
  provider_message_id text,
  from_email text,
  from_name text,
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz not null default now(),
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate ingestion from providers
create unique index if not exists agent_inbox_events_provider_msg_uidx
  on agent_inbox_events (provider, provider_message_id)
  where provider_message_id is not null;

create index if not exists agent_inbox_events_tenant_time_idx
  on agent_inbox_events (tenant_id, received_at desc);

create index if not exists agent_inbox_events_agent_time_idx
  on agent_inbox_events (agent_key, received_at desc);
