import { useState } from 'react';
import { 
  Workflow, Plus, Play, Save, Copy, Trash2, 
  Settings, Zap, Clock, Filter, Database,
  Mail, MessageSquare, FileText, Calendar, Cloud,
  GitBranch, CheckCircle, XCircle, AlertCircle,
  Sparkles, Code, Globe, Upload, Download
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'delay';
  name: string;
  icon: any;
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

export function VisualWorkflowBuilder() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const nodeTypes: any[] = [];

  const exampleWorkflows: any[] = [];

  const activeWorkflow = {
    name: 'New Workflow',
    nodes: []
  };

  const executionHistory: any[] = [];

  const savedWorkflows: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Workflow className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Visual Workflow Builder</h2>
        </div>
        <p className="text-slate-400">
          Drag-and-drop automation builder - No code required
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Workflow className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">12</div>
          <div className="text-sm text-slate-400">Active workflows</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">1,678</div>
          <div className="text-sm text-slate-400">Total executions</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">98.7%</div>
          <div className="text-sm text-slate-400">Success rate</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">47h</div>
          <div className="text-sm text-slate-400">Time saved</div>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-white">Canvas: {activeWorkflow.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test Run
            </button>
          </div>
        </div>

        {/* Visual Canvas */}
        <div className="relative bg-slate-950/50 rounded-lg border border-slate-700/50 p-8 min-h-96 overflow-auto">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          {/* Workflow Nodes */}
          <div className="relative">
            {activeWorkflow.nodes.map((node, idx) => {
              const Icon = node.icon;
              return (
                <div key={node.id}>
                  {/* Node */}
                  <div
                    className="absolute bg-slate-900 border-2 border-cyan-500/50 rounded-xl p-4 w-48 cursor-move hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                    style={{ left: node.position.x, top: node.position.y }}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-cyan-400 uppercase font-semibold">{node.type}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{node.name}</div>
                    <div className="text-xs text-slate-400">Click to configure</div>
                  </div>

                  {/* Connection Lines */}
                  {node.connections.map((targetId) => {
                    const targetNode = activeWorkflow.nodes.find(n => n.id === targetId);
                    if (!targetNode) return null;
                    
                    return (
                      <svg
                        key={`${node.id}-${targetId}`}
                        className="absolute pointer-events-none"
                        style={{ 
                          left: 0, 
                          top: 0,
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        <line
                          x1={node.position.x + 192}
                          y1={node.position.y + 40}
                          x2={targetNode.position.x}
                          y2={targetNode.position.y + 40}
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                        />
                      </svg>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Add Node Button */}
          <button className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-cyan-500/30">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Node Library */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Node Library</h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {nodeTypes.map((node, idx) => {
              const Icon = node.icon;
              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-move"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br from-${node.color}-500/20 to-${node.color}-600/20 rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{node.name}</span>
                        <span className={`text-xs px-2 py-0.5 bg-${node.color}-500/20 border border-${node.color}-500/30 rounded text-${node.color}-400`}>
                          {node.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{node.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Logs */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Execution Logs</h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {executionHistory.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-semibold text-white">{log.workflow}</span>
                  </div>
                  <span className="text-xs text-slate-500">{log.timestamp}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2">{log.message}</div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{log.nodes} nodes</span>
                  <span>•</span>
                  <span>{log.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Workflows */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Workflow className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Your Workflows</h3>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {savedWorkflows.map((workflow, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{workflow.name}</div>
                  <div className="text-xs text-slate-400 mb-2">{workflow.description}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{workflow.nodes} nodes</span>
                    <span>•</span>
                    <span>{workflow.runs} runs</span>
                    <span>•</span>
                    <span>Last: {workflow.lastRun}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workflow.active ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400 font-semibold">ACTIVE</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">INACTIVE</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                  Edit
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  <Play className="w-3 h-3" />
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}