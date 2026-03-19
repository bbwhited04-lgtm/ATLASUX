/**
 * KB Health Scorer — computes a composite 0-100 health score from eval metrics.
 *
 * Weights:
 *   Retrieval accuracy:  40%
 *   Orphan-free:         20%
 *   Freshness:           15%
 *   No duplicates:       10%
 *   Coverage:            15%
 */

export type HealthMetrics = {
  avgRecall: number;         // 0-1 average recall@5 across golden queries
  orphanCount: number;       // number of orphaned docs
  totalDocs: number;         // total docs in KB
  staleDocs: number;         // docs never retrieved
  duplicatePairs: number;    // number of duplicate chunk pairs
  totalChunks: number;       // total chunks
  coverageGaps: number;      // number of uncovered categories/tiers/sources
  totalDimensions: number;   // total categories + tiers + sources
};

export function computeHealthScore(m: HealthMetrics): number {
  // Retrieval accuracy (40%) — direct recall score
  const retrievalScore = m.avgRecall * 100;

  // Orphan-free (20%) — percentage of docs that are NOT orphaned
  const orphanFreeScore = m.totalDocs > 0
    ? ((m.totalDocs - m.orphanCount) / m.totalDocs) * 100
    : 100;

  // Freshness (15%) — percentage of docs that are NOT stale
  const freshnessScore = m.totalDocs > 0
    ? ((m.totalDocs - m.staleDocs) / m.totalDocs) * 100
    : 100;

  // No duplicates (10%) — percentage of chunks that are NOT duplicated
  const dupFreeScore = m.totalChunks > 0
    ? Math.max(0, ((m.totalChunks - m.duplicatePairs * 2) / m.totalChunks) * 100)
    : 100;

  // Coverage (15%) — percentage of dimensions covered
  const coverageScore = m.totalDimensions > 0
    ? ((m.totalDimensions - m.coverageGaps) / m.totalDimensions) * 100
    : 100;

  const composite =
    retrievalScore * 0.4 +
    orphanFreeScore * 0.2 +
    freshnessScore * 0.15 +
    dupFreeScore * 0.1 +
    coverageScore * 0.15;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

export function scoreBreakdown(m: HealthMetrics): Record<string, { score: number; weight: number; detail: string }> {
  const retrievalScore = m.avgRecall * 100;
  const orphanFreeScore = m.totalDocs > 0 ? ((m.totalDocs - m.orphanCount) / m.totalDocs) * 100 : 100;
  const freshnessScore = m.totalDocs > 0 ? ((m.totalDocs - m.staleDocs) / m.totalDocs) * 100 : 100;
  const dupFreeScore = m.totalChunks > 0 ? Math.max(0, ((m.totalChunks - m.duplicatePairs * 2) / m.totalChunks) * 100) : 100;
  const coverageScore = m.totalDimensions > 0 ? ((m.totalDimensions - m.coverageGaps) / m.totalDimensions) * 100 : 100;

  return {
    retrieval: { score: Math.round(retrievalScore), weight: 40, detail: `recall@5: ${(m.avgRecall * 100).toFixed(1)}%` },
    orphanFree: { score: Math.round(orphanFreeScore), weight: 20, detail: `${m.orphanCount} orphans / ${m.totalDocs} docs` },
    freshness: { score: Math.round(freshnessScore), weight: 15, detail: `${m.staleDocs} stale / ${m.totalDocs} docs` },
    dupFree: { score: Math.round(dupFreeScore), weight: 10, detail: `${m.duplicatePairs} duplicate pairs / ${m.totalChunks} chunks` },
    coverage: { score: Math.round(coverageScore), weight: 15, detail: `${m.coverageGaps} gaps / ${m.totalDimensions} dimensions` },
  };
}
