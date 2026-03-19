import * as React from "react";
import { API_BASE, apiFetch } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, XCircle, Play, RefreshCw, AlertTriangle, CheckCheck } from "lucide-react";

type DecisionMemo = {
  id: string;
  tenantId: string;
  agent: string;
  title: string;
  rationale: string;
  estimatedCostUsd: number;
  billingType: string;
  riskTier: number;
  confidence: number;
  expectedBenefit?: string | null;
  requiresApproval: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  intentId?: string | null;
  payload?: any;
};

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// Low-risk items can be approved with a single click (no CONFIRM modal)
function isLowRisk(m: DecisionMemo): boolean {
  return m.riskTier <= 2 && m.estimatedCostUsd < 1 && m.billingType !== "recurring";
}

export function DecisionsInbox() {
  const { tenantId } = useActiveTenant();
  const [statusFilter, setStatusFilter] = React.useState<"AWAITING_HUMAN" | "ALL">("AWAITING_HUMAN");
  const [memos, setMemos] = React.useState<DecisionMemo[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmText, setConfirmText] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [showApproveConfirm, setShowApproveConfirm] = React.useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState<string | null>(null);
  const [runningGrowth, setRunningGrowth] = React.useState(false);
  const [growthResult, setGrowthResult] = React.useState<any>(null);

  const selected = React.useMemo(
    () => memos.find((m) => m.id === selectedId) ?? null,
    [memos, selectedId]
  );

  const load = React.useCallback(async () => {
    if (!tenantId) {
      setMemos([]);
      setSelectedId(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = statusFilter === "AWAITING_HUMAN" ? "&status=AWAITING_HUMAN" : "";
      const token = localStorage.getItem("atlas_token") ?? "";
      const res = await apiFetch(`/v1/decisions?tenantId=${encodeURIComponent(tenantId)}${qs}&take=200`, {
        headers: { "x-tenant-id": tenantId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      const rows: DecisionMemo[] = Array.isArray(json?.memos) ? json.memos : [];
      setMemos(rows);
      if (!selectedId && rows.length) setSelectedId(rows[0].id);
      if (selectedId && !rows.some((r) => r.id === selectedId)) {
        setSelectedId(rows[0]?.id ?? null);
      }
    } catch (e: any) {
      setError("Could not load decisions.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const canAct = !!tenantId && !!selected && selected.status === "AWAITING_HUMAN";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("atlas_token") ?? "";
    return {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId!,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const approveOne = async (memoId: string) => {
    if (!tenantId) return false;
    try {
      const res = await apiFetch(`/v1/decisions/${memoId}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tenantId }),
      });
      const json = await res.json();
      return res.ok && json?.ok !== false;
    } catch {
      return false;
    }
  };

  const approve = async () => {
    if (!selected) return;
    setError(null);
    const ok = await approveOne(selected.id);
    if (!ok) {
      setError("Approve failed.");
      return;
    }
    await load();
  };

  const reject = async () => {
    if (!tenantId || !selected) return;
    setError(null);
    try {
      const res = await apiFetch(`/v1/decisions/${selected.id}/reject`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tenantId, reason: rejectReason }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        setError("Reject failed.");
        return;
      }
      setRejectReason("");
      await load();
    } catch {
      setError("Reject failed.");
    }
  };

  const handleApproveClick = () => {
    if (!selected) return;
    if (isLowRisk(selected)) {
      // Single click approve for low-risk items
      approve();
    } else {
      // High-risk: show CONFIRM modal
      setConfirmText("");
      setShowApproveConfirm(true);
    }
  };

  const lowRiskPending = memos.filter(m => m.status === "AWAITING_HUMAN" && isLowRisk(m));

  const approveAllLowRisk = async () => {
    if (!tenantId) return;
    setShowBulkConfirm(false);
    const total = lowRiskPending.length;
    let done = 0;
    let failed = 0;
    setBulkProgress(`0/${total}`);

    for (const m of lowRiskPending) {
      const ok = await approveOne(m.id);
      done++;
      if (!ok) failed++;
      setBulkProgress(`${done}/${total}${failed > 0 ? ` (${failed} failed)` : ""}`);
    }

    setBulkProgress(null);
    await load();
  };

  const kbHealPending = memos.filter(m => m.status === "AWAITING_HUMAN" && m.title.startsWith("KB Heal:"));

  const bulkRejectKbHeal = async () => {
    if (!tenantId) return;
    setBulkProgress("Rejecting KB Heal memos...");
    try {
      const res = await apiFetch(`/v1/decisions/bulk-reject`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ titlePrefix: "KB Heal:", reason: "Tripwire signal docs — not real KB content" }),
      });
      const json = await res.json();
      setBulkProgress(null);
      if (json?.ok) {
        await load();
      } else {
        setError(`Bulk reject failed: ${json?.error ?? "unknown"}`);
      }
    } catch {
      setBulkProgress(null);
      setError("Bulk reject failed.");
    }
  };

  const runGrowthLoopNow = async () => {
    if (!tenantId) return;
    setRunningGrowth(true);
    setGrowthResult(null);
    setError(null);
    try {
      const res = await apiFetch(`/v1/growth/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tenantId, agent: "atlas" }),
      });
      const json = await res.json();
      setGrowthResult(json);
      await load();
    } catch {
      setError("Could not run growth loop.");
    } finally {
      setRunningGrowth(false);
    }
  };

  const pendingCount = memos.filter((m) => m.status === "AWAITING_HUMAN").length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Decisions</h2>
          <p className="text-sm text-slate-400">Review and approve agent decisions. Low-risk items approve with one click.</p>
        </div>

        <div className="flex items-center gap-2">
          {kbHealPending.length > 0 && (
            <button
              type="button"
              onClick={bulkRejectKbHeal}
              className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-sm border border-red-500/30 text-red-200 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Dismiss KB Heal ({kbHealPending.length})
            </button>
          )}
          {lowRiskPending.length > 1 && (
            <button
              type="button"
              onClick={() => setShowBulkConfirm(true)}
              className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/20 text-sm border border-emerald-500/30 text-emerald-200 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Approve All Low-Risk ({lowRiskPending.length})
            </button>
          )}
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-cyan-500/20 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={runGrowthLoopNow}
            disabled={!tenantId || runningGrowth}
            className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-2 ${
              !tenantId || runningGrowth
                ? "bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-cyan-500/20 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/25"
            }`}
            title={!tenantId ? "Select a Business (tenant) first" : "Run the daily growth loop now"}
          >
            <Play className="w-4 h-4" />
            Run Growth Loop Now
          </button>
        </div>
      </div>

      {bulkProgress && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
          <div className="text-sm text-emerald-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Approving... {bulkProgress}
          </div>
        </Card>
      )}

      {!tenantId && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-100">Select a Business first</div>
              <div className="text-sm text-slate-400">Go to Business Manager and pick your active tenant.</div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <div className="text-sm text-red-200">{error}</div>
        </Card>
      )}

      {growthResult && (
        <Card className="bg-slate-900/40 border-cyan-500/10 p-4">
          <div className="text-sm font-bold text-slate-100 mb-2">Growth Loop Result</div>
          <pre className="text-xs text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(growthResult, null, 2)}
          </pre>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("AWAITING_HUMAN")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            statusFilter === "AWAITING_HUMAN"
              ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/30"
              : "bg-slate-900/40 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          Needs Approval <span className="ml-1 text-xs opacity-80">({pendingCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            statusFilter === "ALL"
              ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/30"
              : "bg-slate-900/40 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          Recent
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-5 bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl">
          <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-100">Inbox</div>
            <Badge variant="outline" className="border-cyan-500/20 text-cyan-300">
              {loading ? "Loading" : `${memos.length} items`}
            </Badge>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {memos.length === 0 && !loading && (
              <div className="p-4 text-sm text-slate-400">No decisions found.</div>
            )}
            {memos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors ${
                  selectedId === m.id ? "bg-slate-900/70" : "bg-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-slate-100 line-clamp-2">{m.title || "(untitled)"}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isLowRisk(m) && m.status === "AWAITING_HUMAN" && (
                      <Badge variant="outline" className="text-[10px] border border-emerald-500/30 text-emerald-300">
                        low-risk
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] border ${
                        m.status === "AWAITING_HUMAN"
                          ? "border-amber-500/30 text-amber-300"
                          : m.status === "APPROVED"
                            ? "border-emerald-500/30 text-emerald-300"
                            : "border-slate-700 text-slate-300"
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {m.agent} · {formatDate(m.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 md:col-span-7 bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl">
          <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-100">Details</div>
            {selected && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-700 text-slate-200">
                  Risk {selected.riskTier}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-200">
                  {Math.round((selected.confidence ?? 0) * 100)}% conf
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-200">
                  {formatMoney(selected.estimatedCostUsd ?? 0)}
                </Badge>
              </div>
            )}
          </div>
          {!selected ? (
            <div className="p-4 text-sm text-slate-400">Select a decision to review.</div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-lg font-bold text-slate-100">{selected.title || "(untitled)"}</div>
                <div className="text-sm text-slate-400">{selected.agent} · {formatDate(selected.createdAt)}</div>
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-cyan-500/10 p-4">
                <div className="text-sm font-bold text-slate-100 mb-1">Rationale</div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap">{selected.rationale || "(none)"}</div>
              </div>

              {selected.expectedBenefit && (
                <div className="rounded-xl bg-slate-950/40 border border-cyan-500/10 p-4">
                  <div className="text-sm font-bold text-slate-100 mb-1">Expected Benefit</div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">{selected.expectedBenefit}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/40 border border-cyan-500/10 p-4">
                  <div className="text-xs text-slate-400">Billing</div>
                  <div className="text-sm text-slate-200">{selected.billingType}</div>
                </div>
                <div className="rounded-xl bg-slate-950/40 border border-cyan-500/10 p-4">
                  <div className="text-xs text-slate-400">Approval Level</div>
                  <div className="text-sm text-slate-200">
                    {isLowRisk(selected) ? "One-click (low risk)" : "Requires CONFIRM (high risk)"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={!canAct}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 ${
                    canAct
                      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-slate-900/40 text-slate-500 border-slate-700 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmText("");
                    setRejectReason("");
                    setShowRejectConfirm(true);
                  }}
                  disabled={!canAct}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 ${
                    canAct
                      ? "bg-red-500/10 text-red-200 border-red-500/30 hover:bg-red-500/15"
                      : "bg-slate-900/40 text-slate-500 border-slate-700 cursor-not-allowed"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* High-risk approve confirm modal */}
      {showApproveConfirm && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="px-5 py-4 border-b border-cyan-500/10">
              <div className="text-sm font-bold text-slate-100">High-Risk Approval</div>
              <div className="text-xs text-slate-400 mt-1">
                This action is risk tier {selected.riskTier} / {formatMoney(selected.estimatedCostUsd)}.
                Type <span className="font-bold text-slate-200">CONFIRM</span> to proceed.
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="text-sm text-slate-200 font-bold">{selected.title}</div>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM"
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApproveConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirmText.trim() !== "CONFIRM") return;
                    setShowApproveConfirm(false);
                    await approve();
                  }}
                  disabled={confirmText.trim() !== "CONFIRM"}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${
                    confirmText.trim() === "CONFIRM"
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-slate-900/40 text-slate-500 border-slate-700 cursor-not-allowed"
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject confirm modal */}
      {showRejectConfirm && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="px-5 py-4 border-b border-cyan-500/10">
              <div className="text-sm font-bold text-slate-100">Reject Decision</div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="text-sm text-slate-200 font-bold">{selected.title}</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (optional)"
                autoFocus
                className="w-full min-h-[90px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowRejectConfirm(false);
                    await reject();
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-bold border bg-red-500/15 text-red-200 border-red-500/30 hover:bg-red-500/20"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk approve confirm modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="px-5 py-4 border-b border-cyan-500/10">
              <div className="text-sm font-bold text-slate-100">Approve All Low-Risk Decisions</div>
              <div className="text-xs text-slate-400 mt-1">
                This will approve {lowRiskPending.length} low-risk decisions (risk ≤ 2, cost &lt; $1, non-recurring).
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={approveAllLowRisk}
                  className="px-3 py-2 rounded-lg text-sm font-bold border bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25"
                >
                  Approve All {lowRiskPending.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
