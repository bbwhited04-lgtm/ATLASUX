import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Plus, Globe, Facebook, Instagram, Twitter,
  Youtube, TrendingUp, Users, DollarSign, Settings,
  Edit, Trash2, ExternalLink, Copy, CheckCircle,
  Store, MessageSquare, Mail, Calendar, Video, ArrowRight, Hash, Link, Zap,
  Cpu, Gauge, Activity, Database, FolderOpen, Shield, Film,
  BarChart3, Bell, AlertCircle, Key, X as XIcon,
  ClipboardCheck, Newspaper
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { API_BASE } from '@/lib/api';
import { getOrgUser } from '@/lib/org';
import { useActiveTenant } from '@/lib/activeTenant';
import { BusinessIntelligence } from './premium/BusinessIntelligence';
import { MediaProcessing } from './premium/MediaProcessing';
import { SecurityCompliance } from './premium/SecurityCompliance';
import { TeamCollaboration } from './premium/TeamCollaboration';
import { VideoConferencing } from './premium/VideoConferencing';
import { SpreadsheetAnalysis } from './premium/SpreadsheetAnalysis';
import { CommunicationSuite } from './premium/CommunicationSuite';
import { FinancialManagement } from './premium/FinancialManagement';
import { CalendarScheduling } from './premium/CalendarScheduling';
import { SmartAutomation } from './premium/SmartAutomation';
import { EmailClient } from './premium/EmailClient';
import { DecisionsInbox } from './DecisionsInbox';
import { BudgetTracker } from './BudgetTracker';
import { TicketsView } from './TicketsView';
import { BlogManager } from './BlogManager';


interface Asset {
  id: string;
  type: 'domain' | 'social' | 'store' | 'email' | 'app';
  name: string;
  url: string;
  platform?: string;
  status: 'active' | 'pending' | 'inactive';
  metrics?: {
    followers?: number;
    revenue?: string;
    traffic?: string;
    cost?: {
      monthlyCents?: number | string;
      vendor?: string;
      cadence?: "monthly" | "yearly" | "one_time" | string;
      category?: string;
    };
  };
}
type LedgerEntry = {
  id: string;
  tenantId: string;
  entryType: "debit" | "credit";
  category: string;
  amountCents: any; // bigint serialized from API may be string/number
  currency: string;
  description: string;
  externalRef?: string | null;
  meta?: any;
  occurredAt: string;
  createdAt?: string;
};


interface Business {
  id: string;
  name: string;
  description: string;
  color: string;
  assets: Asset[];
  createdAt: string;
  totalValue: string;
  status: 'active' | 'archived';
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}


const VALID_TABS = ["assets", "intelligence", "media", "security", "suite", "decisions", "budgets", "tickets", "blog"] as const;

/** Gate component — shown in place of premium screens for free_beta/starter users */
function UpgradeGate({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h3 className="text-xl font-semibold text-white">Pro Feature</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        <strong>{feature}</strong> requires a Pro or Enterprise plan.
        Upgrade to unlock all premium features including Lucy, Claire, Sandy,
        Calendar, and the full Operations Suite.
      </p>
      <RouterLink
        to="/store"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
      >
        View Plans & Upgrade
      </RouterLink>
    </div>
  );
}

