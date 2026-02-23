import * as React from "react";
import { API_BASE } from "../lib/api";
import { Play, RefreshCw, Workflow, Power, Activity } from "lucide-react";
import { useActiveTenant } from "../lib/activeTenant";

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



type WorkflowItem = {
  id: string; // UI expects id; backend uses workflow_key
  name: string;
  description?: string;
  agent_key?: string;
  status?: string;
  version?: string;
};
const DEFAULT_WORKFLOWS: WorkflowItem[] = [
  { id: "WF-001", name: "Support Intake (Cheryl)", description: "Create ticket → classify → acknowledge → route → audit." },
  { id: "WF-002", name: "Support Escalation (Cheryl)", description: "Package escalation packet and route to the correct executive owner." },
  { id: "WF-010", name: "Daily Executive Brief (Binky)", description: "Daily intel digest with internal traceability." },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)", description: "Minimal end-to-end cloud surface verification." },
  { id: "WF-021", name: "Bootstrap Atlas (Atlas)", description: "Boot → discover agents → seed tasks → queue boot email → await command." },
];

export function WorkflowsHub() {
  const { tenantId: activeTenantId, setTenantId: setActiveTenantId } = useActiveTenant();
  const [tenantId, setTenantId] = React.useState<string>(activeTenantId ?? "");
  const [agentId, setAgentId] = React.useState<string>("atlas");
  const [workflowId, setWorkflowId] = React.useState<string>("WF-021");
  const [intentId, setIntentId] = React.useState<string>("");
  const [runResp, setRunResp] = React.useState<RunResponse | null>(null);
  const [status, setStatus] = React.useState<RunStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>(DEFAULT_WORKFLOWS);
  const [atlasOnline, setAtlasOnline] = React.useState<boolean | null>(null);
  const [atlasStateLoading, setAtlasStateLoading] = React.useState(false);
  const [atlasStateErr, setAtlasStateErr] = React.useState<string | null>(null);

  // Manual input payload (alpha): lets you run workflows that require fields (ex: WF-001 customerEmail)
  const storageKey = React.useMemo(
    () => `atlasux.workflowInput.${tenantId || "_"}.${agentId}.${workflowId}`,
    [tenantId, agentId, workflowId]
  );
  const [inputJson, setInputJson] = React.useState<string>("{}");

  const templates: Record<string, any> = React.useMemo(
    () => ({
      "WF-001": {
        customerEmail: "test@deadapp.info",
        subject: "Install help",
        message: "Need assistance installing Atlas UX",
      },
      "WF-002": {
        ticketId: "TKT-0001",
        reason: "Escalate to Atlas",
        notes: "Customer blocked; include repro steps + logs",
      },
      "WF-010": {
        date: new Date().toISOString().slice(0, 10),
      },
    }),
    []
  );

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setInputJson(saved);
      } else if (templates[workflowId]) {
        setInputJson(JSON.stringify(templates[workflowId], null, 2));
      } else {
        setInputJson("{}");
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, workflowId]);

