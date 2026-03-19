/**
 * Wiki Routes — serves the public Atlas UX knowledge base at wiki.atlasux.cloud.
 *
 * Sections:
 *   image-gen   — AI image generation platforms (KB)
 *   video-gen   — AI video generation platforms (KB)
 *   support     — Customer help center (KB)
 *   agents      — Agent role definitions (AGENTS.md only, no soul/behavior/evolution/policy)
 *   policies    — Compliance and governance docs
 *   workflows   — Workflow definitions
 *
 * GET /v1/wiki/sections            — top-level sections
 * GET /v1/wiki/sections/:section   — categories within a section
 * GET /v1/wiki/articles            — list/search articles (?section=&category=&q=)
 * GET /v1/wiki/articles/:section/:category/:slug — single article
 * GET /v1/wiki/search?q=           — full-text search
 * GET /v1/wiki/stats               — article counts
 */

import type { FastifyPluginAsync } from "fastify";
import { readdir, readFile, stat as fsStat } from "fs/promises";
import { statSync } from "fs";
import path from "path";

const KB_ROOT = path.join(process.cwd(), "src", "kb");
const PROJECT_ROOT = process.cwd();

// Files/folders to exclude
const EXCLUDED_PREFIXES = ["_", ".", "tripwire-"];
const EXCLUDED_KEYWORDS = ["evolution", "behavior", "soul", "policy", "evo-"];
// Agent files to exclude (only AGENTS.md and HIERARCHY.md are public)
const AGENT_ALLOWED_FILES = new Set(["AGENTS.md", "HIERARCHY.md"]);
const AGENT_EXCLUDED_FILES = new Set([
  "MEMORY.md", "SKILL.md", "SOUL.md", "SOUL_LOCK.md", "SOUL-LOCK.md",
  "behavior.md", "evolution.md", "USER.md", "TRUTH_COMPLIANCE_CHECK.md",
  "UNLOCK_PROTOCOL.md", "REPORT_SCHEMA.md",
]);

function isExcluded(name: string): boolean {
  const lower = name.toLowerCase();
  if (EXCLUDED_PREFIXES.some((p) => lower.startsWith(p))) return true;
  if (EXCLUDED_KEYWORDS.some((k) => lower.includes(k))) return true;
  return false;
}

function isAgentFileAllowed(name: string): boolean {
  if (AGENT_ALLOWED_FILES.has(name)) return true;
  if (AGENT_EXCLUDED_FILES.has(name)) return false;
  // Exclude anything with policy/soul/behavior/evolution in name
  const lower = name.toLowerCase();
  if (EXCLUDED_KEYWORDS.some((k) => lower.includes(k))) return false;
  // Exclude all .md files that aren't explicitly allowed
  if (name.endsWith(".md")) return false;
  return false;
}

// ── Types ────────────────────────────────────────────────────────────────────

type ArticleMeta = {
  slug: string;
  section: string;
  category: string;
  title: string;
  tags: string[];
  platform?: string;
  updated?: string;
};

type ArticleFull = ArticleMeta & { content: string };

// ── Frontmatter parser ──────────────────────────────────────────────────────

