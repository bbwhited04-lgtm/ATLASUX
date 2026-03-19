/**
 * Highlight Score stage — LLM-based scoring of scene segments for "viral short potential".
 *
 * Uses DeepSeek or Cerebras for cost efficiency (~$0.002 per call).
 * Scores each segment on 5 dimensions, outputs ranked clips ≤ 60 seconds.
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type TranscriptSegment, type SceneBoundary, type ScoredClip, type StageResult } from "./types.js";

const MAX_CLIPS = 10;
const MAX_CLIP_DURATION = 60; // YouTube Shorts limit

export async function runHighlightScore(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  const dir = treatmentDir(treatmentId);
  const transcriptPath = path.join(dir, "transcript.json");
  const scenesPath = path.join(dir, "scenes.json");

  let transcript: TranscriptSegment[];
  let scenes: SceneBoundary[];
  try {
    transcript = JSON.parse(await fs.readFile(transcriptPath, "utf-8"));
    scenes = JSON.parse(await fs.readFile(scenesPath, "utf-8"));
  } catch (err: any) {
    return { ok: false, error: `Failed to read input files: ${err?.message ?? err}` };
  }

  const sceneTranscripts = scenes.map((scene) => {
    const segs = transcript.filter(
      (t) => t.start >= scene.startTime && t.end <= scene.endTime,
    );
    return {
      ...scene,
      text: segs.map((s) => s.text).join(" ").trim(),
    };
  });

  const prompt = buildScoringPrompt(sceneTranscripts, treatment.sourceTitle ?? "Unknown");

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_KEY
    ? "https://api.deepseek.com/v1"
    : "https://api.cerebras.ai/v1";
  const model = process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "llama-4-scout-17b-16e-instruct";

  if (!apiKey) return { ok: false, error: "No LLM API key available (DEEPSEEK or CEREBRAS)" };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `LLM API ${res.status}: ${text}` };
    }

    const json = await res.json() as any;
    const content = json.choices?.[0]?.message?.content ?? "";
    const scored = parseScoredClips(content, scenes, sceneTranscripts);

    // Enforce max clip duration — split long clips
    const enforced: ScoredClip[] = [];
    for (const clip of scored) {
      const duration = clip.endTime - clip.startTime;
      if (duration <= MAX_CLIP_DURATION) {
        enforced.push(clip);
      } else {
        let start = clip.startTime;
        while (start < clip.endTime && enforced.length < MAX_CLIPS) {
          const end = Math.min(start + MAX_CLIP_DURATION, clip.endTime);
          enforced.push({ ...clip, startTime: start, endTime: end });
          start = end;
        }
      }
    }

    const topClips = enforced
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CLIPS);

    for (const clip of topClips) {
      await prisma.treatmentClip.create({
        data: {
          treatmentId,
          startTime: clip.startTime,
          endTime: clip.endTime,
          score: clip.score,
          transcript: clip.transcript.slice(0, 1000),
          status: "pending",
        },
      });
    }

    const viduCostPerClip = 0.055;
    const costEstimate = (treatment.costActual ?? 0) + topClips.length * viduCostPerClip;

    await prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        clipCount: topClips.length,
        costEstimate,
      },
    });

    return { ok: true, nextStage: "approval_gate_1" };
  } catch (err: any) {
    return { ok: false, error: `Highlight scoring failed: ${err?.message ?? err}` };
  }
}

function buildScoringPrompt(
  scenes: Array<SceneBoundary & { text: string }>,
  title: string,
): string {
  const sceneList = scenes
    .map(
      (s) =>
        `Scene ${s.sceneNumber} [${s.startTime.toFixed(1)}s - ${s.endTime.toFixed(1)}s]:\n${s.text || "(no speech)"}`,
    )
    .join("\n\n");

  return `You are a viral video editor. Analyze these scenes from "${title}" and score each for YouTube Shorts potential.

For each scene, rate 1-10 on:
- hookStrength: How compelling are the first 3 seconds?
- emotionalIntensity: How much emotion does it convey?
- informationDensity: How much value is packed in?
- standaloneCoherence: Does it make sense without context?
- visualAction: How dynamic is the visual content?

Return JSON array (no markdown, just raw JSON):
[{"sceneNumber": 1, "score": 8.5, "hookStrength": 9, "emotionalIntensity": 7, "informationDensity": 8, "standaloneCoherence": 9, "visualAction": 8}]

Only include scenes scoring >= 6 overall. Max ${MAX_CLIPS} scenes.

SCENES:
${sceneList}`;
}

function parseScoredClips(
  llmOutput: string,
  scenes: SceneBoundary[],
  sceneTranscripts: Array<SceneBoundary & { text: string }>,
): ScoredClip[] {
  try {
    const jsonMatch = llmOutput.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      sceneNumber: number;
      score: number;
      hookStrength: number;
      emotionalIntensity: number;
      informationDensity: number;
      standaloneCoherence: number;
      visualAction: number;
    }>;

    return parsed
      .map((p) => {
        const scene = scenes.find((s) => s.sceneNumber === p.sceneNumber);
        const sceneText = sceneTranscripts.find((s) => s.sceneNumber === p.sceneNumber);
        if (!scene) return null;
        return {
          startTime: scene.startTime,
          endTime: scene.endTime,
          score: p.score,
          transcript: sceneText?.text ?? "",
          hookStrength: p.hookStrength,
          emotionalIntensity: p.emotionalIntensity,
          informationDensity: p.informationDensity,
          standaloneCoherence: p.standaloneCoherence,
          visualAction: p.visualAction,
        } as ScoredClip;
      })
      .filter((c): c is ScoredClip => c !== null);
  } catch {
    return [];
  }
}
