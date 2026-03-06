import { useState, useEffect, Fragment } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type CalibrationScore = {
  agentId: string;
  positiveRate: number;
  totalOutcomes: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  calibratedAt: string;
  modifier: number;
};

type SortField = "positiveRate" | "totalOutcomes";
type SortDir = "asc" | "desc";

const PIE_COLORS = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral:  "#6b7280",
  mixed:    "#f59e0b",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function modifierColor(mod: number): string {
  if (mod > 1.0) return "text-emerald-400";
  if (mod < 1.0) return "text-red-400";
  return "text-slate-400";
}

function modifierLabel(mod: number, total: number): string {
  if (mod > 1.0) return `boosted based on ${total} outcomes`;
  if (mod < 1.0) return `dampened based on ${total} outcomes`;
  return `neutral based on ${total} outcomes`;
}

export function AgentCalibration() {
  const { tenantId } = useActiveTenant();
  const [scores, setScores] = useState<CalibrationScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("positiveRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/calibration`, {
        headers: { "x-tenant-id": tenantId },
      });
      const json = await res.json();
      setScores(Array.isArray(json?.scores) ? json.scores : []);
    } catch {
      setError("Failed to load calibration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const refresh = async () => {
    if (!tenantId) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/calibration/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
      });
      const json = await res.json();
      setScores(Array.isArray(json?.scores) ? json.scores : []);
    } catch {
      setError("Recalibration failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...scores].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    return (a[sortField] - b[sortField]) * mul;
  });

  // Summary stats
  const totalAgents = scores.length;
  const avgPositiveRate =
    totalAgents > 0
      ? scores.reduce((sum, s) => sum + s.positiveRate, 0) / totalAgents
      : 0;
  const best =
    totalAgents > 0
      ? scores.reduce((top, s) => (s.positiveRate > top.positiveRate ? s : top), scores[0])
      : null;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-slate-100">Agent Calibration</h2>
        </div>
        <Button
          onClick={refresh}
          disabled={!tenantId || refreshing}
          variant="outline"
          className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Recalibrating..." : "Recalibrate All"}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </Card>
      )}

      {/* Empty state */}
      {!loading && scores.length === 0 && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-8 text-center">
          <p className="text-slate-400">
            No calibration data yet. Agents need decision outcomes before calibration can run.
          </p>
        </Card>
      )}

      {/* Summary cards */}
      {scores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Calibrated Agents
            </div>
            <div className="text-3xl font-bold text-slate-100">{totalAgents}</div>
          </Card>
          <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Avg Positive Rate
            </div>
            <div className="text-3xl font-bold text-slate-100">
              {(avgPositiveRate * 100).toFixed(1)}%
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Best Performer
            </div>
            <div className="text-xl font-bold text-slate-100">
              {best ? capitalize(best.agentId) : "--"}
            </div>
            {best && (
              <div className="text-sm text-emerald-400 mt-0.5">
                {(best.positiveRate * 100).toFixed(1)}% positive
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Agent table */}
      {scores.length > 0 && (
        <Card className="bg-slate-900/50 border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-cyan-500/10">
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    Agent
                  </th>
                  <th
                    className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-cyan-300"
                    onClick={() => handleSort("positiveRate")}
                  >
                    Positive Rate
                    <SortIcon field="positiveRate" />
                  </th>
                  <th
                    className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-cyan-300"
                    onClick={() => handleSort("totalOutcomes")}
                  >
                    Total Outcomes
                    <SortIcon field="totalOutcomes" />
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    +
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    -
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    ~
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    Mix
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    Modifier
                  </th>
                  <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    Last Calibrated
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const isExpanded = expandedAgent === s.agentId;
                  const pctWidth = Math.round(s.positiveRate * 100);
                  const pieData = [
                    { name: "Positive", value: s.positiveCount, color: PIE_COLORS.positive },
                    { name: "Negative", value: s.negativeCount, color: PIE_COLORS.negative },
                    { name: "Neutral", value: s.neutralCount, color: PIE_COLORS.neutral },
                    { name: "Mixed", value: s.mixedCount, color: PIE_COLORS.mixed },
                  ].filter((d) => d.value > 0);

                  return (
                    <Fragment key={s.agentId}>
                      <tr
                        className="border-b border-slate-800/40 hover:bg-slate-800/30 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedAgent(isExpanded ? null : s.agentId)
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="font-medium text-slate-100">
                              {capitalize(s.agentId)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{ width: `${pctWidth}%` }}
                              />
                            </div>
                            <span className="text-slate-300 tabular-nums">
                              {(s.positiveRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 tabular-nums">
                          {s.totalOutcomes}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 tabular-nums">
                          {s.positiveCount}
                        </td>
                        <td className="px-4 py-3 text-red-400 tabular-nums">
                          {s.negativeCount}
                        </td>
                        <td className="px-4 py-3 text-slate-400 tabular-nums">
                          {s.neutralCount}
                        </td>
                        <td className="px-4 py-3 text-amber-400 tabular-nums">
                          {s.mixedCount}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono font-medium ${modifierColor(s.modifier)}`}>
                            {s.modifier.toFixed(3)}x
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {formatDate(s.calibratedAt)}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/40">
                          <td colSpan={9} className="px-6 py-5">
                            <div className="flex items-start gap-8">
                              {/* Pie chart */}
                              <div className="w-48 h-48 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pieData}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={35}
                                      outerRadius={70}
                                      paddingAngle={2}
                                    >
                                      {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid rgba(6,182,212,0.2)",
                                        borderRadius: "8px",
                                        color: "#e2e8f0",
                                        fontSize: "12px",
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Legend + info */}
                              <div className="space-y-3 pt-2">
                                <div className="flex flex-wrap gap-4">
                                  {pieData.map((d) => (
                                    <div key={d.name} className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: d.color }}
                                      />
                                      <span className="text-xs text-slate-300">
                                        {d.name}: {d.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-sm text-slate-300">
                                  Confidence modifier:{" "}
                                  <span className={`font-mono font-bold ${modifierColor(s.modifier)}`}>
                                    {s.modifier.toFixed(3)}x
                                  </span>{" "}
                                  &mdash; {modifierLabel(s.modifier, s.totalOutcomes)}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      )}
    </div>
  );
}
