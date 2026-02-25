import { API_BASE } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useActiveTenant } from "@/lib/activeTenant";
import { useSearchParams } from "react-router-dom";
import {
  Zap,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  FileText,
  Send,
  Mail,
  Users,
  DollarSign,
  FileCheck,
  ArrowRight,
  Plus,
  Settings,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Copy,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface WorkflowStep {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: "pending" | "running" | "complete" | "error";
  duration?: string;
}

interface Workflow {
  id: string;
  name: string;
  cadence: "once" | "daily" | "weekly";
  prompt: string;
  category: "content" | "business" | "finance" | "marketing";
  description: string;
  steps: WorkflowStep[];
  status: "idle" | "running" | "complete";
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
}

function StepIcon({ icon: Icon, className }: { icon: any; className?: string }) {
  return <Icon className={className ?? "w-4 h-4"} />;
}

export function TaskAutomation() {
  // ----------------------------
  // Hooks FIRST (must be top-level)
  // ----------------------------
  const { tenantId: activeTenantId } = useActiveTenant();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrompt, setCreatePrompt] = useState("");
  const [createName, setCreateName] = useState("Morning Content");
  const [createCadence, setCreateCadence] = useState<"once" | "daily" | "weekly">("daily");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // If the user clicked "New Task" from Dashboard (/?new=1), open the dialog automatically.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      // clear param so refresh doesn't re-open
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // Defaults (stable)
  // ----------------------------
  const defaultSteps = useMemo<WorkflowStep[]>(
    () => [
      { id: "plan", name: "Plan", icon: FileText, color: "cyan", status: "pending" },
      { id: "create", name: "Create", icon: Video, color: "purple", status: "pending" },
      { id: "review", name: "Review", icon: CheckCircle2, color: "green", status: "pending" },
      { id: "publish", name: "Publish", icon: Send, color: "blue", status: "pending" },
    ],
    []
  );

  // ----------------------------
  // Backend mapping: Workflow -> Job
  // ----------------------------
  async function startWorkflowJob(workflow: Workflow) {
    const tenantId = activeTenantId ?? "";
    if (!tenantId) throw new Error("No active tenant selected. Select a Business first.");

const res = await fetch(`${API_BASE}/v1/engine/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tenantId,
    agentId: "binky",
    workflowId: workflow.id,
    input: {
      name: workflow.name,
      cadence: workflow.cadence,
      prompt: workflow.prompt,
      steps: workflow.steps ?? [],
      category: workflow.category,
    },
    runTickNow: true,
  }),
});

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to start workflow job: ${res.status} ${text}`);
    }

    return res.json();
  }

  // ----------------------------
  // Local helpers
  // ----------------------------
  const createWorkflow = () => {
    const id = `wf_${Date.now()}`;
    const now = new Date().toISOString();
    const nextRun = createCadence === "once" ? undefined : now;

    const wf: Workflow = {
      id,
      name: createName.trim() || "New Workflow",
      cadence: createCadence,
      prompt: createPrompt,
      category: "content",
      description: "Auto-generated workflow",
      steps: defaultSteps.map((s) => ({ ...s })),
      status: "idle",
      lastRun: undefined,
      enabled: true,
      nextRun,
    };

    setWorkflows((prev) => [wf, ...prev]);
    setSelectedWorkflow(wf);
    setCreateOpen(false);
    setCreatePrompt("");
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === workflowId ? { ...wf, enabled: !wf.enabled } : wf)));
  };

  // This is the button you already have wired: runWorkflow(selectedWorkflow.id)
  // We upgrade it so it also creates a backend job.
  const runWorkflow = async (workflowId: string) => {
    const wf = workflows.find((w) => w.id === workflowId) ?? (selectedWorkflow?.id === workflowId ? selectedWorkflow : null);
    if (!wf) return;

    // Optimistic UI: mark as running immediately
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, status: "running" } : w)));
    if (selectedWorkflow?.id === workflowId) setSelectedWorkflow({ ...wf, status: "running" });

    try {
      await startWorkflowJob(wf);

      const finishedAt = new Date().toISOString();
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId
            ? { ...w, status: "complete", lastRun: finishedAt }
            : w
        )
      );
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow((prev) => (prev ? { ...prev, status: "complete", lastRun: finishedAt } : prev));
      }

      // Optional: jump to Jobs page
      window.location.hash = "#/app/jobs";
    } catch (err) {
      console.error(err);
      setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, status: "idle" } : w)));
      if (selectedWorkflow?.id === workflowId) setSelectedWorkflow((prev) => (prev ? { ...prev, status: "idle" } : prev));
      alert(err instanceof Error ? err.message : "Failed to start workflow");
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "green";
      case "running":
        return "cyan";
      case "error":
        return "red";
      default:
        return "slate";
    }
  };

  const categoryColors: Record<string, string> = {
    content: "purple",
    business: "blue",
    finance: "green",
    marketing: "orange",
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Create Task / Workflow (simple prompt-first dialog) */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-slate-900 border border-cyan-500/20 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-cyan-500/10">
              <div>
                <div className="text-lg font-semibold text-white">Create Workflow</div>
                <div className="text-sm text-slate-400">Prompt-first workflow builder</div>
              </div>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-slate-300">Name</div>
                <input
                  className="w-full rounded-xl bg-slate-950 border border-cyan-500/10 px-4 py-2 text-white outline-none"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300">Cadence</div>
                <div className="flex gap-2">
                  {(["once", "daily", "weekly"] as const).map((c) => (
                    <Button
                      key={c}
                      variant={createCadence === c ? "default" : "outline"}
                      className="border-cyan-500/20"
                      onClick={() => setCreateCadence(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300">Prompt</div>
                <textarea
                  className="w-full min-h-[120px] rounded-xl bg-slate-950 border border-cyan-500/10 px-4 py-3 text-white outline-none"
                  placeholder="Example: Every morning, create a short video script, generate assets, and schedule posts…"
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-cyan-500/10">
              <Button variant="outline" className="border-cyan-500/20" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createWorkflow} disabled={!createPrompt.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-white">Task Automation</div>
          <div className="text-slate-400">Build workflows and run them as backend jobs</div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workflow list */}
        <Card className="bg-slate-900 border border-cyan-500/20 p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold">Workflows</div>
            <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{workflows.length}</Badge>
          </div>

          <ScrollArea className="h-[520px] pr-2">
            <div className="space-y-3">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflow(wf)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    selectedWorkflow?.id === wf.id
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : "bg-slate-950 border-cyan-500/10 hover:border-cyan-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium">{wf.name}</div>
                    <Badge className={`bg-${categoryColors[wf.category]}-500/10 text-slate-100 border border-cyan-500/10`}>
                      {wf.cadence}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 line-clamp-2">{wf.prompt || "No prompt yet"}</div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">{wf.lastRun ? `Last: ${wf.lastRun}` : "Never run"}</div>
                    <Button
                      variant="ghost"
                      className="h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWorkflow(wf.id);
                      }}
                    >
                      {wf.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </button>
              ))}

              {workflows.length === 0 && (
                <div className="text-sm text-slate-400 p-4 rounded-xl bg-slate-950 border border-cyan-500/10">
                  No workflows yet. Click <span className="text-cyan-300">New Workflow</span> to create one.
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right: Selected workflow */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedWorkflow ? (
            <Card className="bg-slate-900 border border-cyan-500/20 p-8">
              <div className="text-white font-semibold">Select a workflow</div>
              <div className="text-slate-400 mt-1">Choose a workflow on the left to view details and run it.</div>
            </Card>
          ) : (
            <>
              <Card className="bg-slate-900 border border-cyan-500/20 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-white">{selectedWorkflow.name}</div>
                    <div className="text-slate-400 mt-1">{selectedWorkflow.description}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {selectedWorkflow.cadence}
                      </Badge>
                      <Badge className="bg-slate-950 text-slate-300 border border-cyan-500/10">
                        {selectedWorkflow.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flexz flex items-center gap-2">
                    <Button
                      onClick={() => runWorkflow(selectedWorkflow.id)}
                      disabled={selectedWorkflow.status === "running"}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {selectedWorkflow.status === "running" ? "Running..." : "Execute Workflow"}
                    </Button>

                    <Button variant="outline" className="border-cyan-500/20">
                      <Settings className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-slate-950 border border-cyan-500/10 p-4">
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="text-white font-semibold mt-1">{selectedWorkflow.status}</div>
                  </Card>
                  <Card className="bg-slate-950 border border-cyan-500/10 p-4">
                    <div className="text-xs text-slate-400">Last Run</div>
                    <div className="text-white font-semibold mt-1">{selectedWorkflow.lastRun ?? "—"}</div>
                  </Card>
                  <Card className="bg-slate-950 border border-cyan-500/10 p-4">
                    <div className="text-xs text-slate-400">Next Run</div>
                    <div className="text-white font-semibold mt-1">{selectedWorkflow.nextRun ?? "—"}</div>
                  </Card>
                  <Card className="bg-slate-950 border border-cyan-500/10 p-4">
                    <div className="text-xs text-slate-400">Steps</div>
                    <div className="text-white font-semibold mt-1">{selectedWorkflow.steps.length}</div>
                  </Card>
                </div>
              </Card>

              <Card className="bg-slate-900 border border-cyan-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">Steps</div>
                  <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {selectedWorkflow.steps.length}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedWorkflow.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-950 border border-cyan-500/10 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-${step.color}-500/10 border border-cyan-500/10 flex items-center justify-center`}>
                          <StepIcon icon={step.icon} className="w-4 h-4 text-cyan-200" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{step.name}</div>
                          <div className="text-xs text-slate-500">{step.duration ?? "—"}</div>
                        </div>
                      </div>

                      <Badge className={`bg-${getStepStatusColor(step.status)}-500/10 text-slate-100 border border-cyan-500/10`}>
                        {step.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
