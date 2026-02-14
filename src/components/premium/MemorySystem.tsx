import { useState } from 'react';
import { 
  Brain, User, Calendar, Briefcase, Heart, MapPin,
  MessageSquare, FileText, CheckCircle, Star, Zap,
  TrendingUp, Clock, Sparkles, Search, Settings,
  Plus, Trash2, Edit, Database, Archive
} from 'lucide-react';

export function MemorySystem() {
  const [searchQuery, setSearchQuery] = useState('');

  const memoryStats = {
    totalMemories: 0,
    categories: 0,
    keyPeople: 0,
    preferences: 0,
    conversations: 0,
  };

  const memoryCategories: any[] = [];

  const recentMemories: any[] = [];

  const importantPeople: any[] = [];

  const conversationMemories: any[] = [];

  const smartInsights: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Memory System</h2>
        </div>
        <p className="text-slate-400">
          Atlas remembers everything about you, your preferences, and your work
        </p>
      </div>

      {/* Memory Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Database className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{memoryStats.totalMemories.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Total memories</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Archive className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{memoryStats.categories}</div>
          <div className="text-sm text-slate-400">Categories</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <User className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{memoryStats.keyPeople}</div>
          <div className="text-sm text-slate-400">Key people</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Heart className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{memoryStats.preferences}</div>
          <div className="text-sm text-slate-400">Preferences</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <MessageSquare className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{memoryStats.conversations}</div>
          <div className="text-sm text-slate-400">Conversations</div>
        </div>
      </div>

      {/* Search Memories */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <Search className="w-6 h-6 text-slate-400" />
          <input
            type="text"
            placeholder="Search Atlas's memory... (e.g., 'what's Sarah's email preference?')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
          />
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-semibold transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Smart Insights</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {smartInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="font-semibold text-white">{insight.title}</div>
                </div>
                <div className="text-sm text-slate-400 mb-3">{insight.description}</div>
                <div className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                  💡 {insight.suggestion}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Categories */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Memory Categories</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {memoryCategories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${category.color}-500/20 to-${category.color}-600/20 rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{category.name}</div>
                      <div className="text-xs text-slate-500">{category.count} items</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded"
                    >
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Key People */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Key People</h3>
          </div>

          <div className="space-y-4">
            {importantPeople.map((person, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white mb-1">{person.name}</div>
                    <div className="text-xs text-slate-500 mb-2">{person.role}</div>
                    <div className="text-xs text-slate-400">{person.notes}</div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <div>{person.interactions} interactions</div>
                    <div>Last: {person.lastContact}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {person.preferences.map((pref, prefIdx) => (
                    <span
                      key={prefIdx}
                      className="text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Memories */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Recent Memories</h3>
          </div>

          <div className="space-y-3">
            {recentMemories.map((memory, idx) => {
              const Icon = memory.icon;
              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white mb-1">{memory.content}</div>
                        <div className="text-xs text-slate-500">{memory.context}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {memory.timestamp}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        memory.importance === 'high' 
                          ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                          : memory.importance === 'medium'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {memory.importance}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversation Memories */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Conversation History</h3>
        </div>

        <div className="space-y-4">
          {conversationMemories.map((conv, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white">{conv.topic}</div>
                <span className="text-xs text-slate-500">{conv.date}</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-cyan-400 font-semibold mb-2">Key Points</div>
                  <div className="space-y-1">
                    {conv.keyPoints.map((point, pointIdx) => (
                      <div key={pointIdx} className="text-xs text-slate-400">
                        • {point}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-400 font-semibold mb-2">Decisions Made</div>
                  <div className="space-y-1">
                    {conv.decisions.map((decision, decIdx) => (
                      <div key={decIdx} className="text-xs text-slate-400">
                        ✓ {decision}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-yellow-400 font-semibold mb-2">Follow-Ups</div>
                  <div className="space-y-1">
                    {conv.followUps.map((followUp, fuIdx) => (
                      <div key={fuIdx} className="text-xs text-slate-400">
                        → {followUp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}