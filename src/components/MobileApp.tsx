import { useState } from "react";
import { motion } from "motion/react";
import {
  Globe2,
  Smartphone,
  AlertCircle,
  QrCode
} from "lucide-react";
import { Button } from "./ui/button";

export function MobileApp() {
  const [showQR] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-4 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ATLAS UX
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold">MOBILE COMPANION</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Banner */}
      <div className="m-4 p-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-yellow-400 mb-1">
              Mobile Companion — Coming Soon
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The mobile app is currently in development pending Apple Developer approval.
              QR pairing with the desktop app will be available once the native app is published.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Features */}
      <div className="flex-1 p-4 space-y-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Planned Features</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">--</span>
              <span>QR code pairing with desktop Atlas UX</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">--</span>
              <span>Push notifications for job approvals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">--</span>
              <span>Remote job monitoring and approval workflow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">--</span>
              <span>Mobile chat interface with Atlas agents</span>
            </li>
          </ul>
        </div>

        {/* QR Pairing placeholder */}
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">QR Pairing</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Once the mobile app is available, you will be able to scan a QR code from
            the desktop app to pair your devices securely.
          </p>
          <Button
            disabled
            className="w-full bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
          >
            Pairing unavailable — app not yet published
          </Button>
        </div>
      </div>
    </div>
  );
}
