-- ============================================================
-- App Factory Phase 2 — Supabase Migration
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Table: projects ────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- ─── Table: steps ───────────────────────────────────────────
create type step_key_enum as enum (
  'idea',
  'spec',
  'claude_review',
  'gpt_fix',
  'claude_code',
  'gpt_review_code',
  'final_check',
  'deploy'
);

create table if not exists steps (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  step_key    step_key_enum not null,
  content     text default '',
  versions    jsonb default '[]'::jsonb,
  user_id     uuid not null references auth.users(id) on delete cascade,
  updated_at  timestamptz default now(),
  unique (project_id, step_key)
);

-- ─── RLS: projects ──────────────────────────────────────────
alter table projects enable row level security;

create policy "Users own their projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── RLS: steps ─────────────────────────────────────────────
alter table steps enable row level security;

create policy "Users own their steps"
  on steps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Auto set user_id on insert ─────────────────────────────
create or replace function set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

create trigger set_project_user_id
  before insert on projects
  for each row execute function set_user_id();

create trigger set_step_user_id
  before insert on steps
  for each row execute function set_user_id();

-- ─── Index for performance ───────────────────────────────────
create index if not exists steps_project_id_idx on steps(project_id);
create index if not exists projects_user_id_idx on projects(user_id);
