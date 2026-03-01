import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnection } from "../../utils/connections";
import { API_BASE } from "../../lib/api";
import { useActiveTenant } from "../../lib/activeTenant";
import {
  Video, Calendar, Mic, Users,
  FileText, CheckCircle, Clock, Download,
  Zap, Brain, TrendingUp,
  PhoneCall, Share2, Sparkles, Plus,
  Loader2, AlertCircle
} from 'lucide-react';
import { AddMeetingModal } from '../MeetingModals';

interface MeetingNote {
  id: string;
  platform: string;
  title: string;
  meetingUrl: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  attendees: Array<{ name?: string; email?: string }>;
  transcript: string | null;
  summary: string | null;
  actionItems: Array<{ text: string; assignee?: string; done: boolean }>;
  keyPoints: string[];
  status: string;
  processedAt: string | null;
  createdAt: string;
}

interface CalendarMeeting {
  externalId: string;
  subject: string;
  start: string;
  end: string;
  meetingUrl: string | null;
  platform: string;
  attendees: Array<{ name: string | null; email: string | null }>;
  organizer: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    "zoom": "Zoom",
    "microsoft-teams": "Teams",
    "google-meet": "Google Meet",
    "webex": "Webex",
    "cisco-webex": "Webex",
  };
  return map[p] || p;
}

