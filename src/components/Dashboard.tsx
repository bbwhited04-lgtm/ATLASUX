import { 
  Activity, 
  Brain, 
  CheckCircle2, 
  Clock, 
  Zap,
  TrendingUp,
  Globe,
  FileText,
  Play,
  Pause,
  Cpu,
  Briefcase,
  Gauge,
  ArrowRight
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useState } from "react";
import { useNavigate } from "react-router";
import * as React from "react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
const imgA = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800";

export function Dashboard() {
const navigate = useNavigate();
  const { tenantId } = useActiveTenant();
  const [pendingDecisionsCount, setPendingDecisionsCount] = React.useState<number>(0);
  const [liveStats, setLiveStats] = React.useState<{active: number, completed: number, agents: number, kbDocs: number, auditEvents: number, spendUsd: number}>({ active: 0, completed: 0, agents: 0, kbDocs: 0, auditEvents: 0, spendUsd: 0 });
  const [growthRuns, setGrowthRuns] = React.useState<any[]>([]);
  const [recentJobs, setRecentJobs] = React.useState<any[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      if (!tenantId) {
        if (!cancelled) setPendingDecisionsCount(0);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=200`, {
          headers: { "x-tenant-id": tenantId },
        });
        const json = await res.json();
        const count = Array.isArray(json?.memos) ? json.memos.length : 0;
        if (!cancelled) setPendingDecisionsCount(count);
      } catch {
        if (!cancelled) setPendingDecisionsCount(0);
      }
    };
    fetchCount();
    const t = window.setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [tenantId]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchLiveData = async () => {
      if (!tenantId) return;
      const h = { "x-tenant-id": tenantId };
      try {
        const [jobsRes, growthRes, agentsRes, accountingRes, auditRes] = await Promise.all([
          fetch(`${API_BASE}/v1/jobs?status=running&limit=5`, { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/v1/analytics/summary?range=7d`, { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/v1/agents`, { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/v1/accounting/summary`, { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/v1/audit/list?limit=1`, { headers: h }).then(r => r.json()).catch(() => ({})),
        ]);

        if (!cancelled) {
          const jobs: any[] = Array.isArray(jobsRes?.jobs) ? jobsRes.jobs :
                              Array.isArray(jobsRes?.data) ? jobsRes.data : [];
          const activeCount = jobs.filter((j: any) => j.status === "running" || j.status === "RUNNING").length;
          const completedCount = typeof jobsRes?.completedToday === "number" ? jobsRes.completedToday : 0;
          const agentCount = Array.isArray(agentsRes?.agents) ? agentsRes.agents.length : 0;
          const spendUsd = typeof accountingRes?.summary?.totalDebitsCents === "number"
            ? accountingRes.summary.totalDebitsCents / 100
            : 0;
          const auditTotal = typeof auditRes?.total === "number" ? auditRes.total : (Array.isArray(auditRes?.items) ? auditRes.items.length : 0);
          setLiveStats({ active: activeCount, completed: completedCount, agents: agentCount, kbDocs: 0, auditEvents: auditTotal, spendUsd });
          setRecentJobs(jobs);

          const runs: any[] = Array.isArray(growthRes?.runs) ? growthRes.runs :
                               Array.isArray(growthRes?.timeline) ? growthRes.timeline : [];
          setGrowthRuns(runs);
        }
      } catch {
        // non-fatal
      }
    };
    fetchLiveData();
  }, [tenantId]);

  const stats = [
    { label: "Active Jobs", value: String(liveStats.active), icon: Activity, color: "cyan" },
    { label: "Completed Today", value: String(liveStats.completed), icon: CheckCircle2, color: "green" },
    { label: "Registered Agents", value: String(liveStats.agents), icon: Brain, color: "purple" },
    { label: "Total Spend", value: `$${liveStats.spendUsd.toFixed(2)}`, icon: TrendingUp, color: "yellow" },
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900/50 to-slate-900 border border-cyan-500/20 p-8">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to Atlas UX
            </h2>
            <p className="text-slate-300 max-w-xl">
              Your AI workforce of {liveStats.agents || "—"} agents is live — monitoring social media,
              executing workflows, and logging every action. Atlas access control is active.
            </p>
            <div className="flex gap-3 pt-2">
              
              <button
                type="button"
                onClick={() => navigate("/app/agents?view=automation")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20"
              >
              New Task
              </button>

              <button onClick={() => navigate("/app/jobs")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20">
                View All Jobs
              </button>
            </div>
          </div>
          <img src="./atlas_hero.png"  alt="Atlas AI" className="w-64 h-64 object-cover opacity-60" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <Badge variant="outline" className="text-xs border-cyan-500/20 text-cyan-400">
                  Live
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Operator Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400">Needs Approval</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{pendingDecisionsCount}</div>
              <div className="text-sm text-slate-400 mt-1">Decision memos awaiting Exec.</div>
            </div>
            <div className={`w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center border border-red-500/20`}>
              <Clock className="w-5 h-5 text-red-300" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/business-manager?tab=decisions")}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold border border-cyan-500/20 flex items-center justify-center gap-2"
          >
            Review Decisions <ArrowRight className="w-4 h-4" />
          </button>
          {!tenantId && (
            <div className="mt-2 text-xs text-amber-300">Select a Business in Business Manager to enable approvals.</div>
          )}
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400">Daily Control</div>
              <div className="text-lg font-bold text-slate-100 mt-1">One action per day</div>
              <div className="text-sm text-slate-400 mt-1">Guardrails enforce a slow, safe alpha cadence.</div>
            </div>
            <div className={`w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center border border-cyan-500/20`}>
              <Gauge className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/agents?view=automation")}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold border border-cyan-500/20 flex items-center justify-center gap-2"
          >
            View Growth Loop <ArrowRight className="w-4 h-4" />
          </button>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400">Public Surface</div>
              <div className="text-lg font-bold text-slate-100 mt-1">Product + Blog</div>
              <div className="text-sm text-slate-400 mt-1">Bots can’t see /#/app — publish to /product and /blog.</div>
            </div>
            <div className={`w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/20`}>
              <Globe className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/business-manager?tab=blog")}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold border border-cyan-500/20 flex items-center justify-center gap-2"
          >
            Open Blog <ArrowRight className="w-4 h-4" />
          </button>
        </Card>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Pluto Job Runner Status */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Pluto Job Runner
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">{liveStats.active} Active Job{liveStats.active !== 1 ? "s" : ""}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-8">
                <div className="text-center text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active jobs. Create a task to get started.</p>
                </div>
              </Card>
            ) : (
              recentJobs.map((job) => (
                <Card key={job.id} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {job.status === "running" && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>
                      )}
                      {job.status === "completed" && (
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {job.status === "queued" && (
                        <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{job.name}</div>
                        <div className="text-xs text-slate-400">{job.time}</div>
                      </div>
                    </div>
                    <Badge 
                      variant={job.status === "completed" ? "default" : "outline"}
                      className={`text-xs ${
                        job.status === "running" ? "border-cyan-500/40 text-cyan-400" : 
                        job.status === "completed" ? "bg-green-500/20 border-green-500/40 text-green-400" :
                        "border-slate-500/40 text-slate-400"
                      }`}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  {job.progress > 0 && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-1.5" />
                      <div className="text-xs text-slate-400 text-right">{job.progress}%</div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Atlas Access Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Atlas Control
            </h3>
          </div>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium mb-3">Today's Atlas Run</div>
              {growthRuns.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No runs today</div>
              ) : (
                growthRuns.slice(0, 5).map((run: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      run.status === "COMPLETED" ? "bg-green-400" :
                      run.status === "STARTED" ? "bg-yellow-400 animate-pulse" :
                      "bg-slate-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-300 truncate">{run.runDate?.slice(0, 10) ?? "—"}</div>
                      <div className="text-slate-500">{run.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-cyan-500/30 backdrop-blur-xl p-4">
            <div className="text-sm font-medium mb-2">Workforce</div>
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              <div className="flex-1">
                <div className="text-2xl font-bold text-white">{liveStats.agents}</div>
                <div className="text-xs text-slate-400">
                  Registered agents • {liveStats.auditEvents} audit events
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Quick Actions for New Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <button type="button" onClick={() => navigate("/app/business-manager")} className="group text-left">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-6 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Business Assets</h3>
            <p className="text-sm text-slate-400 mb-4">
              Manage your portfolio of businesses and assets (see Business Manager)
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <div className="text-slate-500">Businesses</div>
                <div className="text-slate-400 italic font-semibold">Live data</div>
              </div>
              <div>
                <div className="text-slate-500">Assets</div>
                <div className="text-slate-400 italic font-semibold">Live data</div>
              </div>
              <div>
                <div className="text-slate-500">Value</div>
                <div className="text-slate-400 italic font-semibold">Live data</div>
              </div>
            </div>
          </Card>
        </button>
        
        <button onClick={() => navigate("/app/settings")} className="group text-left w-full">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">GPU Acceleration</h3>
            <p className="text-sm text-slate-400 mb-4">
              Hardware acceleration active - 16.5x faster AI processing with RTX 4090
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <div className="text-slate-500">CPU Usage</div>
                <div className="text-blue-400 font-semibold">45%</div>
              </div>
              <div>
                <div className="text-slate-500">GPU Usage</div>
                <div className="text-cyan-400 font-semibold">32%</div>
              </div>
              <div>
                <div className="text-slate-500">Speed Boost</div>
                <div className="text-green-400 font-semibold">16.5x</div>
              </div>
            </div>
          </Card>
        </button>
      </div>
    </div>
  )
};
