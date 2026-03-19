/**
 * KB Heal Event Emitter — reactive self-healing triggers.
 * Brain/engine components emit events when KB errors are detected.
 * The kbEvalWorker listens and dispatches heals in real-time.
 */
import { EventEmitter } from "events";

export type KbHealEvent = {
  trigger: "reactive";
  query: string;
  agentId: string;
  tenantId: string;
  errorType: "coverage_gap" | "embedding_drift" | "broken_reference" | "misleading_content" | "memory_corruption";
  context?: string;
};

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export function emitHealEvent(event: KbHealEvent): void {
  emitter.emit("kb:heal", event);
}

export function onHealEvent(handler: (event: KbHealEvent) => void): void {
  emitter.on("kb:heal", handler);
}

export function removeHealListener(handler: (event: KbHealEvent) => void): void {
  emitter.removeListener("kb:heal", handler);
}
