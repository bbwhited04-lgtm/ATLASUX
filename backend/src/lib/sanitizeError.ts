/**
 * Sanitize error messages before sending to clients.
 * Strips internal details like file paths, DB table names, and stack traces.
 */
export function sanitizeError(err: unknown): string {
  if (!err) return "internal_error";
  const msg = err instanceof Error ? err.message : String(err);
  // Strip file paths
  let safe = msg.replace(/\/[^\s:]+\.(ts|js|mjs|json)/g, "[path]");
  // Strip Prisma model/table references
  safe = safe.replace(/prisma\.\w+/gi, "[model]");
  safe = safe.replace(/table\s+["'`]\w+["'`]/gi, "[table]");
  // Strip connection strings
  safe = safe.replace(/postgresql:\/\/[^\s]+/g, "[db_url]");
  safe = safe.replace(/https?:\/\/[^\s]+api[^\s]*/gi, "[api_url]");
  // Truncate to reasonable length
  return safe.length > 200 ? safe.slice(0, 200) + "..." : safe;
}
