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
        className="relative flex items-center justify-center cursor-pointer transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full"
        style={{
          width: 48,
          height: 48,
          animation: "atlas-float 4s ease-in-out infinite",
          filter: `drop-shadow(0 0 8px ${meta.heartGlow})`,
        }}
        title={`Atlas — ${meta.label}`}
        aria-label={`Atlas avatar — ${meta.label}`}
      >
        {/* Outer ring */}
        <svg
          viewBox="0 0 100 100"
          width={48}
          height={48}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none absolute inset-0"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" opacity="0.9" />
          <circle cx="50" cy="50" r="46" stroke={meta.heartColor} strokeWidth="1.5" opacity="0.3"
            style={{ animation: `atlas-heartbeat-ring ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "50px 50px" }}
          />

          {/* Head */}
          <ellipse cx="50" cy="32" rx="16" ry="17" stroke="#06b6d4" strokeWidth="2" opacity="0.85" />
          <ellipse cx="50" cy="32" rx="11" ry="12" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />

          {/* Eyes — bright glowing slits */}
          <line x1="42" y1="30" x2="47" y2="30" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" opacity="1" />
          <line x1="53" y1="30" x2="58" y2="30" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" opacity="1" />
          {/* Eye glow dots */}
          <circle cx="44.5" cy="30" r="1.5" fill="#67e8f9" opacity="0.7" />
          <circle cx="55.5" cy="30" r="1.5" fill="#67e8f9" opacity="0.7" />

          {/* Mouth */}
          <path d="M45 38 Q50 41 55 38" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

          {/* Neck */}
          <line x1="46" y1="49" x2="46" y2="55" stroke="#06b6d4" strokeWidth="1.2" opacity="0.5" />
          <line x1="54" y1="49" x2="54" y2="55" stroke="#06b6d4" strokeWidth="1.2" opacity="0.5" />

          {/* Chest plate */}
          <path d="M30 56 L70 56 L72 82 Q50 87 28 82 Z" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" fill="none" />

          {/* Shoulders */}
          <path d="M30 56 Q22 57 16 62" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M70 56 Q78 57 84 62" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

          {/* Heartbeat core — the main visual */}
          <circle cx="50" cy="70" r="9" fill="url(#atlas-heart-glow)"
            style={{ animation: `atlas-heartbeat-ring ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "50px 70px" }}
          />
          <path d="M50 63 L56 70 L50 77 L44 70 Z" stroke={meta.heartColor} strokeWidth="1.5" fill={meta.heartColor} fillOpacity="0.2"
            style={{ animation: `atlas-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "50px 70px" }}
          />
          <circle cx="50" cy="70" r="3" fill={meta.heartColor} opacity="0.95"
            style={{ animation: `atlas-heartbeat ${meta.pulseSpeed} ease-in-out infinite`, transformOrigin: "50px 70px" }}
          />

          {/* Status indicator dot */}
          <circle cx="80" cy="16" r="6" fill={meta.color} opacity="0.95" />
          <circle cx="80" cy="16" r="6" fill="none" stroke="#0f172a" strokeWidth="2" />

          <defs>
            <radialGradient id="atlas-heart-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={meta.heartColor} stopOpacity="0.9" />
              <stop offset="50%" stopColor={meta.heartColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={meta.heartColor} stopOpacity="0" />
            </radialGradient>
          </defs>
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
