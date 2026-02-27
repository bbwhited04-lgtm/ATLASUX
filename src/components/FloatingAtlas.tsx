/**
 * Floating Atlas — large wireframe robot that floats on screen.
 *
 * Always visible, non-intrusive. Click to expand chat panel.
 * The robot is detailed enough to look high-end at desktop size.
 * Connects to real /v1/chat endpoint.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Send, X, Minus, Mic, MicOff } from "lucide-react";

/* ── Types ── */
interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
}

type FloatStatus = "online" | "busy" | "attention";

interface StatusMeta {
  color: string;
  glow: string;
  label: string;
  pulseSpeed: string;
  heartColor: string;
  heartGlow: string;
}

const STATUS_MAP: Record<FloatStatus, StatusMeta> = {
  online:    { color: "#22c55e", glow: "rgba(34,197,94,0.6)",   label: "Online",        pulseSpeed: "2s",   heartColor: "#06b6d4", heartGlow: "rgba(6,182,212,0.5)" },
  busy:      { color: "#a855f7", glow: "rgba(168,85,247,0.6)",  label: "Processing",    pulseSpeed: "1s",   heartColor: "#a855f7", heartGlow: "rgba(168,85,247,0.5)" },
  attention: { color: "#ef4444", glow: "rgba(239,68,68,0.7)",   label: "Needs approval", pulseSpeed: "0.6s", heartColor: "#ef4444", heartGlow: "rgba(239,68,68,0.5)" },
};

