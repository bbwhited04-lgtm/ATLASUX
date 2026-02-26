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
            <span className="text-sm text-white/60">Last updated: Feb 26, 2026</span>
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
            <li>Full codebase audit — fixed 9 broken Prisma imports, added audit logging to 8 endpoints, Telegram webhook auth + secret token validation, Helmet security headers, ToolsHub dark theme fix, Electron dev-only DevTools, reduced Agent Watcher polling (4s→15s), added email-worker + engine-worker to render.yaml, cleaned up duplicate DB indexes, added missing env var definitions, blog post route fix (#/app/blog/:slug now works), replaced all alert() calls with toast notifications, rate-limited job creation + file uploads, fixed all routes to use reply.send() consistently, added tenant check to mobile pairing, fixed Dashboard navigation, cleaned up console.error across business-manager/ApiKeyManager/TaskAutomation, replaced remaining alert() in DecisionEnginesHub and SubscriptionManager with sonner toasts</li>
            <li>DB migration sprint — added tenant_id to publish_events, all atlas_ip_* tables, and atlas_suggestions (multi-tenancy compliance); DecisionMemo now has optional FK to source Job and Intent for audit traceability; fixed job queue race conditions across 3 workers with optimistic locking (prevents double-execution); KB chunks endpoint now paginated (offset/limit, max 500 per page); per-tenant file upload quotas (500 files, 500 MB default, configurable via env)</li>
            <li>Fix Telegram/Teams "tenant id required" — MessagingHub now sends x-tenant-id header on all API calls (was missing from /me, /updates, /send, and all Teams endpoints); selecting a business now propagates tenant context to every messaging tab</li>
            <li>Full x-tenant-id header audit — added missing header to 14 components: ChatInterface, DecisionEnginesHub, WorkflowsHub, TaskAutomation, AgentDeploymentHub, Dashboard, RootLayout, Settings, FileManagement, Integrations, Analytics, SocialMonitoring, business-manager, MobileIntegration; every API call now carries tenant context</li>
            <li>Business Manager operations suite — selected business now has 5 sub-views (Assets, Ledger, Integrations, Jobs, Audit Log) with toggle navigation; accounting summary backend now computes real totals from ledger entries instead of hardcoded zeros; integrations show connected status with connect/disconnect buttons; jobs table shows type, status, and timestamps; audit log shows actions, levels, and entity types; all data loads in parallel when selecting a business</li>
            <li>Wired Intelligence tab — live KPI dashboard (impressions, CTR, conversions, spend), financial overview from real ledger data, decision analytics (approval rate, cost per decision, by-agent breakdown), channel ROI table, period-over-period comparison with range selector (24h/7d/30d/90d), workforce overview with agent count</li>
            <li>Wired Security &amp; Compliance tab — real audit log activity timeline with color-coded levels, compliance status panel (audit trail, approval workflow, action caps, spend limits), agent access control grouped by tier, managed files inventory from Supabase, security overview stats from live data</li>
            <li>Wired Media Processing tab — full file browser with upload/download/delete against Supabase storage, type-based filtering (images, videos, PDFs, docs), file stats with total storage usage, quick action buttons; replaced all empty mock arrays with real tenant-scoped file data</li>
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
    © {new Date().getFullYear()} Atlas UX, a product of DEAD APP CORP, All rights reserved.
  </p>
</footer>

      </main>
    </div>
  );
}
