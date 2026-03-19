/**
 * Wiki-to-KB Bridge — connects the public wiki (wiki.atlasux.cloud) to the
 * agent knowledge pipeline. When agents need context, this module searches
 * the wiki's 500+ articles and returns results in the same shape as kbDocument
 * records, so they slot directly into getKbContext's de-dupe and budget logic.
 *
 * The wiki serves from the filesystem (backend/src/kb/), so we read directly
 * rather than making HTTP calls — zero network latency, same process.
 */

import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

const KB_ROOT = path.join(process.cwd(), "src", "kb");

// Sections to search (matches wikiRoutes.ts sections)
// "kb-agents" reads from src/kb/agents/ (78 flat articles: AI history, CLIs, MCPs, prompts, etc.)
// "agents" reads from ../Agents/ (agent role definitions — nested by category)
const SEARCHABLE_SECTIONS = ["image-gen", "video-gen", "support", "agents", "kb-agents"];

// Files/folders to exclude (matches wikiRoutes.ts exclusions)
const EXCLUDED_PREFIXES = ["_", ".", "tripwire-"];
const EXCLUDED_KEYWORDS = ["evolution", "behavior", "soul", "policy", "evo-"];

function isExcluded(name: string): boolean {
  const lower = name.toLowerCase();
  if (EXCLUDED_PREFIXES.some((p) => lower.startsWith(p))) return true;
  if (EXCLUDED_KEYWORDS.some((k) => lower.includes(k))) return true;
  return false;
}

type WikiSearchResult = {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: Date;
};

// In-memory index — rebuilt every 2 minutes (lightweight, filesystem-based)
let indexCache: Array<{ section: string; category: string; slug: string; title: string; path: string }> = [];
let indexBuiltAt = 0;
const INDEX_TTL = 120_000;

async function ensureIndex(): Promise<typeof indexCache> {
  if (Date.now() - indexBuiltAt < INDEX_TTL && indexCache.length > 0) {
    return indexCache;
  }

  const entries: typeof indexCache = [];

  for (const section of SEARCHABLE_SECTIONS) {
    const sectionPath = section === "agents"
      ? path.join(process.cwd(), "..", "Agents")
      : section === "kb-agents"
        ? path.join(KB_ROOT, "agents")
        : path.join(KB_ROOT, section);

    try {
      const dirEntries = await readdir(sectionPath, { withFileTypes: true });

      // Flat files directly in the section (e.g., kb/agents/*.md)
      for (const file of dirEntries) {
        if (!file.isFile() || !file.name.endsWith(".md") || isExcluded(file.name)) continue;

        const slug = file.name.replace(/\.md$/, "");
        // Derive category from filename prefix (e.g., "ai-ml-" → "ai-ml")
        const prefixMatch = slug.match(/^([a-z]+-[a-z]+)-/);
        const category = prefixMatch ? prefixMatch[1] : "general";
        const title = slug
          .replace(/^\d+-/, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        entries.push({
          section,
          category,
          slug,
          title,
          path: path.join(sectionPath, file.name),
        });
      }

      // Nested directories (e.g., image-gen/dalle/, agents/Kelly/)
      for (const cat of dirEntries) {
        if (!cat.isDirectory() || isExcluded(cat.name)) continue;

        const catPath = path.join(sectionPath, cat.name);
        const files = await readdir(catPath, { withFileTypes: true });

        for (const file of files) {
          if (!file.isFile() || !file.name.endsWith(".md") || isExcluded(file.name)) continue;

          const slug = file.name.replace(/\.md$/, "");
          const title = slug
            .replace(/^\d+-/, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          entries.push({
            section,
            category: cat.name,
            slug,
            title,
            path: path.join(catPath, file.name),
          });
        }
      }
    } catch {
      // Section doesn't exist or can't be read — skip
    }
  }

  indexCache = entries;
  indexBuiltAt = Date.now();
  return entries;
}

/**
 * Search the wiki KB for articles matching a query.
 * Returns results shaped like kbDocument records for direct injection
 * into getKbContext's pipeline.
 */
export async function searchWikiForAgents(
  query: string,
  limit = 3,
): Promise<WikiSearchResult[]> {
  const index = await ensureIndex();
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length >= 2);

  if (terms.length === 0) return [];

  // Score each indexed article by term matches in title/slug/category
  const scored = index.map((entry) => {
    const searchable = `${entry.title} ${entry.slug} ${entry.category} ${entry.section}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (searchable.includes(term)) score++;
    }
    // Bonus for exact phrase match
    if (searchable.includes(q)) score += terms.length;
    return { ...entry, score };
  });

  // Filter to entries with at least one term match, sort by score desc
  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (matches.length === 0) return [];

  // Read file contents for matched articles
  const results: WikiSearchResult[] = [];
  for (const match of matches) {
    try {
      const content = await readFile(match.path, "utf-8");

      // Extract title from first # heading if present
      const titleLine = content.split("\n").find((l) => l.startsWith("# "));
      const title = titleLine ? titleLine.replace(/^#\s+/, "") : match.title;

      results.push({
        id: `wiki-${match.section}-${match.category}-${match.slug}`,
        slug: `wiki/${match.section}/${match.category}/${match.slug}`,
        title,
        body: content,
        updatedAt: new Date(),
      });
    } catch {
      // File read failed — skip
    }
  }

  return results;
}
