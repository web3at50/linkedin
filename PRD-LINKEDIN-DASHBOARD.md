# PRD: UK Education LinkedIn Intelligence Dashboard

**Project:** Fork of PeopleHub, adapted for UK education prospecting
**Date:** 24 February 2026
**Status:** Planning

---

## 1. Overview

Fork the open-source PeopleHub project (https://github.com/MeirKaD/pepolehub) and adapt it into a LinkedIn intelligence dashboard for identifying and researching professionals in UK education. The tool will allow our team to search for people (headteachers, MAT directors, school leaders, etc.), read their LinkedIn posts/activity, and store prospect intelligence for manual outreach.

**What this is NOT:** An automated outreach tool. We contact people manually — this tool gives us the intelligence to do it well.

---

## 2. Source Project: PeopleHub

| | |
|---|---|
| **Repo** | https://github.com/MeirKaD/pepolehub |
| **License** | MIT (full commercial use permitted) |
| **Stars** | 318 |
| **Last commit** | 1 December 2025 |
| **Language** | TypeScript (97%) |
| **Live demo** | https://pepolehub.vercel.app |

### What PeopleHub Already Does
- Natural language search for LinkedIn professionals ("10 AI engineers in Israel")
- AI-powered query parsing (turns plain English into structured search parameters)
- LinkedIn profile scraping via Bright Data (profiles, posts, experience, education)
- AI research report generation via LangGraph (automated due diligence)
- Multi-tier caching: Redis (hot cache) + PostgreSQL (persistent) — 70-90% cost reduction
- Previous searches history
- Profile cards with expandable detail sections

### What PeopleHub Uses (Current)

| Layer | Current Version | Current Tech |
|-------|----------------|-------------|
| Framework | Next.js 15.5.4 | App Router |
| React | 19.1.0 | |
| ORM | Prisma 6.5.0 | |
| Database | PostgreSQL | Via Supabase |
| AI/LLM | Google Gemini 2.0 Flash | Via `@ai-sdk/google` 2.0.17 |
| AI SDK | Vercel AI SDK 5.0.60 | `ai` package |
| Research | LangGraph 1.0.1 + LangChain Core 1.0.3 | Agentic workflows |
| LinkedIn Data | Bright Data | REST API + MCP client |
| State | Zustand 5.0.2 + TanStack Query 5.62.18 | |
| UI | Tailwind CSS 4 + Radix UI + Framer Motion | |
| 3D | Three.js + React Three Fiber | Animated magnifying glass |
| Cache | ioredis 5.8.2 | Optional hot cache |
| Schema | Zod 3.25.76 | |

---

## 3. Target Stack (Upgraded)

| Layer | Target Version | Notes |
|-------|---------------|-------|
| **Framework** | **Next.js 16.1.x** | `proxy.ts` replaces `middleware.ts` |
| **React** | **19.2.x** | Ships with Next.js 16 |
| **ORM** | **Prisma 7.4.x** | Major version jump from 6.5 — check migration guide |
| **Database** | **Supabase PostgreSQL** | No change (Prisma already points at Supabase) |
| **Auth** | **Supabase Auth** | NEW — `@supabase/ssr` + `@supabase/supabase-js` |
| **AI/LLM** | **OpenAI (GPT-4o) or Anthropic (Claude)** | Swap `@ai-sdk/google` → `@ai-sdk/openai` or `@ai-sdk/anthropic` |
| **AI SDK** | **Vercel AI SDK 6.x** | Major version jump from 5.x — check migration guide |
| **Research** | **LangGraph** (keep) | Or remove if not needed initially |
| **LinkedIn Data** | **Bright Data** | No change — already integrated |
| **State** | **Zustand + TanStack Query** | No change |
| **UI** | **Tailwind CSS 4 + Radix UI** | Keep. Remove Three.js/3D animations |
| **Cache** | **Redis (optional)** | Keep — valuable for cost reduction |

### Key Dependency Changes Summary

```
# REMOVE
@ai-sdk/google                    # Gemini provider
@react-three/fiber                 # 3D rendering (unnecessary)
@react-three/drei                  # 3D helpers (unnecessary)
three                              # 3D engine (unnecessary)

# ADD
@ai-sdk/openai                    # OpenAI provider (or @ai-sdk/anthropic)
@supabase/supabase-js             # Supabase client
@supabase/ssr                     # Supabase auth for Next.js

# UPGRADE
next                 15.5.4 → 16.1.x
ai                   5.0.60 → 6.x
@prisma/client       6.5.0  → 7.4.x
prisma               6.5.0  → 7.4.x
react                19.1.0 → 19.2.x
react-dom            19.1.0 → 19.2.x
```

---

## 4. Architecture Changes

### 4.1 Authentication (NEW)

PeopleHub has **no authentication** — anyone can access it. We need single-user Supabase Auth with OAuth.

**Approach:** Supabase Auth with OAuth provider (Google or GitHub — whichever you prefer). Single user account, no team management needed.

**Implementation:**
- `@supabase/ssr` for server-side auth in Next.js 16
- `proxy.ts` (not middleware.ts) to protect all routes — redirect unauthenticated users to login
- Supabase Auth UI or custom login page with OAuth button
- Auth session checked server-side in layouts/route handlers (Next.js 16 best practice: auth logic in layouts, not in proxy.ts)

**Note on Next.js 16 + proxy.ts:**
Next.js 16 replaced `middleware.ts` with `proxy.ts`. The proxy runs on Node.js runtime (not Edge). For auth, the recommended pattern in Next.js 16 is:
- `proxy.ts` handles redirects (e.g., redirect `/` to `/login` if no auth cookie)
- Actual session validation happens in layouts or route handlers (not in proxy)
- Use `@supabase/ssr` `createServerClient()` in server components/route handlers

### 4.2 LLM Provider Swap

PeopleHub uses the Vercel AI SDK abstraction layer. All LLM calls use `generateObject()` or `generateText()` from the `ai` package with Zod schemas. The swap is mechanical:

**Files to modify (4 files):**

1. **`src/lib/search/parser.ts`**
   - `import { google } from '@ai-sdk/google'` → `import { openai } from '@ai-sdk/openai'`
   - `google('gemini-2.0-flash-exp')` → `openai('gpt-4o')` (or `anthropic('claude-sonnet-4-20250514')`)

2. **`src/lib/research/llm-service.ts`**
   - Same import swap in 3 functions: `generateSearchQuery()`, `summarizeWebContent()`, `generateResearchReport()`
   - `google('gemini-2.0-flash')` → `openai('gpt-4o')`

3. **`src/lib/brightdata/research.ts`**
   - Same import swap in `buildOptimizedPersonQuery()`
   - The fallback heuristic (when no API key is set) remains unchanged

4. **`.env`**
   - `GOOGLE_GENERATIVE_AI_API_KEY` → `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)

**AI SDK 6 migration note:** The Vercel AI SDK jumped from v5 to v6 in December 2025. Key changes:
- Full agent support with tool execution approval
- MCP support built-in
- `generateObject()` and `generateText()` API should be largely compatible
- Check the migration guide at https://v6.ai-sdk.dev/ for any breaking changes

### 4.3 Next.js 16 Migration

PeopleHub is on Next.js 15.5.4. Upgrading to 16.1.x involves:

- **`middleware.ts` → `proxy.ts`**: Rename the file (PeopleHub doesn't currently have middleware, so this is only relevant for the new auth proxy we're adding)
- **Async params**: Route params are now async in Next.js 16 — check `src/app/api/profile/[linkedinId]/route.ts` and `src/app/research/[id]/page.tsx`
- **`next/image` defaults**: Some defaults changed — check any Image components
- Run `npx @next/codemod@canary upgrade latest` to automate what it can

### 4.4 Prisma 6 → 7 Migration

Major version jump. Key changes:
- Prisma 7 removed the separate engine process — query compiler runs as WASM on the JS thread
- New `compilerBuild` option (`fast` vs `small`)
- Check the migration guide for any schema changes needed
- Run `npx prisma migrate` after upgrading

### 4.5 Remove Three.js / 3D Animations

PeopleHub has a 3D animated magnifying glass on the homepage using Three.js + React Three Fiber. Remove:

- Delete any components using `@react-three/fiber`, `@react-three/drei`, `three`
- Remove the 3D scene from the home page
- Replace with a simpler search-focused landing page
- Uninstall the packages

---

## 5. Data Model

PeopleHub's current schema has 3 models. We keep all three and extend for prospect management.

### Existing Models (Keep)

**Person** — LinkedIn profile data
- linkedinUrl, linkedinId, firstName, lastName, fullName, headline, about
- location, city, countryCode, profilePicUrl
- currentCompany, currentCompanyId
- experience (JSON), education (JSON), languages (JSON)
- connections, followers, searchCount, lastViewed

**Search** — Query history
- query, results (JSON), resultCount

**Research** — AI research reports
- personId (FK), linkedinUrl, personName, report (markdown), sources (JSON)
- status (pending/processing/completed/failed)

### New Models (Add)

**ProspectStatus** — Track outreach pipeline per person
```
model ProspectStatus {
  id           String   @id @default(cuid())
  personId     String   @unique
  person       Person   @relation(fields: [personId], references: [id])
  status       String   @default("new")        // new | researching | to_contact | contacted | engaged | not_relevant
  priority     String   @default("medium")      // high | medium | low
  notes        String?                           // free text notes
  lastContactedAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status])
  @@index([priority])
}
```

**Tag** and **PersonTag** — Tagging system
```
model Tag {
  id      String      @id @default(cuid())
  name    String      @unique                   // e.g. "Headteacher", "MAT Director", "EdTech Interest"
  persons PersonTag[]
}

