import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Circle,
  Sparkles,
  TrendingUp,
  Calendar,
  MessageSquare,
  Shield,
  Plug,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import * as React from "react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";

/* ── types ── */
interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  action?: { label: string; to: string };
}

/* ── helpers ── */
function greetingTime(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const navigate = useNavigate();
  const { tenantId } = useActiveTenant();

  /* live data */
  const [pendingDecisions, setPendingDecisions] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [channelCount, setChannelCount] = useState(0);
  const [spendUsd, setSpendUsd] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  /* fetch all dashboard data */
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const h = { "x-tenant-id": tenantId };

    (async () => {
      const [decisionsRes, jobsRes, agentsRes, accountingRes, channelsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=200`, { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/v1/jobs?status=running&limit=10`, { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/v1/agents`, { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/v1/accounting/summary`, { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/v1/postiz/channels`, { headers: { ...h, org_id: tenantId } }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/v1/audit/list?limit=8`, { headers: h }).then(r => r.json()).catch(() => ({})),
      ]);
      if (cancelled) return;

      setPendingDecisions(Array.isArray(decisionsRes?.memos) ? decisionsRes.memos.length : 0);

      const jobs: any[] = Array.isArray(jobsRes?.jobs) ? jobsRes.jobs : Array.isArray(jobsRes?.data) ? jobsRes.data : [];
      setActiveJobs(jobs.filter((j: any) => j.status === "running" || j.status === "RUNNING").length);
      setCompletedToday(typeof jobsRes?.completedToday === "number" ? jobsRes.completedToday : 0);

      setAgentCount(Array.isArray(agentsRes?.agents) ? agentsRes.agents.length : 0);

      const cents = accountingRes?.summary?.totalDebitsCents;
      setSpendUsd(typeof cents === "number" ? cents / 100 : 0);

      const chs: any[] = Array.isArray(channelsRes?.channels) ? channelsRes.channels : [];
      setChannelCount(chs.length);

      const auditItems = Array.isArray(auditRes?.items) ? auditRes.items : Array.isArray(auditRes?.rows) ? auditRes.rows : [];
      setRecentActivity(auditItems.slice(0, 6));
    })();

    const t = setInterval(() => {
      fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=200`, { headers: h })
        .then(r => r.json())
        .then(j => { if (!cancelled) setPendingDecisions(Array.isArray(j?.memos) ? j.memos.length : 0); })
        .catch(() => {});
    }, 30000);

    return () => { cancelled = true; clearInterval(t); };
  }, [tenantId]);

  /* ── steps: Atlas guides you ── */
  const steps: Step[] = useMemo(() => [
    {
      id: "business",
      label: "Set up your business",
      description: "Create a business profile so Atlas knows who you are",
      done: !!tenantId,
      action: { label: "Open Business Manager", to: "/app/business-manager" },
    },
    {
      id: "channels",
      label: "Connect your channels",
      description: "Link social accounts so Atlas can post and track metrics",
      done: channelCount > 0,
      action: { label: "Add Channels", to: "/app/settings?tab=integrations" },
    },
    {
      id: "review",
      label: "Review pending decisions",
      description: pendingDecisions > 0
        ? `${pendingDecisions} item${pendingDecisions !== 1 ? "s" : ""} waiting for your approval`
        : "Nothing to approve right now",
      done: pendingDecisions === 0 && !!tenantId,
      action: pendingDecisions > 0 ? { label: "Review Now", to: "/app/business-manager?tab=decisions" } : undefined,
    },
    {
      id: "analytics",
      label: "Check your analytics",
      description: "See how your brand is performing across all platforms",
      done: false, // always available
      action: { label: "View Analytics", to: "/app/brand" },
    },
  ], [tenantId, channelCount, pendingDecisions]);

  const completedSteps = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* ── Greeting ── */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          {greetingTime()}
        </h2>
        <p className="text-slate-400 text-sm">
          {nextStep
            ? <>Atlas recommends: <span className="text-cyan-400">{nextStep.label.toLowerCase()}</span></>
            : "Everything looks good. You're all set."
          }
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Setup progress</span>
          <span>{completedSteps}/{steps.length} complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isNext = step === nextStep;
          return (
            <Card
              key={step.id}
              className={`border transition-all ${
                step.done
                  ? "bg-slate-900/30 border-slate-800"
                  : isNext
                    ? "bg-slate-900/60 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                    : "bg-slate-900/40 border-slate-800/60"
              } p-4`}
            >
              <div className="flex items-start gap-4">
                {/* step indicator */}
                <div className="pt-0.5">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : isNext ? (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${step.done ? "text-slate-500 line-through" : "text-white"}`}>
                    {step.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${step.done ? "text-slate-600" : "text-slate-400"}`}>
                    {step.description}
                  </div>
                </div>

                {/* action */}
                {step.action && !step.done && (
                  <button
                    onClick={() => navigate(step.action!.to)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isNext
                        ? "bg-cyan-500 text-white hover:bg-cyan-400"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {step.action.label}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Channels", value: String(channelCount), icon: Plug, color: "text-cyan-400" },
          { label: "Agents", value: String(agentCount), icon: Sparkles, color: "text-purple-400" },
          { label: "Active Jobs", value: String(activeJobs), icon: Clock, color: "text-yellow-400" },
          { label: "Spend", value: `$${spendUsd.toFixed(2)}`, icon: Shield, color: "text-green-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <div>
                <div className="text-lg font-bold text-white leading-none">{s.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick nav ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "AI Chat", icon: MessageSquare, to: "/app/chat", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20" },
          { label: "Calendar", icon: Calendar, to: "/app/calendar", color: "from-purple-500/10 to-fuchsia-500/10 border-purple-500/20" },
          { label: "Analytics", icon: BarChart3, to: "/app/brand", color: "from-cyan-500/10 to-teal-500/10 border-cyan-500/20" },
          { label: "Decisions", icon: Shield, to: "/app/business-manager?tab=decisions", color: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
            badge: pendingDecisions > 0 ? pendingDecisions : undefined },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${item.color} border transition-all hover:scale-[1.02]`}
            >
              <Icon className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-200">{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto bg-red-500/20 text-red-300 border-red-500/30 text-[10px] px-1.5">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Recent activity ── */}
      {recentActivity.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Recent activity</h3>
            <button
              onClick={() => navigate("/app/settings?tab=audit")}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item: any, i: number) => (
              <div key={item?.id ?? i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-900/40 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-xs text-slate-400 truncate">
                  {item?.action ?? item?.event ?? "event"}
                </div>
                <div className="text-[10px] text-slate-600 flex-shrink-0">
                  {item?.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
