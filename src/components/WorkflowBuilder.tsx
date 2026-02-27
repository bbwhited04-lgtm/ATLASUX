/**
 * Workflow Automation Builder
 * Visual workflow designer with drag-and-drop agent orchestration
 */

import { useState, useEffect, useRef } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Settings, 
  Zap, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  GitBranch,
  Filter,
  MessageSquare,
  Database,
  Shield,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'agent' | 'decision' | 'delay' | 'end';
  name: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
  status: 'active' | 'inactive' | 'error';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  triggers: Array<{
    type: 'time' | 'event' | 'webhook' | 'manual';
    config: Record<string, any>;
  }>;
  variables: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const NODE_TYPES = {
  trigger: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  condition: {
    icon: Filter,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  action: {
    icon: Settings,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  agent: {
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  decision: {
    icon: GitBranch,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  delay: {
    icon: Clock,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  end: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
};

const AGENT_OPTIONS = [
  { id: 'atlas', name: 'Atlas', description: 'Main orchestration agent' },
  { id: 'binky', name: 'Binky', description: 'Chief Research Analyst' },
  { id: 'sunday', name: 'Sunday', description: 'Documentation Writer' },
  { id: 'reynolds', name: 'Reynolds', description: 'Personal Blogger' },
  { id: 'penny', name: 'Penny', description: 'Facebook Publisher' },
  { id: 'venny', name: 'Venny', description: 'Video Publisher' },
  { id: 'archy', name: 'Archy', description: 'Research Subagent' },
];

const ACTION_TEMPLATES = [
  {
    id: 'send_email',
    name: 'Send Email',
    description: 'Send email notification',
    config: { to: '', subject: '', body: '' },
  },
  {
    id: 'create_task',
    name: 'Create Task',
    description: 'Create task for agent',
    config: { agent_id: '', task_description: '', priority: 'medium' },
  },
  {
    id: 'update_database',
    name: 'Update Database',
    description: 'Update database record',
    config: { table: '', record_id: '', updates: {} },
  },
  {
    id: 'call_webhook',
    name: 'Call Webhook',
    description: 'Make HTTP request',
    config: { url: '', method: 'POST', headers: {}, body: '' },
  },
  {
    id: 'log_event',
    name: 'Log Event',
    description: 'Log workflow event',
    config: { level: 'info', message: '', metadata: {} },
  },
];

const WORKFLOW_TEMPLATES = [
  {
    id: 'daily_research',
    name: 'Daily Research Workflow',
    description: 'Automated daily research and reporting',
    category: 'research',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger' as const,
        name: 'Daily 9 AM',
        description: 'Trigger at 9 AM daily',
        config: { type: 'time', schedule: '0 9 * * *' },
        position: { x: 100, y: 50 },
        connections: ['agent-1'],
        status: 'active' as const,
      },
      {
        id: 'agent-1',
        type: 'agent' as const,
        name: 'Binky Research',
        description: 'Run daily research',
        config: { agent_id: 'binky', task: 'daily_research_summary' },
        position: { x: 300, y: 50 },
        connections: ['delay-1'],
        status: 'active' as const,
      },
      {
        id: 'delay-1',
        type: 'delay' as const,
        name: 'Process Delay',
        description: 'Wait for processing',
        config: { duration: 300000 }, // 5 minutes
        position: { x: 500, y: 50 },
        connections: ['agent-2'],
        status: 'active' as const,
      },
      {
        id: 'agent-2',
        type: 'agent' as const,
        name: 'Sunday Documentation',
        description: 'Create technical digest',
        config: { agent_id: 'sunday', task: 'create_technical_digest' },
        position: { x: 700, y: 50 },
        connections: ['action-1'],
        status: 'active' as const,
      },
      {
        id: 'action-1',
        type: 'action' as const,
        name: 'Send Report',
        description: 'Email daily report',
        config: { type: 'send_email', to: 'team@company.com', subject: 'Daily Atlas Report' },
        position: { x: 900, y: 50 },
        connections: ['end-1'],
        status: 'active' as const,
      },
      {
        id: 'end-1',
        type: 'end' as const,
        name: 'Complete',
        description: 'Workflow complete',
        config: {},
        position: { x: 1100, y: 50 },
        connections: [],
        status: 'active' as const,
      },
    ],
    triggers: [
      { type: 'time' as const, config: { schedule: '0 9 * * *' } }
    ],
    variables: {},
  },
];

export default function WorkflowBuilder() {
  const { tenantId } = useActiveTenant();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWorkflows();
  }, [tenantId]);

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/workflows`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setWorkflows(data.workflows || []);
        }
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const createWorkflow = (template?: Workflow) => {
    const newWorkflow: Workflow = template || {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: 'Describe your workflow',
      category: 'custom',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Start',
          description: 'Workflow trigger',
          config: { type: 'manual' },
          position: { x: 100, y: 200 },
          connections: [],
          status: 'active',
        },
        {
          id: 'end-1',
          type: 'end',
          name: 'End',
          description: 'Workflow end',
          config: {},
          position: { x: 700, y: 200 },
          connections: [],
          status: 'active',
        },
      ],
      triggers: [{ type: 'manual', config: {} }],
      variables: {},
    };
    
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const response = await fetch(`${API_BASE}/v1/workflows`, {
        method: selectedWorkflow.id.startsWith('workflow-') ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify(selectedWorkflow),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Workflow saved successfully');
          setIsEditing(false);
          loadWorkflows();
        } else {
          toast.error('Failed to save workflow');
        }
      } else {
        toast.error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Workflow deleted successfully');
          loadWorkflows();
          if (selectedWorkflow?.id === workflowId) {
            setSelectedWorkflow(null);
            setIsEditing(false);
          }
        } else {
          toast.error('Failed to delete workflow');
        }
      } else {
        toast.error('Failed to delete workflow');
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const runWorkflow = async (workflowId: string) => {
    setIsRunning(true);
    try {
      const response = await fetch(`${API_BASE}/v1/workflows/${workflowId}/run`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Workflow started successfully');
        } else {
          toast.error('Failed to start workflow');
        }
      } else {
        toast.error('Failed to start workflow');
      }
    } catch (error) {
      console.error('Failed to run workflow:', error);
      toast.error('Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  };

  const addNode = (type: WorkflowNode['type']) => {
    if (!selectedWorkflow) return;

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      name: `New ${type}`,
      description: `Configure ${type} node`,
      config: {},
      position: { x: 400, y: 200 },
      connections: [],
      status: 'active',
    };

    setSelectedWorkflow(prev => ({
      ...prev!,
      nodes: [...prev!.nodes, newNode],
    }));
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => ({
      ...prev!,
      nodes: prev!.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  };

  const deleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => ({
      ...prev!,
      nodes: prev!.nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          connections: node.connections.filter(id => id !== nodeId),
        })),
    }));
  };

  const renderNode = (node: WorkflowNode) => {
    const nodeType = NODE_TYPES[node.type];
    const Icon = nodeType.icon;

    return (
      <div
        key={node.id}
        className={`absolute p-4 rounded-lg border-2 cursor-move transition-all ${nodeType.bgColor} ${nodeType.borderColor} ${
          selectedNode?.id === node.id ? 'ring-2 ring-cyan-500' : ''
        }`}
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          minWidth: '150px',
        }}
        draggable
        onDragStart={() => setDraggedNode(node.id)}
        onDragEnd={(e) => {
          if (!canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          updateNode(node.id, { position: { x, y } });
        }}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${nodeType.color}`} />
          <span className="text-sm font-medium text-white">{node.name}</span>
          <div className={`w-2 h-2 rounded-full ${
            node.status === 'active' ? 'bg-green-400' :
            node.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
        </div>
        <p className="text-xs text-slate-400">{node.description}</p>
        {node.connections.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            Connected to: {node.connections.length} nodes
          </div>
        )}
      </div>
    );
  };

  if (isEditing && selectedWorkflow) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              ← Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Workflow</h2>
              <p className="text-slate-400">Design your automation workflow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => runWorkflow(selectedWorkflow.id)}
              disabled={isRunning}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button
              onClick={saveWorkflow}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Workflow Properties */}
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white font-medium">Name</Label>
              <Input
                value={selectedWorkflow.name}
                onChange={(e) => setSelectedWorkflow(prev => ({ ...prev!, name: e.target.value }))}
                className="bg-slate-800 border-slate-600"
              />
            </div>
            <div>
              <Label className="text-white font-medium">Category</Label>
              <Select
                value={selectedWorkflow.category}
                onValueChange={(category) => setSelectedWorkflow(prev => ({ ...prev!, category }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-white font-medium">Description</Label>
              <Textarea
                value={selectedWorkflow.description}
                onChange={(e) => setSelectedWorkflow(prev => ({ ...prev!, description: e.target.value }))}
                className="bg-slate-800 border-slate-600"
                rows={2}
              />
            </div>
          </div>
        </Card>

        {/* Node Palette */}
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add Nodes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => addNode(type as WorkflowNode['type'])}
                  className={`border-slate-600 text-slate-300 hover:bg-slate-800 h-auto p-3 ${config.bgColor}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <span className="text-xs capitalize">{type}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Canvas */}
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Canvas</h3>
          <div 
            ref={canvasRef}
            className="relative bg-slate-800/30 rounded-lg border border-slate-600 min-h-[500px] overflow-hidden"
          >
            {selectedWorkflow.nodes.map(renderNode)}
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none">
              {selectedWorkflow.nodes.map(node => 
                node.connections.map(targetId => {
                  const targetNode = selectedWorkflow.nodes.find(n => n.id === targetId);
                  if (!targetNode) return null;
                  
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={node.position.x + 75}
                      y1={node.position.y + 40}
                      x2={targetNode.position.x + 75}
                      y2={targetNode.position.y + 40}
                      stroke="#06b6d4"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })
              )}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#06b6d4"
                  />
                </marker>
              </defs>
            </svg>
          </div>
        </Card>

        {/* Node Configuration */}
        {selectedNode && (
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configure Node</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium">Name</Label>
                <Input
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-white font-medium">Description</Label>
                <Textarea
                  value={selectedNode.description}
                  onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                  rows={2}
                />
              </div>
              
              {/* Node-specific configuration */}
              {selectedNode.type === 'agent' && (
                <div>
                  <Label className="text-white font-medium">Agent</Label>
                  <Select
                    value={selectedNode.config.agent_id || ''}
                    onValueChange={(agent_id) => updateNode(selectedNode.id, { 
                      config: { ...selectedNode.config, agent_id }
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {AGENT_OPTIONS.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-xs text-slate-400">{agent.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNode.type === 'action' && (
                <div>
                  <Label className="text-white font-medium">Action Type</Label>
                  <Select
                    value={selectedNode.config.type || ''}
                    onValueChange={(type) => updateNode(selectedNode.id, { 
                      config: { ...selectedNode.config, type }
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {ACTION_TEMPLATES.map(action => (
                        <SelectItem key={action.id} value={action.id}>
                          <div>
                            <div className="font-medium">{action.name}</div>
                            <div className="text-xs text-slate-400">{action.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Workflow Automation
          </h2>
          <p className="text-slate-400">Design and manage automated workflows</p>
        </div>
        
        <Button
          onClick={() => createWorkflow()}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Workflow Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card key={template.id} className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{template.name}</h4>
                  <p className="text-sm text-slate-400">{template.description}</p>
                  <Badge variant="secondary" className="mt-2 bg-blue-500/20 text-blue-300">
                    {template.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => createWorkflow(template)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    Use Template
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {template.nodes.filter(n => n.type === 'agent').length} agents
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  {template.nodes.filter(n => n.type === 'action').length} actions
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.nodes.filter(n => n.type === 'delay').length} delays
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Workflows */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Custom Workflows
          </h3>
        </div>

        {workflows.length === 0 ? (
          <Card className="bg-slate-900/50 border-cyan-500/20 p-12 text-center">
            <Zap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Workflows Yet</h3>
            <p className="text-slate-400 mb-4">Create your first automation workflow</p>
            <Button
              onClick={() => createWorkflow()}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="bg-slate-900/50 border-cyan-500/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{workflow.name}</h4>
                    <p className="text-sm text-slate-400">{workflow.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {workflow.category}
                      </Badge>
                      <div className="text-xs text-slate-500">
                        {(workflow.nodes ?? []).length} nodes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => runWorkflow(workflow.id)}
                      disabled={isRunning}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsEditing(true);
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {(workflow.triggers ?? []).length} triggers
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(workflow.nodes ?? []).filter(n => n.type === 'agent').length} agents
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    {(workflow.nodes ?? []).filter(n => n.type === 'action').length} actions
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
