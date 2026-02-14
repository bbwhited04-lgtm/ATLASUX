import { Smartphone, Check, Database } from "lucide-react";
import { useMobileConnection } from "./mobile/MobileConnectionContext";

export function MobilePairingIndicator() {
  const { status, device, openModal } = useMobileConnection();

  const isConnected = status === "connected";

  // Demo counts until real sync is wired.
  const synced = isConnected
    ? { totalItems: 487, totalSize: "2.4 GB" }
    : { totalItems: 0, totalSize: "0 B" };

  return (
    <button
      onClick={openModal}
      className={`fixed bottom-6 right-6 z-40 bg-gradient-to-br backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 ${
        isConnected
          ? "from-slate-900 to-slate-800 border-cyan-500/30 shadow-cyan-500/20 hover:shadow-cyan-500/40"
          : "from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-cyan-500/30 hover:shadow-cyan-500/50 animate-pulse"
      }`}
      aria-label="Mobile Companion"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20" : "bg-gradient-to-br from-cyan-500 to-blue-500"
            }`}
          >
            <Smartphone className={`w-5 h-5 ${isConnected ? "text-cyan-400" : "text-white"}`} />
          </div>
          {isConnected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="text-left">
          {isConnected ? (
            <>
              <div className="text-sm font-semibold text-white">{device?.name || "Mobile Device"}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <Database className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 font-medium">
                  {synced.totalItems} items • {synced.totalSize}
                </span>
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

        {isConnected ? (
          <div className="flex items-center gap-0.5 ml-2">
            <div className="w-1 h-2 bg-cyan-400 rounded-full" />
            <div className="w-1 h-3 bg-cyan-400 rounded-full" />
            <div className="w-1 h-4 bg-cyan-400 rounded-full" />
            <div className="w-1 h-5 bg-cyan-400 rounded-full" />
          </div>
        ) : (
          <div className="ml-2 text-cyan-400">→</div>
        )}
      </div>
    </button>
  );
}
