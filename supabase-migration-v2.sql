-- ============================================================
-- App Factory V2 — App Registry Migration
-- Chạy SAU supabase-setup-all.sql
-- ============================================================

-- ─── Table: apps ─────────────────────────────────────────────
create table if not exists apps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  name       text not null,
  created_at timestamptz default now(),
  unique (user_id, slug)
);

-- ─── Add app_id to projects ───────────────────────────────────
alter table projects
  add column if not exists app_id uuid references apps(id) on delete set null;

-- ─── Index ───────────────────────────────────────────────────
create index if not exists apps_user_id_idx     on apps(user_id);
create index if not exists projects_app_id_idx  on projects(app_id);

-- ─── RLS: apps ───────────────────────────────────────────────
alter table apps enable row level security;

create policy "Users own their apps"
  on apps for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Trigger: auto set user_id on apps ───────────────────────
-- Reuse existing set_user_id() function từ migration trước
create trigger set_app_user_id
  before insert on apps
  for each row execute function set_user_id();
