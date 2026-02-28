import { useCallback, useEffect, useMemo, useState } from 'react';
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
  RefreshCw,
  Loader2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface InboxMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  hasAttachments: boolean;
  importance: string;
  flagged: boolean;
  to: string[];
}

interface MessageDetail {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: Array<{ name?: string; email: string }>;
  cc: Array<{ name?: string; email: string }>;
  bodyHtml: string | null;
  bodyText: string | null;
  bodyPreview: string;
  timestamp: string;
  sentAt: string;
  unread: boolean;
  hasAttachments: boolean;
  importance: string;
  flagged: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      });
    }
    if (diffHrs < 168) {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Chicago",
    });
  } catch {
    return iso;
  }
}

function classifyImportance(msg: InboxMessage): "urgent" | "action" | "fyi" | "info" {
  if (msg.importance === "high" || msg.flagged) return "urgent";
  const subj = (msg.subject + " " + msg.preview).toLowerCase();
  if (subj.includes("action required") || subj.includes("approval") || subj.includes("decision")) return "action";
  if (subj.includes("report") || subj.includes("update") || subj.includes("summary")) return "fyi";
  return "info";
}

// ── Component ────────────────────────────────────────────────────────────────

export function EmailClient() {
const BACKEND_URL = API_BASE;

function getOrgUser() {
  const org_id =
    localStorage.getItem("atlas_active_tenant_id") ||
    localStorage.getItem("atlasux_org_id") ||
    "";
  return { org_id, user_id: org_id };
}

type Provider = "google" | "microsoft" | "smtp";
const [provider, setProvider] = useState<Provider>("microsoft");
const [googleConnected, setGoogleConnected] = useState(false);
const [msConnected, setMsConnected] = useState(false);
const [msEmail, setMsEmail] = useState("");
const [loadingConnect, setLoadingConnect] = useState<Provider | null>(null);
const [smtpConfig, setSmtpConfig] = useState({
  host: localStorage.getItem("atlasux_smtp_host") || "",
  port: localStorage.getItem("atlasux_smtp_port") || "587",
  username: localStorage.getItem("atlasux_smtp_user") || "",
  password: "",
  fromName: localStorage.getItem("atlasux_smtp_from_name") || "",
  fromEmail: localStorage.getItem("atlasux_smtp_from_email") || "",
  tls: (localStorage.getItem("atlasux_smtp_tls") ?? "true") === "true",
});
const smtpConfigured = useMemo(() => {
  return !!smtpConfig.host && !!smtpConfig.port && !!smtpConfig.username && !!smtpConfig.password;
}, [smtpConfig]);

// ── Inbox state ──────────────────────────────────────────────────────────────

const [emails, setEmails] = useState<InboxMessage[]>([]);
const [selectedEmail, setSelectedEmail] = useState<InboxMessage | null>(null);
const [messageDetail, setMessageDetail] = useState<MessageDetail | null>(null);
const [loadingInbox, setLoadingInbox] = useState(false);
const [loadingMessage, setLoadingMessage] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);
const [totalCount, setTotalCount] = useState(0);
const [view, setView] = useState<'inbox' | 'sent' | 'starred' | 'archived'>('inbox');

// ── Status checks ────────────────────────────────────────────────────────────

const refreshStatus = useCallback(async () => {
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

  // Check M365 connection
  try {
    const { org_id } = getOrgUser();
    const r = await fetch(`${BACKEND_URL}/v1/outlook/status`, {
      credentials: "include",
      headers: { "x-tenant-id": org_id },
    });
    const data = (await r.json()) as { ok: boolean; connected: boolean; email?: string };
    setMsConnected(data.connected ?? false);
    if (data.email) setMsEmail(data.email);
  } catch {
    setMsConnected(false);
  }
}, [BACKEND_URL]);

// ── Fetch inbox ──────────────────────────────────────────────────────────────

const fetchInbox = useCallback(async (filterUnread = false) => {
  setLoadingInbox(true);
  try {
    const { org_id } = getOrgUser();
    const params = new URLSearchParams({ top: "50" });
    if (filterUnread) params.set("filter", "unread");

    const r = await fetch(`${BACKEND_URL}/v1/outlook/inbox?${params}`, {
      credentials: "include",
      headers: { "x-tenant-id": org_id },
    });
    const data = (await r.json()) as {
      ok: boolean;
      messages: InboxMessage[];
      unreadCount: number;
      totalCount: number;
    };
    if (data.ok) {
      setEmails(data.messages);
      setUnreadCount(data.unreadCount);
      setTotalCount(data.totalCount);
    }
  } catch (err) {
    console.error("Inbox fetch failed:", err);
  } finally {
    setLoadingInbox(false);
  }
}, [BACKEND_URL]);

// ── Fetch single message body ────────────────────────────────────────────────