model PersonTag {
  personId String
  tagId    String
  person   Person @relation(fields: [personId], references: [id])
  tag      Tag    @relation(fields: [tagId], references: [id])

  @@id([personId, tagId])
}
```

Also extend the **Person** model with:
```
// Add to existing Person model:
  prospectStatus  ProspectStatus?
  tags            PersonTag[]
```

---

## 6. Bright Data Integration

**No changes needed.** PeopleHub already integrates Bright Data via two patterns:

### Pattern 1: REST API (Profile + Search)
- **LinkedIn scraping** (`src/lib/brightdata/linkedin.ts`): Triggers Bright Data's LinkedIn People Profile dataset (`gd_l1viktl72bvl7bjuj0`). Submits URLs → polls for snapshot → returns structured profile data.
- **Google search** (`src/lib/brightdata/search.ts`): Uses Bright Data's Web Unlocker to proxy Google searches, extracting LinkedIn profile URLs from results.

### Pattern 2: MCP Client (Research)
- **Web research** (`src/lib/brightdata/client.ts`, `src/lib/brightdata/research.ts`): Connects to Bright Data's MCP server for `search_engine` and `scrape_batch` tools during LangGraph research workflows.

### What You Need
- Sign up at https://brightdata.com
- Get a `BRIGHTDATA_API_TOKEN`
- Set it in `.env`
- **No LinkedIn account needed** — Bright Data handles scraping on their infrastructure. Zero risk to your personal LinkedIn.

### Costs
- ~$2.50/1,000 LinkedIn requests (premium target)
- ~$0.05 per profile
- Free trial: 20 API calls
- You only pay for successful responses
- The multi-tier cache in PeopleHub reduces costs by 70-90% for repeat queries

---

## 7. Features: What We Keep, Remove, and Add

### Keep As-Is
- [x] Natural language search ("headteachers in London academies")
- [x] LinkedIn profile scraping and display (via Bright Data)
- [x] Profile cards with experience, education, headline
- [x] AI research reports (via LangGraph)
- [x] Multi-tier caching (Redis + PostgreSQL)
- [x] Previous searches page
- [x] Image proxy for LinkedIn photos

### Remove
- [ ] Three.js 3D magnifying glass animation
- [ ] Aurora/glassmorphism background effects (simplify)
- [ ] Google Gemini integration (swap to OpenAI/Anthropic)

### Add
- [ ] **Authentication** — Supabase Auth with OAuth (single user)
- [ ] **Prospect pipeline** — Status tracking (new → researching → to_contact → contacted → engaged)
- [ ] **Tagging** — Tag people with roles/interests ("Headteacher", "EdTech Buyer", "MAT Director")
- [ ] **Notes** — Free text notes per prospect
- [ ] **Priority flagging** — High/medium/low priority per prospect
- [ ] **Export** — Download prospect list as CSV with key fields
- [ ] **LinkedIn post display** — Show recent posts for each person with direct links back to LinkedIn
- [ ] **UK education defaults** — Default search context to UK education sector
- [ ] **Pagination** — Paginate search results (currently single page)

### Consider for Later
- Daily cron job for automated post monitoring of saved prospects
- Activity alerts ("This prospect just posted about EdTech")
- Dashboard analytics (most active prospects, activity trends)
- Bulk operations (import CSV of LinkedIn URLs, bulk enrich)
- Companies House integration for MAT trust directors (free API)

---

## 8. Pages / Routes

### Existing (from PeopleHub, keep/modify)
| Route | Purpose | Changes |
|-------|---------|---------|
| `/` | Home — search bar | Simplify UI, remove 3D animation, add auth guard |
| `/search` | Search results | Add tag/status actions per result card |
| `/previous` | Previous searches | Keep |
| `/research/[id]` | Research report view | Keep |
| `/api/search` | Search API | Keep |
| `/api/profiles` | Batch profiles API | Keep |
| `/api/profile/[linkedinId]` | Single profile API | Keep |
| `/api/research` | Research report API | Keep |
| `/api/proxy-image` | LinkedIn image proxy | Keep |

### New Routes
| Route | Purpose |
|-------|---------|
| `/login` | OAuth login page (Supabase Auth) |
| `/prospects` | Prospect pipeline — filterable list with status/tags/priority |
| `/prospects/[id]` | Prospect detail — profile + posts + notes + research |
| `/api/prospects` | CRUD for prospect status, tags, notes |
| `/api/export` | CSV export of prospect list |
| `proxy.ts` | Auth redirect (unauthenticated → `/login`) |

---

## 9. Environment Variables

```env
# Database (Supabase PostgreSQL — via Prisma)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Bright Data
BRIGHTDATA_API_TOKEN="your-brightdata-api-token"

