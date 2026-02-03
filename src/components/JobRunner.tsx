import { useState } from "react";
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
  Image as ImageIcon,
  FileText,
  Share2,
  Filter
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

interface Job {
  id: number;
  name: string;
  type: "video" | "animation" | "social" | "document" | "task";
  status: "running" | "completed" | "queued" | "paused";
  progress: number;
  startTime: string;
  estimatedTime?: string;
  priority: "high" | "medium" | "low";
}

export function JobRunner() {
  const [jobs, setJobs] = useState<Job[]>([
    { 
      id: 1, 
      name: "Create Product Demo Video", 
      type: "video",
      status: "running", 
      progress: 65, 
      startTime: "2m ago",
      estimatedTime: "3m",
      priority: "high"
    },
    { 
      id: 2, 
      name: "Generate Social Media Posts", 
      type: "social",
      status: "running", 
      progress: 80, 
      startTime: "5m ago",
      estimatedTime: "1m",
      priority: "medium"
    },
    { 
      id: 3, 
      name: "Animate Logo Reveal", 
      type: "animation",
      status: "running", 
      progress: 45, 
      startTime: "8m ago",
      estimatedTime: "5m",
      priority: "medium"
    },
    { 
      id: 4, 
      name: "Process Financial Report", 
      type: "document",
      status: "queued", 
      progress: 0, 
      startTime: "Just now",
      priority: "low"
    },
    { 
      id: 5, 
      name: "Email Response Automation", 
      type: "task",
      status: "paused", 
      progress: 30, 
      startTime: "15m ago",
      priority: "medium"
    },
  ]);
  
  const [completedJobs, setCompletedJobs] = useState([
    { id: 101, name: "Website Screenshot Capture", type: "task", completedTime: "10m ago" },
    { id: 102, name: "Instagram Story Creation", type: "social", completedTime: "25m ago" },
    { id: 103, name: "PDF Report Generation", type: "document", completedTime: "45m ago" },
    { id: 104, name: "Background Removal - 50 images", type: "animation", completedTime: "1h ago" },
  ]);
  
  const [filter, setFilter] = useState<"all" | "video" | "animation" | "social" | "document" | "task">("all");
  
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
  
  const deleteJob = (jobId: number) => {
    setJobs(jobs.filter(job => job.id !== jobId));
    // Stop Pluto if a running job is deleted
    const deletedJob = jobs.find(j => j.id === jobId);
    if (deletedJob?.status === "running") {
      if ((window as any).plutoStopTask) {
        (window as any).plutoStopTask();
      }
    }
  };
  
  const filteredJobs = filter === "all" ? jobs : jobs.filter(job => job.type === filter);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Pluto Job Runner
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage and monitor all AI tasks</p>
        </div>
        
        <Button className="bg-cyan-500 hover:bg-cyan-400">
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
          <div className="text-2xl font-bold text-purple-400">12</div>
          <div className="text-xs text-slate-400 mt-1">Total Jobs</div>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-cyan-500" : "border-cyan-500/20"}
        >
          All
        </Button>
        <Button 
          variant={filter === "video" ? "default" : "outline"}
          onClick={() => setFilter("video")}
          className={filter === "video" ? "bg-purple-500" : "border-cyan-500/20"}
        >
          <Video className="w-4 h-4 mr-2" />
          Video
        </Button>
        <Button 
          variant={filter === "animation" ? "default" : "outline"}
          onClick={() => setFilter("animation")}
          className={filter === "animation" ? "bg-pink-500" : "border-cyan-500/20"}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Animation
        </Button>
        <Button 
          variant={filter === "social" ? "default" : "outline"}
          onClick={() => setFilter("social")}
          className={filter === "social" ? "bg-blue-500" : "border-cyan-500/20"}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Social
        </Button>
        <Button 
          variant={filter === "document" ? "default" : "outline"}
          onClick={() => setFilter("document")}
          className={filter === "document" ? "bg-green-500" : "border-cyan-500/20"}
        >
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </Button>
      </div>
      
      {/* Active Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active & Queued Jobs</h3>
        
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job) => {
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
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                            <Clock className="w-4 h-4 animate-pulse" />
                            <span>Waiting for available resources...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Completed Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Recently Completed
        </h3>
        
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
      </div>
      
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