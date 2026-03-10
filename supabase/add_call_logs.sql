-- ─────────────────────────────────────────────────────────────────────────────
-- MCP Call Logs — audit trail for every tool invocation
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/org/bibfwrakvwhzaizoauvv
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mcp_call_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  installed_mcp_id uuid        REFERENCES installed_mcps(id) ON DELETE CASCADE NOT NULL,
  user_id          uuid        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tool_name        text        NOT NULL,                 -- 'send_email' | 'create_draft'
  to_address       text,                                 -- recipient email
  subject          text,                                 -- email subject
  ip_address       text,                                 -- caller's public IP
  user_agent       text,                                 -- caller's user-agent
  status           text        NOT NULL DEFAULT 'success', -- 'success' | 'error'
  error_message    text,                                 -- populated on error
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-MCP queries (most common lookup)
CREATE INDEX IF NOT EXISTS mcp_call_logs_installed_mcp_id_idx
  ON mcp_call_logs (installed_mcp_id, created_at DESC);

-- Index for per-user queries
CREATE INDEX IF NOT EXISTS mcp_call_logs_user_id_idx
  ON mcp_call_logs (user_id, created_at DESC);

-- RLS: users can only see their own logs
ALTER TABLE mcp_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own call logs"
  ON mcp_call_logs FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert (MCP server uses service key)
CREATE POLICY "Service role inserts logs"
  ON mcp_call_logs FOR INSERT
  WITH CHECK (true);
