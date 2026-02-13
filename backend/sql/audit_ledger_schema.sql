-- Audit + Ledger schema for Atlas UX
-- Run this in Supabase SQL editor (public schema).

-- Extensions
create extension if not exists pgcrypto;

-- AUDIT LOG
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor_type text not null default 'system', -- user|system|device
  actor_id text,
  org_id text,
  device_id text,
  source text, -- web|tauri|mobile|api
  action text not null,
  entity_type text,
  entity_id text,
  status text not null default 'success', -- success|failure|blocked
  metadata jsonb,
  request_id text,
  ip text,
  user_agent text
);

create index if not exists audit_log_timestamp_idx on public.audit_log (timestamp desc);
create index if not exists audit_log_org_idx on public.audit_log (org_id);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);

-- LEDGER EVENTS (SPEND / CHARGE / CREDIT)
create table if not exists public.ledger_events (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  org_id text,
  user_id text,
  event_type text not null, -- spend|credit|charge
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'recorded', -- recorded|failed|pending
  provider text,
  related_job_id text,
  metadata jsonb
);

create index if not exists ledger_events_timestamp_idx on public.ledger_events (timestamp desc);
create index if not exists ledger_events_org_idx on public.ledger_events (org_id);
create index if not exists ledger_events_job_idx on public.ledger_events (related_job_id);
