/**
 * Atlas Agent Configuration Settings
 * Voice, personality, memory, orchestration, and compliance settings
 */

import { useState, useEffect } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { 
  Volume2, 
  Brain, 
  Settings2, 
  Shield, 
  Zap, 
  Clock, 
  Database, 
  Users, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface AtlasConfig {
  voice: {
    enabled: boolean;
    provider: string;
    model: string;
    voice_id: string;
    speed: number;
    pitch: number;
    volume: number;
  };
  personality: {
    tone: 'strategic' | 'professional' | 'mentor' | 'collaborative';
    response_style: 'concise' | 'detailed' | 'conversational';
    expertise_level: 'executive' | 'senior' | 'expert';
    formality: 'formal' | 'casual' | 'friendly' | 'professional';
  };
  memory: {
    retention_hours: number;
    context_window: number;
    auto_cleanup: boolean;
    save_conversations: boolean;
    max_conversations: number;
  };
  orchestration: {
    auto_delegate: boolean;
    approval_threshold: 'low' | 'medium' | 'high';
    max_concurrent_tasks: number;
    task_timeout_ms: number;
    escalation_enabled: boolean;
  };
  compliance: {
    audit_level: 'minimal' | 'standard' | 'comprehensive';
    human_in_loop: boolean;
    risk_sensitivity: 'low' | 'medium' | 'high';
    data_retention_days: number;
    encryption_enabled: boolean;
  };
}

const defaultConfig: AtlasConfig = {
  voice: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4-turbo',
    voice_id: 'alloy',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
  },
  personality: {
    tone: 'strategic',
    response_style: 'conversational',
    expertise_level: 'executive',
    formality: 'professional',
  },
  memory: {
    retention_hours: 24,
    context_window: 10,
    auto_cleanup: true,
    save_conversations: true,
    max_conversations: 100,
  },
  orchestration: {
    auto_delegate: true,
    approval_threshold: 'medium',
    max_concurrent_tasks: 10,
    task_timeout_ms: 300000,
    escalation_enabled: true,
  },
  compliance: {
    audit_level: 'standard',
    human_in_loop: true,
    risk_sensitivity: 'medium',
    data_retention_days: 90,
    encryption_enabled: true,
  },
};

