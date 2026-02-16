import * as React from "react";
import { Wrench, ShieldCheck, Lock, Workflow, Server, KeyRound } from "lucide-react";

type ToolRow = {
  name: string;
  type: "Core" | "Guard" | "Runtime";
  status: "Active" | "Planned";
  description: string;
};

const TOOLS: ToolRow[] = [
  {
    name: "SGL (Safety + Governance Layer)",
    type: "Guard",
    status: "Active",
    description: "Evaluates intents (ALLOW/REVIEW/BLOCK). No execution bypass.",
  },
  {
    name: "Human-in-Loop Approvals",
    type: "Guard",
    status: "Planned",
    description: "Second key for REVIEW intents (payload-hash approvals).",
  },
  {
    name: "Audit Trail (Append-Only)",
    type: "Guard",
    status: "Active",
    description: "Immutable event stream for causality and forensic traceability.",
  },
  {
    name: "Agent Registry",
    type: "Core",
    status: "Planned",
    description: "Defines roles/goals/authority; connects to policy docs.",
  },
  {
    name: "Intent Queue",
    type: "Runtime",
    status: "Planned",
    description: "Durable queue for actions; supports retries and approvals.",
  },
  {
    name: "Local Agent Engine (Crew-style)",
    type: "Runtime",
    status: "Planned",
    description: "Local-first multi-agent orchestration without cloud dependency.",
  },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">
      {children}
    </span>
  );
}

export function ToolsHub() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tools</h1>
          <p className="text-sm text-slate-400">Internal capabilities that agents can use (governed by SGL).</p>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Wrench className="h-5 w-5 text-cyan-300" />
          <Badge>Constitution-first</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/40 p-5">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <div className="font-semibold">Governance</div>
          </div>
          <div className="mt-2 text-sm text-slate-300">Every action becomes an intent, evaluated before execution.</div>
        </div>
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/40 p-5">
          <div className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5 text-cyan-300" />
            <div className="font-semibold">No Backdoors</div>
          </div>
          <div className="mt-2 text-sm text-slate-300">No override switches. Bypass attempts trigger shutdown + audit.</div>
        </div>
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/40 p-5">
          <div className="flex items-center gap-2 text-white">
            <KeyRound className="h-5 w-5 text-cyan-300" />
            <div className="font-semibold">Two-Key Control</div>
          </div>
          <div className="mt-2 text-sm text-slate-300">REVIEW actions require explicit human approval before execution.</div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-500/10 bg-slate-950/30">
        <div className="grid grid-cols-12 gap-2 border-b border-cyan-500/10 px-4 py-3 text-xs text-slate-400">
          <div className="col-span-4">Tool</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-4">Description</div>
        </div>
        {TOOLS.map((t) => (
          <div key={t.name} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-200 border-b border-cyan-500/5 last:border-b-0">
            <div className="col-span-4 font-medium text-white flex items-center gap-2">
              {t.type === "Guard" ? <ShieldCheck className="h-4 w-4 text-cyan-300" /> : t.type === "Runtime" ? <Server className="h-4 w-4 text-cyan-300" /> : <Workflow className="h-4 w-4 text-cyan-300" />}
              {t.name}
            </div>
            <div className="col-span-2"><Badge>{t.type}</Badge></div>
            <div className="col-span-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${t.status === "Active" ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20" : "bg-amber-500/15 text-amber-200 border border-amber-500/20"}`}>
                {t.status}
              </span>
            </div>
            <div className="col-span-4 text-slate-300">{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