function parseFrontmatter(raw: string): {
  meta: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (val.startsWith("[")) {
      try { meta[key] = JSON.parse(val); } catch { meta[key] = val; }
    } else {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return { meta, content: match[2].trim() };
}

// ── Title extraction ────────────────────────────────────────────────────────

function extractTitle(meta: Record<string, unknown>, content: string, fileName: string): string {
  if (meta.title && typeof meta.title === "string") return meta.title;
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fileName.replace(/^\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── File path resolver ──────────────────────────────────────────────────────

function resolveFilePath(section: string, category: string, slug: string): string {
  switch (section) {
    case "agents":
      return resolveAgentPath(category, slug);
    case "policies":
      return path.join(PROJECT_ROOT, "..", "policies", `${slug}.md`);
    case "workflows":
      return path.join(PROJECT_ROOT, "..", "workflows", `${slug}.md`);
    default:
      return category === "_root"
        ? path.join(KB_ROOT, section, `${slug}.md`)
        : path.join(KB_ROOT, section, category, `${slug}.md`);
  }
}

function resolveAgentPath(category: string, slug: string): string {
  const agentsRoot = path.join(PROJECT_ROOT, "..", "Agents");
  // category maps to agent hierarchy paths
  const pathMap: Record<string, string> = {
    "overview": path.join(agentsRoot, "Sub-Agents"),
    "atlas": path.join(agentsRoot, "executives", "Atlas"),
    "binky": path.join(agentsRoot, "executives", "Binky"),
    "executive-staff": path.join(agentsRoot, "executives", "Atlas", "Executive Staff"),
    "direct-reports": path.join(agentsRoot, "executives", "Binky", "Direct Reports"),
    "sub-agents": path.join(agentsRoot, "Sub-Agents"),
    "hierarchy": path.join(agentsRoot, "executives"),
  };
  const base = pathMap[category] || agentsRoot;
  return path.join(base, `${slug}.md`);
}

// ── KB section indexer ──────────────────────────────────────────────────────

async function indexKbSection(section: string): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];
  const sectionPath = path.join(KB_ROOT, section);
  let entries: string[];
  try { entries = await readdir(sectionPath); } catch { return []; }

  for (const entry of entries) {
    if (isExcluded(entry)) continue;
    const entryPath = path.join(sectionPath, entry);

    let files: string[];
    let category: string;
    try {
      const s = statSync(entryPath);
      if (s.isDirectory()) {
        category = entry;
        files = (await readdir(entryPath)).filter((f) => f.endsWith(".md") && !isExcluded(f));
      } else if (entry.endsWith(".md")) {
        category = "_root";
        files = [entry];
      } else continue;
    } catch { continue; }

    for (const file of files) {
      const filePath = category === "_root" ? path.join(sectionPath, file) : path.join(sectionPath, category, file);
      try {
        const raw = await readFile(filePath, "utf-8");
        const { meta, content } = parseFrontmatter(raw);
        const slug = file.replace(/\.md$/, "");
        articles.push({
          slug, section, category,
          title: extractTitle(meta, content, slug),
          tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
          platform: typeof meta.platform === "string" ? meta.platform : undefined,
          updated: typeof meta.updated === "string" ? meta.updated : undefined,
        });
      } catch { /* skip */ }
    }
  }
  return articles;
}

// ── Agent docs indexer ──────────────────────────────────────────────────────

async function indexAgentDocs(): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];
  const agentsRoot = path.join(PROJECT_ROOT, "..", "Agents");

  async function walkAgents(dir: string, category: string): Promise<void> {
    let entries: string[];
    try { entries = await readdir(dir); } catch { return; }

    for (const entry of entries) {
      const full = path.join(dir, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) {
          // Derive category from directory name
          const subCat = entry.toLowerCase().replace(/\s+/g, "-");
          await walkAgents(full, subCat);
        } else if (entry.endsWith(".md") && isAgentFileAllowed(entry)) {
          const raw = await readFile(full, "utf-8");
          const { meta, content } = parseFrontmatter(raw);
          // Use directory name + filename for unique slug
          const dirName = path.basename(dir).toLowerCase().replace(/\s+/g, "-");
          const slug = entry === "AGENTS.md" ? `${dirName}-agents` :
                       entry === "HIERARCHY.md" ? `${dirName}-hierarchy` :
                       entry.replace(/\.md$/, "").toLowerCase();
          articles.push({
            slug, section: "agents", category,
            title: extractTitle(meta, content, slug),
            tags: ["agent", category],
          });
        }
      } catch { /* skip */ }
    }
  }

  await walkAgents(agentsRoot, "overview");
  return articles;
}

// ── Policy docs indexer ─────────────────────────────────────────────────────

async function indexPolicies(): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];
  const policiesDir = path.join(PROJECT_ROOT, "..", "policies");
  let files: string[];
  try { files = (await readdir(policiesDir)).filter((f) => f.endsWith(".md")); } catch { return []; }

  for (const file of files) {
    try {
      const raw = await readFile(path.join(policiesDir, file), "utf-8");
      const { meta, content } = parseFrontmatter(raw);
      const slug = file.replace(/\.md$/, "");
      articles.push({
        slug, section: "policies", category: "compliance",
        title: extractTitle(meta, content, slug),
        tags: ["policy", "compliance"],
      });
    } catch { /* skip */ }
  }
  return articles;
}

