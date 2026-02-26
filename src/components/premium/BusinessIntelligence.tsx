import { useEffect, useState } from 'react';
import { useActiveTenant } from '@/lib/activeTenant';
import { API_BASE } from '@/lib/api';
import {
  TrendingUp,
  DollarSign,
  Brain,
  BarChart3,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Users,
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

type AnalyticsSummary = {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  clickRate: string;
  totalPosts: number;
  totalSpendCents: number;
  totalSpendUsd: string;
};

type AccountingSummary = {
  revenue: number;
  expenses: number;
  net: number;
  approvalsPending: number;
  flags: number;
};

type DecisionAnalytics = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: string;
  avgCostUsd: number;
  totalApprovedCostUsd: number;
  byAgent: Record<string, { total: number; approved: number; rejected: number }>;
};

type ChannelROI = {
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  posts: number;
  ctr: string;
  convRate: string;
};

type PeriodComparison = {
  current: { impressions: number; clicks: number; conversions: number; spendCents: number; posts: number };
  prior: { impressions: number; clicks: number; conversions: number; spendCents: number; posts: number };
  delta: { impressions: string; clicks: string; conversions: string; spendCents: string; posts: string };
};

export function BusinessIntelligence() {
  const { tenantId } = useActiveTenant();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [accounting, setAccounting] = useState<AccountingSummary | null>(null);
  const [decisions, setDecisions] = useState<DecisionAnalytics | null>(null);
  const [channels, setChannels] = useState<ChannelROI[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [agentCount, setAgentCount] = useState(0);
  const [range, setRange] = useState<"7d" | "24h" | "30d" | "90d">("7d");

  const hdr = tenantId ? { "x-tenant-id": tenantId } : {};

  async function loadAll() {
    setLoading(true);
    try {
      const qs = tenantId ? `tenantId=${encodeURIComponent(tenantId)}` : "";
      const [anRes, acRes, decRes, roiRes, cmpRes, agRes] = await Promise.all([
        fetch(`${API_BASE}/v1/analytics/summary?range=${range}&${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/accounting/summary?${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/decisions/analytics`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/analytics/roi?range=${range}&${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/analytics/compare?range=${range}&${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/agents`, { headers: hdr }).then(r => r.json()).catch(() => null),
      ]);

      if (anRes?.ok) setAnalytics(anRes.summary);
      if (acRes?.ok) setAccounting(acRes.summary);
      if (decRes?.ok) setDecisions(decRes);
      if (roiRes?.ok) setChannels(roiRes.channels ?? []);
      if (cmpRes?.ok) setComparison(cmpRes);
      if (agRes?.ok) setAgentCount(agRes.agents?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [tenantId, range]);

  const kpis = [
    {
      name: "Total Impressions",
      value: analytics?.totalImpressions?.toLocaleString() ?? "0",
      delta: comparison?.delta?.impressions ?? "—",
      trend: comparison?.delta?.impressions?.startsWith("-") ? "down" : "up",
    },
    {
      name: "Click-Through Rate",
      value: analytics?.clickRate ?? "0%",
      delta: comparison?.delta?.clicks ?? "—",
      trend: comparison?.delta?.clicks?.startsWith("-") ? "down" : "up",
    },
    {
      name: "Conversions",
      value: analytics?.totalConversions?.toLocaleString() ?? "0",
      delta: comparison?.delta?.conversions ?? "—",
      trend: comparison?.delta?.conversions?.startsWith("-") ? "down" : "up",
    },
    {
      name: "Ad Spend",
      value: analytics?.totalSpendUsd ?? "$0.00",
      delta: comparison?.delta?.spendCents ?? "—",
      trend: comparison?.delta?.spendCents?.startsWith("-") ? "down" : "up",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Business Intelligence</h2>
            </div>
            <p className="text-slate-400">
              Live analytics and performance insights from your connected channels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={loadAll}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm text-slate-400">{kpi.name}</div>
              <div className={`flex items-center gap-1 text-xs ${
                kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {kpi.delta}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Financial Overview + Decision Analytics side by side */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Financial */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Financial Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Revenue (credits)</div>
              <div className="text-xl font-bold text-green-400">${((accounting?.revenue ?? 0) / 100).toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Expenses (debits)</div>
              <div className="text-xl font-bold text-red-400">${((accounting?.expenses ?? 0) / 100).toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Net</div>
              <div className={`text-xl font-bold ${(accounting?.net ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${((accounting?.net ?? 0) / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Pending Approvals</div>
              <div className="text-xl font-bold text-amber-400">{accounting?.approvalsPending ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Decision Analytics */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Decision Analytics</h3>
          </div>
          {decisions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{decisions.total}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{decisions.approved}</div>
                  <div className="text-xs text-slate-400">Approved</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{decisions.rejected}</div>
                  <div className="text-xs text-slate-400">Rejected</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Approval rate</span>
                <span className="text-cyan-400 font-semibold">{decisions.approvalRate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg cost per decision</span>
                <span className="text-white font-semibold">${decisions.avgCostUsd?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total approved spend</span>
                <span className="text-green-400 font-semibold">${decisions.totalApprovedCostUsd?.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-4 text-center">No decision data available.</div>
          )}
        </div>
      </div>

      {/* Channel ROI */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Channel Performance</h3>
          </div>
          <div className="text-sm text-slate-400">{channels.length} channel{channels.length !== 1 ? "s" : ""}</div>
        </div>

        {channels.length > 0 ? (
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400">
              <div className="col-span-3">Channel</div>
              <div className="col-span-2 text-right">Impressions</div>
              <div className="col-span-2 text-right">Clicks</div>
              <div className="col-span-2 text-right">Conversions</div>
              <div className="col-span-1 text-right">CTR</div>
              <div className="col-span-2 text-right">Conv. Rate</div>
            </div>
            {channels.map((ch) => (
              <div key={ch.channel} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700/50 text-sm">
                <div className="col-span-3 text-white font-medium capitalize">{ch.channel}</div>
                <div className="col-span-2 text-right text-slate-300">{ch.impressions.toLocaleString()}</div>
                <div className="col-span-2 text-right text-slate-300">{ch.clicks.toLocaleString()}</div>
                <div className="col-span-2 text-right text-slate-300">{ch.conversions.toLocaleString()}</div>
                <div className="col-span-1 text-right text-cyan-400">{ch.ctr}</div>
                <div className="col-span-2 text-right text-green-400">{ch.convRate}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 py-6 text-center">
            No channel data yet. Distribution events will appear here once agents start publishing content.
          </div>
        )}
      </div>

      {/* Agent Decision Breakdown */}
      {decisions && Object.keys(decisions.byAgent ?? {}).length > 0 && (
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Decisions by Agent</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(decisions.byAgent).map(([agent, stats]) => (
              <div key={agent} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-white font-medium mb-2 capitalize">{agent}</div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{stats.total} total</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    {stats.approved}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3 h-3" />
                    {stats.rejected}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workforce Overview */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Workforce Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{agentCount}</div>
            <div className="text-xs text-slate-400">Active Agents</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{analytics?.totalPosts ?? 0}</div>
            <div className="text-xs text-slate-400">Posts ({range})</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{decisions?.pending ?? 0}</div>
            <div className="text-xs text-slate-400">Pending Decisions</div>
          </div>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Target className="w-6 h-6 text-red-400 mb-3" />
          <div className="text-white font-semibold mb-1">Competitor Monitoring</div>
          <div className="text-xs text-slate-400">Track competitor activity across platforms. Requires external SERP API integration.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Globe className="w-6 h-6 text-blue-400 mb-3" />
          <div className="text-white font-semibold mb-1">Industry News Feed</div>
          <div className="text-xs text-slate-400">AI-curated news aggregated from multiple sources with relevance scoring.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <DollarSign className="w-6 h-6 text-green-400 mb-3" />
          <div className="text-white font-semibold mb-1">Stock & Market Data</div>
          <div className="text-xs text-slate-400">Real-time market dashboard with AI-powered insights. Requires financial data API.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
      </div>
    </div>
  );
}
