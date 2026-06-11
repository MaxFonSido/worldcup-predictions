-- ============================================================
-- One-time setup for the unread chat dot.
-- Safe & additive: adds a single column to remember when each
-- person last opened the chat. Nothing existing changes.
-- Run once in Supabase → SQL Editor.
-- ============================================================

alter table users add column if not exists chat_last_read_at timestamptz;
