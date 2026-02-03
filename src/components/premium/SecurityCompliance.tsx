import { useState } from 'react';
import { 
  Shield, Lock, FileCheck, MapPin, Activity, 
  Users, Key, AlertTriangle, CheckCircle, Clock,
  FileText, Download, Eye, Settings
} from 'lucide-react';

export function SecurityCompliance() {
  const dlpRules: any[] = [];

  const complianceReports: any[] = [];

  const sharedFiles: any[] = [];

  const geofenceLocations: any[] = [];

  const activityLog: any[] = [];

  const roles: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Enterprise Security & Compliance</h2>
        </div>
        <p className="text-slate-400">
          Advanced security features and compliance tools for enterprise deployment
        </p>
      </div>

      {/* Security Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-green-400" />
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
              ACTIVE
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">Secure</div>
          <div className="text-sm text-slate-400">Overall Status</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Compliance Issues</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Lock className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Files Encrypted</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Activity className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">Audit Logs</div>
        </div>
      </div>

      {/* Data Loss Prevention (DLP) */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Data Loss Prevention (DLP)</h3>
          </div>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">
            Add Rule
          </button>
        </div>

        <div className="grid gap-3">
          {dlpRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{rule.name}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{rule.detected} detected</span>
                      <span>•</span>
                      <span className="text-red-400">{rule.blocked} blocked</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    rule.status === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {rule.status}
                  </span>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Reporting */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Compliance Reporting</h3>
          </div>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export All Reports
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {complianceReports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{report.type}</div>
                    <div className="text-xs text-slate-400">Last audit: {report.lastAudit}</div>
                  </div>
                </div>
                <div>
                  {report.status === 'compliant' ? (
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-semibold">
                      COMPLIANT
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-semibold">
                      REVIEW
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {report.issues === 0 ? (
                    <span className="text-green-400">No issues found</span>
                  ) : (
                    <span className="text-yellow-400">{report.issues} issues to resolve</span>
                  )}
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  View Report →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secure File Sharing */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Secure File Sharing</h3>
          </div>
          <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors">
            Create Secure Link
          </button>
        </div>

        <div className="grid gap-3">
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">{file.name}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span>Shared with: {file.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span>Expires: {file.expires}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-green-400" />
                      <span>Password protected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>{file.downloads}/{file.maxDownloads} downloads</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geofencing */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Geofencing</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Add Location
          </button>
        </div>

        <div className="grid gap-3">
          {geofenceLocations.map((location) => (
            <div
              key={location.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{location.name}</div>
                    <div className="text-sm text-slate-400">{location.address}</div>
                    <div className="text-xs text-slate-500 mt-1">Radius: {location.radius}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-semibold">
                    ACTIVE
                  </span>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">Location-Based Security</div>
              <div className="text-xs text-slate-400">
                Atlas UX will only function within approved geofenced locations. Prevent unauthorized access from outside secure zones.
              </div>
            </div>
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
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Audit Log
          </button>
        </div>

        <div className="space-y-4">
          {activityLog.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${
                log.risk === 'high' ? 'bg-red-400' : log.risk === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{log.user}</span>
                  <span className="text-slate-400">—</span>
                  <span className="text-slate-300">{log.action}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{log.resource}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                  <span>•</span>
                  <span className={`${
                    log.risk === 'high' ? 'text-red-400' : log.risk === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {log.risk} risk
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-Based Access Control */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-white">Role-Based Access Control</h3>
          </div>
          <button className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm text-orange-400 transition-colors">
            Create Role
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-orange-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${role.color}-500/20 to-${role.color}-600/20 rounded-lg flex items-center justify-center`}>
                    <Users className={`w-6 h-6 text-${role.color}-400`} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{role.name}</div>
                    <div className="text-xs text-slate-400">{role.users} users</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Manage
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}