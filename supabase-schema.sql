-- =====================================================================
--  World Cup Predictions — database schema
--  Paste this whole file into the Supabase SQL Editor and click "Run".
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Players ----------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  display_name  text unique not null,
  pin_hash      text not null,                  -- bcrypt hash of the 4-digit PIN
  language      text not null default 'en',     -- 'en' | 'fa'
  created_at    timestamptz not null default now()
);

-- ---------- Matches (synced automatically from football-data.org) ----------
create table if not exists matches (
  id            uuid primary key default gen_random_uuid(),
  external_id   bigint unique not null,         -- football-data.org match id
  stage         text not null,                  -- GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | SEMI_FINALS | THIRD_PLACE | FINAL
  group_name    text,                           -- e.g. "Group A" for groups, null for knockouts
  team_a        text not null,
  team_b        text not null,
  team_a_code   text,                           -- 3-letter code
  team_b_code   text,
  team_a_crest  text,                           -- flag/crest image url
  team_b_crest  text,
  kickoff_utc   timestamptz not null,           -- the lock time
  allows_draw   boolean not null default true,  -- false for knockout matches (drives the on-card note)
  status        text not null default 'SCHEDULED',
  result        text,                           -- TEAM_A | TEAM_B | DRAW | VOID | null
  score_a       int,
  score_b       int,
  updated_at    timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on matches (kickoff_utc);

-- ---------- Predictions (exactly one per user per match) ----------
create table if not exists predictions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  match_id    uuid not null references matches(id) on delete cascade,
  pick        text not null,                    -- TEAM_A | TEAM_B | DRAW
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id)                    -- enforces one pick per match
);

-- ---------- Key/value for housekeeping (e.g. last feed sync time) ----------
create table if not exists app_meta (
  key    text primary key,
  value  text
);

-- ---------- Leaderboard: score is DERIVED, never stored ----------
-- Golden Tokens = number of finished, non-void matches the player called correctly.
create or replace view leaderboard as
select
  u.id,
  u.display_name,
  count(*) filter (
    where m.status = 'FINISHED'
      and m.result is not null
      and m.result <> 'VOID'
      and p.pick = m.result
  )::int as golden_tokens
from users u
left join predictions p on p.user_id = u.id
left join matches m on m.id = p.match_id
group by u.id, u.display_name;
