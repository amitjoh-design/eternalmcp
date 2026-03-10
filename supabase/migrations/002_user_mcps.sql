-- ============================================================
-- Eternal MCP — User Installed MCPs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Table to track user's installed MCP connections
CREATE TABLE IF NOT EXISTS public.installed_mcps (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mcp_slug              TEXT NOT NULL,                   -- e.g. 'gmail-sender'
  mcp_token             TEXT NOT NULL UNIQUE,            -- bearer token: emcp_xxxxx
  connected_email       TEXT,                            -- e.g. amitjoh@gmail.com
  access_token_enc      TEXT,                            -- AES-256-GCM encrypted
  refresh_token_enc     TEXT,                            -- AES-256-GCM encrypted
  token_expiry          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'connected' | 'error'
  call_count            INTEGER NOT NULL DEFAULT 0,
  last_called_at        TIMESTAMPTZ,
  settings              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mcp_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_installed_mcps_user    ON public.installed_mcps (user_id);
CREATE INDEX IF NOT EXISTS idx_installed_mcps_token   ON public.installed_mcps (mcp_token);
CREATE INDEX IF NOT EXISTS idx_installed_mcps_slug    ON public.installed_mcps (mcp_slug);

-- Auto-update updated_at
CREATE TRIGGER installed_mcps_updated_at
  BEFORE UPDATE ON public.installed_mcps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE public.installed_mcps ENABLE ROW LEVEL SECURITY;

-- Users manage their own MCPs
CREATE POLICY "Users can manage their own installed MCPs"
  ON public.installed_mcps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (used by API routes) can read all for token lookup
-- Note: service role bypasses RLS automatically in Supabase
