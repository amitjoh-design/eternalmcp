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
| Dashboard | Chart.js v4 + PapaParse (CDN) — for Data Summary BI dashboards |

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
      "timeout": 300000
    }
  }
}
```

**Critical**: `timeout: 300000` is required — without it Claude Desktop times out after ~30s,
which is not enough for the research tool pipeline (API + PDF + upload = ~20s).
300000ms (5 min) matches Vercel Pro's maxDuration: 300s — the maximum useful value.

---

## Existing MCP Tools

### 1. Company Research (`company-research`)

- **File**: `lib/mcps/research/handler.ts` + `lib/mcps/research/definition.ts`
- **Tool**: `research_company(company_name, exchange, [user_api_key])`
- **Flow**: Prompt → Haiku API (streaming) → return markdown text directly (no PDF, no storage)
- **Cost**: Rs.25 credits per report (or user's own Anthropic API key = free)
- **Model**: `claude-haiku-4-5-20251001` at `max_tokens: 5000`
- **No OAuth** — direct install

#### Key Technical Decisions (Company Research)

| Decision | Reason |
|----------|--------|
| `claude-haiku-4-5-20251001` | Sonnet took ~31s (too slow), Haiku takes ~12-15s |
| `max_tokens: 5000` | Balanced for 7-section report within Vercel timeout |
| Streaming (`messages.stream`) | Keeps Vercel function alive during long generation |
| No PDF generation | Removed pdf-lib entirely — plain markdown is faster, richer (no Latin-1 constraint), and renders beautifully in Claude Desktop |

### 2. Storage Manager (`storage-manager`)

- **Files**: `lib/mcps/storage/handler.ts` + `lib/mcps/storage/definition.ts`
- **Tools**: `upload_file`, `upload_from_url`, `save_as_file`, `list_files`, `delete_file`
- **No OAuth** — direct install
- **Storage**: `research-pdfs` Supabase bucket, path `storage/{user_id}/{timestamp}_{filename}`
- **DB table**: `storage_files` (id, user_id, filename, storage_path, mime_type, file_size, expires_at, created_at)
- **Limits**: 10 files per user, 10 GB total, 20 MB per file, 24-hour signed URLs

#### Tool summary

| Tool | Input | Use case |
|------|-------|---------|
| `upload_file` | `content_base64`, `filename`, `[mime_type]` | File attached in Claude chat |
| `upload_from_url` | `url`, `[filename]` | File at a public URL |
| `save_as_file` | `content`, `filename`, `[format]` | Claude-generated text → txt/md/html/json/csv |
| `list_files` | — | Lists active files with fresh 24h signed URLs |
| `delete_file` | `file_id` | Deletes file from storage + DB |

#### Key Technical Decisions (Storage Manager)

| Decision | Reason |
|----------|--------|
| `upload_file` uses base64 | MCP JSON-RPC is text-only; Claude Desktop passes attached file content as base64 in context |
| Quota checked before upload | Prevent exceeding 10 file / 10 GB limits before hitting Supabase |
| `storage/{user_id}/` path prefix | Separates from dashboard uploads (`uploads/{user_id}/`) in same bucket |
| 24h TTL (not 7 days) | Storage is for temporary sharing/transfer, not long-term hosting |
| Service role client for storage | Same pattern as research handler — SSR wrapper does NOT bypass RLS |

### 3. PDF Creator (`pdf-creator`)

- **Files**: `lib/mcps/pdf/handler.ts` + `lib/mcps/pdf/definition.ts`
- **Tool**: `create_pdf(content, filename, [title])`
- **Flow**: Detect format → (HTML? strip to markdown) → pdf-lib PDF → Supabase Storage → 24h signed URL
- **No OAuth** — direct install
- **Storage**: `research-pdfs` bucket, path `pdfs/{user_id}/{timestamp}_{filename}.pdf`
- **DB table**: reuses `storage_files` — PDFs appear in Storage Manager `list_files`

#### Supported / rejected formats

| Input | Behaviour |
|-------|-----------|
| Markdown | Rendered directly |
| Plain text | Rendered directly |
| Basic HTML | Auto-detected (`<tag>` present), stripped to markdown, then rendered |
| Binary / null-bytes | Rejected with clear error and instructions |
| Word / Excel / PPT | Rejected — user told to ask Claude to extract text first |
| Content > 200 KB | Rejected |

#### Key Technical Decisions (PDF Creator)

| Decision | Reason |
|----------|--------|
| `pdf-lib` (no filesystem) | Same reason as before — Vercel serverless has no writable FS |
| HTML auto-detection | Checks for `<tag>` pattern — no explicit `format` param needed, cleaner UX |
| Reuses `storage_files` table | PDFs created here show up in Storage Manager `list_files` — one unified file view |
| `pdfs/{user_id}/` path | Separate from `storage/{user_id}/` (Storage Manager) and `uploads/{user_id}/` (dashboard widget) |
| 24h TTL | Same as Storage Manager — for sharing/transfer, not long-term hosting |

### 4. Data Summary (`data-summary`)

- **Files**: `lib/mcps/data-summary/handler.ts` + `lib/mcps/data-summary/definition.ts`
- **Tool**: `create_dashboard(csv_data, [title])`
- **Flow**: CSV text → `generateDashboardHtml()` → upload to Supabase → proxy render URL
- **No OAuth** — direct install
- **Storage**: `research-pdfs` bucket, path `dashboards/{user_id}/{timestamp}_{slug}.html`
- **DB table**: reuses `storage_files` — dashboards appear in Storage Manager `list_files`
- **Render route**: `GET /api/render/dashboards/...` — proxy fetches from Supabase with service role, serves as `text/html` (Supabase forces `text/plain` for HTML files regardless of upload MIME type)
- **Demo CSV**: 30-row Indian bank statement included in handler — used when no CSV is provided

#### Dashboard features

| Feature | Details |
|---------|---------|
| KPI cards | Total Income, Total Expenses, Net Balance, Savings Rate |
| Filter bar | Type chips, date range inputs, search box, Reset All |
| Sections | Income / Expense sections with sub-category cards |
| Charts | Donut (distribution), Bar (by category), Line (trend), H-Bar (ranked) |
| Data table | All rows with badge for type, formatted amounts |
| Scenario Planner | Tab 2 — per-category sliders, Before/After comparison, delta chart |
| Upload CSV | Nav button — paste or drag-and-drop new CSV to rebuild dashboard in-browser |

#### Key Technical Decisions (Data Summary)

| Decision | Reason |
|----------|--------|
| Proxy render route `/api/render/[...path]` | Supabase Storage forces `Content-Type: text/plain` for HTML files (security policy) regardless of upload MIME — proxy fetches with service role and serves with correct `text/html` header |
| `contentType: 'text/html'` (no charset suffix) | Supabase rejects `text/html; charset=utf-8` (charset suffix) — must be bare `text/html` |
| `Array.from(new Set(...))` not `[...new Set(...)]` | Spread-of-iterator caused "Unexpected identifier 'type'" JS parse error in some browsers |
| `fType` not `type` as function parameter | Avoids keyword conflict in strict contexts; same for `typeVals` not `types` |
| Reuses `storage_files` table | Dashboards appear in Storage Manager `list_files` — one unified file view |
| `dashboards/{user_id}/` path | Separate from `storage/`, `pdfs/`, `uploads/` prefixes in same bucket |
| 24h TTL | Same as other MCP-generated files |
| Demo CSV built-in | Tool works with zero user input — Claude can call `create_dashboard` with no args |

### 5. Gmail Sender (`gmail-sender`)

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
    storage/
      definition.ts          ← Tool schema, limits, metadata
      handler.ts             ← upload_file, upload_from_url, save_as_file, list_files, delete_file
    pdf/
      definition.ts          ← Tool schema, supported formats, permissions
      handler.ts             ← create_pdf (markdown/text/HTML → pdf-lib → Supabase → signed URL)
    data-summary/
      definition.ts          ← Tool schema, metadata
      handler.ts             ← create_dashboard (CSV → HTML → Supabase → proxy render URL)
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
        storage-manager/route.ts
        pdf-creator/route.ts
        data-summary/route.ts
      install/[token]/route.ts  ← Generates Mac .sh / Windows .bat scripts
    render/
      [...path]/route.ts     ← Proxy route: serves Supabase HTML dashboards with correct Content-Type
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
  migrations/
    add_storage_files.sql    ← storage_files table + indexes + RLS (run after schema.sql)
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
| `storage_files` | Files uploaded via Storage Manager MCP (filename, path, size, expires_at) |

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
| `cec5008` | Storage Manager MCP — 5 tools (upload_file, upload_from_url, save_as_file, list_files, delete_file), 24h signed URLs, 10 file / 10 GB / 20 MB limits, `storage_files` DB table |
| `76940aa` | UI standardization: `InstallModal` now fully dynamic via `getMcpDefinition(slug)` — no longer hardcoded to Company Research; `ConfigSnippet` generates combined `mcpServers` block for all connected MCPs (new `allInstalled[]` prop); `SetupModal` + dashboard wired to pass all connected MCPs to both modals |
| `fc33041` | Fix Storage Manager install — connect route was at `/api/mcp/connect/storage` but slug is `storage-manager`; renamed folder to `storage-manager` so `handleDirectInstall` hits the correct endpoint |
| `e3b5f5c` | Increased MCP timeout 60000→300000ms (matches Vercel Pro maxDuration 300s) across ConfigSnippet and install scripts |
| `6e28855` | Upgraded company research prompt to full 9-section institutional equity research report (Goldman Sachs / Morgan Stanley style); `max_tokens` 3000→6000 |
| `59d51a5` | Reduced `max_tokens` 6000→5000 to fix timeout failures; removed Investment Thesis section (was section 6); renumbered remaining sections to 8 total |
| `d7ab189` | Removed Fundamental Analysis section (5yr financials tables); renumbered to 7 sections; `max_tokens` set to 5000 |
| `7fa7903` | Removed PDF generation entirely — tool now returns plain markdown text; removed pdf-lib, Supabase storage upload, signed URL, sanitizeForPdf; ~5-10s faster, no Latin-1 constraints |
| `92d4875` | Added PDF Creator MCP — `create_pdf(content, filename, [title])`; accepts markdown/text/HTML; rejects binary/Word/Excel with helpful error; stores in `pdfs/{user_id}/`; tracked in `storage_files`; 24h signed URL |
| (multi) | Landing page cleanup: removed all DeltaFlow Technologies references; fixed "₹0 Code Required" → "No Code Required"; removed Trading Intelligence Coming Soon card; removed Gnosis Tech Advisors from footer; GitHub link → `https://github.com/login` |
| (multi) | Added Data Summary MCP — `create_dashboard(csv_data, [title])`; full dark-themed BI dashboard (Chart.js + PapaParse); KPI cards, filters, Income/Expense sections with 4 chart types each, data table, Scenario Planner tab; stores HTML in `dashboards/{user_id}/`; 24h render URL via proxy route |
| (multi) | Data Summary: fixed Supabase HTML MIME issue — added `/api/render/[...path]` proxy route serving `text/html`; added `text/html` to bucket MIME allowlist |
| `4fb2446` | Data Summary: fixed JS parse error "Unexpected identifier 'type'" — replaced `[...new Set()]` with `Array.from(new Set())`, renamed `var types` → `var typeVals`, `setFilter(type,…)` → `setFilter(fType,…)` |

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
4. Add connect route at `app/api/mcp/connect/[slug]/route.ts` — **folder name MUST exactly match the slug** (e.g. slug `storage-manager` → folder `connect/storage-manager/`)
5. Add entry to `MCP_META` in `app/api/mcp/install/[token]/route.ts`
6. Add entry to `MCP_CONTENT` in `components/mcp/SetupModal.tsx`
7. Add dispatch case in `app/api/mcp/[token]/route.ts`

