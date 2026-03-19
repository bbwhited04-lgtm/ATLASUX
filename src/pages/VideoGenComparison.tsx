import React, { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import {
  Video,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  Monitor,
  Globe,
  Server,
  Cpu,
  Mic,
  Film,
  Layers,
  Clock,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type Platform = {
  name: string;
  company: string;
  tagline: string;
  highlights: string[];
  pricing: string;
  bestFor: string;
  bestAtTag: string;
  quality: number;
  value: number;
  api: number;
  accent: string;
  icon: React.ElementType;
};

type CostRow = {
  provider: string;
  perSecond: string;
  maxDuration: string;
  resolution: string;
  audio: boolean;
  tier: "low" | "mid" | "high";
};

type JobRow = {
  provider: string;
  cost: string;
  notes: string;
};

type VolumeRow = {
  provider: string;
  ten: string;
  fifty: string;
  hundred: string;
};

type DecisionRow = {
  need: string;
  recommendation: string;
  icon: React.ElementType;
};

type KBCategory = {
  name: string;
  count: number;
  docs: string[];
};

/* ─── Static Data ────────────────────────────────────────────────────────────── */

const platforms: Platform[] = [
  {
    name: "Kling 3.0",
    company: "Kuaishou",
    tagline: "First native 4K@60fps, multi-shot storyboarding, 8+ language lip-sync",
    highlights: [
      "Native 4K at 60fps output",
      "Multi-shot storyboarding with scene continuity",
      "Lip-sync in 8+ languages",
      "Omni mode with audio-visual sync",
      "Motion brush and camera control",
    ],
    pricing: "Free tier (66 credits/day), Pro $25.99/mo, API $0.07-0.17/sec",
    bestFor: "Social clips, product shots, multi-shot narratives",
    bestAtTag: "Best All-Rounder",
    quality: 9,
    value: 9,
    api: 8,
    accent: "from-blue-600 to-cyan-500",
    icon: Zap,
  },
  {
    name: "Sora 2",
    company: "OpenAI",
    tagline: "25s clips, 1080p, cinematic quality, storyboard editor",
    highlights: [
      "Up to 25-second single generation",
      "1080p cinematic output quality",
      "Built-in storyboard editor",
      "Remix and extend capabilities",
      "Strong prompt adherence and coherence",
    ],
    pricing: "Plus $20/mo (50 videos), Pro $200/mo (unlimited), API $0.10-0.50/sec",
    bestFor: "Cinematic content, marketing videos, premium quality",
    bestAtTag: "Best Cinematic Quality",
    quality: 9.5,
    value: 6,
    api: 7,
    accent: "from-green-600 to-emerald-500",
    icon: Film,
  },
  {
    name: "Veo 3.1",
    company: "Google DeepMind",
    tagline: "Native audio generation, 1080p, Gemini integration",
    highlights: [
      "Native audio and dialogue generation",
      "1080p output with fast mode option",
      "Vertex AI integration for enterprise",
      "Gemini API support",
      "Fast mode at $0.15/sec for rapid iteration",
    ],
    pricing: "Free (ImageFX), API $0.15-0.40/sec via Vertex AI",
    bestFor: "Audio-synced content, enterprise, Google Cloud users",
    bestAtTag: "Best Audio Sync",
    quality: 9,
    value: 7,
    api: 9,
    accent: "from-red-600 to-orange-500",
    icon: Mic,
  },
  {
    name: "Vidu 2.5",
    company: "Shengshu Technology",
    tagline: "Fast generation, reference character consistency, budget-friendly",
    highlights: [
      "1080p output at competitive pricing",
      "Reference character consistency across clips",
      "Fast generation times",
      "Simple API integration",
      "Good value for rapid prototyping",
    ],
    pricing: "Free tier, Pro ~$10/mo, API ~$0.05-0.10/sec",
    bestFor: "Budget production, rapid prototyping, character-consistent clips",
    bestAtTag: "Best Budget Pick",
    quality: 7.5,
    value: 9.5,
    api: 8,
    accent: "from-violet-600 to-purple-500",
    icon: Layers,
  },
  {
    name: "Wan 2.1",
    company: "Alibaba",
    tagline: "Open source (Apache 2.0), self-hostable, VACE editing pipeline",
    highlights: [
      "Fully open source under Apache 2.0",
      "Self-hostable on consumer GPUs (4090)",
      "VACE video editing pipeline",
      "ComfyUI integration with LoRA support",
      "5-20x cheaper than API at scale",
    ],
    pricing: "Self-hosted $0.005-0.032/sec (GPU dependent), fal.ai API available",
    bestFor: "Self-hosted pipelines, budget at scale, open-source workflows",
    bestAtTag: "Cheapest at Scale",
    quality: 8,
    value: 10,
    api: 7,
    accent: "from-amber-600 to-yellow-500",
    icon: Server,
  },
  {
    name: "Runway Gen-4",
    company: "Runway ML",
    tagline: "Cinematic motion, multi-modal creative suite, style transfer",
    highlights: [
      "Advanced motion control and style transfer",
      "Multi-modal creative suite (image, video, 3D)",
      "Director mode for camera control",
      "Character and scene consistency tools",
      "Strong creative professional ecosystem",
    ],
    pricing: "Free tier, Standard $12/mo, Pro $28/mo, API $0.01/credit",
    bestFor: "Storyboarding, VFX concepts, creative professionals",
    bestAtTag: "Best Creative Suite",
    quality: 8.5,
    value: 6,
    api: 7,
    accent: "from-pink-600 to-rose-500",
    icon: Monitor,
  },
];

const costTable: CostRow[] = [
  { provider: "Wan 2.1 (4090, self-hosted)", perSecond: "$0.005", maxDuration: "Unlimited", resolution: "480p", audio: false, tier: "low" },
  { provider: "Kling 3.0 (web, Standard)", perSecond: "$0.018", maxDuration: "10s", resolution: "1080p", audio: false, tier: "low" },
  { provider: "fal.ai Kling 3.0", perSecond: "$0.029", maxDuration: "10s", resolution: "1080p", audio: false, tier: "low" },
  { provider: "Wan 2.1 (A100, self-hosted)", perSecond: "$0.032", maxDuration: "Unlimited", resolution: "720p", audio: false, tier: "low" },
  { provider: "Kling 3.0 (web, Professional)", perSecond: "$0.063", maxDuration: "10s", resolution: "1080p", audio: false, tier: "mid" },
  { provider: "Kling API O1 Standard", perSecond: "$0.084", maxDuration: "10s", resolution: "1080p", audio: false, tier: "mid" },
  { provider: "Sora 2 Standard", perSecond: "$0.100", maxDuration: "12s", resolution: "720p", audio: false, tier: "mid" },
  { provider: "Veo 3.1 Fast", perSecond: "$0.150", maxDuration: "8s", resolution: "1080p", audio: false, tier: "mid" },
  { provider: "Sora 2 Pro (720p)", perSecond: "$0.300", maxDuration: "25s", resolution: "720p", audio: false, tier: "high" },
  { provider: "Veo 3.1 Standard", perSecond: "$0.400", maxDuration: "8s", resolution: "1080p", audio: false, tier: "high" },
  { provider: "Sora 2 Pro (1080p)", perSecond: "$0.500", maxDuration: "25s", resolution: "1080p", audio: false, tier: "high" },
  { provider: "Veo 3.0 (video + audio)", perSecond: "$0.750", maxDuration: "8s", resolution: "1080p", audio: true, tier: "high" },
];

const jobData: { title: string; spec: string; rows: JobRow[] }[] = [
  {
    title: "5s Social Clip",
    spec: "720p",
    rows: [
      { provider: "Wan 2.1 (4090)", cost: "$0.03", notes: "480p, ~5 min gen time" },
      { provider: "Kling (web, Standard)", cost: "$0.09", notes: "Via credit system" },
      { provider: "fal.ai Kling 3.0", cost: "$0.15", notes: "API, fast" },
      { provider: "Sora 2 Standard", cost: "$0.50", notes: "720p" },
      { provider: "Veo 3.1 Fast", cost: "$0.75", notes: "1080p" },
      { provider: "Sora 2 Pro", cost: "$1.50", notes: "720p" },
    ],
  },
  {
    title: "8s Product Shot",
    spec: "1080p",
    rows: [
      { provider: "Kling (web, Standard)", cost: "$0.14", notes: "Via credit system" },
      { provider: "fal.ai Kling 3.0", cost: "$0.23", notes: "API" },
      { provider: "Wan 2.1 (A100)", cost: "$0.26", notes: "720p max native" },
      { provider: "Sora 2 Standard", cost: "$0.80", notes: "720p only" },
      { provider: "Veo 3.1 Fast", cost: "$1.20", notes: "1080p native" },
      { provider: "Veo 3.1 Standard", cost: "$3.20", notes: "1080p" },
      { provider: "Sora 2 Pro (1080p)", cost: "$4.00", notes: "1080p" },
    ],
  },
  {
    title: "15s Cinematic",
    spec: "1080p",
    rows: [
      { provider: "fal.ai Kling 3.0", cost: "$0.44", notes: "Max 10s, need splicing" },
      { provider: "Wan 2.1 (A100)", cost: "$0.48", notes: "720p, ~26 min gen" },
      { provider: "Kling (web, Professional)", cost: "$0.95", notes: "2x clips needed" },
      { provider: "Sora 2 Standard", cost: "$1.50", notes: "Max 12s, splice needed" },
      { provider: "Veo 3.1 Fast", cost: "$2.25", notes: "Max 8s, 2 clips" },
      { provider: "Veo 3.1 Standard", cost: "$6.00", notes: "Max 8s, 2 clips" },
      { provider: "Sora 2 Pro (1080p)", cost: "$7.50", notes: "Native 15s support" },
    ],
  },
  {
    title: "30s Treatment/Demo",
    spec: "1080p",
    rows: [
      { provider: "fal.ai Kling 3.0", cost: "$0.87", notes: "3x 10s clips" },
      { provider: "Wan 2.1 (A100)", cost: "$0.96", notes: "720p, ~52 min gen" },
      { provider: "Kling (web, Professional)", cost: "$1.89", notes: "3x 10s clips" },
      { provider: "Sora 2 Standard", cost: "$3.00", notes: "3x 10-12s clips" },
      { provider: "Veo 3.1 Fast", cost: "$4.50", notes: "4x 8s clips" },
      { provider: "Veo 3.1 Standard", cost: "$12.00", notes: "4x 8s clips" },
      { provider: "Sora 2 Pro (1080p)", cost: "$15.00", notes: "2x 15s or 25s+5s" },
    ],
  },
];

const volumeData: VolumeRow[] = [
  { provider: "Wan 2.1 (4090)", ten: "$0.27", fifty: "$1.35", hundred: "$25-40" },
  { provider: "Kling (web, Pro plan)", ten: "$0.90", fifty: "$4.50", hundred: "$25.99+$15" },
  { provider: "fal.ai Kling 3.0", ten: "$1.50", fifty: "$7.50", hundred: "$30-50" },
  { provider: "Sora 2 Standard", ten: "$5.00", fifty: "$25.00", hundred: "$100-165" },
  { provider: "Veo 3.1 Fast", ten: "$7.50", fifty: "$37.50", hundred: "$125-200" },
  { provider: "Sora 2 Pro", ten: "$15.00", fifty: "$75.00", hundred: "$300-500" },
];

const decisionMatrix: DecisionRow[] = [
  { need: "Need native audio?", recommendation: "Veo 3.0 or Kling 3.0 Omni", icon: Mic },
  { need: "Budget is the priority?", recommendation: "Wan 2.1 self-hosted or Kling web Pro", icon: DollarSign },
  { need: "Best possible quality?", recommendation: "Sora 2 Pro or Veo 3.1 Standard", icon: Star },
  { need: "API automation?", recommendation: "Veo 3.1 (Vertex AI) or Kling API", icon: Cpu },
  { need: "Open source / self-host?", recommendation: "Wan 2.1 (Apache 2.0)", icon: Server },
  { need: "Longest single clip?", recommendation: "Sora 2 Pro (up to 25s)", icon: Clock },
  { need: "Best quality per dollar?", recommendation: "Veo 3.1 Fast ($0.15/sec at 1080p)", icon: Zap },
  { need: "Fastest generation?", recommendation: "Kling Turbo or Veo 3.1 Fast", icon: Globe },
];

const kbCategories: KBCategory[] = [
  {
    name: "Comparisons",
    count: 25,
    docs: [
      "Seedance, Kling, Sora, Veo Ultimate Comparison",
      "Kling, Sora, Veo, Runway Reality Check",
      "15 Models Tested: Kling, Veo, and TeamDay",
      "Sora, Kling, Veo 6-Test Comparison (302.ai)",
      "Pixazo 7-Model Ultimate Comparison",
      "Veo 3 vs Sora 2 Full Comparison",
      "Sora 2 vs Veo 3: Tests, Pros, and Cons",
      "Wan 2.1 vs Sora: The Open-Source Contender",
      "Veo 3 vs Kling 2.1: Audio Sync Showdown",
      "AI Video Models Complete 2026 (Vibess)",
      "Sora 2 vs Kling: Realism Test (Crepal)",
      "Kling 3 vs Sora 2: Atlas Cloud Analysis",
      "AI Video API Pricing 2026",
      "Veo 3 vs Top Generators (Imagine)",
      "Open Source vs Commercial Video Gen",
      "Seedance, Veo, Sora, Wan, Kling: Which to Choose",
      "Best AI Video Generators 2026 (WaveSpeed)",
      "Veo 3.1 vs Sora 2 Pro (Wiro)",
      "AI Video Cost: Every API Compared",
      "Best Video Model 2026 (LaoZhang)",
      "Wan 2.1 vs Sora, Runway, Kling, Pika",
      "State of AI Video 2026: Market Shifts",
      "Veo 3, Sora 2, Runway Gen-3 Guide",
      "Top 10 Best AI Video Generators Tested",
      "AI Video Generators Ranked: The Definitive List",
    ],
  },
  {
    name: "Kling",
    count: 11,
    docs: [
      "Kling 3 Comprehensive Guide",
      "Kling 3 Prompting Guide",
      "Kling 3 Honest Review",
      "Kling API Integration Guide",
      "Kling 3 Omni: Audio-Visual Sync",
      "Kling Turbo vs 3 Comparison",
      "Kling Character Consistency and Elements",
      "Kling Multi-Shot Storyboarding",
      "Kling Image-to-Video Tutorial",
      "Kling Motion Control and Camera Director",
      "Kling API Reference (C7)",
    ],
  },
  {
    name: "Sora 2",
    count: 12,
    docs: [
      "OpenAI Sora 2 Official Announcement",
      "Sora 2 API Guide (Python)",
      "Sora 2 Prompting Guide (Official)",
      "Sora 2 Pro Features Review",
      "Sora 2 Pricing and API Costs",
      "Sora 2 vs Competitors Comparison",
      "Sora 2 Image-to-Video Guide",
      "Sora 2 Audio, Dialogue, and Sound Design",
      "Sora 2 Cinematic Filmmaking Techniques",
      "Sora 2 Complete Workflow and Automation",
      "Sora 2 Prompt Engineering (C7)",
      "OpenAI API Sora Endpoints (C7)",
    ],
  },
  {
    name: "Veo 3",
    count: 12,
    docs: [
      "Gemini API Video Generation Guide",
      "DeepMind Prompt Guide",
      "Ultimate Prompting Guide: Veo 3.1",
      "Veo 3.1 Creative Capabilities",
      "Prompting Veo 3 for Best Results",
      "Veo 3 Practical Tutorial",
      "Cinematic Camera Control",
      "Veo 3 Pricing, Resolution, and Config",
      "Veo 3 vs Sora Comparison",
      "Veo 3 Image-to-Video Guide",
      "Veo 3 Master Prompting Guide (C7)",
      "Gemini API Veo Endpoints (C7)",
    ],
  },
  {
    name: "Vidu",
    count: 4,
    docs: [
      "Vidu Capabilities Overview",
      "Vidu Pricing Q1 Verified",
      "Vidu Pricing Q2 Verified",
      "Vidu Pricing Q3 Verified",
    ],
  },
  {
    name: "Wan 2.1",
    count: 11,
    docs: [
      "Wan 2.1 Official GitHub Overview",
      "HuggingFace Diffusers Pipelines",
      "Wan 2.1 T2V Model Card and Setup",
      "Wan 2.1 I2V Image-to-Video Guide",
      "Wan2GP: GPU-Poor Video Generator",
      "Wan 2.2 MoE Upgrade Overview",
      "Wan 2.5 Preview: Audio-Visual Generation",
      "Wan 2.1 Prompting Guide",
      "Wan 2.1 vs Sora Comparison",
      "Wan 2.1 ComfyUI VRAM Optimization and LoRA",
      "Wan 2.1 Official Reference (C7)",
    ],
  },
  {
    name: "Guides",
    count: 3,
    docs: [
      "Budget Optimization Guide",
      "Model Comparison Guide",
      "Prompt Engineering Guide",
    ],
  },
  {
    name: "Pricing",
    count: 7,
    docs: [
      "Pricing: Sora 2",
      "Pricing: Veo 3",
      "Pricing: Kling",
      "Pricing: Wan (Self-Hosted)",
      "Pricing Comparison Matrix",
      "Pricing: Third-Party APIs",
      "Pricing: Vidu",
    ],
  },
  {
    name: "Prompt Framework",
    count: 6,
    docs: [
      "Kling Advanced Prompts",
      "Sora 2 Advanced Prompts",
      "Veo 3 Advanced Prompts",
      "Vidu Advanced Prompts",
      "Wan Advanced Prompts",
      "Cross-Model Optimization",
    ],
  },
  {
    name: "Treatment Pipeline",
    count: 18,
    docs: [
      "Treatment Pipeline Overview (Extraction)",
      "yt-dlp Extraction",
      "FFmpeg Clipping",
      "Apify YouTube Extraction",
      "Scene Detection",
      "Whisper Transcription",
      "Sora 2 Remix Treatment",
      "Kling Video Editing Treatment",
      "Wan VACE Treatment",
      "Style Transfer Treatment",
      "Upscaling and Enhancement Treatment",
      "Audio Replacement Treatment",
      "Shorts: Platform Specs",
      "Shorts: Hook Strategies",
      "Shorts: Auto-Captioning",
      "Shorts: AI Clip Selection",
      "Shorts: Vertical Reframing",
      "Shorts: Treatment Templates",
    ],
  },
];

/* ─── Helper Components ──────────────────────────────────────────────────────── */

function StarRating({ score, max = 10 }: { score: number; max?: number }) {
  const stars = Math.round((score / max) * 5);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
        />
      ))}
      <span className="text-xs font-mono text-slate-400 ml-1.5">{score}/{max}</span>
    </div>
  );
}

