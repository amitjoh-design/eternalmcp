-- ============================================================
-- Migration: Add storage_files table for Storage Manager MCP
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.storage_files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type    TEXT,
  file_size    BIGINT,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS storage_files_user_id_idx ON public.storage_files(user_id);
CREATE INDEX IF NOT EXISTS storage_files_expires_at_idx ON public.storage_files(expires_at);

-- RLS
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own files
CREATE POLICY "Users can view own storage files"
  ON public.storage_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own storage files"
  ON public.storage_files FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (used by MCP handler) bypasses RLS — no insert policy needed for anon/user role
-- Inserts are done server-side with the service role key only