**Critical rules for new tools:**
- Use streaming for any Anthropic API calls > 10s
- Keep `max_tokens` within reason — current research tool uses 5000 at Haiku speed (~15-25s), well within 300s timeout
- Pass `slug` prop to every `<ConfigSnippet>` usage
- If generating HTML files for browser rendering: store in Supabase, return URL via `/api/render/[...path]` proxy (Supabase forces `text/plain` for HTML regardless of upload MIME)
- Use `Array.from(new Set(...))` not `[...new Set(...)]` in inline HTML JavaScript — spread-of-iterator causes parse errors in some browser contexts

**UI is fully automatic — no extra code needed for:**
- `InstallModal` (Manage button): fully dynamic via `getMcpDefinition(slug)` — reads icon, name, and permissions from the definition file automatically
- `ConfigSnippet` combined config: already generates a single `mcpServers` block with ALL connected MCPs; dashboard passes `allInstalledMcps` to `InstallModal` and `allInstalled` to `SetupModal`
- You only need steps 1–7 above; the UI components handle themselves

---

## MCP UI Components — How They Work

### InstallModal (`components/mcp/InstallModal.tsx`)

Triggered by the **Manage** button on a connected MCP card. Fully dynamic — reads all display data from the MCP definition file via `getMcpDefinition(slug)`. No hardcoded content per MCP.

