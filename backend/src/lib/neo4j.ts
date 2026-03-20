/**
 * Neo4j driver singleton for GraphRAG knowledge graph.
 * Configurable via NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD env vars.
 *
 * Gracefully degrades: if NEO4J_URI is not set, functions return
 * clear error messages instead of crashing.
 */

import neo4j, { Driver, Session } from "neo4j-driver";
import { loadEnv } from "../env.js";

// ── Lazy singleton ──────────────────────────────────────────────────────────

let _driver: Driver | null = null;

function env() {
  return loadEnv(process.env);
}

/**
 * Returns the Neo4j driver singleton, creating it on first call.
 * Throws if NEO4J_URI is not configured.
 */
export function getDriver(): Driver {
  if (_driver) return _driver;

  const e = env();
  const uri = e.NEO4J_URI;
  if (!uri) {
    throw new Error(
      "Neo4j not configured: NEO4J_URI environment variable is not set. " +
      "Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD to enable GraphRAG."
    );
  }

  const user = e.NEO4J_USER ?? "neo4j";
  const password = e.NEO4J_PASSWORD ?? "";

  _driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30_000,
  });

  return _driver;
}

/**
 * Returns a new Neo4j session from the driver singleton.
 * Caller is responsible for closing the session when done.
 */
export function getSession(): Session {
  return getDriver().session();
}

/**
 * Gracefully closes the Neo4j driver. Call on process shutdown.
 */
export async function closeDriver(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}

export interface Neo4jHealthResult {
  ok: boolean;
  nodeCount?: number;
  edgeCount?: number;
  error?: string;
}

/**
 * Health check — returns node/edge counts or error details.
 */
export async function healthCheck(): Promise<Neo4jHealthResult> {
  const e = env();
  if (!e.NEO4J_URI) {
    return { ok: false, error: "NEO4J_URI not configured" };
  }

  let session: Session | null = null;
  try {
    session = getSession();

    const nodeResult = await session.run("MATCH (n) RETURN count(n) AS cnt");
    const nodeCount = (nodeResult.records[0]?.get("cnt") as neo4j.Integer).toNumber();

    const edgeResult = await session.run("MATCH ()-[r]->() RETURN count(r) AS cnt");
    const edgeCount = (edgeResult.records[0]?.get("cnt") as neo4j.Integer).toNumber();

    return { ok: true, nodeCount, edgeCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    if (session) await session.close();
  }
}
