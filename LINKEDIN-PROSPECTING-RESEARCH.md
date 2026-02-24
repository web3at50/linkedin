# LinkedIn Prospecting for UK Education: Research & Options Report

**Date:** 24 February 2026
**Context:** You sell software to UK education (schools, universities). You received outreach from Myuser (myuser.com) offering AI-powered LinkedIn prospecting at ~$1,200/month. This report evaluates whether you can build this yourself and what the options are.

---

## Table of Contents

1. [What Myuser Offers & Is It Worth It?](#1-what-myuser-offers--is-it-worth-it)
2. [Competitor Tools & Pricing](#2-competitor-tools--pricing)
3. [LinkedIn API - Official Route](#3-linkedin-api---official-route)
4. [Scraping & Unofficial Methods](#4-scraping--unofficial-methods)
5. [Third-Party Data Providers](#5-third-party-data-providers)
6. [UK Education-Specific Data Sources](#6-uk-education-specific-data-sources)
7. [Legal & GDPR Risks](#7-legal--gdpr-risks)
8. [Building Your Own Dashboard (Next.js + Vercel + Supabase)](#8-building-your-own-dashboard)
9. [Cost Comparison: DIY vs Myuser](#9-cost-comparison)
10. [Recommended Approach](#10-recommended-approach)

---

## 1. What Myuser Offers & Is It Worth It?

**What they do:** Myuser positions itself as an "Autonomous B2B Sales" platform founded by Ibrahim Hasanov. Their AI:
- Finds leads matching your targeting criteria
- Spends ~20 minutes researching each prospect (reading full LinkedIn profile, posts, X/Twitter activity)
- Sends hyper-personalised emails referencing their actual content/challenges
- Handles replies autonomously (two-way AI conversations)
- Books meetings automatically
- Builds custom landing pages per prospect

**Pricing:** Pay-per-prospect model (~$2/prospect). $1,200/month would buy ~600 prospects. Enterprise clients typically scale from $3,000 to $12,000/month. Credits roll over monthly.

**Reputation concerns:**
- Very limited independent reviews (thin Trustpilot/Capterra presence)
- No G2 page with significant reviews
- Blog content suggests a recent pivot from payments to AI outreach
- No education sector case studies found
- "One-person unicorn" marketing claims should be viewed sceptically
- Bold claims about AI avoiding hallucinations are unverified

**Verdict:** The concept is compelling but the product appears early-stage with insufficient independent validation. For the education sector specifically, where trust and institutional credibility are paramount, having an autonomous AI send messages to school administrators carries reputational risk you should weigh carefully.

---

## 2. Competitor Tools & Pricing

### Outreach Automation Tools (You Operate Them)

| Tool | Monthly Cost | LinkedIn? | Reads Prospect Posts? | Notes |
|------|-------------|-----------|----------------------|-------|
| **Expandi.io** | $99/seat | Yes | Yes (partial) | Cloud-based, mimics human behaviour, auto-liking, A/B testing |
| **Lemlist** | $69-$99/user | Yes (at $99) | Limited | Email-first, visual personalisation, 450M+ lead database |
| **Skylead** | $100/seat | Yes | Limited | Smart if/else sequences, SalesGPT 2.0 for auto-responses |
| **La Growth Machine** | EUR 50-180/user | Yes | Partial | LinkedIn + Email + X, visual sequence builder |
| **Dripify** | $59-$99/user | Yes | No | Drip campaigns, pre-built templates |
| **Meet Alfred** | $29-$99/seat | Yes | Partial (retargeting) | Post retargeting, AI Lead Finder |
| **Instantly.ai** | $37-$358/mo | **No (email only)** | No | High-volume cold email, not LinkedIn |

### Fully Autonomous AI SDRs (Like Myuser)

| Tool | Pricing | Key Feature |
|------|---------|-------------|
| **Valley.ai** | ~$400/seat/month | LinkedIn-first AI SDR, signal-based triggers |
| **Artisan AI ("Ava")** | Custom (annual) | AI BDR, automates 80% of BDR workflow |
| **AiSDR** | $900-$2,500/month | All-in-one AI SDR, HubSpot-native |
| **CoPilot AI** | Not public | LinkedIn-focused, identifies high-value prospects |

### Key Insight
None of these tools are specifically designed for **monitoring LinkedIn activity and building prospect intelligence** — they're focused on **sending outreach**. Your actual need (identify people, read their content, build a database of what they're interested in, then contact them manually) is better served by a custom dashboard.

---

## 3. LinkedIn API - Official Route

### The Hard Truth

**LinkedIn's official API is extremely restrictive for prospecting use cases.** Here's what you need to know:

### API Products & Access Levels

| Product | What It Does | Can You Use It for Prospecting? |
|---------|-------------|-------------------------------|
| **Sign In with LinkedIn (OpenID Connect)** | "Sign in with LinkedIn" button | No — authentication only |
| **Share on LinkedIn** | Post content to LinkedIn | No — posting only |
| **Marketing APIs** | Ad campaigns, analytics, lead gen forms | **Explicitly prohibits** using member data for "sales, recruiting, lead generation, CRM enrichment, or advertising" |
| **Community Management API** | Manage LinkedIn Pages | No — limited to pages you own |
| **Consumer Solutions Platform** | Full profile data, connections | **Extremely restricted** — only granted to major platforms |
| **Talent Solutions** | Recruiter tools | Recruiting only, very expensive, enterprise contracts |
| **Sales Navigator API** | CRM sync for Sales Nav data | Only for existing Sales Navigator Enterprise customers |

### Key Restrictions
- Profile data can only be stored for **24 hours**; social activity data for **48 hours**
- Daily API calls capped at ~100,000 but with very narrow approved use cases
- The Marketing API explicitly prohibits lead generation and CRM enrichment
- There is **no legitimate way to use LinkedIn's official API for third-party prospecting**
- Access requires a LinkedIn Developer application with approved use cases — prospecting will not be approved

### LinkedIn Sales Navigator (The Semi-Official Route)
- **Cost:** ~$80/month (Professional), ~$135/month (Team), Enterprise pricing on request
- **What you get:** Advanced search filters (industry, job title, company size, geography), lead lists, InMail credits, CRM integrations
- **What you don't get:** API access to export data or read posts programmatically. There is **no native export function** — this is deliberate
- **For your use case:** You could manually search for UK education leaders and browse their profiles, but you can't programmatically pull their posts or build automated pipelines

### Application Process
- Apply via LinkedIn Developer Portal (developer.linkedin.com)
- Basic access (Sign In, Share) is relatively easy to get
- Marketing/Advertising API requires a verified company page and advertising account
- Consumer/Talent/Sales Navigator APIs require enterprise relationships and are not available to small companies
- Friend's experience of difficulty is typical — LinkedIn is very selective about granting higher-tier access

### Bottom Line on Official API
**The official LinkedIn API is not a viable route for your use case.** It's designed for enterprise platform integrations, not for small companies doing sales prospecting. You would need to look at unofficial methods or third-party providers.

---

## 4. Scraping & Unofficial Methods

### Open-Source Tools

| Tool | Language | How It Works | Status |
|------|----------|-------------|--------|
| **`open_linkedin_api`** (fork of Tom Quirk's linkedin-api) | Python | Hits LinkedIn's internal "Voyager" API endpoints using credentials/cookies | Active, pip installable |
| **`pratik-dani/LinkedIn-Scraper`** (124 stars) | JavaScript | Direct HTTP API calls, no Selenium needed | Active |
| **`linkedin-scraper` v3.0** | Python | Playwright-based | Active |
| **`drissbri/linkedin-scraper`** | Python | Selenium + FastAPI RESTful API | Active |
| **`samarthya04/LinkedIn-Profile-Scraper`** | Python | Selenium + LLMs (OpenRouter) + SQLite, 200+ profiles | Active |

### Commercial Scraping/Automation Tools

| Tool | Type | Price | Key Feature |
|------|------|-------|-------------|
| **PhantomBuster** | Cloud | From $56/month | 100+ automations, Sales Navigator export, post scraping |
| **Evaboot** | Chrome Extension | From $29/month | Specifically for exporting Sales Navigator searches to CSV |
| **Linked Helper** | Desktop App | From ~$15/month | Desktop-based (less detectable than cloud tools) |
| **Dux-Soup** | Chrome Extension | From ~$15/month | Profile visits, connection requests, drip campaigns |
| **Octopus CRM** | Chrome Extension | From ~$10/month | Connection requests, messaging, profile visits |
| **Waalaxy** | Chrome + Cloud | From ~$56/month | LinkedIn + email sequences |

### LinkedIn Data API Services

| Service | Price | What You Get | Login Required? |
|---------|-------|-------------|-----------------|
| **Linked API** (linkedapi.io) | $49-$99/seat/month | Full API: search people, retrieve posts/comments/reactions | Yes (your LinkedIn account) |
| **Bright Data** (LinkedIn Scraper API) | $1.50/1,000 records (down to $0.75/1K at scale) | Profiles, posts, companies | No (uses their proxy infrastructure) |
| **Apify - HarvestAPI Posts Scraper** | $2/1,000 posts | Post content, no cookies needed, 4,400+ users | **No** |
| **Apify - Sales Nav Scraper** | $5/1,000 results | Export Sales Navigator searches | Yes |
| **Proxycurl** | From ~$49/month | Profile enrichment | No |
| **Lix-it** | Credit-based | Post enrichment, profile data | Varies |

**Important note:** Proxycurl was shut down in July 2025 after LinkedIn filed a federal lawsuit against them. LinkedIn is actively pursuing legal action against scraping services.

### Technical Approaches

**Voyager API (what the unofficial libraries use):**
- LinkedIn's web/mobile apps use internal endpoints (`linkedin.com/voyager/api/...`)
- Can fetch profiles, search results, posts, connections
- Requires authentication via credentials or session cookies (`li_at` cookie)
- Undocumented — LinkedIn changes endpoints without notice
- LinkedIn monitors patterns and can detect automated usage

**Browser Automation (Playwright/Puppeteer/Selenium):**
- Launch a real browser, log in, navigate and extract data from DOM
- Playwright is the best current choice (built by former Puppeteer team)
- Must use residential proxies, random delays, human-like behaviour
- LinkedIn has sophisticated anti-detection: behavioural analysis, fingerprinting, rate limiting, CAPTCHAs

**Account Ban Reality:**
- LinkedIn restricted **over 30 million accounts in 2025**
- "Safe" daily limits: ~20-30 connection requests, ~50-80 profile views, ~30-50 messages
- Ban levels: soft restriction (hours/days) → hard restriction (weeks/months) → permanent ban
- Recovery from permanent ban is nearly impossible

---

## 5. Third-Party Data Providers

### B2B Contact Databases

| Provider | Price | Database Size | UK Education Coverage | GDPR Position |
|----------|-------|---------------|----------------------|---------------|
| **Cognism** (London HQ) | ~$1,500-$25,000/year | Large | **Best for UK/EU** — phone-verified "Diamond Data" | GDPR-compliant by design |
| **Apollo.io** | Free / $49-$119/user/month | 275M+ contacts | Patchy for education | Reasonable |
| **ZoomInfo** | ~$14,000-$25,000+/year | 321M+ contacts | Enterprise-level roles only | US-focused compliance |
| **Lusha** | Free / $36/month+ | 100M+ contacts | Moderate | Community-contributed |
| **RocketReach** | ~$39-$249/month | 700M+ profiles | Good | Web crawling based |
| **Hunter.io** | Free / GBP 28-175/month | Email-focused | Good for domains | Domain-based |
| **Snov.io** | Free / $39-$149+/month | 200M+ contacts | Moderate | Reasonable |
| **Kaspr** (Cognism group) | Free / from ~EUR 45/month | 200M+ contacts | Good for EU | GDPR-focused |

### Important Caveat
Most B2B data providers are optimised for **commercial sectors** (tech, finance, professional services). Education is a niche vertical. You'll find MAT CEOs and academy trust directors, but not classroom teachers or department heads. Education-specific providers (see Section 6) are better for your niche.

---

## 6. UK Education-Specific Data Sources

### GIAS (Get Information About Schools) — FREE & LEGAL

**This is the single most valuable data source for your use case.**

GIAS (`get-information-schools.service.gov.uk`) is the Department for Education's comprehensive database of all educational establishments in England:

- **~65,000 establishments**: academies, maintained schools, free schools, independents, children's centres
- **250+ data fields per establishment**: name, address, phone, website, school type, phase, LA, Ofsted rating, URN, UKPRN
- **Governance data**: headteachers, chairs of governors, trust members, academy trust leadership
- **Free CSV downloads** at `get-information-schools.service.gov.uk/Downloads` — updated **daily**
- **Open-source tools**: `DFE-Digital/gias-data` (GitHub) generates JSON for all schools

**What GIAS gives you:** Every school in England with contact info, type, region, Ofsted rating, and governance roles. This is your foundation — completely legal, free, and comprehensive.

**What GIAS doesn't give you:** Individual teacher email addresses (only generic school contacts). However, headteacher names are available through governance data.

### Other Free Public Sources

| Source | What It Provides |
|--------|-----------------|
| **Companies House** | Academy trusts are registered companies — directors/trustees listed as company officers (free API available) |
| **Charity Commission** | Many schools/trusts are registered charities |
| **Compare School Performance** | Performance data with school details |
| **Ofsted Reports** | Inspection reports naming school leadership |
| **Schools Financial Benchmarking** | Financial data with school details |
| **Local Authority websites** | Many publish lists of schools with contacts |
| **School websites** | Most list their SLT (Senior Leadership Team) |

### Education-Specific Marketing Data Providers

| Provider | What They Offer | Coverage |
|----------|----------------|----------|
| **Buzz Education** (buzz-education.com) | Claims 671,067 school staff contacts, email marketing services, specific databases for nurseries, MATs, international schools | UK education-specific |
| **Sprint Education** (sprint-education.co.uk) | "Campus" platform — verified teacher direct emails, 398 job roles covered, CRM + prospecting hub | UK + international schools |
| **Market Location** | UK B2B data including education, GDPR/PECR compliant, founded 1972 | UK-wide |

### Education Platforms Where Educators Congregate

- **TES (tes.com)** — primary platform for UK education jobs, Schools Directory, educator community
- **Education Support** — wellbeing-focused, educator network
- **ASCL / NAHT** — headteacher/school leader professional associations

---

## 7. Legal & GDPR Risks

### LinkedIn Terms of Service
LinkedIn **explicitly prohibits**:
- Using bots, crawlers, scrapers, or any automated means to access LinkedIn
- Using browser plugins/extensions that scrape or modify LinkedIn
- Collecting, using, or transferring data obtained from LinkedIn via scraping

### The hiQ Labs v. LinkedIn Case (Does NOT Protect You)
- US 9th Circuit ruled scraping **public** data doesn't violate the Computer Fraud and Abuse Act (CFAA)
- However, hiQ was ultimately found in breach of LinkedIn's ToS (breach of contract)
- **This is US case law only — it does not apply in the UK**
- LinkedIn actively litigates: sued ProAPIs in February 2026, shut down Proxycurl in July 2025

### GDPR — The Primary Risk for a UK Company

**This is your biggest legal concern.** Key points:

1. **Lawful basis required**: Collecting names, job titles, LinkedIn URLs of UK residents = processing personal data under UK GDPR. Most commonly attempted basis is "Legitimate Interest" but regulators have taken the view that scraping social media for commercial prospecting often **does not pass** the legitimate interest test.

2. **ICO enforcement is increasing**: Average fines rose from GBP 150,000 (2024) to GBP 933,000-2.8M (2025). ICO collected GBP 19.6M in fines in H1 2025 alone. The Clearview AI case confirmed UK GDPR applies to foreign companies scraping UK residents' data (GBP 7.5M fine).

3. **Article 14 obligation**: When collecting personal data not from the data subject, you must inform them within one month — impractical at scale.

4. **October 2024 joint statement**: The ICO and 16 global data protection authorities issued a follow-up statement making data scraping an enforcement priority.

### Realistic Risk Assessment for Your Company

| Risk | Level | Notes |
|------|-------|-------|
| **LinkedIn suing you** | LOW | They target large-scale scrapers and data resellers, not small companies |
| **Account ban** | MEDIUM-HIGH | 30M+ accounts restricted in 2025. Real risk if using automation tools |
| **GDPR/ICO enforcement** | MEDIUM-HIGH | If a scraped individual complains to ICO, you need to demonstrate lawful basis. Fines up to GBP 17.5M or 4% of turnover |
| **Reputational risk** | MEDIUM | If prospects discover automated data collection, especially in the trust-sensitive education sector |

### Mitigating GDPR Risk
- Conduct and document a **Legitimate Interest Assessment (LIA)** before processing any data
- Have a **privacy notice** covering data obtained from third-party sources
- Implement **data retention limits** — don't keep data indefinitely
- Have a process for **Subject Access Requests** and **deletion requests**
- Prefer **education-specific data providers** (Buzz Education, Sprint Education) who handle GDPR compliance themselves
- Use **GIAS data** as your foundation — it's public government data with no GDPR concerns for the organisational data

---

## 8. Building Your Own Dashboard

### Recommended Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 15+ App Router** | Server Components, Server Actions, route handlers |
| Auth | **Supabase Auth** | Email/password + magic links for team sign-in |
| Database | **Supabase Postgres** | All prospect/activity data, Row-Level Security |
| Scheduling | **Supabase Cron (pg_cron) + Edge Functions** | Daily data gathering |
| Hosting | **Vercel** | Frontend deployment |
| UI | **shadcn/ui + Tailwind CSS** | Dashboard components |

### Data Model

**Core tables:**
- `organisations` — schools/MATs from GIAS (name, URN, type, phase, region, Ofsted rating, contact info)
- `prospects` — people (name, job title, LinkedIn URL, email, organisation link, status, priority)
- `linkedin_posts` — their posts (content text, post URL, published date, reactions/comments counts)
- `linkedin_activity` — their comments/reactions on others' posts
- `prospect_notes` — your team's notes per prospect
- `tags` / `prospect_tags` — tagging system (e.g., "MAT Director", "EdTech Buyer", "Contacted")
- `data_collection_runs` — logging for scheduled enrichment jobs

### Data Ingestion Strategy

**Step 1: GIAS Import (Free, Legal, Day 1)**
- Download the GIAS CSV (61+ MB, all UK schools)
- Import into `organisations` table
- This gives you ~65,000 schools with contact info, type, region, Ofsted ratings

**Step 2: LinkedIn Data via Third-Party APIs**
- **Linked API** ($49/month) for searching people and retrieving individual profiles/posts
- **Bright Data** ($1.50/1,000 records) for bulk profile/post scraping
- **Apify HarvestAPI** ($2/1,000 posts) for post content — **no LinkedIn login required**
- Abstract your data provider behind an interface so you can swap providers (important given Proxycurl's shutdown)

**Step 3: Daily Enrichment Pipeline**
1. Supabase Cron triggers Edge Function daily
2. Edge Function queries prospects due for re-enrichment
3. Calls data provider APIs to fetch latest posts/activity
4. Upserts new data into `linkedin_posts` and `linkedin_activity`
5. Logs run status

### Implementation Timeline

**Week 1 (MVP):**
- Day 1: Auth + protected dashboard shell (use Supabase Next.js template)
- Day 2: Database schema + GIAS CSV import
- Day 2-3: Prospect CRUD (list, search, add, edit, notes, tags)
- Day 3-4: "Fetch LinkedIn Data" button per prospect (calls Bright Data/Apify)
- Day 4-5: Activity feed per prospect (posts with links back to LinkedIn)
- Day 5-6: Search/filter dashboard (by name, school, job title, region, tags)
- Day 6-7: Basic scheduled enrichment (daily cron, top 50 prospects)

**Month 1 (Full Product):**
- Automated prospect discovery (search LinkedIn for staff at specific schools/MATs)
- Bulk operations (CSV import, bulk enrich, bulk tag)
- Activity signals/alerts ("This prospect just posted about EdTech")
- Dashboard analytics (activity volume over time, most active prospects)
- Team collaboration (assign prospects, shared notes)
- Advanced filtering (activity recency, topic keywords, engagement levels)
- Saved searches

### Existing Open-Source Projects to Learn From

| Project | Stars | Stack | Relevance |
|---------|-------|-------|-----------|
| **PeopleHub** (`MeirKaD/pepolehub`) | 318 | Next.js 15 + Prisma + Postgres + Bright Data + Google Gemini | **Most directly relevant** — LinkedIn intelligence dashboard, could be forked |
| **Twenty CRM** (`twentyhq/twenty`) | 27,800+ | TypeScript (own stack) | Leading open-source CRM, good for UX patterns |
| **Prospecting Command Center** (`jaybuehn/prospecting-command-center-ui`) | Small | Next.js + Tailwind | UI prototype with prospect detail tabs, search, signals inbox |

---

## 9. Cost Comparison

### DIY Dashboard Costs (500 Prospects)

| Item | Monthly Cost |
|------|-------------|
| Vercel Pro (1 seat) | $20 |
| Supabase Pro | $25 |
| Linked API Core (1 seat) | $49 |
| GIAS Data | Free |
| **Total (lean)** | **~$95/month** |

With additional data providers:

| Item | Monthly Cost |
|------|-------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Linked API Core | $49 |
| Bright Data (pay-as-you-go) | $50 |
| GIAS Data | Free |
| **Total (comprehensive)** | **~$145/month** |

### At Scale (2,000+ Prospects)

| Item | Monthly Cost |
|------|-------------|
| Vercel Pro | $20 |
| Supabase Pro + Small compute | $35 |
| Linked API (1-2 seats) | $49-$98 |
| Bright Data (higher volume) | $100-$200 |
| **Total** | **$204-$353/month** |

### Comparison

| Factor | DIY Dashboard | Myuser ($1,200/mo) |
|--------|--------------|-------------------|
| **Monthly cost** | $95-$145 | $1,200 |
| **Annual cost** | $1,140-$1,740 | $14,400 |
| **Annual savings** | — | **You save $12,660-$13,260/year** |
| **Upfront dev time** | 1-4 weeks | Zero |
| **LinkedIn post monitoring** | Yes, built to your spec | Focused on outreach, not monitoring |
| **GIAS school data** | Integrated — first-class UK education data | Not available |
| **UK education specificity** | Tailored filters, school types, MATs | Generic B2B targeting |
| **Customisation** | Fully customisable | Their way or the highway |
| **Automated outreach** | No (manual — but this is arguably better for education) | Yes (AI-generated emails) |
| **Maintenance** | You maintain it | Managed service |

### When Myuser Might Still Make Sense
- If you need **fully automated outreach execution** and have zero time for manual contact
- If you have **no developer time** available at all
- If your deal sizes are high enough that 2-3 closed deals/month would cover the cost many times over

---

## 10. Recommended Approach

### Phase 1: Foundation (Week 1) — ~$95/month ongoing

1. **Download GIAS data** — free, legal, comprehensive database of all UK schools
2. **Build MVP dashboard** with Next.js + Vercel + Supabase:
   - Team auth (Supabase Auth)
   - Import GIAS schools into organisations table
   - Prospect management (add, tag, note, status pipeline)
   - Manual LinkedIn enrichment per prospect (via Linked API or Bright Data)
   - Activity feed showing posts with links back to LinkedIn
   - Search/filter by school, role, region, tags

3. **Sign up for Linked API** ($49/month) as primary LinkedIn data source — enables search + profile + post retrieval

### Phase 2: Enrichment (Week 2-3) — Same cost

4. **Add Companies House data** for MAT directors and trust board members (free API)
5. **Set up daily cron job** for automated post monitoring of priority prospects
6. **Add activity signals** — surface when prospects post about relevant topics

### Phase 3: Scale (Month 2+) — Consider adding

7. **Evaluate Buzz Education or Sprint Education** for verified teacher email data (quote-based, likely GBP 1,000-5,000/year)
8. **Add Bright Data** ($50-100/month) for bulk enrichment if Linked API is insufficient
9. **Add Apollo.io free tier** for supplementary email enrichment

### Risk Mitigation

- **Abstract your LinkedIn data provider** behind an interface from day one — providers can be shut down (Proxycurl was killed in July 2025)
- **Conduct a Legitimate Interest Assessment** before storing personal data
- **Have a privacy notice** covering third-party data collection
- **Use GIAS as your foundation** — completely legal, no GDPR concerns for organisational data
- **Keep LinkedIn enrichment targeted** — don't bulk-scrape thousands of profiles unnecessarily
- **Consider using a dedicated LinkedIn account** for API services (not your personal/company one) to limit ban impact

### What NOT To Do

- Don't build your own scraper with Playwright/Selenium — high ban risk, maintenance burden, legal exposure
- Don't create fake LinkedIn accounts — LinkedIn actively detects and permanently bans these
- Don't store and never update data — stale data is a GDPR liability
- Don't automate outreach messages without human review — especially in education, where trust matters
- Don't pay $1,200/month for Myuser without testing cheaper alternatives first

---

## Quick Decision Matrix

| If you want... | Do this |
|----------------|---------|
| Cheapest legal route to UK school data | Download GIAS (free) + browse LinkedIn Sales Navigator manually (~$80/month) |
| Automated dashboard with post monitoring | Build the Next.js/Supabase app (~$95-145/month + dev time) |
| Verified teacher email addresses | Use Buzz Education or Sprint Education (quote-based) |
| Fully autonomous outreach | Try Expandi ($99/month) or Skylead ($100/month) before Myuser ($1,200/month) |
| Maximum data, minimum effort | Cognism ($1,500+/year) + LinkedIn Sales Navigator ($80/month) |
| Zero dev effort, just want leads | Use Apollo.io ($49/month) + PhantomBuster ($56/month) to export LinkedIn searches |

---

---

## Appendix A: Linked API — Deep Dive

**Website:** https://linkedapi.io
**Operator:** What the Flutter OU (Estonian company)
**Founded:** 2024

### What It Does
Linked API is an **unofficial LinkedIn API** — not affiliated with or approved by LinkedIn. It provides programmatic control over LinkedIn accounts by running actions through a **cloud browser** that mimics real human behaviour.

When you connect your LinkedIn account, they spin up a completely isolated cloud browser instance with its own digital fingerprint, IP address, and environment. To LinkedIn's servers, it looks like a real person using a real browser.

**Two products:**
1. **Account API** — Requires connecting YOUR LinkedIn account. Lets you automate actions (send messages, connection requests, search, retrieve data) as if you were doing them manually.
2. **Data API** — Lets you retrieve LinkedIn data WITHOUT connecting your own account. Contact their support for this option.

### Pricing

| Plan | Monthly (annual) | Monthly (monthly) | Sales Navigator? | Integrations? |
|------|-----------------|-------------------|-----------------|---------------|
| Core | $49/seat | $69/seat | No | No |
| Plus | $74/seat | $99/seat | Yes | Yes (Zapier, HubSpot, etc.) |

### What Data Can You Access?

**People:**
- `st.openPersonPage` — profile data
- `st.retrievePersonPosts` — posts they've published
- `st.retrievePersonComments` — comments they've made
- `st.retrievePersonReactions` — reactions they've given
- `st.retrievePersonExperience` — work history
- `st.retrievePersonEducation` — education
- `st.retrievePersonSkills` — skills
- `st.searchPeople` — search with filters (keyword, title, location, industry)

**Companies:**
- `st.openCompanyPage` — company data
- `st.retrieveCompanyEmployees` — list employees
- `st.retrieveCompanyDMs` — decision makers
- `st.retrieveCompanyPosts` — company posts

**Actions:**
- `st.sendMessage`, `st.sendConnectionRequest`, `st.reactToPost`, `st.commentOnPost`, `st.createPost`

### How It Connects
You **must provide your LinkedIn account credentials** for the Account API. They generate two tokens (`linked-api-token` and `identification-token`) used for all API requests. REST API with a Node.js SDK (`npm install linkedapi-node`).

### Key Risk
**Your LinkedIn account could get banned.** While they claim to be "undetectable" via isolated browser fingerprinting, LinkedIn's behavioural analysis can still flag unusual patterns. If you send too many connection requests or messages, you will get flagged regardless of how the tool works.

### Reputation
Young company (2024) with **very few independent reviews**. No substantial G2 or Capterra reviews found. A trust score of 74/100 on Bilarna. The documentation is well-structured but the company is unproven.

### Integration
All calls must be server-side (never expose tokens to browser). Important: workflows take **20 seconds to several minutes** to complete because they emulate real browser behaviour. Your app needs async handling (polling, webhooks, or background jobs).

---

## Appendix B: Bright Data — Deep Dive

**Website:** https://brightdata.com
**Formerly:** Luminati Networks (founded 2014 as part of Hola VPN)
**HQ:** Israel
**Sold to:** EMK Capital (London) for ~$200M in 2017

### What It Does
Bright Data is the **industry leader** in web data collection. They operate the world's largest proxy network: 150M+ residential IPs, 7M+ mobile proxies across 195+ countries.

Their platform handles proxy rotation, CAPTCHA solving, request throttling, and anti-bot bypass automatically. You submit URLs or search parameters, they return structured JSON/CSV data.

### Key Advantage Over Linked API
**You do NOT need your own LinkedIn account.** Bright Data handles everything on their infrastructure. If a profile or IP gets blocked, they automatically switch to another one. There is **zero risk to your personal LinkedIn profile.**

### Pricing

| Product | Cost |
|---------|------|
| Web Scraper API (standard) | $1.50/1,000 requests |
| Web Scraper API (LinkedIn — premium) | $2.50/1,000 requests |
| Per LinkedIn profile (approx.) | ~$0.05/profile |
| Pre-collected LinkedIn dataset (100K records) | $250 one-time |
| Dataset subscription | From $500/month |
| Free trial | 20 free API calls |

Note: most products require sales contact for custom pricing at scale. Typical minimums are $500-1,000+/month for serious usage. You only pay for **successful responses**.

### LinkedIn-Specific Scrapers

| Scraper | Data Fields |
|---------|------------|
| **Profiles** | Name, headline, about, experience, education, skills, company, location, connections |
| **Company** | Name, description, size, industry, locations, employees, funding |
| **Posts** | Post text, URL, date, engagement metrics |
| **Jobs** | Title, description, company, salary, location, applicants |
| **Groups** | Group data |

### Legal Position — Won Two Landmark Cases

1. **Meta v. Bright Data (Jan 2024)** — US court ruled Facebook/Instagram ToS do not bar "logged-off scraping of public data." Meta dropped remaining claims.
2. **X Corp. v. Bright Data (May 2024)** — All of X's claims dismissed. Judge wrote that giving social networks control over public data "risks the possible creation of information monopolies."

These create strong legal precedent, though LinkedIn (Microsoft) is a different entity.

### Reviews
- **Trustpilot:** 4.5/5 (660+ reviews)
- **G2:** Highly rated, trusted by 20,000+ organisations
- Praised for customer support and Web Unlocker
- Criticised for steep learning curve and unpredictable billing at scale

### SDKs
- **JavaScript/TypeScript:** `@brightdata/sdk` (npm)
- **Python:** `brightdata` (PyPI)
- **MCP Server:** `github.com/brightdata/brightdata-mcp` — for AI agent integration

### Integration Pattern
Asynchronous: submit scrape job → receive snapshot ID → poll or webhook for results → parse JSON/CSV. All server-side, never expose API key to browser.

---

## Appendix C: PeopleHub Fork Analysis

**Repo:** https://github.com/MeirKaD/pepolehub
**Live demo:** https://pepolehub.vercel.app
**License:** MIT (full commercial use permitted)
**Stars:** 318 | **Forks:** 52 | **Last commit:** 1 December 2025

### What PeopleHub Does
An AI-powered LinkedIn intelligence platform. Type a natural language query like "10 AI engineers in Israel" and it:
1. Parses the query using AI (currently Gemini)
2. Searches LinkedIn via Bright Data
3. Returns profile cards with full data
4. Can generate deep research reports on individuals using LangGraph workflows

### Tech Stack (Already Close to What You Want)

| Layer | Technology | Your Target |
|-------|-----------|-------------|
| Framework | Next.js 15.5.4 (App Router) | Same |
| Database | PostgreSQL via Supabase | Same |
| ORM | Prisma 6.5.0 | Keep (already points at Supabase) |
| AI/LLM | Google Gemini via Vercel AI SDK | **Swap to OpenAI or Claude** |
| LinkedIn Data | Bright Data (REST + MCP) | Same |
| State | Zustand + TanStack Query | Keep |
| UI | Tailwind + Radix UI + Framer Motion + Three.js | Keep/simplify |
| Research | LangGraph 1.0.1 | Keep or remove |
| Cache | Redis (hot) + PostgreSQL (persistent) | Keep |

### Gemini Usage — How Easy to Swap?

Gemini is used in **4 files** via the Vercel AI SDK abstraction layer:

1. `src/lib/search/parser.ts` — natural language query parsing
2. `src/lib/research/llm-service.ts` — research report generation (3 functions)
3. `src/lib/brightdata/research.ts` — search query optimisation
4. `.env.example` — API key config

**Swap effort: 1-2 hours.** Because it uses the Vercel AI SDK, you literally just:
1. `npm install @ai-sdk/openai` (or `@ai-sdk/anthropic`)
2. Change `import { google } from '@ai-sdk/google'` → `import { openai } from '@ai-sdk/openai'`
3. Change `google('gemini-2.0-flash')` → `openai('gpt-4o')` or `anthropic('claude-sonnet-4-20250514')`
4. Update the env var from `GOOGLE_GENERATIVE_AI_API_KEY` to `OPENAI_API_KEY`

All `generateObject()` and `generateText()` calls remain identical. This is the whole point of the Vercel AI SDK's provider-agnostic design.

**Caveat:** `generateObject()` (structured output with Zod schemas) works great with OpenAI. Anthropic support may need `mode: 'tool'` — verify with current SDK version.

### Database Schema (3 Models)

- **Person** — LinkedIn profiles (name, headline, experience JSON, education JSON, company, location, etc.)
- **Search** — query history with result IDs
- **Research** — AI-generated research reports (markdown, sources, metadata, status)

Already uses Supabase Postgres via Prisma — **zero change needed** for database hosting.

### What's Good (Keep)

- Core search/scrape/research pipeline — works end-to-end
- Bright Data integration (two patterns: REST API + MCP client)
- Multi-tier caching (Redis + Postgres) — claims 70-90% cost reduction
- LangGraph research workflow (parallel LinkedIn fetch + web search → fan-out scraping → summarisation → report)
- Clean TypeScript, good separation of concerns
- Vercel AI SDK abstraction (trivial LLM swapping)
- MIT license — full commercial freedom

### What's Missing (You'd Need to Add)

| Feature | Effort |
|---------|--------|
| **Authentication** (no login system at all) | 2-3 days |
| **GIAS data import** (UK schools database) | 3-5 days |
| **Education-adapted schema** (school, MAT, role fields) | 2-3 days |
| **Education-specific prompts** (query parsing, reports) | 1-2 days |
| **Prospect list management** (CRM features, tags, notes, status pipeline) | 3-5 days |
| **Rate limiting and security** | 1-2 days |
| **Test suite** (none exists) | 2-3 days |
| **Export to CSV/Excel** | 1 day |
| **Pagination** (currently single page of results) | 1 day |
| **UK geolocation defaults** | Half day |

### What You'd Remove/Simplify

- **Three.js 3D magnifying glass animation** — cool but unnecessary, adds bundle size
- **Glassmorphism aurora background** — replace with simpler professional UI
- Potentially **LangGraph** if you don't need automated research reports (keeps things simpler)

### Fork vs Build from Scratch

| Approach | Estimated Time | Cost |
|----------|---------------|------|
| **Fork PeopleHub and adapt** | ~3-4 weeks | Saves 2-3 months of dev work |
| **Build from scratch** | 8-12 weeks minimum | Full control but much slower |

**Strong recommendation: Fork it.** The core pipeline (search → scrape → cache → display) is the hardest part to build and it's already done. Adding auth, GIAS data, education prompts, and CRM features on top of a working foundation is much faster than starting from zero.

### Step-by-Step Fork Plan

1. **Fork repo, swap Gemini for OpenAI/Claude** (Day 1 — 2 hours)
2. **Add Supabase Auth** (Days 1-2)
3. **Strip Three.js and simplify UI** (Day 2)
4. **Extend Prisma schema** for organisations (GIAS) and prospect management (Day 3)
5. **Build GIAS CSV import script** (Days 3-4)
6. **Add prospect list features** — tags, notes, status, assignment (Days 5-8)
7. **Modify search parser** for education queries (Days 8-9)
8. **Update research report prompts** for education context (Day 9)
9. **Add export functionality** — CSV/Excel download (Day 10)
10. **Add daily cron for prospect enrichment** (Days 10-12)
11. **Testing and hardening** (Days 12-15)

---

*Report compiled from research across LinkedIn developer documentation, ICO enforcement data, GDPR case law, B2B data provider pricing, open-source project analysis, and direct service investigation. Pricing accurate as of February 2026 but subject to change.*