/* ── Keyframes ── */
const STYLE_ID = "floating-atlas-kf";
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes fa-heartbeat {
      0%{transform:scale(1);opacity:0.9} 15%{transform:scale(1.25);opacity:1}
      30%{transform:scale(1);opacity:0.9} 45%{transform:scale(1.12);opacity:1}
      60%,100%{transform:scale(1);opacity:0.9}
    }
    @keyframes fa-ring {
      0%{transform:scale(1);opacity:0.4} 15%{transform:scale(2);opacity:0}
      30%{transform:scale(1);opacity:0.4} 45%{transform:scale(1.6);opacity:0}
      60%,100%{transform:scale(1);opacity:0.2}
    }
    @keyframes fa-scan {
      0%{opacity:0.08;transform:translateY(0)} 50%{opacity:0.2;transform:translateY(140px)} 100%{opacity:0.08;transform:translateY(0)}
    }
    @keyframes fa-energy { 0%{stroke-dashoffset:16} 100%{stroke-dashoffset:0} }
    @keyframes fa-eye-glow { 0%,100%{opacity:0.8} 50%{opacity:1} }
  `;
  document.head.appendChild(s);
}

/* ── Component ── */
export default function FloatingAtlas() {
  const { tenantId } = useActiveTenant();
  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 0, role: "assistant", content: "Hey — I'm Atlas. Ask me anything or give me a task.", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<FloatStatus>("online");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { ensureKeyframes(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);

  /* Voice recognition setup */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript.trim()) {
        setInput(transcript);
        // Auto-send voice commands
        setTimeout(() => {
          const form = document.getElementById("atlas-chat-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }, 100);
      }
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.abort();
      setListening(false);
    } else {
      setChatOpen(true);
      recognitionRef.current.start();
      setListening(true);
    }
  };

  /* Status poll */
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

  /* Send via /v1/chat */
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
        headers: { "Content-Type": "application/json", ...(tenantId ? { "x-tenant-id": tenantId } : {}) },
        body: JSON.stringify({
          provider: "openai",
          messages: [...messages.filter(m => m.role === "user" || m.role === "assistant").slice(-8).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }],
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

  const meta = STATUS_MAP[status];

  /* Minimized pill */
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); setChatOpen(true); }}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-lg hover:border-cyan-400/50 transition-all"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
        <span className="text-xs text-cyan-400 font-medium">Atlas</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex items-end gap-3">
      {/* Chat panel (slides in from right of robot) */}
      {chatOpen && (
        <div className="w-[360px] max-h-[480px] flex flex-col rounded-2xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden mb-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/10 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
              <span className="text-sm font-semibold text-white">Atlas</span>
              <span className="text-[10px] text-slate-500">{meta.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setChatOpen(false); setMinimized(true); }} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60"><Minus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setChatOpen(false)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 min-h-[240px] max-h-[340px] scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === "user" ? "bg-cyan-600/20 text-cyan-100 border border-cyan-500/15" : "bg-slate-800/60 text-slate-200 border border-slate-700/30"}`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className="text-[9px] text-slate-500 mt-1 text-right">{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl px-3 py-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* Input */}
          <form id="atlas-chat-form" onSubmit={e => { e.preventDefault(); send(); }} className="px-3 py-2 border-t border-cyan-500/10 bg-slate-900/40 flex gap-2">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? "Listening..." : "Ask Atlas..."} className={`flex-1 bg-slate-800/60 border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${listening ? "border-red-400/50 placeholder-red-300/50" : "border-cyan-500/15 focus:border-cyan-400/40"}`} />
            {voiceSupported && (
              <button type="button" onClick={toggleVoice} className={`p-2 rounded-xl transition-colors ${listening ? "bg-red-600/80 text-white animate-pulse" : "bg-slate-700/60 text-slate-400 hover:text-cyan-400 hover:bg-slate-700"}`} title={listening ? "Stop listening" : "Voice command"}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button type="submit" disabled={!input.trim() || typing} className="p-2 rounded-xl bg-cyan-600/80 text-white hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}

      {/* The robot */}
      <button
        onClick={() => setChatOpen(o => !o)}
        className="relative cursor-pointer transition-transform hover:scale-105 focus:outline-none"
        style={{ animation: "fa-float 4s ease-in-out infinite", filter: `drop-shadow(0 0 12px ${meta.heartGlow})` }}
        title={`Atlas — ${meta.label}. Click to chat.`}
      >
        <svg
          viewBox="0 0 160 220"
          width={120}
          height={165}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none"
        >
          {/* ═══ HEAD ═══ */}
          <ellipse cx="80" cy="32" rx="28" ry="30" stroke="#06b6d4" strokeWidth="2" opacity="0.85" />
          <ellipse cx="80" cy="32" rx="20" ry="22" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />
          {/* Face wireframe lines */}
          <ellipse cx="80" cy="22" rx="22" ry="1" stroke="#06b6d4" strokeWidth="0.6" opacity="0.2" />
          <ellipse cx="80" cy="30" rx="27" ry="1" stroke="#06b6d4" strokeWidth="0.6" opacity="0.25" />
          <ellipse cx="80" cy="38" rx="27" ry="1" stroke="#06b6d4" strokeWidth="0.6" opacity="0.25" />
          <ellipse cx="80" cy="46" rx="20" ry="1" stroke="#06b6d4" strokeWidth="0.6" opacity="0.2" />
          <path d="M80 2 Q80 32 80 62" stroke="#06b6d4" strokeWidth="0.6" opacity="0.15" />

          {/* Antenna */}
          <line x1="80" y1="2" x2="80" y2="8" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <circle cx="80" cy="2" r="2.5" fill={meta.heartColor} opacity="0.8"
            style={{ animation: `fa-eye-glow 2s ease-in-out infinite` }}
          />

          {/* Eyes — bright and glowing */}
          <line x1="66" y1="28" x2="74" y2="28" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="1" />
          <line x1="86" y1="28" x2="94" y2="28" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="1" />
          <circle cx="70" cy="28" r="2" fill="#67e8f9" opacity="0.7" style={{ animation: "fa-eye-glow 3s ease-in-out infinite" }} />
          <circle cx="90" cy="28" r="2" fill="#67e8f9" opacity="0.7" style={{ animation: "fa-eye-glow 3s ease-in-out infinite" }} />

          {/* Mouth */}
          <path d="M72 42 Q80 46 88 42" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

          {/* ═══ NECK ═══ */}
          <line x1="74" y1="62" x2="74" y2="74" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="86" y1="62" x2="86" y2="74" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="80" y1="62" x2="80" y2="75" stroke="#06b6d4" strokeWidth="0.8" opacity="0.25" />
          {/* Neck rings */}
          <ellipse cx="80" cy="66" rx="8" ry="2" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />
          <ellipse cx="80" cy="70" rx="9" ry="2" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />

          {/* ═══ TORSO ═══ */}
          <path d="M48 76 L112 76 L116 136 Q80 144 44 136 Z" stroke="#06b6d4" strokeWidth="2" opacity="0.7" fill="none" />
          <path d="M56 82 L104 82 L108 128 Q80 134 52 128 Z" stroke="#06b6d4" strokeWidth="0.8" opacity="0.25" fill="none" />
          {/* Rib lines */}
          <line x1="50" y1="90" x2="110" y2="90" stroke="#06b6d4" strokeWidth="0.6" opacity="0.2" />
          <line x1="48" y1="104" x2="112" y2="104" stroke="#06b6d4" strokeWidth="0.6" opacity="0.2" />
          <line x1="46" y1="118" x2="114" y2="118" stroke="#06b6d4" strokeWidth="0.6" opacity="0.2" />
          <line x1="80" y1="76" x2="80" y2="140" stroke="#06b6d4" strokeWidth="0.6" opacity="0.15" />

          {/* ═══ HEARTBEAT CORE ═══ */}
          <circle cx="80" cy="100" r="16" fill="none" stroke={meta.heartColor} strokeWidth="0.5" opacity="0.2"
            style={{ animation: `fa-ring ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "80px 100px" }}
          />
          <circle cx="80" cy="100" r="10" fill={meta.heartColor} fillOpacity="0.08"
            style={{ animation: `fa-ring ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "80px 100px" }}
          />
          <path d="M80 88 L90 100 L80 112 L70 100 Z" stroke={meta.heartColor} strokeWidth="1.5" fill={meta.heartColor} fillOpacity="0.15"
            style={{ animation: `fa-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "80px 100px" }}
          />
          <circle cx="80" cy="100" r="4" fill={meta.heartColor} opacity="0.95"
            style={{ animation: `fa-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "80px 100px" }}
          />
          {/* Energy lines from core */}
          <line x1="80" y1="88" x2="80" y2="76" stroke={meta.heartColor} strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" style={{ animation: "fa-energy 1.5s linear infinite" }} />
          <line x1="90" y1="100" x2="108" y2="100" stroke={meta.heartColor} strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" style={{ animation: "fa-energy 1.5s linear infinite" }} />
          <line x1="70" y1="100" x2="52" y2="100" stroke={meta.heartColor} strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" style={{ animation: "fa-energy 1.5s linear infinite" }} />
          <line x1="80" y1="112" x2="80" y2="130" stroke={meta.heartColor} strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" style={{ animation: "fa-energy 1.5s linear infinite" }} />

          {/* ═══ SHOULDERS ═══ */}
          <path d="M48 76 Q36 78 24 86" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          <path d="M112 76 Q124 78 136 86" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          {/* Shoulder joints */}
          <circle cx="24" cy="86" r="4" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="136" cy="86" r="4" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4" />

          {/* ═══ ARMS ═══ */}
          {/* Left */}
          <line x1="24" y1="86" x2="16" y2="116" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="16" y1="116" x2="12" y2="140" stroke="#06b6d4" strokeWidth="1.2" opacity="0.4" />
          <circle cx="16" cy="116" r="3" stroke="#06b6d4" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M12 140 L8 146 M12 140 L12 148 M12 140 L16 146" stroke="#06b6d4" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />
          {/* Right */}
          <line x1="136" y1="86" x2="144" y2="116" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="144" y1="116" x2="148" y2="140" stroke="#06b6d4" strokeWidth="1.2" opacity="0.4" />
          <circle cx="144" cy="116" r="3" stroke="#06b6d4" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M148 140 L152 146 M148 140 L148 148 M148 140 L144 146" stroke="#06b6d4" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />

          {/* ═══ WAIST / HIP ═══ */}
          <path d="M52 136 Q80 144 108 136" stroke="#06b6d4" strokeWidth="1.2" opacity="0.5" />
          <path d="M60 140 L100 140 L96 154 L64 154 Z" stroke="#06b6d4" strokeWidth="1" opacity="0.4" fill="none" />

          {/* ═══ LEGS ═══ */}
          {/* Left */}
          <line x1="66" y1="154" x2="60" y2="184" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="60" y1="184" x2="56" y2="208" stroke="#06b6d4" strokeWidth="1.2" opacity="0.4" />
          <circle cx="60" cy="184" r="3.5" stroke="#06b6d4" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M56 208 L48 214 L64 214 Z" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4" />
          {/* Right */}
          <line x1="94" y1="154" x2="100" y2="184" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <line x1="100" y1="184" x2="104" y2="208" stroke="#06b6d4" strokeWidth="1.2" opacity="0.4" />
          <circle cx="100" cy="184" r="3.5" stroke="#06b6d4" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M104 208 L96 214 L112 214 Z" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4" />

          {/* ═══ SCAN LINE ═══ */}
          <rect x="10" y="10" width="140" height="2" rx="1" fill="#22d3ee" opacity="0.1"
            style={{ animation: "fa-scan 5s ease-in-out infinite" }}
          />

          {/* Status dot */}
          <circle cx="140" cy="12" r="8" fill={meta.color} opacity="0.9" />
          <circle cx="140" cy="12" r="8" stroke="#0f172a" strokeWidth="3" fill="none" />
        </svg>
      </button>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
