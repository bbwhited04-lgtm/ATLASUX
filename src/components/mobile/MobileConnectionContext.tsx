import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { API_BASE } from "../../lib/api";

export type MobilePairStatus = "disconnected" | "pairing" | "connected";

export type MobileDeviceInfo = {
  name: string;
  os: string;
  connection: "Wi‑Fi" | "Bluetooth" | "USB" | "Unknown";
  battery?: number;
};

type MobileConnectionState = {
  status: MobilePairStatus;
  pairingCode: string | null;
  pairingUrl: string | null;
  device: MobileDeviceInfo | null;

  // UI helpers
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  // actions
  startPairing: () => Promise<void>;
  simulatePairing: () => void;
  disconnect: () => void;
};

const MobileConnectionCtx = createContext<MobileConnectionState | null>(null);

function generateLocalCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `AX-${chunk(4)}-${chunk(4)}`;
}

export function MobileConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<MobilePairStatus>("disconnected");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingUrl, setPairingUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<MobileDeviceInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const startPairing = useCallback(async () => {
    setStatus("pairing");

    // Try backend first (real-ish flow). Fallback to local-only demo if backend isn't running.
    try {
      const tid = localStorage.getItem("atlas_active_tenant_id") ?? "";
      const res = await fetch(`${API_BASE}/v1/mobile/pair/start`, {
        method: "POST",
        headers: tid ? { "x-tenant-id": tid } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "pair_start_failed");
      setPairingCode(String(data.code));
      setPairingUrl(String(data.pair_url));
      return;
    } catch {
      const code = generateLocalCode();
      const origin = window.location.origin && window.location.origin.startsWith("http") ? window.location.origin : "https://atlasux.cloud";
      setPairingCode(code);
      setPairingUrl(`${origin}/mobile/pair?code=${encodeURIComponent(code)}`);
    }
  }, []);

  const simulatePairing = useCallback(() => {
    setStatus("connected");
    setDevice({
      name: "iPhone 15 Pro",
      os: "iOS 18.2",
      connection: "Wi‑Fi",
      battery: 87
    });
    setIsModalOpen(false);
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setPairingCode(null);
    setPairingUrl(null);
    setDevice(null);
    setIsModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      status,
      pairingCode,
      pairingUrl,
      device,
      isModalOpen,
      openModal,
      closeModal,
      startPairing,
      simulatePairing,
      disconnect
    }),
    [status, pairingCode, pairingUrl, device, isModalOpen, openModal, closeModal, startPairing, simulatePairing, disconnect]
  );

  return <MobileConnectionCtx.Provider value={value}>{children}</MobileConnectionCtx.Provider>;
}

export function useMobileConnection() {
  const ctx = useContext(MobileConnectionCtx);
  if (!ctx) throw new Error("useMobileConnection must be used within MobileConnectionProvider");
  return ctx;
}
