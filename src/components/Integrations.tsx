import * as React from "react";
import { Plus, X, Search, Filter, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";
import { getOrgUser } from "@/lib/org";

type Category =
  | "Social"
  | "Google"
  | "Microsoft"
  | "Apple"
  | "AWS"
  | "CRM"
  | "Messaging"
  | "Video"
  | "Storage"
  | "Payments"
  | "Marketing"
  | "Automation"
  | "Ecommerce"
  | "Dev"
  | "Other";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: Category;
  oauth: "google" | "meta" | "x" | "tumblr" | "microsoft" | "reddit" | "pinterest" | "linkedin" | null;
  /** Sub-services unlocked by this OAuth connection */
  covers?: string[];
  /** Priority groups sort above everything else */
  group?: boolean;
  /** Show a note instead of disabled button */
  pendingNote?: string;
};

const BACKEND_URL = API_BASE;

const INTEGRATIONS: Integration[] = [
  // ── Priority provider groups (always shown first) ─────────────────────
  {
    id: "google",
    name: "Google",
    category: "Google",
    description: "One OAuth connection covers all Google services.",
    oauth: "google",
    group: true,
    covers: ["Gmail", "Drive", "Calendar", "Sheets", "Docs", "YouTube", "Meet", "GA4", "Search Console", "Business Profile", "Google Ads"],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    category: "Microsoft",
    description: "One Azure AD consent covers all Microsoft 365 services.",
    oauth: "microsoft",
    group: true,
    covers: ["Outlook", "OneDrive", "Teams", "SharePoint", "Calendar"],
  },
  {
    id: "meta",
    name: "Meta",
    category: "Social",
    description: "One Meta app approval covers all Meta-backed platforms.",
    oauth: "meta",
    group: true,
    covers: ["Facebook Pages", "Facebook Groups", "Facebook Ads", "Instagram", "Threads"],
  },
  {
    id: "icloud",
    name: "iCloud",
    category: "Apple",
    description: "Apple cloud storage and file sync.",
    oauth: null,
    group: true,
    covers: ["iCloud Drive", "Photos", "Contacts"],
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    category: "AWS",
    description: "IAM-based access to all AWS services.",
    oauth: null,
    group: true,
    covers: ["S3", "Lambda", "CloudWatch", "EC2", "IAM"],
  },

  // ── Social platforms ──────────────────────────────────────────────────
  { id: "x",        name: "X (Twitter)", category: "Social",   description: "Tweet, schedule, and monitor.",                oauth: "x" },
  { id: "tumblr",   name: "Tumblr",      category: "Social",   description: "Publish blog posts and track distribution.",   oauth: "tumblr" },
  { id: "linkedin", name: "LinkedIn",    category: "Social",   description: "Company + personal publishing.",               oauth: "linkedin", pendingNote: "App approval pending — credentials not yet configured." },
  { id: "pinterest",name: "Pinterest",   category: "Social",   description: "Pins, boards, and trends.",                   oauth: "pinterest" },
  { id: "tiktok",   name: "TikTok",      category: "Social",   description: "Post videos and view analytics.",             oauth: null, pendingNote: "Pending TikTok for Business approval." },
  { id: "reddit",   name: "Reddit",      category: "Social",   description: "Post, comment, monitor mentions.",            oauth: "reddit" },
  { id: "snapchat", name: "Snapchat",    category: "Social",   description: "Spotlight and campaigns.",                    oauth: null, pendingNote: "Pending Snap Partner approval." },
  { id: "twitch",   name: "Twitch",      category: "Social",   description: "Streams, clips, channel ops.",                oauth: null },

  // ── Storage ───────────────────────────────────────────────────────────
  { id: "dropbox",  name: "Dropbox",     category: "Storage",  description: "Files, folders, links.",                      oauth: null },
  { id: "box",      name: "Box",         category: "Storage",  description: "Enterprise storage.",                         oauth: null },

  // ── Video / Conferencing ──────────────────────────────────────────────
  { id: "zoom",     name: "Zoom",        category: "Video",    description: "Meetings, webinars, recordings.",             oauth: null },

  // ── CRM ───────────────────────────────────────────────────────────────
  { id: "hubspot",  name: "HubSpot",     category: "CRM",      description: "Contacts, deals, pipelines.",                 oauth: null },
  { id: "salesforce",name:"Salesforce",  category: "CRM",      description: "Leads, accounts, automations.",               oauth: null },
  { id: "zoho_crm", name: "Zoho CRM",   category: "CRM",      description: "Lead capture and workflows.",                 oauth: null },
  { id: "pipedrive",name: "Pipedrive",   category: "CRM",      description: "Deals and stages.",                           oauth: null },

  // ── Messaging ─────────────────────────────────────────────────────────
  { id: "slack",    name: "Slack",       category: "Messaging",description: "Channels, alerts, workflows.",                oauth: null },
  { id: "discord",  name: "Discord",     category: "Messaging",description: "Bots, webhooks, community.",                  oauth: null },
  { id: "telegram", name: "Telegram",    category: "Messaging",description: "Channels, bots, automations.",               oauth: null },
  { id: "whatsapp", name: "WhatsApp Business", category: "Messaging", description: "Messaging and templates.",            oauth: null },
  { id: "twilio",   name: "Twilio SMS",  category: "Messaging",description: "Text messaging & verification.",              oauth: null },

  // ── Payments ──────────────────────────────────────────────────────────
  { id: "stripe",   name: "Stripe",      category: "Payments", description: "Payments, subscriptions, webhooks.",          oauth: null },
  { id: "paypal",   name: "PayPal",      category: "Payments", description: "Payments and invoices.",                      oauth: null },
  { id: "square",   name: "Square",      category: "Payments", description: "POS and payments.",                           oauth: null },

  // ── Marketing ─────────────────────────────────────────────────────────
  { id: "mailchimp",name: "Mailchimp",   category: "Marketing",description: "Email campaigns and lists.",                  oauth: null },
  { id: "klaviyo",  name: "Klaviyo",     category: "Marketing",description: "Ecommerce email/SMS.",                       oauth: null },
  { id: "sendgrid", name: "SendGrid",    category: "Marketing",description: "Transactional email.",                        oauth: null },

  // ── Automation ────────────────────────────────────────────────────────
  { id: "zapier",   name: "Zapier",      category: "Automation",description: "Connect apps with zaps.",                   oauth: null },
  { id: "make",     name: "Make",        category: "Automation",description: "Advanced workflows.",                        oauth: null },
  { id: "n8n",      name: "n8n",         category: "Automation",description: "Self-hosted automation.",                   oauth: null },

  // ── Ecommerce ─────────────────────────────────────────────────────────
  { id: "shopify",  name: "Shopify",     category: "Ecommerce",description: "Products, orders, customers.",               oauth: null },
  { id: "woocommerce",name:"WooCommerce",category: "Ecommerce",description: "WordPress ecommerce.",                       oauth: null },
  { id: "etsy",     name: "Etsy",        category: "Ecommerce",description: "Listings and orders.",                       oauth: null },

  // ── Dev ───────────────────────────────────────────────────────────────
  { id: "github",   name: "GitHub",      category: "Dev",      description: "Repos, issues, actions.",                    oauth: null },
  { id: "gitlab",   name: "GitLab",      category: "Dev",      description: "CI/CD and repos.",                           oauth: null },
  { id: "vercel",   name: "Vercel",      category: "Dev",      description: "Deployments and env vars.",                  oauth: null },
  { id: "cloudflare",name:"Cloudflare",  category: "Dev",      description: "DNS, Workers, security.",                    oauth: null },

  // ── Other ─────────────────────────────────────────────────────────────
  { id: "notion",   name: "Notion",      category: "Other",    description: "Docs and databases.",                         oauth: null },
  { id: "airtable", name: "Airtable",    category: "Other",    description: "Base records and views.",                     oauth: null },
];

