import { useEffect, useState } from 'react';
import { useActiveTenant } from '@/lib/activeTenant';
import { API_BASE } from '@/lib/api';
import {
  Shield, Lock, FileCheck, Activity,
  Users, AlertTriangle, CheckCircle, Clock,
  Download, RefreshCw, Eye,
} from 'lucide-react';

type AuditEntry = {
  id: string;
  tenantId?: string;
  actorType?: string;
  actorUserId?: string;
  actorExternalId?: string;
  action: string;
  level: "info" | "warn" | "error";
  entityType?: string;
  entityId?: string;
  message?: string;
  meta?: any;
  timestamp?: string;
  createdAt?: string;
};

type AgentRole = {
  id: string;
  name: string;
  title: string;
  tier: string;
};

type FileEntry = {
  name: string;
  path: string;
  size: number | null;
  contentType: string | null;
  updatedAt: string | null;
};

export function SecurityCompliance() {
  const { tenantId } = useActiveTenant();
  const [loading, setLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditStats, setAuditStats] = useState({ total: 0, errors: 0, warns: 0 });
  const [agents, setAgents] = useState<AgentRole[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState(0);

  const hdr = tenantId ? { "x-tenant-id": tenantId } : {};

  async function loadAll() {
    setLoading(true);
    try {
      const qs = tenantId ? `tenantId=${encodeURIComponent(tenantId)}` : "";

      const [auditRes, agentsRes, filesRes, acctRes] = await Promise.all([
        fetch(`${API_BASE}/v1/audit/list?limit=100&${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/agents`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/files?${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/v1/accounting/summary?${qs}`, { headers: hdr }).then(r => r.json()).catch(() => null),
      ]);

      if (auditRes?.ok) {
        const items: AuditEntry[] = auditRes.items ?? [];
        setAuditEntries(items);
        setAuditStats({
          total: items.length,
          errors: items.filter(a => a.level === "error").length,
          warns: items.filter(a => a.level === "warn").length,
        });
      }
      if (agentsRes?.ok) setAgents(agentsRes.agents ?? []);
      if (filesRes?.ok) setFiles(filesRes.files ?? []);
      if (acctRes?.ok) setPendingDecisions(acctRes.summary?.approvalsPending ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [tenantId]);

  const tierGroups: Record<string, AgentRole[]> = {};
  for (const a of agents) {
    const tier = a.tier || "Other";
    if (!tierGroups[tier]) tierGroups[tier] = [];
    tierGroups[tier].push(a);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Enterprise Security & Compliance</h2>
            </div>
            <p className="text-slate-400">
              Audit trail, access control, and compliance status across your workspace
            </p>
          </div>
          <button
            onClick={loadAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-green-400" />
            <div className={`px-2 py-1 rounded text-xs ${
              auditStats.errors === 0
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}>
              {auditStats.errors === 0 ? "HEALTHY" : `${auditStats.errors} ERRORS`}
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{auditStats.errors === 0 ? "Secure" : "Alert"}</div>
          <div className="text-sm text-slate-400">Overall Status</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{auditStats.warns}</div>
          <div className="text-sm text-slate-400">Warnings</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Lock className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{files.length}</div>
          <div className="text-sm text-slate-400">Files Managed</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Activity className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{auditStats.total}</div>
          <div className="text-sm text-slate-400">Audit Log Entries</div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Compliance Status</h3>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Audit Trail</div>
              <div className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">ACTIVE</div>
            </div>
            <div className="text-xs text-slate-400">All mutations logged to audit_log table with actor, action, and timestamp.</div>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Approval Workflow</div>
              <div className={`px-2 py-0.5 rounded text-xs ${
                pendingDecisions > 0
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}>
                {pendingDecisions > 0 ? `${pendingDecisions} PENDING` : "CLEAR"}
              </div>
            </div>
            <div className="text-xs text-slate-400">High-risk actions require decision memos before execution.</div>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Daily Action Cap</div>
              <div className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">ENFORCED</div>
            </div>
            <div className="text-xs text-slate-400">MAX_ACTIONS_PER_DAY and daily posting caps enforced by engine.</div>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Spend Limit</div>
              <div className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">ENFORCED</div>
            </div>
            <div className="text-xs text-slate-400">AUTO_SPEND_LIMIT_USD enforced. Recurring purchases blocked by default.</div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Activity Timeline</h3>
          </div>
          <div className="text-sm text-slate-400">{auditEntries.length} entries (latest 100)</div>
        </div>

        {auditEntries.length > 0 ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {auditEntries.slice(0, 50).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  log.level === 'error' ? 'bg-red-400' : log.level === 'warn' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm truncate">{log.action}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {log.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {log.entityType && <span>{log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>}
                    {log.message && <span className="text-slate-400 truncate max-w-[300px]">{log.message}</span>}
                    <span>{new Date(log.timestamp ?? log.createdAt ?? "").toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 py-6 text-center">No audit entries found for this tenant.</div>
        )}
      </div>

      {/* Role-Based Access Control (Agent Roster) */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-white">Agent Access Control</h3>
          </div>
          <div className="text-sm text-slate-400">{agents.length} agents registered</div>
        </div>

        {Object.keys(tierGroups).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(tierGroups).map(([tier, members]) => (
              <div key={tier}>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{tier} ({members.length})</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {members.map((agent) => (
                    <div key={agent.id} className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white capitalize">{agent.name}</div>
                        <div className="text-xs text-slate-400 truncate">{agent.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 py-6 text-center">No agents loaded.</div>
        )}
      </div>

      {/* File Inventory */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Managed Files</h3>
          </div>
          <div className="text-sm text-slate-400">{files.length} files</div>
        </div>

        {files.length > 0 ? (
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400 sticky top-0 bg-slate-900">
              <div className="col-span-5">Filename</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Size</div>
              <div className="col-span-3">Updated</div>
            </div>
            {files.slice(0, 100).map((f) => (
              <div key={f.path} className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-700/50 text-sm">
                <div className="col-span-5 text-white truncate" title={f.name}>{f.name}</div>
                <div className="col-span-2 text-slate-400 text-xs">{f.contentType?.split("/")[1] ?? "—"}</div>
                <div className="col-span-2 text-right text-slate-300 text-xs">
                  {f.size != null ? `${(f.size / 1024).toFixed(1)} KB` : "—"}
                </div>
                <div className="col-span-3 text-slate-500 text-xs">
                  {f.updatedAt ? new Date(f.updatedAt).toLocaleString() : "—"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 py-6 text-center">No files uploaded for this tenant.</div>
        )}
      </div>

      {/* Upcoming Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Shield className="w-6 h-6 text-red-400 mb-3" />
          <div className="text-white font-semibold mb-1">Data Loss Prevention</div>
          <div className="text-xs text-slate-400">Custom DLP rules to detect and block sensitive data exposure.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Eye className="w-6 h-6 text-green-400 mb-3" />
          <div className="text-white font-semibold mb-1">Geofencing</div>
          <div className="text-xs text-slate-400">Location-based access restrictions for secure zones.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Download className="w-6 h-6 text-purple-400 mb-3" />
          <div className="text-white font-semibold mb-1">Secure File Sharing</div>
          <div className="text-xs text-slate-400">Expiring links with password protection and download limits.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
      </div>
    </div>
  );
}