// ── Workflow docs indexer ───────────────────────────────────────────────────

async function indexWorkflows(): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];
  const wfDir = path.join(PROJECT_ROOT, "..", "workflows");
  let files: string[];
  try { files = (await readdir(wfDir)).filter((f) => f.endsWith(".md")); } catch { return []; }

  for (const file of files) {
    try {
      const raw = await readFile(path.join(wfDir, file), "utf-8");
      const { meta, content } = parseFrontmatter(raw);
      const slug = file.replace(/\.md$/, "");
      articles.push({
        slug, section: "workflows", category: "definitions",
        title: extractTitle(meta, content, slug),
        tags: ["workflow", "automation"],
      });
    } catch { /* skip */ }
  }
  return articles;
}

// ── Index builder ────────────────────────────────────────────────────────────

const ALL_SECTIONS = ["image-gen", "video-gen", "support", "agents", "policies", "workflows"];

let _cache: { ts: number; articles: ArticleMeta[] } | null = null;
const CACHE_TTL = 60_000;

async function buildIndex(): Promise<ArticleMeta[]> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.articles;

  const [imageGen, videoGen, support, agents, policies, workflows] = await Promise.all([
    indexKbSection("image-gen"),
    indexKbSection("video-gen"),
    indexKbSection("support"),
    indexAgentDocs(),
    indexPolicies(),
    indexWorkflows(),
  ]);

  const articles = [...imageGen, ...videoGen, ...support, ...agents, ...policies, ...workflows];
  _cache = { ts: Date.now(), articles };
  return articles;
}

// ── Section labels ──────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, { label: string; description: string }> = {
  "image-gen": {
    label: "AI Image Generation",
    description: "Comprehensive guides, pricing, prompting techniques, and comparisons for 16+ AI image generators.",
  },
  "video-gen": {
    label: "AI Video Generation",
    description: "In-depth coverage of AI video platforms including Sora 2, Kling, Veo 3, Vidu, and Wan.",
  },
  support: {
    label: "Help Center",
    description: "Getting started, account management, integrations, billing, and troubleshooting for Atlas UX.",
  },
  agents: {
    label: "Agent Directory",
    description: "Atlas UX AI agent roles, hierarchy, and organizational structure. Meet the team.",
  },
  policies: {
    label: "Compliance & Governance",
    description: "Security, privacy, and compliance documentation — GDPR, HIPAA, SOC 2, ISO 27001, PCI-DSS.",
  },
  workflows: {
    label: "Workflows",
    description: "Predefined workflow definitions powering Atlas UX automation.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  // image-gen
  "adobe-firefly": "Adobe Firefly", "banana-nano": "Banana Nano", "canva-ai": "Canva AI",
  "chatgpt-imagegen": "ChatGPT Image Gen", "dall-e-3": "DALL-E 3", flux: "FLUX",
  "fotor-ai": "Fotor AI", "freepik-ai": "Freepik AI", "google-imagen": "Google Imagen",
  ideogram: "Ideogram", "leonardo-ai": "Leonardo AI", midjourney: "Midjourney",
  nightcafe: "NightCafe", pixlr: "Pixlr", runway: "Runway", "stability-ai": "Stability AI",
  comparisons: "Comparisons", guides: "Guides", pricing: "Pricing", "prompt-framework": "Prompt Framework",
  // video-gen
  sora2: "Sora 2", kling: "Kling", veo3: "Veo 3", vidu: "Vidu", wan: "Wan", treatments: "Treatments",
  // support
  "getting-started": "Getting Started", lucy: "Lucy AI Receptionist", appointments: "Appointments",
  "phone-sms": "Phone & SMS", "social-media": "Social Media", agents: "Agents",
  notifications: "Notifications", billing: "Billing", account: "Account",
  integrations: "Integrations", troubleshooting: "Troubleshooting", "security-privacy": "Security & Privacy",
  // agents
  overview: "Overview", atlas: "Atlas (CEO)", binky: "Binky (CRO)",
  "executive-staff": "Executive Staff", "direct-reports": "Direct Reports", "sub-agents": "Sub-Agents",
  hierarchy: "Hierarchy",
  // policies & workflows
  compliance: "Compliance", definitions: "Definitions",
  _root: "Overview",
};

// ── Routes ──────────────────────────────────────────────────────────────────

