/**
 * Voice Command System for Atlas
 * Natural voice control across all platforms
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Activity, 
  Clock, 
  Settings, 
  Zap, 
  Globe, 
  Database, 
  Search, 
  BookOpen, 
  TrendingUp,
  Command,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface VoiceCommand {
  id: string;
  command: string;
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface VoiceSettings {
  language: string;
  accent: string;
  sensitivity: number;
  auto_listen: boolean;
  wake_word: string;
  response_voice: boolean;
}

interface CommandIntent {
  name: string;
  patterns: string[];
  description: string;
  examples: string[];
  handler: (parameters: Record<string, any>) => Promise<any>;
}

const COMMAND_INTENTS: CommandIntent[] = [
  {
    name: 'learn_knowledge_base',
    patterns: [
      'learn the entire knowledge base',
      'study all documents',
      'analyze the KB',
      'process all knowledge',
      'learn everything'
    ],
    description: 'Process and learn from all documents in the knowledge base',
    examples: ['Learn the entire knowledge base', 'Study all documents'],
    handler: async (params) => {
      // Call knowledge base learning API
      const response = await fetch('/api/v1/atlas/learn-knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deep_learning: true,
          include_context: true 
        }),
      });
      return response.json();
    }
  },
  {
    name: 'browse_web',
    patterns: [
      'browse {website} for {query}',
      'search {website} for {query}',
      'go to {website} and search for {query}',
      'find {query} on {website}'
    ],
    description: 'Browse specific websites for information',
    examples: ['Browse Dogpile for innovative ideas', 'Search Google for AI trends'],
    handler: async (params) => {
      const { website, query } = params;
      const response = await fetch('/api/v1/atlas/browse-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          website, 
          query,
          max_results: 10 
        }),
      });
      return response.json();
    }
  },
  {
    name: 'summarize_page',
    patterns: [
      'summarize this page',
      'what is this page about',
      'explain this website',
      'give me the summary'
    ],
    description: 'Summarize the current web page',
    examples: ['Summarize this page', 'What is this page about?'],
    handler: async (params) => {
      const response = await fetch('/api/v1/atlas/summarize-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          include_key_points: true,
          max_length: 500 
        }),
      });
      return response.json();
    }
  },
  {
    name: 'analyze_data',
    patterns: [
      'analyze the data',
      'process the analytics',
      'show me insights',
      'what are the trends'
    ],
    description: 'Analyze current data and provide insights',
    examples: ['Analyze the data', 'Show me insights'],
    handler: async (params) => {
      const response = await fetch('/api/v1/atlas/analyze-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          include_predictions: true,
          time_range: '30d' 
        }),
      });
      return response.json();
    }
  },
  {
    name: 'create_workflow',
    patterns: [
      'create a workflow for {task}',
      'build automation for {task}',
      'make a workflow to {task}',
      'automate {task}'
    ],
    description: 'Create automated workflows',
    examples: ['Create a workflow for email processing', 'Automate report generation'],
    handler: async (params) => {
      const { task } = params;
      const response = await fetch('/api/v1/atlas/create-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_description: task,
          auto_optimize: true 
        }),
      });
      return response.json();
    }
  },
  {
    name: 'team_collaboration',
    patterns: [
      'invite {person} to the team',
      'add {person} to {team}',
      'share with {person}',
      'collaborate with {person}'
    ],
    description: 'Manage team collaboration',
    examples: ['Invite John to the team', 'Share with Sarah'],
    handler: async (params) => {
      const { person, team } = params;
      const response = await fetch('/api/v1/atlas/team-collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'invite',
          person,
          team: team || 'default'
        }),
      });
      return response.json();
    }
  },
  {
    name: 'system_status',
    patterns: [
      'what is the system status',
      'how is everything running',
      'check system health',
      'show me the status'
    ],
    description: 'Check overall system status and health',
    examples: ['What is the system status?', 'Check system health'],
    handler: async (params) => {
      const response = await fetch('/api/v1/atlas/system-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    }
  },
  {
    name: 'voice_settings',
    patterns: [
      'enable voice',
      'disable voice',
      'turn on voice',
      'turn off voice',
      'change voice to {voice_type}'
    ],
    description: 'Control voice settings',
    examples: ['Enable voice', 'Change voice to male'],
    handler: async (params) => {
      const { voice_type, action } = params;
      const response = await fetch('/api/v1/atlas/voice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: action || 'toggle',
          voice_type 
        }),
      });
      return response.json();
    }
  }
];

export default function VoiceCommandSystem() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [transcript, setTranscript] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'en-US',
    accent: 'neutral',
    sensitivity: 0.7,
    auto_listen: false,
    wake_word: 'Atlas',
    response_voice: true,
  });
  const [recognition, setRecognition] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize speech recognition and synthesis
    initializeSpeechAPIs();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechAPIs = () => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceSettings.language;
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        
        // Process command when speech ends
        if (finalTranscript.trim()) {
          processVoiceCommand(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error(`Voice recognition error: ${event.error}`);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (voiceSettings.auto_listen) {
          // Restart listening if auto-listen is enabled
          setTimeout(() => startListening(), 1000);
        }
      };
      
      recognitionRef.current = recognition;
      setRecognition(recognition);
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const processVoiceCommand = async (command: string) => {
    const voiceCommand: VoiceCommand = {
      id: `cmd-${Date.now()}`,
      command,
      intent: '',
      parameters: {},
      confidence: 0,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    setCommands(prev => [...prev, voiceCommand]);
    setIsProcessing(true);

    try {
      // Parse command using NLP or pattern matching
      const parsedCommand = parseCommand(command);
      
      // Update command with parsed results
      setCommands(prev => prev.map(cmd => 
        cmd.id === voiceCommand.id 
          ? { ...cmd, ...parsedCommand, status: 'processing' }
          : cmd
      ));

      // Execute the command
      const result = await executeCommand(parsedCommand.intent, parsedCommand.parameters);
      
      // Update command with result
      setCommands(prev => prev.map(cmd => 
        cmd.id === voiceCommand.id 
          ? { ...cmd, status: 'completed', result }
          : cmd
      ));

      // Provide voice feedback
      if (voiceSettings.response_voice && synthesis) {
        speakResponse(`Command completed: ${parsedCommand.intent}`);
      }

      // Show notification
      toast.success(`Command executed: ${parsedCommand.intent}`);
      
    } catch (error) {
      console.error('Command execution error:', error);
      
      // Update command with error
      setCommands(prev => prev.map(cmd => 
        cmd.id === voiceCommand.id 
          ? { 
              ...cmd, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : cmd
      ));

      toast.error(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Find matching intent
    for (const intent of COMMAND_INTENTS) {
      for (const pattern of intent.patterns) {
        const regexPattern = pattern
          .replace(/\{(\w+)\}/g, '(.+?)')
          .replace(/\s+/g, '\\s+');
        
        const regex = new RegExp(regexPattern, 'i');
        const match = lowerCommand.match(regex);
        
        if (match) {
          const parameters: Record<string, any> = {};
          
          // Extract parameters from pattern
          const paramNames = pattern.match(/\{(\w+)\}/g);
          if (paramNames) {
            paramNames.forEach((paramName, index) => {
              const cleanParam = paramName.replace(/[{}]/g, '');
              parameters[cleanParam] = match[index + 1]?.trim();
            });
          }
          
          return {
            intent: intent.name,
            parameters,
            confidence: 0.9,
          };
        }
      }
    }
    
    // Fallback to generic command
    return {
      intent: 'generic',
      parameters: { query: command },
      confidence: 0.5,
    };
  };

  const executeCommand = async (intent: string, parameters: Record<string, any>) => {
    const commandIntent = COMMAND_INTENTS.find(cmd => cmd.name === intent);
    
    if (commandIntent) {
      return await commandIntent.handler(parameters);
    }
    
    // Handle generic commands
    return await handleGenericCommand(parameters);
  };

  const handleGenericCommand = async (parameters: Record<string, any>) => {
    // Send to Atlas for natural language processing
    const response = await fetch('/api/v1/atlas/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: parameters.query,
        context: 'voice_command',
        voice_enabled: false,
      }),
    });
    
    return response.json();
  };

  const speakResponse = (text: string) => {
    if (!synthesis) return;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceSettings.language;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    synthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearCommands = () => {
    setCommands([]);
  };

  const getStatusColor = () => {
    if (isListening) return 'bg-red-500';
    if (isProcessing) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isListening) return <Mic className="w-4 h-4 text-white" />;
    if (isProcessing) return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    return <MicOff className="w-4 h-4 text-white" />;
  };

  return (
    <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${getStatusColor()} flex items-center justify-center`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Voice Commands</h3>
            <p className="text-sm text-slate-400">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-cyan-600 hover:bg-cyan-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isListening ? 'Stop' : 'Start'}
          </Button>
          
          <Button
            variant="outline"
            onClick={clearCommands}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Transcript</span>
          </div>
          <p className="text-slate-300">{transcript}</p>
        </div>
      )}

      {/* Command Examples */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Available Commands</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMAND_INTENTS.map((intent, index) => (
            <div key={index} className="p-3 bg-slate-800/30 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Command className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">{intent.name}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{intent.description}</p>
              <div className="space-y-1">
                {intent.examples.map((example, i) => (
                  <div key={i} className="text-xs text-cyan-300 italic">
                    "{example}"
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div>
        <h4 className="text-white font-medium mb-3">Command History</h4>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {commands.length === 0 ? (
              <div className="text-center py-8">
                <Command className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No commands yet</p>
              </div>
            ) : (
              commands.map((command) => (
                <div
                  key={command.id}
                  className="p-3 bg-slate-800/30 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        command.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        command.status === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
                        command.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                      }>
                        {command.status}
                      </Badge>
                      <span className="text-sm font-medium text-white">
                        {command.intent}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(command.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-2">"{command.command}"</p>
                  
                  {command.parameters && Object.keys(command.parameters).length > 0 && (
                    <div className="text-xs text-slate-400 mb-2">
                      Parameters: {JSON.stringify(command.parameters)}
                    </div>
                  )}
                  
                  {command.result && (
                    <div className="text-xs text-green-400">
                      ✓ Command completed successfully
                    </div>
                  )}
                  
                  {command.error && (
                    <div className="text-xs text-red-400">
                      ✗ {command.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Settings */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
        <h4 className="text-white font-medium mb-3">Voice Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400">Language</label>
            <select 
              value={voiceSettings.language}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full mt-1 bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Auto Listen</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={voiceSettings.auto_listen}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, auto_listen: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-white">
                {voiceSettings.auto_listen ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
