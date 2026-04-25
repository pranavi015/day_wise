-- ============================================================
-- DAYWISE: Table creation + RLS policies
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── 1. PROFILES TABLE ─────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  schedule_json jsonb,
  pacing text default 'balanced',
  sr_enabled boolean default true,
  exam_date date,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Allow a user to SELECT their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow a user to INSERT their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow a user to UPDATE their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow UPSERT (used during onboarding finish)
-- Supabase upsert uses INSERT + ON CONFLICT UPDATE, so we need both INSERT + UPDATE policies above ✓


-- ── 2. CURRICULA TABLE ────────────────────────────────────
create table if not exists public.curricula (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  estimated_hours numeric default 2,
  week_number integer default 1,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.curricula enable row level security;

-- Allow a user to SELECT their own curriculum rows
create policy "Users can view own curricula"
  on public.curricula for select
  using (auth.uid() = user_id);

-- Allow a user to INSERT their own curriculum rows
create policy "Users can insert own curricula"
  on public.curricula for insert
  with check (auth.uid() = user_id);

-- Allow a user to UPDATE their own curriculum rows
create policy "Users can update own curricula"
  on public.curricula for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow a user to DELETE their own curriculum rows
create policy "Users can delete own curricula"
  on public.curricula for delete
  using (auth.uid() = user_id);


-- ── DONE ──────────────────────────────────────────────────
-- After running this, the onboarding "Looks good - Start Learning" button
-- will successfully save profile + curricula and redirect to /today
