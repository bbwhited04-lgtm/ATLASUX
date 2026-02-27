/**
 * Real-time Status Dashboard
 * Live agent status, API health, and performance metrics
 */

import { useState, useEffect, useRef } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Zap, 
  Database, 
  Users, 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Globe, 
  Shield, 
  Eye,
  Brain,
  MessageSquare,
  Calendar,
  Timer
} from "lucide-react";
import { toast } from "sonner";

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  response_time: number;
  last_check: string;
  error_rate: number;
  uptime: number;
  endpoint?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  type: 'atlas' | 'subagent';
  status: 'active' | 'idle' | 'busy' | 'offline';
  current_task?: string;
  tasks_completed: number;
  avg_response_time: number;
  memory_usage: number;
  cpu_usage: number;
  last_activity: string;
  health_score: number;
}

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    read_speed: number;
    write_speed: number;
  };
  network: {
    upload: number;
    download: number;
    latency: number;
    packet_loss: number;
  };
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  service: string;
  timestamp: string;
  acknowledged: boolean;
}

const STATUS_COLORS = {
  healthy: 'text-green-400',
  degraded: 'text-yellow-400', 
  critical: 'text-red-400',
  online: 'text-green-400',
  offline: 'text-red-400',
  active: 'text-green-400',
  idle: 'text-blue-400',
  busy: 'text-yellow-400',
};

const STATUS_BG_COLORS = {
  healthy: 'bg-green-500/20',
  degraded: 'bg-yellow-500/20',
  critical: 'bg-red-500/20',
  online: 'bg-green-500/20',
  offline: 'bg-red-500/20',
  active: 'bg-green-500/20',
  idle: 'bg-blue-500/20',
  busy: 'bg-yellow-500/20',
};

