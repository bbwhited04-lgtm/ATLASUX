import { useEffect, useMemo, useState } from 'react';
import { 
  Briefcase, Plus, Globe, Facebook, Instagram, Twitter,
  Youtube, TrendingUp, Users, DollarSign, Settings,
  Edit, Trash2, ExternalLink, Copy, CheckCircle,
  Store, MessageSquare, Mail, Calendar, Video, ArrowRight, Hash, Link, Zap,
  Cpu, Gauge, Activity, Database, FolderOpen, Shield, Film,
  BarChart3, Bell, AlertCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { API_BASE } from '@/lib/api';
import { getOrgUser } from '@/lib/org';
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
  };
}

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


export function BusinessManager() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newBusinessForm, setNewBusinessForm] = useState({
    name: '',
    description: '',
    color: 'from-cyan-500 to-blue-500',
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

// -------------------- Backend-backed dashboards (Neptune internals, surfaced as Atlas Core / Business Manager) --------------------
const { org_id, user_id } = useMemo(() => getOrgUser(), []);

  // Load tenants (businesses) once on mount
  useEffect(() => {
    loadTenants().catch((err) => {
      console.error("Failed to load tenants:", err);
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
    const qs = new URLSearchParams({ org_id, user_id }).toString();
    const [iRes, aRes, jRes, auRes] = await Promise.all([
      fetch(`${API_BASE}/v1/integrations/status?${qs}`),
      fetch(`${API_BASE}/v1/accounting/summary?${qs}`),
      fetch(`${API_BASE}/v1/jobs/list?${qs}&limit=50`),
      fetch(`${API_BASE}/v1/audit/list?${qs}&limit=50`)
    ]);

    const iJson = await iRes.json().catch(() => []);
    const aJson = await aRes.json().catch(() => null);
    const jJson = await jRes.json().catch(() => ({ ok: false, rows: [] }));
    const auJson = await auRes.json().catch(() => ({ ok: false, rows: [] }));

    setIntegrations(Array.isArray(iJson) ? iJson : []);
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

async function connect(provider: "google" | "meta") {
  const qs = new URLSearchParams({ org_id, user_id }).toString();
  // open provider oauth start in a new tab (backend redirects to provider consent)
  window.open(`${API_BASE}/v1/oauth/${provider}/start?${qs}`, "_blank", "noopener,noreferrer");
}

async function disconnect(provider: "google" | "meta") {
  const qs = new URLSearchParams({ org_id, user_id }).toString();
  await fetch(`${API_BASE}/v1/integrations/${provider}/disconnect?${qs}`, { method: "POST" }).catch(() => null);
  await fetch(`${API_BASE}/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const payload = { requested_from: "business_manager" };
  const res = await fetch(`${API_BASE}/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id, user_id, type, payload })
  }).catch(() => null);

  const ok = !!res && res.ok;
  await fetch(`${API_BASE}/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_type: "user", action: `jobs.create.${type}`, status: ok ? "success" : "failure" })
  }).catch(() => null);

  await refreshAll();
}
  const [newAssetForm, setNewAssetForm] = useState({
    type: 'domain' as 'domain' | 'social' | 'store' | 'email' | 'app',
    name: '',
    url: '',
    platform: '',
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

  // Tenants (Businesses) are the source-of-truth for "Total businesses"
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

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
      assets: [],
      createdAt: String((t as any).created_at ?? (t as any).createdAt ?? ""),
      totalValue: "$0",
      status: "active",
    }));
  }, [tenants]);

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
        </div>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="assets" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Briefcase className="w-4 h-4 mr-2" />
            Business Assets
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="text-slate-300 data-[state=active]:text-cyan-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Intelligence
          </TabsTrigger>
          <TabsTrigger value="media" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Film className="w-4 h-4 mr-2" />
            Media Processing
          </TabsTrigger>
          <TabsTrigger value="security" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Shield className="w-4 h-4 mr-2" />
            Security & Compliance
          </TabsTrigger>
          <TabsTrigger value="suite" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Zap className="w-4 h-4 mr-2" />
            Operations Suite
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
                    onClick={() => setSelectedBusiness(business.id)}
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
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{business.name}</h4>
                        <p className="text-xs text-slate-400">{business.description}</p>
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
                      <button
                        onClick={() => setShowAddAsset(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Asset
                      </button>
                    </div>

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
                                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4 text-slate-400" />
                                </button>
                                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                      console.log("Creating business:", newBusinessForm);

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
      console.error("Create business failed:", err);
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

          {suiteView === 'video-conferencing' && <VideoConferencing />}
          {suiteView === 'communication' && <CommunicationSuite />}
          {suiteView === 'team-collaboration' && <TeamCollaboration />}
          {suiteView === 'business-intelligence' && <BusinessIntelligence />}
          {suiteView === 'spreadsheet-analysis' && <SpreadsheetAnalysis />}
          {suiteView === 'calendar-scheduling' && <CalendarScheduling />}
          {suiteView === 'financial-management' && <FinancialManagement />}
          {suiteView === 'smart-automation' && <SmartAutomation />}
          {suiteView === 'email-client' && <EmailClient />}

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
    </div>
  );
}
