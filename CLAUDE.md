# EternalMCP — Claude Code Context File

This file gives a fresh Claude Code session full context on the project.
Read this before making any changes.

---

## Project Overview

**EternalMCP** is an Indian-first MCP (Model Context Protocol) marketplace and hosting platform.
Users connect MCP tools to Claude Desktop, which then calls those tools transparently during chat.

- **Repo**: https://github.com/amitjoh-design/eternalmcp
- **Live URL**: https://www.eternalmcp.com
- **Supabase Org**: https://supabase.com/dashboard/org/bibfwrakvwhzaizoauvv
- **Deployment**: Vercel, auto-deploys on push to `main`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router, TypeScript |
| Styling | TailwindCSS (light theme), Framer Motion |
| Auth + DB | Supabase (PostgreSQL + Auth + Storage) |
| MCP Protocol | JSON-RPC over HTTP (spec 2024-11-05) |
| PDF | `pdf-lib` (no filesystem access — Vercel compatible) |
| AI | Anthropic SDK (`claude-haiku-4-5-20251001` for research tool) |

---

## Design System

- **Theme**: Light (white/gray bg, dark text) — migrated from dark in commit `797611e`
- **Primary color**: `#6366f1` (indigo)
- **Accent**: `#22d3ee` (cyan)
- **Surface bg**: `bg-surface` / `bg-surface-2` (CSS vars)
- **Text**: `text-text-primary` / `text-muted`

---

## How the MCP System Works

### Full Flow: User → Tool

1. User signs up → lands in `/dashboard`
2. Dashboard "My MCPs" tab → clicks **Install** on a tool
3. For direct-install tools (company-research): `GET /api/mcp/connect/company-research?userId=xxx`
   - Creates `installed_mcps` row with `mcp_token = 'emcp_*'`, `status = 'connected'`
4. For OAuth tools (Gmail): redirects to Google OAuth → callback stores encrypted tokens
5. User downloads install script (Mac `.sh` / Windows `.bat`) from Setup Guide modal
6. Script updates `claude_desktop_config.json` on user's machine — adds MCP server entry
7. Claude Desktop reads config → connects to `https://www.eternalmcp.com/api/mcp/[token]`
8. Claude uses tools transparently via MCP protocol

### MCP Endpoint

```
POST /api/mcp/[token]
Body: { jsonrpc: '2.0', method: 'tools/list' | 'tools/call', id: 1, ... }
```

- Validates token format (`emcp_*`)
- Looks up `installed_mcps` by `mcp_token`
- Routes to correct handler via `lib/mcps/registry.ts`
- Returns JSON-RPC response

### Claude Desktop Config Format

```json
{
  "mcpServers": {
    "company-research": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://www.eternalmcp.com/api/mcp/emcp_xxx"],
      "timeout": 60000
    }
  }
}
```

**Critical**: `timeout: 60000` is required — without it Claude Desktop times out after ~30s,
which is not enough for the research tool pipeline (API + PDF + upload = ~20s).

---

## Existing MCP Tools

### 1. Company Research (`company-research`)

