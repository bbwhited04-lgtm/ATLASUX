import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type Budget = {
  id: string;
  name: string;
  category?: string;
  limitCents: number;
  spentCents: number;
  pctUsed: number;
  periodDays: number;
  isOverAlert: boolean;
  alertThresholdPct?: number;
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function progressColorClass(pctUsed: number): string {
  if (pctUsed > 0.8) return "bg-red-500";
  if (pctUsed >= 0.6) return "bg-yellow-500";
  return "bg-green-500";
}

export function BudgetTracker() {
  const { tenantId } = useActiveTenant();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", limitCents: "", periodDays: "30" });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/v1/budgets/status`, {
          headers: { "x-tenant-id": tenantId! }
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setBudgets(json.budgets ?? json.data ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load budgets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tenantId]);

  async function createBudget() {
    if (!tenantId || !form.name.trim() || !form.limitCents) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim() || undefined,
          limitCents: Math.round(parseFloat(form.limitCents) * 100),
          periodDays: parseInt(form.periodDays, 10) || 30,
        })
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      const created = json.budget ?? json.data;
      if (created) {
        setBudgets((prev) => [...prev, created]);
      }
      setForm({ name: "", category: "", limitCents: "", periodDays: "30" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create budget");
    } finally {
      setCreating(false);
    }
  }

  async function deleteBudget(id: string) {
    if (!tenantId) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/v1/budgets/${id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId }
      });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch {} finally {
      setDeletingId(null);
    }
  }

  const alertingCount = budgets.filter((b) => b.isOverAlert).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Budget Tracker</h1>
          <p className="text-sm opacity-70">Monitor spending against budget limits.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl border border-white/10 hover:border-white/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      )}

      {/* Summary card */}
      {!loading && budgets.length > 0 && (
        <Card className="bg-slate-900 border-cyan-500/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-200">
              {budgets.length} budget{budgets.length !== 1 ? "s" : ""} tracked
            </div>
            <div className={`text-xs mt-0.5 ${alertingCount > 0 ? "text-red-400" : "text-slate-500"}`}>
              {alertingCount > 0 ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {alertingCount} of {budgets.length} budget{budgets.length !== 1 ? "s" : ""} alerting
                </span>
              ) : (
                "All budgets within limits"
              )}
            </div>
          </div>
          {alertingCount > 0 && (
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">{alertingCount} OVER ALERT</span>
            </div>
          )}
        </Card>
      )}

      {/* Add budget form */}
      {showForm && (
        <Card className="bg-slate-900 border-cyan-500/20 p-5 space-y-3">
          <h3 className="font-medium text-slate-200">New Budget</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Budget name"
              className="h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
            />
            <input
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Category (optional)"
              className="h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
            />
            <input
              type="number"
              value={form.limitCents}
              onChange={(e) => setForm((p) => ({ ...p, limitCents: e.target.value }))}
              placeholder="Limit (USD, e.g. 1000.00)"
              min="0"
              step="0.01"
              className="h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.periodDays}
                onChange={(e) => setForm((p) => ({ ...p, periodDays: e.target.value }))}
                placeholder="Period (days)"
                min="1"
                className="flex-1 h-10 px-3 rounded-lg bg-slate-800 border border-cyan-500/20 outline-none focus:border-cyan-500/40 text-sm text-slate-200"
              />
              <span className="text-xs text-slate-500 shrink-0">days</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={createBudget}
              disabled={creating || !form.name.trim() || !form.limitCents}
              className="flex-1 h-9 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {creating ? "Creating…" : "Create Budget"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ name: "", category: "", limitCents: "", periodDays: "30" }); }}
              className="px-4 h-9 rounded-lg text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-center text-slate-400">
          Loading budgets…
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-center text-slate-400">
          No budgets yet. Click <span className="font-semibold text-slate-300">+ Add Budget</span> to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const pct = Math.min(budget.pctUsed ?? 0, 1);
            const pctDisplay = Math.round(pct * 100);
            const barColor = progressColorClass(pct);
            return (
              <Card key={budget.id} className="bg-slate-900 border-white/10 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-200">{budget.name}</span>
                      {budget.category && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          {budget.category}
                        </span>
                      )}
                      {budget.isOverAlert && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          OVER ALERT
                        </span>
                      )}
                    </div>
                    {budget.periodDays && (
                      <div className="text-xs text-slate-500 mt-0.5">{budget.periodDays}-day period</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBudget(budget.id)}
                    disabled={deletingId === budget.id}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:border-red-500/30 hover:text-red-400 text-slate-500 transition disabled:opacity-40"
                    title="Delete budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {formatCents(budget.spentCents ?? 0)} spent
                    </span>
                    <span className={`font-medium ${pct > 0.8 ? "text-red-400" : pct >= 0.6 ? "text-yellow-400" : "text-green-400"}`}>
                      {pctDisplay}%
                    </span>
                    <span className="text-slate-500">
                      limit {formatCents(budget.limitCents)}
                    </span>
                  </div>
                  {/* Custom-colored progress bar overlay */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pctDisplay}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
