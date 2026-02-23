import * as React from "react";
import { API_BASE } from "../lib/api";
import { Play, RefreshCw, Workflow } from "lucide-react";
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
  const storageKey = React.useMemo(
    () => `atlasux.workflowInput.${tenantId || "_"}.${agentId}.${workflowId}`,
    [tenantId, agentId, workflowId]
  );

  const templateFor = React.useCallback((wf: string) => {
    // Minimal, high-signal templates so you can run workflows before full ingest pipelines exist.
    switch (wf) {
      case "WF-001":
        return {
          customerEmail: "test@deadapp.info",
          subject: "Install help",
          message: "Need assistance installing Atlas UX",
          source: "manual_ui",
        };
      case "WF-002":
        return {
          ticketId: "TKT-0001",
          reason: "Escalation needed",
          notes: "Customer blocked; needs executive review",
          source: "manual_ui",
        };
      case "WF-010":
        return {
          date: new Date().toISOString(),
          focus: "daily executive brief",
          source: "manual_ui",
        };
      case "WF-020":
        return { source: "manual_ui" };
      case "WF-021":
        return { source: "manual_ui" };
      default:
        return { source: "manual_ui" };
    }
  }, []);

  const [inputText, setInputText] = React.useState<string>(() => {
    try {
      const v = localStorage.getItem(`atlasux.workflowInput._._.${"WF-021"}`);
      if (v) return v;
    } catch {}
    return JSON.stringify(templateFor("WF-021"), null, 2);
  });
  const [inputError, setInputError] = React.useState<string>("");
  const [intentId, setIntentId] = React.useState<string>("");
  const [runResp, setRunResp] = React.useState<RunResponse | null>(null);
  const [status, setStatus] = React.useState<RunStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>(DEFAULT_WORKFLOWS);

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

  // Load saved input when tenant/agent/workflow changes; otherwise use template.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved.trim()) {
        setInputText(saved);
        setInputError("");
        return;
      }
    } catch {}
    setInputText(JSON.stringify(templateFor(workflowId), null, 2));
    setInputError("");
  }, [storageKey, templateFor, workflowId]);

  // Persist input as you type.
  React.useEffect(() => {
    try {
      if (inputText && storageKey) localStorage.setItem(storageKey, inputText);
    } catch {}
  }, [inputText, storageKey]);

  function parseInput(): { ok: true; value: any } | { ok: false; error: string } {
    const txt = (inputText ?? "").trim();
    if (!txt) return { ok: true, value: {} };
    try {
      const v = JSON.parse(txt);
      return { ok: true, value: v };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Invalid JSON" };
    }
  }

  async function run() {
    setLoading(true);
    setRunResp(null);
    setStatus(null);

    const parsed = parseInput();
    if (!parsed.ok) {
      setInputError(parsed.error);
      setLoading(false);
      return;
    }
    setInputError("");

    try {
      const res = await fetch(`${API_BASE}/v1/engine/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          agentId,
          workflowId,
          input: parsed.value ?? {},
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
              className="mt-1 w-full rounded-xl bg-white border border-slate-400 px-3 py-2 text-base text-slate-900 outline-none"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>{w.id} — {w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-semibold text-slate-800">Input (JSON)</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputText(JSON.stringify(templateFor(workflowId), null, 2))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Load template
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("{}")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              spellCheck={false}
              className="mt-2 h-44 w-full resize-y rounded-xl border border-slate-400 bg-white px-3 py-2 font-mono text-[12px] text-slate-900 outline-none"
              placeholder='{"customerEmail":"test@deadapp.info","subject":"Install help","message":"..."}'
            />
            {inputError ? (
              <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                Invalid JSON: {inputError}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">
                Tip: WF-001 requires <code className="text-slate-700">customerEmail</code>. Until email ingest exists, paste it here.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-base font-semibold text-slate-800">How this helps</div>
            <div className="mt-2 text-sm text-slate-700 space-y-2">
              <p>
                You don&apos;t have an email ingest pipeline yet, so support flows (WF-001) need manual input.
                This box lets you inject the same payload the future email webhook/poller will send.
              </p>
              <p className="text-xs text-slate-500">
                Saved per tenant + agent + workflow in your browser so you don&apos;t retype.
              </p>
            </div>
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

          <div className="text-base text-slate-800 self-center">
            Backend: <span className="text-slate-800">{API_BASE}</span>
          </div>
        </div>

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
