import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock, Users, MapPin, Video,
  AlertCircle, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Star,
  ExternalLink, X, Plus, Link2,
  GripVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import { getOrgUser } from '@/lib/org';
import { AddChannelModal } from '../AddChannelModal';

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  subject: string;
  start: string | null;
  startTz: string;
  end: string | null;
  endTz: string;
  location: string | null;
  isAllDay: boolean;
  isCancelled: boolean;
  showAs: string;
  importance: string;
  preview: string;
  organizer: string | null;
  organizerEmail: string | null;
  attendees: Array<{ name: string | null; email: string | null; status: string; type: string }>;
  meetingUrl: string | null;
  webLink: string | null;
  categories: string[];
  isRecurring: boolean;
}

type Channel = {
  id: string;
  name: string;
  platform: string;
  identifier: string | null;
  picture: string | null;
  followers?: number;
};

type PostizPost = {
  id: string;
  content: string;
  publishDate: string | null;
  image: string[];
  platform: string;
  channelName: string;
  channelPicture: string | null;
  state: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getWeekDays(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function getEventHour(iso: string): number {
  return new Date(iso.endsWith("Z") ? iso : iso + "Z").getHours();
}

function getEventDate(iso: string): Date {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDurationMinutes(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start.endsWith("Z") ? start : start + "Z");
  const e = new Date(end.endsWith("Z") ? end : end + "Z");
  return Math.round((e.getTime() - s.getTime()) / 60_000);
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM – 10 PM

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

function fmtDateRange(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// ── Platform colors & icons ─────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#00f2ea", instagram: "#e1306c", youtube: "#ff0000",
  x: "#1da1f2", linkedin: "#0a66c2", facebook: "#1877f2",
  threads: "#ffffff", reddit: "#ff4500", pinterest: "#e60023",
  tumblr: "#36465d", discord: "#5865f2", telegram: "#0088cc",
  mastodon: "#6364ff",
};

function PlatformMiniIcon({ platform }: { platform: string }) {
  const s = 10;
  const c = { width: s, height: s, viewBox: "0 0 24 24", fill: "white" } as const;
  switch (platform) {
    case "facebook":
      return <svg {...c}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
    case "instagram":
      return (
        <svg {...c} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
        </svg>
      );
    case "youtube":
      return <svg {...c}><path d="M23 7s-.3-2-1.2-2.8C20.7 3.2 19.5 3 12 3S3.3 3.2 2.2 4.2C1.3 5 1 7 1 7s-.3 2-.3 4v2c0 2 .3 4 .3 4s.3 2 1.2 2.8c1.1 1 2.3 1.2 9.8 1.2s8.7-.2 9.8-1.2c.9-.8 1.2-2.8 1.2-2.8s.3-2 .3-4v-2c0-2-.3-4-.3-4zM9.5 16V8l6.5 4-6.5 4z" /></svg>;
    case "x":
      return <svg {...c}><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z" /></svg>;
    case "linkedin":
      return <svg {...c}><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" /></svg>;
    case "tiktok":
      return <svg {...c}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.4a6.34 6.34 0 0010.82 4.48c1.7-1.7 2.65-4 2.65-6.4V8.78a8.18 8.18 0 004.77 1.53V6.86a4.83 4.83 0 01-1.8-.17z" /></svg>;
    case "threads":
      return <svg {...c}><path d="M16.79 11.48c-.08-.04-.15-.07-.23-.1a7.3 7.3 0 00-2.2-4.1c-1.15-1.06-2.62-1.6-4.22-1.53-2.27.1-3.95 1.18-4.87 3.13l2.5 1.32c.54-1.14 1.48-1.7 2.8-1.67.92.02 1.65.32 2.17.88.38.4.63.94.75 1.6a10.38 10.38 0 00-2.94-.14c-2.93.29-4.82 1.98-4.66 4.17.08 1.1.62 2.05 1.52 2.68.77.54 1.76.8 2.79.74 1.36-.08 2.43-.56 3.18-1.42.57-.65.93-1.48 1.1-2.52.66.4 1.15.93 1.4 1.59.44 1.14.46 3.01-1.1 4.57-1.36 1.37-3 1.96-5.48 1.98-2.76-.03-4.86-.9-6.22-2.6-1.27-1.57-1.93-3.83-1.97-6.7.04-2.87.7-5.13 1.97-6.7C4.44 4.9 6.54 4.03 9.3 4c2.79.03 4.92.92 6.32 2.63a9.84 9.84 0 011.75 3.7l2.6-.69a12.3 12.3 0 00-2.27-4.78C15.84 2.6 13.05 1.45 9.32 1.42c-3.57.03-6.32 1.3-8.15 3.76C-.56 7.5-1.33 10.35-.08 13.6c.06 2.87.82 5.13 2.26 6.71 1.84 2.46 4.59 3.73 8.16 3.76 2.89-.02 5.04-.8 6.8-2.57 2.44-2.44 2.35-5.48 1.6-7.47a5.89 5.89 0 00-2.95-2.55zm-5.07 5.27c-1.14.07-2.33-.45-2.4-1.45-.05-.73.52-1.55 2.2-1.72.38-.04.76-.05 1.12-.03.3.01.6.04.88.08-.2 2.3-1.15 3.07-1.8 3.12z" /></svg>;
    default:
      return <span className="text-[7px] font-bold text-white leading-none">{platform.charAt(0).toUpperCase()}</span>;
  }
}

function ChannelAvatar({ channel }: { channel: Channel }) {
  const bg = PLATFORM_COLORS[channel.platform] ?? "#64748b";
  return (
    <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
      {channel.picture ? (
        <img src={channel.picture} alt={channel.name} className="w-full h-full rounded-lg object-cover" />
      ) : (
        <div className="w-full h-full rounded-lg bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300">
          {channel.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div
        className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-slate-950"
        style={{ backgroundColor: bg }}
      >
        <PlatformMiniIcon platform={channel.platform} />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function CalendarScheduling() {
  const BACKEND_URL = API_BASE;
  const navigate = useNavigate();
  const { org_id } = useMemo(() => getOrgUser(), []);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [posts, setPosts] = useState<PostizPost[]>([]);

  // Week navigation
  const [baseDate, setBaseDate] = useState(() => new Date());
  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const rangeStart = weekDays[0];
  const rangeEnd = useMemo(() => {
    const d = new Date(weekDays[6]);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekDays]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── Fetch M365 status ─────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const r = await fetch(`${BACKEND_URL}/v1/calendar/status`, {
        credentials: "include",
        headers: { "x-tenant-id": org_id },
      });
      const data = await r.json();
      setConnected(data.connected ?? false);
      if (data.email) setConnectedEmail(data.email);
    } catch {
      setConnected(false);
    } finally {
      setLoadingStatus(false);
    }
  }, [BACKEND_URL, org_id]);

  // ── Fetch events ──────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
        top: "100",
      });
      const r = await fetch(`${BACKEND_URL}/v1/calendar/events?${params}`, {
        credentials: "include",
        headers: { "x-tenant-id": org_id },
      });
      const data = await r.json();
      if (data.ok) setEvents(data.events);
    } catch (err) {
      console.error("Calendar events fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, org_id, rangeStart, rangeEnd]);

  // ── Fetch Postiz channels ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/v1/postiz/channels`, { headers: { "x-tenant-id": org_id } })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.channels)) setChannels(d.channels);
      })
      .catch(() => {});
  }, [org_id]);

  // ── Fetch Postiz posts ───────────────────────────────────────────────────
  useEffect(() => {
    const start = new Date(rangeStart);
    start.setDate(start.getDate() - 1);
    const end = new Date(rangeEnd);
    end.setDate(end.getDate() + 1);
    fetch(
      `${API_BASE}/v1/postiz/posts?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
      { headers: { "x-tenant-id": org_id } },
    )
      .then((r) => r.json())
      .then((d) => { if (d.ok && Array.isArray(d.posts)) setPosts(d.posts); })
      .catch(() => {});
  }, [org_id, rangeStart, rangeEnd]);

  useEffect(() => { checkStatus(); }, [checkStatus]);
  useEffect(() => { if (connected) fetchEvents(); }, [connected, fetchEvents]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigateWeek(delta: number) {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7 * delta);
      return d;
    });
  }
  function goToday() { setBaseDate(new Date()); }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayEvents = useMemo(
    () => events.filter((e) => e.start && isSameDay(getEventDate(e.start), today)),
    [events, today],
  );
  const totalMinutes = useMemo(
    () => events.reduce((s, e) => s + getDurationMinutes(e.start, e.end), 0),
    [events],
  );
  const onlineMeetings = useMemo(
    () => events.filter((e) => !!e.meetingUrl),
    [events],
  );

  // ── Grid helpers ──────────────────────────────────────────────────────────
  function getEventsForCell(day: Date, hour: number): CalendarEvent[] {
    return events.filter((e) => {
      if (!e.start || e.isAllDay) return false;
      return isSameDay(getEventDate(e.start), day) && getEventHour(e.start) === hour;
    });
  }

  function getAllDayEvents(day: Date): CalendarEvent[] {
    return events.filter((e) => e.start && e.isAllDay && isSameDay(getEventDate(e.start), day));
  }

  function getPostsForCell(day: Date, hour: number): PostizPost[] {
    return posts.filter((p) => {
      if (!p.publishDate) return false;
      const d = new Date(p.publishDate);
      return isSameDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()), day) && d.getHours() === hour;
    });
  }

  function getPostsForDay(day: Date): PostizPost[] {
    return posts.filter((p) => {
      if (!p.publishDate) return false;
      const d = new Date(p.publishDate);
      return isSameDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()), day);
    });
  }

  const hasAllDay = events.some((e) => e.isAllDay);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="w-60 flex-shrink-0 border-r border-slate-700/50 bg-slate-950/30 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-slate-300">Channels</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddChannelOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 font-medium transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Add Channel
              </button>
              <button
                onClick={() => navigate("/app/settings?tab=integrations")}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => navigate("/app/business-manager?tab=blog")}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {channels.length === 0 && (
              <div className="px-3 py-8 text-xs text-slate-600 text-center">
                Loading channels...
              </div>
            )}
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="px-3 py-2.5 flex items-center gap-3 text-sm text-slate-400 hover:bg-slate-800/60 rounded-lg transition-all group cursor-default"
              >
                <ChannelAvatar channel={ch} />
                <span className="truncate flex-1 font-medium">{ch.name}</span>
                <GripVertical className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />
              </div>
            ))}
          </div>

          {/* Connection status + compact stats */}
          <div className="border-t border-slate-700/50 p-4 space-y-2">
            {connected ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 truncate">{connectedEmail}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Today</span>
                  <span className="text-white font-semibold">{todayEvents.length} events</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Booked</span>
                  <span className="text-white font-semibold">{Math.round(totalMinutes / 60)}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Online</span>
                  <span className="text-white font-semibold">{onlineMeetings.length}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-[10px] text-yellow-400">M365 Not Connected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Connection banner */}
        {!loadingStatus && !connected && (
          <div className="mx-4 mt-4 bg-slate-900/50 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white font-medium">Calendar Not Connected</span>
              <span className="text-xs text-slate-400 ml-2">
                M365 connection requires Calendars.Read application permission granted in Azure AD.
                Check Azure Portal &rarr; App registrations &rarr; API permissions.
              </span>
            </div>
            <button
              onClick={checkStatus}
              className="flex-shrink-0 text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 border border-cyan-500/30 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white mr-2"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            )}
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-sm text-slate-200 font-medium min-w-[210px] text-center">
              {fmtDateRange(weekDays[0])} - {fmtDateRange(weekDays[6])}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={goToday}
              className="ml-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            {connected && (
              <>
                <span className="text-xs text-slate-500">{events.length} events</span>
                <button
                  onClick={fetchEvents}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
                </button>
              </>
            )}
            <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
              {(["Day", "Week", "Month"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode.toLowerCase() as any)}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${
                    viewMode === mode.toLowerCase()
                      ? "bg-slate-700 text-white font-medium"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && events.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="ml-2 text-sm text-slate-400">Loading events...</span>
          </div>
        )}

        {loadingStatus && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="ml-2 text-sm text-slate-400">Checking calendar connection...</span>
          </div>
        )}

        {/* ── Week Grid ────────────────────────────────────────────── */}
        {!loadingStatus && (!loading || events.length > 0) && (
          <div className="flex-1 overflow-auto">
            {/* Day column headers */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] sticky top-0 z-10 bg-slate-950 border-b border-slate-700/50">
              <div className="border-r border-slate-800/30" />
              {weekDays.map((day, i) => {
                const isToday_ = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    className={`text-center py-3 border-r border-slate-800/30 ${isToday_ ? "bg-purple-500/[0.06]" : ""}`}
                  >
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                      {DAY_NAMES[i]}
                    </div>
                    <div className={`text-sm font-semibold mt-0.5 ${isToday_ ? "text-purple-400" : "text-slate-300"}`}>
                      {isToday_ && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mr-1 align-middle" />
                      )}
                      {fmtDateRange(day)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All-day events row */}
            {hasAllDay && (
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-700/50">
                <div className="text-[10px] text-slate-600 text-right pr-2 pt-2 border-r border-slate-800/30 uppercase">
                  All day
                </div>
                {weekDays.map((day, i) => {
                  const dayAllDay = getAllDayEvents(day);
                  return (
                    <div
                      key={i}
                      className={`border-r border-slate-800/30 p-1 min-h-[40px] ${
                        isSameDay(day, today) ? "bg-purple-500/[0.03]" : ""
                      }`}
                    >
                      {dayAllDay.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="mb-0.5 px-2 py-1 rounded bg-purple-600/20 border border-purple-500/30 cursor-pointer hover:bg-purple-600/30 transition text-[11px] text-white font-medium truncate"
                        >
                          {evt.subject}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hourly time grid */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[56px_repeat(7,1fr)] min-h-[72px] border-b border-slate-800/40"
              >
                <div className="text-[11px] text-slate-600 text-right pr-3 pt-1 border-r border-slate-800/30">
                  {formatHour(hour)}
                </div>
                {weekDays.map((day, di) => {
                  const cellEvents = getEventsForCell(day, hour);
                  const cellPosts = getPostsForCell(day, hour);
                  const isToday_ = isSameDay(day, today);
                  const MAX_SHOW = 3;
                  const totalItems = cellEvents.length + cellPosts.length;
                  const visibleEvents = cellEvents.slice(0, MAX_SHOW);
                  const visiblePosts = cellPosts.slice(0, Math.max(0, MAX_SHOW - visibleEvents.length));
                  const overflow = totalItems - visibleEvents.length - visiblePosts.length;
                  return (
                    <div
                      key={di}
                      className={`border-r border-slate-800/30 p-0.5 ${
                        isToday_ ? "bg-purple-500/[0.03]" : ""
                      }`}
                    >
                      {/* Calendar events */}
                      {visibleEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`mb-0.5 rounded-md overflow-hidden cursor-pointer transition ${
                            evt.isCancelled
                              ? "bg-slate-800/30 opacity-50"
                              : "bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30"
                          }`}
                        >
                          <div className="h-1 bg-purple-500 rounded-t-md" />
                          <div className="px-2 py-1.5">
                            <div className="text-[11px] text-white font-medium truncate">
                              {evt.subject}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {formatTime(evt.start)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Postiz social posts */}
                      {visiblePosts.map((post) => {
                        const color = PLATFORM_COLORS[post.platform] ?? "#64748b";
                        const thumb = post.image?.[0];
                        return (
                          <div
                            key={post.id}
                            className="mb-0.5 rounded-md overflow-hidden border border-slate-700/50 hover:border-slate-600 transition cursor-pointer group"
                            style={{ borderTopColor: color, borderTopWidth: 2 }}
                          >
                            {thumb ? (
                              <div className="relative">
                                <img
                                  src={thumb}
                                  alt=""
                                  className="w-full h-12 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-0.5 left-1.5 right-1 flex items-center gap-1">
                                  <div
                                    className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  >
                                    <PlatformMiniIcon platform={post.platform} />
                                  </div>
                                  <span className="text-[9px] text-white/90 truncate font-medium">
                                    {post.channelName}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="px-1.5 py-1.5 bg-slate-800/40">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <div
                                    className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  >
                                    <PlatformMiniIcon platform={post.platform} />
                                  </div>
                                  <span className="text-[9px] text-slate-400 truncate">
                                    {post.channelName}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 truncate leading-tight">
                                  {post.content.slice(0, 60)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {overflow > 0 && (
                        <div className="text-[10px] text-purple-400 text-center py-0.5 cursor-pointer hover:text-purple-300">
                          + {overflow} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Event Detail Panel ─────────────────────────────────────── */}
      {selectedEvent && (
        <div className="w-80 flex-shrink-0 border-l border-slate-700/50 bg-slate-950/50 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-white">{selectedEvent.subject}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-500 hover:text-slate-300 flex-shrink-0 mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  {selectedEvent.isAllDay ? (
                    "All day"
                  ) : (
                    <>
                      {formatTime(selectedEvent.start)} – {formatTime(selectedEvent.end)}
                      <span className="text-slate-600 ml-1">
                        ({getDurationMinutes(selectedEvent.start, selectedEvent.end)}m)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300">{selectedEvent.location}</div>
                </div>
              )}

              {/* Meeting link */}
              {selectedEvent.meetingUrl && (
                <div className="flex items-start gap-3">
                  <Video className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <a
                    href={selectedEvent.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Join Meeting <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Organizer */}
              {selectedEvent.organizer && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-slate-300">{selectedEvent.organizer}</div>
                    {selectedEvent.organizerEmail && (
                      <div className="text-[10px] text-slate-600">{selectedEvent.organizerEmail}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 capitalize">
                  {selectedEvent.showAs}
                </span>
                {selectedEvent.importance === "high" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                    High priority
                  </span>
                )}
                {selectedEvent.isRecurring && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    Recurring
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedEvent.preview && (
                <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
                    Description
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {selectedEvent.preview}
                  </div>
                </div>
              )}

              {/* Attendees */}
              {selectedEvent.attendees.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                    Attendees ({selectedEvent.attendees.length})
                  </div>
                  <div className="space-y-1.5">
                    {selectedEvent.attendees.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-3 bg-slate-900/30 rounded-lg"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-slate-300 truncate">
                            {a.name || a.email}
                          </div>
                          {a.name && a.email && (
                            <div className="text-[10px] text-slate-600 truncate">{a.email}</div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                            a.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : a.status === "declined"
                                ? "bg-red-500/20 text-red-400"
                                : a.status === "tentativelyAccepted"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-slate-700/50 text-slate-400"
                          }`}
                        >
                          {a.status === "tentativelyAccepted" ? "tentative" : a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open in Outlook */}
              {selectedEvent.webLink && (
                <a
                  href={selectedEvent.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Outlook
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <AddChannelModal open={addChannelOpen} onClose={() => setAddChannelOpen(false)} />
    </div>
  );
}
