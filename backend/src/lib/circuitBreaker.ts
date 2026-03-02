/**
 * Circuit breaker for LLM providers.
 *
 * Tracks consecutive failures per provider and temporarily skips
 * providers that are repeatedly failing (open circuit).
 *
 * States:
 *   CLOSED   — healthy, all calls pass through
 *   OPEN     — failing, calls are skipped (fast-fail)
 *   HALF_OPEN — cooldown expired, next call is a test
 *
 * Config (per provider):
 *   failureThreshold: 5 consecutive failures → open circuit
 *   cooldownMs: 60_000 (1 min) → transition to half-open
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ProviderCircuit {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureAt: number;   // Date.now() timestamp
  openedAt: number | null; // when circuit opened
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 60_000,
};

const circuits = new Map<string, ProviderCircuit>();

function getOrCreate(provider: string): ProviderCircuit {
  let circuit = circuits.get(provider);
  if (!circuit) {
    circuit = {
      state: "CLOSED",
      consecutiveFailures: 0,
      lastFailureAt: 0,
      openedAt: null,
    };
    circuits.set(provider, circuit);
  }
  return circuit;
}

/**
 * Check if a provider's circuit is open (should be skipped).
 * Also handles OPEN → HALF_OPEN transition when cooldown expires.
 */
export function isOpen(provider: string): boolean {
  const circuit = getOrCreate(provider);

  if (circuit.state === "CLOSED") return false;
  if (circuit.state === "HALF_OPEN") return false; // allow the test call

  // OPEN — check if cooldown has expired
  if (circuit.state === "OPEN" && circuit.openedAt) {
    const elapsed = Date.now() - circuit.openedAt;
    if (elapsed >= DEFAULT_CONFIG.cooldownMs) {
      circuit.state = "HALF_OPEN";
      return false; // allow one test call
    }
  }

  return true; // still OPEN
}

/**
 * Record a successful call — resets the circuit to CLOSED.
 */
export function recordSuccess(provider: string): void {
  const circuit = getOrCreate(provider);
  circuit.state = "CLOSED";
  circuit.consecutiveFailures = 0;
  circuit.openedAt = null;
}

/**
 * Record a failed call — increments failure count,
 * may trip the circuit to OPEN.
 */
export function recordFailure(provider: string): void {
  const circuit = getOrCreate(provider);
  circuit.consecutiveFailures += 1;
  circuit.lastFailureAt = Date.now();

  // HALF_OPEN test call failed → back to OPEN
  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
    return;
  }

  // CLOSED → check threshold
  if (circuit.consecutiveFailures >= DEFAULT_CONFIG.failureThreshold) {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
  }
}

/**
 * Get the full state of all tracked providers.
 * Used by the health endpoint.
 */
export function getState(): Record<string, {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureAt: string | null;
  openedAt: string | null;
}> {
  const result: Record<string, any> = {};
  for (const [provider, circuit] of circuits) {
    // Re-check OPEN → HALF_OPEN transition for accurate reporting
    if (circuit.state === "OPEN" && circuit.openedAt) {
      const elapsed = Date.now() - circuit.openedAt;
      if (elapsed >= DEFAULT_CONFIG.cooldownMs) {
        circuit.state = "HALF_OPEN";
      }
    }
    result[provider] = {
      state: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      lastFailureAt: circuit.lastFailureAt ? new Date(circuit.lastFailureAt).toISOString() : null,
      openedAt: circuit.openedAt ? new Date(circuit.openedAt).toISOString() : null,
    };
  }
  return result;
}

/**
 * Reset a specific provider's circuit (manual recovery).
 */
export function resetProvider(provider: string): void {
  circuits.delete(provider);
}

/**
 * Reset all circuits (e.g. on env var reload).
 */
export function resetAll(): void {
  circuits.clear();
}
