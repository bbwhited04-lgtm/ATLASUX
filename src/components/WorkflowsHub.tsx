import * as React from "react";
import { API_BASE } from "../lib/api";
import { Play, RefreshCw, Workflow } from "lucide-react";
import { useActiveTenant } from "../lib/activeTenant";

type RunResponse = {
  ok: boolean;
  intentId?: string;
  tickResult?: unknown;
  error?: string;
};

type RunStatus = {
  ok: boolean;
  intent?: any;
  audits?: any[];
  error?: string;
};

type WorkflowItem = {
  id: string; // UI expects id; backend uses workflow_key
  name: string;
  description?: string;
  agent_key?: string;
  status?: string;
  version?: string;
};

const DEFAULT_WORKFLOWS: WorkflowItem[] = [
  // ── Support & Operations ──────────────────────────────────────────────────
  { id: "WF-001", name: "Support Intake (Cheryl)",                    agent_key: "cheryl",   description: "Create ticket → classify → acknowledge → route → audit." },
  { id: "WF-002", name: "Support Escalation (Cheryl)",                agent_key: "cheryl",   description: "Package escalation and route to executive owner." },
  { id: "WF-010", name: "Daily Executive Brief (Binky)",              agent_key: "binky",    description: "Daily intel digest with traceability." },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)",              agent_key: "atlas",    description: "Minimal end-to-end cloud surface verification." },
  { id: "WF-021", name: "Bootstrap Atlas (Atlas)",                    agent_key: "atlas",    description: "Boot → discover agents → load KB → seed tasks → queue boot email → await command." },
  // ── Platform Intel Sweeps (WF-093–WF-106) ────────────────────────────────
  { id: "WF-093", name: "X (Twitter) Platform Intel (Kelly)",         agent_key: "kelly",    description: "Daily X/Twitter trend sweep — trending hashtags, viral content, tech startup chatter." },
  { id: "WF-094", name: "Facebook Platform Intel (Fran)",             agent_key: "fran",     description: "Daily Facebook trend sweep — trending topics, small business Pages & Groups activity." },
  { id: "WF-095", name: "Threads Platform Intel (Dwight)",            agent_key: "dwight",   description: "Daily Threads trend sweep — trending topics, creator conversations, Meta ecosystem." },
  { id: "WF-096", name: "TikTok Platform Intel (Timmy)",              agent_key: "timmy",    description: "Daily TikTok trend sweep — trending hashtags, sounds, viral video formats." },
  { id: "WF-097", name: "Tumblr Platform Intel (Terry)",              agent_key: "terry",    description: "Daily Tumblr trend sweep — trending tags, creative posts, aesthetic content." },
  { id: "WF-098", name: "Pinterest Platform Intel (Cornwall)",        agent_key: "cornwall", description: "Daily Pinterest trend sweep — trending pins, boards, visual inspiration ideas." },
  { id: "WF-099", name: "LinkedIn Platform Intel (Link)",             agent_key: "link",     description: "Daily LinkedIn trend sweep — trending professional topics, B2B posts, business content." },
  { id: "WF-100", name: "Alignable Platform Intel (Emma)",            agent_key: "emma",     description: "Daily Alignable trend sweep — local business topics, community discussions." },
  { id: "WF-101", name: "Reddit Platform Intel (Donna)",              agent_key: "donna",    description: "Daily Reddit trend sweep — hot threads, AI/automation/small-business subreddits." },
  { id: "WF-102", name: "Blog SEO Platform Intel (Reynolds)",         agent_key: "reynolds", description: "Daily SEO trend sweep — trending blog topics, AI/automation/small-business keywords." },
  { id: "WF-103", name: "Facebook Ads Platform Intel (Penny)",        agent_key: "penny",    description: "Daily Facebook Ads trend sweep — trending ad formats, winning creatives, small biz ads." },
  { id: "WF-104", name: "Instagram Platform Intel (Archy)",           agent_key: "archy",    description: "Daily Instagram trend sweep — trending Reels, hashtags, visual content, creators." },
  { id: "WF-105", name: "YouTube Platform Intel (Venny)",             agent_key: "venny",    description: "Daily YouTube trend sweep — trending videos, AI/automation creators, topic analysis." },
  { id: "WF-106", name: "Atlas Daily Aggregation & Task Assignment",  agent_key: "atlas",    description: "Synthesize all 13 platform intel reports → unified packet → per-agent task orders → emails." },
  // ── Atlas Tools & Content ─────────────────────────────────────────────────
  { id: "WF-107", name: "Atlas Tool Discovery & Proposal",            agent_key: "atlas",    description: "Look inside (agent gaps) + look outside (SERP external tools) → LLM proposals → email report." },
  { id: "WF-108", name: "Reynolds Blog Writer & Publisher",           agent_key: "reynolds", description: "SERP research → LLM drafts full blog post → publishes to KB → emails confirmation." },
  // ── YouTube & Video ───────────────────────────────────────────────────────
  { id: "WF-110", name: "Venny YouTube Video Scraper & KB Ingest",    agent_key: "venny",    description: "Search YouTube by keyword/channel → pull metadata + transcripts → store in KB." },
  { id: "WF-111", name: "Venny YouTube Shorts Auto-Publisher",        agent_key: "venny",    description: "Download Victor's exported video from OneDrive → upload to YouTube via Data API v3." },
  // ── Lucy Reception (WF-112–WF-118) ───────────────────────────────────────
  { id: "WF-112", name: "Lucy Morning Reception Open",                agent_key: "lucy",     description: "Open reception → check voicemails → sync calendar → morning summary to Atlas." },
  { id: "WF-113", name: "Lucy Inbound Call Triage & Routing",         agent_key: "lucy",     description: "Greet caller → identify purpose → route to agent/executive → log to audit." },
  { id: "WF-114", name: "Lucy Appointment Booking",                   agent_key: "lucy",     description: "Book via Bookings → check conflicts → confirm parties → log to CRM." },
  { id: "WF-115", name: "Lucy Voicemail Transcription",               agent_key: "lucy",     description: "Transcribe voicemail → summarize → deliver to recipient → audit log." },
  { id: "WF-116", name: "Lucy Lead Capture & CRM",                    agent_key: "lucy",     description: "Capture lead info from call/chat/email → CRM entry → route to Mercer." },
  { id: "WF-117", name: "Lucy End-of-Day Reception Summary",          agent_key: "lucy",     description: "Compile daily log → calls, bookings, leads, messages → summary email to Atlas." },
  { id: "WF-118", name: "Lucy Chat Widget First Response",            agent_key: "lucy",     description: "Greet chat visitor → identify intent → FAQ or escalate to Cheryl/specialist." },
  // ── Nightly & Weekly Sweeps ───────────────────────────────────────────────
  { id: "WF-119", name: "Nightly Agent Memory Log",                   agent_key: "atlas",    description: "Each agent logs a summary of their daily activity to memory for future recall." },
  { id: "WF-120", name: "Brand Mention Sweep (Sunday)",               agent_key: "sunday",   description: "Weekly brand awareness sweep: web + X + Reddit for Atlas UX, atlasux, Dead App Corp." },
  { id: "WF-121", name: "Competitor Intel Sweep (Archy)",             agent_key: "archy",    description: "Weekly competitive landscape analysis: web search for AI employee platforms." },
  { id: "WF-122", name: "SEO Rank Tracker (Reynolds)",                agent_key: "reynolds", description: "Weekly SEO check: search target keywords, track Atlas UX ranking position." },
  { id: "WF-123", name: "Lead Enrichment (Mercer)",                   agent_key: "mercer",   description: "On-demand lead enrichment: web search company/contact, LLM profile, update CRM." },
  // ── Browser & Vision ──────────────────────────────────────────────────────
  { id: "WF-130", name: "Browser Task Execution (Atlas)",             agent_key: "atlas",    description: "Governed headless browser automation — navigate, extract, interact with web pages." },
  { id: "WF-131", name: "Browser Session Resume (Atlas)",             agent_key: "atlas",    description: "Resume a paused browser session after decision memo approval for HIGH-risk action." },
  { id: "WF-140", name: "Local Vision Task (Vision)",                 agent_key: "vision",   description: "Queue a browser task for the local vision agent — executes on user's machine via CDP." },
  // ── Postiz Social Publishing (WF-200 series) ─────────────────────────────
  { id: "WF-200", name: "TikTok Publish via Postiz (Timmy)",          agent_key: "timmy",    description: "Publish a TikTok post via Postiz API — caption, hashtags, privacy settings." },
  { id: "WF-201", name: "X (Twitter) Publish via Postiz (Kelly)",     agent_key: "kelly",    description: "Publish a tweet/post to X via Postiz API." },
  { id: "WF-202", name: "Facebook Publish via Postiz (Fran)",         agent_key: "fran",     description: "Publish a Facebook Page post via Postiz API." },
  { id: "WF-203", name: "Reddit Publish via Postiz (Donna)",          agent_key: "donna",    description: "Publish a Reddit post via Postiz API — subreddit, title, content." },
  { id: "WF-204", name: "Threads Publish via Postiz (Dwight)",        agent_key: "dwight",   description: "Publish a Threads post via Postiz API." },
  { id: "WF-205", name: "LinkedIn Publish via Postiz (Link)",         agent_key: "link",     description: "Publish a LinkedIn post via Postiz API." },
  { id: "WF-206", name: "Pinterest Publish via Postiz (Cornwall)",    agent_key: "cornwall", description: "Publish a pin to Pinterest via Postiz API — title, board, image." },
  { id: "WF-207", name: "Tumblr Publish via Postiz (Terry)",          agent_key: "terry",    description: "Publish a Tumblr post via Postiz API." },
  { id: "WF-208", name: "YouTube Publish via Postiz (Venny)",         agent_key: "venny",    description: "Publish a YouTube Short or video via Postiz API — title, tags, type." },
  { id: "WF-209", name: "Mastodon Publish via Postiz (Emma)",         agent_key: "emma",     description: "Publish a Mastodon toot via Postiz API." },
  { id: "WF-210", name: "Instagram Publish via Postiz (Archy)",       agent_key: "archy",    description: "Publish an Instagram post/reel via Postiz API." },
  { id: "WF-211", name: "Medium Publish via Postiz (Reynolds)",       agent_key: "reynolds", description: "Publish an article to Medium via Postiz API — title, subtitle, tags." },
  { id: "WF-212", name: "Cross-Platform Publish via Postiz (Sunday)", agent_key: "sunday",   description: "Publish content to multiple platforms at once — Sunday coordinates distribution." },
  // ── Postiz Analytics (WF-220 series) ──────────────────────────────────────
  { id: "WF-220", name: "TikTok Analytics Report (Timmy)",            agent_key: "timmy",    description: "Pull TikTok analytics from Postiz — views, engagement, 4-quadrant diagnostic." },
  { id: "WF-221", name: "X Analytics Report (Kelly)",                 agent_key: "kelly",    description: "Pull X/Twitter analytics from Postiz — impressions, engagement, diagnostic." },
  { id: "WF-222", name: "Facebook Analytics Report (Fran)",           agent_key: "fran",     description: "Pull Facebook analytics from Postiz — reach, engagement, diagnostic." },
  { id: "WF-223", name: "Cross-Platform Analytics (Sunday)",          agent_key: "sunday",   description: "Pull analytics for all connected platforms — summary dashboard with diagnostics." },
];

