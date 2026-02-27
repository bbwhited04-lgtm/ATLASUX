import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Activity,
  Trash2,
  Plus,
  Sparkles,
  Video,
  FileText,
  Share2,
  RefreshCw,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

interface Job {
  id: number;       // local index (React key)
  dbId: string;     // real UUID from DB — used for cancel API calls
  name: string;
  type: "video" | "animation" | "social" | "document" | "task";
  status: "running" | "completed" | "queued" | "paused";
  progress: number;
  startTime: string;
  estimatedTime?: string;
  priority: "high" | "medium" | "low";
}

function inferType(jobType: string): Job["type"] {
  const t = (jobType ?? "").toLowerCase();
  if (t.includes("video")) return "video";
  if (t.includes("email") || t.includes("mail") || t.includes("sms") || t.includes("comms")) return "social";
  if (t.includes("social") || t.includes("post") || t.includes("publish") || t.includes("tweet") || t.includes("instagram")) return "social";
  if (t.includes("doc") || t.includes("blog") || t.includes("kb") || t.includes("report") || t.includes("pdf")) return "document";
  if (t.includes("anim") || t.includes("image") || t.includes("art")) return "animation";
  return "task";
}

function formatJobType(jobType: string): string {
  return (jobType ?? "task")
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ITEMS_PER_PAGE = 15;

export function JobRunner() {
  const { tenantId: activeTenantId } = useActiveTenant();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "video" | "animation" | "social" | "document" | "task">("all");
  const [page, setPage] = useState(0);

  // New Job modal state
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJobType, setNewJobType] = useState<"EMAIL_SEND" | "SOCIAL_POST" | "">("");
  const [newJobFields, setNewJobFields] = useState({ to: "", subject: "", text: "" });
  const [newJobLoading, setNewJobLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/jobs/list`, {
        headers: { "x-tenant-id": activeTenantId ?? "" },
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) return;

      const active: Job[] = [];
      const done: any[] = [];

      (data.items ?? []).forEach((j: any, idx: number) => {
        const dbStatus: string = j.status ?? "queued";
        const type = inferType(j.jobType);
        const priority: Job["priority"] = j.priority >= 2 ? "high" : j.priority === 1 ? "medium" : "low";
        const name = formatJobType(j.jobType);
        const startTime = j.createdAt
          ? new Date(j.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—";

        if (dbStatus === "succeeded") {
          done.push({
            id: idx,
            dbId: String(j.id),
            name,
            type,
            completedTime: j.finishedAt
              ? new Date(j.finishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : startTime,
          });
        } else {
          const status: Job["status"] =
            dbStatus === "running" ? "running" :
            dbStatus === "queued"  ? "queued"  : "paused";
          active.push({
            id: idx,
            dbId: String(j.id),
            name,
            type,
            status,
            progress: dbStatus === "running" ? 50 : 0,
            startTime,
            priority,
          });
        }
      });

      setJobs(active);
      setCompletedJobs(done);
    } catch {
      // Silent fail — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
    const timer = setInterval(() => void loadJobs(), 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "animation": return Sparkles;
      case "social": return Share2;
      case "document": return FileText;
      default: return Activity;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "purple";
      case "animation": return "pink";
      case "social": return "blue";
      case "document": return "green";
      default: return "cyan";
    }
  };
  
  const toggleJobStatus = (jobId: number) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        if (job.status === "running") {
          // Stop Pluto when pausing
          if ((window as any).plutoStopTask) {
            (window as any).plutoStopTask();
          }
          return { ...job, status: "paused" as const };
        }
        if (job.status === "paused") {
          // Start Pluto when resuming
          if ((window as any).plutoStartTask) {
            (window as any).plutoStartTask();
          }
          return { ...job, status: "running" as const };
        }
      }
      return job;
    }));
  };
  
  const deleteJob = async (jobId: number) => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return;

    // Optimistic remove from UI
    setJobs(prev => prev.filter(job => job.id !== jobId));

    // Persist to backend (fire-and-forget; reload will reconcile)
    try {
      await fetch(`${API_BASE}/v1/jobs/${target.dbId}`, {
        method: "DELETE",
        headers: { "x-tenant-id": activeTenantId ?? "" },
      });
    } catch {
      // If the delete fails, re-fetch to reconcile state
      void loadJobs();
    }

    if (target.status === "running" && (window as any).plutoStopTask) {
      (window as any).plutoStopTask();
    }
  };

  const createJob = async () => {
    if (!newJobType) return;
    setNewJobLoading(true);
    const input = newJobType === "EMAIL_SEND"
      ? { to: newJobFields.to, subject: newJobFields.subject, text: newJobFields.text }
      : {};
    try {
      await fetch(`${API_BASE}/v1/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-tenant-id": activeTenantId ?? "" },
        body: JSON.stringify({ jobType: newJobType, priority: 1, input }),
      });
      setShowNewJob(false);
      setNewJobType("");
      setNewJobFields({ to: "", subject: "", text: "" });
      void loadJobs();
    } catch { /* ignore */ } finally {
      setNewJobLoading(false);
    }
  };

  const setFilterAndReset = (f: typeof filter) => { setFilter(f); setPage(0); };
  const filteredJobs = filter === "all" ? jobs : jobs.filter(job => job.type === filter);
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const pagedJobs = filteredJobs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Job Runner
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage and monitor all AI tasks</p>
        </div>
        
        <Button variant="outline" onClick={loadJobs} disabled={loading} className="border-cyan-500/20">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          className="bg-cyan-500 hover:bg-cyan-400"
          onClick={() => setShowNewJob(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="text-2xl font-bold text-cyan-400">{jobs.filter(j => j.status === "running").length}</div>
          <div className="text-xs text-slate-400 mt-1">Active Jobs</div>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="text-2xl font-bold text-slate-400">{jobs.filter(j => j.status === "queued").length}</div>
          <div className="text-xs text-slate-400 mt-1">In Queue</div>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{jobs.filter(j => j.status === "paused").length}</div>
          <div className="text-xs text-slate-400 mt-1">Paused</div>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="text-2xl font-bold text-green-400">{completedJobs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Completed Today</div>
        </Card>
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="text-2xl font-bold text-purple-400">{jobs.length + completedJobs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Jobs</div>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilterAndReset("all")}
          className={filter === "all" ? "bg-cyan-500" : "border-cyan-500/20"}
        >
          All
        </Button>
        <Button
          variant={filter === "video" ? "default" : "outline"}
          onClick={() => setFilterAndReset("video")}
          className={filter === "video" ? "bg-purple-500" : "border-cyan-500/20"}
        >
          <Video className="w-4 h-4 mr-2" />
          Video
        </Button>
        <Button
          variant={filter === "animation" ? "default" : "outline"}
          onClick={() => setFilterAndReset("animation")}
          className={filter === "animation" ? "bg-pink-500" : "border-cyan-500/20"}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Animation
        </Button>
        <Button
          variant={filter === "social" ? "default" : "outline"}
          onClick={() => setFilterAndReset("social")}
          className={filter === "social" ? "bg-blue-500" : "border-cyan-500/20"}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Email / Social
        </Button>
        <Button
          variant={filter === "document" ? "default" : "outline"}
          onClick={() => setFilterAndReset("document")}
          className={filter === "document" ? "bg-green-500" : "border-cyan-500/20"}
        >
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </Button>
        <Button
          variant={filter === "task" ? "default" : "outline"}
          onClick={() => setFilterAndReset("task")}
          className={filter === "task" ? "bg-slate-600" : "border-cyan-500/20"}
        >
          <Activity className="w-4 h-4 mr-2" />
          Tasks
        </Button>
      </div>
      
      {/* Active Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active & Queued Jobs</h3>
        
        {filteredJobs.length === 0 ? (
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-12">
            <div className="text-center text-slate-400">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No active jobs</p>
              <p className="text-sm">Click "New Job" to queue one</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pagedJobs.map((job) => {
                const TypeIcon = getTypeIcon(job.type);
                const color = getTypeColor(job.type);
                
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                  >
                    <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`w-6 h-6 text-${color}-400 ${job.status === "running" ? "animate-pulse" : ""}`} />
                        </div>
                        
                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-slate-200">{job.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-400">{job.startTime}</span>
                                {job.estimatedTime && (
                                  <span className="text-xs text-slate-500">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {job.estimatedTime} remaining
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  job.priority === "high" ? "border-red-500/40 text-red-400" :
                                  job.priority === "medium" ? "border-yellow-500/40 text-yellow-400" :
                                  "border-slate-500/40 text-slate-400"
                                }`}
                              >
                                {job.priority}
                              </Badge>
                              
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  job.status === "running" ? "border-cyan-500/40 text-cyan-400" : 
                                  job.status === "completed" ? "border-green-500/40 text-green-400" :
                                  job.status === "paused" ? "border-yellow-500/40 text-yellow-400" :
                                  "border-slate-500/40 text-slate-400"
                                }`}
                              >
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          {job.progress > 0 && (
                            <div className="space-y-2">
                              <Progress value={job.progress} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{job.progress}% complete</span>
                                <div className="flex gap-2">
                                  {(job.status === "running" || job.status === "paused") && (
                                    <button 
                                      onClick={() => toggleJobStatus(job.id)}
                                      className="hover:text-cyan-400 transition-colors"
                                    >
                                      {job.status === "running" ? (
                                        <Pause className="w-4 h-4" />
                                      ) : (
                                        <Play className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => deleteJob(job.id)}
                                    className="hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {job.status === "queued" && (
                            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 animate-pulse" />
                                <span>Queued — waiting for a worker</span>
                              </div>
                              <button
                                onClick={() => deleteJob(job.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
                                title="Cancel this job"
                              >
                                <Trash2 className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400">
                  {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} jobs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="border-cyan-500/20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="border-cyan-500/20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Recently Completed
        </h3>
        
        {completedJobs.length === 0 ? (
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-8">
            <div className="text-center text-slate-400">
              <p className="text-sm">No completed jobs yet</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {completedJobs.map((job) => {
              const TypeIcon = getTypeIcon(job.type);
              const color = getTypeColor(job.type);
              
              return (
                <Card key={job.id} className="bg-slate-900/50 border-green-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0`}>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-200 truncate">{job.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{job.completedTime}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* New Job Modal */}
      {showNewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Queue a New Job</h3>
              <button
                onClick={() => { setShowNewJob(false); setNewJobType(""); setNewJobFields({ to: "", subject: "", text: "" }); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Job type picker */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Select job type</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { type: "EMAIL_SEND", label: "Send Email", Icon: Mail },
                    { type: "SOCIAL_POST", label: "Social Post", Icon: Share2 },
                  ] as const).map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewJobType(type)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        newJobType === type
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2 text-cyan-400" />
                      <div className="text-sm font-medium text-white">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email fields */}
              {newJobType === "EMAIL_SEND" && (
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="To (email address)"
                    value={newJobFields.to}
                    onChange={e => setNewJobFields(p => ({ ...p, to: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                  />
                  <input
                    placeholder="Subject"
                    value={newJobFields.subject}
                    onChange={e => setNewJobFields(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                  />
                  <textarea
                    placeholder="Message body"
                    rows={4}
                    value={newJobFields.text}
                    onChange={e => setNewJobFields(p => ({ ...p, text: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>
              )}

              {newJobType === "SOCIAL_POST" && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
                  Social post jobs are queued via the <strong className="text-slate-300">Blog Studio</strong> or
                  the <strong className="text-slate-300">Social Monitoring</strong> panel where you can set
                  platform, content, and schedule.
                </div>
              )}

              <Button
                onClick={createJob}
                disabled={!newJobType || newJobLoading || (newJobType === "EMAIL_SEND" && (!newJobFields.to || !newJobFields.subject || !newJobFields.text))}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50"
              >
                {newJobLoading ? "Queuing…" : "Queue Job"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Animation Overlay */}
      <AnimatePresence>
        {jobs.some(j => j.progress === 100 && j.status === "running") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 border-2 border-green-400 rounded-3xl p-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Task Complete!</h3>
              <p className="text-slate-300">Job finished successfully</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}