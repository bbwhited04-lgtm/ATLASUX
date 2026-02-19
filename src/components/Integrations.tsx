import * as React from "react";
import { Plus, X, Search, Filter, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "@/lib/api";


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

// Default to your deployed backend. Override locally with VITE_BACKEND_URL.
const BACKEND_URL = API_BASE;
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
  const [searchParams] = useSearchParams();
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

  // If another page links here with ?focus=..., prefill search so the user sees the right card immediately.
  React.useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) setQuery(focus);
  }, [searchParams]);

  const connect = (i: Integration) => {
    if (!i.oauth) return; // not wired yet
    setLoading(i.id);

    const { org_id, user_id } = getOrgUser();
    const start =
      i.oauth === "google"
        ? `${BACKEND_URL}/v1/oauth/google/start`
        : `${BACKEND_URL}/v1/oauth/meta/start`;

    window.location.href = `${start}?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`;
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-slate-600">
            Green = connect. Red = disconnect. OAuth goes through your backend proxy.
          </p>
          <div className="text-xs text-neutral-500">
            Connected: <span className="text-slate-800 font-semibold">{connectedCount}</span> / {INTEGRATIONS.length}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations…"
              className="w-72 bg-transparent text-sm outline-none placeholder:text-neutral-500"
            />
          </div>

          <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
            <Filter className="h-4 w-4 text-slate-600" />
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
            <RefreshCw className="h-4 w-4 text-slate-700" />
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
                    <div className="text-xs text-slate-600">
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
        <div className="glass rounded-2xl p-8 text-center text-sm text-slate-600">No integrations match your search.</div>
      ) : null}
    </div>
  );
}
