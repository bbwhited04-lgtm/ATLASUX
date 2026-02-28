/**
 * VirusTotal file scanning wrapper.
 *
 * Strategy:
 *   1. SHA-256 hash the buffer
 *   2. Check existing report via GET /files/{hash} (free, no quota)
 *   3. If report exists with malicious detections -> reject
 *   4. If no report -> upload to VT for analysis, allow optimistically
 *   5. Fail open on network errors (defense-in-depth; MIME whitelist is primary)
 *
 * Requires: VIRUS_SCAN_ENABLED=true and VIRUSTOTAL_API_KEY set.
 */
import { createHash } from "node:crypto";
import type { Env } from "../env.js";

const VT_BASE = "https://www.virustotal.com/api/v3";
const MALICIOUS_THRESHOLD = 1; // reject if >= 1 engine flags malicious

export interface ScanResult {
  ok: boolean;
  reason?: string;
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Scan a file buffer via VirusTotal.
 *
 * Returns { ok: true } to allow, { ok: false, reason } to reject.
 * If scanning is disabled or API key is missing, allows the file (fail-open).
 */
export async function scanFile(
  buf: Buffer,
  filename: string,
  env: Env,
): Promise<ScanResult> {
  if (env.VIRUS_SCAN_ENABLED?.toLowerCase() !== "true" || !env.VIRUSTOTAL_API_KEY) {
    return { ok: true };
  }

  const apiKey = env.VIRUSTOTAL_API_KEY;
  const hash = sha256(buf);

  try {
    // Step 1: Check existing report by hash (free, no upload quota impact)
    const reportRes = await fetch(`${VT_BASE}/files/${hash}`, {
      headers: { "x-apikey": apiKey },
    });

    if (reportRes.ok) {
      const report = (await reportRes.json()) as any;
      const stats = report?.data?.attributes?.last_analysis_stats;
      if (stats && (stats.malicious ?? 0) >= MALICIOUS_THRESHOLD) {
        return {
          ok: false,
          reason: `File rejected: detected as malicious by ${stats.malicious} engine(s)`,
        };
      }
      // Report exists and is clean
      return { ok: true };
    }

    if (reportRes.status === 404) {
      // Step 2: No existing report — upload for analysis
      const form = new FormData();
      form.append("file", new Blob([buf as unknown as ArrayBuffer]), filename);

      const uploadRes = await fetch(`${VT_BASE}/files`, {
        method: "POST",
        headers: { "x-apikey": apiKey },
        body: form,
      });

      if (!uploadRes.ok) {
        // Upload failed — fail open
        return { ok: true };
      }

      // File queued for analysis — allow optimistically
      return { ok: true };
    }

    // Unexpected status — fail open
    return { ok: true };
  } catch {
    // Network error — fail open (MIME whitelist is primary defense)
    return { ok: true };
  }
}
