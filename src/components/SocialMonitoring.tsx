import { useState } from "react";
import {
  Bell,
  Radio,
  Activity,
  BarChart3,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function SocialMonitoring() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isListening, setIsListening] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Demo / placeholder stats (safe while backend is offline)
  const stats = {
    alerts: 0,
    sentiment: 0,
    mentions: 0,
    sources: 0,
  };

  const toggleListening = () => {
    // UI-only for now
    setIsListening((prev) => !prev);
  };

  const toggleAlerts = () => {
    setAlertsOpen((prev) => !prev);
  };

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
            No alerts yet. Once the listening service is live, alerts will
            appear here for sentiment drops, spikes, or keyword triggers.
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
            <MetricCard title="Alerts" value={stats.alerts} />
            <MetricCard title="Sentiment" value={`${stats.sentiment}%`} />
            <MetricCard title="Mentions" value={stats.mentions} />
            <MetricCard title="Sources" value={stats.sources} />
          </div>

          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Status</CardTitle>
              <Badge
                variant="outline"
                className={
                  isListening
                    ? "border-red-500/40"
                    : "border-cyan-500/20"
                }
              >
                {isListening
                  ? "Listening: ON (demo)"
                  : "Listening: OFF"}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Listening is rolling out in waves. Some workspaces may see limited functionality during onboarding.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listening */}
        <TabsContent value="listening">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base">
                Listening Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Stream Status</p>
                <p className="text-sm text-muted-foreground">
                  {isListening
                    ? "Listening is active."
                    : "Listening is not active for this workspace."}
                </p>
              </div>
              <Button
                onClick={toggleListening}
                className={ isListening ? "bg-red-500 hover:bg-red-400" : "bg-cyan-500 hover:bg-cyan-400" }>
                <Radio className="w-4 h-4 mr-2" />
                {isListening ? "Stop" : "Start"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-base">
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Analytics will populate here once live data is flowing:
              sentiment trends, volume over time, and alert history.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Small helper component ---------- */

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <Card className="border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">
          Placeholder value
        </p>
      </CardContent>
    </Card>
  );
}