export default function RealTimeStatusDashboard() {
  const { tenantId } = useActiveTenant();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadAllStatus();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(loadAllStatus, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, tenantId]);

  const loadAllStatus = async () => {
    try {
      await Promise.all([
        loadSystemStatus(),
        loadServicesStatus(),
        loadAgentsStatus(),
        loadPerformanceMetrics(),
        loadAlerts(),
      ]);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/system`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setSystemStatus(data.status);
        }
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadServicesStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/services`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setServices(data.services || []);
        }
      }
    } catch (error) {
      console.error('Failed to load services status:', error);
    }
  };

  const loadAgentsStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/agents`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setAgents(data.agents || []);
        }
      }
    } catch (error) {
      console.error('Failed to load agents status:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/metrics`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setMetrics(data.metrics);
        }
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/alerts`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setAlerts(data.alerts || []);
        }
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/status/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setAlerts(prev => prev.map(alert => 
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          ));
          toast.success('Alert acknowledged');
        }
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
      case 'idle':
      case 'busy':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'offline':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.level === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Real-time Status Dashboard
          </h2>
          <p className="text-slate-400">Live system health and performance monitoring</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-slate-400">
              {autoRefresh ? 'Auto-refresh' : 'Manual'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllStatus}
            disabled={isRefreshing}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Critical Alerts</h3>
            <Badge variant="secondary" className="bg-red-500/20 text-red-300">
              {criticalAlerts.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{alert.title}</h4>
                    <Badge variant="secondary" className="bg-red-500/20 text-red-300 text-xs">
                      {alert.service}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-300">{alert.message}</p>
                  <p className="text-xs text-red-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* System Overview */}
      {systemStatus && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">System Overview</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.overall)}
              <span className={`font-medium ${STATUS_COLORS[systemStatus.overall]}`}>
                {systemStatus.overall.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatUptime(systemStatus.uptime)}
              </div>
              <div className="text-sm text-slate-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {services.filter(s => s.status === 'online').length}/{services.length}
              </div>
              <div className="text-sm text-slate-400">Services Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {agents.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-slate-400">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {unacknowledgedAlerts.length}
              </div>
              <div className="text-sm text-slate-400">Pending Alerts</div>
            </div>
          </div>
        </Card>
      )}

      {/* Services Status */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Services Status</h3>
        
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className={`p-4 rounded-lg border ${
                service.status === 'online' ? 'bg-green-500/5 border-green-500/20' :
                service.status === 'degraded' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="text-white font-medium">{service.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Response: {service.response_time}ms</span>
                      <span>Error Rate: {service.error_rate}%</span>
                      <span>Uptime: {service.uptime}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className={
                    service.status === 'online' ? 'bg-green-500/20 text-green-300' :
                    service.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }>
                    {service.status}
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(service.last_check).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agents Status */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Agent Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border ${
                agent.status === 'active' ? 'bg-green-500/5 border-green-500/20' :
                agent.status === 'idle' ? 'bg-blue-500/5 border-blue-500/20' :
                agent.status === 'busy' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {agent.type === 'atlas' ? <Brain className="w-4 h-4 text-purple-400" /> : <Users className="w-4 h-4 text-blue-400" />}
                  <h4 className="text-white font-medium">{agent.name}</h4>
                  {getStatusIcon(agent.status)}
                </div>
                <Badge className={
                  agent.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  agent.status === 'idle' ? 'bg-blue-500/20 text-blue-300' :
                  agent.status === 'busy' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }>
                  {agent.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                {agent.current_task && (
                  <div className="text-slate-300">
                    <span className="text-slate-500">Task:</span> {agent.current_task}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Health Score:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={agent.health_score} className="w-20 h-2" />
                    <span className="text-white">{agent.health_score}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Response Time:</span>
                  <span className="text-white">{agent.avg_response_time}ms</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tasks Completed:</span>
                  <span className="text-white">{agent.tasks_completed}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Activity:</span>
                  <span className="text-white">{new Date(agent.last_activity).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-400" />
                <h4 className="text-white font-medium">CPU</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Usage:</span>
                  <span className="text-white">{metrics.cpu.usage}%</span>
                </div>
                <Progress value={metrics.cpu.usage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cores:</span>
                  <span className="text-white">{metrics.cpu.cores}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Temp:</span>
                  <span className="text-white">{metrics.cpu.temperature}°C</span>
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-blue-400" />
                <h4 className="text-white font-medium">Memory</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Usage:</span>
                  <span className="text-white">{metrics.memory.percentage}%</span>
                </div>
                <Progress value={metrics.memory.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Used:</span>
                  <span className="text-white">{formatBytes(metrics.memory.used)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-white">{formatBytes(metrics.memory.total)}</span>
                </div>
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-green-400" />
                <h4 className="text-white font-medium">Disk</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Usage:</span>
                  <span className="text-white">{metrics.disk.percentage}%</span>
                </div>
                <Progress value={metrics.disk.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Read:</span>
                  <span className="text-white">{formatBytes(metrics.disk.read_speed)}/s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Write:</span>
                  <span className="text-white">{formatBytes(metrics.disk.write_speed)}/s</span>
                </div>
              </div>
            </div>

            {/* Network */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <h4 className="text-white font-medium">Network</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Upload:</span>
                  <span className="text-white">{formatBytes(metrics.network.upload)}/s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Download:</span>
                  <span className="text-white">{formatBytes(metrics.network.download)}/s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Latency:</span>
                  <span className="text-white">{metrics.network.latency}ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Loss:</span>
                  <span className="text-white">{metrics.network.packet_loss}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Alerts */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
            {alerts.length} total
          </Badge>
        </div>
        
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">All Systems Healthy</h4>
              <p className="text-slate-400">No alerts in the last 24 hours</p>
            </div>
          ) : (
            alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.acknowledged ? 'bg-slate-800/30 border-slate-600' :
                  alert.level === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                  alert.level === 'error' ? 'bg-red-500/5 border-red-500/20' :
                  alert.level === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(alert.level)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{alert.title}</h4>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                        {alert.service}
                      </Badge>
                      {alert.acknowledged && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
