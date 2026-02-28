import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useActiveTenant } from "@/lib/activeTenant";
import { API_BASE } from "@/lib/api";
import {
  Bell,
  Radio,
  Activity,
  BarChart3,
  MessageCircle,
  ExternalLink,
  Globe,
  RefreshCw,
  Trash2,
  Plus,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Mention = {
  id: string;
  channel: string;
  url: string | null;
  meta: any;
  occurredAt: string;
};

type Source = {
  id: string;
  name: string;
  url: string;
  platform: string;
  type: string;
  createdAt: string;
};

const hdrs = (tid: string) => ({ "x-tenant-id": tid, "Content-Type": "application/json" });

export function SocialMonitoring() {
  const { tenantId } = useActiveTenant();
  const [activeTab, setActiveTab] = useState("overview");
  const [isListening, setIsListening] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live data
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [mentionTotal, setMentionTotal] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);

  // Add source form
  const [newUrl, setNewUrl] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

  // Add keyword form
  const [newKeywords, setNewKeywords] = useState("");
  const [addingKeywords, setAddingKeywords] = useState(false);

  const stats = {
    alerts: 0,
    sentiment: mentionTotal > 0 ? "—" : "0%",
    mentions: mentionTotal,
    sources: sources.length,
  };

  // Fetch mentions from backend
  const fetchMentions = useCallback(async () => {
    if (!tenantId) return;
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/mentions?tenantId=${encodeURIComponent(tenantId)}&limit=50`,
        { headers: hdrs(tenantId) }
      );
      const j = await r.json();
      if (j.ok) {
        setMentions(j.mentions ?? []);
        setMentionTotal(j.total ?? 0);
      }
    } catch { /* silent */ }
  }, [tenantId]);

  // Fetch sources from backend
  const fetchSources = useCallback(async () => {
    if (!tenantId) return;
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/sources?tenantId=${encodeURIComponent(tenantId)}`,
        { headers: hdrs(tenantId) }
      );
      const j = await r.json();
      if (j.ok) setSources(j.sources ?? []);
    } catch { /* silent */ }
  }, [tenantId]);

  // Fetch listening status from backend
  const fetchStatus = useCallback(async () => {
    if (!tenantId) return;
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/status?tenantId=${encodeURIComponent(tenantId)}`,
        { headers: hdrs(tenantId) }
      );
      const j = await r.json();
      if (j.ok) setIsListening(j.active);
    } catch { /* silent */ }
  }, [tenantId]);

  // Load data on mount and when tenantId changes
  useEffect(() => {
    fetchMentions();
    fetchSources();
    fetchStatus();
  }, [fetchMentions, fetchSources, fetchStatus]);

  // Refresh all data
  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchMentions(), fetchSources(), fetchStatus()]);
    setLoading(false);
  };

  const toggleListening = async () => {
    if (!tenantId) {
      toast.error("Select a business in Business Manager first.");
      return;
    }
    try {
      if (isListening) {
        // Stop listening
        const r = await fetch(
          `${API_BASE}/v1/listening/stop?tenantId=${encodeURIComponent(tenantId)}`,
          { method: "POST", headers: hdrs(tenantId) }
        );
        const j = await r.json();
        if (j.ok) {
          setIsListening(false);
          toast.success("Listening stopped.");
        } else {
          toast.error("Failed to stop listening.");
        }
      } else {
        // Start listening
        const r = await fetch(
          `${API_BASE}/v1/listening/start?tenantId=${encodeURIComponent(tenantId)}`,
          { method: "POST", headers: hdrs(tenantId) }
        );
        const j = await r.json();
        if (j?.disconnectedProviders?.length) {
          toast.warning(
            `Listening queued — these providers are not connected: ${j.disconnectedProviders.join(", ")}. Go to Settings → Integrations.`
          );
        } else {
          toast.success("Listening started.");
        }
        setIsListening(true);
        setTimeout(refresh, 2000);
      }
    } catch {
      toast.error("Failed to toggle listening.");
    }
  };

  const addSource = async () => {
    if (!tenantId || !newUrl.trim()) return;
    setAddingUrl(true);
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/sources/import?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "POST",
          headers: hdrs(tenantId),
          body: JSON.stringify({ rawText: newUrl.trim() }),
        }
      );
      const j = await r.json();
      if (j.ok || j.created > 0) {
        toast.success(`Added ${j.created} source${j.created !== 1 ? "s" : ""}.`);
        setNewUrl("");
        fetchSources();
      } else {
        toast.error(j.error === "NO_URLS_FOUND" ? "No valid URL found. Paste a full URL (e.g. https://twitter.com/handle)." : "Failed to add source.");
      }
    } catch {
      toast.error("Failed to add source.");
    } finally {
      setAddingUrl(false);
    }
  };

  const addKeywords = async () => {
    if (!tenantId || !newKeywords.trim()) return;
    setAddingKeywords(true);
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/keywords?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "POST",
          headers: hdrs(tenantId),
          body: JSON.stringify({ keywords: newKeywords.trim() }),
        }
      );
      const j = await r.json();
      if (j.ok) {
        toast.success(`Added ${j.created} keyword${j.created !== 1 ? "s" : ""}.`);
        setNewKeywords("");
        fetchSources();
      } else {
        toast.error(j.error === "NO_VALID_KEYWORDS" ? "Enter at least one keyword." : "Failed to add keywords.");
      }
    } catch {
      toast.error("Failed to add keywords.");
    } finally {
      setAddingKeywords(false);
    }
  };

  const deleteSource = async (id: string) => {
    if (!tenantId) return;
    try {
      const r = await fetch(
        `${API_BASE}/v1/listening/sources/${id}?tenantId=${encodeURIComponent(tenantId)}`,
        { method: "DELETE", headers: hdrs(tenantId) }
      );
      const j = await r.json();
      if (j.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
        toast.success("Source removed.");
      } else {
        toast.error("Failed to delete source.");
      }
    } catch {
      toast.error("Failed to delete source.");
    }
  };

  const toggleAlerts = () => setAlertsOpen((prev) => !prev);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Social Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time listening, alerts, and sentiment tracking
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-cyan-500/20"
            onClick={refresh}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="outline"
            className="border-cyan-500/20"
            onClick={toggleAlerts}
          >
            <Bell className="w-4 h-4 mr-2" />
            Alerts ({stats.alerts})
          </Button>

          <Button
            onClick={toggleListening}
            className={
              isListening
                ? "bg-red-500 hover:bg-red-400"
                : "bg-cyan-500 hover:bg-cyan-400"
            }
          >
            <Radio className="w-4 h-4 mr-2" />
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
        </div>
      </div>

      {/* Alerts Panel */}
      {alertsOpen && (
        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alerts</CardTitle>
            <Badge variant="outline" className="border-cyan-500/20">
              {stats.alerts} active
            </Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No alerts yet. Alerts will appear here for sentiment drops,
            volume spikes, or keyword triggers.
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="listening">
            <MessageCircle className="w-4 h-4 mr-2" />
            Listening
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Alerts" value={stats.alerts} sub="No active alerts" />
            <MetricCard title="Sentiment" value={stats.sentiment} sub={mentionTotal > 0 ? "Awaiting analysis" : "No data yet"} />
            <MetricCard title="Mentions" value={stats.mentions} sub={mentionTotal > 0 ? "From all platforms" : "Waiting for data"} />
            <MetricCard title="Sources" value={stats.sources} sub={sources.length > 0 ? "Profiles tracked" : "Import sources below"} />
          </div>

          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status</CardTitle>
              <Badge
                variant="outline"
                className={isListening ? "border-green-500/40 text-green-400" : "border-cyan-500/20"}
              >
                {isListening ? "Listening: ON" : "Listening: OFF"}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isListening
                ? `Monitoring ${sources.length} sources across ${new Set(sources.map(s => s.platform)).size} platforms.`
                : "Press Start Listening to begin monitoring your social profiles."}
            </CardContent>
          </Card>

          {/* Recent Mentions */}
          {mentions.length > 0 && (
            <Card className="border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-base">Recent Mentions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mentions.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-cyan-500/20 text-xs">
                          {m.channel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.occurredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {m.meta?.text || m.meta?.title || m.url || "Mention detected"}
                      </p>
                    </div>
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Listening */}
        <TabsContent value="listening" className="space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base">Listening Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Stream Status</p>
                <p className="text-sm text-muted-foreground">
                  {isListening
                    ? `Listening is active — tracking ${sources.length} sources.`
                    : "Listening is not active for this workspace."}
                </p>
              </div>
              <Button
                onClick={toggleListening}
                className={isListening ? "bg-red-500 hover:bg-red-400" : "bg-cyan-500 hover:bg-cyan-400"}
              >
                <Radio className="w-4 h-4 mr-2" />
                {isListening ? "Stop" : "Start"}
              </Button>
            </CardContent>
          </Card>

          {/* Add Source Form */}
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Social Profile URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://twitter.com/AtlasUX"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addSource(); }}
                    className="flex-1 border-cyan-500/20"
                  />
                  <Button
                    onClick={addSource}
                    disabled={addingUrl || !newUrl.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400"
                  >
                    {addingUrl ? "Adding..." : "Add URL"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a social media profile URL — Twitter, Reddit, Instagram, LinkedIn, etc.
                </p>
              </div>

              {/* Keywords input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="atlas ux, ai automation, atlasux"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addKeywords(); }}
                    className="flex-1 border-cyan-500/20"
                  />
                  <Button
                    onClick={addKeywords}
                    disabled={addingKeywords || !newKeywords.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400"
                  >
                    {addingKeywords ? "Adding..." : "Add Keywords"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comma-separated terms to monitor (e.g. brand name, product names, competitor names).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sources List */}
          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tracked Sources</CardTitle>
              <Badge variant="outline" className="border-cyan-500/20">
                {sources.length} sources
              </Badge>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sources yet. Add social profile URLs or keywords above to start monitoring.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {s.type === "keyword" ? (
                          <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          {s.url && <p className="truncate text-xs text-muted-foreground">{s.url}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="border-cyan-500/20 text-xs">
                          {s.type === "keyword" ? "keyword" : s.platform}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          onClick={() => deleteSource(s.id)}
                          title="Remove source"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {mentionTotal > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Total Mentions" value={mentionTotal} sub="All time" />
                <MetricCard
                  title="Platforms"
                  value={new Set(mentions.map(m => m.channel)).size}
                  sub="Active channels"
                />
                <MetricCard
                  title="Last Mention"
                  value={mentions[0] ? new Date(mentions[0].occurredAt).toLocaleDateString() : "—"}
                  sub="Most recent"
                />
              </div>

              {/* Mentions by platform */}
              <Card className="border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-base">Mentions by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      mentions.reduce<Record<string, number>>((acc, m) => {
                        acc[m.channel] = (acc[m.channel] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{platform}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 rounded-full bg-cyan-500"
                              style={{ width: `${Math.max(24, (count / mentionTotal) * 200)}px` }}
                            />
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-base">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Analytics will populate here once mentions start flowing in:
                platform breakdown, volume over time, and sentiment trends.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Small helper component ---------- */

function MetricCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card className="border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub ?? ""}</p>
      </CardContent>
    </Card>
  );
}
