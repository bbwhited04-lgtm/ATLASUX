/**
 * Deep Research Engine — GPT Researcher-style multi-query parallel research.
 *
 * Three phases:
 *   1. Planning  — LLM generates 5-8 diverse search queries from a topic
 *   2. Execution — All queries run in parallel (web + Reddit + KB)
 *   3. Synthesis — LLM produces a comprehensive cited report
 *
 * Runs synchronously within a single tool call. No registry entry needed.
 */

import { searchWeb, searchReddit }       from "./webSearch.js";
import type { WebSearchResult, RedditPost } from "./webSearch.js";
import { getKbContext }                   from "../core/kb/getKbContext.js";
import { runLLM, simpleCall }            from "../core/engine/brainllm.js";
import { queryPinecone }                 from "./pinecone.js";
import type { VectorHit }               from "./pinecone.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type DeepResearchResult = {
  ok:          boolean;
  topic:       string;
  report:      string;
  sourcesUsed: number;
  queriesRun:  number;
  provider:    string;
  durationMs:  number;
  error?:      string;
};

type ResearchEvidence = {
  query:   string;
  results: WebSearchResult[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_QUERIES = 6;
const PARALLEL_TIMEOUT_MS = 30_000;

// ── Phase 1: Research Planning ───────────────────────────────────────────────

async function planQueries(
  topic: string,
  maxQueries: number,
  agentId: string,
): Promise<string[]> {
  const prompt = [
    `You are a research planning assistant. Given a research topic, generate ${maxQueries} diverse search queries that cover different angles of the topic.`,
    ``,
    `Rules:`,
    `- Each query should target a different facet (market size, competitors, trends, technical details, user sentiment, recent news, expert opinions, case studies)`,
    `- Keep queries concise (5-12 words each)`,
    `- Output ONLY a JSON array of strings, no explanation`,
    ``,
    `Topic: ${topic}`,
    ``,
    `Output:`,
  ].join("\n");

  const res = await runLLM(
    simpleCall(agentId.toUpperCase(), `deep-research-${Date.now()}`, "research_plan", "CLASSIFY_EXTRACT_VALIDATE", prompt),
  );

  try {
    // Extract JSON array from response (handle markdown code blocks)
    const text = res.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [topic];
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((q: unknown) => typeof q === "string")) {
      return parsed.slice(0, maxQueries);
    }
    return [topic];
  } catch {
    return [topic];
  }
}

// ── Phase 2: Parallel Execution ──────────────────────────────────────────────

async function executeSearches(
  queries: string[],
  topic: string,
  tenantId: string,
  agentId: string,
): Promise<{
  evidence:    ResearchEvidence[];
  redditPosts: RedditPost[];
  kbText:      string;
  vectorHits:  VectorHit[];
  provider:    string;
}> {
  const timeout = AbortSignal.timeout(PARALLEL_TIMEOUT_MS);

  // Fire all searches in parallel
  const webPromises = queries.map(async (q): Promise<ResearchEvidence> => {
    try {
      if (timeout.aborted) return { query: q, results: [] };
      const res = await searchWeb(q, 6);
      return { query: q, results: res.ok ? res.results : [] };
    } catch {
      return { query: q, results: [] };
    }
  });

  const redditPromise = searchReddit(topic, 10).catch(() => ({ ok: false as const, posts: [] as RedditPost[] }));

  const kbPromise = getKbContext({
    tenantId,
    agentId,
    query: topic.slice(0, 200),
  }).catch(() => ({ text: "", items: [], totalChars: 0, budgetChars: 0 }));

  const vectorPromise = queryPinecone({ tenantId, query: topic, topK: 8 })
    .catch(() => [] as VectorHit[]);

  const [webResults, redditResult, kbResult, vectorResults] = await Promise.all([
    Promise.allSettled(webPromises).then(settled =>
      settled
        .filter((s): s is PromiseFulfilledResult<ResearchEvidence> => s.status === "fulfilled")
        .map(s => s.value),
    ),
    redditPromise,
    kbPromise,
    vectorPromise,
  ]);

  // Deduplicate URLs across all web results
  const seenUrls = new Set<string>();
  for (const ev of webResults) {
    ev.results = ev.results.filter(r => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });
  }

  // Determine primary provider from first successful result
  const firstWithResults = webResults.find(e => e.results.length > 0);
  const provider = firstWithResults?.results[0]?.source ?? "none";

  return {
    evidence:    webResults,
    redditPosts: redditResult.ok ? redditResult.posts : [],
    kbText:      kbResult.text.slice(0, 8000),
    vectorHits:  vectorResults,
    provider,
  };
}

