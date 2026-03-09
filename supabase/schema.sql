-- ============================================================
-- Eternal MCP — Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard/org/bibfwrakvwhzaizoauvv
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ============================================================
-- TYPES / ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'developer', 'admin');

CREATE TYPE tool_category AS ENUM (
  'trading', 'analytics', 'automation', 'data',
  'communication', 'security', 'finance', 'research',
  'productivity', 'other'
);

CREATE TYPE tool_status AS ENUM ('pending', 'approved', 'rejected', 'archived');

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  github_username TEXT,
  bio           TEXT,
  website       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MCP Tools
CREATE TABLE IF NOT EXISTS public.mcp_tools (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  long_description  TEXT,
  creator_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_endpoint      TEXT NOT NULL,
  documentation_url TEXT,
  category          tool_category NOT NULL DEFAULT 'other',
  tags              TEXT[] NOT NULL DEFAULT '{}',
  version           TEXT NOT NULL DEFAULT '1.0.0',
  status            tool_status NOT NULL DEFAULT 'pending',
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  icon_url          TEXT,
  github_url        TEXT,
  license           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool Usage Tracking
CREATE TABLE IF NOT EXISTS public.tool_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tool_id     UUID NOT NULL REFERENCES public.mcp_tools(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id     UUID NOT NULL REFERENCES public.mcp_tools(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tool_id, user_id)  -- One review per user per tool
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,   -- e.g., "emcp_ab12"
  key_hash    TEXT NOT NULL,   -- bcrypt hash of the full key
  last_used   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Usage Stats (aggregated)
CREATE TABLE IF NOT EXISTS public.tool_daily_stats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id     UUID NOT NULL REFERENCES public.mcp_tools(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  call_count  INTEGER NOT NULL DEFAULT 0,
  user_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tool_id, date)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Full-text search on tools
CREATE INDEX IF NOT EXISTS idx_tools_name_trgm ON public.mcp_tools USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_description_trgm ON public.mcp_tools USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_status ON public.mcp_tools (status);
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.mcp_tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_creator ON public.mcp_tools (creator_id);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON public.mcp_tools (is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_tools_tags ON public.mcp_tools USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_reviews_tool ON public.reviews (tool_id);
CREATE INDEX IF NOT EXISTS idx_usage_tool ON public.tool_usage (tool_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON public.tool_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_tool_date ON public.tool_daily_stats (tool_id, date DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tools_updated_at
  BEFORE UPDATE ON public.mcp_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Get tool stats function
CREATE OR REPLACE FUNCTION get_tool_stats(p_tool_id UUID)
RETURNS TABLE (
  total_usage BIGINT,
  unique_users BIGINT,
  avg_rating NUMERIC,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tu.usage_count), 0) AS total_usage,
    COUNT(DISTINCT tu.user_id) AS unique_users,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(r.id) AS review_count
  FROM public.mcp_tools mt
  LEFT JOIN public.tool_usage tu ON tu.tool_id = mt.id
  LEFT JOIN public.reviews r ON r.tool_id = mt.id
  WHERE mt.id = p_tool_id
  GROUP BY mt.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_daily_stats ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- MCP Tools policies
CREATE POLICY "Approved tools are public"
  ON public.mcp_tools FOR SELECT
  USING (status = 'approved' OR auth.uid() = creator_id);

CREATE POLICY "Authenticated users can insert tools"
  ON public.mcp_tools FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own tools"
  ON public.mcp_tools FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own tools"
  ON public.mcp_tools FOR DELETE
  USING (auth.uid() = creator_id);

-- Admin bypass policies (admins see everything)
CREATE POLICY "Admins can manage all tools"
  ON public.mcp_tools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are public"
  ON public.reviews FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can write reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Tool usage policies
CREATE POLICY "Users can view own usage"
  ON public.tool_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can track own usage"
  ON public.tool_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.tool_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- API Keys policies
CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

-- Daily stats are public
CREATE POLICY "Tool stats are public"
  ON public.tool_daily_stats FOR SELECT USING (TRUE);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-icons', 'tool-icons', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tool icons are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tool-icons');

CREATE POLICY "Authenticated users can upload tool icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tool-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Avatars are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
