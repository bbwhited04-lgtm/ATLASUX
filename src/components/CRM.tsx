import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

// If you have shared UI components, swap these for your own.
// This file intentionally uses plain HTML + Tailwind-ish classes to avoid breaking imports.

type Contact = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // optional fallback
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  source?: string; // e.g. "google", "hubspot", etc.
  createdAt?: string;
};

type ImportSource = "google" | "csv" | "hubspot" | "salesforce" | "manual";

function normalizeContactName(c: Contact): string {
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  if (full) return full;
  if (c.name?.trim()) return c.name.trim();
  return "Unnamed Contact";
}

function safeLower(s?: string) {
  return (s ?? "").toLowerCase();
}

export default function CRM() {
  const navigate = useNavigate();
  const { tenantId } = useActiveTenant();

  // ✅ Declare ALL state first (prevents "before initialization" bugs)
  const [activeTab, setActiveTab] = useState<"contacts" | "companies" | "segments">("contacts");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource>("google");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });

  // Activity timeline state
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: "note", subject: "", body: "" });

  // Segments state
  const [segments, setSegments] = useState<any[]>([]);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  // ---- Data loading ----
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/v1/crm/contacts`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setContacts(data.contacts ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load contacts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Load segments when segments tab is active
  useEffect(() => {
    if (activeTab === "segments" && tenantId) {
      loadSegments();
    }
  }, [activeTab, tenantId]);

  // ---- Derived data ----
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter((c) => {
      const name = normalizeContactName(c).toLowerCase();
      const email = safeLower(c.email);
      const phone = safeLower(c.phone);
      const company = safeLower(c.company);
      const tags = (c.tags ?? []).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        company.includes(q) ||
        tags.includes(q)
      );
    });
  }, [contacts, query]);

  const allVisibleSelected = useMemo(() => {
    if (filteredContacts.length === 0) return false;
    return filteredContacts.every((c) => selectedIds.has(c.id));
  }, [filteredContacts, selectedIds]);

  // ---- Selection handlers ----
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredContacts.forEach((c) => next.delete(c.id));
      } else {
        filteredContacts.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  // ---- CRUD-ish handlers ----
  const handleOpenImport = () => {
    setImportSource("csv");
    setCsvFile(null);
    setImportResult(null);
    setShowImportModal(true);
  };

  /** Parse CSV text into an array of row objects. Handles quoted fields and commas inside quotes. */
  function parseCsv(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Parse a CSV line respecting quoted fields
    const parseLine = (line: string): string[] => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
          else if (ch === '"') { inQuotes = false; }
          else { current += ch; }
        } else {
          if (ch === '"') { inQuotes = true; }
          else if (ch === ',') { fields.push(current.trim()); current = ""; }
          else { current += ch; }
        }
      }
      fields.push(current.trim());
      return fields;
    };

    const headers = parseLine(lines[0]);
    return lines.slice(1).map((line) => {
      const vals = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { if (h && vals[i]) row[h] = vals[i]; });
      return row;
    });
  }

  const handleRunImport = async () => {
    if (importSource === "csv" && csvFile) {
      setLoading(true);
      setError(null);
      setImportResult(null);
      try {
        const text = await csvFile.text();
        const rows = parseCsv(text);
        if (!rows.length) { setError("CSV has no data rows. Check the file and try again."); setLoading(false); return; }

        const res = await fetch(`${API_BASE}/v1/crm/contacts/import-csv`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-id": tenantId ?? "" },
          body: JSON.stringify({ rows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Import failed");
        setImportResult({ created: data.created, skipped: data.skipped, errors: data.errors ?? [] });

        // Reload contacts list
        const listRes = await fetch(`${API_BASE}/v1/crm/contacts`, {
          headers: { "x-tenant-id": tenantId ?? "" },
        });
        const listData = await listRes.json();
        if (listRes.ok) setContacts(listData.contacts ?? []);
      } catch (e: any) {
        setError(e?.message ?? "CSV import failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Non-CSV sources: just reload
    setShowImportModal(false);
    setLoading(true);
    setError(null);
    try {
      if (tenantId) {
        const res = await fetch(`${API_BASE}/v1/crm/contacts`, {
          headers: { "x-tenant-id": tenantId },
        });
        const data = await res.json();
        if (res.ok) setContacts(data.contacts ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setNewContact({ firstName: "", lastName: "", email: "", phone: "", company: "" });
    setShowAddModal(true);
  };

  const handleCreateContact = async () => {
    if (!tenantId) { setError("No active tenant."); return; }

    const c = {
      firstName: (newContact.firstName ?? "").trim() || undefined,
      lastName:  (newContact.lastName  ?? "").trim() || undefined,
      email:     (newContact.email     ?? "").trim() || undefined,
      phone:     (newContact.phone     ?? "").trim() || undefined,
      company:   (newContact.company   ?? "").trim() || undefined,
      source:    "manual",
    };

    if (!c.email && !c.phone && !c.firstName && !c.lastName) {
      setError("Add at least a name, email, or phone.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/crm/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create contact");
      setContacts((prev) => [data.contact, ...(prev ?? [])]);
      setShowAddModal(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create contact");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || !tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/crm/contacts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      clearSelection();
    } catch (e: any) {
      setError(e?.message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Activity Timeline handlers ----
  async function loadActivities(contactId: string) {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/crm/contacts/${contactId}/activities`, {
        headers: { "x-tenant-id": tenantId ?? "" }
      });
      const json = await res.json();
      if (json.ok) setActivities(json.activities ?? []);
    } catch {} finally { setActivitiesLoading(false); }
  }

  async function addActivity() {
    if (!selectedContact) return;
    await fetch(`${API_BASE}/v1/crm/contacts/${selectedContact.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": tenantId ?? "" },
      body: JSON.stringify(newActivity)
    });
    setNewActivity({ type: "note", subject: "", body: "" });
    setShowActivityForm(false);
    loadActivities(selectedContact.id);
  }

  // ---- Segment handlers ----
  async function loadSegments() {
    if (!tenantId) return;
    setSegmentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/crm/segments`, {
        headers: { "x-tenant-id": tenantId }
      });
      const json = await res.json();
      if (json.ok || Array.isArray(json.segments)) {
        setSegments(json.segments ?? []);
      }
    } catch {} finally { setSegmentsLoading(false); }
  }

  async function createSegment() {
    if (!tenantId || !newSegmentName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/v1/crm/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ name: newSegmentName.trim() })
      });
      const json = await res.json();
      if (json.ok || json.segment) {
        setSegments((prev) => [json.segment, ...prev]);
        setNewSegmentName("");
        setShowSegmentForm(false);
      }
    } catch {}
  }

  async function deleteSegment(id: string) {
    if (!tenantId) return;
    try {
      await fetch(`${API_BASE}/v1/crm/segments/${id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId }
      });
      setSegments((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  }

  function applySegmentFilter(segment: any) {
    // Switch to contacts tab and apply segment filter criteria
    setActiveTab("contacts");
    if (segment.filterCriteria?.query) {
      setQuery(segment.filterCriteria.query);
    } else {
      setQuery(segment.name ?? "");
    }
  }

  // ---- UI ----
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">CRM</h1>
          <p className="text-sm opacity-70">
            Contacts & companies — clean, simple, and wired for imports.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/app/settings")}
            className="h-10 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
          >
            Integrations
          </button>

          <button
            type="button"
            onClick={handleOpenImport}
            className="h-10 px-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
          >
            Import
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="h-10 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
          >
            Add Contact
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`h-10 px-4 rounded-xl transition ${
            activeTab === "contacts"
              ? "bg-white text-black font-semibold"
              : "border border-white/10 hover:border-white/20"
          }`}
        >
          Contacts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("companies")}
          className={`h-10 px-4 rounded-xl transition ${
            activeTab === "companies"
              ? "bg-white text-black font-semibold"
              : "border border-white/10 hover:border-white/20"
          }`}
        >
          Companies
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("segments")}
          className={`h-10 px-4 rounded-xl transition ${
            activeTab === "segments"
              ? "bg-white text-black font-semibold"
              : "border border-white/10 hover:border-white/20"
          }`}
        >
          Segments
        </button>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          Loading…
        </div>
      )}

      {/* Contacts tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {/* Search + actions */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts (name, email, phone, company, tags)…"
                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="h-11 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
              >
                {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
              </button>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleDeleteSelected}
                className="h-11 px-4 rounded-xl border border-white/10 hover:border-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Selected
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide opacity-70 bg-white/5">
              <div className="col-span-1">Sel</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-1">Src</div>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-6 text-sm opacity-70">
                No contacts yet. Click <span className="font-semibold">Import</span> or{" "}
                <span className="font-semibold">Add Contact</span>.
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => { setSelectedContact(contact); loadActivities(contact.id); }}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelectOne(contact.id); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="col-span-3 font-medium">{normalizeContactName(contact)}</div>
                  <div className="col-span-3 opacity-80">{contact.email ?? "—"}</div>
                  <div className="col-span-2 opacity-80">{contact.phone ?? "—"}</div>
                  <div className="col-span-2 opacity-80">{contact.company ?? "—"}</div>
                  <div className="col-span-1 opacity-70">{(contact.source ?? "—").toString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Companies tab (placeholder but non-breaking) */}
      {activeTab === "companies" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm opacity-70">
            Companies view is ready to wire next. (We can derive companies from contacts or
            load from your backend.)
          </div>
        </div>
      )}

      {/* Segments tab */}
      {activeTab === "segments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-70">
              Saved audience segments for targeted outreach.
            </p>
            <button
              type="button"
              onClick={() => setShowSegmentForm((v) => !v)}
              className="h-10 px-4 rounded-xl border border-white/10 hover:border-white/20 transition text-sm"
            >
              + New Segment
            </button>
          </div>

          {showSegmentForm && (
            <div className="rounded-xl border border-cyan-500/20 bg-slate-800/50 p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-200">Create Segment</h3>
              <input
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="Segment name (e.g. High-value leads)"
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createSegment}
                  disabled={!newSegmentName.trim()}
                  className="flex-1 h-9 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSegmentForm(false); setNewSegmentName(""); }}
                  className="px-4 h-9 rounded-lg text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {segmentsLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm opacity-70 text-center">
              Loading segments…
            </div>
          ) : segments.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm opacity-70">
              No segments yet. Create one to group your contacts.
            </div>
          ) : (
            <div className="space-y-2">
              {segments.map((seg: any) => (
                <div
                  key={seg.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{seg.name}</div>
                    {seg.description && (
                      <div className="text-xs opacity-60 mt-0.5 truncate">{seg.description}</div>
                    )}
                    {seg.contactCount != null && (
                      <div className="text-xs text-cyan-400/80 mt-0.5">{seg.contactCount} contacts</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => applySegmentFilter(seg)}
                      className="h-8 px-3 rounded-lg border border-white/10 hover:border-white/20 text-xs transition"
                    >
                      View Contacts
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSegment(seg.id)}
                      className="h-8 px-3 rounded-lg border border-red-500/20 hover:border-red-500/40 text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import modal (simple, safe) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Import Contacts</h2>
                <p className="text-sm opacity-70">
                  Choose a source. This can be wired to real integrations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="h-9 px-3 rounded-xl border border-white/10 hover:border-white/20"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm opacity-80">Source</label>
              <select
                value={importSource}
                onChange={(e) => { setImportSource(e.target.value as ImportSource); setCsvFile(null); setImportResult(null); }}
                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              >
                <option value="csv">CSV Upload</option>
                <option value="google">Google (coming soon)</option>
                <option value="hubspot">HubSpot (coming soon)</option>
                <option value="salesforce">Salesforce (coming soon)</option>
              </select>
            </div>

            {importSource === "csv" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setImportResult(null); }}
                    className="block mx-auto text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-400 hover:file:bg-cyan-500/30"
                  />
                  {csvFile && (
                    <p className="mt-2 text-xs opacity-70">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
                <p className="text-xs opacity-60">
                  Expected columns: <span className="font-mono text-cyan-400/80">First Name, Last Name, Email, Phone, Company, Notes</span>.
                  Also accepts: <span className="font-mono text-cyan-400/80">firstName, email, phone, company</span> and iCloud vCard export CSV formats.
                </p>
              </div>
            )}

            {importSource !== "csv" && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm opacity-70 text-center">
                This import source is not yet available. Use CSV to import contacts from iCloud, Outlook, or any other app that exports .csv files.
              </div>
            )}

            {importResult && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-1">
                <p className="text-sm font-medium text-cyan-400">
                  Import complete: {importResult.created} created, {importResult.skipped} skipped
                </p>
                {importResult.errors.length > 0 && (
                  <div className="text-xs opacity-70 space-y-0.5">
                    {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportResult(null); }}
                className="h-11 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
              >
                {importResult ? "Done" : "Cancel"}
              </button>
              {!importResult && (
                <button
                  type="button"
                  onClick={handleRunImport}
                  disabled={importSource === "csv" && !csvFile}
                  className="h-11 px-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add contact modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Add Contact</h2>
                <p className="text-sm opacity-70">Create a new contact locally.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-9 px-3 rounded-xl border border-white/10 hover:border-white/20"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={newContact.firstName ?? ""}
                onChange={(e) => setNewContact((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="First name"
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
              <input
                value={newContact.lastName ?? ""}
                onChange={(e) => setNewContact((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name"
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
              <input
                value={newContact.email ?? ""}
                onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
              <input
                value={newContact.phone ?? ""}
                onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
              <input
                value={newContact.company ?? ""}
                onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))}
                placeholder="Company"
                className="md:col-span-2 h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-11 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateContact}
                className="h-11 px-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity timeline side panel */}
      {selectedContact && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-cyan-500/20 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
            <div>
              <div className="font-semibold">{selectedContact.firstName} {selectedContact.lastName}</div>
              <div className="text-xs text-slate-400">{selectedContact.email}</div>
            </div>
            <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activitiesLoading ? (
              <div className="text-center text-slate-400 text-sm py-8">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">No activity yet</div>
            ) : (
              activities.map((a: any) => (
                <div key={a.id} className="bg-slate-800 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 capitalize">{a.type}</span>
                    <span className="text-xs text-slate-500">{new Date(a.occurredAt).toLocaleDateString()}</span>
                  </div>
                  {a.subject && <div className="font-medium text-slate-200 text-xs">{a.subject}</div>}
                  {a.body && <div className="text-slate-400 text-xs mt-1">{a.body}</div>}
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-cyan-500/10">
            {showActivityForm ? (
              <div className="space-y-2">
                <select value={newActivity.type} onChange={e => setNewActivity(p => ({...p, type: e.target.value}))}
                  className="w-full bg-slate-800 border border-cyan-500/20 rounded px-2 py-1 text-xs text-slate-200">
                  {["note","email","call","meeting","sms","mention"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="Subject (optional)" value={newActivity.subject}
                  onChange={e => setNewActivity(p => ({...p, subject: e.target.value}))}
                  className="w-full bg-slate-800 border border-cyan-500/20 rounded px-2 py-1 text-xs text-slate-200" />
                <textarea placeholder="Details" value={newActivity.body} rows={3}
                  onChange={e => setNewActivity(p => ({...p, body: e.target.value}))}
                  className="w-full bg-slate-800 border border-cyan-500/20 rounded px-2 py-1 text-xs text-slate-200 resize-none" />
                <div className="flex gap-2">
                  <button onClick={addActivity} className="flex-1 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded border border-cyan-500/30">Save</button>
                  <button onClick={() => setShowActivityForm(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowActivityForm(true)}
                className="w-full py-2 text-xs bg-slate-800 hover:bg-slate-700 border border-cyan-500/20 rounded text-slate-300">
                + Log Activity
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