React.useEffect(() => {
  // prefer backend-provided catalog if available
  fetch(`${API_BASE}/v1/workflows`)
    .then((r) => r.json())
    .then((d) => {
      const rows = Array.isArray(d?.workflows) ? d.workflows : [];
      const normalized: WorkflowItem[] = rows
        .map((w: any) => {
          const id = String(w?.workflow_key ?? w?.id ?? w?.workflowId ?? "").trim();
          if (!id) return null;
          return {
            id,
            name: String(w?.name ?? id),
            description: w?.description ? String(w.description) : undefined,
            agent_key: w?.agent_key ? String(w.agent_key) : (w?.agentKey ? String(w.agentKey) : undefined),
            status: w?.status ? String(w.status) : undefined,
            version: w?.version ? String(w.version) : undefined,
          } as WorkflowItem;
        })
        .filter(Boolean) as WorkflowItem[];

      if (d?.ok && normalized.length) {
        setWorkflows(normalized);
      }
    })
    .catch(() => {});
}, []);

  // keep local input in sync if global tenant changes (but don't clobber manual edits)
  React.useEffect(() => {
    if (!tenantId && activeTenantId) setTenantId(activeTenantId);
  }, [activeTenantId, tenantId]);

  async function run() {
    setLoading(true);
    setRunResp(null);
    setStatus(null);

    try {
      let input: any = {};
      try {
        input = inputJson?.trim() ? JSON.parse(inputJson) : {};
      } catch {
        // If JSON is invalid, fail fast with a helpful error
        setRunResp({ ok: false, error: "Input JSON is invalid. Fix it and try again." });
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(input, null, 2));
      } catch {
        // ignore
      }

      const res = await fetch(`${API_BASE}/v1/engine/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          agentId,
          workflowId,
          input,
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

  async function fetchAtlasState() {
    setAtlasStateLoading(true);
    setAtlasStateErr(null);
    try {
      const res = await fetch(`${API_BASE}/v1/api/system/state/atlas_online`);
      const data = (await res.json()) as any;
      const v = String(data?.state?.value ?? "");
      if (!data?.ok) throw new Error(data?.error ?? "Failed to read atlas state");
      if (v === "true") setAtlasOnline(true);
      else if (v === "false") setAtlasOnline(false);
      else setAtlasOnline(null);
    } catch (e: any) {
      setAtlasStateErr(e?.message ?? String(e));
      setAtlasOnline(null);
    } finally {
      setAtlasStateLoading(false);
    }
  }

  async function setAtlasOnlineState(next: boolean) {
    setAtlasStateLoading(true);
    setAtlasStateErr(null);
    try {
      const url = next ? `${API_BASE}/v1/api/system/atlas/online` : `${API_BASE}/v1/api/system/atlas/offline`;
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const data = (await res.json()) as any;
      if (!data?.ok) throw new Error(data?.error ?? "Failed to set atlas state");
      const v = String(data?.state?.value ?? "");
      setAtlasOnline(v === "true");
    } catch (e: any) {
      setAtlasStateErr(e?.message ?? String(e));
    } finally {
      setAtlasStateLoading(false);
    }
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
              onChange={(e) => {
                const v = e.target.value;
                setTenantId(v);
                // Persist once it looks like a uuid-ish value
                if (v && v.length >= 16) setActiveTenantId(v);
              }}
              placeholder="paste tenant uuid"
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 px-3 py-2 text-base text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 px-3 py-2 text-base text-slate-900 outline-none"
            >
              <option value="atlas">Atlas ~ CEO</option>
              <option value="binky">Binky ~ CRO</option>
              <option value="cheryl">Cheryl ~ CSO</option>
              <option value="tina">Tina ~ CFO</option>
              <option value="larry">Larry ~ Auditor</option>
              <option value="benny">Benny ~ CTO</option>
              <option value="jenny">Jenny ~ CLO</option>
              <option value="archy">Archy ~ Team Binky</option>
              <option value="cornwall">Cornwall ~ Pinterest Agent</option>
              <option value="donna">Donna ~ Redditor</option>
              <option value="dwight">Dwight ~ Threads Agent</option>
              <option value="emma">Emma ~ Alignable Agent</option>
              <option value="fran">Fran ~ Facebook Agent</option>
              <option value="kelly">Kelly ~ X Agent</option>
              <option value="link">Link ~ LinkedIn Agent</option>
              <option value="mercer">Mercer ~ Customer Aquisition</option>
              <option value="penny">Penny ~ Facebook Pages</option>
              <option value="reynolds">Reynolds ~ Blogger</option>
              <option value="sunday">Sunday ~ Team Binky Tech Doc Writer</option>
              <option value="terry">Terry ~ Tumblr Agent</option>
              <option value="timmy">Timmy ~ Tiktok Agent</option>
              <option value="venny">Venny ~ Videographer</option>
            </select>
          </div>

          <div>
            <label className="text-base text-slate-600">Workflow</label>
            <select
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-base text-slate-900 outline-none"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>{w.id} — {w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-600">Input (JSON) — sent as <code className="text-slate-800">payload.input</code></label>
            {templates[workflowId] ? (
              <button
                type="button"
                onClick={() => setInputJson(JSON.stringify(templates[workflowId], null, 2))}
                className="text-xs text-slate-700 hover:text-slate-900 underline"
              >
                Load template
              </button>
            ) : null}
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 outline-none"
            spellCheck={false}
          />
          <div className="mt-1 text-xs text-slate-500">
            Tip: WF-001 needs <span className="font-mono">customerEmail</span>. Until inbound email is wired, paste it here.
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={run}
            disabled={loading || !tenantId}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-red-500 px-4 py-2 text-base font-semibold text-red-600 hover:bg-red-50 disabled:opacity-100 disabled:bg-white disabled:text-red-400 disabled:border-red-300"
>
            <Play className="h-4 w-4" /> Run (creates intent + 1 tick)
          </button>

          <button
            onClick={refresh}
            disabled={loading || !intentId}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900/40 border border-cyan-500/10 px-4 py-2 text-base text-slate-700 hover:bg-slate-900/60 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh status
          </button>

          
          <button
            onClick={() => setAtlasOnlineState(!(atlasOnline ?? false))}
            disabled={atlasStateLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-base text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            title="Toggle Atlas online/offline (system state)"
          >
            <Power className="h-4 w-4" />
            Atlas: {atlasOnline === null ? "unknown" : atlasOnline ? "online" : "offline"}
          </button>

          <button
            onClick={fetchAtlasState}
            disabled={atlasStateLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-base text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            title="Refresh Atlas state"
          >
            <Activity className="h-4 w-4" /> State
          </button>
<div className="text-base text-slate-800 self-center">
            Backend: <span className="text-slate-800">{API_BASE}</span>
          </div>
        </div>

        {atlasStateErr ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Atlas state error: {atlasStateErr}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-base text-slate-800">Workflow Map</div>
            <ul className="mt-2 space-y-2 text-xs text-slate-700">
              {workflows.map((w) => (
                <li key={w.id}>
                  <div className="text-slate-800">{w.id} — {w.name}</div>
                  <div className="text-slate-800">{w.description}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-3">
            <div className="text-base text-slate-800">Latest Run</div>
            <div className="mt-2 text-base text-slate-800 space-y-2">
              <div>intentId: <span className="text-slate-800">{intentId || "—"}</span></div>

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
