import * as React from "react";
import { API_BASE } from "../lib/api";
import { Play, RefreshCw, Workflow } from "lucide-react";

type RunResponse = {
  ok: boolean;
  intentId?: string;
  tickResult?: unknown;
  error?: string;
};

type RunStatus = {
  ok: boolean;
  intent?: any;
  audits?: any[];
  error?: string;
};

const DEFAULT_WORKFLOWS = [
  { id: "WF-001", name: "Support Intake (Cheryl)", description: "Create ticket → classify → acknowledge → route → audit." },
  { id: "WF-002", name: "Support Escalation (Cheryl)", description: "Package escalation packet and route to the correct executive owner." },
  { id: "WF-010", name: "Daily Executive Brief (Binky)", description: "Daily intel digest with internal traceability." },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)", description: "Minimal end-to-end cloud surface verification." },
];

export function WorkflowsHub() {
  const [tenantId, setTenantId] = React.useState<string>(""); // you can paste from Settings/DB
  const [agentId, setAgentId] = React.useState<string>("atlas");
  const [workflowId, setWorkflowId] = React.useState<string>("WF-020");
  const [intentId, setIntentId] = React.useState<string>("");
  const [runResp, setRunResp] = React.useState<RunResponse | null>(null);
  const [status, setStatus] = React.useState<RunStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<typeof DEFAULT_WORKFLOWS>(DEFAULT_WORKFLOWS as any);

React.useEffect(() => {
  // prefer backend-provided catalog if available
  fetch(`${API_BASE}/v1/workflows`)
    .then((r) => r.json())
    .then((d) => {
      if (d?.ok && Array.isArray(d.workflows) && d.workflows.length) {
        setWorkflows(d.workflows);
      }
    })
    .catch(() => {});
}, []);

  async function run() {
    setLoading(true);
    setRunResp(null);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/v1/engine/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          agentId,
          workflowId,
          input: {},
          runTickNow: true,
        }),
      });
      const data = (await res.json()) as RunResponse;
      setRunResp(data);
      if (data.intentId) setIntentId(data.intentId);
    } catch (e: any) {
      setRunResp({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!intentId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/engine/runs/${intentId}`);
      const data = (await res.json()) as RunStatus;
      setStatus(data);
    } catch (e: any) {
      setStatus({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-cyan-300" />
            <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
          </div>
          <p className="text-sm text-slate-600">
            Workflow maps + engine smoke tests for the cloud surface.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-600">Tenant ID (uuid)</label>
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="paste tenant uuid"
              className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
            >
              <option value="atlas">atlas</option>
              <option value="binky">binky</option>
              <option value="cheryl">cheryl</option>
              <option value="tina">tina</option>
              <option value="larry">larry</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Workflow</label>
            <select
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
            >
              {(workflows as any).map((w: any) => (
                <option key={w.id} value={w.id}>{w.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={run}
            disabled={loading || !tenantId}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Run (creates intent + 1 tick)
          </button>

          <button
            onClick={refresh}
            disabled={loading || !intentId}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900/40 border border-cyan-500/10 px-4 py-2 text-sm text-slate-700 hover:bg-slate-900/60 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh status
          </button>

          <div className="text-xs text-slate-600 self-center">
            Backend: <span className="text-slate-700">{API_BASE}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-xs text-slate-600">Workflow Map</div>
            <ul className="mt-2 space-y-2 text-xs text-slate-700">
              {(workflows as any).map((w: any) => (
                <li key={w.id}>
                  <div className="text-slate-100">{w.id} — {w.name}</div>
                  <div className="text-slate-600">{w.description}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-xs text-slate-600">Latest Run</div>
            <div className="mt-2 text-xs text-slate-700 space-y-2">
              <div>intentId: <span className="text-slate-100">{intentId || "—"}</span></div>

              {runResp && (
                <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-800">
{JSON.stringify(runResp, null, 2)}
                </pre>
              )}

              {status && (
                <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-800">
{JSON.stringify(status, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Note: For now, workflows are documented in <code className="text-slate-600">/workflows</code>. Next step is loading specs into the engine runner.
      </div>
    </div>
  );
}
