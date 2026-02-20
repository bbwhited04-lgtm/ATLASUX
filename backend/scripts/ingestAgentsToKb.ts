/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient, KbDocumentStatus } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

type AgentFileKind = "agents" | "policy" | "soul" | "soul-lock" | "other";

function repoRootFromBackendCwd() {
  // backend/ -> repo root is one level up
  return path.resolve(process.cwd(), "..");
}

function findAgentsRoot(repoRoot: string) {
  const candidates = [
    path.join(repoRoot, "Agents"),
    path.join(repoRoot, "AGENTS"),
    path.join(repoRoot, "agents"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
  }
  throw new Error(
    `Could not find Agents folder. Tried: ${candidates.join(", ")}`
  );
}

function walkDirs(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur);
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
        stack.push(path.join(cur, ent.name));
      }
    }
  }
  return out;
}

function readIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  if (!fs.statSync(filePath).isFile()) return null;
  return fs.readFileSync(filePath, "utf8");
}

function detectKind(filename: string): AgentFileKind {
  const n = filename.toLowerCase();
  if (n === "agents.md") return "agents";
  if (n === "policy.md") return "policy";
  if (n === "soul.md") return "soul";
  if (n === "soul-lock.md" || n === "soullock.md" || n === "soul_lock.md")
    return "soul-lock";
  return "other";
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractEmailFromText(text: string): string | null {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m?.[0] ?? null;
}

function buildEnvEmailMap(): Map<string, string> {
  // Map keys like ARCHY -> archy@...
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(process.env)) {
    if (!v) continue;
    if (!k.endsWith("_EMAIL")) continue;
    const key = k.replace(/_EMAIL$/, "").toUpperCase();
    map.set(key, v);
  }
  return map;
}

function agentKeyFromFolderName(name: string) {
  return name.replace(/[^a-z0-9]/gi, "_").toUpperCase();
}

function shortHash(s: string) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

async function upsertKbDoc(params: {
  tenantId: string;
  createdBy: string;
  slug: string;
  title: string;
  body: string;
  status?: KbDocumentStatus;
}) {
  const { tenantId, createdBy, slug, title, body } = params;
  const status = params.status ?? KbDocumentStatus.draft;

  return prisma.kbDocument.upsert({
    where: { tenantId_slug: { tenantId, slug } },
    update: {
      title,
      body,
      updatedBy: createdBy,
      // keep status stable; uncomment if you want ingestion to enforce it:
      // status,
    },
    create: {
      tenantId,
      title,
      slug,
      body,
      status,
      createdBy,
      updatedBy: createdBy,
    },
  });
}

async function main() {
  const tenantId = (process.env.TENANT_ID || "").trim();
  if (!tenantId) throw new Error("TENANT_ID missing in backend/.env (must be UUID)");

  const actorUuid = (process.env.SEED_CREATED_BY || "").trim() || tenantId;
  // actorUuid must be UUID because createdBy is @db.Uuid in your schema
  if (!/^[0-9a-fA-F-]{36}$/.test(actorUuid)) {
    throw new Error(
      "SEED_CREATED_BY must be a UUID (or omit it and it will fall back to TENANT_ID)"
    );
  }

  const repoRoot = repoRootFromBackendCwd();
  const agentsRoot = findAgentsRoot(repoRoot);

  console.log("Ingesting Agents from:", agentsRoot);
  console.log("Tenant:", tenantId);
  console.log("Actor UUID:", actorUuid);

  const envEmailMap = buildEnvEmailMap();

  // Find agent folders: any directory under Agents that contains at least one of the files
  const dirs = walkDirs(agentsRoot);

  type AgentRecord = {
    agentName: string;
    agentKey: string;
    relPath: string;
    email?: string;
    docs: { kind: AgentFileKind; filePath: string; content: string }[];
  };

  const agents: AgentRecord[] = [];

  for (const d of dirs) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    const mdFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => e.name);

    const wants = ["agents.md", "policy.md", "soul.md", "soul-lock.md"];
    const hasAny = mdFiles.some((f) => wants.includes(f.toLowerCase()));
    if (!hasAny) continue;

    const folderName = path.basename(d);
    const agentName = folderName;
    const agentKey = agentKeyFromFolderName(folderName);
    const relPath = path.relative(agentsRoot, d);

    const docs: AgentRecord["docs"] = [];

    for (const file of mdFiles) {
      const kind = detectKind(file);
      if (kind === "other") continue;

      const full = path.join(d, file);
      const content = readIfExists(full);
      if (!content) continue;

      docs.push({ kind, filePath: full, content });
    }

    // email: env override > markdown scan
    const envEmail = envEmailMap.get(agentKey);
    let email = envEmail;
    if (!email) {
      for (const doc of docs) {
        const found = extractEmailFromText(doc.content);
        if (found) {
          email = found;
          break;
        }
      }
    }

    agents.push({ agentName, agentKey, relPath, email: email ?? undefined, docs });
  }

  // Sort stable
  agents.sort((a, b) => a.agentName.localeCompare(b.agentName));

  // 1) Write directory doc
  const directoryBody = [
    "# Agents Directory",
    "",
    "This document is generated by `kb:ingest-agents`.",
    "",
    "| Agent | Email | Path |",
    "|---|---|---|",
    ...agents.map((a) => `| ${a.agentName} | ${a.email ?? ""} | \`${a.relPath}\` |`),
    "",
  ].join("\n");

  await upsertKbDoc({
    tenantId,
    createdBy: actorUuid,
    slug: "agents/directory",
    title: "Agents Directory",
    body: directoryBody,
  });

  // 2) For each agent doc file -> upsert KB doc
  let count = 0;

  for (const agent of agents) {
    for (const doc of agent.docs) {
      const baseSlug = `agent/${slugify(agent.agentName)}/${doc.kind}`;
      // Add hash in case two agents slugify to the same string
      const slug = `${baseSlug}-${shortHash(agent.relPath)}`;

      const title =
        doc.kind === "agents"
          ? `${agent.agentName} — Agent Definition`
          : doc.kind === "policy"
          ? `${agent.agentName} — Policy`
          : doc.kind === "soul"
          ? `${agent.agentName} — Soul`
          : `${agent.agentName} — Soul Lock`;

      const header = [
        `# ${title}`,
        "",
        "> **Ingested from repo**",
        `> - Agent: ${agent.agentName}`,
        `> - Email: ${agent.email ?? "(not found)"}`,
        `> - Source: \`${path.relative(repoRoot, doc.filePath)}\``,
        `> - Kind: ${doc.kind}`,
        "",
        "---",
        "",
      ].join("\n");

      const body = header + doc.content.trim() + "\n";

      await upsertKbDoc({
        tenantId,
        createdBy: actorUuid,
        slug,
        title,
        body,
      });

      count++;
    }
  }

  console.log(`✅ Ingested ${agents.length} agents and ${count} docs into KB.`);
}

main()
  .catch((e) => {
    console.error("❌ Ingest failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });