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
