/**
 * Treatment Tool — Agent tool for triggering the video treatment pipeline.
 *
 * Registered in toolRegistry.ts. Triggered by natural language patterns
 * like "treat this YouTube video" or "convert video to shorts".
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { createTreatment, canStartTreatment } from "../../../services/treatment/orchestrator.js";

const YOUTUBE_URL_RE = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/;

export const treatmentTool: ToolDefinition = {
  key: "treatment",
  name: "Video Treatment Pipeline",
  patterns: [
    /\btreat(?:ment)?\s+(?:this|a|the)?\s*(?:youtube|video|yt)/i,
    /\b(?:youtube|yt)\s+(?:to|into)\s+shorts/i,
    /\bconvert\s+(?:this|a|the)?\s*video\s+(?:to|into)\s+shorts/i,
    /\bextract\s+(?:highlights|clips)\s+from/i,
    /\brepurpose\s+(?:this|a|the)?\s*video/i,
  ],
  async execute(ctx) {
    try {
      const urlMatch = ctx.query.match(YOUTUBE_URL_RE);
      if (!urlMatch) {
        return makeResult("treatment", "No YouTube URL found in the request. Please provide a YouTube video URL.");
      }

      const url = urlMatch[0];

      const check = await canStartTreatment(ctx.tenantId);
      if (!check.ok) {
        return makeResult("treatment", `Cannot start treatment: ${check.reason}`);
      }

      const id = await createTreatment(ctx.tenantId, url);
      return makeResult(
        "treatment",
        `Treatment pipeline started (ID: ${id}). The video will be downloaded, transcribed, scored for highlights, and you'll be asked to approve before AI treatment begins. Track progress via GET /v1/treatments/${id}.`,
      );
    } catch (err) {
      return makeError("treatment", err);
    }
  },
};
