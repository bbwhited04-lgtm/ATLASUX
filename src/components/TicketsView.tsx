import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, Plus, MessageSquare } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type Ticket = {
  id: string;
  title: string;
  status: string;
  severity: string;
  category?: string;
  agentId?: string;
  agentName?: string;
  createdAt: string;
  body?: string;
};

type Comment = {
  id: string;
  authorId?: string;
  authorName?: string;
  body: string;
  createdAt: string;
  isInternal?: boolean;
};

type TicketStatus = "OPEN" | "TRIAGED" | "IN_PROGRESS" | "CLOSED";

const STATUS_FILTERS: TicketStatus[] = ["OPEN", "TRIAGED", "IN_PROGRESS", "CLOSED"];

function severityConfig(severity: string): { label: string; className: string } {
  switch (severity?.toUpperCase()) {
    case "BLOCKER":
      return { label: "BLOCKER", className: "bg-red-500/20 text-red-400 border-red-500/30" };
    case "HIGH":
      return { label: "HIGH", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    case "MEDIUM":
      return { label: "MEDIUM", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    case "LOW":
    default:
      return { label: severity?.toUpperCase() || "LOW", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  }
}

function statusIcon(status: string) {
  switch (status?.toUpperCase()) {
    case "CLOSED":
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "IN_PROGRESS":
      return <Clock className="w-4 h-4 text-cyan-400" />;
    case "TRIAGED":
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-slate-400" />;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function TicketsView() {
  const { tenantId } = useActiveTenant();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TicketStatus>("OPEN");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // New ticket form state
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", body: "", severity: "MEDIUM", category: "" });
  const [creating, setCreating] = useState(false);

  // Fetch tickets
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/v1/tickets?status=${filter}&limit=50`, {
          headers: { "x-tenant-id": tenantId! }
        });
        const json = await res.json();
        if (!cancelled) {
          setTickets(json.tickets ?? json.data ?? []);
        }
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tenantId, filter]);

  // Fetch comments when a ticket is selected
  useEffect(() => {
    if (!selectedTicket || !tenantId) return;
    let cancelled = false;

    async function loadComments() {
      setCommentsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/v1/tickets/${selectedTicket!.id}/comments`, {
          headers: { "x-tenant-id": tenantId! }
        });
        const json = await res.json();
        if (!cancelled) {
          setComments(json.comments ?? json.data ?? []);
        }
      } catch {} finally {
        if (!cancelled) setCommentsLoading(false);
      }
    }

    loadComments();
    return () => { cancelled = true; };
  }, [selectedTicket, tenantId]);

  async function submitComment() {
    if (!selectedTicket || !newComment.trim() || !tenantId) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/v1/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ body: newComment.trim() })
      });
      const json = await res.json();
      const created = json.comment ?? json.data;
      if (created) {
        setComments((prev) => [...prev, created]);
      }
      setNewComment("");
    } catch {} finally {
      setCommentSubmitting(false);
    }
  }

  async function createTicket() {
    if (!tenantId || !newTicket.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/v1/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          title: newTicket.title.trim(),
          body: newTicket.body.trim() || undefined,
          severity: newTicket.severity,
          category: newTicket.category.trim() || undefined,
        })
      });
      const json = await res.json();
      const created = json.ticket ?? json.data;
      if (created) {
        setTickets((prev) => [created, ...prev]);
      }
      setNewTicket({ title: "", body: "", severity: "MEDIUM", category: "" });
      setShowNewTicket(false);
    } catch {} finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Support Tickets</h1>
          <p className="text-sm opacity-70">Track and resolve customer issues.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewTicket((v) => !v)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showNewTicket && (
        <Card className="bg-slate-900 border-cyan-500/20 p-5 space-y-3">
          <h3 className="font-medium text-slate-200">Create Ticket</h3>
          <input
            value={newTicket.title}
            onChange={(e) => setNewTicket((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
          />
          <textarea
            value={newTicket.body}
            onChange={(e) => setNewTicket((p) => ({ ...p, body: e.target.value }))}
            placeholder="Description (optional)"
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200 resize-none"
          />
          <div className="flex gap-3">
            <select
              value={newTicket.severity}
              onChange={(e) => setNewTicket((p) => ({ ...p, severity: e.target.value }))}
              className="flex-1 h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none text-sm text-slate-200"
            >
              {["BLOCKER", "HIGH", "MEDIUM", "LOW"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              value={newTicket.category}
              onChange={(e) => setNewTicket((p) => ({ ...p, category: e.target.value }))}
              placeholder="Category (optional)"
              className="flex-1 h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={createTicket}
              disabled={creating || !newTicket.title.trim()}
              className="flex-1 h-9 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {creating ? "Creating…" : "Create Ticket"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewTicket(false)}
              className="px-4 h-9 rounded-lg text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setFilter(s); setSelectedTicket(null); }}
            className={`h-9 px-4 rounded-xl text-xs font-medium transition ${
              filter === s
                ? "bg-white text-black"
                : "border border-white/10 hover:border-white/20 text-slate-300"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex gap-4">
        {/* Ticket list */}
        <div className={`space-y-2 ${selectedTicket ? "flex-1 min-w-0" : "w-full"}`}>
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-center text-slate-400">
              Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-center text-slate-400">
              No {filter.toLowerCase().replace("_", " ")} tickets found.
            </div>
          ) : (
            tickets.map((ticket) => {
              const sev = severityConfig(ticket.severity);
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTicket(null);
                    } else {
                      setSelectedTicket(ticket);
                      setComments([]);
                      setNewComment("");
                    }
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition ${
                    isSelected
                      ? "border-cyan-500/40 bg-cyan-500/5"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{statusIcon(ticket.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${sev.className}`}>
                          {sev.label}
                        </span>
                        {ticket.category && (
                          <span className="text-xs text-slate-500">{ticket.category}</span>
                        )}
                        <span className="text-xs text-slate-500 ml-auto">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <div className="font-medium text-sm text-slate-200 truncate">{ticket.title}</div>
                      {ticket.agentName && (
                        <div className="text-xs text-slate-500 mt-0.5">Assigned to {ticket.agentName}</div>
                      )}
                    </div>
                    <MessageSquare className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ticket detail panel */}
        {selectedTicket && (
          <div className="w-96 shrink-0 flex flex-col rounded-xl border border-cyan-500/20 bg-slate-900 overflow-hidden">
            {/* Detail header */}
            <div className="p-4 border-b border-cyan-500/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${severityConfig(selectedTicket.severity).className}`}>
                      {severityConfig(selectedTicket.severity).label}
                    </span>
                    <span className="text-xs text-slate-500">{selectedTicket.status.replace("_", " ")}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100">{selectedTicket.title}</h3>
                  {selectedTicket.category && (
                    <div className="text-xs text-slate-500 mt-0.5">{selectedTicket.category}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5">Opened {formatDate(selectedTicket.createdAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white text-lg leading-none shrink-0"
                >
                  ✕
                </button>
              </div>
              {selectedTicket.body && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{selectedTicket.body}</p>
              )}
            </div>

            {/* Comments thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
              {commentsLoading ? (
                <div className="text-center text-slate-400 text-xs py-4">Loading comments…</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-300">
                        {c.authorName ?? "Agent"}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-cyan-500/10 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-xs text-slate-200 resize-none"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={commentSubmitting || !newComment.trim()}
                className="w-full h-8 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {commentSubmitting ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
