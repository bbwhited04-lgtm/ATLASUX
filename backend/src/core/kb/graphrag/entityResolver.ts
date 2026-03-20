/**
 * Entity Resolver — deduplicates entities across chunks.
 * "Neo4j" = "neo4j" = "Neo4J" = "Neo4j Database"
 *
 * Returns a Map<string, string> mapping every raw entity name
 * to its canonical form.
 */

import type { ExtractionResult, ExtractedEntity } from "./entityExtractor.js";

// ── Normalization helpers ───────────────────────────────────────────────────

/**
 * Normalize a name for comparison: lowercase, strip non-alphanumeric
 * (except dots and hyphens which matter for tool names like "Next.js").
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, "")
    .trim();
}

/**
 * Strip common suffixes that create false duplicates.
 * "Neo4j Database" → "Neo4j", "OpenAI API" → "OpenAI"
 * But keep ".js"/".ai" suffixes as they are part of tool names.
 */
const NOISE_SUFFIXES = [
  " database",
  " platform",
  " framework",
  " library",
  " tool",
  " service",
  " api",
  " sdk",
  " engine",
  " system",
  " protocol",
  " model",
  " algorithm",
  " network",
];

function stripNoiseSuffix(name: string): string {
  const lower = name.toLowerCase();
  for (const suffix of NOISE_SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length > suffix.length) {
      return name.slice(0, name.length - suffix.length).trim();
    }
  }
  return name;
}

/**
 * Simple Levenshtein distance for short strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Check if two normalized names are similar enough to merge.
 */
function areSimilar(a: string, b: string): boolean {
  if (a === b) return true;

  // One is a prefix of the other (e.g., "react" and "reactjs")
  if (a.startsWith(b) || b.startsWith(a)) return true;

  // Levenshtein distance ≤ 2 for short names, ≤ 3 for longer
  const threshold = Math.max(a.length, b.length) <= 8 ? 2 : 3;
  if (levenshtein(a, b) <= threshold) return true;

  return false;
}

// ── Entity group ────────────────────────────────────────────────────────────

interface EntityGroup {
  canonical: string;
  normalizedKey: string;
  rawNames: string[];
  count: number;
}

/**
 * Resolve entities from multiple ExtractionResults into canonical forms.
 *
 * Returns a Map where keys are raw entity names (as extracted) and
 * values are the chosen canonical name for that entity.
 */
export function resolveEntities(
  results: ExtractionResult[]
): Map<string, string> {
  // Collect all raw entity names with their original casing
  const nameOccurrences = new Map<string, number>();
  const allEntities: ExtractedEntity[] = [];

  for (const result of results) {
    for (const entity of result.entities) {
      allEntities.push(entity);
      const count = nameOccurrences.get(entity.name) ?? 0;
      nameOccurrences.set(entity.name, count + 1);

      // Also count aliases
      for (const alias of entity.aliases) {
        const aliasCount = nameOccurrences.get(alias) ?? 0;
        nameOccurrences.set(alias, aliasCount + 1);
      }
    }
  }

  // Build groups by normalized name
  const groups: EntityGroup[] = [];
  const normalizedIndex = new Map<string, number>(); // normalized → group index

  for (const [rawName] of nameOccurrences) {
    const stripped = stripNoiseSuffix(rawName);
    const norm = normalize(stripped);
    if (!norm) continue;

    // Try to find an existing group this name belongs to
    let foundGroup = normalizedIndex.get(norm);

    if (foundGroup === undefined) {
      // Check similarity against existing groups
      for (let i = 0; i < groups.length; i++) {
        if (areSimilar(norm, groups[i].normalizedKey)) {
          foundGroup = i;
          break;
        }
      }
    }

    if (foundGroup !== undefined) {
      const group = groups[foundGroup];
      group.rawNames.push(rawName);
      group.count += nameOccurrences.get(rawName) ?? 1;
      normalizedIndex.set(norm, foundGroup);
    } else {
      const idx = groups.length;
      groups.push({
        canonical: rawName,
        normalizedKey: norm,
        rawNames: [rawName],
        count: nameOccurrences.get(rawName) ?? 1,
      });
      normalizedIndex.set(norm, idx);
    }
  }

  // For each group, pick the canonical name: most frequent form,
  // tiebreak by preferring the form with proper capitalization (not all-lower)
  for (const group of groups) {
    let bestName = group.rawNames[0];
    let bestCount = nameOccurrences.get(bestName) ?? 0;

    for (const name of group.rawNames) {
      const count = nameOccurrences.get(name) ?? 0;
      if (
        count > bestCount ||
        (count === bestCount && name !== name.toLowerCase() && bestName === bestName.toLowerCase())
      ) {
        bestName = name;
        bestCount = count;
      }
    }

    group.canonical = bestName;
  }

  // Build the final mapping: every raw name and alias → canonical
  const resolution = new Map<string, string>();

  for (const group of groups) {
    for (const rawName of group.rawNames) {
      resolution.set(rawName, group.canonical);
    }
  }

  // Also resolve aliases from all entities
  for (const entity of allEntities) {
    const entityCanonical = resolution.get(entity.name);
    if (entityCanonical) {
      for (const alias of entity.aliases) {
        if (!resolution.has(alias)) {
          resolution.set(alias, entityCanonical);
        }
      }
    }
  }

  return resolution;
}
