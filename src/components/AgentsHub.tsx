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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base text-slate-800">{agent.tier}</div>
          <div className="text-lg font-semibold text-slate-900">{agent.name}</div>
          <div className="text-base text-blue-700">{agent.title}</div>
        </div>
        <div className="text-sm text-slate-800">Reports to: <span className="text-slate-800">{agent.reportsTo ?? "—"}</span></div>
      </div>

      <p className="mt-4 text-base text-slate-800/90">{agent.summary}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white border border-slate-200 p-3">
          <div className="text-sm font-bold text-slate-800">Authority</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-800">
            {agent.authority.map((x) => (
              <li key={x} className="leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-3">
          <div className="text-sm font-bold text-slate-800">Constraints</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-800">
            {agent.constraints.map((x) => (
              <li key={x} className="leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-3">
          <div className="text-sm font-bold text-slate-800">Primary Outputs</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-800">
            {agent.primaryOutputs.map((x) => (
              <li key={x} className="leading-snug">• {x}</li>
            ))}
          </ul>
        </div>
      </div>

      {(agent.toolsAllowed?.length || agent.toolsForbidden?.length) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-sm font-bold text-slate-800">Tools Allowed</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-800">
              {(agent.toolsAllowed ?? []).map((x) => (
                <li key={x} className="leading-snug">• {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-sm font-bold text-slate-800">Tools Forbidden</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-800">
              {(agent.toolsForbidden ?? []).map((x) => (
                <li key={x} className="leading-snug">• {x}</li>
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
        <Icon className="h-5 w-5 text-cyan-300" />
        <h2 className="text-base font-semibold text-white">{title}</h2>
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
    <div className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="text-base text-slate-800">
            Constitutional hierarchy · roles · authority · constraints
          </p>
        </div>
        <div className="relative w-full md:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-800" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search agents, authority, constraints…"
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3 py-2 text-base text-slate-900 placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-800">Execution Rule</div>
        <div className="mt-1 text-base text-slate-800">
          Only <span className="text-cyan-300 font-semibold">Atlas</span> executes. All other agents advise, review, and produce packets.
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={(v) => setTab(v)} className="mt-6">
        <Tabs.List className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          <Tabs.Trigger value="atlas" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Briefcase className="inline h-4 w-4 mr-2" /> Atlas + Staff
          </Tabs.Trigger>
          <Tabs.Trigger value="binky" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="inline h-4 w-4 mr-2" /> Binky + Crew
          </Tabs.Trigger>
          <Tabs.Trigger value="board" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Crown className="inline h-4 w-4 mr-2" /> Board & Governors
          </Tabs.Trigger>

          <Tabs.Trigger value="workflows" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <WorkflowIcon className="inline h-4 w-4 mr-2" /> Workflows
          </Tabs.Trigger>
          <Tabs.Trigger value="tools" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Wrench className="inline h-4 w-4 mr-2" /> Tools
          </Tabs.Trigger>
          <Tabs.Trigger value="deployment" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Bell className="inline h-4 w-4 mr-2" /> Deployment
          </Tabs.Trigger>
          <Tabs.Trigger value="automation" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Zap className="inline h-4 w-4 mr-2" /> Automation
          </Tabs.Trigger>
          <Tabs.Trigger value="engines" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Cpu className="inline h-4 w-4 mr-2" /> Exec Engines
          </Tabs.Trigger>

          <Tabs.Trigger value="all" className="px-4 py-2 text-base rounded-xl text-slate-800 hover:bg-slate-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            All
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="atlas" className="mt-4">
          <Section title="Atlas Execution Layer" icon={Briefcase} rootId="atlas" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {AGENTS.filter((a) => a.reportsTo === "atlas" && a.id !== "binky").map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="binky" className="mt-4">
          <Section title="Binky Research Command" icon={Shield} rootId="binky" />
        </Tabs.Content>

        <Tabs.Content value="board" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {["atlas", "tina", "larry", "jenny", "benny"].map((id) => {
              const a = AGENTS.find((x) => x.id === id);
              return a ? <AgentCard key={id} agent={a} /> : null;
            })}
          </div>
        </Tabs.Content>

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