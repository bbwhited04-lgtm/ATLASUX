import * as React from "react";
import { API_BASE } from "../lib/api";
import { Send, RefreshCw, PlusCircle, Mail, ClipboardList } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  title: string;
  tier: string;
  reportsTo?: string | null;
  toolsAllowed?: string[];
  toolsForbidden?: string[];
};

type Workflow = { id: string; name: string; description: string; ownerAgent?: string };

export function AgentDeploymentHub() {
  const [tenantId, setTenantId] = React.useState("");
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [selectedAgent, setSelectedAgent] = React.useState<string>("atlas");

  // Task create
  const [taskTitle, setTaskTitle] = React.useState("Daily check-in");
  const [taskDesc, setTaskDesc] = React.useState("Run assigned workflow and report via email with audit trail.");
  const [taskWorkflow, setTaskWorkflow] = React.useState("WF-020");

  // Email send
  const [emailTo, setEmailTo] = React.useState("atlas@deadappcorp.org");
  const [emailSubject, setEmailSubject] = React.useState("Agent test ping");
  const [emailText, setEmailText] = React.useState("Test message from agent via Atlas UX outbox.");

  const [outbox, setOutbox] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  async function loadAll() {
    setLoading(true);
    setMsg("");
    try {
      const [aRes, wRes] = await Promise.all([
        fetch(`${API_BASE}/v1/agents`).then((r) => r.json()),
        fetch(`${API_BASE}/v1/workflows`).then((r) => r.json()),
      ]);
      if (aRes?.ok) setAgents(aRes.agents ?? []);
      if (wRes?.ok) setWorkflows(wRes.workflows ?? []);
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function refreshTasksAndOutbox() {
    if (!tenantId) {
      setMsg("Paste tenantId first.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const [tRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/v1/tasks?tenantId=${encodeURIComponent(tenantId)}&agentId=${encodeURIComponent(selectedAgent)}`).then((r) => r.json()),
        fetch(`${API_BASE}/v1/comms/outbox?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()),
      ]);
      if (tRes?.ok) setTasks(tRes.tasks ?? []);
      if (oRes?.ok) setOutbox(oRes.jobs ?? []);
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!tenantId) return setMsg("Paste tenantId first.");
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/v1/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          assignedAgentId: selectedAgent,
          title: taskTitle,
          description: taskDesc,
          workflowId: taskWorkflow,
          priority: 1,
        }),
      });
      const data = await res.json();
      if (!data?.ok) setMsg(data?.error ?? "Failed to create task");
      else setMsg(`Task created: ${data.taskId}`);
      await refreshTasksAndOutbox();
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function queueEmail() {
    if (!tenantId) return setMsg("Paste tenantId first.");
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/v1/comms/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          fromAgent: selectedAgent,
          to: emailTo,
          subject: emailSubject,
          text: emailText,
        }),
      });
      const data = await res.json();
      if (!data?.ok) setMsg(data?.error ?? "Failed to queue email");
      else setMsg(`Email queued: ${data.jobId}`);
      await refreshTasksAndOutbox();
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-white">Agent Deployment & Comms</div>
            <div className="text-base text-slate-900/80">
              Cloud-surface ops panel: view registry, create agent tasks, and queue agent emails (outbox).
            </div>
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-slate-900/40 px-3 py-2 text-sm text-slate-900 hover:bg-slate-900/70"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-base text-slate-800">Tenant ID</div>
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="paste tenant uuid"
              className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500/30"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-800">Selected Agent</div>
            <select
  value={selectedAgent}
  onChange={(e) => setSelectedAgent(e.target.value)}
  className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-500/40"
>
  <option value="atlas">atlas — ATLAS (President · Execution Layer)</option>

  <option value="binky">binky — BINKY (Chief Research Officer)</option>
  <option value="mercer">mercer — MERCER (Customer Acquisition Strategist)</option>
  <option value="archy">archy — ARCHY (Research Operations)</option>
  <option value="sunday">sunday — SUNDAY (Internal Intelligence)</option>

  <option value="benny">benny — BENNY (Chief Technology Officer)</option>
  <option value="tina">tina — TINA (Chief Financial Officer)</option>
  <option value="larry">larry — LARRY (Corporate Secretary · Audit & Forensics)</option>
  <option value="jenny">jenny — JENNY (Chief Legal Officer · Compliance)</option>

  <option value="cheryl">cheryl — CHERYL (Customer Support)</option>

  <option value="cornwall">cornwall — CORNWALL (Pinterest Publisher)</option>
  <option value="donna">donna — DONNA (Reddit Distribution)</option>
  <option value="dwight">dwight — DWIGHT (Threads Distribution)</option>
  <option value="emma">emma — EMMA (Alignable Distribution)</option>
  <option value="fran">fran — FRAN (Facebook Distribution)</option>
  <option value="kelly">kelly — KELLY (X Distribution)</option>
  <option value="link">link — LINK (LinkedIn Distribution)</option>
  <option value="penny">penny — PENNY (Facebook Ads)</option>
  <option value="reynolds">reynolds — REYNOLDS (Blogger Distribution)</option>
  <option value="terry">terry — TERRY (Tumblr Distribution)</option>
  <option value="timmy">timmy — TIMMY (TikTok Distribution)</option>
  <option value="venny">venny — VENNY (Videographer · Creative Assets)</option>

  <option value="abuse">abuse — ABUSE (Abuse Monitoring)</option>
  <option value="postmaster">postmaster — POSTMASTER (Mail Integrity)</option>
</select>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-800">Ops</div>
            <button
              onClick={refreshTasksAndOutbox}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <ClipboardList className="h-4 w-4" />
              Load Tasks + Outbox
            </button>
          </div>
        </div>

        {msg && <div className="mt-3 text-base text-amber-200">{msg}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-white">
            <PlusCircle className="h-5 w-5 text-cyan-300" />
            <div className="font-bold">Create Task</div>
          </div>
          <div className="mt-4 space-y-3">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500/30"
              placeholder="Task title"
            />
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="h-24 w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500/30"
              placeholder="Task description"
            />
            <select
              value={taskWorkflow}
              onChange={(e) => setTaskWorkflow(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-blue-500/30"
            >
              {(workflows.length ? workflows : []).map((w) => (
                <option key={w.id} value={w.id}>{w.id} — {w.name}</option>
              ))}
            </select>
            <button
              onClick={createTask}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-base text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-cyan-300" />
            <div className="font-semibold">Queue Email (Outbox)</div>
          </div>
          <div className="mt-4 space-y-3">
            <input
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-600 focus:ring-blue-500/30"
              placeholder="to@domain.com"
            />
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-600 focus:ring-blue-500/30"
              placeholder="subject"
            />
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="h-24 w-full rounded-lg bg-white px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-600 focus:ring-blue-500/30"
              placeholder="message"
            />
            <button
              onClick={queueEmail}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-base text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              Queue Email
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Tasks (AGENT_TASK)</div>
            <div className="text-xs text-slate-800">{tasks.length} items</div>
          </div>
          <div className="mt-3 space-y-2">
            {tasks.slice(0, 20).map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-700 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-base text-slate-900">{t.input?.title ?? t.id}</div>
                  <div className="text-base text-slate-800">{t.status}</div>
                </div>
                <div className="mt-1 text-xs text-slate-800/80">{t.input?.description ?? ""}</div>
                <div className="mt-2 text-[11px] text-slate-800">Workflow: {t.input?.workflowId ?? "—"}</div>
              </div>
            ))}
            {tasks.length === 0 && <div className="text-base text-slate-800">No tasks loaded.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Outbox (EMAIL_SEND)</div>
            <div className="text-xs text-slate-800">{outbox.length} items</div>
          </div>
          <div className="mt-3 space-y-2">
            {outbox.slice(0, 20).map((j) => (
              <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-base text-slate-900">{j.input?.subject ?? "Email"}</div>
                  <div className="text-base text-slate-800">{j.status}</div>
                </div>
                <div className="mt-1 text-xs text-slate-800/80">To: {j.input?.to}</div>
                <div className="mt-1 text-xs text-slate-800/80">From agent: {j.input?.fromAgent}</div>
              </div>
            ))}
            {outbox.length === 0 && <div className="text-base text-slate-800">No outbox items loaded.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
