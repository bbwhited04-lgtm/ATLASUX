-- Content Jobs schema for Atlas UX
-- Run AFTER audit_ledger_schema.sql (or anytime; it's independent).

create extension if not exists pgcrypto;

create table if not exists public.content_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  user_id text not null,

  kind text not null default 'generic',     -- e.g. social.post, email.draft
  provider text not null default 'unknown', -- openai, deepseek, etc.
  model text,

  status text not null default 'queued',    -- queued|running|succeeded|failed|canceled

  input jsonb,
  output jsonb,
  error text,
  request_id text,

  est_cost_usd numeric,
  actual_cost_usd numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_jobs_created_at_idx on public.content_jobs (created_at desc);
create index if not exists content_jobs_org_idx on public.content_jobs (org_id);
create index if not exists content_jobs_user_idx on public.content_jobs (user_id);
create index if not exists content_jobs_status_idx on public.content_jobs (status);

-- Optional: keep updated_at fresh on updates
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_content_jobs_updated_at on public.content_jobs;
create trigger trg_content_jobs_updated_at
before update on public.content_jobs
for each row execute function public.set_updated_at();
