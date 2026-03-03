import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  Loader2,
  Star,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

// ── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  platform: string;
  identifier: string | null;
  picture: string | null;
  followers?: number;
};

type MetricDataPoint = { total: string; date: string };
type Metric = { label: string; data?: MetricDataPoint[] };

type RankEntry = { name: string; platform: string; total: number };
type Ranking = { label: string; channels: RankEntry[] };

type AggregateResponse = {
  ok: boolean;
  metrics: Metric[];
  rankings: Ranking[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const METRIC_COLORS = [
  { dot: "#a855f7", stroke: "#a855f7", fill: "url(#grad-purple)" },
  { dot: "#22c55e", stroke: "#22c55e", fill: "url(#grad-green)" },
  { dot: "#06b6d4", stroke: "#06b6d4", fill: "url(#grad-cyan)" },
  { dot: "#ec4899", stroke: "#ec4899", fill: "url(#grad-pink)" },
  { dot: "#f59e0b", stroke: "#f59e0b", fill: "url(#grad-amber)" },
  { dot: "#3b82f6", stroke: "#3b82f6", fill: "url(#grad-blue)" },
];

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#00f2ea",
  instagram: "#e1306c",
  youtube: "#ff0000",
  x: "#1da1f2",
  linkedin: "#0a66c2",
  facebook: "#1877f2",
  threads: "#ffffff",
  reddit: "#ff4500",
  pinterest: "#e60023",
  tumblr: "#36465d",
  discord: "#5865f2",
  telegram: "#0088cc",
  mastodon: "#6364ff",
};

function getMetricTotal(metric: Metric): number {
  if (!metric.data?.length) return 0;
  return metric.data.reduce((s, d) => s + (parseInt(d.total, 10) || 0), 0);
}

function getPercentChange(metric: Metric): number | null {
  if (!metric.data || metric.data.length < 2) return null;
  const first = parseInt(metric.data[0].total, 10) || 0;
  const last = parseInt(metric.data[metric.data.length - 1].total, 10) || 0;
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

// ── Sparkline SVG defs (gradient fills) ──────────────────────────────────────

function SparkDefs() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="grad-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  metric,
  colorIndex,
}: {
  metric: Metric;
  colorIndex: number;
}) {
  const color = METRIC_COLORS[colorIndex % METRIC_COLORS.length];
  const total = getMetricTotal(metric);
  const pct = getPercentChange(metric);
  const chartData = (metric.data ?? []).map((d) => ({
    v: parseInt(d.total, 10) || 0,
  }));

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 flex flex-col gap-2">
      {/* Header: dot + label + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color.dot }}
          />
          <span className="text-sm font-medium text-slate-200">
            {metric.label}
          </span>
        </div>
        {pct !== null && (
          <span
            className={`text-xs font-semibold ${pct >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {pct >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(pct)}%
          </span>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-16">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color.stroke}
                strokeWidth={2}
                fill={color.fill}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-end">
            <div
              className="w-full h-px"
              style={{ backgroundColor: color.stroke, opacity: 0.4 }}
            />
          </div>
        )}
      </div>

      {/* Total */}
      <div className="text-2xl font-bold text-white tracking-tight">
        {formatNumber(total)}
      </div>
    </div>
  );
}

// ── Platform badge (small colored pill) ──────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const bg = PLATFORM_COLORS[platform] ?? "#64748b";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
      style={{ backgroundColor: bg }}
    />
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function BrandAnalytics() {
  const { tenantId } = useActiveTenant();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null); // null = aggregate
  const [dateRange, setDateRange] = useState<"7" | "30">("7");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers: Record<string, string> = tenantId
    ? { "x-tenant-id": tenantId }
    : {};

  // Load channels on mount
  useEffect(() => {
    fetch(`${API_BASE}/v1/postiz/channels`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.channels)) setChannels(d.channels);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // Load metrics when channel or date range changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    const url = selectedChannel
      ? `${API_BASE}/v1/postiz/analytics/${selectedChannel}?date=${dateRange}`
      : `${API_BASE}/v1/postiz/analytics/aggregate?date=${dateRange}`;

    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setMetrics(d.metrics ?? []);
          setRankings(d.rankings ?? []);
        } else {
          setError(d.error ?? "Failed to load analytics");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, dateRange, tenantId]);

  const selectedName = selectedChannel
    ? channels.find((c) => c.id === selectedChannel)?.name ?? "Channel"
    : "All Channels";

  return (
    <div className="flex h-full">
      <SparkDefs />

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="w-56 flex-shrink-0 border-r border-slate-700/50 bg-slate-950/30 overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-slate-300">Channels</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* All Channels */}
          <button
            onClick={() => setSelectedChannel(null)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition ${
              selectedChannel === null
                ? "bg-cyan-500/10 text-white font-semibold"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-cyan-400" />
            All Channels
          </button>

          {/* Individual channels */}
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition ${
                selectedChannel === ch.id
                  ? "bg-cyan-500/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <PlatformBadge platform={ch.platform} />
              <span className="truncate flex-1">{ch.name}</span>
              {ch.followers != null && (
                <span className="text-[10px] text-slate-500">
                  {formatNumber(ch.followers)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h1 className="text-xl font-bold text-white">
              Brand Analytics
              {selectedChannel && (
                <span className="text-slate-400 font-normal ml-2">
                  — {selectedName}
                </span>
              )}
              {!selectedChannel && (
                <span className="text-slate-500 font-normal text-sm ml-2">
                  Aggregate
                </span>
              )}
            </h1>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "7" | "30")}
            className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="ml-2 text-slate-400 text-sm">
              Loading analytics...
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/40 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Metric Cards Grid */}
        {!loading && !error && metrics.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {metrics.map((m, i) => (
                <MetricCard key={m.label} metric={m} colorIndex={i} />
              ))}
            </div>

            {/* Platform Rankings (aggregate only) */}
            {!selectedChannel && rankings.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">
                  Platform Rankings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rankings
                    .filter((r) => r.channels.some((c) => c.total > 0))
                    .map((r) => (
                      <div
                        key={r.label}
                        className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-4 py-3"
                      >
                        <div className="text-xs font-semibold text-slate-400 mb-2">
                          {r.label}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {r.channels
                            .filter((c) => c.total > 0)
                            .slice(0, 6)
                            .map((c, idx) => (
                              <span
                                key={c.name + c.platform}
                                className="text-xs text-slate-300 flex items-center gap-1"
                              >
                                <span className="text-slate-500 font-mono">
                                  #{idx + 1}
                                </span>
                                <PlatformBadge platform={c.platform} />
                                <span className="truncate max-w-[100px]">
                                  {c.name}
                                </span>
                                <span className="text-slate-500">
                                  ({formatNumber(c.total)})
                                </span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && metrics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3 opacity-40">📊</div>
            <h3 className="text-lg font-semibold text-slate-300">
              No analytics data yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Connect your social profiles in Postiz and start posting. Analytics
              will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