- Shows MCP icon, name, "Verified" badge from `definition.ts`
- Lists permissions (`canDo` / `cannotDo`) from definition
- Passes `allInstalled` (all connected MCPs) to `<ConfigSnippet>` so the config block includes every MCP

### ConfigSnippet (`components/mcp/ConfigSnippet.tsx`)

Shows the JSON config the user pastes into their AI client config file.

- Accepts `allInstalled?: Array<{ token: string; slug: string }>`
- When multiple MCPs are connected: shows **"All N MCPs included"** badge with slug pills, generates a single `mcpServers` block containing every connected MCP
- When single MCP: generates config for that MCP only
- Instruction text changes to "Replace the entire mcpServers block" when multi-MCP
- Supports tabs: Claude Desktop / Cursor / Windsurf / Continue.dev

### SetupModal (`components/mcp/SetupModal.tsx`)

Triggered by the **Setup Guide** button. Contains step-by-step instructions, auto-install script download buttons, and a `<ConfigSnippet>` for manual setup.

- `MCP_CONTENT` map in the file defines per-MCP steps and example prompts — add a new entry here for each new MCP
- Receives `allInstalled` from dashboard and passes it through to `<ConfigSnippet>`

### Dashboard prop wiring (`app/dashboard/page.tsx`)

```tsx
// Both modals receive the full installed MCPs list for combined config
<InstallModal allInstalledMcps={installedMcps} ... />
<SetupModal allInstalled={installedMcps.filter(m => m.status==='connected').map(m => ({token: m.mcp_token, slug: m.mcp_slug}))} ... />
```

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

## Storage Manager MCP — Additional Notes

### Storage path layout in `research-pdfs` bucket

```
research-pdfs/
  uploads/{user_id}/           ← Dashboard FileUpload widget (7-day URLs)
  storage/{user_id}/           ← Storage Manager MCP (24-hour URLs)
  pdfs/{user_id}/              ← PDF Creator MCP (24-hour URLs, tracked in storage_files)
  dashboards/{user_id}/        ← Data Summary MCP (24-hour URLs, tracked in storage_files)
```

Note: Company Research no longer uploads PDFs — it returns plain markdown text directly.

### Quota enforcement

Quota is checked at upload time by counting non-expired rows in `storage_files` for the user.
Expired files are NOT auto-deleted from Supabase Storage — they simply stop being counted toward quota.
If needed in future, add a cron job to purge rows where `expires_at < NOW()`.

---

## First Admin Setup

After deploying and running `supabase/schema.sql`:
```sql
SELECT promote_to_admin('your@email.com');
```
