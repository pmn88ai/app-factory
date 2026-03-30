-- ============================================================
-- App Factory Phase 3B — Supabase Migration
-- Chạy SAU migration Phase 2 + Phase 3A
-- ============================================================

-- Thêm share fields vào projects
alter table projects
  add column if not exists share_token text unique,
  add column if not exists is_public   boolean not null default false;

-- Index để lookup share_token nhanh
create index if not exists projects_share_token_idx
  on projects(share_token)
  where share_token is not null;

-- ─── RLS policy cho public read (không cần auth) ────────────
-- Cho phép bất kỳ ai (kể cả anon) đọc project public qua share_token
create policy "Public read via share_token"
  on projects for select
  using (is_public = true and share_token is not null);

-- Cho phép bất kỳ ai đọc steps của project public
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
