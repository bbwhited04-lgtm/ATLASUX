import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

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

  // ✅ Declare ALL state first (prevents “before initialization” bugs)
  const [activeTab, setActiveTab] = useState<"contacts" | "companies">("contacts");

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

  // ---- Data loading (safe defaults) ----
  useEffect(() => {
    // If you already have a CRM backend endpoint, wire it here.
    // This will not crash if endpoint doesn’t exist—just shows empty state.
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ Optional: use your real API if available
        // Example:
        // const res = await fetch("/api/crm/contacts");
        // if (!res.ok) throw new Error(`Failed: ${res.status}`);
        // const data = await res.json();
        // if (!cancelled) setContacts(data.contacts ?? []);

        // For now: no-op (empty list)
        if (!cancelled) setContacts((prev) => prev ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load contacts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // ---- CRUD-ish handlers ----
  const handleOpenImport = () => {
    setImportSource("google");
    setShowImportModal(true);
  };

  const handleRunImport = async () => {
    // Stub: replace with real integration import
    // This will simulate an import without breaking.
    setShowImportModal(false);
    setLoading(true);
    setError(null);

    try {
      // Example real call:
      // const res = await fetch(`/api/crm/import?source=${importSource}`, { method: "POST" });
      // const data = await res.json();
      // setContacts(data.contacts);

      // Demo-safe: add a single placeholder contact
      const id = crypto.randomUUID();
      const placeholder: Contact = {
        id,
        firstName: "Imported",
        lastName: importSource.toUpperCase(),
        email: `imported-${importSource}@example.com`,
        source: importSource,
        tags: ["imported"],
      };
      setContacts((prev) => [placeholder, ...(prev ?? [])]);
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

  const handleCreateContact = () => {
    const id = crypto.randomUUID();
    const c: Contact = {
      id,
      firstName: (newContact.firstName ?? "").trim(),
      lastName: (newContact.lastName ?? "").trim(),
      email: (newContact.email ?? "").trim(),
      phone: (newContact.phone ?? "").trim(),
      company: (newContact.company ?? "").trim(),
      source: "manual",
      tags: [],
    };

    // Basic validation
    if (!c.email && !c.phone && !c.firstName && !c.lastName) {
      setError("Add at least a name, email, or phone.");
      return;
    }

    setContacts((prev) => [c, ...(prev ?? [])]);
    setShowAddModal(false);
    setError(null);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const keep = contacts.filter((c) => !selectedIds.has(c.id));
    setContacts(keep);
    clearSelection();
  };

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
            onClick={() => navigate("/app/integrations")}
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
              filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-t border-white/10 hover:bg-white/5 transition"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelectOne(c.id)}
                    />
                  </div>
                  <div className="col-span-3 font-medium">{normalizeContactName(c)}</div>
                  <div className="col-span-3 opacity-80">{c.email ?? "—"}</div>
                  <div className="col-span-2 opacity-80">{c.phone ?? "—"}</div>
                  <div className="col-span-2 opacity-80">{c.company ?? "—"}</div>
                  <div className="col-span-1 opacity-70">{(c.source ?? "—").toString()}</div>
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
                onChange={(e) => setImportSource(e.target.value as ImportSource)}
                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/25"
              >
                <option value="google">Google</option>
                <option value="csv">CSV Upload</option>
                <option value="hubspot">HubSpot</option>
                <option value="salesforce">Salesforce</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="h-11 px-4 rounded-xl border border-white/10 hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunImport}
                className="h-11 px-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
              >
                Import
              </button>
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
    </div>
  );
}
