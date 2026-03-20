/**
 * GraphRAG — hybrid entity-content knowledge graph for KB retrieval.
 * Re-exports key functions from submodules.
 */

export { extractEntitiesFromArticle } from "./entityExtractor.js";
export { resolveEntities } from "./entityResolver.js";
export { buildGraphFromExtractions, getGraphStats, initGraphSchema } from "./graphBuilder.js";
export { hybridSearch, type HybridResult } from "./hybridQuery.js";
export { runIndexPipeline } from "./indexPipeline.js";
