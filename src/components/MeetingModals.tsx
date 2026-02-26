import { X, Link, Plus, CheckCircle2, Video } from "lucide-react";
import { AnalyticsConnectionModal } from "./AnalyticsConnectionModal";

interface AddMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingLink: string;
  setMeetingLink: (value: string) => void;
  meetingTitle: string;
  setMeetingTitle: (value: string) => void;
  meetingDate: string;
  setMeetingDate: (value: string) => void;
  meetingTime: string;
  setMeetingTime: (value: string) => void;
}

export function AddMeetingModal({
  isOpen,
  onClose,
  meetingLink,
  setMeetingLink,
  meetingTitle,
  setMeetingTitle,
  meetingDate,
  setMeetingDate,
  meetingTime,
  setMeetingTime
}: AddMeetingModalProps) {
  if (!isOpen) return null;

  const handleSubmit = () => {
    // Handle meeting submission
    // TODO: Submit meeting to backend
    onClose();
  };

  // Detect platform from link
  const detectPlatform = (link: string) => {
    if (link.includes('zoom')) return { name: 'Zoom', logo: '🎥', color: 'blue' };
    if (link.includes('teams') || link.includes('microsoft')) return { name: 'Microsoft Teams', logo: '💼', color: 'purple' };
    if (link.includes('webex')) return { name: 'Cisco Webex', logo: '🌐', color: 'green' };
    if (link.includes('meet.google')) return { name: 'Google Meet', logo: '📹', color: 'red' };
    return null;
  };

  const detectedPlatform = meetingLink ? detectPlatform(meetingLink) : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Add Meeting with Link</h3>
              <p className="text-xs text-slate-400">Manually add a meeting for Atlas to join</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Meeting Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g., Weekly Team Sync"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Meeting Link <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-3 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
              <Link className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
            </div>
            {detectedPlatform && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-2xl">{detectedPlatform.logo}</span>
                <span className="text-green-400">✓ {detectedPlatform.name} detected</span>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Atlas Settings */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-cyan-400">
                <strong>Atlas will join this meeting automatically</strong>
                <p className="mt-1 text-slate-400">Atlas will join 2 minutes before start time to take notes, transcribe, and extract action items.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!meetingTitle || !meetingLink || !meetingDate || !meetingTime}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Add Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the connection modal as well for video conferencing platforms
export { AnalyticsConnectionModal as VideoConferencingConnectionModal };