- **File**: `lib/mcps/research/handler.ts` + `lib/mcps/research/definition.ts`
- **Tool**: `research_company(company_name, exchange, [user_api_key])`
- **Flow**: Prompt → Haiku API (streaming) → `pdf-lib` PDF → Supabase Storage → signed URL (7 days)
- **Cost**: Rs.25 credits per report (or user's own Anthropic API key = free)
- **Model**: `claude-haiku-4-5-20251001` at `max_tokens: 3000`
- **No OAuth** — direct install

#### Key Technical Decisions (Company Research)

| Decision | Reason |
|----------|--------|
| `claude-haiku-4-5-20251001` | Sonnet took ~31s (too slow), Haiku takes ~12-15s |
| `max_tokens: 3000` | Increased from 1500 once `timeout: 60000` was added to Claude Desktop config — gives richer reports |
| Streaming (`messages.stream`) | Keeps Vercel function alive during long generation |
| `pdf-lib` (not pdfkit) | pdfkit requires filesystem — Vercel serverless has no writable FS |
| `sanitizeForPdf()` | Helvetica = Latin-1 only; ₹ (U+20B9) and smart quotes crash `drawText` |

#### `sanitizeForPdf()` function (IMPORTANT)

```typescript
function sanitizeForPdf(text: string): string {
  return text
    .replace(/₹|\u20B9/g, 'Rs.')   // Rupee symbol crashes Helvetica
    .replace(/[""]/g, '"')          // Smart quotes
    .replace(/['']/g, "'")
    .replace(/–/g, '-')             // En dash
    .replace(/—/g, '--')            // Em dash
    .replace(/…/g, '...')
    .replace(/×/g, 'x')
    .replace(/[^\x00-\xFF]/g, '?') // Catch-all for any non-Latin-1
}
```

Applied at entry of `generateResearchPDF()` and at every `drawText` call site.

### 2. Gmail Sender (`gmail-sender`)

- **File**: `lib/mcps/gmail/handler.ts` + `lib/mcps/gmail/definition.ts`
- **Tools**: `send_email(to, subject, body, [cc], [bcc], [attachment_url])`, `create_draft(...)`
- **OAuth**: Google OAuth (gmail.send + gmail.compose scopes)
- **Connect flow**: `GET /api/mcp/connect/gmail` → Google OAuth → callback stores encrypted tokens
- **Token refresh**: Automatic if expired

---

## Key Files

```
lib/
  mcps/
    registry.ts              ← Add new MCPs here
    research/
      definition.ts          ← Tool schema, metadata
      handler.ts             ← Tool execution logic
    gmail/
      definition.ts
      handler.ts
  types.ts                   ← MCPTool, User, etc.
  mcp-crypto.ts              ← Token encryption/decryption

app/
  api/
    mcp/
      [token]/route.ts       ← Main MCP endpoint (JSON-RPC dispatcher)
      connect/
        company-research/route.ts
        gmail/route.ts
        gmail/callback/route.ts
      install/[token]/route.ts  ← Generates Mac .sh / Windows .bat scripts
      disconnect/route.ts
      settings/route.ts      ← Save Anthropic API key for research tool
    upload/route.ts          ← File upload endpoint (multipart → Supabase Storage → signed URL)

components/
  mcp/
    McpCard.tsx              ← Installed MCP card (Setup Guide / Manage / Disconnect)
    SetupModal.tsx           ← Full setup guide with download buttons
    ConfigSnippet.tsx        ← Manual config JSON snippet (multi-client tabs)
    InstallModal.tsx         ← Install/manage modal (Manage button in dashboard)
    CallLogs.tsx             ← Per-MCP activity log
    FileUpload.tsx           ← File upload widget shown in My MCPs tab

  home/
    Hero.tsx                 ← Landing page hero
    FeaturedTools.tsx        ← Featured tools section

  dashboard/
    SubmitToolForm.tsx

app/
  dashboard/page.tsx         ← Main dashboard (overview, MCPs, tools, analytics tabs)
  marketplace/page.tsx
  tools/[id]/page.tsx

supabase/
  schema.sql                 ← Full DB schema + RLS policies
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | Profiles (email, role: user/developer/admin, credit_balance) |
| `installed_mcps` | User's connected MCPs (mcp_token, mcp_slug, status, OAuth tokens) |
| `mcp_tools` | Marketplace tool listings (submitted by developers) |
| `mcp_call_logs` | Audit log (IP, user_agent, tool_name, status, timestamp) |
| `tool_usage` | Per-user per-tool call counts |
| `reviews` | Ratings on marketplace tools |
| `api_keys` | User API credentials |

All tables have RLS. Admin bypasses via service role key.

---

## Vercel Config

`vercel.json`:
```json
{
  "functions": {
    "app/api/mcp/[token]/route.ts": {
      "maxDuration": 300
    }
  }
}
```

Only the MCP token route has extended timeout. Requires Vercel Pro for 300s;
Hobby plan caps at 60s regardless of this config.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://www.eternalmcp.com
ANTHROPIC_API_KEY=               ← Used for company research (platform's shared key)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
MCP_TOKEN_ENCRYPTION_KEY=        ← For encrypting OAuth tokens in DB
```

---

## Known Issues Fixed (Session Log)

| Commit | Fix |
|--------|-----|
| `5e76d99` | PDF crash on ₹ symbol — added `sanitizeForPdf()` |
| `7bf846b` | Reduced tokens 8000→7000 to speed up generation |
| `788e575` | Switched model Sonnet→Haiku (4x faster) |
| `6879ed5` | Reduced sections 9→6, tokens 7000→3000 |
| `464d109` | Reduced tokens 3000→1500 to fit MCP 30s client timeout |
| `f70f151` | Added `timeout: 60000` to auto-install scripts |
| `e66d355` | Added `timeout: 60000` to manual ConfigSnippet |
| `dfc2139` | Fixed ConfigSnippet in InstallModal missing `slug` prop (was defaulting to 'gmail' for all tools) |
| `c7cfd17` | Increased company research `max_tokens` 1500→3000 (safe now that `timeout: 60000` is set) |
| `bff4d3b` | Updated CLAUDE.md session log with actual commit hash for max_tokens change |
| `ec6d0a8` | File upload feature: `POST /api/upload` + `FileUpload` component in MCPs tab — stores files in `research-pdfs` bucket under `uploads/{user_id}/`, returns 7-day signed URL for Gmail attachment use |
| `ec6d0a8` | Gmail `attachment_url` description updated to explicitly require public URL and guide users to upload first |
| `bc721fa` | Fixed upload RLS error — switched from `createServiceClient` (SSR wrapper) to raw `createClient` from `@supabase/supabase-js` for storage operations, matching pattern used in research handler |
| `bc721fa` | Restricted FileUpload to PDF-only temporarily while bucket MIME allowlist was PDF-only |
| `df12db0` | Expanded `research-pdfs` Supabase bucket MIME allowlist via dashboard to: PDF, DOCX, XLSX, DOC, XLS, PNG, JPG, CSV, TXT — updated `app/api/upload/route.ts` and `FileUpload.tsx` to accept all types |

---

## File Upload Feature (Dashboard → My MCPs tab)

Allows users to upload files and get a signed URL to use as Gmail attachments.

- **API route**: `POST /api/upload` — multipart form, field name `file`, max 10 MB
- **Component**: `components/mcp/FileUpload.tsx` — shown below MCP cards in the My MCPs tab
- **Storage**: `research-pdfs` Supabase bucket, path `uploads/{user_id}/{timestamp}_{filename}`
- **Auth**: Uses SSR Supabase client for user auth, raw `createClient` (service role) for storage upload
- **Returns**: 7-day signed URL (copy button shown after upload)

### Supported file types

PDF, DOCX, XLSX, DOC, XLS, PNG, JPG, JPEG, CSV, TXT

### Supabase bucket config (`research-pdfs`)

| Setting | Value |
|---------|-------|
| Public | No (private, signed URLs only) |
| File size limit | 50 MB |
| Allowed MIME types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/msword`, `application/vnd.ms-excel`, `image/png`, `image/jpeg`, `text/csv`, `text/plain` |

### Why raw `createClient` for storage (IMPORTANT)

```typescript
// ❌ Wrong — @supabase/ssr wrapper does NOT bypass RLS even with service role key
import { createServiceClient } from '@/lib/supabase/server'

// ✅ Correct — raw client bypasses RLS (same pattern as research handler)
import { createClient } from '@supabase/supabase-js'
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Usage flow for Gmail attachments

1. User goes to **My MCPs** tab → scrolls below MCP cards
2. Uploads file (drag-and-drop or click) → copies the signed URL
3. Tells Claude: *"Send email to X, attach this URL: [paste]"*
4. Gmail tool uses `attachment_url` parameter with that URL

---

## Adding a New MCP Tool

1. Create `lib/mcps/[slug]/definition.ts` — tool schema, metadata, OAuth requirements
2. Create `lib/mcps/[slug]/handler.ts` — implements `handleXxxTool(install, toolName, args, writeLog, db)`
3. Register in `lib/mcps/registry.ts` — add to `MCP_REGISTRY` array
4. Add connect route at `app/api/mcp/connect/[slug]/route.ts`
5. Add entry to `MCP_META` in `app/api/mcp/install/[token]/route.ts`
6. Add entry to `MCP_CONTENT` in `components/mcp/SetupModal.tsx`
7. Add dispatch case in `app/api/mcp/[token]/route.ts`

**Critical rules for new tools:**
- Always use `sanitizeForPdf()` if generating PDFs
- Use streaming for any Anthropic API calls > 10s
- Keep `max_tokens` low enough that total pipeline fits in 20s (MCP client timeout = 60s with our config, but be conservative)
- Pass `slug` prop to every `<ConfigSnippet>` usage

---

## Planned Tools (Discussed, Not Built)

Priority order for non-technical Indian users:
1. **Web Search & Summariser** — Brave/Tavily API, credit-per-search
2. **WhatsApp Sender** — Twilio WhatsApp API
3. **GST Invoice Generator** — Pure compute, PDF output, India-specific
4. **Google Sheets Manager** — Google OAuth (reuse Gmail OAuth pattern)
5. **YouTube Summariser** — YouTube Data API + Claude
6. **PDF Creator** — Server-side PDF from text/markdown
7. **Language Translator** — Hindi/English/regional (Claude handles natively)
8. **Google Calendar Manager** — Google OAuth
9. **Image Text Extractor (OCR)** — Google Cloud Vision API
10. **Indian Financial Calculator Suite** — EMI, SIP, income tax, HRA

---

## First Admin Setup

After deploying and running `supabase/schema.sql`:
```sql
SELECT promote_to_admin('your@email.com');
```
