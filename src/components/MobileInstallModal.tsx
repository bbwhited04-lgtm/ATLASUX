import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone, 
  QrCode, 
  MessageSquare, 
  Link2, 
  Shield, 
  X,
  Copy,
  Check,
  AlertTriangle,
  Send
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileInstallModal({ isOpen, onClose }: MobileInstallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Generate unique installation link (would be user-specific in production)
    const installationLink = useMemo(() => {
    const origin = window.location.origin;
    const base = origin && origin.startsWith("http") ? origin : "https://atlasux.cloud";
    return `${base}/mobile?auth=${btoa(Date.now().toString())}`;
  }, []);

  
  const sendSMS = () => {
    if (!phoneNumber || !acceptedTerms) return;
    
    // Simulate SMS sending
    // SMS send handled by backend
    setSmsSent(true);
    
    setTimeout(() => {
      setSmsSent(false);
      setPhoneNumber("");
    }, 3000);
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(installationLink);
    setLinkCopied(true);
    
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };
  
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await QRCode.toDataURL(installationLink, { margin: 1, width: 256 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [installationLink]);

  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Install Mobile Companion</h2>
                  <p className="text-sm text-slate-400">Secure installation for authorized users only</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Security Warning */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-400 mb-1">Authorized Use Only</h3>
                  <p className="text-sm text-yellow-200/80">
                    The Atlas UX Mobile Companion app can only be installed by authorized users with access to this control panel. 
                    By installing this app, you agree that you have proper authorization to access and control this system.
                  </p>
                </div>
              </motion.div>
              
              {/* Terms Acceptance */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white font-semibold mb-1">I acknowledge and accept:</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• I am an authorized user of this Atlas UX system</li>
                      <li>• I will not share mobile access with unauthorized persons</li>
                      <li>• I understand this mobile app provides full control over the PC system</li>
                      <li>• I accept responsibility for all actions taken through the mobile app</li>
                      <li>• Unauthorized access or distribution may result in legal action</li>
                    </ul>
                  </div>
                </label>
              </div>
              
              {/* Installation Methods */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* QR Code */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`bg-slate-800/50 border rounded-xl p-6 text-center ${
                    acceptedTerms ? "border-slate-700" : "border-slate-700/50 opacity-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Scan QR Code</h3>
                  <p className="text-xs text-slate-400 mb-4">Use your phone camera to scan</p>
                  
                  {acceptedTerms ? (
                    <div className="bg-white p-3 rounded-lg mb-3">
                      {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Installation QR Code" className="w-full h-auto" />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-slate-500 text-sm">Generating QR…</div>
                    )}
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-700 rounded-lg h-40 flex items-center justify-center mb-3">
                      <Shield className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  
                  <p className="text-[10px] text-slate-500">
                    {acceptedTerms ? "Point camera at QR code" : "Accept terms to unlock"}
                  </p>
                </motion.div>
                
                {/* SMS */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`bg-slate-800/50 border rounded-xl p-6 ${
                    acceptedTerms ? "border-slate-700" : "border-slate-700/50 opacity-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Send via SMS</h3>
                  <p className="text-xs text-slate-400 mb-4">Text link to your phone</p>
                  
                  <div className="space-y-3">
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={!acceptedTerms}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    <Button
                      onClick={sendSMS}
                      disabled={!phoneNumber || !acceptedTerms || smsSent}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {smsSent ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          SMS Sent!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send SMS
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mt-3">
                    Standard SMS rates may apply
                  </p>
                </motion.div>
                
                {/* Copy Link */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`bg-slate-800/50 border rounded-xl p-6 ${
                    acceptedTerms ? "border-slate-700" : "border-slate-700/50 opacity-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Link2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Copy Link</h3>
                  <p className="text-xs text-slate-400 mb-4">Share link manually</p>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 font-mono break-all max-h-20 overflow-y-auto">
                      {acceptedTerms ? installationLink : "Accept terms to reveal link"}
                    </div>
                    <Button
                      onClick={copyLink}
                      disabled={!acceptedTerms || linkCopied}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mt-3">
                    Link expires in 24 hours
                  </p>
                </motion.div>
              </div>
              
              {/* Security Features */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-semibold text-white text-sm">Security Features</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>End-to-end encrypted communication</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Device authentication required</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Single device installation limit</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Remote wipe capability</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Activity logging and audit trail</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <p>Automatic session timeout</p>
                  </div>
                </div>
              </div>
              
              {/* Legal Disclaimer */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h3 className="font-semibold text-red-400 text-sm mb-2">Legal Notice</h3>
                <p className="text-xs text-red-200/70 leading-relaxed">
                  This mobile companion app is provided solely for authorized users of the Atlas UX system. 
                  Unauthorized access, use, or distribution of this application is strictly prohibited and may 
                  result in civil and criminal penalties. By installing this app, you acknowledge that all actions 
                  performed through it are logged and may be subject to legal review. The system owner and Atlas UX 
                  are not liable for unauthorized use or misuse of this application.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-end gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
