/**
 * Analytics Dashboard
 * Conversation metrics, voice usage, orchestration analytics, performance, cost tracking
 */

import { useState, useEffect } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  MessageSquare, 
  Volume2, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  conversations: {
    total: number;
    daily: Array<{ date: string; count: number }>;
    hourly: Array<{ hour: string; count: number }>;
    avg_duration: number;
    success_rate: number;
  };
  voice: {
    total_requests: number;
    total_characters: number;
    voice_model_usage: Record<string, number>;
    cost_estimates: {
      daily: number;
      monthly: number;
      total: number;
    };
    popular_voices: Array<{ voice_id: string; name: string; usage: number }>;
  };
  orchestration: {
    total_decisions: number;
    agent_delegations: Record<string, number>;
    action_types: Record<string, number>;
    success_rates: Record<string, number>;
    escalation_rate: number;
    avg_processing_time: number;
  };
  performance: {
    avg_response_time: number;
    api_health: number;
    error_rate: number;
    uptime: number;
    cache_hit_rate: number;
    concurrent_users: number;
  };
  costs: {
    api_tokens: number;
    voice_synthesis: number;
    storage: number;
    bandwidth: number;
    total_daily: number;
    total_monthly: number;
    projected_monthly: number;
  };
}

/** Merge partial API response with safe defaults so we never crash on missing fields. */
function safeAnalytics(raw: any): AnalyticsData {
  const r = raw || {};
  return {
    conversations: { total: 0, daily: [], hourly: [], avg_duration: 0, success_rate: 0, ...(r.conversations || {}) },
    voice: {
      total_requests: 0, total_characters: 0, voice_model_usage: {}, popular_voices: [],
      ...(r.voice || {}),
      cost_estimates: { daily: 0, monthly: 0, total: 0, ...(r.voice?.cost_estimates || {}) },
    },
    orchestration: { total_decisions: 0, agent_delegations: {}, action_types: {}, success_rates: {}, escalation_rate: 0, avg_processing_time: 0, ...(r.orchestration || {}) },
    performance: { avg_response_time: 0, api_health: 0, error_rate: 0, uptime: 0, cache_hit_rate: 0, concurrent_users: 0, ...(r.performance || {}) },
    costs: { api_tokens: 0, voice_synthesis: 0, storage: 0, bandwidth: 0, total_daily: 0, total_monthly: 0, projected_monthly: 0, ...(r.costs || {}) },
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

export default function AnalyticsDashboard() {
  const { tenantId } = useActiveTenant();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [tenantId, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/analytics?range=${timeRange}`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setData(safeAnalytics(result.analytics));
          setLastRefresh(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/analytics/export?range=${timeRange}`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atlas-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Analytics data exported successfully');
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data</h3>
        <p className="text-slate-400 mb-4">Analytics data is not available</p>
        <Button onClick={loadAnalytics} className="bg-cyan-600 hover:bg-cyan-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart className="w-6 h-6 text-cyan-400" />
            Analytics Dashboard
          </h2>
          <p className="text-slate-400">
            Monitor Atlas performance, usage, and costs
            {lastRefresh && (
              <span className="ml-2 text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-slate-800 border-slate-600 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Conversations</p>
              <p className="text-2xl font-bold text-white">{data.conversations.total.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.conversations.success_rate.toFixed(1)}% success rate
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-cyan-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Voice Requests</p>
              <p className="text-2xl font-bold text-white">{data.voice.total_requests.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">
                ${(data.voice.cost_estimates.daily).toFixed(2)} today
              </p>
            </div>
            <Volume2 className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Orchestrations</p>
              <p className="text-2xl font-bold text-white">{data.orchestration.total_decisions.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.orchestration.escalation_rate.toFixed(1)}% escalation
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Daily Costs</p>
              <p className="text-2xl font-bold text-white">${data.costs.total_daily.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">
                ${data.costs.projected_monthly.toFixed(0)} projected
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="conversations" className="data-[state=active]:bg-cyan-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-cyan-600">
            <Volume2 className="w-4 h-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="data-[state=active]:bg-cyan-600">
            <Activity className="w-4 h-4 mr-2" />
            Orchestration
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-cyan-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Costs
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Daily Conversation Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.conversations.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#00D4AA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hourly Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.conversations.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Conversation Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {data.conversations.avg_duration.toFixed(1)}s
                </div>
                <div className="text-sm text-slate-400 mt-1">Average Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {data.conversations.success_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {(data.conversations.total / Math.max(1, data.conversations.daily.length)).toFixed(1)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Daily Average</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Voice Model Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.voice.voice_model_usage).map(([model, usage]) => ({
                      name: model,
                      value: usage,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(data.voice.voice_model_usage).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Voices</h3>
              <div className="space-y-3">
                {data.voice.popular_voices.map((voice, index) => (
                  <div key={voice.voice_id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{voice.name}</div>
                        <div className="text-sm text-slate-400">{voice.usage} requests</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Voice Cost Estimates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  ${data.voice.cost_estimates.daily.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Daily Cost</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  ${data.voice.cost_estimates.monthly.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Monthly Cost</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {data.voice.total_characters.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Characters</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Orchestration Tab */}
        <TabsContent value="orchestration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Agent Delegations</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(data.orchestration.agent_delegations).map(([agent, count]) => ({
                  agent,
                  count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="agent" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Action Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.orchestration.action_types).map(([action, count]) => ({
                      name: action,
                      value: count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(data.orchestration.action_types).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Orchestration Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {data.orchestration.total_decisions.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Decisions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {data.orchestration.avg_processing_time.toFixed(1)}s
                </div>
                <div className="text-sm text-slate-400 mt-1">Avg Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {data.orchestration.escalation_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Escalation Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {Object.keys(data.orchestration.success_rates).length > 0
                    ? (Object.values(data.orchestration.success_rates).reduce((a, b) => a + b, 0) / Object.keys(data.orchestration.success_rates).length).toFixed(1)
                    : '0'}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Avg Success Rate</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Response Time</h3>
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {data.performance.avg_response_time.toFixed(0)}ms
              </div>
              <div className="text-sm text-slate-400 mt-2">Average response time</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-cyan-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (1000 / data.performance.avg_response_time) * 100)}%` }}
                />
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">API Health</h3>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">
                {data.performance.api_health.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400 mt-2">System health score</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full"
                  style={{ width: `${data.performance.api_health}%` }}
                />
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Uptime</h3>
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {data.performance.uptime.toFixed(2)}%
              </div>
              <div className="text-sm text-slate-400 mt-2">System uptime</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full"
                  style={{ width: `${data.performance.uptime}%` }}
                />
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Error Rate</h3>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">
                {data.performance.error_rate.toFixed(2)}%
              </div>
              <div className="text-sm text-slate-400 mt-2">Request error rate</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, data.performance.error_rate * 10)}%` }}
                />
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Cache Hit Rate</h3>
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {data.performance.cache_hit_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400 mt-2">Cache efficiency</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${data.performance.cache_hit_rate}%` }}
                />
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Concurrent Users</h3>
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">
                {data.performance.concurrent_users}
              </div>
              <div className="text-sm text-slate-400 mt-2">Active users</div>
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (data.performance.concurrent_users / 100) * 100)}%` }}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'API Tokens', value: data.costs.api_tokens },
                      { name: 'Voice Synthesis', value: data.costs.voice_synthesis },
                      { name: 'Storage', value: data.costs.storage },
                      { name: 'Bandwidth', value: data.costs.bandwidth },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#0088FE" />
                    <Cell fill="#00C49F" />
                    <Cell fill="#FFBB28" />
                    <Cell fill="#FF8042" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cost Trends</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Daily Cost</div>
                    <div className="text-sm text-slate-400">Current day usage</div>
                  </div>
                  <div className="text-xl font-bold text-cyan-400">
                    ${data.costs.total_daily.toFixed(2)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Monthly Cost</div>
                    <div className="text-sm text-slate-400">Current month usage</div>
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    ${data.costs.total_monthly.toFixed(2)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Projected Monthly</div>
                    <div className="text-sm text-slate-400">Based on current usage</div>
                  </div>
                  <div className="text-xl font-bold text-yellow-400">
                    ${data.costs.projected_monthly.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Detailed Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  ${data.costs.api_tokens.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">API Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  ${data.costs.voice_synthesis.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Voice Synthesis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  ${data.costs.storage.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Storage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  ${data.costs.bandwidth.toFixed(2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Bandwidth</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
