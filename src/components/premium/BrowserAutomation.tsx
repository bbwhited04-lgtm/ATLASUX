import { useState } from 'react';
import { 
  Globe, Play, Pause, Square, Save, Download,
  Eye, MousePointer, Keyboard, Clock, Zap,
  CheckCircle, AlertCircle, Copy, Settings,
  Sparkles, Brain, TrendingUp, Calendar, FileText
} from 'lucide-react';

export function BrowserAutomation() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const automationStats = {
    recorded: 0,
    executed: 0,
    timeSaved: '0h',
    successRate: 0,
  };

  const savedAutomations: any[] = [];

  const recordedActions: any[] = [];

  const actionTypes = [
    { name: 'Navigate', icon: Globe, description: 'Go to URL' },
    { name: 'Click', icon: MousePointer, description: 'Click element' },
    { name: 'Type', icon: Keyboard, description: 'Enter text' },
    { name: 'Wait', icon: Clock, description: 'Pause execution' },
    { name: 'Scrape', icon: FileText, description: 'Extract data' },
    { name: 'Screenshot', icon: Eye, description: 'Capture screen' },
  ];

  const executionLog = [
    { time: '14:23:45', status: 'success', message: 'Started automation: Daily Data Scraping' },
    { time: '14:23:46', status: 'info', message: 'Navigating to https://example.com...' },
    { time: '14:23:48', status: 'success', message: 'Page loaded successfully' },
    { time: '14:23:50', status: 'info', message: 'Filling form fields...' },
    { time: '14:23:52', status: 'success', message: 'Form submitted' },
    { time: '14:23:54', status: 'info', message: 'Scraping data from page...' },
    { time: '14:23:56', status: 'success', message: 'Extracted 127 data points' },
    { time: '14:23:58', status: 'success', message: 'Automation completed successfully' },
  ];

  const scheduleOptions = [
    { name: 'Run Once', description: 'Execute one time', selected: false },
    { name: 'Daily', description: 'Every day at specific time', selected: true },
    { name: 'Weekly', description: 'Specific days of week', selected: false },
    { name: 'Monthly', description: 'Once per month', selected: false },
  ];

  const aiFeatures = [
    { name: 'Smart Waits', description: 'AI detects when page is ready', enabled: true },
    { name: 'Element Recovery', description: 'Finds elements even if page changes', enabled: true },
    { name: 'Error Handling', description: 'Automatically retry failed steps', enabled: true },
    { name: 'CAPTCHA Solver', description: 'AI solves common CAPTCHAs', enabled: false },
    { name: 'Data Extraction', description: 'Intelligently extract structured data', enabled: true },
    { name: 'Visual Verification', description: 'Verify page state with AI', enabled: true },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Browser Automation Recorder</h2>
        </div>
        <p className="text-slate-400">
          Record browser actions and replay them automatically - RPA for the web
        </p>
      </div>

      {/* Recording Status */}
      <div className={`mb-8 p-6 rounded-xl border ${
        isRecording 
          ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30' 
          : 'bg-slate-900/50 border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                : 'bg-slate-700'
            }`}>
              {isRecording ? (
                <>
                  <Square className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                </>
              ) : (
                <Play className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {isRecording ? 'Recording Actions...' : 'Ready to Record'}
              </h3>
              <p className="text-slate-400">
                {isRecording 
                  ? '8 actions recorded • Click "Stop" when finished' 
                  : 'Click "Start Recording" to begin capturing browser actions'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRecording ? (
              <button
                onClick={() => setIsRecording(false)}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Recording
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Automation Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Save className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{automationStats.recorded}</div>
          <div className="text-sm text-slate-400">Recorded automations</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{automationStats.executed}</div>
          <div className="text-sm text-slate-400">Total executions</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{automationStats.timeSaved}</div>
          <div className="text-sm text-slate-400">Time saved</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{automationStats.successRate}%</div>
          <div className="text-sm text-slate-400">Success rate</div>
        </div>
      </div>

      {/* Main Automation Interface */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden mb-8">
        <div className="grid lg:grid-cols-12">
          {/* Actions Sidebar */}
          <div className="lg:col-span-3 border-r border-slate-700/50 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Action Types</h3>
            <div className="space-y-2 mb-6">
              {actionTypes.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-white">{action.name}</span>
                    </div>
                    <div className="text-xs text-slate-400">{action.description}</div>
                  </div>
                );
              })}
            </div>

            <h3 className="text-sm font-semibold text-white mb-3">Schedule</h3>
            <div className="space-y-2">
              {scheduleOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    option.selected
                      ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">{option.name}</div>
                  <div className="text-xs opacity-70">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recorded Actions */}
          <div className="lg:col-span-6 border-r border-slate-700/50">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recorded Actions</h3>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors flex items-center gap-2">
                    <Copy className="w-3 h-3" />
                    Duplicate
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <><Pause className="w-3 h-3" /> Pause</>
                    ) : (
                      <><Play className="w-3 h-3" /> Replay</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[500px]">
              {recordedActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.step}
                    className="p-4 border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/20 rounded-lg flex-shrink-0">
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">
                            Step {action.step}: {action.action}
                          </span>
                          <span className="text-xs text-slate-500">{action.timestamp}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono bg-slate-950/50 p-2 rounded">
                          {action.target}
                        </div>
                      </div>
                      <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                        <Settings className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Log */}
          <div className="lg:col-span-3 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Execution Log</h3>
            <div className="space-y-2">
              {executionLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-950/50 rounded-lg border border-slate-700/50 text-xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : log.status === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                    )}
                    <span className="text-slate-500">{log.time}</span>
                  </div>
                  <div className="text-slate-300">{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Automations */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Saved Automations</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {savedAutomations.map((automation, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{automation.name}</div>
                  <div className="text-xs text-slate-400 mb-2">
                    {automation.actions} actions • {automation.avgDuration}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{automation.runs} runs</span>
                    <span>•</span>
                    <span>{automation.lastRun}</span>
                  </div>
                </div>
                {automation.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors flex items-center justify-center gap-1">
                  <Play className="w-3 h-3" />
                  Run
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI-Powered Features</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {aiFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-white text-sm">{feature.name}</div>
                <button
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    feature.enabled
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="text-xs text-slate-400">{feature.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">Intelligent Browser Automation</div>
              <div className="text-xs text-slate-400">
                Atlas records your browser actions and replays them automatically. AI adapts to page changes, handles errors, and ensures reliable execution. Perfect for data scraping, form filling, and repetitive web tasks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}