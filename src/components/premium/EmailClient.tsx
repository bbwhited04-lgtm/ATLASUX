import { useEffect, useMemo, useState } from 'react';
import { queuePremiumJob } from "@/lib/premiumActions";
import { API_BASE } from "@/lib/api";
import {  
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Archive, 
  Trash2, 
  Search, 
  Filter, 
  Tag, 
  Clock, 
  User, 
  Paperclip,
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Zap,
  Eye, 
  EyeOff, 
  Flag, 
  Reply, 
  Forward, 
  MoreVertical,
  Sparkles, 
  Brain, 
  Calendar, 
  FileText,
} from "lucide-react";

export function EmailClient() {
// Keep consistent with Integrations.tsx
const BACKEND_URL = API_BASE;

function getOrgUser() {
  const org_id =
    localStorage.getItem("atlas_active_tenant_id") ||
    localStorage.getItem("atlasux_org_id") ||
    "";
  return { org_id, user_id: org_id };
}

type Provider = "google" | "microsoft" | "smtp";
const [provider, setProvider] = useState<Provider>("google");
const [googleConnected, setGoogleConnected] = useState(false);
const [loadingConnect, setLoadingConnect] = useState<Provider | null>(null);
const [smtpConfig, setSmtpConfig] = useState({
  host: localStorage.getItem("atlasux_smtp_host") || "",
  port: localStorage.getItem("atlasux_smtp_port") || "587",
  username: localStorage.getItem("atlasux_smtp_user") || "",
  password: localStorage.getItem("atlasux_smtp_pass") || "",
  fromName: localStorage.getItem("atlasux_smtp_from_name") || "",
  fromEmail: localStorage.getItem("atlasux_smtp_from_email") || "",
  tls: (localStorage.getItem("atlasux_smtp_tls") ?? "true") === "true",
});
const smtpConfigured = useMemo(() => {
  return !!smtpConfig.host && !!smtpConfig.port && !!smtpConfig.username && !!smtpConfig.password;
}, [smtpConfig]);

const refreshStatus = async () => {
  const { org_id, user_id } = getOrgUser();
  try {
    const r = await fetch(
      `${BACKEND_URL}/v1/integrations/status?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`,
      { credentials: "include" }
    );
    const rows = (await r.json()) as Array<{ provider: "google" | "meta"; connected: boolean }>;
    setGoogleConnected(!!rows.find((x) => x.provider === "google")?.connected);
  } catch {
    setGoogleConnected(false);
  }
};

useEffect(() => {
  refreshStatus();
}, []);

const startGoogleConnect = () => {
  setLoadingConnect("google");
  const { org_id, user_id } = getOrgUser();
  window.location.href = `${BACKEND_URL}/v1/oauth/google/start?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`;
};

const saveSmtp = () => {
  localStorage.setItem("atlasux_smtp_host", smtpConfig.host);
  localStorage.setItem("atlasux_smtp_port", smtpConfig.port);
  localStorage.setItem("atlasux_smtp_user", smtpConfig.username);
  localStorage.setItem("atlasux_smtp_pass", smtpConfig.password);
  localStorage.setItem("atlasux_smtp_from_name", smtpConfig.fromName);
  localStorage.setItem("atlasux_smtp_from_email", smtpConfig.fromEmail);
  localStorage.setItem("atlasux_smtp_tls", String(smtpConfig.tls));
  queuePremiumJob("Email SMTP config saved");
};

  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [view, setView] = useState<'inbox' | 'sent' | 'starred' | 'archived'>('inbox');

  const emailStats = {
    unread: 0,
    urgent: 0,
    aiTriaged: 0,
    timeSaved: '0h',
  };

  const folders = [
    { name: 'Inbox', icon: Inbox, count: 0, view: 'inbox' as const },
    { name: 'Sent', icon: Send, count: 0, view: 'sent' as const },
    { name: 'Starred', icon: Star, count: 0, view: 'starred' as const },
    { name: 'Archived', icon: Archive, count: 0, view: 'archived' as const },
  ];

  const aiCategories: any[] = [];

  const emails: any[] = [];

  const draftSuggestions: any[] = [];

  const aiFeatures = [
    { name: 'Smart Triage', description: 'AI categorizes emails by urgency', enabled: true },
    { name: 'Auto-Summarize', description: 'Get instant email summaries', enabled: true },
    { name: 'Smart Reply', description: 'AI-generated response suggestions', enabled: true },
    { name: 'Follow-Up Reminders', description: 'Never forget to reply', enabled: true },
    { name: 'Spam Detection', description: 'Advanced spam filtering', enabled: true },
    { name: 'Scheduling Assistant', description: 'Find meeting times in emails', enabled: false },
  ];

  const quickActions = [
    { name: 'Reply', icon: Reply, color: 'blue' },
    { name: 'Forward', icon: Forward, color: 'cyan' },
    { name: 'Archive', icon: Archive, color: 'green' },
    { name: 'Star', icon: Star, color: 'yellow' },
    { name: 'Delete', icon: Trash2, color: 'red' },
  ];

  const templates = [
    { name: 'Meeting Request', uses: 45 },
    { name: 'Follow-Up', uses: 89 },
    { name: 'Thank You', uses: 67 },
    { name: 'Status Update', uses: 34 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Email Client</h2>
        </div>
        <p className="text-slate-400">
          AI-powered email management with smart triage and auto-responses
        </p>
</div>

{/* Email Connections */}
<div className="mb-8 grid gap-6 lg:grid-cols-3">
  <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-white">Provider</div>
        <div className="text-xs text-slate-400 mt-1">Choose how Atlas connects to email</div>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      <button
        onClick={() => setProvider("google")}
        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
          provider === "google"
            ? "border-cyan-500/40 bg-cyan-500/10 text-white"
            : "border-slate-700/60 bg-slate-900/30 text-slate-300 hover:bg-slate-900/50"
        }`}
      >
        Gmail / Google Workspace
        <div className="text-xs text-slate-400 mt-1">OAuth connection (recommended)</div>
      </button>

      <button
        onClick={() => setProvider("microsoft")}
        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
          provider === "microsoft"
            ? "border-cyan-500/40 bg-cyan-500/10 text-white"
            : "border-slate-700/60 bg-slate-900/30 text-slate-300 hover:bg-slate-900/50"
        }`}
        disabled
        title="Coming soon"
      >
        Outlook / Microsoft 365
        <div className="text-xs text-slate-500 mt-1">Coming soon</div>
      </button>

      <button
        onClick={() => setProvider("smtp")}
        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
          provider === "smtp"
            ? "border-cyan-500/40 bg-cyan-500/10 text-white"
            : "border-slate-700/60 bg-slate-900/30 text-slate-300 hover:bg-slate-900/50"
        }`}
      >
        SMTP / IMAP
        <div className="text-xs text-slate-400 mt-1">Manual credentials (advanced)</div>
      </button>
    </div>
  </div>

  <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 lg:col-span-2">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-white">Connection</div>
        <div className="text-xs text-slate-400 mt-1">
          Connect email so Atlas can read, triage, and automate workflows.
        </div>
      </div>

      <button
        onClick={refreshStatus}
        className="px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-900/30 text-slate-200 hover:bg-slate-900/50 transition text-sm"
      >
        Refresh
      </button>
    </div>

    {provider === "google" && (
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-200">
            Status:{" "}
            <span className={googleConnected ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {googleConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          {!googleConnected ? (
            <button
              onClick={startGoogleConnect}
              disabled={loadingConnect === "google"}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold transition disabled:opacity-60"
            >
              {loadingConnect === "google" ? "Connecting..." : "Connect Google"}
            </button>
          ) : (
            <a
              href="#/app/settings?tab=integrations&focus=gmail"
              className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/30 hover:bg-slate-900/50 text-cyan-200 font-semibold transition"
              title="Open Integrations"
            >
              Manage in Integrations →
            </a>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Tip: Use Google Workspace for business domains to keep access clean and auditable.
        </div>
      </div>
    )}

    {provider === "smtp" && (
      <div className="mt-5 grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Host</label>
            <input
              value={smtpConfig.host}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, host: e.target.value }))}
              placeholder="smtp.yourdomain.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Port</label>
            <input
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, port: e.target.value }))}
              placeholder="587"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
            <input
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, username: e.target.value }))}
              placeholder="user@yourdomain.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password / App Password</label>
            <input
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, password: e.target.value }))}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">From Name</label>
            <input
              value={smtpConfig.fromName}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, fromName: e.target.value }))}
              placeholder="Atlas UX"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">From Email</label>
            <input
              value={smtpConfig.fromEmail}
              onChange={(e) => setSmtpConfig((s) => ({ ...s, fromEmail: e.target.value }))}
              placeholder="noreply@yourdomain.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-700/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Status:{" "}
            <span className={smtpConfigured ? "text-emerald-400 font-semibold" : "text-yellow-400 font-semibold"}>
              {smtpConfigured ? "Configured" : "Needs Info"}
            </span>
          </div>
          <button
            onClick={saveSmtp}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold transition"
          >
            Save Configuration
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Note: Stored locally for now. We’ll wire secure vault storage server-side when backend email ingest is finalized.
        </div>
      </div>
    )}

    {provider === "microsoft" && (
      <div className="mt-5 text-sm text-slate-400">
        Outlook/Microsoft 365 connector is staged. For now, use SMTP/IMAP if needed.
      </div>
    )}
  </div>
</div>

{/* Email Stats */}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mail className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emailStats.unread}</div>
          <div className="text-sm text-slate-400">Unread emails</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Flag className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emailStats.urgent}</div>
          <div className="text-sm text-slate-400">Urgent items</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Brain className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emailStats.aiTriaged}</div>
          <div className="text-sm text-slate-400">AI triaged today</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emailStats.timeSaved}</div>
          <div className="text-sm text-slate-400">Time saved</div>
        </div>
      </div>

      {/* Main Email Interface */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden">
        <div className="grid lg:grid-cols-12 min-h-[600px]">
          {/* Sidebar */}
          <div className="lg:col-span-3 border-r border-slate-700/50 p-4">
            {/* Compose Button */}
            <button onClick={() => queuePremiumJob("Compose")} className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold mb-6 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Compose
            </button>

            {/* Folders */}
            <div className="space-y-1 mb-6">
              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.view}
                    onClick={() => setView(folder.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      view === folder.view
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{folder.name}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Categories */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-3">
                AI Categories
              </div>
              <div className="space-y-1">
                {aiCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => queuePremiumJob("{category.name} {category.count}")} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${category.color}-400`} />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Templates */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-3">
                Templates
              </div>
              <div className="space-y-1">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => queuePremiumJob("{template.name} {template.uses}")} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    <span>{template.name}</span>
                    <span className="text-xs text-slate-600">{template.uses}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="lg:col-span-4 border-r border-slate-700/50">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <Filter className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Email List */}
            <div className="overflow-y-auto max-h-[550px]">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${
                    selectedEmail?.id === email.id
                      ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500'
                      : 'hover:bg-slate-800/30'
                  } ${email.unread ? 'bg-slate-800/20' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${email.unread ? 'bg-cyan-400' : 'bg-transparent'}`} />
                      <span className={`text-sm font-semibold ${email.unread ? 'text-white' : 'text-slate-400'}`}>
                        {email.from}
                      </span>
                      {email.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <span className="text-xs text-slate-500">{email.timestamp}</span>
                  </div>
                  
                  <div className="mb-2">
                    <div className={`text-sm mb-1 ${email.unread ? 'text-white font-semibold' : 'text-slate-300'}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {email.preview}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      email.aiCategory === 'urgent'
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                        : email.aiCategory === 'action'
                        ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                        : email.aiCategory === 'fyi'
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                    }`}>
                      {email.aiCategory}
                    </span>
                    {email.attachments > 0 && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {email.attachments}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Content */}
          <div className="lg:col-span-5 p-6">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {selectedEmail.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{selectedEmail.from}</span>
                        </div>
                        <span>•</span>
                        <span>{selectedEmail.timestamp}</span>
                      </div>
                    </div>
                    <button onClick={() => queuePremiumJob("Premium action")} className="p-2 hover:bg-slate-800 rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* AI Summary */}
                  <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-cyan-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-cyan-400 mb-1">AI Summary</div>
                        <div className="text-sm text-slate-300">{selectedEmail.aiSummary}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.name}
                          onClick={() => queuePremiumJob("{action.name}")} className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded text-xs text-slate-300 transition-colors flex items-center gap-2"
                        >
                          <Icon className="w-3 h-3" />
                          {action.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email Body */}
                <div className="prose prose-invert prose-sm max-w-none mb-6">
                  <p className="text-slate-300">
                    {selectedEmail.preview}
                  </p>
                  <p className="text-slate-300">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                  <p className="text-slate-300">
                    Best regards,<br />
                    {selectedEmail.from}
                  </p>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments > 0 && (
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-white mb-2">Attachments</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-700/50 rounded-lg">
                        <FileText className="w-8 h-8 text-cyan-400" />
                        <div className="flex-1">
                          <div className="text-sm text-white">Q1_Budget_Report.pdf</div>
                          <div className="text-xs text-slate-500">2.4 MB</div>
                        </div>
                        <button onClick={() => queuePremiumJob("Download")} className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Smart Reply */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">AI Smart Reply Suggestions</span>
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => queuePremiumJob("'Thanks for sharing. I'll review this by end of day.'")} className="w-full text-left p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 rounded-lg text-sm text-slate-300 transition-colors">
                      "Thanks for sharing. I'll review this by end of day."
                    </button>
                    <button onClick={() => queuePremiumJob("'Can we schedule a call to discuss this further?'")} className="w-full text-left p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 rounded-lg text-sm text-slate-300 transition-colors">
                      "Can we schedule a call to discuss this further?"
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Mail className="w-16 h-16 text-slate-700 mb-4" />
                <div className="text-slate-500">Select an email to read</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="mt-8 bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI Features</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {aiFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-white">{feature.name}</div>
                <button
                  onClick={() => queuePremiumJob("Premium action")} className={`w-10 h-5 rounded-full transition-colors relative ${
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
      </div>
    </div>
  );
}
