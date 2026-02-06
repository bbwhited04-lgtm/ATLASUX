import { useState } from 'react';
import { getConnection } from "../../utils/connections";
import { 
  Video, Calendar, Mic, Users, MessageSquare, 
  FileText, CheckCircle, Clock, Play, Download,
  Settings, Zap, Brain, TrendingUp, Eye,
  PhoneCall, Share2, Bell, Sparkles, Link, Plus,
  X, ArrowRight
} from 'lucide-react';
import { AddMeetingModal, VideoConferencingConnectionModal } from '../MeetingModals';

export function VideoConferencing() {
  const [atlasInMeeting, setAtlasInMeeting] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // Platforms shown in the UI. Connection status is derived from stored connections.
  const platformDefs = [
    { id: "zoom", name: "Zoom", logo: "🎥", color: "blue" },
    { id: "microsoft-teams", name: "Microsoft Teams", logo: "💼", color: "purple" },
    { id: "google-meet", name: "Google Meet", logo: "📹", color: "red" },
    { id: "cisco-webex", name: "Cisco Webex", logo: "🌐", color: "green" },
    { id: "livestorm", name: "Livestorm", logo: "📡", color: "orange" },
    { id: "clickmeeting", name: "ClickMeeting", logo: "🖱️", color: "red" },
    { id: "goto-meeting", name: "GoTo Meeting", logo: "🚀", color: "cyan" },
  ] as const;

  const platforms = platformDefs.map((p) => {
    const c: any = getConnection(p.id);
    const isConnected = c?.status === "connected";

    return {
      ...p,
      status: isConnected ? "connected" : "disconnected",
      connectedAs: c?.accountLabel || "",
      meetings: c?.meetings ?? 0,
      lastUsed: c?.lastUsed || "Never",
    };
  });
  const upcomingMeetings: any[] = [];

  const recentMeetings: any[] = [];

  const aiFeatures = [
    {
      name: 'Auto-Join Meetings',
      description: 'Atlas automatically joins scheduled meetings',
      enabled: true,
      icon: Video
    },
    {
      name: 'Real-Time Transcription',
      description: 'Live transcription during meetings with speaker identification',
      enabled: true,
      icon: Mic
    },
    {
      name: 'AI Meeting Notes',
      description: 'Automatic note-taking with key points and decisions',
      enabled: true,
      icon: FileText
    },
    {
      name: 'Action Item Extraction',
      description: 'Automatically identifies and tracks action items',
      enabled: true,
      icon: CheckCircle
    },
    {
      name: 'Meeting Recordings',
      description: 'Record meetings with AI-generated highlights',
      enabled: true,
      icon: Video
    },
    {
      name: 'Automatic Follow-Ups',
      description: 'Send meeting summaries and action items to participants',
      enabled: true,
      icon: Share2
    },
    {
      name: 'AI Meeting Assistant',
      description: 'Responds to questions and provides context during meetings',
      enabled: false,
      icon: Brain
    },
    {
      name: 'Smart Scheduling',
      description: 'Find optimal meeting times across all participants',
      enabled: true,
      icon: Calendar
    },
  ];

  const meetingAnalytics = {
    totalMeetings: 0,
    totalHours: 0,
    avgDuration: '0 mins',
    actionItemsCreated: 0,
    transcriptionsGenerated: 0,
    timesSaved: '0 hours',
  };

  const liveTranscript: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Video Conferencing Integration</h2>
        </div>
        <p className="text-slate-400">
          Atlas joins your meetings, takes notes, and handles follow-ups automatically
        </p>
      </div>

      {/* Atlas Meeting Status */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {atlasInMeeting ? 'Atlas is currently in a meeting' : 'Atlas is ready to join meetings'}
              </h3>
              <p className="text-slate-400">
                {atlasInMeeting 
                  ? 'Taking notes and identifying action items...' 
                  : 'Monitoring your calendar for upcoming meetings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${atlasInMeeting ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
            <span className={`text-sm font-semibold ${atlasInMeeting ? 'text-red-400' : 'text-green-400'}`}>
              {atlasInMeeting ? 'IN MEETING' : 'AVAILABLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Meeting Analytics */}
      <div className="grid md:grid-cols-6 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Video className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.totalMeetings}</div>
          <div className="text-sm text-slate-400">Total meetings</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.totalHours}</div>
          <div className="text-sm text-slate-400">Hours recorded</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.actionItemsCreated}</div>
          <div className="text-sm text-slate-400">Action items</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mic className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.transcriptionsGenerated}</div>
          <div className="text-sm text-slate-400">Transcriptions</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <TrendingUp className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.avgDuration}</div>
          <div className="text-sm text-slate-400">Avg duration</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingAnalytics.timesSaved}</div>
          <div className="text-sm text-slate-400">Time saved</div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Connected Platforms</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {platforms.map((platform, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl`}>{platform.logo}</div>
                  <div>
                    <div className="font-semibold text-white">{platform.name}</div>
                    <div className="text-xs text-slate-400">Last used: {platform.lastUsed}</div>
	                    {platform.status === "connected" && platform.connectedAs ? (
	                      <div className="text-xs text-slate-400">
	                        Connected as:{" "}
	                        <span className="text-slate-200">{platform.connectedAs}</span>
	                      </div>
	                    ) : (
	                      <div className="text-xs text-slate-500">Not connected</div>
	                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {platform.meetings} meetings
                </div>
                {platform.status === 'connected' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400 font-semibold">CONNECTED</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setSelectedPlatform(platform.name);
                      setShowConnectModal(true);
                    }}
                    className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Upcoming Meetings</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddMeetingModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Meeting with Link
            </button>
            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
              View Calendar
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {upcomingMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Video className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg mb-1">{meeting.title}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.time}</span>
                      </div>
                      <span>•</span>
                      <span>{meeting.duration}</span>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{meeting.participants} participants</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                        {meeting.platform}
                      </span>
                      {meeting.atlasJoining && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Atlas will join</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 transition-colors">
                    Join Now
                  </button>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Meeting Transcript */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Live Meeting Transcript</h3>
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400 font-semibold animate-pulse">
              ● LIVE
            </div>
          </div>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">
            Export Transcript
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {liveTranscript.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                item.isAI 
                  ? 'bg-cyan-500/10 border border-cyan-500/30' 
                  : 'bg-slate-950/50 border border-slate-700/30'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${item.isAI ? 'text-cyan-400' : 'text-white'}`}>
                    {item.speaker}
                  </span>
                  {item.isAI && <Brain className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-xs text-slate-500">{item.timestamp}</span>
              </div>
              <p className={`text-sm ${item.isAI ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Recent Meetings</h3>
          </div>
        </div>

        <div className="grid gap-3">
          {recentMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <Video className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg mb-2">{meeting.title}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span>{meeting.date}</span>
                      <span>•</span>
                      <span>{meeting.duration}</span>
                      <span>•</span>
                      <span>{meeting.participants} participants</span>
                      <span>•</span>
                      <span className="text-purple-400">{meeting.platform}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{meeting.actionItems} action items</span>
                      </div>
                      <div className="flex items-center gap-2 text-cyan-400">
                        <FileText className="w-4 h-4" />
                        <span>{meeting.keyPoints} key points</span>
                      </div>
                      {meeting.recording && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <Video className="w-4 h-4" />
                          <span>Recording available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 transition-colors">
                    View Notes
                  </button>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">AI Meeting Features</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {aiFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{feature.name}</div>
                      <div className="text-xs text-slate-400">{feature.description}</div>
                    </div>
                  </div>
                  <button
                    className={`ml-3 w-12 h-6 rounded-full transition-colors relative ${
                      feature.enabled
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        feature.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">AI-Powered Meeting Intelligence</div>
              <div className="text-xs text-slate-400">
                Atlas joins meetings as a silent participant, transcribes conversations, identifies action items, and sends follow-up summaries to all participants automatically.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMeetingModal
        isOpen={showAddMeetingModal}
        onClose={() => setShowAddMeetingModal(false)}
        meetingLink={meetingLink}
        setMeetingLink={setMeetingLink}
        meetingTitle={meetingTitle}
        setMeetingTitle={setMeetingTitle}
        meetingDate={meetingDate}
        setMeetingDate={setMeetingDate}
        meetingTime={meetingTime}
        setMeetingTime={setMeetingTime}
      />

      <VideoConferencingConnectionModal
        isOpen={showConnectModal}
        onClose={() => {
          setShowConnectModal(false);
          setSelectedPlatform(null);
        }}
        platformName={selectedPlatform}
      />
    </div>
  );
}