export function WorkflowsHub() {
  const { tenantId: activeTenantId, setTenantId: setActiveTenantId } = useActiveTenant();
  const [tenantId, setTenantId] = React.useState<string>(activeTenantId ?? "");
  const [agentId, setAgentId] = React.useState<string>("atlas");
  const [workflowId, setWorkflowId] = React.useState<string>("WF-021");
  const [intentId, setIntentId] = React.useState<string>("");
  const [runResp, setRunResp] = React.useState<RunResponse | null>(null);
  const [status, setStatus] = React.useState<RunStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>(DEFAULT_WORKFLOWS);

  // Manual input payload (alpha): lets you run workflows that require fields (ex: WF-001 customerEmail)
  const storageKey = React.useMemo(
    () => `atlasux.workflowInput.${tenantId || "_"}.${agentId}.${workflowId}`,
    [tenantId, agentId, workflowId]
  );
  const [inputJson, setInputJson] = React.useState<string>("{}");

  const templates: Record<string, any> = React.useMemo(
    () => {
      const postizPublish = (platform: string) => ({
        caption: `Check out Atlas UX — your AI employee platform #atlasux #${platform}`,
      });
      const postizPublishMedium = {
        caption: "How Atlas UX Automates Your Business With 30+ AI Employees",
        settings: { title: "How Atlas UX Automates Your Business", subtitle: "AI employees that actually work", tags: ["ai", "automation", "saas"] },
      };
      const postizPublishYT = {
        caption: "Atlas UX — AI employees that actually work #atlasux #shorts",
        settings: { title: "Atlas UX Demo", type: "short", tags: ["ai", "automation"] },
      };
      const postizPublishPinterest = {
        caption: "AI Employee Platform — automate your business with Atlas UX #atlasux",
        settings: { title: "Atlas UX AI Employees", board: "", link: "https://atlasux.cloud" },
      };
      const postizPublishReddit = {
        caption: "We built an AI employee platform with 30+ autonomous agents — here's how it works",
        settings: { subreddit: ["artificial", "SaaS"] },
      };
      const crossPlatformPublish = {
        caption: "Atlas UX — 30+ AI employees running your business autonomously. Try the beta. #atlasux",
        platforms: ["x", "facebook", "threads", "linkedin", "tumblr", "mastodon"],
      };

      return {
        "WF-001": { customerEmail: "test@deadapp.info", subject: "Install help", message: "Need assistance installing Atlas UX" },
        "WF-002": { ticketId: "TKT-0001", reason: "Escalate to Atlas", notes: "Customer blocked; include repro steps + logs" },
        "WF-010": { date: new Date().toISOString().slice(0, 10) },
        "WF-110": { query: "AI automation small business", maxResults: 10 },
        "WF-111": { videoPath: "", title: "Atlas UX Short", tags: ["ai", "automation"] },
        "WF-123": { companyName: "", contactName: "", notes: "" },
        "WF-130": { task: "Navigate to https://example.com and extract the page title", targetUrl: "https://example.com" },
        "WF-140": { task: "Open TikTok and check notifications", targetUrl: "https://www.tiktok.com" },
        // Postiz Publish templates
        "WF-200": postizPublish("tiktok"),
        "WF-201": postizPublish("x"),
        "WF-202": postizPublish("facebook"),
        "WF-203": postizPublishReddit,
        "WF-204": postizPublish("threads"),
        "WF-205": postizPublish("linkedin"),
        "WF-206": postizPublishPinterest,
        "WF-207": postizPublish("tumblr"),
        "WF-208": postizPublishYT,
        "WF-209": postizPublish("mastodon"),
        "WF-210": postizPublish("instagram"),
        "WF-211": postizPublishMedium,
        "WF-212": crossPlatformPublish,
      };
    },
    []
  );

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setInputJson(saved);
      } else if (templates[workflowId]) {
        setInputJson(JSON.stringify(templates[workflowId], null, 2));
      } else {
        setInputJson("{}");
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, workflowId]);

  React.useEffect(() => {
    // prefer backend-provided catalog if available
    fetch(`${API_BASE}/v1/workflows`, {
      headers: activeTenantId ? { "x-tenant-id": activeTenantId } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const rows = Array.isArray(d?.workflows) ? d.workflows : [];
        const normalized: WorkflowItem[] = rows
          .map((w: any) => {
            const id = String(w?.workflow_key ?? w?.id ?? w?.workflowId ?? "").trim();
            if (!id) return null;
            return {
              id,
              name: String(w?.name ?? id),
              description: w?.description ? String(w.description) : undefined,
              agent_key: w?.agent_key ? String(w.agent_key) : (w?.agentKey ? String(w.agentKey) : undefined),
              status: w?.status ? String(w.status) : undefined,
              version: w?.version ? String(w.version) : undefined,
            } as WorkflowItem;
          })
          .filter(Boolean) as WorkflowItem[];

        if (d?.ok && normalized.length) {
          setWorkflows(normalized);
        }
      })
      .catch(() => {});
  }, []);

  // keep local input in sync if global tenant changes (but don't clobber manual edits)
  React.useEffect(() => {
    if (!tenantId && activeTenantId) setTenantId(activeTenantId);
  }, [activeTenantId, tenantId]);

  async function run() {
    setLoading(true);
    setRunResp(null);
    setStatus(null);

    try {
      let input: any = {};
      try {
        input = inputJson?.trim() ? JSON.parse(inputJson) : {};
      } catch {
        // If JSON is invalid, fail fast with a helpful error
        setRunResp({ ok: false, error: "Input JSON is invalid. Fix it and try again." });
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(input, null, 2));
      } catch {
        // ignore
      }

      const res = await fetch(`${API_BASE}/v1/engine/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({
          tenantId,
          agentId,
          workflowId,
          input,
          runTickNow: true,
        }),
      });
      const data = (await res.json()) as RunResponse;
      setRunResp(data);
      if (data.intentId) setIntentId(data.intentId);
    } catch (e: any) {
      setRunResp({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!intentId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/engine/runs/${intentId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
      });
      const data = (await res.json()) as RunStatus;
      setStatus(data);
    } catch (e: any) {
      setStatus({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh once after run to catch intents claimed by the background tick
  React.useEffect(() => {
    if (!intentId || !tenantId) return;
    const t = setTimeout(() => refresh(), 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-cyan-300" />
            <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
          </div>
          <p className="text-sm text-slate-600">Workflow maps + engine smoke tests for the cloud surface.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-600">Tenant ID (uuid)</label>
            <input
              value={tenantId}
              onChange={(e) => {
                const v = e.target.value;
                setTenantId(v);
                // Persist once it looks like a uuid-ish value
                if (v && v.length >= 16) setActiveTenantId(v);
              }}
              placeholder="paste tenant uuid"
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 px-3 py-2 text-base text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 px-3 py-2 text-base text-slate-900 outline-none"
            >
              <option value="atlas">Atlas ~ CEO</option>
              <option value="binky">Binky ~ CRO</option>
              <option value="cheryl">Cheryl ~ CSO</option>
              <option value="tina">Tina ~ CFO</option>
              <option value="larry">Larry ~ Auditor</option>
              <option value="benny">Benny ~ CTO</option>
              <option value="jenny">Jenny ~ CLO</option>
              <option value="archy">Archy ~ Team Binky</option>
              <option value="cornwall">Cornwall ~ Pinterest Agent</option>
              <option value="donna">Donna ~ Redditor</option>
              <option value="dwight">Dwight ~ Threads Agent</option>
              <option value="emma">Emma ~ Alignable Agent</option>
              <option value="fran">Fran ~ Facebook Agent</option>
              <option value="kelly">Kelly ~ X Agent</option>
              <option value="link">Link ~ LinkedIn Agent</option>
              <option value="mercer">Mercer ~ Customer Aquisition</option>
              <option value="penny">Penny ~ Facebook Pages</option>
              <option value="reynolds">Reynolds ~ Blogger</option>
              <option value="sunday">Sunday ~ Team Binky Tech Doc Writer</option>
              <option value="terry">Terry ~ Tumblr Agent</option>
              <option value="timmy">Timmy ~ Tiktok Agent</option>
              <option value="venny">Venny ~ Videographer</option>
              <option value="claire">Claire ~ Calendar & Scheduling</option>
              <option value="daily-intel">Daily-Intel ~ Intel Aggregator</option>
              <option value="frank">Frank ~ Forms & Data</option>
              <option value="lucy">Lucy ~ Receptionist</option>
              <option value="petra">Petra ~ Project Manager</option>
              <option value="porter">Porter ~ SharePoint Manager</option>
              <option value="sandy">Sandy ~ Bookings & Appointments</option>
              <option value="victor">Victor ~ Video Production</option>
              <option value="vision">Vision ~ Local Browser Agent</option>
            </select>
          </div>

          <div>
            <label className="text-base text-slate-600">Workflow</label>
            <select
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-base text-slate-900 outline-none"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} — {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-600">
              Input (JSON) — sent as <code className="text-slate-800">payload.input</code>
            </label>
            {templates[workflowId] ? (
              <button
                type="button"
                onClick={() => setInputJson(JSON.stringify(templates[workflowId], null, 2))}
                className="text-xs text-slate-700 hover:text-slate-900 underline"
              >
                Load template
              </button>
            ) : null}
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 outline-none"
            spellCheck={false}
          />
          <div className="mt-1 text-xs text-slate-500">
            Tip: WF-001 needs <span className="font-mono">customerEmail</span>. WF-200–212 need <span className="font-mono">caption</span>. Templates auto-load when you select a workflow.
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={run}
            disabled={loading || !tenantId}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-red-500 px-4 py-2 text-base font-semibold text-red-600 hover:bg-red-50 disabled:opacity-100 disabled:bg-white disabled:text-red-400 disabled:border-red-300"
          >
            <Play className="h-4 w-4" /> Run (creates intent + 1 tick)
          </button>

          <button
            onClick={refresh}
            disabled={loading || !intentId}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900/40 border border-cyan-500/10 px-4 py-2 text-base text-slate-700 hover:bg-slate-900/60 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh status
          </button>

          <div className="text-base text-slate-800 self-center">
            Backend: <span className="text-slate-800">{API_BASE}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-base font-medium text-slate-800 mb-3">Workflow Map</div>
            <ul className="space-y-1.5">
              {workflows.map((w, i) => (
                <li
                  key={w.id}
                  onClick={() => setWorkflowId(w.id)}
                  className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                    workflowId === w.id
                      ? "bg-cyan-50 border border-cyan-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {w.name || w.id}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {w.id}{w.agent_key ? ` · ${w.agent_key}` : ""}
                    </div>
                    {w.description && (
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {w.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-base font-medium text-slate-800 mb-2">Latest Run</div>
            <div className="space-y-2">
              {intentId && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5">
                  <div className="text-[10px] text-slate-400 font-mono">Intent ID</div>
                  <div className="text-xs text-slate-700 font-mono break-all">{intentId}</div>
                </div>
              )}

              {runResp && (
                <div className={`rounded-lg border px-2.5 py-1.5 ${runResp.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <div className="text-[10px] font-semibold mb-1 text-slate-500">Engine response</div>
                  {runResp.ok ? (
                    <div className="text-xs text-emerald-700">
                      Intent queued{runResp.tickResult?.ran === false ? " — picked up by background tick" : " & executed"}.
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">{runResp.error}</div>
                  )}
                </div>
              )}

              {status && (
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">Run status</div>
                  {status.ok && status.intent ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          status.intent.status === "EXECUTED" ? "bg-emerald-100 text-emerald-700" :
                          status.intent.status === "FAILED"   ? "bg-red-100 text-red-700" :
                          status.intent.status === "AWAITING_HUMAN" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{status.intent.status}</span>
                        <span className="text-[10px] text-slate-400">{status.intent.intentType}</span>
                      </div>
                      {status.audits && status.audits.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {status.audits.map((a: any, i: number) => (
                            <li key={i} className="text-[10px] text-slate-600 font-mono truncate">
                              {a.action}: {a.message?.slice(0, 80)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-red-500">{status.error}</div>
                  )}
                </div>
              )}

              {!intentId && (
                <div className="text-xs text-slate-400 italic">No run yet — select a workflow and hit Run.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Note: For now, workflows are documented in <code className="text-slate-600">/workflows</code>. Next step is loading specs into the engine runner.
      </div>
    </div>
  );
}
