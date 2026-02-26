/**
 * AgentWatcher — live agent activity monitor.
 *
 * Polls audit logs every 4 s and active jobs every 8 s.
 * Shows a scrollable event feed, active job cards, and per-agent status.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, RefreshCw, Zap, AlertTriangle, Info, CheckCircle, XCircle, Clock, Bot } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type AuditEntry = {
  id: string;
  action: string;
  level: "info" | "warn" | "error" | "debug";
  actorType?: string;
  actorExternalId?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  message?: string;
  meta?: any;
  timestamp?: string;
  createdAt?: string;
};

type Job = {
  id: string;
  type: string;
  status: "queued" | "running" | "paused" | "completed" | "failed";
  priority: number;
  title?: string;
  agentId?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  output?: any;
};

const LEVEL_STYLES: Record<string, string> = {
  info:  "text-cyan-400",
  warn:  "text-amber-400",
  error: "text-red-400",
  debug: "text-slate-500",
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  info:  <Info className="w-3 h-3 text-cyan-400" />,
  warn:  <AlertTriangle className="w-3 h-3 text-amber-400" />,
  error: <XCircle className="w-3 h-3 text-red-400" />,
  debug: <Info className="w-3 h-3 text-slate-500" />,
};

const JOB_STATUS_STYLES: Record<string, string> = {
  queued:    "bg-slate-700/60 text-slate-300 border-slate-600/40",
  running:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse",
  paused:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed:    "bg-red-500/20 text-red-300 border-red-500/30",
};

function formatTime(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function agentLabel(entry: AuditEntry): string {
  return entry.actorExternalId ?? entry.actorUserId ?? entry.actorType ?? "system";
}

export function AgentWatcher() {
  const { tenantId } = useActiveTenant();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchAudit = useCallback(async () => {
    if (paused) return;
    setAuditLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (tenantId) headers["x-tenant-id"] = tenantId;
      const res = await fetch(`${API_BASE}/v1/audit/list?limit=100`, { headers });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        setEntries(data.items);
        setLastRefresh(new Date());
      }
    } catch { /* silent */ } finally {
      setAuditLoading(false);
    }
  }, [tenantId, paused]);

  const fetchJobs = useCallback(async () => {
    if (paused) return;
    setJobsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (tenantId) headers["x-tenant-id"] = tenantId;
      const res = await fetch(`${API_BASE}/v1/jobs/list`, { headers });
      const data = await res.json();
      if (data.ok && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch { /* silent */ } finally {
      setJobsLoading(false);
    }
  }, [tenantId, paused]);

  // Initial load
  useEffect(() => {
    fetchAudit();
    fetchJobs();
  }, [tenantId]);

  // Auto-poll — audit every 4 s, jobs every 8 s
  useEffect(() => {
    if (paused) return;
    const auditTimer = setInterval(fetchAudit, 15000);
    const jobsTimer  = setInterval(fetchJobs, 30000);
    return () => { clearInterval(auditTimer); clearInterval(jobsTimer); };
  }, [paused, fetchAudit, fetchJobs]);

  // Auto-scroll feed to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  // Derived state
  const activeJobs  = jobs.filter(j => j.status === "running" || j.status === "queued");
  const failedJobs  = jobs.filter(j => j.status === "failed");

  const allAgents = Array.from(
    new Set(entries.map(e => agentLabel(e)).filter(Boolean))
  ).sort();

  const filteredEntries = entries.filter(e => {
    if (filterLevel !== "all" && e.level !== filterLevel) return false;
    if (filterAgent !== "all" && agentLabel(e) !== filterAgent) return false;
    return true;
  });

  // Agent pulse — which agents fired in the last 2 minutes
  const twoMinAgo = Date.now() - 2 * 60 * 1000;
  const recentAgents = new Set(
    entries
      .filter(e => new Date(e.timestamp ?? e.createdAt ?? 0).getTime() > twoMinAgo)
      .map(e => agentLabel(e))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Agent Watcher
          </h2>
          <p className="text-slate-400 text-sm mt-1">Live activity feed — auto-refreshes every 15 seconds</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-slate-500">Last: {formatTime(lastRefresh.toISOString())}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused(p => !p)}
            className={`border-slate-700 ${paused ? "text-amber-400 border-amber-500/40" : "text-slate-300"}`}
          >
            {paused ? <><Zap className="w-3 h-3 mr-1" /> Resume</> : <><Clock className="w-3 h-3 mr-1" /> Pause</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchAudit(); fetchJobs(); }}
            disabled={auditLoading}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-3 h-3 ${auditLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Active agent pulse strip */}
      {recentAgents.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...recentAgents].map(agent => (
            <div key={agent} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <Bot className="w-3 h-3" />
              {agent}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Live feed (2/3 width) */}
        <div className="xl:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Level:</span>
            {["all", "info", "warn", "error", "debug"].map(l => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                  filterLevel === l
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200"
                }`}
              >
                {l}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-2">Agent:</span>
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-300 outline-none focus:border-cyan-500"
            >
              <option value="all">all agents</option>
              {allAgents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filteredEntries.length} events</span>
            <button
              onClick={() => setAutoScroll(a => !a)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                autoScroll
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50"
              }`}
            >
              {autoScroll ? "↓ Auto-scroll" : "⏹ Pinned"}
            </button>
          </div>

          {/* Feed */}
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl p-0 overflow-hidden">
            <div
              ref={feedRef}
              onScroll={e => {
                const el = e.currentTarget;
                const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
                setAutoScroll(atBottom);
              }}
              className="h-[520px] overflow-y-auto font-mono text-[11px] p-3 space-y-0.5"
            >
              {filteredEntries.length === 0 ? (
                <div className="text-slate-500 text-center py-20">
                  {auditLoading ? "Loading…" : "No activity yet. Agents will appear here when they run."}
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 py-0.5 border-b border-slate-800/50 hover:bg-slate-800/30 rounded px-1 group"
                  >
                    <span className="text-slate-600 shrink-0 w-20 pt-0.5">
                      {formatTime(entry.timestamp ?? entry.createdAt)}
                    </span>
                    <span className="shrink-0 pt-0.5">{LEVEL_ICONS[entry.level ?? "info"]}</span>
                    <span className="text-purple-400 shrink-0 w-20 truncate pt-0.5" title={agentLabel(entry)}>
                      {agentLabel(entry)}
                    </span>
                    <span className="text-slate-500 shrink-0 w-28 truncate pt-0.5 uppercase text-[10px]">
                      {entry.action}
                    </span>
                    <span className={`flex-1 leading-relaxed ${LEVEL_STYLES[entry.level ?? "info"]}`}>
                      {entry.message ?? entry.entityId ?? "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ── Jobs sidebar (1/3 width) */}
        <div className="space-y-4">
          {/* Active jobs */}
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white text-sm">Active Jobs</div>
              <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                {activeJobs.length} running
              </Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeJobs.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No active jobs</div>
              ) : activeJobs.map(j => (
                <div key={j.id} className={`p-2 rounded-lg border text-xs ${JOB_STATUS_STYLES[j.status]}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{j.title ?? j.type}</span>
                    <span className="text-[10px] uppercase ml-2 shrink-0">{j.status}</span>
                  </div>
                  {j.agentId && <div className="text-[10px] opacity-70 mt-0.5">{j.agentId}</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* Failed jobs */}
          {failedJobs.length > 0 && (
            <Card className="bg-slate-900/60 border-red-500/20 backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-red-400" />
                <div className="font-semibold text-white text-sm">Failed Jobs</div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {failedJobs.slice(0, 5).map(j => (
                  <div key={j.id} className="p-2 rounded-lg border bg-red-500/10 border-red-500/20 text-xs">
                    <div className="text-red-300 font-medium truncate">{j.title ?? j.type}</div>
                    {j.error && <div className="text-red-400/70 text-[10px] mt-0.5 line-clamp-2">{j.error}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Stats */}
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl p-4">
            <div className="font-semibold text-white text-sm mb-3">Last 100 Events</div>
            <div className="grid grid-cols-2 gap-2">
              {(["info", "warn", "error"] as const).map(level => {
                const count = entries.filter(e => e.level === level).length;
                return (
                  <div key={level} className={`p-2 rounded-lg bg-slate-800/50 text-center`}>
                    <div className={`text-lg font-bold ${LEVEL_STYLES[level]}`}>{count}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{level}</div>
                  </div>
                );
              })}
              <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                <div className="text-lg font-bold text-emerald-400">{jobs.filter(j => j.status === "completed").length}</div>
                <div className="text-[10px] text-slate-500">done</div>
              </div>
            </div>
          </Card>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className={`w-2 h-2 rounded-full ${paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
            <span className="text-xs text-slate-400">
              {paused ? "Feed paused" : "Live — polling every 4s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
