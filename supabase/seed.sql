-- ============================================================
-- Eternal MCP — Seed Data
-- Run AFTER schema.sql in your Supabase SQL Editor
-- ============================================================

-- Note: Run this only in development. Do NOT run in production.

-- ============================================================
-- DEMO TOOLS (approved, for showcasing the marketplace)
-- These use a placeholder creator_id. In production,
-- replace with real user UUIDs from your auth.users table.
-- ============================================================

-- First create a system/demo user if needed
-- INSERT INTO public.users (id, email, name, role) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'demo@eternalmcp.com', 'Eternal MCP Team', 'admin');

-- Demo tools (uncomment and replace creator_id with real UUID after creating a user)
/*
INSERT INTO public.mcp_tools (
  id, name, slug, description, long_description, creator_id,
  api_endpoint, documentation_url, category, tags, version,
  status, is_featured, github_url, license
) VALUES

-- Trading Bot
(
  uuid_generate_v4(),
  'Alpha Trading Bot',
  'alpha-trading-bot',
  'Autonomous trading agent with real-time market analysis, order execution, and portfolio management via MCP.',
  '# Alpha Trading Bot\n\nA powerful MCP tool for algorithmic trading.\n\n## Features\n- Real-time market data\n- Order execution\n- Portfolio tracking\n- Risk management\n\n## Configuration\n```json\n{\n  "symbol": "BTCUSDT",\n  "strategy": "momentum",\n  "risk_pct": 2\n}\n```',
  'REPLACE_WITH_USER_UUID',
  'https://api.eternalmcp.com/tools/alpha-trading-bot',
  'https://docs.eternalmcp.com/tools/alpha-trading-bot',
  'trading',
  ARRAY['Trading', 'Finance', 'Automation', 'Crypto'],
  '2.1.0',
  'approved',
  true,
  'https://github.com/example/alpha-trading-bot',
  'MIT'
),

-- Data Scraper
(
  uuid_generate_v4(),
  'DataScraper Pro',
  'datascraper-pro',
  'Extract structured data from any website. Handles JS-rendered pages, pagination, and anti-bot measures.',
  '# DataScraper Pro\n\nAdvanced web scraping MCP tool.\n\n## Features\n- JavaScript rendering\n- Pagination handling\n- Proxy rotation\n- Data extraction\n\n## Usage\nSend a URL and extraction rules. Get back clean structured data.',
  'REPLACE_WITH_USER_UUID',
  'https://api.eternalmcp.com/tools/datascraper-pro',
  'https://docs.eternalmcp.com/tools/datascraper-pro',
  'data',
  ARRAY['Web Scraping', 'Data', 'Automation'],
  '1.5.0',
  'approved',
  true,
  'https://github.com/example/datascraper-pro',
  'Apache-2.0'
),

-- Code Review
(
  uuid_generate_v4(),
  'CodeReview AI',
  'codereview-ai',
  'Automated code review with security vulnerability detection, performance suggestions, and best practice checks.',
  '# CodeReview AI\n\nAutomated code review powered by AI.\n\n## Supports\n- Python, JavaScript, TypeScript, Rust, Go\n- Security scanning\n- Performance analysis\n- Best practices',
  'REPLACE_WITH_USER_UUID',
  'https://api.eternalmcp.com/tools/codereview-ai',
  null,
  'other',
  ARRAY['Code Review', 'Security', 'Development', 'AI'],
  '3.0.0',
  'approved',
  false,
  null,
  'MIT'
);
*/

-- ============================================================
-- SAMPLE CATEGORIES VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.category_stats AS
SELECT
  category,
  COUNT(*) AS tool_count,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  AVG(
    (SELECT AVG(rating) FROM public.reviews WHERE tool_id = t.id)
  ) AS avg_rating
FROM public.mcp_tools t
GROUP BY category;

GRANT SELECT ON public.category_stats TO anon, authenticated;

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Featured tools view
CREATE OR REPLACE VIEW public.featured_tools AS
SELECT
  t.*,
  u.name AS creator_name,
  u.avatar_url AS creator_avatar,
  COALESCE(SUM(tu.usage_count), 0) AS total_usage,
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COUNT(r.id) AS review_count
FROM public.mcp_tools t
JOIN public.users u ON u.id = t.creator_id
LEFT JOIN public.tool_usage tu ON tu.tool_id = t.id
LEFT JOIN public.reviews r ON r.tool_id = t.id
WHERE t.status = 'approved' AND t.is_featured = TRUE
GROUP BY t.id, u.name, u.avatar_url
ORDER BY total_usage DESC, avg_rating DESC;

GRANT SELECT ON public.featured_tools TO anon, authenticated;

-- ============================================================
-- ADMIN HELPER FUNCTIONS
-- ============================================================

-- Function to promote user to admin (run manually for first admin)
-- SELECT promote_to_admin('user@example.com');
CREATE OR REPLACE FUNCTION promote_to_admin(p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET role = 'admin' WHERE email = p_email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to developer
CREATE OR REPLACE FUNCTION promote_to_developer(p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET role = 'developer' WHERE email = p_email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