// ── Phase 3: Synthesis ───────────────────────────────────────────────────────

async function synthesizeReport(
  topic: string,
  evidence: ResearchEvidence[],
  redditPosts: RedditPost[],
  kbText: string,
  vectorHits: VectorHit[],
  agentId: string,
): Promise<string> {
  // Build evidence block
  const webBlock = evidence
    .filter(e => e.results.length > 0)
    .map(e => {
      const items = e.results.map(r => `- [${r.title}](${r.url}): ${r.snippet.slice(0, 250)}`).join("\n");
      return `### Query: "${e.query}"\n${items}`;
    })
    .join("\n\n");

  const redditBlock = redditPosts.length > 0
    ? "### Reddit Discussions\n" + redditPosts.slice(0, 8).map(p =>
        `- [${p.title}](${p.permalink}) (r/${p.subreddit}, score: ${p.score}): ${p.selftext.slice(0, 150)}`
      ).join("\n")
    : "";

  const kbBlock = kbText
    ? `### Internal Knowledge Base\n${kbText.slice(0, 4000)}`
    : "";

  const vectorBlock = vectorHits.length > 0
    ? "### Vector Search Results\n" + vectorHits.map(h =>
        `- [score: ${h.score.toFixed(3)}] ${h.content.slice(0, 300)}`
      ).join("\n")
    : "";

  const prompt = [
    `You are a senior research analyst producing a comprehensive, factual, cited report.`,
    ``,
    `## Research Topic`,
    topic,
    ``,
    `## Evidence Gathered`,
    ``,
    webBlock || "(No web results available)",
    ``,
    redditBlock || "(No Reddit discussions found)",
    ``,
    kbBlock || "(No internal KB context)",
    ``,
    vectorBlock || "(No vector search results)",
    ``,
    `## Report Requirements`,
    `Produce a detailed report with these sections:`,
    `1. **Executive Summary** — 2-3 paragraph overview of findings`,
    `2. **Key Findings** — Numbered list of the most important discoveries, each citing its source`,
    `3. **Detailed Analysis** — In-depth discussion organized by theme`,
    `4. **Sources & Citations** — Numbered list of all URLs used, formatted as [N] Title — URL`,
    `5. **Gaps & Limitations** — What couldn't be determined from available evidence`,
    `6. **Recommendations** — Actionable next steps based on findings`,
    ``,
    `Rules:`,
    `- Every factual claim MUST cite its source using [N] notation`,
    `- Be specific — include numbers, dates, names when the evidence provides them`,
    `- If sources conflict, note the discrepancy`,
    `- Do not fabricate information beyond what the evidence shows`,
    `- Write in a professional analyst tone`,
  ].join("\n");

  const res = await runLLM(
    simpleCall(agentId.toUpperCase(), `deep-research-synth-${Date.now()}`, "research_synthesis", "LONG_CONTEXT_SUMMARY", prompt),
  );

  return res.text || "(Synthesis failed — no output from LLM)";
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

export async function runDeepResearch(opts: {
  tenantId:    string;
  agentId:     string;
  topic:       string;
  maxQueries?: number;
  intentId?:   string;
}): Promise<DeepResearchResult> {
  const start = Date.now();
  const { tenantId, agentId, topic, maxQueries = DEFAULT_MAX_QUERIES } = opts;

  try {
    // Phase 1: Plan
    const queries = await planQueries(topic, maxQueries, agentId);

    // Phase 2: Execute
    const { evidence, redditPosts, kbText, vectorHits, provider } = await executeSearches(
      queries, topic, tenantId, agentId,
    );

    const totalSources = evidence.reduce((sum, e) => sum + e.results.length, 0)
      + redditPosts.length
      + (kbText ? 1 : 0)
      + vectorHits.length;

    // Phase 3: Synthesize
    const report = await synthesizeReport(topic, evidence, redditPosts, kbText, vectorHits, agentId);

    return {
      ok:          true,
      topic,
      report,
      sourcesUsed: totalSources,
      queriesRun:  queries.length,
      provider,
      durationMs:  Date.now() - start,
    };
  } catch (err: any) {
    return {
      ok:          false,
      topic,
      report:      "",
      sourcesUsed: 0,
      queriesRun:  0,
      provider:    "none",
      durationMs:  Date.now() - start,
      error:       err?.message ?? String(err),
    };
  }
}
