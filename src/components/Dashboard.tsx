import { 
  Activity, 
  Brain, 
  CheckCircle2, 
  Clock, 
  Zap,
  TrendingUp,
  Globe,
  FileText,
  Play,
  Pause,
  Cpu,
  Briefcase,
  Gauge,
  ArrowRight
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useState } from "react";
import { useNavigate } from "react-router";
const imgA = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800";

export function Dashboard() {
const navigate = useNavigate();
  const stats = [
    { label: "Active Jobs", value: "12", icon: Activity, color: "cyan", trend: "+3" },
    { label: "Completed Today", value: "47", icon: CheckCircle2, color: "green", trend: "+12" },
    { label: "Learning Progress", value: "89%", icon: Brain, color: "purple", trend: "+5%" },
    { label: "Avg Response Time", value: "2.3s", icon: Zap, color: "yellow", trend: "-0.4s" },
  ];
  
  const recentJobs: any[] = [];
  
  const neptuneAccessLog: any[] = [];
  
  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900/50 to-slate-900 border border-cyan-500/20 p-8">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to Atlas UX
            </h2>
            <p className="text-slate-300 max-w-xl">
              Your AI employee is actively working across 12 tasks, monitoring social media, 
              and learning from your workflows. Neptune access control is active.
            </p>
            <div className="flex gap-3 pt-2">
              
              <button
                type="button"
                onClick={() => navigate("/app/automation?new=1")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20"
              >
              New Task
              </button>

              <button onClick={() => navigate("/app/jobs")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20">
                View All Jobs
              </button>
            </div>
          </div>
          <img src="./atlas_hero.png"  alt="Atlas AI" className="w-64 h-64 object-cover opacity-60" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <Badge variant="outline" className="text-xs border-cyan-500/20 text-cyan-400">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Pluto Job Runner Status */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Pluto Job Runner
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">5 Active Jobs</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-8">
                <div className="text-center text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active jobs. Create a task to get started.</p>
                </div>
              </Card>
            ) : (
              recentJobs.map((job) => (
                <Card key={job.id} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {job.status === "running" && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>
                      )}
                      {job.status === "completed" && (
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      {job.status === "queued" && (
                        <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{job.name}</div>
                        <div className="text-xs text-slate-400">{job.time}</div>
                      </div>
                    </div>
                    <Badge 
                      variant={job.status === "completed" ? "default" : "outline"}
                      className={`text-xs ${
                        job.status === "running" ? "border-cyan-500/40 text-cyan-400" : 
                        job.status === "completed" ? "bg-green-500/20 border-green-500/40 text-green-400" :
                        "border-slate-500/40 text-slate-400"
                      }`}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  {job.progress > 0 && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-1.5" />
                      <div className="text-xs text-slate-400 text-right">{job.progress}%</div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Neptune Access Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Neptune Control
            </h3>
          </div>
          
          <div className="space-y-3">
            {neptuneAccessLog.map((log, index) => (
              <Card key={index} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    log.status === "approved" ? "bg-green-400" :
                    log.status === "pending" ? "bg-yellow-400 animate-pulse" :
                    "bg-red-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {log.action}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {log.resource}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{log.time}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-cyan-500/30 backdrop-blur-xl p-4">
            <div className="text-sm font-medium mb-2">System Learning</div>
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              <div className="flex-1">
                <Progress value={89} className="h-2 mb-1" />
                <div className="text-xs text-slate-400">
                  AI adapting to your workflow patterns
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Quick Actions for New Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <button type="button" onClick={() => navigate("/app/business-assets")} className="group text-left">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-6 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Business Assets</h3>
            <p className="text-sm text-slate-400 mb-4">
              Manage your $4.49M portfolio across 3 businesses with 16 total assets
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <div className="text-slate-500">Businesses</div>
                <div className="text-white font-semibold">3</div>
              </div>
              <div>
                <div className="text-slate-500">Assets</div>
                <div className="text-white font-semibold">16</div>
              </div>
              <div>
                <div className="text-slate-500">Value</div>
                <div className="text-green-400 font-semibold">$4.49M</div>
              </div>
            </div>
          </Card>
        </button>
        
        <a href="/processing-settings" className="group">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">GPU Acceleration</h3>
            <p className="text-sm text-slate-400 mb-4">
              Hardware acceleration active - 16.5x faster AI processing with RTX 4090
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <div className="text-slate-500">CPU Usage</div>
                <div className="text-blue-400 font-semibold">45%</div>
              </div>
              <div>
                <div className="text-slate-500">GPU Usage</div>
                <div className="text-cyan-400 font-semibold">32%</div>
              </div>
              <div>
                <div className="text-slate-500">Speed Boost</div>
                <div className="text-green-400 font-semibold">16.5x</div>
              </div>
            </div>
          </Card>
        </a>
      </div>
      
      {/* Mobile Install Button */}
      <div className="mt-6">
        <button
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          onClick={() => setShowMobileInstall(true)}
        >
          <Smartphone className="w-4 h-4" />
          Install Mobile Companion
        </button>
      </div>
      
      {/* Mobile Install Modal */}
      <MobileInstallModal 
        isOpen={showMobileInstall} 
        onClose={() => setShowMobileInstall(false)} 
      />
    </div>
  );
}