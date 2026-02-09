import { useEffect, useMemo, useState } from "react";
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
  ChevronRight
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
  category: "content" | "business" | "finance" | "marketing";
  description: string;
  steps: WorkflowStep[];
  status: "idle" | "running" | "complete";
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
}

export function TaskAutomation() {
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

  const defaultSteps = useMemo<WorkflowStep[]>(
    () => [
      { id: "plan", name: "Plan", icon: FileText, color: "cyan", status: "pending" },
      { id: "create", name: "Create", icon: Video, color: "cyan", status: "pending" },
      { id: "post", name: "Post", icon: Send, color: "cyan", status: "pending" },
      { id: "report", name: "Report", icon: BarChart3, color: "cyan", status: "pending" },
    ],
    []
  );

  const createWorkflow = () => {
    const trimmed = createPrompt.trim();
    if (!trimmed) return;

    const id = `wf_${Date.now()}`;
    const nextRun = createCadence === "once" ? undefined : "Tomorrow 9:00 AM";
    const wf: Workflow = {
      id,
      name: createName.trim() || "New Workflow",
      category: "content",
      description: trimmed,
      steps: defaultSteps,
      status: "idle",
      enabled: true,
      nextRun,
    };

    setWorkflows((prev) => [wf, ...prev]);
    setCreateOpen(false);
    setCreatePrompt("");
    setSelectedWorkflow(wf);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(wf => 
      wf.id === workflowId ? { ...wf, enabled: !wf.enabled } : wf
    ));
  };

  const runWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(wf => 
      wf.id === workflowId ? { ...wf, status: "running" } : wf
    ));
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "green";
      case "running": return "cyan";
      case "error": return "red";
      default: return "slate";
    }
  };

  const categoryColors = {
    content: "purple",
    business: "blue",
    finance: "green",
    marketing: "orange"
  };

  return (
    <div className="p-6 space-y-6">
      {/* Create Task / Workflow (simple prompt-first dialog) */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-slate-900 border border-cyan-500/20 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-cyan-500/10">
              <div>
                <h3 className="text-lg font-semibold text-white">Create a Task</h3>
                <p className="text-sm text-slate-400">Describe what you want Atlas to do. Keep it simple — you can refine later.</p>
              </div>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Task name</label>
                  <input
                    className="mt-1 w-full rounded-lg bg-slate-950/40 border border-cyan-500/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Morning Content"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Cadence</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-slate-950/40 border border-cyan-500/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    value={createCadence}
                    onChange={(e) => setCreateCadence(e.target.value as any)}
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">What should Atlas do?</label>
                <textarea
                  className="mt-1 w-full min-h-[120px] rounded-lg bg-slate-950/40 border border-cyan-500/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder='Example: “Create a 5s steaming coffee sunrise video, add Atlas UX branding, post to TikTok/IG/YouTube with #fyp #viral, tag @CharlieTrucker on TikTok and @growincorn2020 on Facebook.”'
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" className="border-cyan-500/20" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createWorkflow} disabled={!createPrompt.trim()}>
                  Save Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Task Automation
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Create, manage, and run automated workflows powered by Pluto
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
          <Button variant="outline" className="border-cyan-500/20">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{workflows.filter(w => w.enabled).length}</div>
              <div className="text-xs text-slate-400">Active Workflows</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">{workflows.filter(w => w.status === "running").length}</div>
              <div className="text-xs text-slate-400">Running Now</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{workflows.filter(w => w.nextRun && w.nextRun !== "Not scheduled").length}</div>
              <div className="text-xs text-slate-400">Scheduled</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{workflows.length}</div>
              <div className="text-xs text-slate-400">Total Workflows</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Workflow List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Workflows</h3>
          
          {workflows.length === 0 ? (
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-12">
              <div className="text-center text-slate-400">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No workflows created yet</p>
                <p className="text-sm mb-4">Create your first automated workflow to get started</p>
          <Button variant="outline" className="border-cyan-500/20" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3 pr-4">
                {workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedWorkflow?.id === workflow.id
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                    }`}
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-${categoryColors[workflow.category]}-500/20 flex items-center justify-center`}>
                          <Zap className={`w-4 h-4 text-${categoryColors[workflow.category]}-400`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200">{workflow.name}</h4>
                          <Badge variant="outline" className={`text-xs border-${categoryColors[workflow.category]}-500/30 text-${categoryColors[workflow.category]}-400 mt-1`}>
                            {workflow.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {workflow.status === "running" && (
                          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-xs">
                            <Play className="w-3 h-3 mr-1" />
                            Running
                          </Badge>
                        )}
                        {workflow.enabled && workflow.status !== "running" && (
                          <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Enabled
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-3">{workflow.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span>Last: {workflow.lastRun}</span>
                        <span>Next: {workflow.nextRun}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Workflow Detail */}
        <div className="space-y-4">
          {selectedWorkflow && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Workflow Details</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-cyan-500/20"
                    onClick={() => runWorkflow(selectedWorkflow.id)}
                    disabled={selectedWorkflow.status === "running"}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {selectedWorkflow.status === "running" ? "Running..." : "Run Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-cyan-500/20"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-cyan-500/20"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </div>

              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
                <div className="space-y-6">
                  {/* Workflow Info */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-200">{selectedWorkflow.name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{selectedWorkflow.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWorkflow.enabled}
                          onChange={() => toggleWorkflow(selectedWorkflow.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Last Run</div>
                        <div className="text-sm font-medium">{selectedWorkflow.lastRun}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Next Run</div>
                        <div className="text-sm font-medium">{selectedWorkflow.nextRun}</div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <h5 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                      Workflow Steps
                    </h5>
                    
                    <div className="space-y-3">
                      {selectedWorkflow.steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const statusColor = getStepStatusColor(step.status);
                        
                        return (
                          <div key={step.id}>
                            <Card className={`p-4 bg-${statusColor}-500/10 border-${statusColor}-500/30`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${step.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                  <StepIcon className={`w-5 h-5 text-${step.color}-400`} />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h6 className="font-medium text-slate-200">{step.name}</h6>
                                    {step.duration && (
                                      <span className="text-xs text-slate-500">{step.duration}</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {step.status === "complete" && (
                                      <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Complete
                                      </Badge>
                                    )}
                                    {step.status === "running" && (
                                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-xs">
                                        <Play className="w-3 h-3 mr-1" />
                                        Running
                                      </Badge>
                                    )}
                                    {step.status === "pending" && (
                                      <Badge variant="outline" className="border-slate-500/40 text-slate-400 text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                            
                            {index < selectedWorkflow.steps.length - 1 && (
                              <div className="flex justify-center py-2">
                                <ArrowRight className="w-4 h-4 text-cyan-500/50 rotate-90" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-cyan-500/20">
                    <Button
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400"
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
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}