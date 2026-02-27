import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";

/* ── Status types ── */
type AtlasStatus = "online" | "busy" | "attention";

interface StatusMeta {
  color: string;
  glow: string;
  label: string;
  pulseSpeed: string;
  heartColor: string;     // Core glow color
  heartGlow: string;      // Core radial glow
}

const STATUS_MAP: Record<AtlasStatus, StatusMeta> = {
  online:    { color: "#22c55e", glow: "rgba(34,197,94,0.6)",   label: "Online",        pulseSpeed: "2s",   heartColor: "#06b6d4", heartGlow: "rgba(6,182,212,0.8)" },
  busy:      { color: "#a855f7", glow: "rgba(168,85,247,0.6)",  label: "Processing",    pulseSpeed: "1s",   heartColor: "#a855f7", heartGlow: "rgba(168,85,247,0.8)" },
  attention: { color: "#ef4444", glow: "rgba(239,68,68,0.7)",   label: "Action needed", pulseSpeed: "0.6s", heartColor: "#ef4444", heartGlow: "rgba(239,68,68,0.8)" },
};

/* ── Keyframe styles injected once ── */
const STYLE_ID = "atlas-avatar-keyframes";
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes atlas-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-2px); }
    }
    @keyframes atlas-heartbeat {
      0%   { transform: scale(1);   opacity: 0.9; }
      15%  { transform: scale(1.3); opacity: 1; }
      30%  { transform: scale(1);   opacity: 0.9; }
      45%  { transform: scale(1.15); opacity: 1; }
      60%  { transform: scale(1);   opacity: 0.9; }
      100% { transform: scale(1);   opacity: 0.9; }
    }
    @keyframes atlas-heartbeat-ring {
      0%   { transform: scale(1);   opacity: 0.5; }
      15%  { transform: scale(2.2); opacity: 0; }
      30%  { transform: scale(1);   opacity: 0.5; }
      45%  { transform: scale(1.8); opacity: 0; }
      60%  { transform: scale(1);   opacity: 0.3; }
      100% { transform: scale(1);   opacity: 0.3; }
    }
    @keyframes atlas-scan {
      0%   { opacity: 0.1; transform: translateY(0); }
      50%  { opacity: 0.3; transform: translateY(60px); }
      100% { opacity: 0.1; transform: translateY(0); }
    }
    @keyframes atlas-energy-flow {
      0%   { stroke-dashoffset: 20; }
      100% { stroke-dashoffset: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Component ── */
export function AtlasAvatar() {
  const { tenantId } = useActiveTenant();
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AtlasStatus>("online");
  const [activeJobs, setActiveJobs] = useState(0);
  const [pendingDecisions, setPendingDecisions] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fetchStatus = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (tenantId) headers["x-tenant-id"] = tenantId;

    try {
      const [jobsRes, decisionsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/v1/jobs/list`, { headers }).then(r => r.json()).catch(() => null),
        tenantId
          ? fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=200`, { headers }).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
        fetch(`${API_BASE}/v1/audit/list?limit=1`, { headers }).then(r => r.json()).catch(() => null),
      ]);

      const jobs = Array.isArray(jobsRes?.jobs)
        ? jobsRes.jobs.filter((j: any) => j.status === "running" || j.status === "queued").length
        : 0;
      const decisions = Array.isArray(decisionsRes?.memos) ? decisionsRes.memos.length : 0;

      const latest = auditRes?.items?.[0];
      const ts = latest?.timestamp ?? latest?.createdAt ?? null;

      setActiveJobs(jobs);
      setPendingDecisions(decisions);
      setLastActivity(ts);

      if (decisions > 0) setStatus("attention");
      else if (jobs > 0) setStatus("busy");
      else setStatus("online");
    } catch {
      // Keep current status on network error
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(fetchStatus, 15_000);
    const onVis = () => { if (document.visibilityState === "visible") void fetchStatus(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchStatus]);

  const meta = STATUS_MAP[status];

  const statusLine = pendingDecisions > 0
    ? `Attention — ${pendingDecisions} pending decision${pendingDecisions === 1 ? "" : "s"}`
    : activeJobs > 0
      ? `Processing — ${activeJobs} active job${activeJobs === 1 ? "" : "s"}`
      : "Online — monitoring systems";

  const lastActivityFormatted = lastActivity
    ? new Date(lastActivity).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "No recent activity";

  return (
    <div className="relative">
      {/* Avatar button — full wireframe robot */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-slate-900"
        style={{
          width: 44,
          height: 56,
          animation: "atlas-float 4s ease-in-out infinite",
          filter: `drop-shadow(0 0 6px rgba(6,182,212,0.4))`,
        }}
        title={`Atlas — ${meta.label}`}
        aria-label={`Atlas avatar — ${meta.label}`}
      >
        <svg
          viewBox="0 0 80 110"
          width={44}
          height={56}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none"
        >
          <defs>
            {/* Heartbeat core glow */}
            <radialGradient id="atlas-heart-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={meta.heartColor} stopOpacity="0.9" />
              <stop offset="50%" stopColor={meta.heartColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={meta.heartColor} stopOpacity="0" />
            </radialGradient>
            {/* Body wireframe gradient */}
            <linearGradient id="atlas-wire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* ═══ HEAD ═══ */}
          {/* Outer skull */}
          <ellipse cx="40" cy="16" rx="14" ry="15" stroke="#06b6d4" strokeWidth="1.2" opacity="0.85" />
          {/* Inner skull ring */}
          <ellipse cx="40" cy="16" rx="10" ry="11" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
          {/* Horizontal wireframe across face */}
          <ellipse cx="40" cy="9"  rx="11" ry="0.8" stroke="#06b6d4" strokeWidth="0.4" opacity="0.25" />
          <ellipse cx="40" cy="14" rx="13.5" ry="0.8" stroke="#06b6d4" strokeWidth="0.4" opacity="0.3" />
          <ellipse cx="40" cy="19" rx="13.5" ry="0.8" stroke="#06b6d4" strokeWidth="0.4" opacity="0.3" />
          <ellipse cx="40" cy="24" rx="10" ry="0.8" stroke="#06b6d4" strokeWidth="0.4" opacity="0.25" />
          {/* Vertical center line */}
          <path d="M40 1 Q40 16 40 31" stroke="#06b6d4" strokeWidth="0.4" opacity="0.2" />

          {/* Eyes — glowing slits */}
          <line x1="33" y1="14" x2="37" y2="14" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" opacity="0.95" />
          <line x1="43" y1="14" x2="47" y2="14" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" opacity="0.95" />
          {/* Eye glow */}
          <circle cx="35" cy="14" r="1" fill="#67e8f9" opacity="0.6" />
          <circle cx="45" cy="14" r="1" fill="#67e8f9" opacity="0.6" />

          {/* Mouth */}
          <path d="M36 21 Q40 23 44 21" stroke="#06b6d4" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />

          {/* ═══ NECK ═══ */}
          <line x1="37" y1="31" x2="37" y2="37" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="43" y1="31" x2="43" y2="37" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="40" y1="31" x2="40" y2="38" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />

          {/* ═══ TORSO ═══ */}
          {/* Outer chest plate */}
          <path d="M24 38 L56 38 L58 68 Q40 72 22 68 Z" stroke="#06b6d4" strokeWidth="1.1" opacity="0.7" fill="none" />
          {/* Inner chest plate */}
          <path d="M28 41 L52 41 L54 64 Q40 67 26 64 Z" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" fill="none" />
          {/* Horizontal rib lines */}
          <line x1="25" y1="45" x2="55" y2="45" stroke="#06b6d4" strokeWidth="0.4" opacity="0.2" />
          <line x1="24" y1="52" x2="56" y2="52" stroke="#06b6d4" strokeWidth="0.4" opacity="0.2" />
          <line x1="23" y1="59" x2="57" y2="59" stroke="#06b6d4" strokeWidth="0.4" opacity="0.2" />
          {/* Vertical torso center line */}
          <line x1="40" y1="38" x2="40" y2="70" stroke="#06b6d4" strokeWidth="0.4" opacity="0.2" />

          {/* ═══ HEARTBEAT CORE ═══ */}
          {/* Outer glow ring (animated) */}
          <circle cx="40" cy="50" r="8" fill="url(#atlas-heart-glow)"
            style={{ animation: `atlas-heartbeat-ring ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "40px 50px" }}
          />
          {/* Core diamond shape */}
          <path d="M40 44 L45 50 L40 56 L35 50 Z" stroke={meta.heartColor} strokeWidth="1" fill={meta.heartColor} fillOpacity="0.15"
            style={{ animation: `atlas-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "40px 50px" }}
          />
          {/* Inner core dot */}
          <circle cx="40" cy="50" r="2" fill={meta.heartColor} opacity="0.9"
            style={{ animation: `atlas-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "40px 50px" }}
          />
          {/* Energy lines radiating from core */}
          <line x1="40" y1="44" x2="40" y2="38" stroke={meta.heartColor} strokeWidth="0.5" opacity="0.4"
            strokeDasharray="2 2" style={{ animation: "atlas-energy-flow 1.5s linear infinite" }}
          />
          <line x1="45" y1="50" x2="52" y2="50" stroke={meta.heartColor} strokeWidth="0.5" opacity="0.3"
            strokeDasharray="2 2" style={{ animation: "atlas-energy-flow 1.5s linear infinite" }}
          />
          <line x1="35" y1="50" x2="28" y2="50" stroke={meta.heartColor} strokeWidth="0.5" opacity="0.3"
            strokeDasharray="2 2" style={{ animation: "atlas-energy-flow 1.5s linear infinite" }}
          />

          {/* ═══ SHOULDERS ═══ */}
          <path d="M24 38 Q18 39 12 43" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <path d="M56 38 Q62 39 68 43" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* ═══ ARMS ═══ */}
          {/* Left arm */}
          <line x1="12" y1="43" x2="8" y2="58" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="8" y1="58" x2="6" y2="70" stroke="#06b6d4" strokeWidth="0.8" opacity="0.45" />
          {/* Left arm wireframe joint */}
          <circle cx="12" cy="43" r="2" stroke="#06b6d4" strokeWidth="0.6" fill="none" opacity="0.4" />
          <circle cx="8" cy="58" r="1.5" stroke="#06b6d4" strokeWidth="0.5" fill="none" opacity="0.35" />
          {/* Left hand */}
          <path d="M6 70 L4 73 M6 70 L6 74 M6 70 L8 73" stroke="#06b6d4" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />

          {/* Right arm */}
          <line x1="68" y1="43" x2="72" y2="58" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="72" y1="58" x2="74" y2="70" stroke="#06b6d4" strokeWidth="0.8" opacity="0.45" />
          {/* Right arm wireframe joint */}
          <circle cx="68" cy="43" r="2" stroke="#06b6d4" strokeWidth="0.6" fill="none" opacity="0.4" />
          <circle cx="72" cy="58" r="1.5" stroke="#06b6d4" strokeWidth="0.5" fill="none" opacity="0.35" />
          {/* Right hand */}
          <path d="M74 70 L76 73 M74 70 L74 74 M74 70 L72 73" stroke="#06b6d4" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />

          {/* ═══ WAIST / HIP ═══ */}
          <path d="M26 68 Q40 72 54 68" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
          <line x1="33" y1="70" x2="33" y2="76" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
          <line x1="47" y1="70" x2="47" y2="76" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
          {/* Hip plate */}
          <path d="M30 70 L50 70 L48 77 L32 77 Z" stroke="#06b6d4" strokeWidth="0.7" opacity="0.4" fill="none" />

          {/* ═══ LEGS ═══ */}
          {/* Left leg */}
          <line x1="33" y1="77" x2="30" y2="92" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="30" y1="92" x2="28" y2="104" stroke="#06b6d4" strokeWidth="0.8" opacity="0.45" />
          {/* Left knee joint */}
          <circle cx="30" cy="92" r="1.8" stroke="#06b6d4" strokeWidth="0.5" fill="none" opacity="0.35" />
          {/* Left foot */}
          <path d="M28 104 L24 107 L32 107 Z" stroke="#06b6d4" strokeWidth="0.7" fill="none" opacity="0.4" />

          {/* Right leg */}
          <line x1="47" y1="77" x2="50" y2="92" stroke="#06b6d4" strokeWidth="0.9" opacity="0.5" />
          <line x1="50" y1="92" x2="52" y2="104" stroke="#06b6d4" strokeWidth="0.8" opacity="0.45" />
          {/* Right knee joint */}
          <circle cx="50" cy="92" r="1.8" stroke="#06b6d4" strokeWidth="0.5" fill="none" opacity="0.35" />
          {/* Right foot */}
          <path d="M52 104 L48 107 L56 107 Z" stroke="#06b6d4" strokeWidth="0.7" fill="none" opacity="0.4" />

          {/* ═══ SCAN LINE ═══ */}
          <rect x="4" y="5" width="72" height="1" rx="0.5" fill="#22d3ee" opacity="0.15"
            style={{ animation: "atlas-scan 4s ease-in-out infinite" }}
          />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 z-[60] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/10">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: meta.color,
                boxShadow: `0 0 8px ${meta.glow}`,
              }}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">Atlas — AI CEO</div>
              <div className="text-xs text-slate-400 truncate">{statusLine}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 px-4 py-3">
            <div className="rounded-xl bg-slate-900/60 border border-cyan-500/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Active Jobs</div>
              <div className={`text-lg font-bold ${activeJobs > 0 ? "text-purple-400" : "text-slate-300"}`}>
                {activeJobs}
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-cyan-500/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Decisions</div>
              <div className={`text-lg font-bold ${pendingDecisions > 0 ? "text-red-400" : "text-slate-300"}`}>
                {pendingDecisions}
              </div>
            </div>
          </div>

          {/* Last activity */}
          <div className="px-4 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Last Activity</div>
            <div className="text-xs text-slate-400">{lastActivityFormatted}</div>
          </div>

          {/* Action */}
          <div className="px-4 py-3 border-t border-cyan-500/10">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/app/chat");
              }}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Open Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