const fetchMessage = useCallback(async (msg: InboxMessage) => {
  setSelectedEmail(msg);
  setMessageDetail(null);
  setLoadingMessage(true);
  try {
    const { org_id } = getOrgUser();
    const r = await fetch(`${BACKEND_URL}/v1/outlook/message/${msg.id}`, {
      credentials: "include",
      headers: { "x-tenant-id": org_id },
    });
    const data = (await r.json()) as { ok: boolean; message: MessageDetail };
    if (data.ok) {
      setMessageDetail(data.message);
      // Mark as read locally
      if (msg.unread) {
        setEmails((prev) =>
          prev.map((e) => (e.id === msg.id ? { ...e, unread: false } : e))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    }
  } catch (err) {
    console.error("Message fetch failed:", err);
  } finally {
    setLoadingMessage(false);
  }
}, [BACKEND_URL]);

// ── Initial load ─────────────────────────────────────────────────────────────

useEffect(() => {
  refreshStatus();
}, [refreshStatus]);

useEffect(() => {
  if (msConnected && provider === "microsoft") {
    fetchInbox();
  }
}, [msConnected, provider, fetchInbox]);

// ── Derived stats ────────────────────────────────────────────────────────────

const urgentCount = useMemo(() => emails.filter((e) => classifyImportance(e) === "urgent").length, [emails]);

const startGoogleConnect = () => {
  setLoadingConnect("google");
  const { org_id, user_id } = getOrgUser();
  window.location.href = `${BACKEND_URL}/v1/oauth/google/start?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`;
};

const saveSmtp = async () => {
  localStorage.setItem("atlasux_smtp_host", smtpConfig.host);
  localStorage.setItem("atlasux_smtp_port", smtpConfig.port);
  localStorage.setItem("atlasux_smtp_user", smtpConfig.username);
  localStorage.setItem("atlasux_smtp_from_name", smtpConfig.fromName);
  localStorage.setItem("atlasux_smtp_from_email", smtpConfig.fromEmail);
  localStorage.setItem("atlasux_smtp_tls", String(smtpConfig.tls));
  const { org_id } = getOrgUser();
  if (org_id && smtpConfig.password) {
    await fetch(`${BACKEND_URL}/v1/email/smtp-config`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id, ...smtpConfig }),
    });
  }
  queuePremiumJob("Email SMTP config saved");
};

const quickActions = [
  { name: 'Reply', icon: Reply, color: 'blue' },
  { name: 'Forward', icon: Forward, color: 'cyan' },
  { name: 'Archive', icon: Archive, color: 'green' },
  { name: 'Star', icon: Star, color: 'yellow' },
  { name: 'Delete', icon: Trash2, color: 'red' },
];

const aiFeatures = [
  { name: 'Smart Triage', description: 'AI categorizes emails by urgency', enabled: true },
  { name: 'Auto-Summarize', description: 'Get instant email summaries', enabled: true },
  { name: 'Smart Reply', description: 'AI-generated response suggestions', enabled: true },
  { name: 'Follow-Up Reminders', description: 'Never forget to reply', enabled: true },
  { name: 'Spam Detection', description: 'Advanced spam filtering', enabled: true },
  { name: 'Scheduling Assistant', description: 'Find meeting times in emails', enabled: false },
];

const templates = [
  { name: 'Meeting Request', uses: 45 },
  { name: 'Follow-Up', uses: 89 },
  { name: 'Thank You', uses: 67 },
  { name: 'Status Update', uses: 34 },
];

const folders = [
  { name: 'Inbox', icon: Inbox, count: unreadCount, view: 'inbox' as const },
  { name: 'Sent', icon: Send, count: 0, view: 'sent' as const },
  { name: 'Starred', icon: Star, count: emails.filter((e) => e.flagged).length, view: 'starred' as const },
  { name: 'Archived', icon: Archive, count: 0, view: 'archived' as const },
];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Email Client</h2>
          {msConnected && (
            <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full">
              {msEmail}
            </span>
          )}
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
        onClick={() => setProvider("microsoft")}
        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
          provider === "microsoft"
            ? "border-cyan-500/40 bg-cyan-500/10 text-white"
            : "border-slate-700/60 bg-slate-900/30 text-slate-300 hover:bg-slate-900/50"
        }`}
      >
        Outlook / Microsoft 365
        <div className="text-xs text-slate-400 mt-1">
          {msConnected ? "Connected via Graph API" : "App-level connection"}
        </div>
      </button>

      <button
        onClick={() => setProvider("google")}
        className={`w-full text-left px-3 py-2 rounded-lg border transition ${
          provider === "google"
            ? "border-cyan-500/40 bg-cyan-500/10 text-white"
            : "border-slate-700/60 bg-slate-900/30 text-slate-300 hover:bg-slate-900/50"
        }`}
      >
        Gmail / Google Workspace
        <div className="text-xs text-slate-400 mt-1">OAuth connection</div>
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
        onClick={() => { refreshStatus(); if (msConnected && provider === "microsoft") fetchInbox(); }}
        className="px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-900/30 text-slate-200 hover:bg-slate-900/50 transition text-sm flex items-center gap-2"
      >
        <RefreshCw className={`w-3 h-3 ${loadingInbox ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>

    {provider === "microsoft" && (
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-200">
            Status:{" "}
            <span className={msConnected ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {msConnected ? "Connected" : "Not Connected"}
            </span>
            {msConnected && msEmail && (
              <span className="text-slate-500 ml-2">({msEmail})</span>
            )}
          </div>
        </div>
        {!msConnected && (
          <div className="mt-4 text-xs text-slate-400">
            M365 connection requires Mail.Read application permission granted in Azure AD.
            Check Azure Portal &rarr; App registrations &rarr; API permissions.
          </div>
        )}
        {msConnected && (
          <div className="mt-4 text-xs text-slate-400">
            Reading inbox via Microsoft Graph API (app-only credentials). {totalCount} total messages, {unreadCount} unread.
          </div>
        )}
      </div>
    )}

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
              Manage in Integrations &rarr;
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
          Note: Non-password settings stored locally. Password stored securely server-side.
        </div>
      </div>
    )}
  </div>
