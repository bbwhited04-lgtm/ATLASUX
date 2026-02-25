import { useState, useEffect } from "react";
import { Send, MessageSquare, Mail, Phone, RefreshCw, Bot, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type Tab = "telegram" | "teams" | "email" | "sms";

type TelegramUpdate = {
  update_id: number;
  message?: {
    from?: { username?: string; first_name?: string };
    text?: string;
    date?: number;
    chat?: { id: number; type: string };
  };
};

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors placeholder-slate-500";

export function MessagingHub() {
  const { tenantId } = useActiveTenant();
  const [tab, setTab] = useState<Tab>("telegram");

  // ── Teams ────────────────────────────────────────────
  const [teamsStatus, setTeamsStatus] = useState<{ connected: boolean; reason?: string } | null>(null);
  const [teamsTeams, setTeamsTeams] = useState<any[]>([]);
  const [teamsChannels, setTeamsChannels] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [teamsMessages, setTeamsMessages] = useState<any[]>([]);
  const [teamsMessagesLoading, setTeamsMessagesLoading] = useState(false);
  const [teamsText, setTeamsText] = useState("");
  const [teamsSending, setTeamsSending] = useState(false);
  const [teamsResult, setTeamsResult] = useState<string | null>(null);
  // Cross-agent
  const [crossFromAgent, setCrossFromAgent] = useState("atlas");
  const [crossToAgent, setCrossToAgent] = useState("");
  const [crossMessage, setCrossMessage] = useState("");
  const [crossSending, setCrossSending] = useState(false);
  const [crossResult, setCrossResult] = useState<string | null>(null);

  // ── Telegram ────────────────────────────────────────
  const [botInfo, setBotInfo] = useState<any>(null);
  const [botLoading, setBotLoading] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [tgChatId, setTgChatId] = useState("");
  const [tgText, setTgText] = useState("");
  const [tgSending, setTgSending] = useState(false);
  const [tgResult, setTgResult] = useState<string | null>(null);
  const [tgUpdates, setTgUpdates] = useState<TelegramUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);

  // ── Email ───────────────────────────────────────────
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailText, setEmailText] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [emailOutbox, setEmailOutbox] = useState<any[]>([]);
  const [outboxLoading, setOutboxLoading] = useState(false);

  // ── SMS ─────────────────────────────────────────────
  const [smsTo, setSmsTo] = useState("");
  const [smsText, setSmsText] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);

  // ── Data fetchers ────────────────────────────────────

  async function fetchTeamsStatus() {
    try {
      const res = await fetch(`${API_BASE}/v1/teams/status`);
      const data = await res.json();
      setTeamsStatus({ connected: data.connected ?? false, reason: data.reason });
    } catch {
      setTeamsStatus({ connected: false, reason: "Failed to reach backend" });
    }
  }

  async function fetchTeamsList() {
    try {
      const res = await fetch(`${API_BASE}/v1/teams/teams`);
      const data = await res.json();
      if (data.ok) setTeamsTeams(data.teams ?? []);
    } catch {
      // silent
    }
  }

  async function fetchChannels(teamId: string) {
    setTeamsChannels([]);
    setSelectedChannel("");
    setTeamsMessages([]);
    try {
      const res = await fetch(`${API_BASE}/v1/teams/${teamId}/channels`);
      const data = await res.json();
      if (data.ok) setTeamsChannels(data.channels ?? []);
    } catch {
      // silent
    }
  }

  async function fetchMessages() {
    if (!selectedTeam || !selectedChannel) return;
    setTeamsMessagesLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/v1/teams/${selectedTeam}/channels/${selectedChannel}/messages?limit=20`
      );
      const data = await res.json();
      if (data.ok) setTeamsMessages(data.messages ?? []);
    } catch {
      // silent
    } finally {
      setTeamsMessagesLoading(false);
    }
  }

  async function sendTeamsMessage() {
    if (!selectedTeam || !selectedChannel || !teamsText.trim()) return;
    setTeamsSending(true);
    setTeamsResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/teams/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId ?? "" },
        body: JSON.stringify({
          teamId: selectedTeam,
          channelId: selectedChannel,
          text: teamsText.trim(),
          fromAgent: "atlas",
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "send_failed");
      setTeamsResult("Message sent!");
      setTeamsText("");
      void fetchMessages();
    } catch (e: any) {
      setTeamsResult(`Error: ${e.message}`);
    } finally {
      setTeamsSending(false);
    }
  }

  async function sendCrossAgent() {
    if (!selectedTeam || !selectedChannel || !crossFromAgent || !crossToAgent || !crossMessage.trim()) return;
    setCrossSending(true);
    setCrossResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/teams/cross-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId ?? "" },
        body: JSON.stringify({
          teamId: selectedTeam,
          channelId: selectedChannel,
          fromAgent: crossFromAgent,
          toAgent: crossToAgent,
          message: crossMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "cross_agent_failed");
      setCrossResult(`Sent from ${crossFromAgent} → ${crossToAgent}`);
      setCrossMessage("");
      void fetchMessages();
    } catch (e: any) {
      setCrossResult(`Error: ${e.message}`);
    } finally {
      setCrossSending(false);
    }
  }

  async function fetchBotInfo() {
    setBotLoading(true);
    setBotError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/telegram/me`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "bot_check_failed");
      setBotInfo(data.bot);
    } catch (e: any) {
      setBotError(e.message);
      setBotInfo(null);
    } finally {
      setBotLoading(false);
    }
  }

  async function fetchUpdates() {
    setUpdatesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/telegram/updates`);
      const data = await res.json();
      if (data.ok) setTgUpdates(data.updates ?? []);
    } catch {
      // silent
    } finally {
      setUpdatesLoading(false);
    }
  }

  async function fetchOutbox() {
    if (!tenantId) return;
    setOutboxLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/comms/outbox`, {
        headers: { "x-tenant-id": tenantId },
      });
      const data = await res.json();
      if (data.ok) setEmailOutbox(data.jobs ?? []);
    } catch {
      // silent
    } finally {
      setOutboxLoading(false);
    }
  }

  useEffect(() => {
    fetchBotInfo();
    fetchTeamsStatus();
  }, []);

  useEffect(() => {
    if (tab === "telegram") fetchUpdates();
    if (tab === "email") fetchOutbox();
    if (tab === "teams") {
      fetchTeamsList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tenantId]);

  useEffect(() => {
    if (selectedTeam) fetchChannels(selectedTeam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTeam && selectedChannel) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  // ── Senders ─────────────────────────────────────────

  async function sendTelegram(chatIdOverride?: string) {
    const chatId = (typeof chatIdOverride === "string" ? chatIdOverride : null) ?? tgChatId;
    if (!chatId || !tgText) return;
    setTgSending(true);
    setTgResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/telegram/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: tgText }),
      });
      const data = await res.json();
      if (!data.ok) {
        const raw = data.error ?? "send_failed";
        const lower = raw.toLowerCase();
        if (lower.includes("chat not found") || lower.includes("chat_not_found")) {
          // Auto-refresh incoming list so user can click "Use chat" immediately
          void fetchUpdates();
          throw new Error("Chat not found — the recipient must send your bot a message on Telegram first, then click 'Use chat' below.");
        }
        throw new Error(raw);
      }
      setTgResult("Message sent!");
      setTgText("");
      void fetchUpdates();
    } catch (e: any) {
      setTgResult(`Error: ${e.message}`);
    } finally {
      setTgSending(false);
    }
  }

  async function sendEmail() {
    if (!emailTo || !emailSubject || !emailText || !tenantId) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/comms/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          tenantId,
          fromAgent: "atlas",
          to: emailTo,
          subject: emailSubject,
          text: emailText,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "queue_failed");
      setEmailResult("Email queued for delivery!");
      setEmailTo("");
      setEmailSubject("");
      setEmailText("");
      void fetchOutbox();
    } catch (e: any) {
      setEmailResult(`Error: ${e.message}`);
    } finally {
      setEmailSending(false);
    }
  }

  async function sendSms() {
    if (!smsTo || !smsText) return;
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/comms/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId ?? "" },
        body: JSON.stringify({ to: smsTo, message: smsText, tenantId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "sms_failed");
      setSmsResult("SMS queued!");
      setSmsTo("");
      setSmsText("");
    } catch (e: any) {
      setSmsResult(`Error: ${e.message}`);
    } finally {
      setSmsSending(false);
    }
  }

  // ── UI ──────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Messaging Hub
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Send messages via Telegram, Email, and SMS — unified in one place
        </p>
      </div>

      {/* Bot Status Banner */}
      <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                botInfo ? "bg-cyan-500/20" : "bg-slate-800"
              }`}
            >
              <Bot className={`w-5 h-5 ${botInfo ? "text-cyan-400" : "text-slate-500"}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {botInfo
                  ? `@${botInfo.username}`
                  : botError
                  ? "Telegram bot not reachable"
                  : "Verifying bot…"}
              </div>
              <div className="text-xs text-slate-400">
                {botInfo
                  ? `${botInfo.first_name} · Telegram Bot API`
                  : botError
                  ? botError
                  : "Checking BOTFATHERTOKEN…"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {botInfo && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </Badge>
            )}
            {botError && (
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">
                Disconnected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBotInfo}
              disabled={botLoading}
              className="border-cyan-500/20"
            >
              <RefreshCw className={`w-3 h-3 ${botLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { id: "teams" as Tab, label: "Teams", Icon: Users },
            { id: "telegram" as Tab, label: "Telegram", Icon: MessageSquare },
            { id: "email" as Tab, label: "Email", Icon: Mail },
            { id: "sms" as Tab, label: "SMS", Icon: Phone },
          ] as const
        ).map(({ id, label, Icon }) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
            className={tab === id ? "bg-cyan-500" : "border-cyan-500/20"}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* ─── Teams Tab ────────────────────────────────────── */}
      {tab === "teams" && (
        <div className="space-y-4">
          {/* Status banner */}
          {teamsStatus && !teamsStatus.connected && (
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300">
              Teams not connected: {teamsStatus.reason ?? "MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET required in backend env."}
            </div>
          )}

          {/* Team + Channel selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={inputCls}
              >
                <option value="">Select a team…</option>
                {teamsTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                disabled={!selectedTeam || teamsChannels.length === 0}
                className={inputCls}
              >
                <option value="">Select a channel…</option>
                {teamsChannels.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Compose + cross-agent visible when a team + channel are selected */}
          {selectedTeam && selectedChannel && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Compose + cross-agent */}
              <div className="space-y-4">
                {/* Direct compose */}
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5 space-y-3">
                  <div className="font-semibold text-white">Send to Channel</div>
                  <textarea
                    className={`${inputCls} min-h-[100px] resize-none`}
                    placeholder="Message (sent as Atlas)"
                    value={teamsText}
                    onChange={(e) => setTeamsText(e.target.value)}
                  />
                  {teamsResult && (
                    <div className={`p-2 rounded-lg text-xs ${teamsResult.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {teamsResult}
                    </div>
                  )}
                  <Button
                    onClick={sendTeamsMessage}
                    disabled={!selectedTeam || !selectedChannel || !teamsText.trim() || teamsSending}
                    className="w-full bg-cyan-500 hover:bg-cyan-400"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {teamsSending ? "Sending…" : "Send Message"}
                  </Button>
                </Card>

                {/* Cross-agent */}
                <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-xl p-5 space-y-3">
                  <div className="font-semibold text-white">Cross-Agent Notify</div>
                  <p className="text-xs text-slate-400">Route a message between agents via this Teams channel.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-0.5 block">From agent</label>
                      <input
                        className={inputCls}
                        placeholder="atlas"
                        value={crossFromAgent}
                        onChange={(e) => setCrossFromAgent(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-0.5 block">To agent</label>
                      <input
                        className={inputCls}
                        placeholder="petra, cheryl…"
                        value={crossToAgent}
                        onChange={(e) => setCrossToAgent(e.target.value)}
                      />
                    </div>
                  </div>
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-none`}
                    placeholder="Message for the receiving agent…"
                    value={crossMessage}
                    onChange={(e) => setCrossMessage(e.target.value)}
                  />
                  {crossResult && (
                    <div className={`p-2 rounded-lg text-xs ${crossResult.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-300"}`}>
                      {crossResult}
                    </div>
                  )}
                  <Button
                    onClick={sendCrossAgent}
                    disabled={!selectedTeam || !selectedChannel || !crossFromAgent || !crossToAgent || !crossMessage.trim() || crossSending}
                    className="w-full bg-purple-600 hover:bg-purple-500"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {crossSending ? "Sending…" : "Send Cross-Agent"}
                  </Button>
                </Card>
              </div>

              {/* Message feed */}
              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-white">Recent Messages</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMessages}
                    disabled={teamsMessagesLoading || !selectedTeam || !selectedChannel}
                    className="border-cyan-500/20"
                  >
                    <RefreshCw className={`w-3 h-3 ${teamsMessagesLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {!selectedTeam || !selectedChannel ? (
                    <div className="text-xs text-slate-500 text-center py-8">
                      Select a team + channel above to read messages.<br/>
                      <span className="text-slate-600">(Sending works without this)</span>
                    </div>
                  ) : teamsMessagesLoading ? (
                    <div className="text-xs text-slate-500 text-center py-8">Loading…</div>
                  ) : teamsMessages.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-8">No messages yet.</div>
                  ) : (
                    teamsMessages.map((m) => (
                      <div key={m.id} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-cyan-400">{m.from}</span>
                          <span className="text-[10px] text-slate-500">
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                          </span>
                        </div>
                        <div
                          className="text-xs text-slate-300 line-clamp-3"
                          dangerouslySetInnerHTML={
                            m.contentType === "html"
                              ? { __html: m.body }
                              : undefined
                          }
                        >
                          {m.contentType !== "html" ? m.body : undefined}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── Telegram Tab ─────────────────────────────────── */}
      {tab === "telegram" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compose */}
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5 space-y-4">
            <div className="font-semibold text-white">Send Message</div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400 leading-relaxed">
              The recipient must first message your bot on Telegram. Their numeric chat ID will then appear in <span className="text-cyan-400 font-medium">Recent Incoming</span> — click <span className="text-cyan-400 font-medium">Use chat</span> to fill it in automatically.
            </div>
            <div className="space-y-3">
              <input
                className={inputCls}
                placeholder="Numeric Chat ID (e.g. 123456789)"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
              />
              <textarea
                className={`${inputCls} min-h-[120px] resize-none font-mono`}
                placeholder="Message text (Markdown supported)"
                value={tgText}
                onChange={(e) => setTgText(e.target.value)}
              />
            </div>
            {tgResult && (
              <div
                className={`p-2 rounded-lg text-xs ${
                  tgResult.startsWith("Error")
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {tgResult}
                {tgResult.includes("Chat not found") && (
                  <div className="mt-2 font-medium text-amber-300">
                    1. Open Telegram → search your bot → send it any message (e.g. "hi").<br />
                    2. Click Refresh on the right panel — your chat ID will appear.<br />
                    3. Click "Use chat" to fill it in, then retry.
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={sendTelegram}
              disabled={!tgChatId || !tgText || tgSending}
              className="w-full bg-cyan-500 hover:bg-cyan-400"
            >
              <Send className="w-4 h-4 mr-2" />
              {tgSending ? "Sending…" : "Send via Telegram"}
            </Button>
          </Card>

          {/* Recent Messages */}
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-white">Recent Incoming</div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUpdates}
                disabled={updatesLoading}
                className="border-cyan-500/20"
              >
                <RefreshCw className={`w-3 h-3 ${updatesLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {tgUpdates.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-10">
                  No messages yet. Start a chat with your bot on Telegram.
                </div>
              ) : (
                [...tgUpdates].reverse().map((u) => (
                  <div
                    key={u.update_id}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-cyan-400">
                        {u.message?.from?.first_name ?? u.message?.from?.username ?? "Unknown"}
                      </span>
                      {u.message?.chat?.id && (
                        <button
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 transition-colors border border-cyan-500/30"
                          onClick={() => {
                            const id = String(u.message!.chat!.id);
                            setTgChatId(id);
                            if (tgText.trim()) void sendTelegram(id);
                          }}
                        >
                          {tgText.trim() ? `Use chat & send` : `Use chat`}
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">{u.message?.text ?? "—"}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Email Tab ────────────────────────────────────── */}
      {tab === "email" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5 space-y-4">
            <div className="font-semibold text-white">Compose Email</div>
            {!tenantId && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Select a business first to send emails.
              </div>
            )}
            <div className="space-y-3">
              <input
                className={inputCls}
                type="email"
                placeholder="To"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
              <textarea
                className={`${inputCls} min-h-[120px] resize-none`}
                placeholder="Message body"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
              />
            </div>
            {emailResult && (
              <div
                className={`p-2 rounded-lg text-xs ${
                  emailResult.startsWith("Error")
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {emailResult}
              </div>
            )}
            <Button
              onClick={sendEmail}
              disabled={!emailTo || !emailSubject || !emailText || emailSending || !tenantId}
              className="w-full bg-cyan-500 hover:bg-cyan-400"
            >
              <Send className="w-4 h-4 mr-2" />
              {emailSending ? "Queuing…" : "Queue Email"}
            </Button>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-white">Outbox</div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOutbox}
                disabled={outboxLoading}
                className="border-cyan-500/20"
              >
                <RefreshCw className={`w-3 h-3 ${outboxLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {emailOutbox.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-10">
                  No emails in outbox
                </div>
              ) : (
                emailOutbox.map((j: any) => (
                  <div
                    key={j.id}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 truncate flex-1">
                        {(j.input as any)?.to ?? "—"}
                      </span>
                      <Badge
                        className={`ml-2 text-[10px] flex-shrink-0 ${
                          j.status === "succeeded"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : j.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {j.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {(j.input as any)?.subject ?? "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ─── SMS Tab ──────────────────────────────────────── */}
      {tab === "sms" && (
        <div className="max-w-md">
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5 space-y-4">
            <div className="font-semibold text-white">Send SMS</div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              SMS is queued via the job system. Connect a Twilio account in Integrations to enable
              delivery.
            </div>
            <div className="space-y-3">
              <input
                className={inputCls}
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
              />
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                placeholder="Message"
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
              />
            </div>
            {smsResult && (
              <div
                className={`p-2 rounded-lg text-xs ${
                  smsResult.startsWith("Error")
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {smsResult}
              </div>
            )}
            <Button
              onClick={sendSms}
              disabled={!smsTo || !smsText || smsSending}
              className="w-full bg-cyan-500 hover:bg-cyan-400"
            >
              <Send className="w-4 h-4 mr-2" />
              {smsSending ? "Queuing…" : "Queue SMS"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