# OpenAI (or Anthropic)
OPENAI_API_KEY="sk-..."
# OR: ANTHROPIC_API_KEY="sk-ant-..."

# Redis (optional — for hot cache)
REDIS_URL="redis://..."
```

---

## 10. Implementation Plan

### Phase 1: Fork & Upgrade (Days 1-3)

| # | Task | Detail |
|---|------|--------|
| 1.1 | Fork the repo | `git clone https://github.com/MeirKaD/pepolehub` → new repo |
| 1.2 | Upgrade Next.js to 16.1.x | Run `npx @next/codemod@canary upgrade latest`. Fix async params in dynamic routes. |
| 1.3 | Upgrade Prisma to 7.4.x | `npm install prisma@latest @prisma/client@latest`. Run migration guide checks. |
| 1.4 | Upgrade AI SDK to 6.x | `npm install ai@latest`. Check migration guide for breaking changes. |
| 1.5 | Swap Gemini → OpenAI | Install `@ai-sdk/openai`, update 4 files (parser.ts, llm-service.ts, research.ts, .env). Remove `@ai-sdk/google`. |
| 1.6 | Remove Three.js | Uninstall `three`, `@react-three/fiber`, `@react-three/drei`. Remove 3D components. Simplify home page. |
| 1.7 | Verify it runs | `npm run dev` — confirm search, profile display, and research reports all work with new stack. |

