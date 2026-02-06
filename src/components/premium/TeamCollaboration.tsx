import { useState } from 'react';
import { 
  Users, Brain, ArrowRightLeft, Activity, 
  Share2, Video, MessageSquare, BookOpen,
  Clock, CheckCircle, Play, Eye
} from 'lucide-react';

export function TeamCollaboration() {
  const knowledgeBase: any[] = [];

  const handoffRequests: any[] = [];

  const activityFeed: any[] = [];

  const sharedAutomations: any[] = [];

  const screenRecordings: any[] = [];

  const teamMembers: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Team Collaboration</h2>
        </div>
        <p className="text-slate-400">
          Enterprise team features and shared workflows
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Brain className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Knowledge base entries</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <ArrowRightLeft className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Active handoffs</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Share2 className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Shared automations</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Video className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Screen recordings</div>
        </div>
      </div>

      {/* Shared AI Knowledge Base */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Shared AI Knowledge Base</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors">
            Add Topic
          </button>
        </div>

        <div className="grid gap-3">
          {knowledgeBase.map((topic) => (
            <div
              key={topic.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{topic.topic}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{topic.entries} entries</span>
                      <span>•</span>
                      <span>{topic.contributors} contributors</span>
                      <span>•</span>
                      <span className="text-cyan-400">{topic.usage} uses</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Updated {topic.lastUpdate}</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                  View
                </button>
              </div>
            </div>
          ))}
          
          {knowledgeBase.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No knowledge base entries yet. Add topics to build shared knowledge for your team.
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">Team-Wide Learning</div>
              <div className="text-xs text-slate-400">
                All team members' Atlas instances contribute to and learn from the shared knowledge base.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Handoff Mode */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Handoff Mode</h3>
          </div>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            Create Handoff
          </button>
        </div>

        <div className="grid gap-3">
          {handoffRequests.map((handoff) => (
            <div
              key={handoff.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <ArrowRightLeft className="w-8 h-8 text-blue-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{handoff.from}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-cyan-400">{handoff.to}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        handoff.priority === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : handoff.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {handoff.priority}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 mb-1">{handoff.task}</div>
                    <div className="text-xs text-slate-500">{handoff.time}</div>
                  </div>
                </div>
                <div>
                  {handoff.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                  {handoff.status === 'accepted' && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <Play className="w-4 h-4" />
                      <span>In Progress</span>
                    </div>
                  )}
                  {handoff.status === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {handoffRequests.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No active handoffs. Transfer tasks between team members seamlessly.
            </div>
          )}
        </div>
      </div>

      {/* Team Activity Feed */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Team Activity Feed</h3>
        </div>

        <div className="space-y-4">
          {activityFeed.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-500/20 to-${activity.color}-600/20 rounded-full flex items-center justify-center font-semibold text-${activity.color}-400 text-sm`}>
                {activity.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{activity.user}</span>
                  <span className="text-slate-400">{activity.action}</span>
                </div>
                <div className="text-sm text-cyan-400 mb-1">{activity.target}</div>
                <div className="text-xs text-slate-500">{activity.time}</div>
              </div>
            </div>
          ))}
          
          {activityFeed.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No team activity yet. See what your team members are working on in real-time.
            </div>
          )}
        </div>
      </div>

      {/* Shared Automations */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Shared Automations</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Browse Library
          </button>
        </div>

        <div className="grid gap-3">
          {sharedAutomations.map((automation) => (
            <div
              key={automation.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{automation.name}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>By {automation.creator}</span>
                      <span>•</span>
                      <span>{automation.uses} uses</span>
                      <span>•</span>
                      <span className="text-green-400">{automation.team}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span>{automation.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 transition-colors">
                  Use Workflow
                </button>
              </div>
            </div>
          ))}
          
          {sharedAutomations.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No shared automations yet. Browse the library to discover workflows created by your team.
            </div>
          )}
        </div>
      </div>

      {/* Screen Recording & Sharing */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Screen Recording & Sharing</h3>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 rounded-lg text-sm font-semibold transition-all">
            Start Recording
          </button>
        </div>

        <div className="grid gap-3">
          {screenRecordings.map((recording) => (
            <div
              key={recording.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <Video className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{recording.title}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-1">
                      <span>By {recording.creator}</span>
                      <span>•</span>
                      <span>{recording.duration}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{recording.views} views</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {recording.highlights} AI highlights • {recording.date}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 transition-colors">
                    Watch
                  </button>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {screenRecordings.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No recordings yet. Capture and share screen recordings with AI-generated highlights.
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-400 mb-1">AI-Generated Highlights</div>
              <div className="text-xs text-slate-400">
                Screen recordings automatically include AI-generated highlights, summaries, and timestamps for easy navigation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}