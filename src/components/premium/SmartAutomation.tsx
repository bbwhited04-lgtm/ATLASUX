import { useState } from 'react';
import { 
  Zap, Mail, FileText, Receipt, FormInput, 
  FolderOpen, Bot, Clock, CheckCircle, Settings,
  Key, Chrome, TrendingUp, Play, Pause
} from 'lucide-react';

export function SmartAutomation() {
  const [automationRunning, setAutomationRunning] = useState(false);

  const autoResponses: any[] = [];

  const invoices: any[] = [];

  const receipts: any[] = [];

  const formProfiles: any[] = [];

  const passwordManagers: any[] = [];

  const browserAutomations: any[] = [];

  const fileOrganization: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Smart Automation</h2>
        </div>
        <p className="text-slate-400">
          Intelligent automation for repetitive tasks and workflows
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Mail className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">226</div>
          <div className="text-sm text-slate-400">Auto-responses sent</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">89</div>
          <div className="text-sm text-slate-400">Invoices processed</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Receipt className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">347</div>
          <div className="text-sm text-slate-400">Receipts categorized</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FolderOpen className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">473</div>
          <div className="text-sm text-slate-400">Files organized</div>
        </div>
      </div>

      {/* Email Auto-Responder */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Email Auto-Responder</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${automationRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={automationRunning ? 'text-green-400' : 'text-slate-400'}>
                {automationRunning ? 'Active' : 'Paused'}
              </span>
            </div>
            <button 
              onClick={() => setAutomationRunning(!automationRunning)}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors"
            >
              {automationRunning ? 'Pause' : 'Activate'}
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {autoResponses.map((response) => (
            <div
              key={response.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{response.trigger}</div>
                  <div className="text-sm text-slate-400 mb-2 italic">"{response.response}"</div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{response.sent} sent</span>
                    <span>•</span>
                    <span>Avg response time: {response.avgTime}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">AI-Powered Responses</div>
              <div className="text-xs text-slate-400">
                Automatically replies to routine emails while you sleep. AI learns from your writing style.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Auto-Processing */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Invoice Auto-Processing</h3>
          </div>
          <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
            Configure QuickBooks Sync
          </button>
        </div>

        <div className="grid gap-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">{invoice.vendor}</span>
                      <span className="text-lg font-bold text-cyan-400">{invoice.amount}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{invoice.invoiceNumber}</span>
                      <span>•</span>
                      <span>{invoice.date}</span>
                      <span>•</span>
                      <span className="text-blue-400">{invoice.category}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {invoice.status === 'synced' && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Synced to QB</span>
                    </div>
                  )}
                  {invoice.status === 'processing' && (
                    <div className="flex items-center gap-2 text-cyan-400 text-sm">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  {invoice.status === 'queued' && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Queued</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt Management */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Receipt Management</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Upload Receipt
          </button>
        </div>

        <div className="grid gap-3">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">{receipt.merchant}</span>
                      <span className="font-bold text-green-400">{receipt.amount}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{receipt.date}</span>
                      <span>•</span>
                      <span className="text-green-400">{receipt.category}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {receipt.status === 'categorized' ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Categorized</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Auto-Filler */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FormInput className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Form Auto-Filler</h3>
          </div>
          <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors">
            New Profile
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {formProfiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <FormInput className="w-8 h-8 text-purple-400" />
                <button className="text-xs text-purple-400 hover:text-purple-300">Edit</button>
              </div>
              <div className="font-semibold text-white mb-1">{profile.name}</div>
              <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                <span>{profile.fields} fields</span>
                <span>•</span>
                <span>{profile.uses} uses</span>
              </div>
              <div className="text-xs text-slate-500">Last used: {profile.lastUsed}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Password Manager Integration */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Password Manager Integration</h3>
        </div>

        <div className="grid gap-3">
          {passwordManagers.map((pm, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-yellow-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                    <Key className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{pm.name}</div>
                    {pm.status === 'connected' && (
                      <div className="text-sm text-slate-400">
                        {pm.vaults} vaults • {pm.credentials} credentials
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {pm.status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Connected</span>
                      </div>
                      <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                        Settings
                      </button>
                    </div>
                  ) : (
                    <button className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Automation */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Chrome className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Browser Automation</h3>
          </div>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">
            New Automation
          </button>
        </div>

        <div className="grid gap-3">
          {browserAutomations.map((automation) => (
            <div
              key={automation.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{automation.name}</div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{automation.frequency}</span>
                    <span>•</span>
                    <span>Last run: {automation.lastRun}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {automation.status === 'active' ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Play className="w-4 h-4" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <Pause className="w-4 h-4" />
                      <span>Paused</span>
                    </div>
                  )}
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart File Organization */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Smart File Organization</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors">
            Add Rule
          </button>
        </div>

        <div className="grid gap-3">
          {fileOrganization.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{rule.rule}</div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{rule.triggered} files moved</span>
                    <span>•</span>
                    <span>Last action: {rule.lastAction}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">AI File Organization</div>
              <div className="text-xs text-slate-400">
                Atlas learns your file organization preferences and automatically moves files to the right folders.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}