</div>

{/* Email Stats */}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mail className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{unreadCount}</div>
          <div className="text-sm text-slate-400">Unread emails</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Flag className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{urgentCount}</div>
          <div className="text-sm text-slate-400">Urgent items</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Inbox className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{totalCount}</div>
          <div className="text-sm text-slate-400">Total messages</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Paperclip className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{emails.filter((e) => e.hasAttachments).length}</div>
          <div className="text-sm text-slate-400">With attachments</div>
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

            {/* Templates */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 px-3">
                Templates
              </div>
              <div className="space-y-1">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => queuePremiumJob(`${template.name} template`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 transition-colors text-sm"
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
              {loadingInbox && emails.length === 0 && (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading inbox...
                </div>
              )}

              {!loadingInbox && emails.length === 0 && !msConnected && provider === "microsoft" && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 px-6 text-center">
                  <Mail className="w-10 h-10 mb-3 text-slate-600" />
                  <div className="text-sm">M365 not connected</div>
                  <div className="text-xs mt-1">Grant Mail.Read permission in Azure Portal</div>
                </div>
              )}

              {!loadingInbox && emails.length === 0 && msConnected && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <CheckCircle className="w-10 h-10 mb-3 text-emerald-500" />
                  <div className="text-sm">Inbox is empty</div>
                </div>
              )}

              {emails.map((email) => {
                const category = classifyImportance(email);
                return (
                  <div
                    key={email.id}
                    onClick={() => fetchMessage(email)}
                    className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500'
                        : 'hover:bg-slate-800/30'
                    } ${email.unread ? 'bg-slate-800/20' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${email.unread ? 'bg-cyan-400' : 'bg-transparent'}`} />
                        <span className={`text-sm font-semibold truncate ${email.unread ? 'text-white' : 'text-slate-400'}`}>
                          {email.from}
                        </span>
                        {email.flagged && <Flag className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatTimestamp(email.timestamp)}</span>
                    </div>

                    <div className="mb-2">
                      <div className={`text-sm mb-1 truncate ${email.unread ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {email.subject}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-2">
                        {email.preview}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        category === 'urgent'
                          ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                          : category === 'action'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                          : category === 'fyi'
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                          : 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                      }`}>
                        {category}
                      </span>
                      {email.hasAttachments && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Content */}
          <div className="lg:col-span-5 p-6">
            {selectedEmail && messageDetail ? (
              <>
                {/* Email Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {messageDetail.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{messageDetail.from}</span>
                          <span className="text-slate-600 text-xs">&lt;{messageDetail.fromEmail}&gt;</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(messageDetail.timestamp).toLocaleString("en-US", {
                          timeZone: "America/Chicago",
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      {messageDetail.to.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          To: {messageDetail.to.map((t) => t.name || t.email).join(", ")}
                        </div>
                      )}
                    </div>
                    <button onClick={() => queuePremiumJob("Premium action")} className="p-2 hover:bg-slate-800 rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.name}
                          onClick={() => queuePremiumJob(`${action.name} email`)}
                          className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded text-xs text-slate-300 transition-colors flex items-center gap-2"
                        >
                          <Icon className="w-3 h-3" />
                          {action.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email Body */}
                <div className="prose prose-invert prose-sm max-w-none mb-6 overflow-auto max-h-[350px]">
                  {messageDetail.bodyHtml ? (
                    <div
                      className="text-slate-300"
                      dangerouslySetInnerHTML={{ __html: messageDetail.bodyHtml }}
                    />
                  ) : (
                    <pre className="text-slate-300 whitespace-pre-wrap font-sans text-sm">
                      {messageDetail.bodyText || messageDetail.bodyPreview}
                    </pre>
                  )}
                </div>

                {/* Attachments indicator */}
                {messageDetail.hasAttachments && (
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-white mb-2">Attachments</div>
                    <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-700/50 rounded-lg">
                      <Paperclip className="w-5 h-5 text-cyan-400" />
                      <div className="text-sm text-slate-400">This message has attachments</div>
                    </div>
                  </div>
                )}
              </>
            ) : selectedEmail && loadingMessage ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                <div className="text-slate-500 text-sm">Loading message...</div>
              </div>
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
                  onClick={() => queuePremiumJob("Premium action")}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
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