const ALL_CATEGORIES: Array<Category | "All"> = [
  "All", "Social", "Google", "Microsoft", "Apple", "AWS",
  "CRM", "Messaging", "Video", "Storage", "Payments",
  "Marketing", "Automation", "Ecommerce", "Dev", "Other",
];

type StatusRow = { provider: string; connected: boolean };

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const { tenantId } = useActiveTenant();
  const [status, setStatus] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | "All">("All");

  const refreshStatus = React.useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/v1/integrations/summary?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
        credentials: "include",
      });
      const raw = await r.json() as any;
      // Prefer the flat providers map (canonical); fall back to integrations array
      const providerMap: Record<string, boolean> =
        raw?.providers && typeof raw.providers === "object"
          ? raw.providers
          : Object.fromEntries((raw?.integrations ?? []).map((r: any) => [String(r.provider), !!r.connected]));

      const map: Record<string, boolean> = {};
      for (const i of INTEGRATIONS) {
        map[i.id] = i.oauth ? !!providerMap[i.oauth] : false;
      }
      setStatus(map);
    } catch {
      const map: Record<string, boolean> = {};
      for (const i of INTEGRATIONS) map[i.id] = false;
      setStatus(map);
    }
  }, [tenantId]);

  React.useEffect(() => { refreshStatus(); }, [refreshStatus]);

  React.useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) setQuery(focus);
  }, [searchParams]);

  React.useEffect(() => {
    if (searchParams.get("connected")) refreshStatus();
  }, [searchParams, refreshStatus]);

  const connect = (i: Integration) => {
    if (!i.oauth) return;
    setLoading(i.id);
    const { user_id } = getOrgUser();
    const realTenantId = tenantId ?? "";
    const start =
      i.oauth === "google"    ? `${BACKEND_URL}/v1/oauth/google/start`
      : i.oauth === "meta"    ? `${BACKEND_URL}/v1/oauth/meta/start`
      : i.oauth === "tumblr"  ? `${BACKEND_URL}/v1/oauth/tumblr/start`
      : i.oauth === "microsoft" ? `${BACKEND_URL}/v1/oauth/microsoft/start`
      : i.oauth === "reddit"    ? `${BACKEND_URL}/v1/oauth/reddit/start`
      : i.oauth === "pinterest" ? `${BACKEND_URL}/v1/oauth/pinterest/start`
      : i.oauth === "linkedin"  ? `${BACKEND_URL}/v1/oauth/linkedin/start`
      : `${BACKEND_URL}/v1/oauth/x/start`;

    const params = new URLSearchParams({ tenantId: realTenantId, org_id: realTenantId, user_id });
    window.location.href = `${start}?${params.toString()}`;
  };

  const disconnect = async (i: Integration) => {
    if (!i.oauth) return;
    setLoading(i.id);
    await fetch(`${BACKEND_URL}/v1/integrations/${i.oauth}/disconnect?tenantId=${encodeURIComponent(tenantId ?? "")}`, {
      method: "POST",
      credentials: "include",
    });
    await refreshStatus();
    setLoading(null);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = INTEGRATIONS.filter((i) => {
      const matchesQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.covers ?? []).some(s => s.toLowerCase().includes(q));
      const matchesC = category === "All" ? true : i.category === category;
      return matchesQ && matchesC;
    });
    // Groups always sort before individual cards
    return [...base].sort((a, b) => {
      if (a.group && !b.group) return -1;
      if (!a.group && b.group) return 1;
      return 0;
    });
  }, [query, category]);

  const connectedCount = React.useMemo(() => {
    // Count unique providers connected, not individual cards
    const seen = new Set<string>();
    let c = 0;
    for (const i of INTEGRATIONS) {
      const key = i.oauth ?? `__${i.id}`;
      if (status[i.id] && !seen.has(key)) { seen.add(key); c++; }
    }
    return c;
  }, [status]);

  const totalProviders = React.useMemo(() => {
    const seen = new Set<string>();
    for (const i of INTEGRATIONS) seen.add(i.oauth ?? `__${i.id}`);
    return seen.size;
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-slate-600">
            Connect once per provider — OAuth scopes unlock all sub-services automatically.
          </p>
          <div className="text-xs text-neutral-500">
            Connected: <span className="text-slate-800 font-semibold">{connectedCount}</span> / {totalProviders} providers
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
                <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
              ))}
            </select>
          </div>

          <button className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" onClick={refreshStatus} title="Refresh status">
            <RefreshCw className="h-4 w-4 text-slate-700" />
          </button>
        </div>
      </div>

      <div
        className="gap-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
      >
        {filtered.map((i) => {
          const connected = !!status[i.id];
          const busy = loading === i.id;
          const oauthReady = i.oauth !== null;

          return (
            <div
              key={i.id}
              className={`glass rounded-2xl p-5 flex flex-col justify-between ${i.group ? "min-h-[185px]" : "min-h-[145px]"}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{i.name}</div>
                      {i.group && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                          Suite
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      {i.category}
                      <span className="mx-2 text-neutral-400">•</span>
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

                {/* Sub-service chips */}
                {i.covers && i.covers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {i.covers.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {i.pendingNote && (
                  <div className="text-[11px] text-amber-600">{i.pendingNote}</div>
                )}
                {!oauthReady && !i.group && !i.pendingNote && (
                  <div className="text-[11px] text-neutral-500">OAuth not wired yet.</div>
                )}
                {!oauthReady && i.group && !i.pendingNote && (
                  <div className="text-[11px] text-neutral-500">Coming soon.</div>
                )}
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

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm text-slate-600">
          No integrations match your search.
        </div>
      )}
    </div>
  );
}
