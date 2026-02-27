import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";

/* ── Status types ── */
type AtlasStatus = "online" | "busy" | "attention";

interface StatusMeta {
  color: string;       // Tailwind ring/dot color
  glow: string;        // CSS drop-shadow color
  label: string;
  pulseSpeed: string;  // animation duration
}

const STATUS_MAP: Record<AtlasStatus, StatusMeta> = {
  online:    { color: "#22c55e", glow: "rgba(34,197,94,0.6)",   label: "Online",                pulseSpeed: "2s"   },
  busy:      { color: "#a855f7", glow: "rgba(168,85,247,0.6)",  label: "Processing",            pulseSpeed: "1s"   },
  attention: { color: "#ef4444", glow: "rgba(239,68,68,0.7)",   label: "Action needed",         pulseSpeed: "0.6s" },
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
    @keyframes atlas-pulse-ring {
      0%   { transform: scale(1);   opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes atlas-scan {
      0%   { opacity: 0.15; transform: translateY(0); }
      50%  { opacity: 0.35; transform: translateY(14px); }
      100% { opacity: 0.15; transform: translateY(0); }
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

  // Inject keyframes on mount
  useEffect(() => { ensureKeyframes(); }, []);

  // Close popover on outside click
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

  // Poll status
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
      {/* Avatar button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-slate-900"
        style={{
          animation: "atlas-float 4s ease-in-out infinite",
          filter: `drop-shadow(0 0 8px rgba(6,182,212,0.5))`,
        }}
        title={`Atlas — ${meta.label}`}
        aria-label={`Atlas avatar — ${meta.label}`}
      >
        {/* SVG wireframe head */}
        <svg
          viewBox="0 0 56 56"
          width={48}
          height={48}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="select-none"
        >
          {/* Outer head shape */}
          <ellipse cx="28" cy="22" rx="16" ry="18" stroke="#06b6d4" strokeWidth="1.2" opacity="0.9" />

          {/* Inner structure ring */}
          <ellipse cx="28" cy="22" rx="12" ry="14" stroke="#06b6d4" strokeWidth="0.6" opacity="0.4" />

          {/* Horizontal wireframe lines across face */}
          <ellipse cx="28" cy="12" rx="13" ry="1" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
          <ellipse cx="28" cy="17" rx="15.2" ry="1" stroke="#06b6d4" strokeWidth="0.5" opacity="0.35" />
          <ellipse cx="28" cy="22" rx="16" ry="1" stroke="#06b6d4" strokeWidth="0.5" opacity="0.4" />
          <ellipse cx="28" cy="27" rx="15.2" ry="1" stroke="#06b6d4" strokeWidth="0.5" opacity="0.35" />
          <ellipse cx="28" cy="32" rx="12" ry="1" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />

          {/* Vertical wireframe lines */}
          <path d="M28 4 Q28 22 28 40" stroke="#06b6d4" strokeWidth="0.5" opacity="0.35" />
          <path d="M21 6 Q19 22 21 38" stroke="#06b6d4" strokeWidth="0.5" opacity="0.25" />
          <path d="M35 6 Q37 22 35 38" stroke="#06b6d4" strokeWidth="0.5" opacity="0.25" />

          {/* Eyes — horizontal slits */}
          <line x1="21" y1="20" x2="25" y2="20" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
          <line x1="31" y1="20" x2="35" y2="20" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />

          {/* Eye glow dots */}
          <circle cx="23" cy="20" r="0.8" fill="#22d3ee" opacity="0.7" />
          <circle cx="33" cy="20" r="0.8" fill="#22d3ee" opacity="0.7" />

          {/* Mouth/chin line */}
          <path d="M24 28 Q28 30 32 28" stroke="#06b6d4" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />

          {/* Neck */}
          <line x1="25" y1="39" x2="25" y2="46" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
          <line x1="31" y1="39" x2="31" y2="46" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
          <line x1="28" y1="40" x2="28" y2="48" stroke="#06b6d4" strokeWidth="0.6" opacity="0.3" />

          {/* Shoulders */}
          <path d="M25 46 Q20 47 14 50" stroke="#06b6d4" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
          <path d="M31 46 Q36 47 42 50" stroke="#06b6d4" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />

          {/* Shoulder mesh */}
          <path d="M18 48 Q28 45 38 48" stroke="#06b6d4" strokeWidth="0.4" opacity="0.25" />

          {/* Scan line (animated) */}
          <rect x="13" y="10" width="30" height="1" rx="0.5" fill="#22d3ee" opacity="0.2"
            style={{ animation: "atlas-scan 3s ease-in-out infinite" }}
          />
        </svg>

        {/* Heartbeat indicator */}
        <span
          className="absolute bottom-0 right-0 flex items-center justify-center"
          style={{ width: 14, height: 14 }}
        >
          {/* Pulsing ring */}
          <span
            className="absolute rounded-full"
            style={{
              width: 14,
              height: 14,
              backgroundColor: meta.color,
              opacity: 0.4,
              animation: `atlas-pulse-ring ${meta.pulseSpeed} ease-in-out infinite`,
            }}
          />
          {/* Solid dot */}
          <span
            className="relative rounded-full border-2 border-slate-900"
            style={{
              width: 10,
              height: 10,
              backgroundColor: meta.color,
              boxShadow: `0 0 6px ${meta.glow}`,
            }}
          />
        </span>
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
