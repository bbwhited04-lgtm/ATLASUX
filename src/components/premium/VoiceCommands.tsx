import { useState } from 'react';
import { 
  Mic, MicOff, Volume2, Settings, Zap, Brain,
  CheckCircle, Clock, TrendingUp, Sparkles,
  MessageSquare, Calendar, FileText, Mail,
  Play, Pause, SkipForward, Search, Home
} from 'lucide-react';

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [wakeWord, setWakeWord] = useState('Hey Atlas');

  const voiceCommands: any[] = [];

  const recentCommands: any[] = [];

  const customCommands: any[] = [];

  const voiceSettings = [
    { name: 'Wake Word', value: 'Hey Atlas', options: ['Hey Atlas', 'Atlas', 'Computer'] },
    { name: 'Voice Response', value: 'Enabled', options: ['Enabled', 'Disabled', 'Headphones Only'] },
    { name: 'Language', value: 'English (US)', options: ['English (US)', 'English (UK)', 'Spanish', 'French', 'German'] },
    { name: 'Confirmation Sound', value: 'Enabled', options: ['Enabled', 'Disabled', 'Vibrate Only'] },
    { name: 'Privacy Mode', value: 'Off', options: ['Off', 'On - Mute When Away', 'On - Always Mute'] },
  ];

  const voiceStats = {
    totalCommands: 8934,
    successRate: 97.3,
    avgResponseTime: '1.2s',
    mostUsed: 'What did I miss?',
    timeSaved: '34h',
  };

  const shortcuts = [
    { action: 'Quick Capture', phrase: 'Hey Atlas, note: [text]', icon: FileText },
    { action: 'Meeting Join', phrase: 'Hey Atlas, join meeting', icon: Calendar },
    { action: 'Email Check', phrase: 'Hey Atlas, any urgent emails?', icon: Mail },
    { action: 'Daily Briefing', phrase: 'Hey Atlas, brief me', icon: MessageSquare },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mic className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Voice Commands</h2>
        </div>
        <p className="text-slate-400">
          Control Atlas with your voice - Always listening, always ready
        </p>
      </div>

      {/* Voice Status */}
      <div className={`mb-8 p-6 rounded-xl border ${
        isListening 
          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30' 
          : 'bg-slate-900/50 border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
              isListening 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-500' 
                : 'bg-slate-700'
            }`}>
              {isListening ? (
                <>
                  <Mic className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
                </>
              ) : (
                <MicOff className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {isListening ? 'Listening...' : 'Voice Commands Paused'}
              </h3>
              <p className="text-slate-400">
                {isListening 
                  ? `Say "${wakeWord}" followed by your command` 
                  : 'Click to activate voice commands'}
              </p>
              {isListening && lastCommand && (
                <div className="mt-2 text-sm text-cyan-400 font-semibold">
                  Last: "{lastCommand}"
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsListening(!isListening)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isListening
                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
            }`}
          >
            {isListening ? (
              <>
                <Pause className="w-5 h-5 inline mr-2" />
                Pause Listening
              </>
            ) : (
              <>
                <Play className="w-5 h-5 inline mr-2" />
                Start Listening
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <MessageSquare className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{voiceStats.totalCommands.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Total commands</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{voiceStats.successRate}%</div>
          <div className="text-sm text-slate-400">Success rate</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{voiceStats.avgResponseTime}</div>
          <div className="text-sm text-slate-400">Avg response</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{voiceStats.mostUsed}</div>
          <div className="text-sm text-slate-400">Most used</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{voiceStats.timeSaved}</div>
          <div className="text-sm text-slate-400">Time saved</div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Quick Shortcuts</h3>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {shortcuts.map((shortcut, idx) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="font-semibold text-white mb-2">{shortcut.action}</div>
                <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2 rounded">
                  "{shortcut.phrase}"
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Available Commands */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Available Commands</h3>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {voiceCommands.map((category, idx) => (
              <div key={idx}>
                <div className="text-sm font-semibold text-cyan-400 mb-3">{category.category}</div>
                <div className="space-y-2 mb-4">
                  {category.commands.map((cmd, cmdIdx) => (
                    <div
                      key={cmdIdx}
                      className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-1 font-mono">
                            "{cmd.phrase}"
                          </div>
                          <div className="text-xs text-slate-400">{cmd.action}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {cmd.used} uses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Commands */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Recent Commands</h3>
          </div>

          <div className="space-y-3">
            {recentCommands.map((cmd, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    {cmd.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-white font-mono mb-1">
                        "{cmd.command}"
                      </div>
                      <div className={`text-xs ${cmd.success ? 'text-green-400' : 'text-red-400'}`}>
                        {cmd.response}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                    {cmd.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Voice Settings</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {voiceSettings.map((setting, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">{setting.name}</label>
                <Volume2 className="w-4 h-4 text-slate-500" />
              </div>
              <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500">
                {setting.options.map((option, optIdx) => (
                  <option key={optIdx} value={option} selected={option === setting.value}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">Always-On Voice Recognition</div>
              <div className="text-xs text-slate-400">
                Atlas is always listening for the wake word "{wakeWord}". Your conversations are processed locally and never recorded unless the wake word is detected. You can pause listening at any time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}