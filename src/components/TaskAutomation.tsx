import { useState } from "react";
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
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "video-creation",
      name: "Video Content Creation & Distribution",
      category: "content",
      description: "Create video script → Generate images → Compile MP4 → Post to social media",
      enabled: true,
      status: "idle",
      lastRun: "2 hours ago",
      nextRun: "Tomorrow at 9:00 AM",
      steps: [
        { id: "script", name: "Create Video Script", icon: FileText, color: "purple", status: "complete", duration: "2m" },
        { id: "images", name: "Generate Images", icon: ImageIcon, color: "pink", status: "complete", duration: "5m" },
        { id: "video", name: "Compile Video (MP4)", icon: Video, color: "cyan", status: "complete", duration: "8m" },
        { id: "post", name: "Post to Social Media", icon: Send, color: "green", status: "complete", duration: "1m" }
      ]
    },
    {
      id: "email-campaign",
      name: "CRM Email Campaign",
      category: "business",
      description: "Write business content → Email to all CRM contacts → Track engagement",
      enabled: true,
      status: "running",
      lastRun: "Running now",
      steps: [
        { id: "write", name: "Write Business Development Idea", icon: FileText, color: "blue", status: "complete", duration: "3m" },
        { id: "crm", name: "Load CRM Contacts", icon: Users, color: "purple", status: "complete", duration: "1m" },
        { id: "email", name: "Send Emails", icon: Mail, color: "cyan", status: "running" },
        { id: "track", name: "Track Engagement", icon: TrendingUp, color: "green", status: "pending" }
      ]
    },
    {
      id: "ad-campaign",
      name: "Ad Campaign Generator",
      category: "marketing",
      description: "Create ad copy → Design visuals → Launch campaign → Monitor performance",
      enabled: false,
      status: "idle",
      lastRun: "Yesterday",
      nextRun: "Not scheduled",
      steps: [
        { id: "copy", name: "Generate Ad Copy", icon: FileText, color: "orange", status: "pending" },
        { id: "design", name: "Create Ad Visuals", icon: ImageIcon, color: "pink", status: "pending" },
        { id: "launch", name: "Launch Campaign", icon: Send, color: "cyan", status: "pending" },
        { id: "monitor", name: "Monitor Performance", icon: BarChart3, color: "green", status: "pending" }
      ]
    },
    {
      id: "audit-letters",
      name: "Audit Letter Generator",
      category: "finance",
      description: "Review financials → Generate audit letters → Send to stakeholders",
      enabled: true,
      status: "idle",
      lastRun: "Last week",
      nextRun: "End of month",
      steps: [
        { id: "review", name: "Review QuickBooks Data", icon: BarChart3, color: "blue", status: "pending" },
        { id: "generate", name: "Generate Audit Letters", icon: FileCheck, color: "purple", status: "pending" },
        { id: "approve", name: "Await Approval", icon: CheckCircle2, color: "yellow", status: "pending" },
        { id: "send", name: "Send to Stakeholders", icon: Mail, color: "green", status: "pending" }
      ]
    },
    {
      id: "accounting-controls",
      name: "Accountancy Controls Check",
      category: "finance",
      description: "Run financial controls → Generate reports → Alert on anomalies",
      enabled: true,
      status: "idle",
      lastRun: "3 hours ago",
      nextRun: "Daily at 6:00 PM",
      steps: [
        { id: "controls", name: "Run Control Checks", icon: FileCheck, color: "cyan", status: "pending" },
        { id: "report", name: "Generate Control Report", icon: FileText, color: "blue", status: "pending" },
        { id: "anomalies", name: "Detect Anomalies", icon: TrendingUp, color: "orange", status: "pending" },
        { id: "notify", name: "Send Alerts", icon: Mail, color: "red", status: "pending" }
      ]
    },
    {
      id: "invoice-processing",
      name: "Invoice Processing & Payment",
      category: "finance",
      description: "Import invoices → Process payments → Update QuickBooks → Send confirmations",
      enabled: true,
      status: "idle",
      lastRun: "1 hour ago",
      nextRun: "Every 4 hours",
      steps: [
        { id: "import", name: "Import Invoices", icon: FileText, color: "blue", status: "pending" },
        { id: "process", name: "Process Payments", icon: DollarSign, color: "green", status: "pending" },
        { id: "update", name: "Update QuickBooks", icon: BarChart3, color: "cyan", status: "pending" },
        { id: "confirm", name: "Send Confirmations", icon: Mail, color: "purple", status: "pending" }
      ]
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0]);

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
          <Button variant="outline" className="border-cyan-500/20">
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
