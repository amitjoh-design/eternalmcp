# ⚡ Eternal MCP

**The Infrastructure Layer for AI Tools**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amitjoh-design/eternalmcp)
[![CI](https://github.com/amitjoh-design/eternalmcp/actions/workflows/ci.yml/badge.svg)](https://github.com/amitjoh-design/eternalmcp/actions/workflows/ci.yml)

A production-ready SaaS marketplace for Model Context Protocol (MCP) tools — the infrastructure layer connecting AI models to real-world capabilities.

---

## 🗺 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    eternalmcp.com                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Home   │  │Marketplace│  │Dashboard │  │  Admin   │  │
│  │  Page    │  │  Browse  │  │Developer │  │  Panel   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 14 App Router                  │   │
│  │  (React + TypeScript + TailwindCSS + Framer Motion) │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Supabase                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │  Auth    │  │PostgreSQL│  │    Storage       │ │   │
│  │  │ (GitHub) │  │   DB     │  │  (icons/avatars) │ │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │      Deployment         │
              │  GitHub → Vercel (CD)   │
              │  eternalmcp.com         │
              └─────────────────────────┘
```

---

## 🗄 Database Schema

```
users
├── id (UUID, FK → auth.users)
├── email, name, avatar_url
├── role: user | developer | admin
├── github_username, bio, website
└── created_at, updated_at

mcp_tools
├── id (UUID)
├── name, slug, description, long_description
├── creator_id (FK → users)
├── api_endpoint, documentation_url
├── category (enum), tags (array), version
├── status: pending | approved | rejected | archived
├── is_featured, icon_url, github_url, license
└── created_at, updated_at

tool_usage
├── id, user_id (FK), tool_id (FK)
├── usage_count, last_used
└── UNIQUE(user_id, tool_id)

reviews
├── id, tool_id (FK), user_id (FK)
├── rating (1-5), review_text
└── UNIQUE(tool_id, user_id) — one review per user per tool

api_keys
├── id, user_id (FK)
├── name, key_prefix, key_hash
└── expires_at, last_used
```

---

## 📁 Repository Structure

```
eternal-mcp/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint + Type check + Build
│       └── deploy.yml       # Auto-deploy to Vercel on push to main
├── app/
│   ├── layout.tsx           # Root layout (fonts, metadata, Toaster)
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── auth/
│   │   ├── page.tsx         # Login / Signup page
│   │   └── callback/
│   │       └── route.ts     # OAuth callback handler
│   ├── marketplace/
│   │   └── page.tsx         # Tool browser with search/filter
│   ├── tools/
│   │   └── [id]/
│   │       └── page.tsx     # Individual tool detail page
│   ├── dashboard/
│   │   └── page.tsx         # Developer dashboard
│   └── admin/
│       └── page.tsx         # Admin panel
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx       # Responsive navbar with auth
│   │   └── Footer.tsx       # Footer with links
│   ├── ui/
│   │   ├── Button.tsx       # Multi-variant button
│   │   ├── Card.tsx         # Glass/bordered card variants
│   │   ├── Badge.tsx        # Status/category badges
│   │   └── Input.tsx        # Input, Textarea, Select
│   ├── home/
│   │   ├── Hero.tsx         # Animated hero section
│   │   ├── Features.tsx     # Feature grid + MCP explainer
│   │   ├── HowItWorks.tsx   # Steps + code snippet
│   │   └── FeaturedTools.tsx # Tool cards grid
│   ├── marketplace/
│   │   ├── ToolCard.tsx     # Tool card + skeleton
│   │   └── SearchFilter.tsx # Search + category filter
│   └── dashboard/
│       ├── SubmitToolForm.tsx # MCP tool submission form
│       └── Analytics.tsx    # Usage charts (Recharts)
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client
│   │   └── server.ts        # Server-side Supabase client
│   ├── types.ts             # All TypeScript interfaces
│   └── utils.ts             # Helpers, formatters, constants
├── supabase/
│   ├── schema.sql           # Complete DB schema with RLS
│   └── seed.sql             # Sample data + useful views
├── middleware.ts            # Auth route protection
├── .env.example             # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- Vercel account
- GitHub account

---

## 📋 Step-by-Step Deployment

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard/org/bibfwrakvwhzaizoauvv](https://supabase.com/dashboard/org/bibfwrakvwhzaizoauvv)
2. Click **New Project**
3. Name it `eternal-mcp`, choose a region close to your users
4. Wait for provisioning (~2 minutes)
5. Go to **SQL Editor** and run `supabase/schema.sql` in full
6. Then run `supabase/seed.sql`
7. Copy your project URL and anon key from **Settings → API**

### Step 2: Configure GitHub OAuth in Supabase

1. In Supabase: **Authentication → Providers → GitHub**
2. Enable GitHub provider
3. Go to [github.com/settings/applications/new](https://github.com/settings/applications/new)
4. Set Homepage URL: `https://eternalmcp.com`
5. Set Callback URL: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret back to Supabase

### Step 3: Set Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://eternalmcp.com
```

### Step 4: Connect GitHub Repository

```bash
# Clone or initialize your repo
cd eternal-mcp
git init
git remote add origin https://github.com/amitjoh-design/eternalmcp.git
git add .
git commit -m "feat: initial Eternal MCP platform"
git push -u origin main
```

### Step 5: Deploy to Vercel

**Option A — Vercel Dashboard (Recommended)**:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `https://github.com/amitjoh-design/eternalmcp`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://eternalmcp.com`
4. Click **Deploy**

**Option B — GitHub Actions Auto-Deploy**:

Add these secrets in GitHub repo Settings → Secrets → Actions:
- `VERCEL_TOKEN` — from [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then push to `main` — GitHub Actions deploys automatically.

### Step 6: Connect Domain eternalmcp.com

1. In Vercel project → **Settings → Domains**
2. Add `eternalmcp.com` and `www.eternalmcp.com`
3. In your domain registrar DNS settings:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate (usually < 5 minutes)
5. Update Supabase Auth: **Authentication → URL Configuration**
   - Site URL: `https://eternalmcp.com`
   - Redirect URLs: `https://eternalmcp.com/auth/callback`

### Step 7: Create First Admin User

1. Sign up at `https://eternalmcp.com/auth`
2. In Supabase SQL Editor, run:
   ```sql
   SELECT promote_to_admin('your@email.com');
   ```
3. You now have full admin access at `/admin`

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## 🔐 Security Features

- **Row Level Security** — all tables have RLS policies
- **Role-based access** — user / developer / admin
- **Protected routes** — middleware guards `/dashboard` and `/admin`
- **Auth callbacks** — secure OAuth flow via Supabase
- **HTTPS only** — enforced via Vercel

---

## 📈 Future Scaling Roadmap

### Phase 1 — Launch (Current)
- [x] Core marketplace with search & filter
- [x] Developer dashboard with tool submission
- [x] Admin panel with review workflow
- [x] Auth (email + GitHub OAuth)
- [x] Analytics dashboard

### Phase 2 — Growth (3-6 months)
- [ ] Stripe integration for tool monetization
- [ ] Webhooks for real-time tool usage tracking
- [ ] SDK packages (npm: `@eternal-mcp/client`)
- [ ] Tool versioning & changelog
- [ ] Developer badges and reputation system
- [ ] Email notifications (tool approved/rejected)

### Phase 3 — Scale (6-12 months)
- [ ] Multi-tenant API gateway with rate limiting
- [ ] Tool performance monitoring (p95 latency)
- [ ] Enterprise SSO (SAML/OIDC)
- [ ] Tool collections and bundles
- [ ] AI-powered tool recommendations
- [ ] Public API for third-party integrations

### Phase 4 — Platform (12+ months)
- [ ] MCP tool testing sandbox
- [ ] Automated security scanning
- [ ] Revenue sharing for tool creators
- [ ] Decentralized tool registry (IPFS)
- [ ] Mobile apps (iOS/Android)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the Eternal MCP team**
[eternalmcp.com](https://eternalmcp.com) · [GitHub](https://github.com/amitjoh-design/eternalmcp)
