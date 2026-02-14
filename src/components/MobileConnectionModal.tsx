import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, Download, Shield, CheckCircle2, QrCode, Apple, MessageSquare, Send, Copy, Check, X, Loader2, ChevronRight } from "lucide-react";
import { useMobileConnection } from "./mobile/MobileConnectionContext";

type Step = 1 | 2 | 3 | 4;

export function MobileConnectionModal() {
  const {
    isModalOpen,
    closeModal,
    status,
    pairingCode,
    pairingUrl,
    device,
    startPairing,
    simulatePairing,
    disconnect
  } = useMobileConnection();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [telegramHandle, setTelegramHandle] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const installationLink = useMemo(() => {
    const origin = window.location.origin && window.location.origin.startsWith("http") ? window.location.origin : "https://atlasux.cloud";
    // This is a placeholder deep link until we ship real iOS/Android packages.
    return `${origin}/mobile?install=${btoa(Date.now().toString())}`;
  }, []);

  useEffect(() => {
    // Reset wizard when opened
    if (isModalOpen) setCurrentStep(1);
  }, [isModalOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = pairingUrl || installationLink;
        const url = await QRCode.toDataURL(payload, { margin: 1, width: 256 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pairingUrl, installationLink]);

  if (!isModalOpen) return null;

  const steps = [
    { n: 1 as Step, label: "Download App", icon: Download },
    { n: 2 as Step, label: "Pair Device", icon: Smartphone },
    { n: 3 as Step, label: "Grant Permissions", icon: Shield },
    { n: 4 as Step, label: "Complete", icon: CheckCircle2 }
  ];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Atlas UX Mobile Companion</h2>
                <p className="text-sm text-slate-400">Approve tasks • Receive alerts • Stay in control</p>
              </div>
            </div>

            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mt-6 relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            {steps.map((s) => {
              const Icon = s.icon;
              const isComplete = currentStep > s.n;
              const isCurrent = currentStep === s.n;
              return (
                <div key={s.n} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 border-green-500 shadow-lg shadow-green-500/50"
                        : isCurrent
                        ? "bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isComplete || isCurrent ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <span className={`text-xs font-medium ${isComplete || isCurrent ? "text-white" : "text-slate-500"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-800/50">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Download Atlas UX Mobile</h3>
                <p className="text-slate-400">Scan the QR code or tap App Store. (Demo flow until the native build ships.)</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR */}
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Scan to Download</h4>
                      <p className="text-xs text-slate-400">Opens install link</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" /> : <div className="w-56 h-56 flex items-center justify-center text-slate-400">QR unavailable</div>}
                  </div>

                  <button
                    onClick={() => copy(installationLink)}
                    className="mt-4 w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    Copy install link
                  </button>
                </div>

                {/* App store */}
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Apple className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">App Store</h4>
                      <p className="text-xs text-slate-400">When we publish, this goes live</p>
                    </div>
                  </div>

                  <a
                    href="https://apps.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Open App Store
                  </a>

                  <div className="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      Telegram option (optional)
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={telegramHandle}
                        onChange={(e) => setTelegramHandle(e.target.value)}
                        placeholder="@yourhandle"
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={() => copy(telegramHandle || "@yourhandle")}
                        className="px-3 py-2 bg-slate-950/60 hover:bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Next: we’ll wire this to a bot token + chat ID and route approvals/denies through Telegram.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Next: Pair Device <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Connect Your Phone</h3>
                <p className="text-slate-400">Scan the pairing QR or enter the code inside the mobile app.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Pair via QR</h4>
                      <p className="text-xs text-slate-400">Fastest option</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                    {qrDataUrl ? <img src={qrDataUrl} alt="Pairing QR" className="w-56 h-56" /> : <div className="w-56 h-56 flex items-center justify-center text-slate-400">QR unavailable</div>}
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    QR payload: <span className="text-slate-300 break-all">{pairingUrl || installationLink}</span>
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Enter Code</h4>
                      <p className="text-xs text-slate-400">Works offline / camera blocked</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-700 text-center">
                    <div className="text-xs text-slate-400 mb-2">Enter this code in your mobile app:</div>
                    <div className="text-3xl font-black tracking-widest text-white">{pairingCode ?? "—"}</div>
                    <div className="text-xs text-slate-500 mt-2">Code expires in 10 minutes (backend-enforced)</div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => pairingCode && copy(pairingCode)}
                      className="flex-1 px-4 py-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                      Copy Code
                    </button>
                    <button
                      onClick={() => simulatePairing()}
                      className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                      title="Demo"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Simulate
                    </button>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        await startPairing();
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {status === "pairing" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      Generate / Refresh Pair Code
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-white font-medium transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Next: Permissions <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Grant Permissions</h3>
                <p className="text-slate-400">Keep it tight: approvals + notifications first, then expand.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: "Notifications", desc: "Approve/Deny prompts on-the-go" },
                  { title: "Secure Session", desc: "Device-bound pairing token" },
                  { title: "Audit Trail", desc: "Every action logged with timestamps" }
                ].map((c) => (
                  <div key={c.title} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                    <div className="text-white font-semibold">{c.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
                  </div>
                ))}
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Security rule</div>
                    <div className="text-sm text-slate-300 mt-1">
                      Mobile companion never runs “in the store alone.” Every remote action requires a timestamp + user verification and lands in the audit log.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-white font-medium transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Finish <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-green-500/40 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">All Set</h3>
                <p className="text-slate-400">
                  {status === "connected" ? "Device connected and ready." : "Finish pairing on your phone when ready."}
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{device?.name || "No device connected"}</div>
                    <div className="text-xs text-slate-400 mt-1">{device ? `${device.os} • ${device.connection}${device.battery != null ? ` • ${device.battery}%` : ""}` : "Pair a device to enable approvals and secure controls."}</div>
                  </div>
                  {status === "connected" ? (
                    <button
                      onClick={disconnect}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 font-medium transition-all"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await startPairing();
                        setCurrentStep(2);
                      }}
                      className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all"
                    >
                      Start pairing
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-white font-medium transition-all"
                >
                  Back
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