### Phase 2: Authentication (Days 3-5)

| # | Task | Detail |
|---|------|--------|
| 2.1 | Set up Supabase project | Create project, enable OAuth provider (Google or GitHub) |
| 2.2 | Install Supabase packages | `npm install @supabase/supabase-js @supabase/ssr` |
| 2.3 | Create Supabase client utils | Server client (`createServerClient`) and browser client helpers |
| 2.4 | Add `proxy.ts` | Redirect unauthenticated users to `/login`. Check for Supabase auth cookie. |
| 2.5 | Build login page | `/login` with OAuth button. Use Supabase Auth UI or custom. |
| 2.6 | Protect API routes | Check auth session in all `/api/` route handlers |
| 2.7 | Add sign out | Sign out button in navigation |

### Phase 3: Prospect Management (Days 5-10)

| # | Task | Detail |
|---|------|--------|
| 3.1 | Extend Prisma schema | Add ProspectStatus, Tag, PersonTag models. `npx prisma db push` |
| 3.2 | Build `/prospects` page | Filterable list: search by name/headline, filter by status/priority/tag |
| 3.3 | Build `/prospects/[id]` page | Tabbed detail view: Profile, Posts, Research, Notes |
| 3.4 | Add status/priority controls | Dropdown to change status, priority per prospect |
| 3.5 | Add tagging | Create/assign/remove tags per prospect. Tag filter on list page. |
| 3.6 | Add notes | Free text notes with timestamps per prospect |
| 3.7 | Add "Save as Prospect" | Button on search results to save a person as a prospect |
| 3.8 | Build CSV export | `/api/export` — download filtered prospect list as CSV |

