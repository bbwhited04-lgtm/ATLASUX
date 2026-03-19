/**
 * Shared types for the video treatment pipeline.
 */

/** Stage names matching the treatment_status enum */
export type TreatmentStage =
  | "download"
  | "transcribe"
  | "scene_detect"
  | "highlight_score"
  | "approval_gate_1"
  | "clip_extract"
  | "ai_treat"
  | "format"
  | "approval_gate_2"
  | "deliver";

/** Result returned by each stage function */
export type StageResult = {
  ok: boolean;
  /** Next stage to advance to (undefined if pipeline should pause/stop) */
  nextStage?: TreatmentStage;
  /** Error message on failure */
  error?: string;
};

/** Metadata extracted during download */
export type VideoMeta = {
  title: string;
  duration: number;
  channel: string;
  description: string;
};

/** A single word/segment from the transcript */
export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

/** Scene boundary from PySceneDetect or FFmpeg */
export type SceneBoundary = {
  startTime: number;
  endTime: number;
  sceneNumber: number;
};

/** Scored clip candidate from highlight scoring */
export type ScoredClip = {
  startTime: number;
  endTime: number;
  score: number;
  transcript: string;
  hookStrength: number;
  emotionalIntensity: number;
  informationDensity: number;
  standaloneCoherence: number;
  visualAction: number;
};

/** Treatment data directory path helper */
export function treatmentDir(treatmentId: string): string {
  return `data/treatments/${treatmentId}`;
}
