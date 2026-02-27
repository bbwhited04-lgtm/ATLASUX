import { useState } from 'react';
import { 
  Cpu, Gauge, Activity, Zap, Settings, CheckCircle,
  TrendingUp, Database, HardDrive, Wifi, AlertCircle,
  Sparkles, Brain, Globe, Server
} from 'lucide-react';

export function ProcessingSettings() {
  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [cpuMultiCore, setCpuMultiCore] = useState(true);
  const [memoryOptimization, setMemoryOptimization] = useState(true);

  const systemInfo = {
    cpu: {
      model: 'Intel Core i9-13900K',
      cores: 24,
      threads: 32,
      baseSpeed: '3.0 GHz',
      maxSpeed: '5.8 GHz',
      currentUsage: 45,
      temperature: 52
    },
    gpu: {
      model: 'NVIDIA GeForce RTX 4090',
      memory: '24 GB GDDR6X',
      cudaCores: 16384,
      currentUsage: 32,
      temperature: 48,
      driver: '537.13'
    },
    memory: {
      total: 64,
      used: 28,
      available: 36,
      type: 'DDR5-6000'
    },
    storage: {
      total: 2048,
      used: 876,
      available: 1172,
      type: 'NVMe SSD'
    }
  };

  const performanceMetrics = [
    {
      name: 'AI Model Inference',
      cpuSpeed: '2.3s',
      gpuSpeed: '0.18s',
      improvement: '12.8x faster',
      enabled: gpuEnabled
    },
    {
      name: 'Image Processing',
      cpuSpeed: '5.6s',
      gpuSpeed: '0.34s',
      improvement: '16.5x faster',
      enabled: gpuEnabled
    },
    {
      name: 'Video Transcoding',
      cpuSpeed: '45.2s',
      gpuSpeed: '3.2s',
      improvement: '14.1x faster',
      enabled: gpuEnabled
    },
    {
      name: 'Data Analysis',
      cpuSpeed: '8.9s',
      gpuSpeed: '0.67s',
      improvement: '13.3x faster',
      enabled: gpuEnabled
    },
  ];

  const optimizationOptions = [
    {
      name: 'GPU Acceleration',
      description: 'Use GPU for AI inference and media processing',
      enabled: gpuEnabled,
      toggle: setGpuEnabled,
      icon: Gauge,
      benefit: 'Up to 16.5x faster performance'
    },
    {
      name: 'Multi-Core CPU Processing',
      description: 'Utilize all available CPU cores for parallel tasks',
      enabled: cpuMultiCore,
      toggle: setCpuMultiCore,
      icon: Cpu,
      benefit: 'Maximize throughput for batch operations'
    },
    {
      name: 'Memory Optimization',
      description: 'Smart caching and memory management',
      enabled: memoryOptimization,
      toggle: setMemoryOptimization,
      icon: Database,
      benefit: 'Reduce loading times by 70%'
    },
  ];

  const workloadDistribution = [
    { task: 'AI Inference', cpu: 15, gpu: 85, type: 'GPU-optimized' },
    { task: 'File Processing', cpu: 60, gpu: 40, type: 'Balanced' },
    { task: 'Web Automation', cpu: 90, gpu: 10, type: 'CPU-optimized' },
    { task: 'Media Encoding', cpu: 10, gpu: 90, type: 'GPU-optimized' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Cpu className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Processing & Performance</h2>
        </div>
        <p className="text-slate-400">
          Hardware acceleration settings for maximum performance
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
          <AlertCircle className="w-3 h-3" />
          Demo view — actual system metrics coming in a future update
        </div>
      </div>

      {/* System Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* CPU Status */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">CPU</h3>
                <p className="text-xs text-slate-500">{systemInfo.cpu.model}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{systemInfo.cpu.currentUsage}%</div>
              <div className="text-xs text-slate-500">Usage</div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cores / Threads</span>
              <span className="text-white font-semibold">{systemInfo.cpu.cores} / {systemInfo.cpu.threads}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Max Speed</span>
              <span className="text-white font-semibold">{systemInfo.cpu.maxSpeed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Temperature</span>
              <span className="text-green-400 font-semibold">{systemInfo.cpu.temperature}°C</span>
            </div>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${systemInfo.cpu.currentUsage}%` }}
            />
          </div>
        </div>

        {/* GPU Status */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                <Gauge className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">GPU</h3>
                <p className="text-xs text-slate-500">{systemInfo.gpu.model}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{systemInfo.gpu.currentUsage}%</div>
              <div className="text-xs text-slate-500">Usage</div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">VRAM</span>
              <span className="text-white font-semibold">{systemInfo.gpu.memory}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">CUDA Cores</span>
              <span className="text-white font-semibold">{systemInfo.gpu.cudaCores.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Temperature</span>
              <span className="text-green-400 font-semibold">{systemInfo.gpu.temperature}°C</span>
            </div>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${systemInfo.gpu.currentUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Memory & Storage */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Memory (RAM)</h3>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Used</span>
              <span className="text-white font-semibold">{systemInfo.memory.used} GB / {systemInfo.memory.total} GB</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${(systemInfo.memory.used / systemInfo.memory.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-slate-400">Type: {systemInfo.memory.type}</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Storage</h3>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Used</span>
              <span className="text-white font-semibold">{systemInfo.storage.used} GB / {systemInfo.storage.total} GB</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${(systemInfo.storage.used / systemInfo.storage.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-slate-400">Type: {systemInfo.storage.type}</div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Performance Optimization</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {optimizationOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-all ${
                  option.enabled
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30'
                    : 'bg-slate-950/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <button
                    onClick={() => option.toggle(!option.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      option.enabled
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        option.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="font-semibold text-white mb-1">{option.name}</div>
                <div className="text-xs text-slate-400 mb-3">{option.description}</div>
                <div className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                  ⚡ {option.benefit}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Performance Comparison</h3>
        </div>

        <div className="space-y-4">
          {performanceMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white">{metric.name}</div>
                <div className={`px-3 py-1 rounded text-xs font-semibold ${
                  metric.enabled
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {metric.enabled ? 'GPU Enabled' : 'CPU Only'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">CPU Time</div>
                  <div className="text-sm font-semibold text-slate-400">{metric.cpuSpeed}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">GPU Time</div>
                  <div className="text-sm font-semibold text-cyan-400">{metric.gpuSpeed}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Improvement</div>
                  <div className="text-sm font-semibold text-green-400">{metric.improvement}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Workload Distribution</h3>
        </div>

        <div className="space-y-4">
          {workloadDistribution.map((workload, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white">{workload.task}</div>
                <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">
                  {workload.type}
                </span>
              </div>
              <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden">
                <div 
                  className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${workload.cpu}%` }}
                >
                  {workload.cpu > 20 && `CPU ${workload.cpu}%`}
                </div>
                <div 
                  className="absolute right-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${workload.gpu}%` }}
                >
                  {workload.gpu > 20 && `GPU ${workload.gpu}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
