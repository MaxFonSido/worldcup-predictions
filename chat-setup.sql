-- ============================================================
-- One-time setup for the v6 bundle (Finale + fun + Chat).
-- Safe to run as-is. It only ADDS things — nothing existing
-- is changed, overwritten, or deleted. Run once in Supabase.
-- ============================================================

-- Champion pick column (no-op if you already added it earlier)
alter table users add column if not exists champion_pick text;

-- Family chat: a brand-new, empty table alongside your data
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Let the app read/write the new table
grant all privileges on table messages to anon, authenticated, service_role;

-- Speeds up loading messages in time order
create index if not exists messages_created_at_idx on messages (created_at);