export function BusinessManager() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = VALID_TABS.includes(tabParam as any) ? tabParam! : "assets";

  const { tenantId: activeTenantId, setTenantId: setActiveTenantId } = useActiveTenant();
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(activeTenantId ?? null);

  // Seat tier — determines premium screen access
  const [seatTier, setSeatTier] = useState<string>("free_beta");
  const isPro = seatTier === "pro" || seatTier === "enterprise";

  useEffect(() => {
    const token = localStorage.getItem("supabase_token") || localStorage.getItem("sb-token");
    if (!token || !activeTenantId) return;
    fetch(`${API_BASE}/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": activeTenantId,
      },
    })
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.currentSeat) setSeatTier(d.currentSeat); })
      .catch(() => {});
  }, [activeTenantId]);

  async function selectBusiness(tenantId: string) {
    setSelectedBusiness(tenantId);
    setActiveTenantId(tenantId);
    setWarning(null); // clear stale warning from previous state
    await Promise.all([
      loadAssetsForTenant(tenantId).catch((err) => {
        setWarning(err instanceof Error ? err.message : String(err));
      }),
      loadLedgerForTenant(tenantId).catch(() => null),
      refreshAll().catch(() => null),
    ]);
  }

  // If a tenant was selected elsewhere (or persisted), adopt it.
  useEffect(() => {
    if (activeTenantId && activeTenantId !== selectedBusiness) {
      setSelectedBusiness(activeTenantId);
      loadAssetsForTenant(activeTenantId).catch(() => null);
      loadLedgerForTenant(activeTenantId).catch(() => null);
    }
  }, [activeTenantId, selectedBusiness]);

  // Tenant ID quick-set widget
  const [showTenantWidget, setShowTenantWidget] = useState(false);
  const [tenantInputValue, setTenantInputValue] = useState(activeTenantId ?? "");
  const tenantInputRef = useRef<HTMLInputElement>(null);

  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showEditAsset, setShowEditAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAssetForm, setEditAssetForm] = useState({ type: 'domain', name: '', url: '', platform: '', costMonthlyUsd: '', costVendor: '', costCadence: 'monthly', costCategory: 'hosting' });
  const [newBusinessForm, setNewBusinessForm] = useState({
    name: '',
    description: '',
    color: 'from-cyan-500 to-blue-500',
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

// -------------------- Backend-backed dashboards (Atlas internals, surfaced as Atlas Core / Business Manager) --------------------
const { org_id, user_id } = useMemo(() => getOrgUser(), []);

  // Load tenants (businesses) once on mount
  useEffect(() => {
    loadTenants().catch((err) => {
      setWarning(err instanceof Error ? err.message : String(err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const [integrations, setIntegrations] = useState<Array<{ provider: string; connected: boolean }>>([]);
const [accounting, setAccounting] = useState<any>(null);
const [jobs, setJobs] = useState<any[]>([]);
const [auditRows, setAuditRows] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [warning, setWarning] = useState<string | null>(null);

async function refreshAll() {
  setLoading(true);
  setWarning(null);
  try {
    const tid = activeTenantId ?? org_id;
    const qs = new URLSearchParams({ org_id, user_id, tenantId: tid }).toString();
    const hdr = tid ? { "x-tenant-id": tid } : {};
    const [iRes, aRes, jRes, auRes] = await Promise.all([
      fetch(`${API_BASE}/v1/integrations/summary?${qs}`, { headers: hdr }),
      fetch(`${API_BASE}/v1/accounting/summary?${qs}`, { headers: hdr }),
      fetch(`${API_BASE}/v1/jobs/list?${qs}&limit=50`, { headers: hdr }),
      fetch(`${API_BASE}/v1/audit/list?${qs}&limit=50`, { headers: hdr }),
    ]);

    const iJson = await iRes.json().catch(() => ({}));
    const aJson = await aRes.json().catch(() => null);
    const jJson = await jRes.json().catch(() => ({ ok: false, rows: [] }));
    const auJson = await auRes.json().catch(() => ({ ok: false, rows: [] }));

    // /summary returns { ok, providers, integrations:[...] }
    const integrationRows = Array.isArray(iJson) ? iJson : (iJson?.integrations ?? []);
    setIntegrations(integrationRows);
    setAccounting(aJson);
    setJobs(((jJson?.items ?? jJson?.rows ?? jJson) ?? []) as any[]);
    setAuditRows(((auJson?.items ?? auJson?.rows) ?? []) as any[]);
    if (jJson?.warning || auJson?.warning) setWarning(String(jJson?.warning || auJson?.warning));
  } catch (e: any) {
    setWarning(e?.message || "refresh_failed");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  void refreshAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function connect(provider: "google" | "meta" | "x") {
  const qs = new URLSearchParams({ org_id, user_id }).toString();
  // open provider oauth start in a new tab (backend redirects to provider consent)
  window.open(`${API_BASE}/v1/oauth/${provider}/start?${qs}`, "_blank", "noopener,noreferrer");
}

async function disconnect(provider: "google" | "meta" | "x") {
  const tid = activeTenantId ?? org_id;
  const hdr = tid ? { "x-tenant-id": tid } : {};
  const qs = new URLSearchParams({ org_id, user_id, tenantId: tid }).toString();
  await fetch(`${API_BASE}/v1/integrations/${provider}/disconnect?${qs}`, { method: "POST", headers: hdr }).catch(() => null);
  await fetch(`${API_BASE}/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...hdr },
    body: JSON.stringify({ actor_type: "user", action: `integrations.${provider}.disconnect`, status: "success" })
  }).catch(() => null);
  await refreshAll();
}

  async function createBusiness(payload: {
    name: string;
    description?: string;
    color?: string;
  }) {
    const res = await fetch(`${API_BASE}/v1/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    // If tenant already exists, treat as non-fatal (UI should still show it after refresh)
    if (res.status === 409) {
      return null;
    }

    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || json?.message || "Create business failed");
    }

    return json.tenant ?? null;
  }


async function queueJob(type: "analytics.refresh" | "integrations.discovery") {
  const tid = activeTenantId ?? org_id;
  const hdr = tid ? { "x-tenant-id": tid } : {};
  const payload = { requested_from: "business_manager" };
  const res = await fetch(`${API_BASE}/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...hdr },
    body: JSON.stringify({ org_id, user_id, type, payload })
  }).catch(() => null);

  const ok = !!res && res.ok;
  await fetch(`${API_BASE}/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...hdr },
    body: JSON.stringify({ actor_type: "user", action: `jobs.create.${type}`, status: ok ? "success" : "failure" })
  }).catch(() => null);

  await refreshAll();
}
  const [newAssetForm, setNewAssetForm] = useState({
    type: 'domain' as 'domain' | 'social' | 'store' | 'email' | 'app',
    name: '',
    url: '',
    platform: '',
    costMonthlyUsd: '',
    costVendor: '',
    costCadence: 'monthly',
    costCategory: 'hosting',
  });

  // Business Manager "Suite" (formerly Premium Hub)
  const [suiteView, setSuiteView] = useState<
    | 'hub'
    | 'video-conferencing'
    | 'communication'
    | 'team-collaboration'
    | 'business-intelligence'
    | 'spreadsheet-analysis'
    | 'calendar-scheduling'
    | 'financial-management'
    | 'smart-automation'
    | 'email-client'
  >('hub');

  const [assetSubView, setAssetSubView] = useState<"assets" | "accounting" | "integrations" | "jobs" | "audit">("assets");

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerMonthDebitCents, setLedgerMonthDebitCents] = useState<number>(0);

  async function loadLedgerForTenant(tenantId: string) {
    if (!tenantId) return;
    setLedgerLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/ledger/entries?tenantId=${encodeURIComponent(tenantId)}&limit=100`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.message || "Failed to load ledger");
      }
      setLedgerEntries(Array.isArray(json?.entries) ? json.entries : []);
      setLedgerMonthDebitCents(Number(json?.monthDebitCents ?? 0));
    } finally {
      setLedgerLoading(false);
    }
  }


  // Tenants (Businesses) are the source-of-truth for "Total businesses"
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // Assets are stored per-tenant in memory (loaded on selection)
  const [assetsByTenant, setAssetsByTenant] = useState<Record<string, Asset[]>>({});
  const [assetsLoading, setAssetsLoading] = useState(false);

  async function loadAssetsForTenant(tenantId: string) {
    if (!tenantId) return;
    setAssetsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/assets?tenantId=${encodeURIComponent(tenantId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.message || "Failed to load assets");
      }
      const assets = Array.isArray(json?.assets) ? json.assets : [];
      setAssetsByTenant((prev) => ({ ...prev, [tenantId]: assets }));
    } finally {
      setAssetsLoading(false);
    }
  }

  async function createAsset(payload: { tenantId: string; type: string; name: string; url: string; platform?: string; [key: string]: any }) {
    const res = await fetch(`${API_BASE}/v1/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": payload.tenantId },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || json?.message || "Create asset failed");
    }
    return json.asset as Asset;
  }

  async function updateAsset(assetId: string, payload: { type?: string; name?: string; url?: string; platform?: string | null; [key: string]: any }, tenantId?: string) {
    const res = await fetch(`${API_BASE}/v1/assets/${encodeURIComponent(assetId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(tenantId ? { "x-tenant-id": tenantId } : {}) },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || json?.message || "Update asset failed");
    }
    return json.asset as Asset;
  }

    function openEditAsset(asset: Asset) {
    setEditingAsset(asset);
    const monthlyCentsRaw = (asset.metrics as any)?.cost?.monthlyCents;
    const monthlyCentsNum =
      typeof monthlyCentsRaw === "string" ? Number(monthlyCentsRaw) :
      typeof monthlyCentsRaw === "number" ? monthlyCentsRaw :
      null;

    setEditAssetForm({
      type: asset.type ?? 'domain',
      name: asset.name ?? '',
      url: asset.url ?? '',
      platform: (asset.platform ?? '') as any,
      costMonthlyUsd: monthlyCentsNum != null && Number.isFinite(monthlyCentsNum) ? (monthlyCentsNum / 100).toFixed(2).replace(/\.00$/, "") : '',
      costVendor: ((asset.metrics as any)?.cost?.vendor ?? '') as any,
      costCadence: (((asset.metrics as any)?.cost?.cadence ?? 'monthly')) as any,
      costCategory: (((asset.metrics as any)?.cost?.category ?? 'hosting')) as any,
    });
    setShowEditAsset(true);
  }

  async function deleteAsset(assetId: string, tenantId: string) {
    await fetch(`${API_BASE}/v1/assets/${encodeURIComponent(assetId)}`, { method: "DELETE", headers: { "x-tenant-id": tenantId } }).catch(() => null);
    // refresh selected tenant assets
    await loadAssetsForTenant(tenantId).catch(() => null);
  }


  async function loadTenants() {
    setTenantsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/tenants`, { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.message || "Failed to load businesses");
      }
      setTenants(Array.isArray(json?.tenants) ? json.tenants : []);
    } finally {
      setTenantsLoading(false);
    }
  }


  const businesses: Business[] = useMemo(() => {
    return (tenants ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      description: "",
      color: "from-cyan-500 to-blue-500",
      assets: (assetsByTenant[t.id] ?? []) as any,
      createdAt: String((t as any).created_at ?? (t as any).createdAt ?? ""),
      totalValue: "$0",
      status: "active",
    }));
  }, [tenants, assetsByTenant]);

  const selectedBusinessData = selectedBusiness 
    ? businesses.find(b => b.id === selectedBusiness)
    : null;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return Facebook;
      case 'Instagram': return Instagram;
      case 'Twitter': return Twitter;
      case 'YouTube': return Youtube;
      default: return Globe;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'domain': return Globe;
      case 'social': return Users;
      case 'store': return Store;
      case 'email': return MessageSquare;
      case 'app': return Zap;
      default: return Link;
    }
  };

  const assetStats = {
    totalBusinesses: businesses.length,
    totalAssets: businesses.reduce((acc, b) => acc + b.assets.length, 0),
    totalValue: '$0',
    activeAssets: businesses.reduce((acc, b) => acc + b.assets.filter(a => a.status === 'active').length, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Business Manager</h2>
            </div>
            <p className="text-slate-400">
              Human operations hub - Manage assets, intelligence, security & media
            </p>
          </div>

          {/* Tenant ID quick-set widget */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setTenantInputValue(activeTenantId ?? "");
                setShowTenantWidget(v => !v);
                setTimeout(() => tenantInputRef.current?.focus(), 80);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                activeTenantId
                  ? "bg-cyan-900/30 border-cyan-500/40 text-cyan-300 hover:border-cyan-400"
                  : "bg-amber-900/30 border-amber-500/40 text-amber-300 hover:border-amber-400 animate-pulse"
              }`}
              title="Set active tenant ID"
            >
              <Key className="w-3 h-3" />
              {activeTenantId
                ? `${activeTenantId.slice(0, 8)}…`
                : "No Tenant Set"}
            </button>

            {showTenantWidget && (
              <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border border-cyan-500/30 bg-slate-900 shadow-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Active Tenant ID</span>
                  <button onClick={() => setShowTenantWidget(false)} className="text-slate-500 hover:text-white">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  ref={tenantInputRef}
                  type="text"
                  value={tenantInputValue}
                  onChange={e => setTenantInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && tenantInputValue.trim()) {
                      const tid = tenantInputValue.trim();
                      setActiveTenantId(tid);
                      selectBusiness(tid);
                      setShowTenantWidget(false);
                    }
                    if (e.key === "Escape") setShowTenantWidget(false);
                  }}
                  placeholder="Paste tenant UUID here…"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                {activeTenantId && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                    <span className="text-slate-500 text-xs">Current:</span>
                    <span className="text-cyan-300 font-mono text-xs flex-1 truncate">{activeTenantId}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(activeTenantId); }}
                      className="text-slate-400 hover:text-cyan-400"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const tid = tenantInputValue.trim();
                      if (!tid) return;
                      setActiveTenantId(tid);
                      selectBusiness(tid);
                      setShowTenantWidget(false);
                    }}
                    disabled={!tenantInputValue.trim()}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                  {activeTenantId && (
                    <button
                      onClick={() => {
                        setActiveTenantId(null);
                        setSelectedBusiness(null);
                        setTenantInputValue("");
                        setShowTenantWidget(false);
                      }}
                      className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <p className="text-slate-500 text-xs">
                  Tenant IDs are UUIDs. Find yours in the Businesses list below or in Supabase → tenants table.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20 flex-wrap">
          <TabsTrigger value="assets" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Briefcase className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="text-slate-300 data-[state=active]:text-cyan-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Intelligence
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-slate-300 data-[state=active]:text-cyan-400">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Decisions
          </TabsTrigger>
          <TabsTrigger value="budgets" className="text-slate-300 data-[state=active]:text-cyan-400">
            <DollarSign className="w-4 h-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="blog" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Newspaper className="w-4 h-4 mr-2" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-slate-300 data-[state=active]:text-cyan-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="media" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Film className="w-4 h-4 mr-2" />
            Media
          </TabsTrigger>
          <TabsTrigger value="security" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="suite" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Zap className="w-4 h-4 mr-2" />
            Suite
          </TabsTrigger>
        </TabsList>

        {/* Business Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Asset Portfolio</h3>
              <p className="text-sm text-slate-400">Track domains, social accounts, stores, and more</p>

<div className="mt-3 flex flex-wrap items-center gap-2">
  <button
    onClick={refreshAll}
    className="px-3 py-1.5 rounded-lg text-sm bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
    title="Refresh Business Manager data"
  >
    {loading ? "Refreshing…" : "Refresh"}
  </button>

  <button
    onClick={() => queueJob("integrations.discovery")}
    className="px-3 py-1.5 rounded-lg text-sm bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
    title="Queue an integration discovery job"
  >
    Discover Integrations
  </button>

  <button
    onClick={() => queueJob("analytics.refresh")}
    className="px-3 py-1.5 rounded-lg text-sm bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
    title="Queue an analytics refresh job"
  >
    Refresh Analytics
  </button>

  {warning ? (
    <span className="text-xs text-yellow-300/90">⚠ {warning}</span>
  ) : null}
</div>

            </div>
            <button
              onClick={() => setShowAddBusiness(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Business
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
              <Briefcase className="w-8 h-8 text-cyan-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{assetStats.totalBusinesses}</div>
              <div className="text-sm text-slate-400">Total businesses</div>
            </div>
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
              <Database className="w-8 h-8 text-purple-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{assetStats.totalAssets}</div>
              <div className="text-sm text-slate-400">Total assets</div>
            </div>
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
              <DollarSign className="w-8 h-8 text-green-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{assetStats.totalValue}</div>
              <div className="text-sm text-slate-400">Portfolio value</div>
            </div>
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
              <Activity className="w-8 h-8 text-blue-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{assetStats.activeAssets}</div>
              <div className="text-sm text-slate-400">Active assets</div>
            </div>
          </div>

          {businesses.length === 0 ? (
            // Empty State
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-12">
              <div className="text-center max-w-md mx-auto">
                <Briefcase className="w-20 h-20 text-cyan-400/30 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">No Business Assets Yet</h3>
                <p className="text-slate-400 mb-6">
                  Start organizing your digital empire by adding your first business. Track domains, social accounts, stores, and more all in one place.
                </p>
                <button
                  onClick={() => setShowAddBusiness(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white font-medium transition-colors mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Business
                </button>
              </div>
            </div>
          ) : (
            // Business List
            <div className="grid md:grid-cols-3 gap-6">
              {/* Business List Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Your Businesses</h3>
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    onClick={() => selectBusiness(business.id)}
                    className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedBusiness === business.id
                        ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'border-cyan-500/20 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${business.color} rounded-lg flex items-center justify-center`}>
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold">{business.name}</h4>
                        <p className="text-xs text-slate-400">{business.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-mono text-slate-500 truncate">{business.id.slice(0, 8)}…</span>
                          <button
                            onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(business.id); }}
                            className="text-slate-600 hover:text-cyan-400 flex-shrink-0"
                            title="Copy tenant ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{business.assets.length} assets</span>
                      <span className="text-green-400">{business.totalValue}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Asset Details Column */}
              <div className="md:col-span-2">
                {selectedBusinessData ? (
                  <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{selectedBusinessData.name}</h3>
                        <p className="text-sm text-slate-400">{selectedBusinessData.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <RouterLink
                          to="/app/decisions"
                          className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Decisions
                        </RouterLink>
                        <RouterLink
                          to="/app/watcher"
                          className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm font-medium transition-colors"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Watch Live
                        </RouterLink>
                      </div>
                      <button
                        onClick={() => setShowAddAsset(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Asset
                      </button>
                    </div>

                    {/* Sub-view navigation */}
                    <div className="flex items-center gap-1 mb-4 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      {([
                        { key: "assets", label: "Assets", icon: Database },
                        { key: "accounting", label: "Ledger", icon: DollarSign },
                        { key: "integrations", label: "Integrations", icon: Zap },
                        { key: "jobs", label: "Jobs", icon: Activity },
                        { key: "audit", label: "Audit Log", icon: Shield },
                      ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setAssetSubView(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            assetSubView === key
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>

{/* ---- Assets sub-view ---- */}
{assetSubView === "assets" && (
                      <div className="space-y-3">
                      {selectedBusinessData.assets.map((asset) => {
                        const AssetIcon = getAssetIcon(asset.type);
                        const PlatformIcon = asset.platform ? getPlatformIcon(asset.platform) : AssetIcon;

                        return (
                          <div
                            key={asset.id}
                            className="bg-slate-800/50 border border-cyan-500/10 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <PlatformIcon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-medium mb-1">{asset.name}</h4>
                                  <a
                                    href={asset.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-2"
                                  >
                                    {asset.url}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  {asset.metrics && (
                                    <div className="flex gap-4 mt-2">
                                      {asset.metrics.followers && (
                                        <div className="text-xs">
                                          <span className="text-slate-500">Followers: </span>
                                          <span className="text-white font-medium">{asset.metrics.followers.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {asset.metrics.revenue && (
                                        <div className="text-xs">
                                          <span className="text-slate-500">Revenue: </span>
                                          <span className="text-green-400 font-medium">{asset.metrics.revenue}</span>
                                        </div>
                                      )}
                                      {asset.metrics.traffic && (
                                        <div className="text-xs">
                                          <span className="text-slate-500">Traffic: </span>
                                          <span className="text-blue-400 font-medium">{asset.metrics.traffic}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => openEditAsset(asset)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4 text-slate-400" />
                                </button>
                                <button onClick={() => deleteAsset(asset.id, selectedBusinessData.id)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {selectedBusinessData.assets.length === 0 && (
                        <div className="text-sm text-slate-400 py-6 text-center">No assets yet. Click "Add Asset" to get started.</div>
                      )}
                    </div>
)}

{/* ---- Ledger / Accounting sub-view ---- */}
{assetSubView === "accounting" && (
                      <div className="space-y-4">
                        {accounting?.summary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400">Revenue (credits)</div>
                              <div className="text-lg font-bold text-green-400">${(Number(accounting.summary.revenue ?? 0) / 100).toFixed(2)}</div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400">Expenses (debits)</div>
                              <div className="text-lg font-bold text-red-400">${(Number(accounting.summary.expenses ?? 0) / 100).toFixed(2)}</div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400">Net</div>
                              <div className="text-lg font-bold text-white">${(Number(accounting.summary.net ?? 0) / 100).toFixed(2)}</div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400">Pending approvals</div>
                              <div className="text-lg font-bold text-amber-400">{accounting.summary.approvalsPending ?? 0}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-400">Month debits</div>
                            <div className="text-xl font-bold text-white">${(ledgerMonthDebitCents / 100).toFixed(2)}</div>
                          </div>
                          <button
                            onClick={() => selectedBusinessData?.id && loadLedgerForTenant(selectedBusinessData.id)}
                            className="px-3 py-2 rounded-lg text-sm bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
                          >
                            {ledgerLoading ? "Refreshing…" : "Refresh ledger"}
                          </button>
                        </div>

                        <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400">
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-4">Description</div>
                            <div className="col-span-2 text-right">Amount</div>
                          </div>

                          {ledgerLoading ? (
                            <div className="p-4 text-slate-400">Loading…</div>
                          ) : ledgerEntries.length === 0 ? (
                            <div className="p-4 text-slate-400">No ledger entries yet.</div>
                          ) : (
                            ledgerEntries.map((e) => {
                              const cents = Number(e.amountCents ?? 0);
                              return (
                                <div key={e.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700/50 text-sm text-white">
                                  <div className="col-span-2 text-slate-300">{new Date(e.occurredAt).toLocaleDateString()}</div>
                                  <div className="col-span-2">{e.entryType}</div>
                                  <div className="col-span-2 text-slate-300">{e.category}</div>
                                  <div className="col-span-4 text-slate-200 truncate" title={e.description}>{e.description}</div>
                                  <div className="col-span-2 text-right font-mono">
                                    {(e.entryType === "debit" ? "-" : "+")}${(cents / 100).toFixed(2)}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
)}

{/* ---- Integrations sub-view ---- */}
{assetSubView === "integrations" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-slate-400">{integrations.length} provider{integrations.length !== 1 ? "s" : ""}</div>
                          <button
                            onClick={refreshAll}
                            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
                          >
                            {loading ? "Refreshing…" : "Refresh"}
                          </button>
                        </div>

                        {integrations.length === 0 ? (
                          <div className="text-sm text-slate-400 py-6 text-center">
                            No integrations connected. Use Settings → Integrations to connect providers.
                          </div>
                        ) : (
                          integrations.map((ig, i) => (
                            <div key={ig.provider ?? i} className="bg-slate-800/50 border border-cyan-500/10 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                                  <Zap className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                  <div className="text-white font-medium capitalize">{ig.provider}</div>
                                  <div className={`text-xs ${ig.connected ? "text-green-400" : "text-slate-500"}`}>
                                    {ig.connected ? "Connected" : "Disconnected"}
                                  </div>
                                </div>
                              </div>
                              {ig.connected ? (
                                <button
                                  onClick={() => disconnect(ig.provider as any)}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                                >
                                  Disconnect
                                </button>
                              ) : (
                                <button
                                  onClick={() => connect(ig.provider as any)}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30"
                                >
                                  Connect
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
)}

{/* ---- Jobs sub-view ---- */}
{assetSubView === "jobs" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-slate-400">{jobs.length} job{jobs.length !== 1 ? "s" : ""}</div>
                          <button
                            onClick={refreshAll}
                            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
                          >
                            {loading ? "Refreshing…" : "Refresh"}
                          </button>
                        </div>

                        {jobs.length === 0 ? (
                          <div className="text-sm text-slate-400 py-6 text-center">No jobs found for this tenant.</div>
                        ) : (
                          <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400">
                              <div className="col-span-3">Type</div>
                              <div className="col-span-2">Status</div>
                              <div className="col-span-3">Created</div>
                              <div className="col-span-4">ID</div>
                            </div>
                            {jobs.slice(0, 50).map((j: any) => (
                              <div key={j.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700/50 text-sm">
                                <div className="col-span-3 text-white truncate" title={j.type ?? j.jobType}>{j.type ?? j.jobType ?? "—"}</div>
                                <div className="col-span-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    j.status === "completed" ? "bg-green-500/20 text-green-300" :
                                    j.status === "running" ? "bg-blue-500/20 text-blue-300" :
                                    j.status === "failed" ? "bg-red-500/20 text-red-300" :
                                    "bg-slate-700/50 text-slate-300"
                                  }`}>
                                    {j.status}
                                  </span>
                                </div>
                                <div className="col-span-3 text-slate-300 text-xs">{j.createdAt ? new Date(j.createdAt).toLocaleString() : "—"}</div>
                                <div className="col-span-4 text-slate-500 font-mono text-xs truncate" title={j.id}>{j.id}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
)}

{/* ---- Audit Log sub-view ---- */}
{assetSubView === "audit" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-slate-400">{auditRows.length} entries (latest 50)</div>
                          <button
                            onClick={refreshAll}
                            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-cyan-500/20 text-slate-200 hover:bg-slate-900"
                          >
                            {loading ? "Refreshing…" : "Refresh"}
                          </button>
                        </div>

                        {auditRows.length === 0 ? (
                          <div className="text-sm text-slate-400 py-6 text-center">No audit entries found for this tenant.</div>
                        ) : (
                          <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400">
                              <div className="col-span-3">Action</div>
                              <div className="col-span-2">Level</div>
                              <div className="col-span-2">Entity</div>
                              <div className="col-span-3">Message</div>
                              <div className="col-span-2">Time</div>
                            </div>
                            {auditRows.slice(0, 50).map((a: any, i: number) => (
                              <div key={a.id ?? i} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700/50 text-sm">
                                <div className="col-span-3 text-white truncate" title={a.action}>{a.action ?? "—"}</div>
                                <div className="col-span-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    a.level === "error" ? "bg-red-500/20 text-red-300" :
                                    a.level === "warn" ? "bg-amber-500/20 text-amber-300" :
                                    "bg-slate-700/50 text-slate-300"
                                  }`}>
                                    {a.level ?? "info"}
                                  </span>
                                </div>
                                <div className="col-span-2 text-slate-300 text-xs truncate" title={a.entityType}>{a.entityType ?? "—"}</div>
                                <div className="col-span-3 text-slate-200 text-xs truncate" title={a.message}>{a.message ?? "—"}</div>
                                <div className="col-span-2 text-slate-500 text-xs">{a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
)}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-12">
                    <div className="text-center text-slate-400">
                      <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Select a business to view its assets</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Business Modal */}
          {showAddBusiness && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Add New Business</h3>
                  </div>
                  <button 
                    onClick={() => { setShowAddBusiness(false); setShowColorPicker(false); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Acme Corporation"
                      value={newBusinessForm.name}
                      onChange={(e) => setNewBusinessForm({ ...newBusinessForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <textarea
                      placeholder="Brief description of your business..."
                      value={newBusinessForm.description}
                      onChange={(e) => setNewBusinessForm({ ...newBusinessForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-none"
                    />
                  </div>

                  {/* Color Theme */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Color Theme</label>

                    {/* Preview + picker */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker((v) => !v)}
                        className={`w-40 h-14 rounded-xl border transition-all ${
                          showColorPicker
                            ? 'border-cyan-500/60 ring-2 ring-cyan-500/20'
                            : 'border-slate-700 hover:border-slate-500'
                        } bg-gradient-to-br ${newBusinessForm.color}`}
                        aria-label="Choose color theme"
                        title="Choose color theme"
                      />
                      <div className="text-xs text-slate-400">
                        {newBusinessForm.color.replace('from-', '').replace(' to-', ' → ')}
                      </div>
                    </div>

                    {showColorPicker && (
                      <div className="mt-3 grid grid-cols-8 gap-2">
                        {[
                          { name: 'Cyan-Blue', value: 'from-cyan-500 to-blue-500' },
                          { name: 'Purple-Pink', value: 'from-purple-500 to-pink-500' },
                          { name: 'Green-Teal', value: 'from-green-500 to-teal-500' },
                          { name: 'Orange-Red', value: 'from-orange-500 to-red-500' },
                          { name: 'Indigo-Purple', value: 'from-indigo-500 to-purple-500' },
                          { name: 'Slate', value: 'from-slate-700 to-slate-900' },
                          { name: 'Amber', value: 'from-amber-500 to-orange-500' },
                          { name: 'Rose', value: 'from-rose-500 to-pink-500' },
                        ].map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setNewBusinessForm({ ...newBusinessForm, color: t.value });
                              setShowColorPicker(false);
                            }}
                            className={`w-8 h-8 rounded-lg border transition-all bg-gradient-to-br ${t.value} ${
                              newBusinessForm.color === t.value
                                ? 'border-white/80 ring-2 ring-white/10'
                                : 'border-slate-700 hover:border-slate-500'
                            }`}
                            title={t.name}
                            aria-label={t.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBusiness(false);
                        setShowColorPicker(false);
                      }}
                      className="px-10 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-medium transition-colors min-w-[220px]"
                    >
                      Cancel
                    </button>

                   <button
                    type="button"
                    onClick={async () => {
                    if (!newBusinessForm.name.trim()) return;

                    try {

      await createBusiness({
        name: newBusinessForm.name.trim(),
        description: newBusinessForm.description?.trim() || undefined,
        color: newBusinessForm.color,
      });

      await loadTenants();
      await refreshAll();

      setShowAddBusiness(false);
      setShowColorPicker(false);
      setNewBusinessForm({ name: "", description: "", color: "from-cyan-500 to-blue-500" });
    } catch (err) {
      setWarning(err instanceof Error ? err.message : String(err));
    }
  }}
  disabled={!newBusinessForm.name.trim()}
  className={`px-10 py-4 rounded-xl font-medium transition-all min-w-[220px] ${
    newBusinessForm.name.trim()
      ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
      : "bg-transparent text-slate-500 cursor-not-allowed"
  }`}
>
  Create Business
</button>
 
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Business Intelligence Tab */}
        <TabsContent value="intelligence">
          <BusinessIntelligence />
        </TabsContent>

        {/* Media Processing Tab */}
        <TabsContent value="media">
          <MediaProcessing />
        </TabsContent>

        {/* Security & Compliance Tab */}
        <TabsContent value="security">
          <SecurityCompliance />
        </TabsContent>

        {/* Decisions Tab (consolidated from /app/decisions) */}
        <TabsContent value="decisions">
          <DecisionsInbox />
        </TabsContent>

        {/* Budgets Tab (consolidated from /app/budgets) */}
        <TabsContent value="budgets">
          <BudgetTracker />
        </TabsContent>

        {/* Tickets Tab (consolidated from /app/tickets) */}
        <TabsContent value="tickets">
          <TicketsView />
        </TabsContent>

        {/* Blog Studio Tab (consolidated from /app/blog) */}
        <TabsContent value="blog">
          <BlogManager />
        </TabsContent>

        {/* Operations Suite Tab (relocated from Premium Hub) */}
        <TabsContent value="suite" className="space-y-6">
          {suiteView !== 'hub' && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Operations Suite</h3>
                <p className="text-sm text-slate-400">Tools that plug into day-to-day business operations</p>
              </div>
              <button
                onClick={() => setSuiteView('hub')}
                className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900 text-cyan-300 transition-colors"
              >
                ← Back to Suite
              </button>
            </div>
          )}

          {suiteView === 'video-conferencing' && (isPro ? <VideoConferencing /> : <UpgradeGate feature="Video Conferencing" />)}
          {suiteView === 'communication' && (isPro ? <CommunicationSuite /> : <UpgradeGate feature="Communication Suite" />)}
          {suiteView === 'team-collaboration' && (isPro ? <TeamCollaboration /> : <UpgradeGate feature="Team Collaboration" />)}
          {suiteView === 'business-intelligence' && (isPro ? <BusinessIntelligence /> : <UpgradeGate feature="Business Intelligence" />)}
          {suiteView === 'spreadsheet-analysis' && (isPro ? <SpreadsheetAnalysis /> : <UpgradeGate feature="Spreadsheet Analysis" />)}
          {suiteView === 'calendar-scheduling' && (isPro ? <CalendarScheduling /> : <UpgradeGate feature="Calendar & Scheduling" />)}
          {suiteView === 'financial-management' && (isPro ? <FinancialManagement /> : <UpgradeGate feature="Financial Management" />)}
          {suiteView === 'smart-automation' && (isPro ? <SmartAutomation /> : <UpgradeGate feature="Smart Automation" />)}
          {suiteView === 'email-client' && (isPro ? <EmailClient /> : <UpgradeGate feature="Email Client" />)}

          {suiteView === 'hub' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Operations Suite</h3>
                <p className="text-sm text-slate-400">
                  Formerly the Premium Hub — moved here so everything lives under Business Management.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => setSuiteView('video-conferencing')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Video Conferencing</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Zoom / Teams / Webex + join, transcribe, summarize.</div>
                </button>

                <button
                  onClick={() => setSuiteView('communication')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Communication Suite</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Unified messaging, channels, and outbound comms.</div>
                </button>

                <button
                  onClick={() => setSuiteView('team-collaboration')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Team Collaboration</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Roles, channels, shared context, and collaboration tools.</div>
                </button>

                <button
                  onClick={() => setSuiteView('business-intelligence')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Business Intelligence</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Dashboards, KPIs, and operational insights.</div>
                </button>

                <button
                  onClick={() => setSuiteView('spreadsheet-analysis')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Spreadsheet Analysis</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Upload, inspect, summarize, and extract meaning.</div>
                </button>

                <button
                  onClick={() => setSuiteView('calendar-scheduling')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Calendar Scheduling</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Scheduling, reminders, and coordination across teams.</div>
                </button>

                <button
                  onClick={() => setSuiteView('financial-management')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Financial Management</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Spend/income analysis, accounting hooks, and reporting.</div>
                </button>

                <button
                  onClick={() => setSuiteView('smart-automation')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Smart Automation</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Build automations that run reliably, with audit trail.</div>
                </button>

                <button
                  onClick={() => setSuiteView('email-client')}
                  className="text-left bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-cyan-400" />
                      <div className="text-white font-semibold">Email Client</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-sm text-slate-400">Configure, read, and triage business email.</div>
                </button>
              </div>
            </div>
          )}
        </TabsContent>

</Tabs>

          {/* Add Asset Modal */}
          {showAddAsset && selectedBusinessData && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Add New Asset</h3>
                      <p className="text-xs text-slate-400">Business: {selectedBusinessData.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddAsset(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Asset Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Asset Type</label>
                    <select
                      value={newAssetForm.type}
                      onChange={(e) =>
                        setNewAssetForm({ ...newAssetForm, type: e.target.value as any })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    >
                      <option value="domain">Domain / Website</option>
                      <option value="social">Social</option>
                      <option value="store">Store</option>
                      <option value="email">Email</option>
                      <option value="app">App</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="e.g., deadapp.pro"
                      value={newAssetForm.name}
                      onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newAssetForm.url}
                      onChange={(e) => setNewAssetForm({ ...newAssetForm, url: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Platform (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., instagram, facebook, shopify"
                      value={newAssetForm.platform}
                      onChange={(e) => setNewAssetForm({ ...newAssetForm, platform: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-400">
                      {assetsLoading ? "Saving/refreshing…" : "Assets will be scoped to this business."}
                    </div>

                  {/* Cost (optional) */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Cost (optional)</div>
                        <div className="text-xs text-slate-400">Attach recurring/one-time cost so Accounting can track it</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Amount (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 14.00"
                          value={newAssetForm.costMonthlyUsd}
                          onChange={(e) => setNewAssetForm({ ...newAssetForm, costMonthlyUsd: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        />
                        <div className="text-xs text-slate-500 mt-1">For monthly costs, enter monthly amount. For yearly, enter yearly amount.</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Vendor</label>
                        <input
                          type="text"
                          placeholder="e.g., Render, Vercel, AWS, Sprout, QuickBooks"
                          value={newAssetForm.costVendor}
                          onChange={(e) => setNewAssetForm({ ...newAssetForm, costVendor: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Cadence</label>
                        <select
                          value={newAssetForm.costCadence}
                          onChange={(e) => setNewAssetForm({ ...newAssetForm, costCadence: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="one_time">One-time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Category</label>
                        <select
                          value={newAssetForm.costCategory}
                          onChange={(e) => setNewAssetForm({ ...newAssetForm, costCategory: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        >
                          <option value="hosting">Hosting</option>
                          <option value="saas">SaaS</option>
                          <option value="domain">Domain/DNS</option>
                          <option value="email">Email</option>
                          <option value="social">Social</option>
                          <option value="infra">Infra</option>
                          <option value="ads">Ads</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowAddAsset(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (!selectedBusinessData?.id) return;
                            await createAsset({
                              tenantId: selectedBusinessData.id,
                              type: newAssetForm.type,
                              name: newAssetForm.name,
                              url: newAssetForm.url,
                              platform: newAssetForm.platform || undefined,
                              costMonthlyCents: newAssetForm.costMonthlyUsd && String(newAssetForm.costMonthlyUsd).trim().length ? Math.round(Number(newAssetForm.costMonthlyUsd) * 100) : undefined,
                              costVendor: newAssetForm.costVendor || undefined,
                              costCadence: newAssetForm.costCadence || undefined,
                              costCategory: newAssetForm.costCategory || undefined,
                            });
                            await loadAssetsForTenant(selectedBusinessData.id);
                            setNewAssetForm({ type: "domain", name: "", url: "", platform: "", costMonthlyUsd: "", costVendor: "", costCadence: "monthly", costCategory: "hosting" }); // reset all fields
                            setShowAddAsset(false);
                          } catch (err) {
                            setWarning(err instanceof Error ? err.message : String(err));
                          }
                        }}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-slate-900 font-bold transition-colors"
                      >
                        Save Asset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Edit Asset Modal */}
          {showEditAsset && editingAsset && selectedBusinessData && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Edit Asset</h3>
                      <p className="text-xs text-slate-400">Business: {selectedBusinessData.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowEditAsset(false); setEditingAsset(null); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Asset Type</label>
                    <select
                      value={editAssetForm.type}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    >
                      <option value="domain">Domain / Website</option>
                      <option value="social">Social</option>
                      <option value="store">Store</option>
                      <option value="email">Email</option>
                      <option value="app">App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name</label>
                    <input
                      type="text"
                      value={editAssetForm.name}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">URL</label>
                    <input
                      type="text"
                      value={editAssetForm.url}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, url: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Platform (optional)</label>
                    <input
                      type="text"
                      value={editAssetForm.platform}
                      onChange={(e) => setEditAssetForm({ ...editAssetForm, platform: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-400">
                      {assetsLoading ? "Saving/refreshing…" : "Updates apply immediately."}
                    </div>

                  {/* Cost (optional) */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Cost (optional)</div>
                        <div className="text-xs text-slate-400">Attach recurring/one-time cost so Accounting can track it</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Amount (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 14.00"
                          value={editAssetForm.costMonthlyUsd}
                          onChange={(e) => setEditAssetForm({ ...editAssetForm, costMonthlyUsd: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        />
                        <div className="text-xs text-slate-500 mt-1">For monthly costs, enter monthly amount. For yearly, enter yearly amount.</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Vendor</label>
                        <input
                          type="text"
                          placeholder="e.g., Render, Vercel, AWS, Sprout, QuickBooks"
                          value={editAssetForm.costVendor}
                          onChange={(e) => setEditAssetForm({ ...editAssetForm, costVendor: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Cadence</label>
                        <select
                          value={editAssetForm.costCadence}
                          onChange={(e) => setEditAssetForm({ ...editAssetForm, costCadence: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="one_time">One-time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Category</label>
                        <select
                          value={editAssetForm.costCategory}
                          onChange={(e) => setEditAssetForm({ ...editAssetForm, costCategory: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                        >
                          <option value="hosting">Hosting</option>
                          <option value="saas">SaaS</option>
                          <option value="domain">Domain/DNS</option>
                          <option value="email">Email</option>
                          <option value="social">Social</option>
                          <option value="infra">Infra</option>
                          <option value="ads">Ads</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setShowEditAsset(false); setEditingAsset(null); }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (!editingAsset?.id) return;
                            await updateAsset(editingAsset.id, {
                              type: editAssetForm.type,
                              name: editAssetForm.name,
                              url: editAssetForm.url,
                              platform: editAssetForm.platform && String(editAssetForm.platform).trim().length ? editAssetForm.platform : undefined,
                              costMonthlyCents: editAssetForm.costMonthlyUsd && String(editAssetForm.costMonthlyUsd).trim().length ? Math.round(Number(editAssetForm.costMonthlyUsd) * 100) : undefined,
                              costVendor: editAssetForm.costVendor && String(editAssetForm.costVendor).trim().length ? editAssetForm.costVendor : undefined,
                              costCadence: editAssetForm.costCadence && String(editAssetForm.costCadence).trim().length ? editAssetForm.costCadence : undefined,
                              costCategory: editAssetForm.costCategory && String(editAssetForm.costCategory).trim().length ? editAssetForm.costCategory : undefined,
                            });
                            await loadAssetsForTenant(selectedBusinessData.id);
                            setShowEditAsset(false);
                            setEditingAsset(null);
                          } catch (err) {
                            setWarning(err instanceof Error ? err.message : String(err));
                          }
                        }}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-slate-900 font-bold transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

    </div>


  );
}
