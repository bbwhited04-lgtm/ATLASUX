import { useState } from 'react';
import { 
  Mail, Calendar, FileText, Image, Video, 
  CheckCircle, Clock, Tag, Zap, TrendingUp,
  Users, MessageSquare, Bell, Star
} from 'lucide-react';

export function AIProductivity() {
  const [emailsTriaged, setEmailsTriaged] = useState(0);
  const [meetingsScheduled, setMeetingsScheduled] = useState(0);

  const mockEmails: any[] = [];

  const mockMeetings: any[] = [];

  const mockDocuments: any[] = [];

  const mockScreenshots: any[] = [];

  const mockTranscriptions: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">AI-Powered Productivity</h2>
        </div>
        <p className="text-slate-400">
          Intelligent automation to supercharge your productivity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mail className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emailsTriaged}</div>
          <div className="text-sm text-slate-400">Emails triaged today</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Calendar className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingsScheduled}</div>
          <div className="text-sm text-slate-400">Meetings scheduled</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">67</div>
          <div className="text-sm text-slate-400">Documents tagged</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Image className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">38</div>
          <div className="text-sm text-slate-400">Screenshots processed</div>
        </div>
      </div>

      {/* Smart Email Triage */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Smart Email Triage</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Processing inbox...</span>
          </div>
        </div>

        <div className="grid gap-3">
          {mockEmails.map((email) => (
            <div
              key={email.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{email.from}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      email.priority === 'high' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : email.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {email.category}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 mb-2">{email.subject}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-400">{email.aiAction}</span>
                    <span>•</span>
                    <span>{email.time}</span>
                  </div>
                </div>
                {email.priority === 'high' && (
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">AI Performance</div>
              <div className="text-xs text-slate-400">
                Processed 142 emails today • 89% accuracy • Saved you 2.3 hours
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Auto-Scheduler */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Meeting Auto-Scheduler</h3>
          </div>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            Schedule New Meeting
          </button>
        </div>

        <div className="grid gap-3">
          {mockMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">{meeting.title}</div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{meeting.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {meeting.status === 'confirmed' ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed with all participants
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Awaiting confirmation
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Auto-Tagging */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Document Auto-Tagging</h3>
          </div>
        </div>

        <div className="grid gap-3">
          {mockDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">{doc.name}</div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400"
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-400">AI Insight: {doc.aiInsight}</span>
                    <span>•</span>
                    <span>Tagged {doc.tagged}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot OCR Archive */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Screenshot OCR Archive</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Search All Screenshots
          </button>
        </div>

        <div className="grid gap-3">
          {mockScreenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-8 h-8 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">{screenshot.name}</div>
                  <div className="p-3 bg-slate-900/50 rounded border border-slate-700/30 mb-2">
                    <div className="text-xs font-mono text-slate-300">{screenshot.extractedText}</div>
                  </div>
                  <div className="text-xs text-slate-400">{screenshot.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">Fully Searchable</div>
              <div className="text-xs text-slate-400">
                All screenshots are automatically processed with OCR. Search any text that appeared in your screenshots.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Transcription & Action Items */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Meeting Transcription & Action Items</h3>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 rounded-lg text-sm font-semibold transition-all">
            Record New Meeting
          </button>
        </div>

        <div className="grid gap-4">
          {mockTranscriptions.map((transcript) => (
            <div
              key={transcript.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg mb-2">{transcript.meeting}</div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{transcript.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{transcript.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400">{transcript.actionItems} action items</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded border border-slate-700/30 mb-3">
                    <div className="text-sm text-slate-300">
                      <strong className="text-cyan-400">AI Summary:</strong> {transcript.summary}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{transcript.date}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                  View Full Transcript
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Export Action Items
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}