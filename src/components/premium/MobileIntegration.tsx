import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE } from '@/lib/api';
import { useActiveTenant } from '@/lib/activeTenant';
import {
  Smartphone, Camera, Clipboard, Fingerprint,
  Mic, Image, Check, Upload, Zap,
  Link as LinkIcon, Apple, QrCode,
  Wifi, Shield, X,
} from 'lucide-react';

interface DeviceInfo { name: string; os: string }
interface PairingState {
  code:      string;
  expiresAt: string;
  status:    'pending' | 'confirmed';
  deviceInfo?: DeviceInfo | null;
}

const POLL_MS = 3000;

export function MobileIntegration() {
  const { tenantId } = useActiveTenant();
  const tid = tenantId ?? '';

  const [pairing, setPairing]           = useState<PairingState | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [showQR, setShowQR]             = useState(false);

  const [phone, setPhone]   = useState('');
  const [sending, setSending] = useState(false);
  const [smsMsg, setSmsMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Polling: check pairing status every POLL_MS when a code is pending
  useEffect(() => {
    if (!pairing || pairing.status !== 'pending' || !tid) return;

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/v1/mobile/pair/status/${pairing.code}`, {
          headers: { 'x-tenant-id': tid },
        });
        const data = await res.json().catch(() => ({}));
        if (data?.status === 'confirmed') {
          setPairing(prev => prev ? { ...prev, status: 'confirmed', deviceInfo: data.deviceInfo } : null);
        } else if (data?.status === 'expired') {
          setPairing(null);
          setShowQR(false);
        }
      } catch { /* ignore transient errors */ }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [pairing, tid]);

  const startPairing = async () => {
    if (!tid) { setPairingError('No active organisation — select one first.'); return; }
    setPairingLoading(true);
    setPairingError(null);
    try {
      const res  = await fetch(`${API_BASE}/v1/mobile/pair/start`, {
        method: 'POST',
        headers: { 'x-tenant-id': tid, 'content-type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'PAIR_START_FAILED');
      setPairing({ code: data.code, expiresAt: data.expiresAt, status: 'pending' });
      setShowQR(true);
    } catch (e: any) {
      setPairingError(e?.message ?? 'Could not start pairing.');
    } finally {
      setPairingLoading(false);
    }
  };

  const cancelPairing = async () => {
    if (!pairing) return;
    try {
      await fetch(`${API_BASE}/v1/mobile/pair/${pairing.code}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tid },
      });
    } catch { /* best-effort */ }
    setPairing(null);
    setShowQR(false);
  };

  const sendSms = async () => {
    if (!phone.trim()) return;
    setSending(true);
    setSmsMsg(null);
    const pairUrl = pairing?.code
      ? `${window.location.origin}/#/pair/${pairing.code}`
      : `${window.location.origin}/#/app/settings?tab=mobile`;
    try {
      const res  = await fetch(`${API_BASE}/v1/comms/sms`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: phone.trim(), message: `Atlas UX pairing link: ${pairUrl}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'SMS_FAILED');
      setPhone('');
      setSmsMsg({ ok: true, text: 'Link sent via SMS.' });
    } catch (e: any) {
      setSmsMsg({ ok: false, text: e?.message ?? 'Could not send SMS.' });
    } finally {
      setSending(false);
    }
  };

  const pairUrl = pairing?.code
    ? `${window.location.origin}/#/pair/${pairing.code}`
    : '';

  const isPaired = pairing?.status === 'confirmed';
  const isPending = pairing?.status === 'pending';

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">iPhone & Mobile Integration</h2>
        </div>
        <p className="text-slate-400">
          Pair your iOS device with Atlas UX for mobile approvals and on-the-go access.
        </p>
      </div>

      {/* Pairing Card */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Apple className="w-10 h-10 text-cyan-400" />
          <div>
            <h3 className="text-2xl font-bold text-white">Atlas UX Mobile Companion</h3>
            <p className="text-sm text-slate-400">iOS App — Pair your iPhone to Atlas</p>
          </div>
        </div>

        {/* Paired banner */}
        {isPaired && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-green-400">Device Paired</div>
              {pairing?.deviceInfo && (
                <div className="text-xs text-slate-400">
                  {pairing.deviceInfo.name} · {pairing.deviceInfo.os}
                </div>
              )}
            </div>
            <button
              onClick={cancelPairing}
              className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
            >
              Unpair
            </button>
          </div>
        )}

        {/* Pending banner */}
        {isPending && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-yellow-400">Waiting for device…</div>
                <button onClick={cancelPairing} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-400">
                Pairing code: <span className="font-mono text-white">{pairing?.code}</span>
                &nbsp;·&nbsp;expires {pairing?.expiresAt ? new Date(pairing.expiresAt).toLocaleTimeString() : '…'}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* QR Pairing */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Pair via QR Code</h4>
                <p className="text-xs text-slate-400">Scan from the Atlas mobile app</p>
              </div>
            </div>

            {!pairing ? (
              <button
                onClick={startPairing}
                disabled={pairingLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                {pairingLoading ? 'Starting…' : 'Generate Pairing Code'}
              </button>
            ) : (
              <button
                onClick={() => setShowQR(v => !v)}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            )}

            {pairingError && (
              <div className="mt-2 text-xs text-red-400">{pairingError}</div>
            )}

            {showQR && pairing && pairUrl && (
              <div className="mt-4 p-6 bg-white rounded-lg flex flex-col items-center">
                <QRCodeSVG value={pairUrl} size={192} />
                <p className="text-slate-900 text-sm font-medium mt-3">Scan with Atlas Mobile App</p>
                <p className="text-slate-500 text-xs font-mono mt-1">{pairing.code}</p>
              </div>
            )}
          </div>

          {/* SMS Link */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Send Link to Phone</h4>
                <p className="text-xs text-slate-400">App Store listing coming soon</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                disabled
                className="w-full px-4 py-3 opacity-40 cursor-not-allowed bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 font-semibold flex items-center justify-center gap-2"
              >
                <Apple className="w-5 h-5" />
                App Store (Coming Soon)
              </button>

              <div className="rounded-lg border border-slate-700 bg-slate-950/30 p-3">
                <div className="text-xs text-slate-400 mb-2">Send pairing link via SMS</div>
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
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
                {smsMsg && (
                  <div className={`mt-2 text-xs ${smsMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {smsMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature tiles */}
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

        {!isPaired && !isPending && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-yellow-400 mb-1">No Device Paired</div>
              <div className="text-xs text-slate-400">
                Generate a pairing code above. The Atlas mobile app will scan the QR code to complete the connection.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sync feature cards — honest state */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">iCloud Photos</h3>
              <p className="text-xs text-slate-400">Photo Library Sync</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 italic">
            {isPaired ? 'Available in the mobile app after pairing.' : 'Requires a paired device.'}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
              <Clipboard className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Universal Clipboard</h3>
              <p className="text-xs text-slate-400">Real-time Sync</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 italic">
            {isPaired ? 'Available in the mobile app after pairing.' : 'Requires a paired device.'}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">iPhone Auth</h3>
              <p className="text-xs text-slate-400">Face ID / Touch ID</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 italic">
            {isPaired ? 'Available in the mobile app after pairing.' : 'Requires a paired device.'}
          </div>
        </div>
      </div>

      {/* Future sync features */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Camera className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Camera Scanner</h3>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-400">
              Scan business cards, receipts, and documents from your iPhone. AI will extract contact
              info and import it to the CRM. Available after pairing.
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Voice Memo Transcription</h3>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
            <Upload className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-400">
              Import and transcribe voice memos from the iOS Voice Memos app.
              Summaries and action items are extracted automatically. Available after pairing.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
