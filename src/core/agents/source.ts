import { AGENTS as REGISTRY_AGENTS, getChildren as registryGetChildren, type AgentNode } from "./registry";
import { MOCK_AGENTS } from "../../mocks/mockAgents";

export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === "true";

/**
 * Agents datasource for the frontend.
 * - Live: static registry (for now)
 * - Mock: local mock registry for UI testing without backend
 */
export const AGENTS: AgentNode[] = USE_MOCKS ? MOCK_AGENTS : REGISTRY_AGENTS;

export function getChildren(parentId: string) {
  // Use the active datasource rather than the static registry helper.
  return AGENTS.filter((a) => a.reportsTo === parentId);
}
