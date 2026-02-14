import { useState } from 'react';
import { 
  Calendar, Clock, Users, MapPin, Video,
  Brain, Sparkles, CheckCircle, AlertCircle, Plus,
  TrendingUp, Plane, Zap, FileText, Bell, Download,
  RefreshCw, Link, ExternalLink, Upload
} from 'lucide-react';

export function CalendarScheduling() {
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  
  const stats = {
    meetingsThisWeek: 0,
    timeBlocked: 0,
    conflictsResolved: 0,
    travelTime: 0,
  };

  const upcomingMeetings: any[] = [];
  const timeBlocks: any[] = [];
  const travelCalculations: any[] = [];
  const aiSuggestions: any[] = [];

  const calendarProviders = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      color: 'from-blue-500 to-blue-600',
      description: 'Sync with Google Calendar',
      requiresOAuth: true
    },
    {
      id: 'microsoft',
      name: 'Microsoft Outlook',
      icon: '📧',
      color: 'from-blue-600 to-indigo-600',
      description: 'Sync with Outlook Calendar',
      requiresOAuth: true
    },
    {
      id: 'apple',
      name: 'Apple iCloud',
      icon: '🍎',
      color: 'from-slate-600 to-slate-700',
      description: 'Sync with iPhone/iCloud Calendar',
      requiresOAuth: true
    },
    {
      id: 'caldav',
      name: 'CalDAV',
      icon: '🔗',
      color: 'from-purple-500 to-purple-600',
      description: 'Connect any CalDAV calendar',
      requiresOAuth: false
    },
    {
      id: 'ical',
      name: 'iCal URL',
      icon: '📎',
      color: 'from-cyan-500 to-cyan-600',
      description: 'Import via iCal URL (.ics)',
      requiresOAuth: false
    },
    {
      id: 'exchange',
      name: 'Exchange Server',
      icon: '🏢',
      color: 'from-indigo-600 to-purple-600',
      description: 'Microsoft Exchange on-premise',
      requiresOAuth: false
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Advanced Calendar & Scheduling</h2>
        </div>
        <p className="text-slate-400">
          Intelligent scheduling and calendar management powered by AI
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Calendar className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.meetingsThisWeek}</div>
          <div className="text-sm text-slate-400">Meetings This Week</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.timeBlocked}h</div>
          <div className="text-sm text-slate-400">Time Blocked</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.conflictsResolved}</div>
          <div className="text-sm text-slate-400">Conflicts Resolved</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Plane className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.travelTime}h</div>
          <div className="text-sm text-slate-400">Travel Time Saved</div>
        </div>
      </div>

      {/* Calendar Import Section */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">Connect Your Calendars</h3>
              <p className="text-sm text-slate-400 mt-1">
                Import calendars from Google, Microsoft, Apple, and more
              </p>
            </div>
          </div>
          {connectedCalendars.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {connectedCalendars.length} connected
              </span>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {connectedCalendars.length === 0 ? (
          <>
            <div className="text-center py-8 mb-6">
              <Calendar className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Calendars Connected</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Connect your calendars to enable AI-powered scheduling, meeting prep, conflict resolution, and more.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendarProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 rounded-xl p-5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${provider.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {provider.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{provider.name}</h4>
                      <p className="text-xs text-slate-400">{provider.description}</p>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-white">
                    <Link className="w-4 h-4" />
                    Connect {provider.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-cyan-400 mb-1">Advanced Calendar Sync</div>
                  <div className="text-xs text-slate-400">
                    All calendar connections use secure OAuth authentication. Your credentials are never stored on our servers. 
                    Atlas syncs bi-directionally - changes made here reflect in your calendar and vice versa.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {connectedCalendars.map((calendar) => (
              <div
                key={calendar.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${calendar.color} rounded-lg flex items-center justify-center text-lg`}>
                    {calendar.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{calendar.name}</h4>
                    <p className="text-xs text-slate-400">{calendar.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Synced</span>
                  </div>
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Upcoming Meetings</h3>
          </div>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            Schedule Meeting
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No meetings scheduled. Connect your calendar or create a new meeting.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* AI Meeting Prep */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">AI Meeting Prep</h3>
          </div>

          <div className="text-center py-12 text-slate-400">
            No meetings to prep for. AI will automatically prepare briefs before your meetings.
          </div>
        </div>

        {/* Time Blocking */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Time Blocking</h3>
            </div>
            <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
              Add Block
            </button>
          </div>

          <div className="text-center py-12 text-slate-400">
            No time blocks set. Create focus blocks to protect your deep work time.
          </div>
        </div>
      </div>

      {/* Calendar Insights */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Calendar Insights</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          Not enough data yet. AI will analyze your calendar patterns and provide insights.
        </div>
      </div>

      {/* Conflict Resolver */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Conflict Resolver</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          No scheduling conflicts detected. AI will automatically suggest resolutions when conflicts occur.
        </div>
      </div>

      {/* Travel Time Calculator */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Plane className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Travel Time Calculator</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          No meetings with travel requirements. Add location to meetings for automatic travel time calculations.
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-400 mb-1">Smart Calendar Management</div>
              <div className="text-xs text-slate-400">
                Atlas intelligently manages your calendar with AI-powered meeting prep, automatic conflict resolution, smart time blocking, and travel time calculations. Never miss important context or double-book again.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}