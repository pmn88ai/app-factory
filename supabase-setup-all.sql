-- ============================================================
-- App Factory — FULL SETUP SQL (chạy 1 lần duy nhất)
-- Bao gồm: Phase 2 + Phase 3A + Phase 3B
-- ============================================================

-- Extension
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
do $$ begin
  create type step_key_enum as enum (
    'idea', 'spec', 'claude_review', 'gpt_fix',
    'claude_code', 'gpt_review_code', 'final_check', 'deploy'
  );
exception when duplicate_object then null;
end $$;

-- ─── Table: projects ─────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  is_template  boolean not null default false,
  share_token  text unique,
  is_public    boolean not null default false,
  created_at   timestamptz default now()
);

-- ─── Table: steps ────────────────────────────────────────────
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

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists steps_project_id_idx      on steps(project_id);
create index if not exists projects_user_id_idx      on projects(user_id);
create index if not exists projects_is_template_idx  on projects(user_id, is_template);
create index if not exists projects_share_token_idx  on projects(share_token) where share_token is not null;

-- ─── Trigger: auto set user_id ───────────────────────────────
create or replace function set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists set_project_user_id on projects;
create trigger set_project_user_id
  before insert on projects
  for each row execute function set_user_id();

drop trigger if exists set_step_user_id on steps;
create trigger set_step_user_id
  before insert on steps
  for each row execute function set_user_id();

-- ─── RLS: projects ───────────────────────────────────────────
alter table projects enable row level security;

drop policy if exists "Users own their projects"   on projects;
drop policy if exists "Public read via share_token" on projects;

create policy "Users own their projects"
  on projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public read via share_token"
  on projects for select
  using (is_public = true and share_token is not null);

-- ─── RLS: steps ──────────────────────────────────────────────
alter table steps enable row level security;

drop policy if exists "Users own their steps"      on steps;
drop policy if exists "Public read steps via project" on steps;

create policy "Users own their steps"
  on steps for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public read steps via project"
  on steps for select
  using (
    exists (
      select 1 from projects p
      where p.id = steps.project_id
        and p.is_public = true
        and p.share_token is not null
    )
  );
