-- EFI Supabase/Postgres baseline schema

create table if not exists public.efi_user_progress (
  email text primary key,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.efi_user_purchases (
  id text primary key,
  email text not null,
  purchased_at timestamptz not null default now(),
  total numeric(10,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  receipt text,
  credential_id text
);
create index if not exists idx_efi_user_purchases_email on public.efi_user_purchases(email);

create table if not exists public.efi_payments (
  payment_intent_id text primary key,
  status text not null,
  email text,
  amount numeric(10,2),
  currency text,
  raw jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.efi_submissions (
  id text primary key,
  email text not null,
  kind text not null,
  module_id text,
  evidence_url text,
  notes text,
  status text not null,
  score integer,
  feedback jsonb,
  submitted_at timestamptz not null default now(),
  release_at timestamptz,
  notified_at timestamptz
);
create index if not exists idx_efi_submissions_email on public.efi_submissions(email);
create index if not exists idx_efi_submissions_release on public.efi_submissions(release_at);

create table if not exists public.efi_leads (
  lead_id text primary key,
  captured_at timestamptz not null default now(),
  email text,
  name text,
  source text,
  lead_type text,
  consent jsonb not null default '{}'::jsonb,
  campaign jsonb,
  metadata jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb
);
create index if not exists idx_efi_leads_email on public.efi_leads(email);
create index if not exists idx_efi_leads_captured_at on public.efi_leads(captured_at);

create table if not exists public.efi_events (
  event_id text primary key,
  at timestamptz not null default now(),
  event_name text not null,
  page text,
  source text,
  properties jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb
);
create index if not exists idx_efi_events_name on public.efi_events(event_name);
create index if not exists idx_efi_events_at on public.efi_events(at);

create table if not exists public.efi_coach_directory (
  id text primary key,
  name text not null,
  email text,
  city text not null,
  state text not null,
  zip text not null,
  specialty text not null,
  delivery_modes jsonb not null default '[]'::jsonb,
  website text,
  credential_id text,
  verification_status text not null default 'pending',
  moderation_status text not null default 'pending',
  moderation_notes text,
  reviewer_email text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_reviewed timestamptz
);
create index if not exists idx_efi_coach_directory_visibility on public.efi_coach_directory(verification_status, moderation_status);
create index if not exists idx_efi_coach_directory_geo on public.efi_coach_directory(state, zip);
create index if not exists idx_efi_coach_directory_email on public.efi_coach_directory(email);

create table if not exists public.efi_rate_limits (
  bucket_key text primary key,
  limit_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists idx_efi_rate_limits_limit_key on public.efi_rate_limits(limit_key);
create index if not exists idx_efi_rate_limits_window_start on public.efi_rate_limits(window_start);

create table if not exists public.efi_audit_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  actor_role text,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_efi_audit_logs_target on public.efi_audit_logs(target_type, target_id);
create index if not exists idx_efi_audit_logs_created_at on public.efi_audit_logs(created_at);
