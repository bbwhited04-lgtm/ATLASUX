import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar, Clock, Users, MapPin, Video,
  Brain, Sparkles, CheckCircle, AlertCircle,
  TrendingUp, Zap, RefreshCw, ExternalLink,
  Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getOrgUser } from '@/lib/org';

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

interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  canEdit: boolean;
  owner: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEventTime(iso: string | null, tz: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    });
  } catch {
    return iso;
  }
}

function formatEventDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Chicago",
    });
  } catch {
    return iso;
  }
}

function getDurationMinutes(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start.endsWith("Z") ? start : start + "Z");
  const e = new Date(end.endsWith("Z") ? end : end + "Z");
  return Math.round((e.getTime() - s.getTime()) / 60_000);
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso.endsWith("Z") ? iso : iso + "Z") > new Date();
}

function getShowAsColor(showAs: string): string {
  switch (showAs) {
    case "busy": return "bg-blue-500";
    case "tentative": return "bg-yellow-500";
    case "oof": return "bg-purple-500";
    case "free": return "bg-green-500";
    case "workingElsewhere": return "bg-cyan-500";
    default: return "bg-slate-500";
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarScheduling() {
  const BACKEND_URL = API_BASE;
  const { org_id } = useMemo(() => getOrgUser(), []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Date range navigation
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rangeEnd, setRangeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 59, 999);
    return d;
  });

  // ── Fetch status ──────────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const r = await fetch(`${BACKEND_URL}/v1/calendar/status`, {
        credentials: "include",
        headers: { "x-tenant-id": org_id },
      });
      const data = (await r.json()) as { ok: boolean; connected: boolean; email?: string };
      setConnected(data.connected ?? false);
      if (data.email) setConnectedEmail(data.email);
    } catch {
      setConnected(false);
    } finally {
      setLoadingStatus(false);
    }
  }, [BACKEND_URL, org_id]);

  // ── Fetch calendars ───────────────────────────────────────────────────────
  const fetchCalendars = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/v1/calendar/calendars`, {
        credentials: "include",
        headers: { "x-tenant-id": org_id },
      });
      const data = (await r.json()) as { ok: boolean; calendars: CalendarInfo[] };
      if (data.ok) setCalendars(data.calendars);
    } catch (err) {
      console.error("Calendars fetch failed:", err);
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
      const data = (await r.json()) as { ok: boolean; events: CalendarEvent[] };
      if (data.ok) setEvents(data.events);
    } catch (err) {
      console.error("Calendar events fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, org_id, rangeStart, rangeEnd]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    if (connected) {
      fetchCalendars();
      fetchEvents();
    }
  }, [connected, fetchCalendars, fetchEvents]);

  // ── Navigate week ─────────────────────────────────────────────────────────
  function navigateWeek(delta: number) {
    setRangeStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7 * delta);
      return d;
    });
    setRangeEnd((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7 * delta);
      return d;
    });
  }

  function goToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    setRangeStart(start);
    setRangeEnd(end);
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayEvents = useMemo(() => events.filter((e) => isToday(e.start)), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => isFuture(e.start) && !e.isCancelled), [events]);
  const meetingsWithAttendees = useMemo(() => events.filter((e) => e.attendees.length > 1), [events]);
  const onlineMeetings = useMemo(() => events.filter((e) => !!e.meetingUrl), [events]);

  const totalMeetingMinutes = useMemo(
    () => events.reduce((sum, e) => sum + getDurationMinutes(e.start, e.end), 0),
    [events],
  );

  // ── Group events by date ──────────────────────────────────────────────────
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const key = formatEventDate(e.start);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return groups;
  }, [events]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Advanced Calendar & Scheduling</h2>
          {connected && (
            <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full">
              {connectedEmail}
            </span>
          )}
        </div>
        <p className="text-slate-400">
          AI-powered scheduling and calendar management via Microsoft 365
        </p>
      </div>

      {/* Connection Status */}
      {loadingStatus ? (
        <div className="flex items-center gap-3 mb-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking M365 calendar connection...
        </div>
      ) : !connected ? (
        <div className="mb-8 bg-slate-900/50 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Calendar Not Connected</h3>
              <p className="text-sm text-slate-400 mb-3">
                M365 connection requires Calendars.Read application permission granted in Azure AD.
                Check Azure Portal &rarr; App registrations &rarr; API permissions.
              </p>
              <button
                onClick={checkStatus}
                className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Calendar className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{todayEvents.length}</div>
          <div className="text-sm text-slate-400">Today's Events</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{Math.round(totalMeetingMinutes / 60)}h</div>
          <div className="text-sm text-slate-400">Time Booked (this range)</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Users className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{meetingsWithAttendees.length}</div>
          <div className="text-sm text-slate-400">Multi-Person Meetings</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Video className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{onlineMeetings.length}</div>
          <div className="text-sm text-slate-400">Online Meetings</div>
        </div>
      </div>

      {/* Calendars */}
      {calendars.length > 0 && (
        <div className="mb-8 bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Your Calendars</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-white">{cal.name}</span>
                {cal.isDefault && (
                  <span className="text-xs text-slate-500">(default)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Calendar View */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <span className="text-sm text-slate-300 ml-2">
              {rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" - "}
              {rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{events.length} events</span>
            <button
              onClick={fetchEvents}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="grid lg:grid-cols-12 min-h-[500px]">
          {/* Event List Panel */}
          <div className="lg:col-span-7 border-r border-slate-700/50 overflow-y-auto max-h-[600px]">
            {loading && events.length === 0 && (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading calendar events...
              </div>
            )}

            {!loading && events.length === 0 && connected && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Calendar className="w-12 h-12 mb-3 text-slate-600" />
                <div className="text-sm">No events in this date range</div>
              </div>
            )}

            {!loading && events.length === 0 && !connected && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Calendar className="w-12 h-12 mb-3 text-slate-600" />
                <div className="text-sm">Connect M365 to see calendar events</div>
              </div>
            )}

            {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 sticky top-0 z-10">
                  <span className="text-xs font-semibold text-slate-400 uppercase">{dateLabel}</span>
                  <span className="text-xs text-slate-600 ml-2">({dayEvents.length} events)</span>
                </div>

                {dayEvents.map((event) => {
                  const duration = getDurationMinutes(event.start, event.end);
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-4 border-b border-slate-700/30 cursor-pointer transition ${
                        selectedEvent?.id === event.id
                          ? "bg-cyan-500/10 border-l-4 border-l-cyan-500"
                          : "hover:bg-slate-800/30"
                      } ${event.isCancelled ? "opacity-50 line-through" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-12 rounded-full flex-shrink-0 mt-1 ${getShowAsColor(event.showAs)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white truncate">{event.subject}</span>
                            {event.importance === "high" && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">!</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {event.isAllDay ? (
                              <span className="text-cyan-400">All day</span>
                            ) : (
                              <span>
                                {formatEventTime(event.start, event.startTz)} - {formatEventTime(event.end, event.endTz)}
                                <span className="text-slate-600 ml-1">({duration}m)</span>
                              </span>
                            )}

                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          {event.attendees.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                              <Users className="w-3 h-3" />
                              <span>{event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}</span>
                              {event.meetingUrl && (
                                <span className="flex items-center gap-1 ml-2 text-blue-400">
                                  <Video className="w-3 h-3" /> Online
                                </span>
                              )}
                            </div>
                          )}

                          {event.categories.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {event.categories.map((cat) => (
                                <span key={cat} className="text-xs px-1.5 py-0.5 bg-slate-800 border border-slate-700/50 rounded text-slate-400">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Event Detail Panel */}
          <div className="lg:col-span-5 p-6">
            {selectedEvent ? (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">{selectedEvent.subject}</h3>

                <div className="space-y-4">
                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">
                        {selectedEvent.isAllDay ? (
                          <>All day &middot; {formatEventDate(selectedEvent.start)}</>
                        ) : (
                          <>
                            {formatEventDate(selectedEvent.start)}
                            <br />
                            {formatEventTime(selectedEvent.start, selectedEvent.startTz)} - {formatEventTime(selectedEvent.end, selectedEvent.endTz)}
                            <span className="text-slate-500 ml-2">
                              ({getDurationMinutes(selectedEvent.start, selectedEvent.end)} min)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div className="text-sm text-white">{selectedEvent.location}</div>
                    </div>
                  )}

                  {/* Meeting Link */}
                  {selectedEvent.meetingUrl && (
                    <div className="flex items-start gap-3">
                      <Video className="w-5 h-5 text-blue-400 mt-0.5" />
                      <a
                        href={selectedEvent.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Join Online Meeting <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Organizer */}
                  {selectedEvent.organizer && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-white">{selectedEvent.organizer}</div>
                        {selectedEvent.organizerEmail && (
                          <div className="text-xs text-slate-500">{selectedEvent.organizerEmail}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getShowAsColor(selectedEvent.showAs)}`} />
                    <span className="text-sm text-slate-400 capitalize">{selectedEvent.showAs}</span>
                    {selectedEvent.isRecurring && (
                      <span className="text-xs bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded text-slate-400">
                        Recurring
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  {selectedEvent.preview && (
                    <div className="mt-4 p-3 bg-slate-950/50 border border-slate-700/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Description</div>
                      <div className="text-sm text-slate-300">{selectedEvent.preview}</div>
                    </div>
                  )}

                  {/* Attendees */}
                  {selectedEvent.attendees.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Attendees ({selectedEvent.attendees.length})
                      </div>
                      <div className="space-y-2">
                        {selectedEvent.attendees.map((a, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-slate-950/30 rounded-lg">
                            <div>
                              <div className="text-sm text-white">{a.name || a.email}</div>
                              {a.name && a.email && (
                                <div className="text-xs text-slate-500">{a.email}</div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              a.status === "accepted" ? "bg-green-500/20 text-green-400" :
                              a.status === "declined" ? "bg-red-500/20 text-red-400" :
                              a.status === "tentativelyAccepted" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-slate-700/50 text-slate-400"
                            }`}>
                              {a.status === "tentativelyAccepted" ? "tentative" : a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open in Outlook */}
                  {selectedEvent.webLink && (
                    <div className="mt-4">
                      <a
                        href={selectedEvent.webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Outlook
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Calendar className="w-16 h-16 text-slate-700 mb-4" />
                <div className="text-slate-500">Select an event to view details</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {events.length > 0 && (
        <div className="mt-8 bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Calendar Insights</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-lg">
              <div className="text-sm font-semibold text-white mb-1">Meeting Density</div>
              <div className="text-xs text-slate-400">
                {events.length} events over {Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000)} days
                = {(events.length / Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000))).toFixed(1)} events/day average
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-lg">
              <div className="text-sm font-semibold text-white mb-1">Online vs In-Person</div>
              <div className="text-xs text-slate-400">
                {onlineMeetings.length} online, {events.length - onlineMeetings.length} in-person/unspecified
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-lg">
              <div className="text-sm font-semibold text-white mb-1">Time Commitment</div>
              <div className="text-xs text-slate-400">
                {Math.round(totalMeetingMinutes / 60)} hours booked
                ({Math.round(totalMeetingMinutes / events.length || 0)} min avg per event)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
