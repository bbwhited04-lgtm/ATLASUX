export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type Connection = {
  providerKey: string;
  status: ConnectionStatus;
  accountLabel?: string;   // e.g. "billy@gmail.com"
  connectedAt?: string;    // ISO string
  lastError?: string;
};

const KEY = "atlasux.connections.v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, Connection> {
  const parsed = safeParse<Record<string, Connection>>(localStorage.getItem(KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeAll(map: Record<string, Connection>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getConnection(providerKey: string): Connection | null {
  const all = readAll();
  return all[providerKey] ?? null;
}

export function setConnection(conn: Connection) {
  const all = readAll();
  all[conn.providerKey] = conn;
  writeAll(all);
}

export function clearConnection(providerKey: string) {
  const all = readAll();
  delete all[providerKey];
  writeAll(all);
}