### Phase 4: UK Education Focus (Days 10-12)

| # | Task | Detail |
|---|------|--------|
| 4.1 | Update search parser prompt | Modify the system prompt in `parser.ts` to default to UK education context. Understand terms like "headteacher", "MAT director", "SLT", "academy trust". |
| 4.2 | Update research report prompt | Modify `buildReportPrompt()` in `llm-service.ts` to focus on education sector context. |
| 4.3 | Pre-populate tags | Seed common tags: Headteacher, Deputy Head, MAT Director, Head of IT, SLT, Academy Trust, Primary, Secondary, SEN, EdTech Interest |
| 4.4 | Default UK geolocation | Set default `countryCode: 'GB'` and `gl: 'uk'` in search parameters |

### Phase 5: Polish & Harden (Days 12-15)

| # | Task | Detail |
|---|------|--------|
| 5.1 | Add pagination | Paginate search results and prospect list |
| 5.2 | LinkedIn post display | Ensure posts are displayed per prospect with direct links to LinkedIn |
| 5.3 | Rate limiting | Add basic rate limiting to API routes to control Bright Data costs |
| 5.4 | Error handling | Improve error states for failed scrapes, API errors, etc. |
| 5.5 | Simplify UI | Clean up glassmorphism effects, make it professional/functional |
| 5.6 | Deploy to Vercel | Connect repo to Vercel, set env vars, deploy |
| 5.7 | Test end-to-end | Search → save prospect → view posts → add notes → export CSV |

---

## 11. Costs (Monthly)

| Item | Cost |
|------|------|
| Vercel Pro (1 seat) | $20/month |
| Supabase Pro | $25/month |
| Bright Data (pay-as-you-go) | ~$50-100/month (depends on usage) |
| OpenAI API | ~$10-30/month (depends on research report usage) |
| Redis (Upstash free tier or similar) | $0-10/month |
| **Total** | **~$105-185/month** |

vs Myuser at $1,200/month = **saving $12,000-13,000/year**

---

## 12. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Bright Data gets sued/shut down (like Proxycurl) | Medium | Abstract data provider behind an interface. Linked API ($49/month) as backup. |
| GDPR complaint from a scraped person | Low-Medium | Conduct Legitimate Interest Assessment. Have privacy notice. Delete data on request. |
| AI SDK 6 has breaking changes vs 5 | Low | Vercel maintains good migration guides. `generateObject`/`generateText` API is stable. |
| Prisma 7 migration breaks something | Low | Test thoroughly. Prisma has a migration guide. Schema is simple (3+3 models). |
| Bright Data costs spiral | Low | Multi-tier caching already built in (70-90% reduction). Add rate limits. |
| OpenAI/Anthropic structured output differences | Low | OpenAI `generateObject()` works great. For Anthropic, may need `mode: 'tool'`. Test early. |

---

## 13. Definition of Done

The MVP is complete when:

1. You can sign in via OAuth (Google or GitHub)
2. You can search for UK education professionals by natural language query
3. Search results show LinkedIn profile cards (name, headline, school/company, photo)
4. You can save a person as a prospect with status, priority, and tags
5. You can view a prospect's LinkedIn posts with links back to LinkedIn
6. You can add free text notes to a prospect
7. You can generate an AI research report on a prospect
8. You can filter/search your prospect list by status, priority, tags, name
9. You can export your prospect list as CSV
10. All of the above works on Vercel with Supabase backend

---

*This PRD is based on detailed analysis of the PeopleHub source code, current dependency versions as of February 2026, and the research findings in LINKEDIN-PROSPECTING-RESEARCH.md.*
