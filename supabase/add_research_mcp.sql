-- ─────────────────────────────────────────────────────────────────────────────
-- Research MCP — Credit system + PDF storage bucket
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add credit_balance to users table (existing users get 1000 credits)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance INTEGER NOT NULL DEFAULT 1000;

-- 2. Check constraint: credits can never go below zero
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_credit_balance_check;
ALTER TABLE users ADD CONSTRAINT users_credit_balance_check CHECK (credit_balance >= 0);

-- 3. Storage bucket for research PDFs (private — access via signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'research-pdfs',
  'research-pdfs',
  false,
  52428800, -- 50 MB limit per file
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS: users can only read their own PDFs (stored at {user_id}/{filename})
CREATE POLICY "Users read own research PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'research-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Service role can insert PDFs (MCP server uses service key)
CREATE POLICY "Service role inserts research PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'research-pdfs');

-- 6. Users can delete their own PDFs
CREATE POLICY "Users delete own research PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'research-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
