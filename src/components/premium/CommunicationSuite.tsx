import { useState } from 'react';
import { 
  MessageSquare, Mail, Bell, Globe, Zap,
  FileText, Clock, CheckCircle, Star, Brain,
  Send, Inbox, Archive, Tag, Languages, Sparkles,
  Download, RefreshCw, Link, ExternalLink, Upload
} from 'lucide-react';

export function CommunicationSuite() {
  const [connectedEmails, setConnectedEmails] = useState<any[]>([]);
  
  const stats = {
    unreadMessages: 0,
    templatesUsed: 0,
    translated: 0,
    timeSaved: 0,
  };

  const channels = [
    { name: 'Email', icon: Mail, unread: 0, enabled: false, color: 'blue' },
    { name: 'Slack', icon: MessageSquare, unread: 0, enabled: false, color: 'purple' },
    { name: 'Teams', icon: MessageSquare, unread: 0, enabled: false, color: 'cyan' },
    { name: 'SMS', icon: MessageSquare, unread: 0, enabled: false, color: 'green' },
  ];

  const messages: any[] = [];
  const templates: any[] = [];
  const cannedResponses: any[] = [];
  const translations: any[] = [];

  const emailProviders = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '✉️',
      color: 'from-red-500 to-red-600',
      description: 'Google Gmail account',
      requiresOAuth: true
    },
    {
      id: 'outlook',
      name: 'Outlook / Microsoft 365',
      icon: '📧',
      color: 'from-blue-600 to-indigo-600',
      description: 'Microsoft Outlook account',
      requiresOAuth: true
    },
    {
      id: 'icloud',
      name: 'iCloud Mail',
      icon: '🍎',
      color: 'from-slate-600 to-slate-700',
      description: 'Apple iCloud email',
      requiresOAuth: true
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      icon: '🟣',
      color: 'from-purple-600 to-purple-700',
      description: 'Yahoo email account',
      requiresOAuth: true
    },
    {
      id: 'proton',
      name: 'ProtonMail',
      icon: '🔐',
      color: 'from-indigo-600 to-purple-600',
      description: 'Secure ProtonMail account',
      requiresOAuth: true
    },
    {
      id: 'imap',
      name: 'IMAP / SMTP',
      icon: '📮',
      color: 'from-cyan-500 to-cyan-600',
      description: 'Any IMAP/SMTP email',
      requiresOAuth: false
    },
    {
      id: 'exchange',
      name: 'Exchange Server',
      icon: '🏢',
      color: 'from-blue-700 to-indigo-700',
      description: 'Microsoft Exchange on-premise',
      requiresOAuth: false
    },
    {
      id: 'zoho',
      name: 'Zoho Mail',
      icon: '📬',
      color: 'from-orange-500 to-red-600',
      description: 'Zoho email account',
      requiresOAuth: true
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Communication Suite</h2>
        </div>
        <p className="text-slate-400">
          Unified communications and messaging across all platforms
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Bell className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.unreadMessages}</div>
          <div className="text-sm text-slate-400">Unread Messages</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.templatesUsed}</div>
          <div className="text-sm text-slate-400">Templates Used</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Languages className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.translated}</div>
          <div className="text-sm text-slate-400">Messages Translated</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.timeSaved}h</div>
          <div className="text-sm text-slate-400">Time Saved</div>
        </div>
      </div>

      {/* Email Account Import Section */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">Connect Your Email Accounts</h3>
              <p className="text-sm text-slate-400 mt-1">
                Import emails from Gmail, Outlook, iCloud, Yahoo, and more
              </p>
            </div>
          </div>
          {connectedEmails.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {connectedEmails.length} connected
              </span>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {connectedEmails.length === 0 ? (
          <>
            <div className="text-center py-8 mb-6">
              <Mail className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Email Accounts Connected</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Connect your email accounts to enable unified inbox, AI-powered email management, templates, and smart notifications.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {emailProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 rounded-xl p-5 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${provider.color} rounded-lg flex items-center justify-center text-3xl mb-3`}>
                      {provider.icon}
                    </div>
                    <h4 className="font-semibold text-white mb-1 text-sm">{provider.name}</h4>
                    <p className="text-xs text-slate-400">{provider.description}</p>
                  </div>
                  <button className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-white">
                    <Link className="w-4 h-4" />
                    Connect
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-cyan-400 mb-1">Secure Email Integration</div>
                  <div className="text-xs text-slate-400">
                    All email connections use secure OAuth 2.0 or encrypted IMAP/SMTP. Your credentials are never stored on our servers. 
                    Atlas syncs your emails in real-time and provides AI-powered organization, smart filters, and automated responses.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {connectedEmails.map((email) => (
              <div
                key={email.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${email.color} rounded-lg flex items-center justify-center text-xl`}>
                    {email.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{email.name}</h4>
                    <p className="text-xs text-slate-400">{email.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-3">
                    <div className="text-sm font-semibold text-white">{email.unread || 0}</div>
                    <div className="text-xs text-slate-400">Unread</div>
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Email Templates */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Email Templates</h3>
            </div>
            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
              Create Template
            </button>
          </div>

          <div className="text-center py-12 text-slate-400">
            No templates created yet. Save frequently used emails as templates.
          </div>
        </div>

        {/* Canned Responses */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Canned Responses</h3>
            </div>
            <button className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-400 transition-colors">
              Add Response
            </button>
          </div>

          <div className="text-center py-12 text-slate-400">
            No canned responses saved. Create quick replies for common messages.
          </div>
        </div>
      </div>

      {/* Smart Notifications */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Smart Notifications</h3>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
          <div className="flex items-start gap-4">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white mb-2">AI-Powered Notification Management</div>
              <div className="text-xs text-slate-400 mb-3">
                Atlas learns which messages are important and only notifies you when necessary. Reduce notification fatigue while never missing critical messages.
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-600" />
                  <span>Enable smart filtering</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-600" />
                  <span>Learn from my actions</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Translation */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Languages className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Language Translation</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          No translations yet. Automatically translate messages to and from any language.
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">Unified Communications Hub</div>
              <div className="text-xs text-slate-400">
                Manage all your communication channels in one place. Atlas brings together email, Slack, Teams, SMS, and more with AI-powered templates, smart notifications, instant translation, and automated responses to help you communicate faster and more effectively.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}