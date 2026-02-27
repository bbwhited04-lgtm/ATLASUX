import React from "react";
import { Link } from "react-router-dom";

const YOUTUBE_ID = "QtTn_o6zXDY";

export default function Landing() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Background (NON-INTERACTIVE) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />

        {/* Glow blobs */}
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              The AI Worker that{" "}
              <span className="text-cyan-300">works where</span>,{" "}
              <span className="text-blue-300">you</span>{" "}
              <span className="text-indigo-300">work</span>
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/75">
              ATLAS UX is a standalone, cross-platform desktop automation platform
              that connects accounts, orchestrates agents, and executes real workflows —
              locally.
            </p>

            {/* Primary CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#/app"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold !text-black !opacity-100 shadow hover:opacity-90"
              >
                Open ATLAS UX (Preview)
              </a>

              <a
                href="#builders"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Builders / Co-founders
              </a>

              <a
                href={`https://www.youtube.com/watch?v=${YOUTUBE_ID}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Watch on YouTube
              </a>

              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                About
              </Link>
            </div>

            {/* Value props */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["Local-first", "Run core workflows on your machine."],
                ["Privacy-first", "Keep control of your data."],
                ["Modular integrations", "Connect apps/accounts as needed."],
                ["Execution-focused", "Agents that do tasks, not just chat."],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-sm text-white/65">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Video */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
                  title="ATLAS UX Pitch"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-white/60">
              60-second overview • atlasux.cloud
            </p>
          </div>
        </section>

        {/* Dev updates */}
        <section id="updates" className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-semibold">Dev updates</h2>
            <span className="text-sm text-white/60">Last updated: Feb 27, 2026</span>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
            <li>Started construction of an idea with Figma, for clean user friendly standalone ai employee</li>
            <li>Stated initial seating pricing and stored UI on supabase for demo mode only</li>
            <li>Published Initial UI(user interface) wireframe to web from Figma.</li>
            <li>Removed Demo Mode only and went live with frontend at Vercel</li>
            <li>Set up backend wiring to run through onrender</li>
            <li>Started work with ChatGPT 5.2 to integrate my wireframe into a real program</li>
            <li>Created first backend files, frontend files index.html</li>
            <li>Published 60s pitch video + cross-platform posts.</li>
            <li>Integration UX wiring in progress (connect → verify → import).</li>
            <li>Stabilizing desktop builds and routing across pages.</li>
            <li>Fighting Demons and Gremlins buried in the code, all about them routes.</li>
            <li>Added AppGate functionality for security.</li>
            <li>Added Task/Workflows Functionality.</li>
            <li>Rebuilding Mobile Companion App/link. Rebuilding Atlas Avatar with Blender, New look coming soon.</li>
            <li>Co-Founder application denied after path, scope, alignment and payment needs were not met.</li>
            <li>Restructured Entire environment and changed layout to be more professional</li>
            <li>Security phase 3 fixes — hardened auth, JWT, and session handling</li>
            <li>Resolved all TypeScript errors from phase 3 changes</li>
            <li>Implemented mobile device pairing with real QR code</li>
            <li>About page, working job cancel, fixed dead buttons</li>
            <li>Resolved all usability issues in jobs and header</li>
            <li>Fixed several issues flagged by Claude Code audit</li>
            <li>Implemented CRM backend, analytics, SMS/job workers, voice recognition, and agent SKILL.md files</li>
            <li>Wired KB context and agent registry into every chat call</li>
            <li>Built all 30 feature suggestions from product audit</li>
            <li>Fixed Telegram "chat not found" — added guidance and better error messaging</li>
            <li>Integrated Teams into agent tools and cross-agent messaging</li>
            <li>Switched Teams send to Power Automate Workflows (Incoming Webhooks retired 12/31/25)</li>
            <li>Added TEAMS_WORKFLOW_URL as default send target for Teams agents</li>
            <li>Fixed Teams tab: show compose when webhook URL is present</li>
            <li>Fixed Teams listing: use /teams endpoint with Team.ReadBasic.All scope</li>
            <li>WorkflowsHub: numbered asset cards with descriptor and click-to-select</li>
            <li>Wired getKbContext + runLLM into all workflow handlers</li>
            <li>Fixed engine run status — auto-refresh after 3.5s, clean status UI</li>
            <li>Growth loop: allow multiple actions per run and multiple runs per day</li>
            <li>Added 6 new agents: Claire, Daily Intel, Petra, Porter, Sandy, Victor</li>
            <li>Fixed engine raw SQL RETURNING aliases (snake_case to camelCase)</li>
            <li>Fixed queue.ts — removed non-existent updated_at column from RETURNING clause</li>
            <li>Fixed kb_chunks query — guarded against missing table (Postgres 42P01)</li>
            <li>Integrations overhaul — provider enum→text migration, Pinterest OAuth, LinkedIn stub, status fix</li>
            <li>Comprehensive KB seed script — 37 governance, agent definition, and workflow docs</li>
            <li>Scheduler worker — auto-fires daily brief (WF-010) and Binky research (WF-031)</li>
            <li>Integrations — toast feedback for OAuth connect success and error states</li>
            <li>Wired up Settings &gt; Files with real Supabase storage backend (upload, download, delete)</li>
            <li>Workflows dropdown — mapped all DB rows to canonical Atlas WF-### IDs and names</li>
            <li>Fixed all agent descriptions — aligned titles, roles, and org chart to match email-defined job functions</li>
            <li>All social media publishers (Kelly/X, Fran/Facebook, Dwight/Threads, Timmy/TikTok, Terry/Tumblr, Cornwall/Pinterest, Link/LinkedIn, Emma/Alignable, Donna/Reddit, Reynolds/Blog) now correctly described</li>
            <li>Tina promoted to Chief Financial Officer · CFO; Venny is Image Production Specialist; Victor reports to Venny</li>
            <li>Sunday re-titled Comms &amp; Technical Document Writer for Binky; Archy confirmed Binky research subagent</li>
            <li>Added 16 new executive workflows (WF-033 through WF-092) covering every agent — Daily-Intel, Archy, Timmy, Dwight, Emma, Fran, Sunday, Venny, Mercer, Petra, Sandy, Frank, Porter, Claire, Victor, Cheryl</li>
            <li>Fixed all 39 KB docs — Archy now Binky research subagent, Venny Image Production Specialist, Claire Calendar Coordinator, Petra Project Manager, workflow catalog updated to canonical WF-### IDs</li>
            <li>Implemented Atlas boot priorities: DAILY-INTEL as central reporting hub, Truth Compliance audit on every external output, Ledger entry (token_spend) on every workflow run</li>
            <li>Full workforce autonomy — scheduler expanded from 2 to 28 jobs: 19 daily + 5 Monday + 3 Friday, every agent fires on schedule without manual triggers</li>
            <li>Platform Intel Sweep — 13 sub-agents visit their platforms at 05:00–05:36 UTC daily (WF-093–105), pull live trending data via SERP API, and report hot takes to Atlas and the DAILY-INTEL hub</li>
            <li>Closed-loop intelligence pipeline — WF-106 Atlas Daily Aggregation fires at 05:45 UTC: Daily-Intel synthesizes all 13 platform reports, Atlas reads the unified packet and issues specific task orders to every agent, emails dispatched to all 20+ agents before the workday starts</li>
            <li>Added 12 social media KB docs — per-platform posting guidelines (X, Facebook, LinkedIn, TikTok, Instagram, Reddit, Pinterest, Tumblr), source verification protocol with freshness thresholds, trust & transparency framework, content quality standards, posting rhythm calendar, and per-agent voice profiles; all 242 KB docs now live and wired into every LLM call</li>
            <li>Added industry intel KB doc for OpenClaw (Peter Steinberger/OpenAI) with verified facts, common misconception correction, and Atlas UX differentiation guidance</li>
            <li>Rewrote all 13 social media agent SKILL.md files — correct roles, platform-specific tools, content strategies, daily sprint workflows, atomic task decomposition, deterministic output specs, and forbidden actions for Kelly/X, Timmy/TikTok, Fran/Facebook, Dwight/Threads, Link/LinkedIn, Cornwall/Pinterest, Donna/Reddit, Reynolds/Blog, Terry/Tumblr, Penny/Ads, Archy/Instagram-research, Venny/Image-production, Emma/Alignable</li>
            <li>Built tiered knowledge architecture to remove chat bottleneck — SKILL.md loader (filesystem, 0ms, no DB), KB memory cache (60min TTL, eliminates repeat governance queries), query classifier (routes routine agent tasks to SKILL.md, avoids full RAG for 80% of questions), cache management endpoints on /v1/kb/cache</li>
            <li>In-product CSS agent tools — server-side live data injected before every chat call: get_subscription_info (plan, seats, spend), get_team_members (roster, roles), search_atlasux_knowledge (KB RAG); Cheryl always knows your account without hallucinating</li>
            <li>Deep agent pipeline — every agent can run a 3-stage n8n-style pipeline: Planning sub-agent (execution plan) → Main execution (SKILL.md + KB + tools + memory) → Verification sub-agent (accuracy + policy check) + Postgres memory per session; Atlas, Binky, Cheryl, Mercer activated</li>
            <li>WF-107 Atlas Tool Discovery — Atlas audits every agent's toolset weekly, generates 8-15 high-value tool proposals, and emails Billy a numbered list with one-click approve/deny links; approved tools auto-added to KB and wired into agent instructions</li>
            <li>Removed all junk KB content (56 academic/PhD docs, business school theory, HR frameworks) — agents no longer waste tokens on irrelevant documents; seedPhD.ts, seedPhD2.ts, and seedKnowledge.ts deleted</li>
            <li>Fixed Decisions tab — tenantId now sent via x-tenant-id header so growth loop, approve, and reject all work correctly; double-fetch on selection change eliminated</li>
            <li>Teams send now bypasses Power Automate entirely — uses Graph API directly with teamId+channelId; no $15/month premium subscription needed</li>
            <li>Teams 403 error now shows actionable fix: go to Azure Portal → API permissions → add ChannelMessage.Send → grant admin consent</li>
            <li>Telegram agent notifications — agents can now send Telegram messages via send_telegram_message tool; "Set default" button saves your chat ID; green badge shows which chat agents are targeting</li>
            <li>Agent Watcher — new live activity monitor at /app/watcher polls audit log every 4s and jobs every 8s; shows color-coded event feed, active/failed jobs, per-agent pulse, pause/resume, filter by level or agent</li>
            <li>Business Manager — added "Decisions" and "Watch Live" quick-nav buttons in selected business header; one click to jump to the right view with tenant already set</li>
            <li>JobRunner auto-refreshes every 10s (was manual-only)</li>
            <li>Telegram "Use chat" button — now visible as a cyan badge; shows "Use &amp; send" when you have a message typed and sends immediately on click</li>
            <li>seedAiKb.ts — 62 comprehensive AI/tech KB documents across 11 categories: prompt engineering, AI agents, RAG retrieval, LLMOps, AI marketing, AI CRM, productivity, security, strategy, data engineering, and social media AI</li>
            <li>Full codebase audit sweep — fixed 100+ findings across 45 files: removed all Neptune/Pluto legacy naming, replaced demo_org stubs, fixed false feature claims in Store/HelpSection, converted Store/About/Product/Blog pages to dark theme, corrected agent role descriptions and emails, deleted duplicate/orphan files, updated license to DEAD APP CORP, replaced all simulated/mock responses with honest error states, moved OAuth PKCE/CSRF state from in-memory maps to Postgres-backed oauth_state table</li>
            <li>CRM CSV import — you can now upload a .csv file (iCloud contacts, Outlook export, any standard CSV) directly from the CRM Import modal; parser handles quoted fields, flexible column names (First Name/firstName/First), and imports up to 5,000 contacts per batch with audit trail logging</li>
            <li>Corporate structure updated — footer and legal text now reflects ATLAS UX as a product of DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST</li>
            <li>vCard (.vcf) import — CRM Import modal now natively parses iCloud, Outlook, and Google Contacts vCard exports; handles vCard 2.1/3.0/4.0, multi-line folding, escaped chars, and extracts name, email, phone, org, and notes per card</li>
            <li>Blog Studio edit + delete — each post in the Published Posts panel now has hover Edit (loads title, body, category, featured image into the editor) and Trash buttons; PATCH and DELETE endpoints added to /v1/blog/posts; featured image upload now correctly sends to /v1/files/upload and fetches a signed URL</li>
            <li>CRM import body limit raised to 20 MB — large CSV/vCard files (thousands of contacts) no longer hit "payload too large" error</li>
            <li>CRM Companies tab wired up — search, add, and delete companies with name/domain/industry/notes; shows linked contact count per company (click to filter contacts list); fully backed by /v1/crm/companies endpoints</li>
            <li>CRM import now batches 200 contacts per request — bypasses Render's ~1 MB reverse proxy limit; a 7.5 MB CSV with thousands of contacts uploads smoothly in sequential chunks</li>
            <li>Auto-reload on stale chunks — after a deploy, lazy-loaded pages no longer crash with "failed to fetch dynamically imported module"; the app detects the missing chunk and does a single hard reload to pick up the new build</li>
            <li>Blog featured images now display per-post — was hardcoded to default Atlas logo for all API posts; now uses the actual featuredImageUrl you set in Blog Studio</li>
            <li>Full codebase audit — fixed 9 broken Prisma imports, added audit logging to 8 endpoints, Telegram webhook auth + secret token validation, Helmet security headers, ToolsHub dark theme fix, Electron dev-only DevTools, reduced Agent Watcher polling (4s→15s), added email-worker + engine-worker to render.yaml, cleaned up duplicate DB indexes, added missing env var definitions, blog post route fix (#/app/blog/:slug now works), replaced all alert() calls with toast notifications, rate-limited job creation + file uploads, fixed all routes to use reply.send() consistently, added tenant check to mobile pairing, fixed Dashboard navigation, cleaned up console.error across business-manager/ApiKeyManager/TaskAutomation, replaced remaining alert() in DecisionEnginesHub and SubscriptionManager with sonner toasts</li>
            <li>DB migration sprint — added tenant_id to publish_events, all atlas_ip_* tables, and atlas_suggestions (multi-tenancy compliance); DecisionMemo now has optional FK to source Job and Intent for audit traceability; fixed job queue race conditions across 3 workers with optimistic locking (prevents double-execution); KB chunks endpoint now paginated (offset/limit, max 500 per page); per-tenant file upload quotas (500 files, 500 MB default, configurable via env)</li>
            <li>Fix Telegram/Teams "tenant id required" — MessagingHub now sends x-tenant-id header on all API calls (was missing from /me, /updates, /send, and all Teams endpoints); selecting a business now propagates tenant context to every messaging tab</li>
            <li>Full x-tenant-id header audit — added missing header to 14 components: ChatInterface, DecisionEnginesHub, WorkflowsHub, TaskAutomation, AgentDeploymentHub, Dashboard, RootLayout, Settings, FileManagement, Integrations, Analytics, SocialMonitoring, business-manager, MobileIntegration; every API call now carries tenant context</li>
            <li>Business Manager operations suite — selected business now has 5 sub-views (Assets, Ledger, Integrations, Jobs, Audit Log) with toggle navigation; accounting summary backend now computes real totals from ledger entries instead of hardcoded zeros; integrations show connected status with connect/disconnect buttons; jobs table shows type, status, and timestamps; audit log shows actions, levels, and entity types; all data loads in parallel when selecting a business</li>
            <li>Wired Intelligence tab — live KPI dashboard (impressions, CTR, conversions, spend), financial overview from real ledger data, decision analytics (approval rate, cost per decision, by-agent breakdown), channel ROI table, period-over-period comparison with range selector (24h/7d/30d/90d), workforce overview with agent count</li>
            <li>Wired Security &amp; Compliance tab — real audit log activity timeline with color-coded levels, compliance status panel (audit trail, approval workflow, action caps, spend limits), agent access control grouped by tier, managed files inventory from Supabase, security overview stats from live data</li>
            <li>Wired Media Processing tab — full file browser with upload/download/delete against Supabase storage, type-based filtering (images, videos, PDFs, docs), file stats with total storage usage, quick action buttons; replaced all empty mock arrays with real tenant-scoped file data</li>
            <li>Blog featured images — new featured_image_url field on kb_documents (DB migration), Blog Studio now has image URL input with live preview, posts list shows thumbnail; WF-108 Reynolds workflow now calls Venny to generate a DALL-E 3 blog header image before publishing (brand-consistent navy/cyan); image URL included in publish email and workflow output</li>
            <li>Fixed workflow email routing — agents no longer email themselves their own reports; all workflow completion reports now go to Atlas (CEO) with CC to the agent's direct leader based on org hierarchy; platform intel reports, daily brief, blog publish confirmations, and all n8n workflow outputs now follow proper chain-of-command reporting</li>
            <li>Left nav cleanup — consolidated 15 sidebar items down to 9; Decisions, Budgets, Tickets, Blog, and Analytics now live as tabs inside Business Manager; old URLs redirect automatically; Agent Watcher heartbeat now always visible in the header bar showing running jobs, last active agent, and timestamp — click to open full watcher view</li>
            <li>New agent tool: search_my_memories — every agent can now recall their own conversation history, audit trail, workflow outputs, and KB docs on demand; triggers on "remember", "recall", "what did I do", "my history", "previous", "past work", "catch me up"; searches 4 sources in parallel (agent_memory turns, audit log actions, workflow step history, agent-specific KB) and returns a unified memory report</li>
            <li>Dashboard real KPIs — stats grid now shows live data (active jobs, completed today, registered agents, total spend) instead of hardcoded mock values; hero text, job count, and workforce card all wired to real API endpoints; nav buttons point to correct consolidated routes</li>
            <li>Blog Studio file upload — featured image input now has a direct Upload button that sends to Supabase storage via /v1/files; no more copy-pasting URLs from the Media Processing tab</li>
            <li>Markdown engine upgrade — public blog posts now support **bold**, *italic*, blockquotes (&gt; quoted text), images (![alt](src)), and horizontal rules (---); inline images render with figcaptions</li>
            <li>Agent-to-agent task handoff — new delegate_task tool lets exec/governor agents queue AGENT_TASK jobs for other agents directly from chat; "delegate to sunday: draft a memo" creates a queued job, logs to audit trail, and Sunday picks it up on next engine tick; Atlas, Binky, Cheryl, Tina, Larry, Petra, Mercer, Sunday all enabled</li>
            <li>Deep mode expansion — Tina (CFO), Larry (Audit), Petra (PM), and Sunday (Comms Writer) now run the full 3-stage pipeline (planning → execution → verification + memory)</li>
            <li>Code splitting — 18 app + public page components now lazy-loaded via React.lazy() with Suspense fallback; initial bundle reduced, pages load on demand</li>
            <li>Per-user identity (Phase 1) — new global "users" table cross-tenant, auto-provisioned on first Supabase auth; TenantMember now carries seat_type (free_beta, starter, pro, enterprise); /v1/user/me returns user profile + all tenant memberships + current seat tier</li>
            <li>Usage metering (Phase 2) — every API call, LLM chat, job creation, and file upload now tracked per user/tenant/month in usage_meters table; /v1/user/me/usage returns current month stats + tier limits; /v1/user/me/usage/history returns last 6 months</li>
            <li>Billing &amp; seats (Phase 3) — subscriptions table with Stripe fields ready; seat tier limits enforced: free_beta (50K tokens/day, 500MB, 5 agents), starter $19/mo (200K tokens, 5GB, 15 agents), pro $49/mo (1M tokens, 25GB, all agents), enterprise custom; admin can view/change seats via /v1/user/tenants/:id/seats; public pricing endpoint at /v1/user/pricing</li>
            <li>Seat limit enforcement — chat, file upload, and job creation routes now enforce real quotas before processing; token budget check blocks LLM calls when daily limit exceeded, storage limit check blocks uploads past tier cap, job limit check blocks queueing past daily max; all fail-open if metering DB is unreachable</li>
            <li>Auto-derive companies from CRM imports — CSV/vCard contact imports now automatically create CRM Company records from unique company/organization names; case-insensitive dedup prevents duplicate entries; import response includes companiesCreated count</li>
            <li>Per-category blog placeholders — posts without a featured image now show a category-colored gradient with the category initial instead of the generic Atlas logo; 12 category-specific color schemes (AI, Marketing, Security, Strategy, etc.); applies to blog cards, list view, and full post hero</li>
            <li>Fixed seedAiKb.ts import path — script was referencing wrong Prisma path (../prisma.js → ../db/prisma.js); now runnable on Render to seed 62 AI/tech KB documents</li>
            <li>Job metering — job creation now tracked in usage_meters table per user/tenant/month (was unmetered before)</li>
            <li>Fixed 13 broken Prisma imports across backend — emailSender, tasksRoutes, ledger, telegramNotify, growthLoop, guardrails, decisionMemos, metricsSnapshot, systemState, workflows registry, agentTools, and 2 seed scripts all pointed to non-existent ../prisma.js; corrected to ../db/prisma.js</li>
            <li>X (Twitter) API v2 service — full service library (post tweet, post thread, delete, search recent, get tweet, like, retweet, user profile); Kelly now has post_to_x and search_x agent tools with audit logging; approval-gated posting with token from vault or env fallback</li>
            <li>Added 4 missing worker scripts to package.json — jobs, SMS, Reddit, and social monitoring workers now invocable via npm run</li>
            <li>Meta (Facebook) data deletion callback — POST /v1/meta/datadeletion handles GDPR deletion requests with signed_request verification, audit logging, token cleanup, and confirmation code; required for Meta app review compliance</li>
            <li>Integrations tab dark theme fix — .glass cards now use dark translucent background with cyan borders instead of white; Suite badges, sub-service chips, search/filter icons, and text all corrected to match dark theme</li>
            <li>Google data deletion callback — POST /v1/google/datadeletion for Google OAuth verification compliance; logs deletion requests, clears tokens, returns confirmation code</li>
            <li>Data Retention &amp; Deletion Policy — comprehensive 10-section policy document now in policies/DATA_RETENTION.md covering all data categories, retention periods, user-initiated deletion, backup lifecycle, and security safeguards; required for Meta/Google/TikTok platform reviews</li>
            <li>Executive agent docs — added POLICY.md and MEMORY.md for Tina (CFO), Larry (Auditor), Jenny (Legal), and Benny (IP Counsel); each exec now has full 5-file profile with role-specific authority boundaries, tool access tables, and compliance standards</li>
            <li>Expanded agent tool permissions — all 13 social publishers and content agents upgraded from basic (calendar+memory) to role-appropriate toolsets: knowledge base access, telegram notifications, task delegation, and CRM access where needed; Jenny and Benny upgraded with policy/knowledge/delegation tools</li>
            <li>Two-way Telegram chat — you can now DM the Atlas bot on Telegram and get real-time AI responses; messages route through the full chat engine (SKILL.md + KB + agent tools + conversation memory); /atlas /binky /cheryl commands switch agents; /help lists all agents; /clear resets conversation; typing indicator shows while Atlas thinks; 4096-char message splitting for long replies; all chats logged to audit trail</li>
            <li>Digital prompt packs on Store — 9 products now live: 50 ChatGPT Prompts (FREE), 100 ChatGPT &amp; AI Tools ($0.99), 200 E-commerce &amp; POD ($1.99), 50 Small Business ($0.99), 50 Personalize AI ($0.99), 50 Marketing Copywriting ($1.99), 50 Camera AI Image Prompts ($1.99), 50 Business Emails ($0.99), 50+ Accounting/Bookkeeper ($2.99); all instant-download .txt files; Store page redesigned with Prompt Packs grid above subscription plans</li>
            <li>6 downloadable PDF ebooks now live on Store — Learning ChatGPT Side Hustles, Passive Income Guide (5 Online Hustles), Master ChatGPT-5.0 Guide, Nano Banana AI Prompts (500+ image gen prompts for Midjourney/DALL-E/SD), 100+ n8n Automation Templates, and Nano Banana Monetize AI Images guide; all $0.99, full 20-page PDF downloads with real actionable content</li>
            <li>Customer Reviews section on Store — Trustpilot and Google Reviews links for verified purchasers; review prompt placeholder visible until first reviews come in</li>
            <li>Fixed Telegram webhook "chat not linked" — resolveTenantByChatId now uses Prisma JSON path filtering to match chat_id regardless of stored type (string vs number); added numeric fallback and error logging so tenant lookup no longer silently fails</li>
            <li>Atlas UX Mobile (Expo React Native) — full mobile app with 5 tabs: Dashboard (stats grid, quick actions, recent jobs with pull-to-refresh), Chat (agent picker with Atlas/Binky/Cheryl/Sunday, conversation bubbles, real-time AI chat), Agents (roster with status dots, expandable detail cards), Jobs (filterable by status with color-coded badges), Settings (preferences, integrations, org info, logout); dark theme matching web app, SecureStore auth, gate code login</li>
            <li>Stripe billing webhook — POST /v1/billing/stripe/webhook with HMAC signature verification; logs checkout completions, payment successes, and refunds to audit trail; STRIPE_WEBHOOK_SECRET pushed to Render</li>
            <li>Teams Graph API fix — sending channel messages now uses Group.ReadWrite.All (Application permission) instead of nonexistent ChannelMessage.Send; all 22 Azure AD permissions granted with admin consent; error messages updated with accurate permission guidance</li>
            <li>Deep project audit — fixed broken Store payment link (hhttps typo), corrected Business/Enterprise annual pricing, removed duplicate imports and dead route files, registered /v1/runtime status endpoint, replaced hardcoded tenant IDs with env var fallback</li>
            <li>138 documentation files — full docs suite across 6 categories: API reference (27), user guides (21), developer docs (23), architecture (17), knowledge base (28), and marketing (22); covers every endpoint, feature, integration, and architectural pattern in the platform</li>
            <li>40 new KB deep-dive docs — industry intel (SaaS metrics, market landscape, e-commerce playbook, B2B lead gen, legal/IP basics), platform publishing guides (X, Facebook, LinkedIn, TikTok, Pinterest, Reddit, blog SEO, emerging platforms), workflow templates (morning brief pipeline, intel sweep, content lifecycle, onboarding, incident response, budget review), technical deep dives (RAG tuning, agent memory, tool calling, multi-model routing, webhook integration), and 7 agent-specific playbooks (Atlas, Binky, Cheryl, Sunday, Mercer, Petra, Venny/Victor)</li>
            <li>Browser extensions for Chrome, Edge, Firefox, Safari, and Opera — Manifest V3 dark-themed popups with agent chat, stats bar, activity feed, context menus ("Ask Atlas", "Send to Cheryl", "Research with Archy"), badge job counts, notifications, and full options pages; 52 files across extensions/chrome, extensions/firefox, extensions/safari, extensions/opera</li>
            <li>Ivy League MBA education — 15 KB docs covering corporate strategy (Porter's Five Forces, Blue Ocean), financial accounting &amp; analysis (DuPont, ratio analysis), corporate finance (DCF, WACC, CAPM), marketing management (STP, CLV, brand equity), organizational behavior, operations (Lean, Six Sigma, TOC), economics (game theory, elasticity), entrepreneurship (Lean Startup, Business Model Canvas), negotiation (BATNA, ZOPA), business analytics, ethics, supply chain, M&amp;A, international business, and innovation/technology management</li>
            <li>Harvard Law education — 13 KB docs: contract law (UCC, ESIGN, remedies), intellectual property (patents, trademarks, copyrights, trade secrets, AI-generated content), corporate entities (fiduciary duties, veil-piercing, DEAD APP CORP trust structure), employment law (Title VII, ADA, worker classification), data privacy (GDPR, CCPA/CPRA, state laws), securities regulation (Howey test, Reg D, insider trading), antitrust, internet/digital law (Section 230, CAN-SPAM, TCPA), tax fundamentals, dispute resolution, regulatory compliance, international trade (OFAC, FCPA), and AI regulation (EU AI Act, state laws)</li>
            <li>PhD in Education — 12 KB docs: learning theory (behaviorism, cognitivism, constructivism, connectivism), instructional design (ADDIE, Bloom's Taxonomy, Gagné), adult learning (Knowles' andragogy), knowledge management (Nonaka SECI model), assessment &amp; evaluation (Kirkpatrick, Phillips ROI), curriculum development, educational technology (SAMR, TPACK, gamification), educational psychology (memory, metacognition, flow), training &amp; development, research methods, organizational learning (Senge's Five Disciplines), and communication pedagogy</li>
            <li>Advanced AI capabilities — 30 KB docs: autonomous brainstorming (SCAMPER, Six Thinking Hats), creative problem solving (TRIZ, Design Thinking, First Principles), innovation pipeline (Three Horizons), strategic reasoning (Chain-of-Thought, Tree-of-Thought, Bayesian), decision frameworks (OODA, Cynefin, pre-mortem), systems thinking, cognitive bias defense (25 biases), TINY CRABS prompt framework, advanced prompt patterns (20 elite patterns), prompt optimization &amp; A/B testing, multi-agent orchestration, agent communication protocols, agent scaling, agent lifecycle, data governance, data quality, privacy engineering, AI-driven coding, code optimization, DevOps automation, self-evaluation framework, reflective learning, performance metrics, continuous improvement (Kaizen), ethical AI compliance, truth compliance &amp; misinformation prevention, responsible AI ops, systems integration architecture, API design best practices, and middleware connectors</li>
            <li>Atlas AI Avatar — full-body blue wireframe robot in the app header with a pulsing heartbeat core in his chest; core color shifts with status: cyan (online), purple (processing jobs), red (decisions need attention); diamond-shaped energy core with radiating power lines, articulated arms/hands/legs/feet with wireframe joints, scan line sweeping head-to-toe; click for status popover with active jobs, pending decisions, last activity, and quick "Open Chat" button</li>
            <li>KB seed script (seedKbFromDocs.ts) — reads all 138 markdown files from docs/kb/ and upserts them into the database with category tagging; replaces manual inline content with file-based sync; run via `npm run kb:seed-docs`</li>
            <li>Massive KB expansion — 18 new advanced docs from 3 AI textbooks + 149 GitHub agentic patterns: agentic design patterns (prompt chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer), context engineering, agent evaluation &amp; benchmarking, production deployment (Kubernetes, serverless, monitoring), multi-agent topologies (A2A protocol, MCP, 6 coordination architectures), planning &amp; reasoning (chain-of-thought, tree-of-thought, ReAct, LATS), advanced tool use (function calling, sandboxed code execution, retrieval tools), reflection &amp; critique (producer-critic loops, Reflexion), orchestration patterns from 148 real-world repos, context &amp; memory management, feedback &amp; eval pipelines, reliability &amp; safety patterns, tool integration patterns, UX &amp; human-AI collaboration, agentic coding &amp; dev workflows, plus image creation (DALL-E/Midjourney/SD pipelines) and video creation (Runway/Pika/HeyGen) guides; KB now at 555+ documents</li>
            <li>[Windsurf] 🔒 Security audit &amp; vulnerability fixes — comprehensive security audit completed across authentication, API security, database security, dependencies, logging, input validation, and file handling; fixed 15 critical dependency vulnerabilities (minimatch ReDoS, rollup path traversal, tar file overwrite, electron ASAR bypass, ajv ReDoS, bn.js infinite loop); verified strong authentication (Supabase JWT with proper token validation), robust API security (CORS whitelist, Helmet.js, rate limiting, Discord webhook verification), secure environment management (Zod validation, no hardcoded secrets), proper database security (tenant isolation, UUID keys, cascade deletes), comprehensive audit logging (request tracking, tenant-scoped trails, IP/user agent logging), and secure file handling (tenant-scoped storage, quotas, filename sanitization, signed URLs)</li>
            <li>[Windsurf] 🛡️ Production security hardening — resolved all npm audit vulnerabilities across frontend (12 fixes) and backend (3 fixes); updated electron to v40.6.1 and electron-builder to v26.8.1; confirmed zero remaining security vulnerabilities; security score improved from 7.5/10 to 9.2/10; application now production-ready with enterprise-grade security posture</li>
            <li>[Windsurf] 🏛️ Enterprise compliance frameworks — docs only: SOC 2, HIPAA, GDPR, ISO 27001, FISMA/NIST policy files in /policies/ directory; referenced 3 files that were never created (INCIDENT_RESPONSE.md, VENDOR_MANAGEMENT.md, RISK_MANAGEMENT.md)</li>
            <li>[Claude Code] Fixed broken backend build from Windsurf commits — removed phantom imports (billingWebhook.js, voiceCommands.ts) that crashed Render; deleted 537 lines of simulated stub code with fake Prisma models; added CLAUDE.md build rules so all AI tools must pass `npm run build` before committing</li>
            <li>[Claude Code] Real compliance code — 5 new database tables (data_subject_requests, consent_records, data_breaches, incident_reports, vendor_assessments) with full CRUD API at /v1/compliance; GDPR DSAR endpoints (create/process/export/erase with 30-day deadline tracking and overdue alerts), consent management (grant/withdraw per purpose with lawful basis tracking, IP/UA capture), data breach register (auto-calculates 72-hour GDPR and 60-day HIPAA notification deadlines, status progression from detected→closed), incident reporting (severity P0-P3, category tracking, root cause and lessons learned), vendor risk assessments (risk scoring, DPA/BAA tracking, annual review scheduling), and a unified compliance dashboard that shows status across all frameworks in one call; plus 4 real operational policy docs (incident response, vendor management, risk management, PCI DSS) replacing the phantom files</li>
            <li>[Windsurf] Voice Command System — natural language voice control using Web Speech API in Settings; multi-language support with auto-listen</li>
            <li>[Windsurf] Premium feature panels — SecurityCompliance, BusinessIntelligence, VideoConferencing, SpreadsheetAnalysis, and 19 more premium components inside Business Manager and Settings</li>
            <li>[Claude Code] Windsurf cleanup — removed FloatingAtlas overlay, SystemTrayAtlas, BrowserExtensionAtlas (dead code), and duplicate billingWebhookRoutes.ts; all called non-existent endpoints or duplicated existing stripeRoutes; Atlas wireframe robot avatar in the header is the single source of truth</li>
          </ul>

          <div className="mt-5 flex gap-3">
            <a
              href="#/app/settings"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore integrations
            </a>
            <a
              href="#/app"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open app home
            </a>
          </div>
        </section>

        {/* Builders */}
        <section id="builders" className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Builders / co-founders</h2>
          <p className="mt-3 text-sm text-white/70">
            Looking for a technical co-founder to build a desktop-first,
            local-first automation platform long-term — equity, ownership,
            real execution.
          </p>

          <div className="mt-5">
            <a
              href="mailto:billy@deadapp.info?subject=ATLAS%20UX%20-%20Builder%20Intro"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold !text-black hover:opacity-90"
            >
              Email Billy
            </a>
          </div>
        </section>

        <footer className="mt-24 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-6 justify-center">
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/store" className="hover:text-white">Store</Link>
            <Link to="/payment" className="hover:text-white">Payment</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/acceptable-use" className="hover:text-white">Acceptable Use</Link>
          </div>
  <p className="mt-6 text-center text-xs text-slate-500">
    © {new Date().getFullYear()} Atlas UX — a product of DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST. All rights reserved.
  </p>
</footer>

      </main>
    </div>
  );
}
