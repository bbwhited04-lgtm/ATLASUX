import { useMemo, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { 
  Smartphone, Camera, Clipboard, Download, Fingerprint, 
  Mic, Users as ContactsIcon, Image, FolderOpen, Check,
  Upload, Zap, RefreshCw, Link as LinkIcon, Apple, QrCode,
  Wifi, Shield, ArrowRight
} from 'lucide-react';

export function MobileIntegration() {
  const [iCloudStatus, setICloudStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [syncedPhotos, setSyncedPhotos] = useState(0);
  const [clipboardSynced, setClipboardSynced] = useState(false);
  const [voiceMemos, setVoiceMemos] = useState<any[]>([]);
  const [scannedDocs, setScannedDocs] = useState<any[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const installUrl = useMemo(() => {
    // Placeholder until App Store/TestFlight is live.
    // This should point to a landing page you control.
    return `${window.location.origin}/#/app/settings?tab=mobile`;
  }, []);

  const connectiCloud = () => {
    setICloudStatus('connected');
    setSyncedPhotos(4832);
    setTimeout(() => {
      setSyncedPhotos(4835);
    }, 2000);
  };

  const sendSms = async () => {
    if (!phone.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/v1/comms/sms`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          to: phone.trim(),
          message: `Atlas UX Mobile Companion install link: ${installUrl}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'SMS_FAILED');
      setPhone('');
      // Keep it dependency-free in this file.
      alert('Text queued (stub). Wire SMS provider when ready.');
    } catch (e: any) {
      alert(e?.message ?? 'Could not send SMS');
    } finally {
      setSending(false);
    }
  };

  const mockPhotos = [
    { id: 1, name: 'Business Card - John Doe.jpg', date: '2 hours ago', size: '2.3 MB' },
    { id: 2, name: 'Product Screenshot.png', date: '5 hours ago', size: '1.1 MB' },
    { id: 3, name: 'Meeting Whiteboard.jpg', date: 'Yesterday', size: '3.7 MB' },
    { id: 4, name: 'Receipt - Office Depot.jpg', date: '2 days ago', size: '856 KB' },
  ];

  const mockMemos = [
    { id: 1, name: 'Meeting notes - Q1 Planning', duration: '5:32', date: '1 hour ago', transcribed: true },
    { id: 2, name: 'Client call ideas', duration: '2:14', date: '3 hours ago', transcribed: true },
    { id: 3, name: 'Product feedback', duration: '4:08', date: 'Yesterday', transcribed: false },
  ];

  const mockScans = [
    { id: 1, name: 'Business Card - Sarah Chen', type: 'Contact', date: '30 mins ago', imported: true },
    { id: 2, name: 'Contract - Page 1-5', type: 'Document', date: '2 hours ago', imported: false },
    { id: 3, name: 'Expense Receipt', type: 'Receipt', date: '4 hours ago', imported: true },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">iPhone & Mobile Integration</h2>
        </div>
        <p className="text-slate-400">
          Deep integration with your iOS devices for seamless productivity
        </p>
      </div>

      {/* Mobile Companion App Install */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Apple className="w-10 h-10 text-cyan-400" />
              <div>
                <h3 className="text-2xl font-bold text-white">Atlas UX Mobile Companion</h3>
                <p className="text-sm text-slate-400">iOS App for iPhone & iPad</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">
              Install the companion app to unlock approval requests, mobile tracking, voice commands, and seamless sync with your desktop.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* QR Code Install */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Scan QR Code</h4>
                <p className="text-xs text-slate-400">Quick install from iPhone</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            {showQR && (
              <div className="mt-4 p-6 bg-white rounded-lg flex flex-col items-center">
                <div className="w-48 h-48 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <QrCode className="w-32 h-32 text-white" />
                </div>
                <p className="text-slate-900 text-sm font-medium">Scan with iPhone Camera</p>
                <p className="text-slate-600 text-xs">Opens App Store directly</p>
              </div>
            )}
          </div>

          {/* Direct Link Install */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Direct Link</h4>
                <p className="text-xs text-slate-400">Send to your iPhone</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 font-semibold transition-all flex items-center justify-center gap-2">
                <Apple className="w-5 h-5" />
                Open in App Store
              </button>
              
              <button
                onClick={() => navigator.clipboard.writeText(installUrl)}
                className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Copy Install Link
              </button>

              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/30 p-3">
                <div className="text-xs text-slate-400 mb-2">Send link via text (SMS)</div>
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 555 5555"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-200 text-sm outline-none"
                  />
                  <button
                    disabled={sending || !phone.trim()}
                    onClick={sendSms}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-200 text-sm"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-cyan-500/20 rounded-lg p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">Approve Requests</div>
            <div className="text-xs text-slate-400">2FA for sensitive operations</div>
          </div>

          <div className="bg-slate-900/30 border border-cyan-500/20 rounded-lg p-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">Track Activity</div>
            <div className="text-xs text-slate-400">Monitor Atlas on-the-go</div>
          </div>

          <div className="bg-slate-900/30 border border-cyan-500/20 rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <Mic className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">Voice Commands</div>
            <div className="text-xs text-slate-400">Control via Siri shortcuts</div>
          </div>

          <div className="bg-slate-900/30 border border-cyan-500/20 rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Wifi className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">Real-time Sync</div>
            <div className="text-xs text-slate-400">Instant updates across devices</div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-yellow-400 mb-1">Pairing Required</div>
            <div className="text-xs text-slate-400">
              After installing the app, return here to pair your iPhone with Atlas UX. You'll receive a 6-digit pairing code on your mobile device.
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">iCloud Photos</h3>
                <p className="text-xs text-slate-400">Photo Library Sync</p>
              </div>
            </div>
          </div>
          {iCloudStatus === 'connected' ? (
            <div>
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <Check className="w-4 h-4" />
                <span>Connected</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">{syncedPhotos.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Photos synced</div>
            </div>
          ) : (
            <button
              onClick={connectiCloud}
              className="w-full mt-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm transition-colors"
            >
              Connect iCloud
            </button>
          )}
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                <Clipboard className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Universal Clipboard</h3>
                <p className="text-xs text-slate-400">Real-time Sync</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <Check className="w-4 h-4" />
            <span>Active</span>
          </div>
          <div className="text-xs text-slate-400">
            Copy on iPhone, paste in Atlas instantly
          </div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">iPhone Auth</h3>
                <p className="text-xs text-slate-400">Face ID / Touch ID</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <Check className="w-4 h-4" />
            <span>Configured</span>
          </div>
          <div className="text-xs text-slate-400">
            Secure authentication via iPhone
          </div>
        </div>
      </div>

      {/* Recent iCloud Photos */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Recent iCloud Photos</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Now
          </button>
        </div>

        <div className="grid gap-3">
          {mockPhotos.map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">{photo.name}</div>
                  <div className="text-sm text-slate-400">{photo.date} • {photo.size}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                  Import
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* iPhone Camera Scanner */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">iPhone Camera Scanner</h3>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Scan Now (Open iPhone)
          </button>
        </div>

        <div className="grid gap-3">
          {mockScans.map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">{scan.name}</div>
                  <div className="text-sm text-slate-400">{scan.type} • {scan.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {scan.imported ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Imported to CRM</span>
                  </div>
                ) : (
                  <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                    Import to CRM
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-400 mb-1">Smart Recognition</div>
              <div className="text-xs text-slate-400">
                AI automatically detects business cards, receipts, and documents. Contact information is extracted and imported to CRM.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Memo Import & Transcription */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Voice Memo Transcription</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import from iPhone
          </button>
        </div>

        <div className="grid gap-3">
          {mockMemos.map((memo) => (
            <div
              key={memo.id}
              className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{memo.name}</div>
                  <div className="text-sm text-slate-400">{memo.duration} • {memo.date}</div>
                  {memo.transcribed && (
                    <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-300">
                      <strong>AI Summary:</strong> Discussion about Q1 planning objectives, budget allocation, and team resource requirements. Action items identified for follow-up.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {memo.transcribed ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Transcribed</span>
                  </div>
                ) : (
                  <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
                    Transcribe
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AirDrop Integration */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">AirDrop Integration</h3>
        </div>
        
        <div className="p-6 bg-slate-950/50 rounded-lg border border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-white font-semibold mb-2">Ready to Receive</div>
          <div className="text-sm text-slate-400 mb-4">
            Send files from your iPhone or Mac directly to Atlas using AirDrop
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Atlas UX is discoverable</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/30 rounded-lg border border-slate-700/30">
            <div className="text-2xl font-bold text-cyan-400 mb-1">147</div>
            <div className="text-xs text-slate-400">Files received today</div>
          </div>
          <div className="p-4 bg-slate-950/30 rounded-lg border border-slate-700/30">
            <div className="text-2xl font-bold text-cyan-400 mb-1">3,892</div>
            <div className="text-xs text-slate-400">Total files via AirDrop</div>
          </div>
        </div>
      </div>

      {/* Contact Photo Sync */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ContactsIcon className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Contact Photo Sync</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Contacts
          </button>
        </div>

        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">
                Auto-Sync Enabled
              </div>
              <div className="text-xs text-slate-400">
                Profile pictures from your iPhone contacts are automatically synced to Atlas CRM
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">847</div>
              <div className="text-xs text-slate-400">Contacts synced</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}