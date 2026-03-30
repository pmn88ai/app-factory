-- ============================================================
-- App Factory Phase 3A — Supabase Migration
-- Chạy trong Supabase SQL Editor SAU migration Phase 2
-- ============================================================

-- Thêm cột is_template vào projects
alter table projects
  add column if not exists is_template boolean not null default false;

-- Index để query templates nhanh hơn
create index if not exists projects_is_template_idx
  on projects(user_id, is_template);
