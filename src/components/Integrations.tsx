import * as React from "react";
import { Plus, X, Search, Filter, RefreshCw } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";


type Category =
  | "Social"
  | "Google"
  | "Microsoft"
  | "AWS"
  | "CRM"
  | "Messaging"
  | "Video"
  | "Storage"
  | "Payments"
  | "Marketing"
  | "Automation"
  | "Ecommerce"
  | "Analytics"
  | "Dev"
  | "Other";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: Category;
  // which backend oauth provider handles this integration right now
  oauth: "google" | "meta" | null;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787";

// backend scaffold expects org_id/user_id in query (per its comments)
function getOrgUser() {
  const org_id = localStorage.getItem("atlasux_org_id") || "demo_org";
  const user_id = localStorage.getItem("atlasux_user_id") || "demo_user";
  return { org_id, user_id };
}

const INTEGRATIONS: Integration[] = [
  // Social (Meta-backed)
  { id: "facebook_pages", name: "Facebook Pages", category: "Social", description: "Manage Pages, posts, insights.", oauth: "meta" },
  { id: "facebook_groups", name: "Facebook Groups", category: "Social", description: "Post and moderate groups.", oauth: "meta" },
  { id: "facebook_ads", name: "Facebook Ads", category: "Social", description: "Ad accounts & campaigns.", oauth: "meta" },
  { id: "instagram", name: "Instagram", category: "Social", description: "Publish and analyze posts.", oauth: "meta" },
  { id: "threads", name: "Threads", category: "Social", description: "Compose and schedule posts.", oauth: "meta" },

  // Social (non-oauth for now)
  { id: "tiktok", name: "TikTok", category: "Social", description: "Post videos and view analytics.", oauth: null },
  { id: "youtube", name: "YouTube", category: "Social", description: "Upload, manage, and track.", oauth: "google" },
  { id: "youtube_studio", name: "YouTube Studio", category: "Social", description: "Channel management tools.", oauth: "google" },
  { id: "x", name: "X (Twitter)", category: "Social", description: "Tweet, schedule, and monitor.", oauth: null },
  { id: "linkedin", name: "LinkedIn", category: "Social", description: "Company + personal publishing.", oauth: null },
  { id: "pinterest", name: "Pinterest", category: "Social", description: "Pins, boards, and trends.", oauth: null },
  { id: "reddit", name: "Reddit", category: "Social", description: "Post, comment, monitor mentions.", oauth: null },
  { id: "snapchat", name: "Snapchat", category: "Social", description: "Spotlight and campaigns.", oauth: null },
  { id: "twitch", name: "Twitch", category: "Social", description: "Streams, clips, channel ops.", oauth: null },

  // Google (Google-backed)
  { id: "google", name: "Google Account", category: "Google", description: "Single sign-in for Google apps.", oauth: "google" },
  { id: "gmail", name: "Gmail", category: "Google", description: "Email sync and automations.", oauth: "google" },
  { id: "google_calendar", name: "Google Calendar", category: "Google", description: "Scheduling and reminders.", oauth: "google" },
  { id: "google_drive", name: "Google Drive", category: "Google", description: "File access and sharing.", oauth: "google" },
  { id: "google_sheets", name: "Google Sheets", category: "Google", description: "Read/write spreadsheets.", oauth: "google" },
  { id: "google_docs", name: "Google Docs", category: "Google", description: "Generate and update docs.", oauth: "google" },
  { id: "google_business", name: "Google Business Profile", category: "Google", description: "Posts, reviews, locations.", oauth: "google" },
  { id: "google_ads", name: "Google Ads", category: "Google", description: "Campaigns and reporting.", oauth: "google" },
  { id: "google_search_console", name: "Google Search Console", category: "Google", description: "SEO queries and indexing.", oauth: "google" },
  { id: "ga4", name: "Google Analytics (GA4)", category: "Analytics", description: "Traffic and conversion analytics.", oauth: "google" },

  // Microsoft (placeholder)
  { id: "microsoft", name: "Microsoft Account", category: "Microsoft", description: "Single sign-in for Microsoft apps.", oauth: null },
  { id: "outlook", name: "Outlook Mail", category: "Microsoft", description: "Email and rules.", oauth: null },
  { id: "ms_calendar", name: "Microsoft Calendar", category: "Microsoft", description: "Scheduling and events.", oauth: null },
  { id: "onedrive", name: "OneDrive", category: "Microsoft", description: "Cloud file sync.", oauth: null },
  { id: "sharepoint", name: "SharePoint", category: "Microsoft", description: "Sites and shared documents.", oauth: null },
  { id: "teams", name: "Microsoft Teams", category: "Video", description: "Meetings and messaging.", oauth: null },

  // AWS (added)
  { id: "aws", name: "Amazon Web Services", category: "AWS", description: "IAM, S3, Lambda, CloudWatch.", oauth: null },
  { id: "aws_s3", name: "AWS S3", category: "AWS", description: "Buckets, uploads, downloads.", oauth: null },
  { id: "aws_lambda", name: "AWS Lambda", category: "AWS", description: "Serverless functions control.", oauth: null },
  { id: "aws_cloudwatch", name: "AWS CloudWatch", category: "AWS", description: "Logs, metrics, alarms.", oauth: null },

  // Storage
  { id: "dropbox", name: "Dropbox", category: "Storage", description: "Files, folders, links.", oauth: null },
  { id: "box", name: "Box", category: "Storage", description: "Enterprise storage.", oauth: null },
  { id: "icloud", name: "iCloud", category: "Storage", description: "Apple cloud sync & files.", oauth: null },

  // Video
  { id: "zoom", name: "Zoom", category: "Video", description: "Meetings, webinars, recordings.", oauth: null },
  { id: "google_meet", name: "Google Meet", category: "Video", description: "Meetings & links.", oauth: "google" },

  // CRM
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Contacts, deals, pipelines.", oauth: null },
  { id: "salesforce", name: "Salesforce", category: "CRM", description: "Leads, accounts, automations.", oauth: null },
  { id: "zoho_crm", name: "Zoho CRM", category: "CRM", description: "Lead capture and workflows.", oauth: null },
  { id: "pipedrive", name: "Pipedrive", category: "CRM", description: "Deals and stages.", oauth: null },

  // Messaging
  { id: "slack", name: "Slack", category: "Messaging", description: "Channels, alerts, workflows.", oauth: null },
  { id: "discord", name: "Discord", category: "Messaging", description: "Bots, webhooks, community.", oauth: null },
  { id: "telegram", name: "Telegram", category: "Messaging", description: "Channels, bots, automations.", oauth: null },
  { id: "whatsapp", name: "WhatsApp Business", category: "Messaging", description: "Messaging and templates.", oauth: null },
  { id: "twilio", name: "Twilio SMS", category: "Messaging", description: "Text messaging & verification.", oauth: null },

  // Payments
  { id: "stripe", name: "Stripe", category: "Payments", description: "Payments, subscriptions, webhooks.", oauth: null },
  { id: "paypal", name: "PayPal", category: "Payments", description: "Payments and invoices.", oauth: null },
  { id: "square", name: "Square", category: "Payments", description: "POS and payments.", oauth: null },

  // Marketing
  { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Email campaigns and lists.", oauth: null },
  { id: "klaviyo", name: "Klaviyo", category: "Marketing", description: "Ecommerce email/SMS.", oauth: null },
  { id: "sendgrid", name: "SendGrid", category: "Marketing", description: "Transactional email.", oauth: null },

  // Automation
  { id: "zapier", name: "Zapier", category: "Automation", description: "Connect apps with zaps.", oauth: null },
  { id: "make", name: "Make (Integromat)", category: "Automation", description: "Advanced workflows.", oauth: null },
  { id: "n8n", name: "n8n", category: "Automation", description: "Self-hosted automation.", oauth: null },

  // Ecommerce
  { id: "shopify", name: "Shopify", category: "Ecommerce", description: "Products, orders, customers.", oauth: null },
  { id: "woocommerce", name: "WooCommerce", category: "Ecommerce", description: "WordPress ecommerce.", oauth: null },
  { id: "etsy", name: "Etsy", category: "Ecommerce", description: "Listings and orders.", oauth: null },

  // Dev / Other
  { id: "github", name: "GitHub", category: "Dev", description: "Repos, issues, actions.", oauth: null },
  { id: "gitlab", name: "GitLab", category: "Dev", description: "CI/CD and repos.", oauth: null },
  { id: "vercel", name: "Vercel", category: "Dev", description: "Deployments and env vars.", oauth: null },
  { id: "cloudflare", name: "Cloudflare", category: "Dev", description: "DNS, Workers, security.", oauth: null },
  { id: "notion", name: "Notion", category: "Other", description: "Docs and databases.", oauth: null },
  { id: "airtable", name: "Airtable", category: "Other", description: "Base records and views.", oauth: null },
];

const ALL_CATEGORIES: Array<Category | "All"> = [
  "All",
  "Social",
  "Google",
  "Microsoft",
  "AWS",
  "CRM",
  "Messaging",
  "Video",
  "Storage",
  "Payments",
  "Marketing",
  "Automation",
  "Ecommerce",
  "Analytics",
  "Dev",
  "Other",
];

type StatusRow = { provider: "google" | "meta"; connected: boolean };

export default function Integrations() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [status, setStatus] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | "All">("All");

  const refreshStatus = React.useCallback(async () => {
    const { org_id, user_id } = getOrgUser();
    try {
      const r = await fetch(`${BACKEND_URL}/v1/integrations/status?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`, {
        credentials: "include",
      });
      const rows = (await r.json()) as StatusRow[];

      // backend is only google/meta right now; we project that onto each integration
      const map: Record<string, boolean> = {};
      const googleOn = !!rows.find((x) => x.provider === "google")?.connected;
      const metaOn = !!rows.find((x) => x.provider === "meta")?.connected;

      for (const i of INTEGRATIONS) {
        if (i.oauth === "google") map[i.id] = googleOn;
        else if (i.oauth === "meta") map[i.id] = metaOn;
        else map[i.id] = false;
      }
      setStatus(map);
    } catch {
      // if backend not reachable, still render UI
      const map: Record<string, boolean> = {};
      for (const i of INTEGRATIONS) map[i.id] = false;
      setStatus(map);
    }
  }, []);

  React.useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const connect = (i: Integration) => {
    if (!i.oauth) return; // not wired yet
    // Route through the trusted wizard flow (Sprout-style)
    const qp = new URLSearchParams();
    qp.set("integration", i.id);
    qp.set("returnTo", "/app/integrations");
    navigate(`/app/integrations/connect/${i.oauth}?${qp.toString()}`);
  };

  const disconnect = async (i: Integration) => {
    if (!i.oauth) return;
    setLoading(i.id);

    const { org_id, user_id } = getOrgUser();
    await fetch(`${BACKEND_URL}/v1/integrations/${i.oauth}/disconnect?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`, {
      method: "POST",
      credentials: "include",
    });

    await refreshStatus();
    setLoading(null);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTEGRATIONS.filter((i) => {
      const matchesQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);

      const matchesC = category === "All" ? true : i.category === category;
      return matchesQ && matchesC;
    });
  }, [query, category]);

  const connectedCount = React.useMemo(() => {
    let c = 0;
    for (const i of INTEGRATIONS) if (status[i.id]) c++;
    return c;
  }, [status]);

  return (
    <div className="space-y-5">
      <ConnectWizard
        providerParam={params.provider}
        pathname={location.pathname}
        onClose={() => navigate("/app/integrations")}
        backendUrl={BACKEND_URL}
        getOrgUser={getOrgUser}
        refreshStatus={refreshStatus}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-neutral-400">
            Green = connect. Red = disconnect. OAuth goes through your backend proxy.
          </p>
          <div className="text-xs text-neutral-500">
            Connected: <span className="text-neutral-200 font-semibold">{connectedCount}</span> / {INTEGRATIONS.length}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations…"
              className="w-72 bg-transparent text-sm outline-none placeholder:text-neutral-500"
            />
          </div>

          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-transparent text-sm outline-none"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>

          <button className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" onClick={refreshStatus} title="Refresh status">
            <RefreshCw className="h-4 w-4 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Cards + auto-fit columns (3+ when space allows) */}
      <div
        className="gap-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {filtered.map((i) => {
          const connected = !!status[i.id];
          const busy = loading === i.id;
          const oauthReady = i.oauth !== null;

          return (
            <div key={i.id} className="glass rounded-2xl p-5 flex flex-col justify-between min-h-[155px]">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-neutral-400">
                      {i.category}
                      <span className="mx-2 text-neutral-600">•</span>
                      {i.description}
                    </div>
                  </div>

                  {connected ? (
                    <span className="badge-connected">
                      <span className="status-dot-connected" />
                      Connected
                    </span>
                  ) : (
                    <span className="badge-disconnected">
                      <span className="status-dot-disconnected" />
                      Disconnected
                    </span>
                  )}
                </div>

                {!oauthReady ? (
                  <div className="text-[11px] text-neutral-500">
                    OAuth not wired yet (UI ready).
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-end">
                {connected ? (
                  <button className="btn-disconnect" disabled={!oauthReady || busy} onClick={() => disconnect(i)}>
                    <X className="h-4 w-4" />
                    {busy ? "Disconnecting…" : "Disconnect"}
                  </button>
                ) : (
                  <button className="btn-connect" disabled={!oauthReady || busy} onClick={() => connect(i)}>
                    <Plus className="h-4 w-4" />
                    {busy ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-neutral-400">No integrations match your search.</div>
      ) : null}
    </div>
  );
}

// -------------------- Sprout-style Connect Wizard --------------------
// This is intentionally lightweight: OAuth is done on the backend, then we
// fetch "owned" assets (Meta pages / ad accounts) and store a selection back
// into token_vault.meta. Other providers can plug into the same skeleton.

type WizardStep = "select" | "authorize" | "import" | "done" | "error";
type WizardAsset = { id: string; name: string; type: "page" | "ads"; meta?: any };

function ConnectWizard(props: {
  providerParam?: string;
  pathname: string;
  onClose: () => void;
  backendUrl: string;
  getOrgUser: () => { org_id: string; user_id: string };
  refreshStatus: () => Promise<void> | void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isConnectRoute = props.pathname.includes("/integrations/connect/");
  const provider = (props.providerParam as "google" | "meta" | undefined);
  if (!isConnectRoute || !provider) return null;

  const qs = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const integration = qs.get("integration") || "";
  const returnTo = qs.get("returnTo") || "/app/integrations";
  const initialTypeFromIntegration = React.useMemo(() => {
    if (integration.includes("ads")) return "ads";
    return "page";
  }, [integration]);

  const [step, setStep] = React.useState<WizardStep>(provider === "meta" ? "select" : "authorize");
  const [assetType, setAssetType] = React.useState<"page" | "ads">(initialTypeFromIntegration);
  const [assets, setAssets] = React.useState<WizardAsset[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // After OAuth redirect back to /app/integrations?connected=..., auto-jump back into this wizard.
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get("connected");
    if (!connected) return;
    const pendingRaw = localStorage.getItem("atlasux_pending_connect");
    if (!pendingRaw) return;
    try {
      const pending = JSON.parse(pendingRaw);
      if (pending?.provider !== connected) return;
      // clear the query param (avoid loops)
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());

      navigate(`/app/integrations/connect/${pending.provider}?integration=${encodeURIComponent(pending.integration || "")}&type=${encodeURIComponent(pending.type || "page")}&returnTo=${encodeURIComponent(pending.returnTo || "/app/integrations")}`);
      localStorage.removeItem("atlasux_pending_connect");
    } catch {
      // ignore
    }
  }, [navigate]);

  // If wizard is opened with ?type=...&step=import, go there.
  React.useEffect(() => {
    const t = (qs.get("type") as any) || null;
    if (t === "page" || t === "ads") setAssetType(t);
    const st = qs.get("step");
    if (st === "import") setStep("import");
  }, [qs]);

  const startOAuth = () => {
    const { org_id, user_id } = props.getOrgUser();
    const start = provider === "google" ? `${props.backendUrl}/v1/oauth/google/start` : `${props.backendUrl}/v1/oauth/meta/start`;

    localStorage.setItem(
      "atlasux_pending_connect",
      JSON.stringify({ provider, type: assetType, integration, returnTo })
    );

    window.location.href = `${start}?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`;
  };

  const loadAssets = async () => {
    if (provider !== "meta") return;
    setBusy(true);
    setError(null);
    try {
      const { org_id, user_id } = props.getOrgUser();
      const r = await fetch(
        `${props.backendUrl}/v1/integrations/meta/assets?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}&type=${encodeURIComponent(assetType)}`,
        { credentials: "include" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load assets");
      setAssets(j.assets || []);
      const sel: Record<string, boolean> = {};
      for (const a of (j.assets || [])) sel[a.id] = true;
      setSelected(sel);
    } catch (e: any) {
      setError(e?.message || "Failed to load assets");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    if (step === "import") void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, assetType]);

  const saveSelection = async () => {
    if (provider !== "meta") {
      setStep("done");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { org_id, user_id } = props.getOrgUser();
      const picked = assets.filter((a) => selected[a.id]).map((a) => ({ id: a.id, name: a.name }));
      const r = await fetch(`${props.backendUrl}/v1/integrations/meta/assets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ org_id, user_id, type: assetType, selected: picked }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Failed to save assets");
      await props.refreshStatus();
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Failed to save");
      setStep("error");
    } finally {
      setBusy(false);
    }
  };

  const closeAndReturn = () => {
    props.onClose();
    navigate(returnTo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass w-full max-w-3xl rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-neutral-400">Connect a Profile</div>
            <div className="text-lg font-semibold">
              {provider === "meta" ? "Facebook / Instagram" : "Google"}
            </div>
          </div>
          <button onClick={props.onClose} className="rounded-lg p-2 hover:bg-white/5" aria-label="Close">
            <X className="h-5 w-5 text-neutral-300" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
          <div className={step === "select" ? "text-neutral-200" : ""}>1 Select</div>
          <div>•</div>
          <div className={step === "authorize" ? "text-neutral-200" : ""}>2 Authorize</div>
          <div>•</div>
          <div className={step === "import" ? "text-neutral-200" : ""}>3 Import</div>
          <div>•</div>
          <div className={step === "done" ? "text-neutral-200" : ""}>4 Done</div>
        </div>

        {step === "select" ? (
          <div className="mt-6">
            <div className="text-sm text-neutral-300">Select the type of Facebook account you want to connect.</div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  setAssetType("page");
                  setStep("authorize");
                }}
                className={`rounded-xl border p-4 text-left transition-colors ${assetType === "page" ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}
              >
                <div className="text-sm font-semibold text-neutral-100">Page</div>
                <div className="mt-1 text-xs text-neutral-400">Manage Business Pages and Messenger conversations.</div>
              </button>
              <button
                onClick={() => {
                  setAssetType("ads");
                  setStep("authorize");
                }}
                className={`rounded-xl border p-4 text-left transition-colors ${assetType === "ads" ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}
              >
                <div className="text-sm font-semibold text-neutral-100">Ad Account</div>
                <div className="mt-1 text-xs text-neutral-400">Boost posts and monitor ad performance.</div>
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={props.onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5">Cancel</button>
              <button onClick={() => setStep("authorize")} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90">Continue</button>
            </div>
          </div>
        ) : null}

        {step === "authorize" ? (
          <div className="mt-6">
            <div className="text-sm text-neutral-300">We’re sending you to {provider === "meta" ? "Facebook" : "Google"} for authorization.</div>
            <div className="mt-2 text-xs text-neutral-500">Tip: if prompted, switch to the account you want to connect.</div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => (provider === "meta" ? setStep("select") : props.onClose())}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5"
              >
                Back
              </button>
              <button onClick={startOAuth} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50" disabled={busy}>
                {busy ? "Preparing…" : `Go to ${provider === "meta" ? "Facebook" : "Google"}`}
              </button>
            </div>
          </div>
        ) : null}

        {step === "import" ? (
          <div className="mt-6">
            <div className="text-sm text-neutral-300">Verify ownership and choose what to import.</div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              {busy ? (
                <div className="text-sm text-neutral-400">Loading…</div>
              ) : assets.length === 0 ? (
                <div className="text-sm text-neutral-400">No assets found.</div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {assets.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={!!selected[a.id]}
                        onChange={(e) => setSelected((p) => ({ ...p, [a.id]: e.target.checked }))}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm text-neutral-100">{a.name}</div>
                        <div className="text-xs text-neutral-500">{a.id}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={props.onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5">Cancel</button>
              <button onClick={saveSelection} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="mt-6">
            <div className="text-sm text-neutral-200">Connected successfully.</div>
            <div className="mt-2 text-xs text-neutral-500">Assets were added to your connected profile list.</div>
            <div className="mt-6 flex items-center justify-end">
              <button onClick={closeAndReturn} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90">Finish</button>
            </div>
          </div>
        ) : null}

        {step === "error" ? (
          <div className="mt-6">
            <div className="text-sm text-red-300">Something went wrong.</div>
            <div className="mt-2 text-xs text-neutral-400">{error || "Unknown error"}</div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={props.onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5">Close</button>
              {provider === "meta" ? (
                <button
                  onClick={() => {
                    setStep("authorize");
                    setError(null);
                  }}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Try Again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

