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

// ── Platform mini-icon SVGs ──────────────────────────────────────────────────

function PlatformMiniIcon({ platform }: { platform: string }) {
  const size = 10;
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "white" } as const;
  switch (platform) {
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23 7s-.3-2-1.2-2.8C20.7 3.2 19.5 3 12 3S3.3 3.2 2.2 4.2C1.3 5 1 7 1 7s-.3 2-.3 4v2c0 2 .3 4 .3 4s.3 2 1.2 2.8c1.1 1 2.3 1.2 9.8 1.2s8.7-.2 9.8-1.2c.9-.8 1.2-2.8 1.2-2.8s.3-2 .3-4v-2c0-2-.3-4-.3-4zM9.5 16V8l6.5 4-6.5 4z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.4a6.34 6.34 0 0010.82 4.48c1.7-1.7 2.65-4 2.65-6.4V8.78a8.18 8.18 0 004.77 1.53V6.86a4.83 4.83 0 01-1.8-.17z" />
        </svg>
      );
    case "threads":
      return (
        <svg {...common}>
          <path d="M16.79 11.48c-.08-.04-.15-.07-.23-.1a7.3 7.3 0 00-2.2-4.1c-1.15-1.06-2.62-1.6-4.22-1.53-2.27.1-3.95 1.18-4.87 3.13l2.5 1.32c.54-1.14 1.48-1.7 2.8-1.67.92.02 1.65.32 2.17.88.38.4.63.94.75 1.6a10.38 10.38 0 00-2.94-.14c-2.93.29-4.82 1.98-4.66 4.17.08 1.1.62 2.05 1.52 2.68.77.54 1.76.8 2.79.74 1.36-.08 2.43-.56 3.18-1.42.57-.65.93-1.48 1.1-2.52.66.4 1.15.93 1.4 1.59.44 1.14.46 3.01-1.1 4.57-1.36 1.37-3 1.96-5.48 1.98-2.76-.03-4.86-.9-6.22-2.6-1.27-1.57-1.93-3.83-1.97-6.7.04-2.87.7-5.13 1.97-6.7C4.44 4.9 6.54 4.03 9.3 4c2.79.03 4.92.92 6.32 2.63a9.84 9.84 0 011.75 3.7l2.6-.69a12.3 12.3 0 00-2.27-4.78C15.84 2.6 13.05 1.45 9.32 1.42c-3.57.03-6.32 1.3-8.15 3.76C-.56 7.5-1.33 10.35-.08 13.6c.06 2.87.82 5.13 2.26 6.71 1.84 2.46 4.59 3.73 8.16 3.76 2.89-.02 5.04-.8 6.8-2.57 2.44-2.44 2.35-5.48 1.6-7.47a5.89 5.89 0 00-2.95-2.55zm-5.07 5.27c-1.14.07-2.33-.45-2.4-1.45-.05-.73.52-1.55 2.2-1.72.38-.04.76-.05 1.12-.03.3.01.6.04.88.08-.2 2.3-1.15 3.07-1.8 3.12z" />
        </svg>
      );
    default:
      return (
        <span className="text-[7px] font-bold text-white leading-none">
          {platform.charAt(0).toUpperCase()}
        </span>
      );
  }
}

// ── Channel Avatar with platform badge ──────────────────────────────────────

function ChannelAvatar({ channel }: { channel: Channel }) {
  const bg = PLATFORM_COLORS[channel.platform] ?? "#64748b";
  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      {channel.picture ? (
        <img
          src={channel.picture}
          alt={channel.name}
          className="w-8 h-8 rounded-lg object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
          {channel.name.charAt(0).toUpperCase()}
        </div>
      )}
      {/* Platform badge */}
      <div
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ring-1 ring-slate-950"
        style={{ backgroundColor: bg }}
      >
        <PlatformMiniIcon platform={channel.platform} />
      </div>
    </div>
  );
}

// ── Platform badge (small colored pill — used in rankings) ───────────────────

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
        <div className="w-60 flex-shrink-0 border-r border-slate-700/50 bg-slate-950/30 overflow-y-auto">
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
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition ${
                selectedChannel === ch.id
                  ? "bg-cyan-500/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <ChannelAvatar channel={ch} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate">{ch.name}</span>
                {ch.followers != null && (
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {formatNumber(ch.followers)} followers
                  </span>
                )}
              </div>
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
