-- ============================================================
-- One-time setup for the Prize Pool + Organizer tools.
-- Safe & additive: adds one new table and two settings.
-- Nothing existing changes. Run once in Supabase → SQL Editor.
-- (You'll get the "Run and enable RLS" prompt — choose that,
--  same as you did for the chat table.)
-- ============================================================

-- 1) Prize pool signups (new table)
create table if not exists pool_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  real_name text not null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);
grant all privileges on table pool_entries to anon, authenticated, service_role;

-- 2) Set YOU as the organizer.
--    >>> Replace Kiarash below with your EXACT app login name if different <<<
insert into app_meta (key, value) values ('admin_name', 'Kiarash')
on conflict (key) do update set value = excluded.value;

-- 3) Open pool signups for 3 days from right now.
insert into app_meta (key, value) values ('pool_closes_at', (now() + interval '3 days')::text)
on conflict (key) do update set value = excluded.value;
