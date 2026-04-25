-- ============================================================
-- DAYWISE: Table columns + RLS policies (safe to re-run)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── 1. PROFILES TABLE ─────────────────────────────────────
-- Create if it doesn't exist yet
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

-- Add columns safely (no-op if they already exist)
alter table public.profiles add column if not exists schedule_json jsonb;
alter table public.profiles add column if not exists pacing text default 'balanced';
alter table public.profiles add column if not exists sr_enabled boolean default true;
alter table public.profiles add column if not exists exam_date date;
alter table public.profiles add column if not exists created_at timestamptz default now();

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop old policies first (safe if they don't exist)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Recreate policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── 2. CURRICULA TABLE ────────────────────────────────────
create table if not exists public.curricula (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade
);

-- Add columns safely
alter table public.curricula add column if not exists title text not null default '';
alter table public.curricula add column if not exists description text default '';
alter table public.curricula add column if not exists estimated_hours numeric default 2;
alter table public.curricula add column if not exists week_number integer default 1;
alter table public.curricula add column if not exists sort_order integer default 0;
alter table public.curricula add column if not exists created_at timestamptz default now();

-- Enable RLS
alter table public.curricula enable row level security;

-- Drop old policies first
drop policy if exists "Users can view own curricula" on public.curricula;
drop policy if exists "Users can insert own curricula" on public.curricula;
drop policy if exists "Users can update own curricula" on public.curricula;
drop policy if exists "Users can delete own curricula" on public.curricula;

-- Recreate policies
create policy "Users can view own curricula"
  on public.curricula for select
  using (auth.uid() = user_id);

create policy "Users can insert own curricula"
  on public.curricula for insert
  with check (auth.uid() = user_id);

create policy "Users can update own curricula"
  on public.curricula for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own curricula"
  on public.curricula for delete
  using (auth.uid() = user_id);

-- ── DONE ──────────────────────────────────────────────────
