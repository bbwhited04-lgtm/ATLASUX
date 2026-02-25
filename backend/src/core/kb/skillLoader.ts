/**
 * SKILL.md Loader — Reads agent SKILL.md files from the filesystem at boot.
 *
 * This is Tier 1 of the knowledge architecture — agents carry their domain
 * expertise in-process without any DB query. If an agent knows how to do
 * something from their SKILL.md, they can act immediately.
 *
 * SKILL.md files live at:
 *   Agents/Atlas/SKILL.md
 *   Agents/Sub-Agents/{AGENT_NAME}/SKILL.md
 *   Agents/Atlas/Executive-Staff/{AGENT_NAME}/SKILL.md
 *
 * The loader discovers all SKILL.md files at startup, builds an in-memory
 * map keyed by agentId (lowercase), and makes them available to the chat
 * router for zero-latency context injection.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

type SkillEntry = {
  agentId: string;
  filePath: string;
  content: string;
  loadedAt: Date;
};

const skills = new Map<string, SkillEntry>();

/** Find the repo root by walking up from __dirname until we find "Agents/" dir */
function findRepoRoot(): string {
  // In compiled dist: backend/dist/core/kb/skillLoader.js → walk up 4 levels
  // In ts-node/tsx: backend/src/core/kb/skillLoader.ts → walk up 4 levels
  const parts = new URL(import.meta.url).pathname.split("/");
  // Walk up until we find a directory that has "Agents" as a sibling
  for (let i = parts.length; i > 1; i--) {
    const candidate = parts.slice(0, i).join("/");
    const agentsDir = join(candidate, "..", "Agents");
    if (existsSync(agentsDir)) return resolve(join(candidate, ".."));
  }
  // Fallback: assume we're two levels above backend/
  return resolve(join(new URL(import.meta.url).pathname, "../../../../../../"));
}

function agentIdFromDirName(dirName: string): string {
  return dirName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function scanForSkills(baseDir: string): void {
  if (!existsSync(baseDir)) return;

  const entries = readdirSync(baseDir);
  for (const entry of entries) {
    const fullPath = join(baseDir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const skillFile = join(fullPath, "SKILL.md");
      if (existsSync(skillFile)) {
        const agentId = agentIdFromDirName(entry);
        const content = readFileSync(skillFile, "utf-8");
        skills.set(agentId, {
          agentId,
          filePath: skillFile,
          content,
          loadedAt: new Date(),
        });
      }
      // Recurse one level for Executive-Staff subdirs
      scanForSkills(fullPath);
    }
  }
}

let initialized = false;

export function loadAllSkills(): void {
  if (initialized) return;
  initialized = true;

  try {
    const root = findRepoRoot();
    const agentsBase = join(root, "Agents");
    scanForSkills(agentsBase);
    console.log(`[skillLoader] Loaded ${skills.size} SKILL.md files: ${[...skills.keys()].join(", ")}`);
  } catch (err: any) {
    console.warn(`[skillLoader] Could not load SKILL.md files: ${err?.message ?? err}`);
  }
}

/** Get a single agent's skill content (returns empty string if not found). */
export function getSkill(agentId: string): string {
  const id = agentId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return skills.get(id)?.content ?? "";
}

/** Get a formatted context block for injection into the system prompt. */
export function getSkillBlock(agentId: string): string {
  const content = getSkill(agentId);
  if (!content) return "";
  return `[SKILL — ${agentId.toUpperCase()}]\n${content}`;
}

export function listLoadedSkills(): string[] {
  return [...skills.keys()];
}

export function skillCount(): number {
  return skills.size;
}