const wikiRoutes: FastifyPluginAsync = async (app) => {
  app.get("/sections", async () => {
    const articles = await buildIndex();
    return ALL_SECTIONS.map((s) => {
      const info = SECTION_LABELS[s] ?? { label: s, description: "" };
      const count = articles.filter((a) => a.section === s).length;
      return { name: s, ...info, count };
    });
  });

  app.get<{ Params: { section: string } }>("/sections/:section", async (req, reply) => {
    const { section } = req.params;
    if (!ALL_SECTIONS.includes(section)) return reply.status(404).send({ error: "Section not found" });

    const articles = await buildIndex();
    const sectionArticles = articles.filter((a) => a.section === section);
    const cats = new Map<string, number>();
    for (const a of sectionArticles) cats.set(a.category, (cats.get(a.category) ?? 0) + 1);

    return Array.from(cats.entries())
      .map(([name, count]) => ({
        name,
        label: CATEGORY_LABELS[name] ?? name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        count,
      }))
      .sort((a, b) => {
        if (a.name === "_root") return -1;
        if (b.name === "_root") return 1;
        return a.label.localeCompare(b.label);
      });
  });

  app.get<{ Querystring: { section?: string; category?: string; q?: string } }>("/articles", async (req) => {
    let articles = await buildIndex();
    const { section, category, q } = req.query;
    if (section) articles = articles.filter((a) => a.section === section);
    if (category) articles = articles.filter((a) => a.category === category);
    if (q) {
      const terms = q.toLowerCase().split(/\s+/);
      articles = articles.filter((a) => {
        const haystack = `${a.title} ${a.tags.join(" ")} ${a.section} ${a.category} ${a.platform ?? ""}`.toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    }
    return articles;
  });

  app.get<{ Params: { section: string; category: string; slug: string } }>(
    "/articles/:section/:category/:slug",
    async (req, reply) => {
      const { section, category, slug } = req.params;
      if (!ALL_SECTIONS.includes(section)) return reply.status(404).send({ error: "Section not found" });
      if (/[^a-zA-Z0-9_-]/.test(category) || /[^a-zA-Z0-9_-]/.test(slug)) {
        return reply.status(400).send({ error: "Invalid category or slug" });
      }
      if (isExcluded(category) || isExcluded(slug)) return reply.status(404).send({ error: "Article not found" });

      const filePath = resolveFilePath(section, category, slug);
      let raw: string;
      try { raw = await readFile(filePath, "utf-8"); } catch {
        return reply.status(404).send({ error: "Article not found" });
      }

      const { meta, content } = parseFrontmatter(raw);
      return {
        slug, section, category,
        title: extractTitle(meta, content, slug),
        tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
        platform: typeof meta.platform === "string" ? meta.platform : undefined,
        updated: typeof meta.updated === "string" ? meta.updated : undefined,
        content,
      } as ArticleFull;
    }
  );

  app.get<{ Querystring: { q: string } }>("/search", async (req) => {
    const { q } = req.query;
    if (!q || q.length < 2) return [];

    const articles = await buildIndex();
    const terms = q.toLowerCase().split(/\s+/);
    const results: (ArticleMeta & { snippet: string })[] = [];

    for (const a of articles) {
      const filePath = resolveFilePath(a.section, a.category, a.slug);
      let raw: string;
      try { raw = await readFile(filePath, "utf-8"); } catch { continue; }

      const { content } = parseFrontmatter(raw);
      const lower = `${a.title} ${content}`.toLowerCase();

      if (terms.every((t) => lower.includes(t))) {
        const idx = lower.indexOf(terms[0]);
        const start = Math.max(0, idx - 80);
        const end = Math.min(content.length, idx + 160);
        const snippet = (start > 0 ? "..." : "") + content.slice(start, end).replace(/\n/g, " ") + (end < content.length ? "..." : "");
        results.push({ ...a, snippet });
        if (results.length >= 50) break;
      }
    }
    return results;
  });

  app.get("/stats", async () => {
    const articles = await buildIndex();
    const bySection: Record<string, number> = {};
    for (const a of articles) bySection[a.section] = (bySection[a.section] ?? 0) + 1;
    return { total: articles.length, bySection };
  });
};

export default wikiRoutes;
