import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Shield, Crown, Briefcase, Search, Wrench, Workflow as WorkflowIcon, Bell, Zap, Cpu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToolsHub } from "./ToolsHub";
import { WorkflowsHub } from "./WorkflowsHub";
import { AgentDeploymentHub } from "./AgentDeploymentHub";
import { TaskAutomation } from "./TaskAutomation";
import { DecisionEnginesHub } from "./DecisionEnginesHub";
import { AGENTS, getChildren, type AgentNode } from "../core/agents/registry";

function AgentCard({ agent }: { agent: AgentNode }) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-5 hover:bg-slate-900/70 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-cyan-400 font-medium uppercase tracking-wide">{agent.tier}</div>
          <div className="text-lg font-semibold text-white mt-0.5">{agent.name}</div>
          <div className="text-sm text-slate-400">{agent.title}</div>
        </div>
        <div className="text-xs text-slate-500 text-right flex-shrink-0">
          Reports to<br />
          <span className="text-slate-300">{agent.reportsTo ?? "—"}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400 leading-relaxed">{agent.summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-950/60 border border-cyan-500/10 p-3">
          <div className="text-xs font-semibold text-cyan-400 mb-2">Authority</div>
          <ul className="space-y-1">
            {agent.authority.map((x) => (
              <li key={x} className="text-xs text-slate-400 leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-cyan-500/10 p-3">
          <div className="text-xs font-semibold text-amber-400 mb-2">Constraints</div>
          <ul className="space-y-1">
            {agent.constraints.map((x) => (
              <li key={x} className="text-xs text-slate-400 leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-cyan-500/10 p-3">
          <div className="text-xs font-semibold text-emerald-400 mb-2">Primary Outputs</div>
          <ul className="space-y-1">
            {agent.primaryOutputs.map((x) => (
              <li key={x} className="text-xs text-slate-400 leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
      </div>

      {(agent.toolsAllowed?.length || agent.toolsForbidden?.length) && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-950/60 border border-cyan-500/10 p-3">
            <div className="text-xs font-semibold text-blue-400 mb-2">Tools Allowed</div>
            <ul className="space-y-1">
              {(agent.toolsAllowed ?? []).map((x) => (
                <li key={x} className="text-xs text-slate-400 leading-snug">• {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-slate-950/60 border border-cyan-500/10 p-3">
            <div className="text-xs font-semibold text-red-400 mb-2">Tools Forbidden</div>
            <ul className="space-y-1">
              {(agent.toolsForbidden ?? []).map((x) => (
                <li key={x} className="text-xs text-slate-400 leading-snug">• {x}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, rootId }: { title: string; icon: any; rootId: string }) {
  const root = AGENTS.find((a) => a.id === rootId);
  const children = getChildren(rootId);
  if (!root) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
      </div>
      <AgentCard agent={root} />
      {children.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentsHub() {
  const [q, setQ] = React.useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = React.useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = (sp.get("view") || "atlas").toLowerCase();
    const allowed = new Set(["atlas","binky","board","all","tools","workflows","deployment","automation","engines"]);
    return allowed.has(v) ? v : "atlas";
  }, [location.search]);
  const [tab, setTab] = React.useState<string>(initialTab);
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);
  React.useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const current = (sp.get("view") || "atlas").toLowerCase();
    if (current !== tab) {
      sp.set("view", tab);
      navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return AGENTS;
    return AGENTS.filter((a) =>
      [a.id, a.name, a.title, a.summary, ...(a.authority ?? []), ...(a.constraints ?? []), ...(a.toolsAllowed ?? []), ...(a.toolsForbidden ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Agents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Constitutional hierarchy · roles · authority · constraints
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search agents, authority, constraints…"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Execution Rule Banner */}
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl px-4 py-3">
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Execution Rule · </span>
        <span className="text-sm text-slate-300">
          Only <span className="text-cyan-400 font-semibold">Atlas</span> executes. All other agents advise, review, and produce packets.
        </span>
      </div>

      {/* Tabs */}
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v)}>
        <Tabs.List className="flex flex-wrap gap-2 rounded-xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-2">
          {[
            { value: "atlas",      Icon: Briefcase,     label: "Atlas + Staff" },
            { value: "binky",      Icon: Shield,        label: "Binky + Crew" },
            { value: "board",      Icon: Crown,         label: "Board & Governors" },
            { value: "workflows",  Icon: WorkflowIcon,  label: "Workflows" },
            { value: "tools",      Icon: Wrench,        label: "Tools" },
            { value: "deployment", Icon: Bell,          label: "Deployment" },
            { value: "automation", Icon: Zap,           label: "Automation" },
            { value: "engines",    Icon: Cpu,           label: "Exec Engines" },
            { value: "all",        Icon: Search,        label: "All" },
          ].map(({ value, Icon, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
          

        <Tabs.Content value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="workflows" className="mt-4">
          <WorkflowsHub />
        </Tabs.Content>

        <Tabs.Content value="tools" className="mt-4">
          <ToolsHub />
        </Tabs.Content>

        <Tabs.Content value="deployment" className="mt-4">
          <AgentDeploymentHub />
        </Tabs.Content>

        <Tabs.Content value="automation" className="mt-4">
          <TaskAutomation />
        </Tabs.Content>

        <Tabs.Content value="engines" className="mt-4">
          <DecisionEnginesHub />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
