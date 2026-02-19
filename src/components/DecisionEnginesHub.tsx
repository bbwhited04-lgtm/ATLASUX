import * as React from "react";
import { API_BASE } from "../lib/api";

type DecisionPresetId = "binky" | "tina" | "larry" | "jenny" | "benny" | "cheryl";

export type DecisionPacket = {
  packet_id: string;
  created_at: string; // ISO
  preset: DecisionPresetId;
  question: string;
  context: string;
  facts: Array<{ fact: string; source?: string }>;
  assumptions: string[];
  options: Array<{ option: string; pros: string[]; cons: string[] }>;
  risk_blast_radius: string[];
  cost: { money?: string; time?: string; complexity?: string };
  governance_checks: {
    requires_approval: boolean;
    requires_spend_gate: boolean;
    requires_audit_gate: boolean;
    touches_agent_tree: boolean;
    touches_microsoft_admin: boolean;
  };
  recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  next_actions: Array<{ owner: string; action: string }>;
};

const PRESETS: Array<{
  id: DecisionPresetId;
  label: string;
  lens: string;
  defaultOwners: string[];
}> = [
  { id: "binky", label: "BINKY — Research / Risk", lens: "Evidence-first. Citations required. Risk tiering.", defaultOwners: ["binky", "atlas"] },
  { id: "tina", label: "TINA — Finance / Spend", lens: "Budget caps, ROI/CAC/LTV, procurement guardrails.", defaultOwners: ["tina", "atlas"] },
  { id: "larry", label: "LARRY — Audit / Forensics", lens: "Traceability, ledger integrity, incident readiness.", defaultOwners: ["larry", "atlas"] },
  { id: "jenny", label: "JENNY — Legal / Compliance", lens: "PII, terms, liability, compliance posture.", defaultOwners: ["jenny", "atlas"] },
  { id: "benny", label: "BENNY — CTO / Engineering", lens: "Architecture impact, operational risk, test plan.", defaultOwners: ["benny", "atlas"] },
  { id: "cheryl", label: "CHERYL — Support / CX", lens: "Customer impact, SLA, escalation & messaging.", defaultOwners: ["cheryl", "atlas"] },
];

function uid() {
  return `pkt_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function makeTemplate(preset: DecisionPresetId, question: string, context: string): DecisionPacket {
  const now = new Date().toISOString();
  return {
    packet_id: uid(),
    created_at: now,
    preset,
    question: question.trim() || "Decision question (required)",
    context: context.trim() || "Context (required)",
    facts: [],
    assumptions: [],
    options: [
      { option: "Option A", pros: [], cons: [] },
      { option: "Option B", pros: [], cons: [] },
    ],
    risk_blast_radius: [],
    cost: {},
    governance_checks: {
      requires_approval: true,
      requires_spend_gate: false,
      requires_audit_gate: true,
      touches_agent_tree: false,
      touches_microsoft_admin: false,
    },
    recommendation: "REVIEW",
    next_actions: PRESETS.find((p) => p.id === preset)?.defaultOwners.map((o) => ({ owner: o, action: "Review packet" })) ?? [],
  };
}

async function postAudit(action: string, detail?: any) {
  await fetch(`${API_BASE}/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actor_type: "user",
      action,
      status: "success",
      detail,
    }),
  }).catch(() => null);
}

export function DecisionEnginesHub() {
  const [preset, setPreset] = React.useState<DecisionPresetId>("binky");
  const [question, setQuestion] = React.useState("");
  const [context, setContext] = React.useState("");
  const [packet, setPacket] = React.useState<DecisionPacket | null>(null);
  const [copied, setCopied] = React.useState(false);

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  const generate = async () => {
    const pkt = makeTemplate(preset, question, context);
    setPacket(pkt);
    await postAudit("decision.packet.generate", { preset, packet_id: pkt.packet_id });
  };

  const requestApproval = async () => {
    if (!packet) return;
    await postAudit("decision.packet.approval_requested", { preset, packet_id: packet.packet_id, question: packet.question });
    alert("Approval requested (audit logged). Paste this packet into the approval email thread.");
  };

  const copyJson = async () => {
    if (!packet) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/40 p-5 text-white">
        <div className="text-2xl font-bold tracking-tight">Executive Decision Engines</div>
        <div className="mt-1 text-base text-slate-200">
          One reasoning core, role-specific lenses. Output is a structured <span className="font-semibold text-white">Decision Packet</span> Atlas can approve/deny.
        </div>
        <div className="mt-3 text-sm text-slate-300">
          Lens: <span className="font-semibold text-white">{activePreset.lens}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-base font-bold text-slate-900">Build a packet</div>

          <label className="mt-4 block text-sm font-semibold text-slate-900">Preset</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as DecisionPresetId)}
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-500/40"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold text-slate-900">Decision question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What exactly are we deciding?"
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-500/40"
          />

          <label className="mt-4 block text-sm font-semibold text-slate-900">Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Trigger, constraints, background, goal."
            rows={6}
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-500/40"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={generate}
              className="rounded-xl bg-blue-700 px-4 py-2 text-base font-bold text-white hover:bg-blue-600"
            >
              Generate Packet
            </button>
            <button
              onClick={requestApproval}
              disabled={!packet}
              className="rounded-xl bg-slate-900 px-4 py-2 text-base font-bold text-white disabled:opacity-50"
            >
              Request Approval
            </button>
          </div>

          <div className="mt-3 text-sm text-slate-700">
            Packets are for <span className="font-semibold">informed decisions</span>. If you can’t cite facts, mark them unknown and route to BINKY.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-slate-900">Packet output</div>
            <button
              onClick={copyJson}
              disabled={!packet}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>

          {!packet ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-slate-700">
              Generate a packet to see structured output.
            </div>
          ) : (
            <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
{JSON.stringify(packet, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
