import { useEffect, useMemo, useState } from "react";
import { Bell, Radio, Activity, BarChart3, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type Asset = {
  id: string;
  type: string;
  name: string;
  url: string;
  platform?: string | null;
};

export function SocialMonitoring() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isListening, setIsListening] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const { tenantId } = useActiveTenant();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsErr, setAssetsErr] = useState<string | null>(null);

  const socialAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.type === "social" ||
          !!a.platform ||
          /instagram|x\.com|twitter|facebook|tiktok|youtube|threads|tumblr|pinterest/i.test(a.url || "")
      ),
    [assets]
  );

  const stats = {
    alerts: 0,
    sentiment: 0,
    mentions: 0,
    sources: socialAssets.length,
  };

  async function loadAssets() {
    if (!tenantId) {
      setAssets([]);
      setAssetsErr("Select a Business (tenant) in Business Manager first.");
      return;
    }
    setAssetsErr(null);
    try {
      const res = await fetch(`${API_BASE}/v1/assets?tenantId=${encodeURIComponent(tenantId)}`);
      const json = await res.json().catch(() => ({}));
      const rows = (json?.items ?? json?.assets ?? json?.rows ?? []) as any[];
      setAssets(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setAssets([]);
      setAssetsErr(e?.message || "assets_load_failed");
    }
  }

  useEffect(() => {
    void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const toggleListening = () => {
    // UI-only for now. When the listener worker is wired, this will enqueue a job scoped to the tenant.
    setIsListening((prev) => !prev);
  };

  const toggleAlerts = () => setAlertsOpen((prev) => !prev);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Social Monitoring</h2>
          <p className="text-sm text-muted-foreground">Real-time listening, alerts, and sentiment tracking</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20" onClick={toggleAlerts}>
            <Bell className="w-4 h-4 mr-2" />
            Alerts ({stats.alerts})
          </Button>

          <Button
            onClick={toggleListening}
            className={isListening ? "bg-red-500 hover:bg-red-400" : "bg-cyan-500 hover:bg-cyan-400"}
          >
            <Radio className="w-4 h-4 mr-2" />
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
        </div>
      </div>

      {alertsOpen && (
        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alerts</CardTitle>
            <Badge variant="outline" className="border-cyan-500/20">
              {stats.alerts} active
            </Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No alerts yet. Once the listening service is live, alerts will appear here for sentiment drops, spikes, or
            keyword triggers.
          </CardContent>
        </Card>
      )}

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

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Alerts" value={stats.alerts} />
            <MetricCard title="Sentiment" value={`${stats.sentiment}%`} />
            <MetricCard title="Mentions" value={stats.mentions} />
            <MetricCard title="Sources" value={stats.sources} />
          </div>

          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status</CardTitle>
              <Badge variant="outline" className={isListening ? "border-red-500/40" : "border-cyan-500/20"}>
                {isListening ? "Listening: ON (demo)" : "Listening: OFF"}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Listening is rolling out in waves. Some workspaces may see limited functionality during onboarding.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listening" className="space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base">Listening Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Stream Status</p>
                <p className="text-sm text-muted-foreground">
                  {isListening ? "Listening (UI demo). Worker wiring in progress." : "Idle"}
                </p>
                {assetsErr && <p className="text-xs text-amber-300">{assetsErr}</p>}
              </div>
              <Badge variant="outline" className={isListening ? "border-red-500/40" : "border-cyan-500/20"}>
                {isListening ? "ON" : "OFF"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Suggested sources</CardTitle>
              <Button variant="outline" className="border-cyan-500/20" onClick={loadAssets}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {socialAssets.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No social assets found for this Business yet. Add them in Business Manager → Assets.
                </div>
              ) : (
                socialAssets.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-cyan-500/10"
                  >
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.url}</div>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/20">
                      {a.platform || a.type}
                    </Badge>
                  </div>
                ))
              )}
              <div className="text-xs text-muted-foreground pt-2">
                Next: the listening worker will scan these sources, write findings to Audit Log + Analytics, and surface
                alerts.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base">Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Analytics panels will show sentiment trends, top mentions, and sources once listening is connected.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: any }) {
  return (
    <Card className="border-cyan-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
