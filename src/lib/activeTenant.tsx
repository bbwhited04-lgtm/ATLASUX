import * as React from "react";

type ActiveTenantContextValue = {
  tenantId: string | null;
  setTenantId: (id: string | null) => void;
};

const ActiveTenantContext = React.createContext<ActiveTenantContextValue | null>(null);

const STORAGE_KEY = "atlas_active_tenant_id";

export function ActiveTenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantIdState] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setTenantId = React.useCallback((id: string | null) => {
    setTenantIdState(id);
    try {
      if (!id) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = React.useMemo(() => ({ tenantId, setTenantId }), [tenantId, setTenantId]);

  return <ActiveTenantContext.Provider value={value}>{children}</ActiveTenantContext.Provider>;
}

export function useActiveTenant() {
  const ctx = React.useContext(ActiveTenantContext);
  if (!ctx) {
    // Provider not mounted: degrade gracefully.
    return { tenantId: null as string | null, setTenantId: (_: string | null) => {} };
  }
  return ctx;
}
