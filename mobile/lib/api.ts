import * as SecureStore from "expo-secure-store";

const API_BASE = "https://atlas-ux.onrender.com/v1";

let _token: string | null = null;
let _tenantId: string | null = null;

export async function loadAuth() {
  _token = await SecureStore.getItemAsync("atlas_token");
  _tenantId = await SecureStore.getItemAsync("atlas_tenant_id");
}

export async function saveAuth(token: string, tenantId: string) {
  _token = token;
  _tenantId = tenantId;
  await SecureStore.setItemAsync("atlas_token", token);
  await SecureStore.setItemAsync("atlas_tenant_id", tenantId);
}

export async function clearAuth() {
  _token = null;
  _tenantId = null;
  await SecureStore.deleteItemAsync("atlas_token");
  await SecureStore.deleteItemAsync("atlas_tenant_id");
}

export function getToken() {
  return _token;
}
export function getTenantId() {
  return _tenantId;
}

export async function api(
  path: string,
  opts: RequestInit & { skipAuth?: boolean } = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  if (!opts.skipAuth && _token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }
  if (_tenantId) {
    headers["x-tenant-id"] = _tenantId;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}
