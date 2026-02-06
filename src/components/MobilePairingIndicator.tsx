import { useState } from 'react';
import { Smartphone, Wifi, Check, Info, X, Database, FileText, Image, Users, CheckCircle2, Calendar, Mail, QrCode, Loader2 } from 'lucide-react';

export function MobilePairingIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [isWaitingForPairing, setIsWaitingForPairing] = useState(false);
  const [pairingCode] = useState('AX-7K9M-2P4R'); // Generated pairing code

  // Synced data statistics - only populated when paired
  const syncedData = isPaired ? {
    photos: 127,
    files: 34,
    contacts: 89,
    tasks: 42,
    notes: 16,
    calendar: 23,
    emails: 156,
    totalSize: '2.4 GB'
  } : {
    photos: 0,
    files: 0,
    contacts: 0,
    tasks: 0,
    notes: 0,
    calendar: 0,
    emails: 0,
    totalSize: '0 B'
  };

  const totalItems = syncedData.photos + syncedData.files + syncedData.contacts + 
                     syncedData.tasks + syncedData.notes + syncedData.calendar + syncedData.emails;

  const handleConnect = () => {
    setIsWaitingForPairing(true);
    // In a real app, this would wait for the mobile app to connect
    // For demo purposes, we'll just show the waiting state
  };

  const handleCancelPairing = () => {
    setIsWaitingForPairing(false);
    setIsExpanded(false);
  };

  const handleSimulateMobileConnection = () => {
    // This simulates the mobile app connecting (for demo purposes)
    setIsWaitingForPairing(false);
    setIsPaired(true);
    setIsExpanded(false);
  };

  const handleDisconnect = () => {
    setIsPaired(false);
    setIsWaitingForPairing(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Main Indicator Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-6 right-6 z-40 bg-gradient-to-br backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 ${
          isPaired 
            ? 'from-slate-900 to-slate-800 border-cyan-500/30 shadow-cyan-500/20 hover:shadow-cyan-500/40'
            : 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-cyan-500/30 hover:shadow-cyan-500/50 animate-pulse'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Phone Icon */}
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPaired 
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'
                : 'bg-gradient-to-br from-cyan-500 to-blue-500'
            }`}>
              <Smartphone className={`w-5 h-5 ${isPaired ? 'text-cyan-400' : 'text-white'}`} />
            </div>
            {/* Connected Indicator */}
            {isPaired && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Status Info */}
          <div className="text-left">
            {isPaired ? (
              <>
                <div className="text-sm font-semibold text-white">iPhone 15 Pro</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">{totalItems} items • {syncedData.totalSize}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-white">Connect Your Phone</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-cyan-400 font-medium">Tap to pair device</span>
                </div>
              </>
            )}
          </div>

          {/* Signal Strength or Connect Arrow */}
          {isPaired ? (
            <div className="flex items-center gap-0.5 ml-2">
              <div className="w-1 h-2 bg-cyan-400 rounded-full" />
              <div className="w-1 h-3 bg-cyan-400 rounded-full" />
              <div className="w-1 h-4 bg-cyan-400 rounded-full" />
              <div className="w-1 h-5 bg-cyan-400 rounded-full" />
            </div>
          ) : (
            <div className="ml-2 text-cyan-400">
              →
            </div>
          )}
        </div>
      </button>

      {/* Expanded Details Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-800/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isPaired 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    : 'bg-gradient-to-br from-orange-500 to-amber-500'
                }`}>
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isPaired ? 'Mobile Device' : 'Connect Your Phone'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isPaired ? 'iPhone 15 Pro' : 'Pair your mobile device'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPaired ? (
              <>
                {/* Status Card - Connected */}
                <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-400">Connected & Synced</div>
                      <div className="text-xs text-slate-400">All systems operational</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span>Last sync: Just now</span>
                  </div>
                </div>

                {/* Device Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-xs text-slate-400">Device Name</span>
                    <span className="text-xs text-white font-medium">iPhone 15 Pro</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-xs text-slate-400">OS Version</span>
                    <span className="text-xs text-white font-medium">iOS 18.2</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-xs text-slate-400">Connection Type</span>
                    <span className="text-xs text-white font-medium">Wi-Fi</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-xs text-slate-400">Battery</span>
                    <span className="text-xs text-green-400 font-medium">87%</span>
                  </div>
                </div>

                {/* Sync Features */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-cyan-400 mb-1">Synced Features</div>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <div>✓ Task approvals & notifications</div>
                        <div>✓ Real-time job monitoring</div>
                        <div>✓ Mobile request tracking</div>
                        <div>✓ File access & uploads</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synced Data Statistics */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-sm font-semibold text-white">Synced Data</div>
                        <div className="text-xs text-slate-400">{syncedData.totalSize} total</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                      <span className="text-xs font-semibold text-cyan-400">{totalItems} items</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <Image className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-xs text-slate-400">Photos</div>
                        <div className="text-sm font-semibold text-white">{syncedData.photos}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-xs text-slate-400">Files</div>
                        <div className="text-sm font-semibold text-white">{syncedData.files}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <Users className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-xs text-slate-400">Contacts</div>
                        <div className="text-sm font-semibold text-white">{syncedData.contacts}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs text-slate-400">Tasks</div>
                        <div className="text-sm font-semibold text-white">{syncedData.tasks}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <FileText className="w-4 h-4 text-yellow-400" />
                      <div>
                        <div className="text-xs text-slate-400">Notes</div>
                        <div className="text-sm font-semibold text-white">{syncedData.notes}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="text-xs text-slate-400">Calendar</div>
                        <div className="text-sm font-semibold text-white">{syncedData.calendar}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg col-span-2">
                      <Mail className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-xs text-slate-400">Emails</div>
                        <div className="text-sm font-semibold text-white">{syncedData.emails}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : isWaitingForPairing ? (
              <>
                {/* Waiting for Pairing State */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-cyan-400">Waiting for Mobile App...</div>
                      <div className="text-xs text-slate-400">Open Atlas UX on your phone</div>
                    </div>
                  </div>
                </div>

                {/* Pairing Code Display */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-5 mb-4">
                  <div className="text-center mb-4">
                    <div className="text-xs text-slate-400 mb-2">Enter this code in your mobile app:</div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-xl p-4 mb-3">
                      <div className="text-3xl font-bold text-white tracking-wider font-mono">
                        {pairingCode}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">Code expires in 10 minutes</div>
                  </div>
                </div>

                {/* QR Code Option */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-3">Or scan with your phone:</div>
                    <div className="bg-white rounded-lg p-4 inline-block">
                      <QrCode className="w-32 h-32 text-slate-900" />
                    </div>
                    <div className="text-xs text-slate-500 mt-3">Scan to download & pair</div>
                  </div>
                </div>

                {/* Demo Helper Button */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-2">
                        For demo purposes, click the button below to simulate mobile app connection:
                      </div>
                      <button
                        onClick={handleSimulateMobileConnection}
                        className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-400 text-xs font-medium transition-colors"
                      >
                        Simulate Mobile Connection
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Not Connected - Pairing Instructions */}
                <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-orange-400">No Device Connected</div>
                      <div className="text-xs text-slate-400">Pair your phone to get started</div>
                    </div>
                  </div>
                </div>

                {/* Pairing Instructions */}
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-white mb-3">How to Connect:</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">Download Atlas UX Mobile</div>
                        <div className="text-xs text-slate-400 mt-1">Available on iOS App Store</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">Open the mobile app</div>
                        <div className="text-xs text-slate-400 mt-1">Sign in with your Atlas UX account</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">Tap "Pair with Desktop"</div>
                        <div className="text-xs text-slate-400 mt-1">Click connect below to generate a pairing code</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-cyan-400 mb-1">What you'll get:</div>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <div>• Approve tasks from anywhere</div>
                        <div>• Get real-time notifications</div>
                        <div>• Monitor job progress on-the-go</div>
                        <div>• Upload files from your phone</div>
                        <div>• Sync contacts, photos, and calendar</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isWaitingForPairing ? (
                <>
                  <button
                    onClick={handleCancelPairing}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={isPaired ? handleDisconnect : handleConnect}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isPaired
                        ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                    }`}
                  >
                    {isPaired ? 'Disconnect' : 'Connect'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}