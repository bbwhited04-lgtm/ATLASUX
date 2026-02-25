import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  RefreshCw,
  Download,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Heart,
  TrendingUp,
  TrendingDown,
  Globe,
  Smartphone,
  CheckCircle,
  Loader2,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { API_BASE } from "@/lib/api";
import { getOrgUser } from "@/lib/org";
import { useActiveTenant } from "@/lib/activeTenant";

// ── Platform → OAuth provider mapping ────────────────────────────────────────

type OAuthProvider = "google" | "meta" | "x" | "tumblr" | "microsoft" | "linkedin" | "pinterest";

type PlatformDef = {
  name: string;
  /** Which OAuth provider token covers this platform (null = API key / settings) */
  oauthProvider: OAuthProvider | null;
  icon: "globe" | "chart" | "heart" | "phone" | "trending";
  color: string;
};

const PLATFORM_GROUPS: Array<{
  label: string;
  labelColor: string;
  platforms: PlatformDef[];
}> = [
  {
    label: "Web Analytics",
    labelColor: "text-cyan-400",
    platforms: [
      { name: "Google Analytics",  oauthProvider: "google",    icon: "globe",    color: "#4285F4" },
      { name: "Adobe Analytics",   oauthProvider: null,        icon: "globe",    color: "#FF0000" },
      { name: "Matomo",            oauthProvider: null,        icon: "globe",    color: "#3152A0" },
      { name: "Mixpanel",          oauthProvider: null,        icon: "globe",    color: "#7856FF" },
      { name: "Plausible",         oauthProvider: null,        icon: "globe",    color: "#5850EC" },
      { name: "Heap Analytics",    oauthProvider: null,        icon: "globe",    color: "#FF6B35" },
    ],
  },
  {
    label: "E-commerce Analytics",
    labelColor: "text-green-400",
    platforms: [
      { name: "Shopify Analytics",      oauthProvider: null, icon: "chart",    color: "#96BF48" },
      { name: "WooCommerce",            oauthProvider: null, icon: "chart",    color: "#7F54B3" },
      { name: "Amazon Seller Central",  oauthProvider: null, icon: "chart",    color: "#FF9900" },
      { name: "Etsy Stats",             oauthProvider: null, icon: "chart",    color: "#F56400" },
    ],
  },
  {
    label: "Marketing & Advertising",
    labelColor: "text-purple-400",
    platforms: [
      { name: "Google Ads",          oauthProvider: "google", icon: "trending", color: "#4285F4" },
      { name: "Facebook Ads Manager",oauthProvider: "meta",   icon: "trending", color: "#1877F2" },
      { name: "HubSpot Analytics",   oauthProvider: null,     icon: "trending", color: "#FF7A59" },
      { name: "Mailchimp Analytics", oauthProvider: null,     icon: "trending", color: "#FFE01B" },
      { name: "SEMrush",             oauthProvider: null,     icon: "trending", color: "#FF642D" },
    ],
  },
  {
    label: "Social Media Analytics",
    labelColor: "text-pink-400",
    platforms: [
      { name: "Facebook Insights",  oauthProvider: "meta",      icon: "heart", color: "#1877F2" },
      { name: "Instagram Insights", oauthProvider: "meta",      icon: "heart", color: "#E4405F" },
      { name: "Twitter Analytics",  oauthProvider: "x",         icon: "heart", color: "#1DA1F2" },
      { name: "LinkedIn Analytics", oauthProvider: "linkedin",  icon: "heart", color: "#0A66C2" },
      { name: "TikTok Analytics",   oauthProvider: null,        icon: "heart", color: "#FF0050" },
      { name: "YouTube Analytics",  oauthProvider: "google",    icon: "heart", color: "#FF0000" },
      { name: "Pinterest Analytics",oauthProvider: "pinterest", icon: "heart", color: "#E60023" },
      { name: "Tumblr Analytics",   oauthProvider: "tumblr",    icon: "heart", color: "#35465C" },
    ],
  },
  {
    label: "Payment & Financial",
    labelColor: "text-yellow-400",
    platforms: [
      { name: "Stripe Dashboard", oauthProvider: null, icon: "chart", color: "#635BFF" },
      { name: "PayPal Analytics", oauthProvider: null, icon: "chart", color: "#003087" },
      { name: "Square Analytics", oauthProvider: null, icon: "chart", color: "#3E4348" },
    ],
  },
  {
    label: "Mobile & App Analytics",
    labelColor: "text-blue-400",
    platforms: [
      { name: "Firebase Analytics", oauthProvider: "google", icon: "phone", color: "#FFCA28" },
      { name: "Amplitude",          oauthProvider: null,     icon: "phone", color: "#0065FF" },
      { name: "App Annie",          oauthProvider: null,     icon: "phone", color: "#1ABCFE" },
      { name: "Flurry Analytics",   oauthProvider: null,     icon: "phone", color: "#FF5E00" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Analytics() {
  const navigate = useNavigate();
  const { tenantId: activeTenantId } = useActiveTenant();
  const { org_id, user_id } = useMemo(() => getOrgUser(), []);

  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // Connected providers from integrations summary
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Analytics data from API
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const websiteData: any[] = analyticsData?.timeline ?? [];
  const socialData: any[]   = analyticsData?.timeline ?? [];
  const engagementData: any[] = [];
  const trafficSources: any[] = Object.entries(analyticsData?.byChannel ?? {}).map(([name, v]: any) => ({
    name, value: v.impressions ?? 0,
  }));
  const topPages: any[] = [];

  async function loadAnalytics() {
    const tid = activeTenantId ?? org_id;
    if (!tid) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/analytics/summary?range=${timeRange}`, {
        headers: { "x-tenant-id": tid },
      });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) setAnalyticsData(json);
    } catch {
      // non-fatal
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => { void loadAnalytics(); }, [activeTenantId, timeRange]);

  // Load integration status
  async function loadStatus() {
    setStatusLoading(true);
    try {
      const tid = activeTenantId ?? org_id;
      const qs = new URLSearchParams({ org_id, user_id, tenantId: tid }).toString();
      const res = await fetch(`${API_BASE}/v1/integrations/summary?${qs}`);
      const json = await res.json().catch(() => ({}));
      if (json?.providers) setConnectedProviders(json.providers);
    } catch {
      // non-fatal
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => { void loadStatus(); }, [activeTenantId]);

  // Count connected providers that analytics platforms use
  const connectedCount = useMemo(() => {
    const usedProviders = new Set<string>();
    PLATFORM_GROUPS.forEach(g => g.platforms.forEach(p => {
      if (p.oauthProvider) usedProviders.add(p.oauthProvider);
    }));
    return [...usedProviders].filter(p => connectedProviders[p]).length;
  }, [connectedProviders]);

  /**
   * Connect a platform:
   *  - If it has an OAuth provider we support → open OAuth start URL
   *  - Otherwise → navigate to settings/integrations with platform focus
   */
  async function handleConnect(platform: PlatformDef) {
    const tid = activeTenantId ?? org_id;

    if (platform.oauthProvider) {
      // Providers that have an OAuth start route
      const oauthProviders: OAuthProvider[] = ["google", "meta", "x", "tumblr", "microsoft"];
      if (oauthProviders.includes(platform.oauthProvider)) {
        setConnectingPlatform(platform.name);
        const qs = new URLSearchParams({ org_id, user_id, tenantId: tid }).toString();
        window.open(
          `${API_BASE}/v1/oauth/${platform.oauthProvider}/start?${qs}`,
          "_blank",
          "noopener,noreferrer,width=600,height=700"
        );
        // Refresh status after a short delay to catch immediate callbacks
        setTimeout(() => { void loadStatus(); setConnectingPlatform(null); }, 4000);
        return;
      }
    }

    // API-key or unsupported OAuth → route to settings integrations tab
    navigate(`/app/settings?tab=integrations&focus=${encodeURIComponent(platform.name)}`);
  }

  async function handleDisconnect(provider: OAuthProvider) {
    const tid = activeTenantId ?? org_id;
    const qs = new URLSearchParams({ org_id, user_id, tenantId: tid }).toString();
    await fetch(`${API_BASE}/v1/integrations/${provider}/disconnect?${qs}`, { method: "POST" }).catch(() => null);
    await loadStatus();
  }

  function isPlatformConnected(platform: PlatformDef): boolean {
    if (!platform.oauthProvider) return false;
    return !!connectedProviders[platform.oauthProvider];
  }

  // Icon renderer
  function PlatformIcon({ type, className }: { type: PlatformDef["icon"]; className?: string }) {
    switch (type) {
      case "globe":    return <Globe className={className} />;
      case "chart":    return <BarChart3 className={className} />;
      case "heart":    return <Heart className={className} />;
      case "phone":    return <Smartphone className={className} />;
      case "trending": return <TrendingUp className={className} />;
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Analytics Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Track website, social media, and business metrics
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex border border-cyan-500/20 rounded-lg overflow-hidden">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  timeRange === range
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" className="border-cyan-500/20" onClick={() => { void loadStatus(); void loadAnalytics(); }}>
            <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="outline" className="border-cyan-500/20">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { icon: Users,            color: "blue",   label: "Impressions",  value: analyticsData ? String(analyticsData.summary?.totalImpressions ?? 0) : "—" },
          { icon: Eye,              color: "purple", label: "Total Posts",   value: analyticsData ? String(analyticsData.summary?.totalPosts ?? 0) : "—" },
          { icon: MousePointerClick,color: "cyan",   label: "Click Rate",   value: analyticsData ? String(analyticsData.summary?.clickRate ?? "0%") : "—" },
          { icon: Clock,            color: "green",  label: "Conversions",  value: analyticsData ? String(analyticsData.summary?.totalConversions ?? 0) : "—" },
          { icon: Heart,            color: "pink",   label: "Total Spend",  value: analyticsData ? `$${analyticsData.summary?.totalSpendUsd ?? "0.00"}` : "—" },
        ].map(({ icon: Icon, color, label, value }) => (
          <Card key={label} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <Badge variant="outline" className="border-slate-500/40 text-slate-400 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                +0%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="website">Website Analytics</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Website Traffic</h3>
                <Badge variant="outline" className="border-cyan-500/20">Google Analytics</Badge>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={websiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Social Media Engagement</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="likes" fill="#ec4899" />
                  <Bar dataKey="comments" fill="#06b6d4" />
                  <Bar dataKey="shares" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Platform Performance</h3>
            <div className="space-y-3">
              {socialData.map((platform: any) => (
                <div key={platform.platform} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${platform.color}20` }}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: platform.color }} />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium text-sm">{platform.platform}</div>
                      <div className="text-xs text-slate-400">{platform.posts} posts</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{platform.followers.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Followers</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-400">{platform.engagement}%</div>
                      <div className="text-xs text-slate-400">Engagement</div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">View Details</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Website Analytics Tab */}
        <TabsContent value="website" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2 bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Sessions & Page Views</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={websiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Device Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: "Mobile",  pct: 58, color: "cyan",   icon: Smartphone },
                  { label: "Desktop", pct: 35, color: "purple", icon: Globe },
                  { label: "Tablet",  pct: 7,  color: "pink",   icon: Smartphone },
                ].map(({ label, pct, color, icon: Icon }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${color}-400`} />
                        <span>{label}</span>
                      </div>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-${color}-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Top Performing Pages</h3>
            <div className="space-y-2">
              {topPages.map((page: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="w-8 text-center">
                    <span className="text-2xl font-bold text-slate-600">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <div className="font-medium text-sm text-slate-200">{page.page}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{page.views.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Views</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{page.avgTime}</div>
                      <div className="text-xs text-slate-400">Avg. Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {socialData.map((platform: any) => (
              <Card key={platform.platform} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${platform.color}20` }}>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: platform.color }} />
                </div>
                <div className="font-medium mb-1">{platform.platform}</div>
                <div className="text-2xl font-bold mb-1">{platform.followers.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mb-3">Followers</div>
                <div className="text-sm text-green-400">+{platform.engagement}% engagement</div>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Engagement Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="likes" fill="#ec4899" />
                <Bar dataKey="comments" fill="#06b6d4" />
                <Bar dataKey="shares" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Traffic Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={trafficSources} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100} fill="#8884d8" dataKey="value">
                    {trafficSources.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={_entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Traffic Sources Breakdown</h3>
              <div className="space-y-4">
                {trafficSources.map((source: any) => (
                  <div key={source.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.name}</span>
                      <span className="font-medium">{source.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${source.value}%`, backgroundColor: source.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Analytics Integrations Panel ─────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-cyan-500/30 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="w-12 h-12 text-cyan-400 flex-shrink-0 mt-1" />
          <div className="flex-1">

            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Connect Analytics Platforms</h4>
                <Badge
                  variant="outline"
                  className={connectedCount > 0
                    ? "border-green-500/40 text-green-400 text-xs"
                    : "border-red-500/40 text-red-400 text-xs"}
                >
                  {statusLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : `${connectedCount} Connected`}
                </Badge>
                <button
                  onClick={() => void loadStatus()}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                  title="Refresh connection status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-5">
              Import data from multiple analytics platforms for a unified view across web, social,
              e-commerce, and more. Platforms with{" "}
              <span className="text-green-400 font-medium">OAuth</span> connect directly.
              Others route to API key setup in Settings.
            </p>

            {/* Platform groups */}
            <div className="space-y-5">
              {PLATFORM_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${group.labelColor}`}>
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.platforms.map((platform) => {
                      const connected = isPlatformConnected(platform);
                      const isConnecting = connectingPlatform === platform.name;
                      const hasOAuth = !!platform.oauthProvider &&
                        ["google", "meta", "x", "tumblr", "microsoft"].includes(platform.oauthProvider);

                      return connected ? (
                        // Connected state
                        <div
                          key={platform.name}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-green-300 font-medium">{platform.name}</span>
                          {platform.oauthProvider && (
                            <button
                              onClick={() => void handleDisconnect(platform.oauthProvider as OAuthProvider)}
                              className="ml-1 text-green-600 hover:text-red-400 transition-colors text-xs"
                              title="Disconnect"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        // Not connected state
                        <button
                          key={platform.name}
                          onClick={() => void handleConnect(platform)}
                          disabled={isConnecting}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                            hasOAuth
                              ? "border-cyan-500/30 bg-slate-800/60 text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                              : "border-slate-600/40 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                          } disabled:opacity-50`}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : hasOAuth ? (
                            <ExternalLink className="w-3 h-3" />
                          ) : (
                            <Settings className="w-3 h-3" />
                          )}
                          <span>{platform.name}</span>
                          {hasOAuth && (
                            <span className="text-cyan-600 font-mono text-[10px]">OAuth</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-cyan-500/20 flex items-start gap-2">
              <span className="text-xs text-slate-500">
                <strong className="text-slate-400">OAuth</strong> platforms open a secure login window and connect immediately.{" "}
                <strong className="text-slate-400">Settings</strong> platforms require an API key — click to configure in Integrations.
                Connections are per-tenant and stored in your token vault.
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