function CostBadge({ tier }: { tier: "low" | "mid" | "high" }) {
  const styles = {
    low: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
    mid: "bg-amber-900/50 text-amber-400 border-amber-700",
    high: "bg-red-900/50 text-red-400 border-red-700",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 text-xs rounded border ${styles[tier]}`}>
      {tier === "low" ? "Low" : tier === "mid" ? "Mid" : "High"}
    </span>
  );
}

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
      >
        <span className="font-medium text-white">{title}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{count} docs</span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </span>
      </button>
      {open && <div className="px-4 py-3 border-t border-slate-800">{children}</div>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */

export default function VideoGenComparison() {
  const totalDocs = kbCategories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <>
      <SEO
        title="AI Video Generation Comparison 2026"
        description="Compare every major AI video model: Kling 3.0, Sora 2, Veo 3.1, Vidu, Wan 2.1, and Runway Gen-4. Pricing, quality, speed, and API availability."
        keywords="AI video generation, Kling 3, Sora 2, Veo 3, Wan 2.1, Vidu, Runway Gen-4, video AI comparison, AI video pricing"
        path="vidgencomparison"
      />

      <div className="min-h-screen bg-slate-950 text-white">
        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-blue-900/20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs font-medium mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              {totalDocs} Research Documents -- 6 Models -- Updated March 2026
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              AI Video Generation
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                The Complete 2026 Guide
              </span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Compare every major AI video model: pricing, quality, speed, and API availability.
              Built from {totalDocs} research documents across 10 categories.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/imagecomparison"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                See Image Gen Comparison
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Platform Cards ─────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Platform Comparison</h2>
          <p className="text-slate-400 mb-8">Six models evaluated across quality, value, and API maturity.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {/* card header gradient */}
                  <div className={`h-1.5 bg-gradient-to-r ${p.accent}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        <p className="text-xs text-slate-500">{p.company}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${p.accent} bg-opacity-20`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${p.accent} text-white mb-3`}>
                      {p.bestAtTag}
                    </span>

                    <p className="text-sm text-slate-400 mb-4">{p.tagline}</p>

                    <ul className="space-y-1.5 mb-4">
                      {p.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                          {h}
                        </li>
                      ))}
                    </ul>

                    <div className="text-xs bg-slate-800/60 rounded-lg p-3 mb-4">
                      <span className="text-slate-500 block mb-1">Pricing</span>
                      <span className="text-slate-200">{p.pricing}</span>
                    </div>

                    <div className="text-xs mb-4">
                      <span className="text-slate-500">Best for: </span>
                      <span className="text-slate-300">{p.bestFor}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-500">Quality</span>
                        <StarRating score={p.quality} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Value</span>
                        <StarRating score={p.value} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">API</span>
                        <StarRating score={p.api} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Cost Per Second Table ──────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Cost Per Second</h2>
          <p className="text-slate-400 mb-8">
            Side-by-side API and platform pricing sorted from cheapest to most expensive.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Provider</th>
                  <th className="text-right px-4 py-3 font-medium">$/Second</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Max Duration</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Resolution</th>
                  <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Audio</th>
                  <th className="text-center px-4 py-3 font-medium">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {costTable.map((row) => (
                  <tr key={row.provider} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{row.provider}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{row.perSecond}</td>
                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{row.maxDuration}</td>
                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{row.resolution}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {row.audio ? (
                        <span className="text-emerald-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-slate-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CostBadge tier={row.tier} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Job Cost Comparison ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Job Cost Comparison</h2>
          <p className="text-slate-400 mb-8">
            Real-world cost for four common production jobs across all providers.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {jobData.map((job) => (
              <div key={job.title} className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800">
                  <h3 className="font-semibold text-sm">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.spec}</p>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {job.rows.map((row) => (
                    <div key={row.provider} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-900/30">
                      <div>
                        <span className="text-sm text-slate-300">{row.provider}</span>
                        <span className="block text-xs text-slate-500">{row.notes}</span>
                      </div>
                      <span className="font-mono text-sm text-slate-200 whitespace-nowrap ml-3">{row.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Monthly Volume Estimates ───────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Monthly Volume Estimates</h2>
          <p className="text-slate-400 mb-8">
            Estimated monthly spend for 5-second social clips at 720p. 100/month uses a mixed workload
            (60x 5s + 30x 8s + 10x 15s).
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Provider</th>
                  <th className="text-right px-4 py-3 font-medium">10/mo</th>
                  <th className="text-right px-4 py-3 font-medium">50/mo</th>
                  <th className="text-right px-4 py-3 font-medium">100/mo (mixed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {volumeData.map((row) => (
                  <tr key={row.provider} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{row.provider}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{row.ten}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{row.fifty}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{row.hundred}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Decision Matrix ────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Which Model Should You Use?</h2>
          <p className="text-slate-400 mb-8">
            Match your priority to the right provider.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {decisionMatrix.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.need}
                  className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-900/30 border border-purple-800/50 shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 mb-1">{d.need}</p>
                    <p className="text-sm text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                      {d.recommendation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hybrid Strategy */}
          <div className="mt-8 rounded-xl border border-blue-800/50 bg-blue-900/10 p-5">
            <h3 className="font-semibold text-blue-300 mb-3">Recommended Hybrid Strategy</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">1.</span>
                <span><strong className="text-white">Daily social content:</strong> Kling Pro plan ($25.99/mo) -- cheapest all-in for high-volume short clips</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">2.</span>
                <span><strong className="text-white">Product shots:</strong> Veo 3.1 Fast ($0.15/sec) -- best quality-to-cost at 1080p</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">3.</span>
                <span><strong className="text-white">Hero cinematic pieces:</strong> Sora 2 Pro or Veo 3.1 Standard for final renders only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">4.</span>
                <span><strong className="text-white">At scale (200+ videos/mo):</strong> Self-hosted Wan 2.1 for maximum savings, requires DevOps</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Estimated monthly budget for 100 mixed videos with hybrid approach: $50-$80
            </p>
          </div>
        </section>

        {/* ── KB Documents ───────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Research Library</h2>
          <p className="text-slate-400 mb-8">
            {totalDocs} documents across {kbCategories.length} categories powering this analysis. Every claim on
            this page is backed by primary-source research.
          </p>

          <div className="space-y-3">
            {kbCategories.map((cat) => (
              <CollapsibleSection key={cat.name} title={cat.name} count={cat.count}>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {cat.docs.map((doc) => (
                    <li key={doc} className="flex items-start gap-2 text-sm text-slate-400">
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            ))}
          </div>
        </section>

        {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/20 p-8 sm:p-12 text-center">
            <Video className="w-10 h-10 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Atlas UX uses this research to power autonomous video creation for your business
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-6">
              Our AI agents leverage {totalDocs} research documents, the treatment pipeline, and
              prompt frameworks to produce professional video content at scale -- without you lifting
              a finger.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/configure"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/imagecomparison"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                Image Gen Comparison
              </Link>
            </div>
          </div>
        </section>

        {/* bottom spacing */}
        <div className="h-8" />
      </div>
    </>
  );
}
