import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Download, Shield, CheckCircle2, QrCode, Apple, Camera, Wifi, Lock, FileText, Bell, Loader2, X, ChevronRight } from 'lucide-react';

interface MobileCompanionSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCompanionSetup({ isOpen, onClose }: MobileCompanionSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPairing, setIsPairing] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [pairingCode] = useState('AX-7K9M-2P4R');
  const downloadUrl = useMemo(() => 'https://apps.apple.com', []);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await QRCode.toDataURL(downloadUrl, { margin: 1, width: 256 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [downloadUrl]);


  if (!isOpen) return null;

  const handleStartPairing = () => {
    setIsPairing(true);
    setCurrentStep(2);
  };

  const handleSimulatePairing = () => {
    setIsPaired(true);
    setCurrentStep(4);
  };

  const handleGrantPermissions = () => {
    setCurrentStep(3);
  };

  const steps = [
    { number: 1, label: 'Download App', icon: Download },
    { number: 2, label: 'Pair Device', icon: Smartphone },
    { number: 3, label: 'Grant Permissions', icon: Shield },
    { number: 4, label: 'Complete', icon: CheckCircle2 },
  ];

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
                <p className="text-sm text-slate-400">Control Atlas from anywhere • Approve tasks on-the-go</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step) => {
              const Icon = step.icon;
              const isComplete = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500 shadow-lg shadow-green-500/50'
                      : isCurrent
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse'
                      : 'bg-slate-800 border-slate-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${isComplete || isCurrent ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-xs font-medium ${isComplete || isCurrent ? 'text-white' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-800/50">
          {/* Step 1: Download App */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Download Atlas UX Mobile</h3>
                <p className="text-slate-400">Available for iOS devices</p>
              </div>

              {/* QR Code Download */}
              <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  <div className="bg-white rounded-xl p-4 flex-shrink-0">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Atlas UX download QR" className="w-32 h-32" />
                    ) : (
                      <QrCode className="w-32 h-32 text-slate-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-3">Scan to Download</h4>
                    <p className="text-sm text-slate-400 mb-4">
                      Use your iPhone camera to scan this QR code and download Atlas UX Mobile from the App Store.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                      <Camera className="w-4 h-4" />
                      <span>Open Camera → Point at QR Code → Tap notification</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Download */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Or download manually:</h4>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <Apple className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Download on the</div>
                      <div className="text-lg font-semibold text-white">App Store</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </a>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <Bell className="w-8 h-8 text-cyan-400 mb-2" />
                  <h5 className="text-sm font-semibold text-white mb-1">Push Notifications</h5>
                  <p className="text-xs text-slate-400">Get instant alerts for task approvals</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <FileText className="w-8 h-8 text-blue-400 mb-2" />
                  <h5 className="text-sm font-semibold text-white mb-1">File Upload</h5>
                  <p className="text-xs text-slate-400">Upload photos & documents anywhere</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <Wifi className="w-8 h-8 text-purple-400 mb-2" />
                  <h5 className="text-sm font-semibold text-white mb-1">Real-time Sync</h5>
                  <p className="text-xs text-slate-400">Stay synced across all devices</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <Lock className="w-8 h-8 text-green-400 mb-2" />
                  <h5 className="text-sm font-semibold text-white mb-1">Secure Access</h5>
                  <p className="text-xs text-slate-400">Enterprise-grade encryption</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pair Device */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Pair Your Device</h3>
                <p className="text-slate-400">Enter this code in the Atlas UX Mobile app</p>
              </div>

              {/* Pairing Code Display */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    <span className="text-sm text-cyan-400 font-medium">Waiting for mobile app...</span>
                  </div>
                  <div className="bg-slate-900/50 border-2 border-cyan-500/50 rounded-xl p-6 inline-block">
                    <div className="text-5xl font-bold text-white tracking-widest font-mono">
                      {pairingCode}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">Code expires in 10 minutes</p>
                </div>
              </div>

              {/* QR Code Alternative */}
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-4">Or scan this QR code in the app:</p>
                  <div className="bg-white rounded-xl p-4 inline-block">
                    <QrCode className="w-40 h-40 text-slate-900" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-2">On your mobile device:</h5>
                    <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open Atlas UX Mobile app</li>
                      <li>Sign in with your account</li>
                      <li>Tap "Pair with Desktop"</li>
                      <li>Enter the code shown above or scan QR code</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Demo Button */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-3">
                      For demo purposes, simulate the mobile app connecting:
                    </p>
                    <button
                      onClick={handleSimulatePairing}
                      className="w-full px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-400 text-sm font-medium transition-colors"
                    >
                      Simulate Mobile Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Grant Permissions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Grant App Permissions</h3>
                <p className="text-slate-400">Allow Atlas UX Mobile to access device features</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <div>
                    <div className="text-sm font-semibold text-green-400">Device Paired Successfully!</div>
                    <div className="text-xs text-slate-400">Now let's set up permissions</div>
                  </div>
                </div>
              </div>

              {/* Permission Cards */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1">Notifications</h5>
                        <p className="text-xs text-slate-400">Receive alerts for task approvals and job updates</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="text-xs font-semibold text-green-400">Required</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1">Camera & Photos</h5>
                        <p className="text-xs text-slate-400">Upload images and scan documents</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                      <span className="text-xs font-semibold text-cyan-400">Recommended</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1">Files & Storage</h5>
                        <p className="text-xs text-slate-400">Access and upload documents from your device</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                      <span className="text-xs font-semibold text-cyan-400">Recommended</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permission Instructions */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-2">How to grant permissions:</h5>
                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                      <li>The app will prompt you for each permission</li>
                      <li>Tap "Allow" when prompted</li>
                      <li>You can change these later in Settings → Atlas UX</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/50">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">All Set!</h3>
                <p className="text-slate-400">Your mobile companion is ready to use</p>
              </div>

              {/* Connected Device Info */}
              <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">iPhone 15 Pro</div>
                      <div className="text-xs text-slate-400">iOS 18.2 • Connected via Wi-Fi</div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-xs font-semibold text-green-400">Connected</span>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">What you can do now:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">Approve tasks on-the-go</div>
                      <div className="text-xs text-slate-400 mt-0.5">Review and approve Atlas tasks from your phone</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">Monitor job progress</div>
                      <div className="text-xs text-slate-400 mt-0.5">Track Pluto jobs in real-time from anywhere</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">Upload files instantly</div>
                      <div className="text-xs text-slate-400 mt-0.5">Share photos and documents directly to Atlas</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">Get instant notifications</div>
                      <div className="text-xs text-slate-400 mt-0.5">Never miss important updates or approvals</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-cyan-400 mb-2">💡 Quick Tips:</h5>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Check the mobile indicator in bottom right to see sync status</li>
                  <li>Enable notifications for instant task alerts</li>
                  <li>Use Face ID/Touch ID for quick access</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900/50 border-t border-cyan-500/30 p-6">
          <div className="flex gap-3">
            {currentStep < 4 ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors"
                >
                  {currentStep === 1 ? 'Close' : 'Cancel'}
                </button>
                {currentStep === 1 && (
                  <button
                    onClick={handleStartPairing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-cyan-500/30"
                  >
                    I've Downloaded the App
                  </button>
                )}
                {currentStep === 3 && (
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-cyan-500/30"
                  >
                    Permissions Granted
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-lg text-white font-medium transition-all shadow-lg shadow-green-500/30"
              >
                Start Using Mobile Companion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