const voiceOptions = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'More reflective, thoughtful' },
  { id: 'fable', name: 'Fable', description: 'Expressive, storytelling' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
  { id: 'nova', name: 'Nova', description: 'Bright, energetic' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle' },
];

const presetProfiles = {
  developer: {
    voice: { ...defaultConfig.voice, speed: 1.2 },
    personality: { ...defaultConfig.personality, tone: 'collaborative' as const, formality: 'casual' as const },
    memory: { ...defaultConfig.memory, retention_hours: 48, context_window: 20 },
    orchestration: { ...defaultConfig.orchestration, auto_delegate: true, approval_threshold: 'low' as const },
    compliance: { ...defaultConfig.compliance, audit_level: 'minimal' as const, human_in_loop: false },
  },
  executive: {
    voice: { ...defaultConfig.voice, speed: 0.9 },
    personality: { ...defaultConfig.personality, tone: 'strategic' as const, formality: 'formal' as const },
    memory: { ...defaultConfig.memory, retention_hours: 72, context_window: 15 },
    orchestration: { ...defaultConfig.orchestration, auto_delegate: true, approval_threshold: 'high' as const },
    compliance: { ...defaultConfig.compliance, audit_level: 'comprehensive' as const, human_in_loop: true },
  },
  compliance: {
    voice: { ...defaultConfig.voice, speed: 1.0 },
    personality: { ...defaultConfig.personality, tone: 'professional' as const, formality: 'formal' as const },
    memory: { ...defaultConfig.memory, retention_hours: 365, context_window: 5 },
    orchestration: { ...defaultConfig.orchestration, auto_delegate: false, approval_threshold: 'high' as const },
    compliance: { ...defaultConfig.compliance, audit_level: 'comprehensive' as const, human_in_loop: true, risk_sensitivity: 'high' as const },
  },
};

export default function AtlasAgentSettings() {
  const { tenantId } = useActiveTenant();
  const [config, setConfig] = useState<AtlasConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Load configuration
  useEffect(() => {
    loadConfiguration();
  }, [tenantId]);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/config`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.config) {
          setConfig({ ...defaultConfig, ...data.config });
        }
      }
    } catch (error) {
      console.error('Failed to load Atlas configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({ config }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Atlas configuration saved successfully');
          setHasChanges(false);
        } else {
          toast.error('Failed to save configuration');
        }
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save Atlas configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testVoiceSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/voice/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          text: "This is a test of your Atlas voice settings.",
          voice_config: config.voice,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.audio_url) {
          const audio = new Audio(data.audio_url);
          audio.play().catch(console.error);
          toast.success('Voice test playing');
        }
      }
    } catch (error) {
      console.error('Voice test failed:', error);
      toast.error('Voice test failed');
    }
  };

  const applyPreset = (presetName: keyof typeof presetProfiles) => {
    setConfig(prev => ({
      ...prev,
      ...presetProfiles[presetName],
    }));
    setHasChanges(true);
    toast.success(`Applied ${presetName} preset`);
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
    toast.success('Reset to default settings');
  };

  const updateConfig = (section: keyof AtlasConfig, updates: Partial<AtlasConfig[keyof AtlasConfig]>) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-slate-400">Loading Atlas configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Atlas Agent Configuration
          </h2>
          <p className="text-slate-400">Customize Atlas voice, personality, memory, and behavior</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-slate-400">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'checking' ? 'Checking...' : 
               'Disconnected'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={saveConfiguration}
            disabled={!hasChanges || isSaving}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Quick Presets */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(presetProfiles).map(([name, preset]) => (
            <Button
              key={name}
              variant="outline"
              onClick={() => applyPreset(name as keyof typeof presetProfiles)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium capitalize">{name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {name === 'developer' && 'Debug mode, verbose logging'}
                  {name === 'executive' && 'High-level summaries, voice enabled'}
                  {name === 'compliance' && 'Maximum audit, human approval'}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="voice" className="data-[state=active]:bg-cyan-600">
            <Volume2 className="w-4 h-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="personality" className="data-[state=active]:bg-cyan-600">
            <Brain className="w-4 h-4 mr-2" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="memory" className="data-[state=active]:bg-cyan-600">
            <Database className="w-4 h-4 mr-2" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="data-[state=active]:bg-cyan-600">
            <Settings2 className="w-4 h-4 mr-2" />
            Orchestration
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-cyan-600">
            <Shield className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Voice Settings */}
        <TabsContent value="voice" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Voice Configuration</h3>
            
            <div className="space-y-6">
              {/* Enable Voice */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Enable Voice</Label>
                  <p className="text-sm text-slate-400">Allow Atlas to speak responses</p>
                </div>
                <Switch
                  checked={config.voice.enabled}
                  onCheckedChange={(enabled) => updateConfig('voice', { enabled })}
                />
              </div>

              {config.voice.enabled && (
                <>
                  {/* Voice Selection */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium">Voice Model</Label>
                    <Select
                      value={config.voice.voice_id}
                      onValueChange={(voice_id) => updateConfig('voice', { voice_id })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div>
                              <div className="font-medium">{voice.name}</div>
                              <div className="text-xs text-slate-400">{voice.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label className="text-white font-medium">Speed</Label>
                      <Slider
                        value={[config.voice.speed]}
                        onValueChange={([speed]) => updateConfig('voice', { speed })}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-sm text-slate-400">{config.voice.speed.toFixed(1)}x</div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white font-medium">Pitch</Label>
                      <Slider
                        value={[config.voice.pitch]}
                        onValueChange={([pitch]) => updateConfig('voice', { pitch })}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-sm text-slate-400">{config.voice.pitch.toFixed(1)}x</div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white font-medium">Volume</Label>
                      <Slider
                        value={[config.voice.volume]}
                        onValueChange={([volume]) => updateConfig('voice', { volume })}
                        min={0.0}
                        max={1.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-sm text-slate-400">{Math.round(config.voice.volume * 100)}%</div>
                    </div>
                  </div>

                  {/* Test Voice */}
                  <Button onClick={testVoiceSettings} className="bg-cyan-600 hover:bg-cyan-700">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Test Voice
                  </Button>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Personality Settings */}
        <TabsContent value="personality" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Personality Configuration</h3>
            
            <div className="space-y-6">
              {/* Tone */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Communication Tone</Label>
                <Select
                  value={config.personality.tone}
                  onValueChange={(tone: any) => updateConfig('personality', { tone })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="strategic">Strategic - Executive-level planning</SelectItem>
                    <SelectItem value="professional">Professional - Business-focused</SelectItem>
                    <SelectItem value="mentor">Mentor - Guiding and educational</SelectItem>
                    <SelectItem value="collaborative">Collaborative - Team-oriented</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Style */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Response Style</Label>
                <Select
                  value={config.personality.response_style}
                  onValueChange={(response_style: any) => updateConfig('personality', { response_style })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="concise">Concise - Brief and to the point</SelectItem>
                    <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                    <SelectItem value="conversational">Conversational - Natural dialogue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expertise Level */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Expertise Level</Label>
                <Select
                  value={config.personality.expertise_level}
                  onValueChange={(expertise_level: any) => updateConfig('personality', { expertise_level })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="executive">Executive - Strategic oversight</SelectItem>
                    <SelectItem value="senior">Senior - Experienced professional</SelectItem>
                    <SelectItem value="expert">Expert - Deep domain knowledge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formality */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Formality Level</Label>
                <Select
                  value={config.personality.formality}
                  onValueChange={(formality: any) => updateConfig('personality', { formality })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="formal">Formal - Professional communication</SelectItem>
                    <SelectItem value="casual">Casual - Relaxed communication</SelectItem>
                    <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Memory Settings */}
        <TabsContent value="memory" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Memory Configuration</h3>
            
            <div className="space-y-6">
              {/* Retention Hours */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Conversation Retention</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.memory.retention_hours]}
                    onValueChange={([retention_hours]) => updateConfig('memory', { retention_hours })}
                    min={1}
                    max={168}
                    step={1}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {config.memory.retention_hours}h
                  </div>
                </div>
                <p className="text-sm text-slate-400">How long to remember conversations</p>
              </div>

              {/* Context Window */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Context Window</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.memory.context_window]}
                    onValueChange={([context_window]) => updateConfig('memory', { context_window })}
                    min={3}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {config.memory.context_window} msgs
                  </div>
                </div>
                <p className="text-sm text-slate-400">Number of recent messages to consider</p>
              </div>

              {/* Max Conversations */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Maximum Conversations</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.memory.max_conversations]}
                    onValueChange={([max_conversations]) => updateConfig('memory', { max_conversations })}
                    min={10}
                    max={1000}
                    step={10}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {config.memory.max_conversations}
                  </div>
                </div>
                <p className="text-sm text-slate-400">Maximum concurrent conversations</p>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Auto Cleanup</Label>
                    <p className="text-sm text-slate-400">Automatically remove old conversations</p>
                  </div>
                  <Switch
                    checked={config.memory.auto_cleanup}
                    onCheckedChange={(auto_cleanup) => updateConfig('memory', { auto_cleanup })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Save Conversations</Label>
                    <p className="text-sm text-slate-400">Persist conversations to database</p>
                  </div>
                  <Switch
                    checked={config.memory.save_conversations}
                    onCheckedChange={(save_conversations) => updateConfig('memory', { save_conversations })}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Orchestration Settings */}
        <TabsContent value="orchestration" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Orchestration Configuration</h3>
            
            <div className="space-y-6">
              {/* Auto Delegate */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Auto Delegate</Label>
                  <p className="text-sm text-slate-400">Automatically delegate tasks to sub-agents</p>
                </div>
                <Switch
                  checked={config.orchestration.auto_delegate}
                  onCheckedChange={(auto_delegate) => updateConfig('orchestration', { auto_delegate })}
                />
              </div>

              {/* Approval Threshold */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Approval Threshold</Label>
                <Select
                  value={config.orchestration.approval_threshold}
                  onValueChange={(approval_threshold: any) => updateConfig('orchestration', { approval_threshold })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="low">Low - Minimal human approval</SelectItem>
                    <SelectItem value="medium">Medium - Balanced automation</SelectItem>
                    <SelectItem value="high">High - Maximum oversight</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">When to require human approval</p>
              </div>

              {/* Max Concurrent Tasks */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Max Concurrent Tasks</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.orchestration.max_concurrent_tasks]}
                    onValueChange={([max_concurrent_tasks]) => updateConfig('orchestration', { max_concurrent_tasks })}
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {config.orchestration.max_concurrent_tasks}
                  </div>
                </div>
                <p className="text-sm text-slate-400">Maximum simultaneous orchestration tasks</p>
              </div>

              {/* Task Timeout */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Task Timeout</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.orchestration.task_timeout_ms / 1000 / 60]}
                    onValueChange={([minutes]) => updateConfig('orchestration', { task_timeout_ms: minutes * 60 * 1000 })}
                    min={1}
                    max={60}
                    step={1}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {Math.round(config.orchestration.task_timeout_ms / 1000 / 60)}m
                  </div>
                </div>
                <p className="text-sm text-slate-400">Task timeout in minutes</p>
              </div>

              {/* Escalation */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Escalation Enabled</Label>
                  <p className="text-sm text-slate-400">Auto-escalate failed tasks to human oversight</p>
                </div>
                <Switch
                  checked={config.orchestration.escalation_enabled}
                  onCheckedChange={(escalation_enabled) => updateConfig('orchestration', { escalation_enabled })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Settings */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Compliance Configuration</h3>
            
            <div className="space-y-6">
              {/* Audit Level */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Audit Level</Label>
                <Select
                  value={config.compliance.audit_level}
                  onValueChange={(audit_level: any) => updateConfig('compliance', { audit_level })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="minimal">Minimal - Essential logging only</SelectItem>
                    <SelectItem value="standard">Standard - Comprehensive logging</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive - Maximum detail</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">Level of audit trail detail</p>
              </div>

              {/* Human in Loop */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Human-in-the-Loop</Label>
                  <p className="text-sm text-slate-400">Require human approval for risk actions</p>
                </div>
                <Switch
                  checked={config.compliance.human_in_loop}
                  onCheckedChange={(human_in_loop) => updateConfig('compliance', { human_in_loop })}
                />
              </div>

              {/* Risk Sensitivity */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Risk Sensitivity</Label>
                <Select
                  value={config.compliance.risk_sensitivity}
                  onValueChange={(risk_sensitivity: any) => updateConfig('compliance', { risk_sensitivity })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="low">Low - Minimal restrictions</SelectItem>
                    <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                    <SelectItem value="high">High - Maximum security</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">Sensitivity to risk factors</p>
              </div>

              {/* Data Retention */}
              <div className="space-y-3">
                <Label className="text-white font-medium">Data Retention</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.compliance.data_retention_days]}
                    onValueChange={([data_retention_days]) => updateConfig('compliance', { data_retention_days })}
                    min={7}
                    max={365}
                    step={7}
                    className="flex-1"
                  />
                  <div className="text-sm text-slate-400 w-20">
                    {config.compliance.data_retention_days}d
                  </div>
                </div>
                <p className="text-sm text-slate-400">Days to retain audit and conversation data</p>
              </div>

              {/* Encryption */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Encryption Enabled</Label>
                  <p className="text-sm text-slate-400">Encrypt sensitive conversation data</p>
                </div>
                <Switch
                  checked={config.compliance.encryption_enabled}
                  onCheckedChange={(encryption_enabled) => updateConfig('compliance', { encryption_enabled })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