export function VideoConferencing() {
  const { tenantId: activeTenantId } = useActiveTenant();

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(activeTenantId ? { "x-tenant-id": activeTenantId } : {}),
        ...(opts.headers || {}),
      },
    });
    return res.json();
  }, [activeTenantId]);
  const navigate = useNavigate();
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // Real data state
  const [recentMeetings, setRecentMeetings] = useState<MeetingNote[]>([]);
  const [calendarMeetings, setCalendarMeetings] = useState<CalendarMeeting[]>([]);
  const [manualUpcoming, setManualUpcoming] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingNote | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      const [listRes, upcomingRes] = await Promise.all([
        apiFetch("/v1/meetings?limit=20"),
        apiFetch("/v1/meetings/upcoming"),
      ]);

      if (listRes.ok) {
        setRecentMeetings(listRes.meetings.filter((m: MeetingNote) =>
          m.status === "completed" || m.status === "processed" || m.status === "failed"
        ));
      }

      if (upcomingRes.ok) {
        setCalendarMeetings(upcomingRes.calendar ?? []);
        setManualUpcoming(upcomingRes.manual ?? []);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const handleAddMeeting = async () => {
    if (!meetingTitle || !meetingLink || !meetingDate || !meetingTime) return;

    const scheduledAt = new Date(`${meetingDate}T${meetingTime}`).toISOString();

    // Detect platform from URL
    let platform = "other";
    if (meetingLink.includes("zoom")) platform = "zoom";
    else if (meetingLink.includes("teams") || meetingLink.includes("microsoft")) platform = "microsoft-teams";
    else if (meetingLink.includes("meet.google")) platform = "google-meet";
    else if (meetingLink.includes("webex")) platform = "cisco-webex";

    await apiFetch("/v1/meetings", {
      method: "POST",
      body: JSON.stringify({
        platform,
        title: meetingTitle,
        meetingUrl: meetingLink,
        scheduledAt,
      }),
    });

    // Reset form and reload
    setMeetingTitle("");
    setMeetingLink("");
    setMeetingDate("");
    setMeetingTime("");
    setShowAddMeetingModal(false);
    loadMeetings();
  };

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    try {
      await apiFetch(`/v1/meetings/${id}/process`, { method: "POST" });
      loadMeetings();
    } finally {
      setProcessingId(null);
    }
  };

  // Merge upcoming: calendar + manual
  const upcomingMeetings = [
    ...calendarMeetings.map(c => ({
      id: c.externalId,
      title: c.subject,
      time: formatTime(c.start),
      duration: c.end ? `${Math.round((new Date(c.end).getTime() - new Date(c.start).getTime()) / 60000)} mins` : "",
      participants: c.attendees.length,
      platform: platformLabel(c.platform),
      atlasJoining: true,
      meetingUrl: c.meetingUrl,
      source: "calendar" as const,
    })),
    ...manualUpcoming.map(m => ({
      id: m.id,
      title: m.title,
      time: formatTime(m.scheduledAt),
      duration: m.durationMinutes ? `${m.durationMinutes} mins` : "",
      participants: m.attendees.length,
      platform: platformLabel(m.platform),
      atlasJoining: true,
      meetingUrl: m.meetingUrl,
      source: "manual" as const,
    })),
  ];

  // Compute analytics from real data
  const totalMeetings = recentMeetings.length;
  const totalActionItems = recentMeetings.reduce((sum, m) => sum + (Array.isArray(m.actionItems) ? m.actionItems.length : 0), 0);
  const totalTranscriptions = recentMeetings.filter(m => m.transcript).length;
  const totalMinutes = recentMeetings.reduce((sum, m) => sum + (m.durationMinutes ?? 0), 0);
  const avgDuration = totalMeetings > 0 ? Math.round(totalMinutes / totalMeetings) : 0;

  // Platforms shown in the UI
  const platformDefs = [
    { id: "zoom", name: "Zoom", logo: "\uD83C\uDFA5", color: "blue" },
    { id: "microsoft-teams", name: "Microsoft Teams", logo: "\uD83D\uDCBC", color: "purple" },
    { id: "google-meet", name: "Google Meet", logo: "\uD83D\uDCF9", color: "red" },
    { id: "cisco-webex", name: "Cisco Webex", logo: "\uD83C\uDF10", color: "green" },
    { id: "livestorm", name: "Livestorm", logo: "\uD83D\uDCE1", color: "orange" },
    { id: "clickmeeting", name: "ClickMeeting", logo: "\uD83D\uDDB1\uFE0F", color: "red" },
    { id: "goto-meeting", name: "GoTo Meeting", logo: "\uD83D\uDE80", color: "cyan" },
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

  const aiFeatures = [
    { name: 'Auto-Join Meetings', description: 'Atlas automatically joins scheduled meetings', enabled: true, icon: Video },
    { name: 'Real-Time Transcription', description: 'Live transcription during meetings with speaker identification', enabled: true, icon: Mic },
    { name: 'AI Meeting Notes', description: 'Automatic note-taking with key points and decisions', enabled: true, icon: FileText },
    { name: 'Action Item Extraction', description: 'Automatically identifies and tracks action items', enabled: true, icon: CheckCircle },
    { name: 'Meeting Recordings', description: 'Record meetings with AI-generated highlights', enabled: true, icon: Video },
    { name: 'Automatic Follow-Ups', description: 'Send meeting summaries and action items to participants', enabled: true, icon: Share2 },
    { name: 'AI Meeting Assistant', description: 'Responds to questions and provides context during meetings', enabled: false, icon: Brain },
    { name: 'Smart Scheduling', description: 'Find optimal meeting times across all participants', enabled: true, icon: Calendar },
  ];

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
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Atlas is ready to join meetings</h3>
              <p className="text-slate-400">Monitoring your calendar for upcoming meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-semibold text-green-400">AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* Meeting Analytics */}
      <div className="grid md:grid-cols-6 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Video className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{totalMeetings}</div>
          <div className="text-sm text-slate-400">Total meetings</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{Math.round(totalMinutes / 60)}</div>
          <div className="text-sm text-slate-400">Hours recorded</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{totalActionItems}</div>
          <div className="text-sm text-slate-400">Action items</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mic className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{totalTranscriptions}</div>
          <div className="text-sm text-slate-400">Transcriptions</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <TrendingUp className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{avgDuration} mins</div>
          <div className="text-sm text-slate-400">Avg duration</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{upcomingMeetings.length}</div>
          <div className="text-sm text-slate-400">Upcoming</div>
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
                  <div className="text-3xl">{platform.logo}</div>
                  <div>
                    <div className="font-semibold text-white">{platform.name}</div>
                    <div className="text-xs text-slate-400">Last used: {platform.lastUsed}</div>
                    {platform.status === "connected" && platform.connectedAs ? (
                      <div className="text-xs text-slate-400">
                        Connected as: <span className="text-slate-200">{platform.connectedAs}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Not connected</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">{platform.meetings} meetings</div>
                {platform.status === 'connected' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400 font-semibold">CONNECTED</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlatform(platform.name);
                      navigate(`/app/settings?tab=integrations&focus=${encodeURIComponent(platform.name)}`);
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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading meetings...
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming meetings with video links found.</p>
            <p className="text-xs mt-1">Add one manually or connect your calendar.</p>
          </div>
        ) : (
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
                        {meeting.duration && (
                          <>
                            <span>•</span>
                            <span>{meeting.duration}</span>
                          </>
                        )}
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
                  {meeting.meetingUrl && (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 transition-colors"
                    >
                      Join Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Meetings with Notes */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Recent Meetings</h3>
          </div>
        </div>

        {recentMeetings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No meeting notes yet.</p>
            <p className="text-xs mt-1">Add a meeting and process it to generate AI notes.</p>
          </div>
        ) : (
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
                        <span>{formatDate(meeting.scheduledAt)}</span>
                        {meeting.durationMinutes && (
                          <>
                            <span>•</span>
                            <span>{meeting.durationMinutes} mins</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{meeting.attendees.length} participants</span>
                        <span>•</span>
                        <span className="text-purple-400">{platformLabel(meeting.platform)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {meeting.status === "processed" && (
                          <>
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>{Array.isArray(meeting.actionItems) ? meeting.actionItems.length : 0} action items</span>
                            </div>
                            <div className="flex items-center gap-2 text-cyan-400">
                              <FileText className="w-4 h-4" />
                              <span>{Array.isArray(meeting.keyPoints) ? meeting.keyPoints.length : 0} key points</span>
                            </div>
                          </>
                        )}
                        {meeting.status === "failed" && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>Processing failed</span>
                          </div>
                        )}
                        {meeting.transcript && (
                          <div className="flex items-center gap-2 text-blue-400">
                            <Mic className="w-4 h-4" />
                            <span>Transcript available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {meeting.status === "completed" && (
                      <button
                        onClick={() => handleProcess(meeting.id)}
                        disabled={processingId === meeting.id}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {processingId === meeting.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
                        ) : (
                          <><Brain className="w-3 h-3" /> Process</>
                        )}
                      </button>
                    )}
                    {meeting.summary && (
                      <button
                        onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 transition-colors"
                      >
                        {selectedMeeting?.id === meeting.id ? "Hide Notes" : "View Notes"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded meeting notes */}
                {selectedMeeting?.id === meeting.id && meeting.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white mb-2">AI Summary</h4>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{meeting.summary}</p>
                    </div>
                    {Array.isArray(meeting.keyPoints) && meeting.keyPoints.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-cyan-400 mb-2">Key Points</h4>
                        <ul className="space-y-1">
                          {meeting.keyPoints.map((kp, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              {kp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(meeting.actionItems) && meeting.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">Action Items</h4>
                        <ul className="space-y-1">
                          {meeting.actionItems.map((ai, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>
                                {ai.text}
                                {ai.assignee && <span className="text-slate-500 ml-1">({ai.assignee})</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
        onSubmit={handleAddMeeting}
        meetingLink={meetingLink}
        setMeetingLink={setMeetingLink}
        meetingTitle={meetingTitle}
        setMeetingTitle={setMeetingTitle}
        meetingDate={meetingDate}
        setMeetingDate={setMeetingDate}
        meetingTime={meetingTime}
        setMeetingTime={setMeetingTime}
      />
    </div>
  );
}
