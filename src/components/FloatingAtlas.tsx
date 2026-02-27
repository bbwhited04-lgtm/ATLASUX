/**
 * Floating Atlas — always-accessible chat widget
 *
 * Uses the wireframe robot avatar from AtlasAvatar, connects to the real
 * /v1/chat endpoint, and stays non-intrusive (bottom-right corner).
 * Draggable, collapsible, voice-ready.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Send, X, Minus, MessageSquare } from "lucide-react";

/* ── Types ── */
interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
}

type FloatStatus = "online" | "busy" | "attention";

const STATUS_COLORS: Record<FloatStatus, { dot: string; glow: string }> = {
  online:    { dot: "#22c55e", glow: "rgba(34,197,94,0.6)" },
  busy:      { dot: "#a855f7", glow: "rgba(168,85,247,0.6)" },
  attention: { dot: "#ef4444", glow: "rgba(239,68,68,0.7)" },
};

/* ── Mini robot SVG (head + chest only, for the collapsed bubble) ── */
function MiniRobot({ heartColor }: { heartColor: string }) {
  return (
    <svg viewBox="0 0 80 72" width={36} height={32} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <ellipse cx="40" cy="16" rx="14" ry="15" stroke="#06b6d4" strokeWidth="1.4" opacity="0.85" />
      <ellipse cx="40" cy="16" rx="10" ry="11" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
      {/* Eyes */}
      <line x1="33" y1="14" x2="37" y2="14" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
      <line x1="43" y1="14" x2="47" y2="14" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
      {/* Neck */}
      <line x1="37" y1="31" x2="37" y2="37" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
      <line x1="43" y1="31" x2="43" y2="37" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
      {/* Chest */}
      <path d="M24 38 L56 38 L58 68 Q40 72 22 68 Z" stroke="#06b6d4" strokeWidth="1.1" opacity="0.7" fill="none" />
      {/* Heartbeat core */}
      <path d="M40 46 L45 53 L40 60 L35 53 Z" stroke={heartColor} strokeWidth="1" fill={heartColor} fillOpacity="0.25" />
      <circle cx="40" cy="53" r="2.5" fill={heartColor} opacity="0.9" />
      {/* Shoulders */}
      <path d="M24 38 Q18 39 12 43" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M56 38 Q62 39 68 43" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/* ── Keyframes (injected once) ── */
const STYLE_ID = "floating-atlas-keyframes";
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes fa-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(6,182,212,0.4)} 50%{box-shadow:0 0 0 8px rgba(6,182,212,0)} }
  `;
  document.head.appendChild(s);
}

/* ── Component ── */
export default function FloatingAtlas() {
  const { tenantId } = useActiveTenant();
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 0, role: "assistant", content: "Hey — I'm Atlas. Ask me anything or give me a task.", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<FloatStatus>("online");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ensureKeyframes(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { if (expanded) inputRef.current?.focus(); }, [expanded]);

  /* Lightweight status poll (every 30s) */
  const pollStatus = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (tenantId) headers["x-tenant-id"] = tenantId;
    try {
      const [jobsRes, decRes] = await Promise.all([
        fetch(`${API_BASE}/v1/jobs/list`, { headers }).then(r => r.json()).catch(() => null),
        tenantId
          ? fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=50`, { headers }).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
      ]);
      const jobs = Array.isArray(jobsRes?.jobs) ? jobsRes.jobs.filter((j: any) => j.status === "running" || j.status === "queued").length : 0;
      const decs = Array.isArray(decRes?.memos) ? decRes.memos.length : 0;
      if (decs > 0) setStatus("attention");
      else if (jobs > 0) setStatus("busy");
      else setStatus("online");
    } catch { /* keep current */ }
  }, [tenantId]);

  useEffect(() => {
    pollStatus();
    const t = setInterval(pollStatus, 30_000);
    return () => clearInterval(t);
  }, [pollStatus]);

  /* Send message through real /v1/chat */
  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: Date.now(), role: "user", content: text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const resp = await fetch(`${API_BASE}/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
        },
        body: JSON.stringify({
          provider: "openai",
          messages: [
            ...messages.filter(m => m.role === "user" || m.role === "assistant").slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          systemPrompt: null,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      const content = data?.content || (resp.ok ? "..." : `Error: ${data?.error || resp.statusText}`);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content, time: now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: `Offline — ${err?.message || "network error"}`, time: now() }]);
    } finally {
      setTyping(false);
    }
  };

  const sc = STATUS_COLORS[status];
  const heartColor = status === "attention" ? "#ef4444" : status === "busy" ? "#a855f7" : "#06b6d4";

  /* Minimized → tiny pill in the corner */
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); setExpanded(true); }}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-lg hover:border-cyan-400/50 transition-all"
        title="Open Atlas"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot, boxShadow: `0 0 6px ${sc.glow}` }} />
        <span className="text-xs text-cyan-400 font-medium">Atlas</span>
      </button>
    );
  }

  /* Collapsed → robot bubble */
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex items-center justify-center hover:border-cyan-400/50 hover:scale-105 transition-all cursor-pointer"
        style={{ animation: "fa-float 4s ease-in-out infinite, fa-pulse 3s ease-in-out infinite" }}
        title="Chat with Atlas"
      >
        <MiniRobot heartColor={heartColor} />
        {/* Status dot */}
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
          style={{ backgroundColor: sc.dot, boxShadow: `0 0 6px ${sc.glow}` }}
        />
      </button>
    );
  }

  /* Expanded → chat window */
  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[380px] max-h-[520px] flex flex-col rounded-2xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-cyan-500/20 flex items-center justify-center">
            <MiniRobot heartColor={heartColor} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              Atlas
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
            </div>
            <div className="text-[10px] text-slate-500">AI CEO — always here</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setExpanded(false); setMinimized(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[260px] max-h-[360px] scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-cyan-600/20 text-cyan-100 border border-cyan-500/15"
                : "bg-slate-800/60 text-slate-200 border border-slate-700/30"
            }`}>
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
              <div className="text-[9px] text-slate-500 mt-1 text-right">{m.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-cyan-500/10 bg-slate-900/40">
        <form
          onSubmit={e => { e.preventDefault(); send(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Atlas anything..."
            className="flex-1 bg-slate-800/60 border border-cyan-500/15 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="p-2 rounded-xl bg-cyan-600/80 text-white hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
