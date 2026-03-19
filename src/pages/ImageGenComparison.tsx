import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Star,
  Zap,
  Image,
  Code,
  DollarSign,
  Layers,
  BookOpen,
  FileText,
  Sparkles,
  ExternalLink,
  Video,
  Minus,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type Platform = {
  name: string;
  subtitle: string;
  price: string;
  bestFor: string;
  quality: number;
  value: number;
  api: number;
  tag: string;
  tagColor: string;
};

type CostRow = {
  platform: string;
  cost: string;
  freeTier: string;
  apiAvailable: string;
  bestMode: string;
  tier: "green" | "yellow" | "red" | "free";
};

type DecisionRow = {
  useCase: string;
  pick1: string;
  pick2: string;
  pick3: string;
};

type FeatureRow = {
  feature: string;
  values: Record<string, "yes" | "no" | "limited" | "fair" | "good" | "great" | "best" | "poor" | "varies">;
};

type RatingRow = {
  category: string;
  ratings: Record<string, number>;
};

/* ─── Data ────────────────────────────────────────────────────────────────── */

const platforms: Platform[] = [
  {
    name: "Midjourney",
    subtitle: "Aesthetic king, no API",
    price: "$10-120/mo (subscription tiers)",
    bestFor: "Art direction, brand aesthetics, creative campaigns",
    quality: 10, value: 7, api: 1,
    tag: "Best Aesthetics",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    name: "DALL-E 3",
    subtitle: "Best text-in-images via API",
    price: "$0.04-0.12/image (API), included in ChatGPT Plus",
    bestFor: "Text rendering, marketing materials, API automation",
    quality: 8, value: 8, api: 10,
    tag: "Best API",
    tagColor: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  {
    name: "ChatGPT Image Gen",
    subtitle: "Conversational iteration (GPT-4o)",
    price: "Included in ChatGPT Plus ($20/mo)",
    bestFor: "Iterative design, memes, quick mockups",
    quality: 8.5, value: 9, api: 3,
    tag: "Easiest to Use",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    name: "FLUX",
    subtitle: "Open source speed king (Black Forest Labs)",
    price: "Free (Schnell), $0.014-0.06/image (Pro API)",
    bestFor: "Photorealism, fast generation, self-hosted pipelines",
    quality: 9, value: 10, api: 9,
    tag: "Best Open Source",
    tagColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  {
    name: "Stability AI",
    subtitle: "Open ecosystem (Stable Diffusion)",
    price: "Free (self-hosted), $0.002-0.08/image (API)",
    bestFor: "Inpainting, batch generation, ControlNet precision",
    quality: 8, value: 10, api: 8,
    tag: "Best Ecosystem",
    tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    name: "Ideogram",
    subtitle: "Typography champion",
    price: "Free tier, $7-60/mo, API $0.04-0.10/image",
    bestFor: "Logos, posters, text-heavy graphics, t-shirt designs",
    quality: 8.5, value: 9, api: 9,
    tag: "Best Typography",
    tagColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  },
  {
    name: "Adobe Firefly",
    subtitle: "Commercially safe",
    price: "Free tier, $9.99-199.99/mo",
    bestFor: "Brand assets, Photoshop integration, enterprise",
    quality: 8, value: 7, api: 6,
    tag: "Enterprise Ready",
    tagColor: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  {
    name: "Google Imagen",
    subtitle: "Free photorealism",
    price: "Free (ImageFX), Vertex AI API pricing",
    bestFor: "Photorealistic stock photos, Google Cloud integration",
    quality: 9, value: 10, api: 7,
    tag: "Best Free Option",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    name: "Leonardo.ai",
    subtitle: "Game asset specialist",
    price: "Free (150 tokens/day), $12-60/mo",
    bestFor: "Game assets, textures, character design",
    quality: 8, value: 8, api: 7,
    tag: "Best for Gaming",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    name: "Runway",
    subtitle: "Cinematic stills",
    price: "Free tier, $12-76/mo",
    bestFor: "Film stills, storyboards, VFX concepts",
    quality: 8.5, value: 6, api: 7,
    tag: "Best Cinematic",
    tagColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  {
    name: "Canva AI",
    subtitle: "Design workflow",
    price: "Free tier, Pro $12.99/mo",
    bestFor: "Social media graphics, presentations, team collaboration",
    quality: 7, value: 8, api: 2,
    tag: "Best Workflow",
    tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    name: "Freepik AI",
    subtitle: "Stock replacement",
    price: "Free tier, $5.75-24.50/mo",
    bestFor: "Stock photo replacement, marketing materials",
    quality: 7, value: 9, api: 5,
    tag: "Best Stock Alt",
    tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
  {
    name: "NightCafe",
    subtitle: "Multi-model explorer",
    price: "Free (5/day), $5.99-49.99/mo",
    bestFor: "Artistic exploration, style transfer, community",
    quality: 7.5, value: 7, api: 1,
    tag: "Best Community",
    tagColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  },
  {
    name: "Fotor AI",
    subtitle: "Photo editing + AI",
    price: "Free tier, $8.99-19.99/mo",
    bestFor: "Photo enhancement, quick edits, beginners",
    quality: 6.5, value: 8, api: 1,
    tag: "Best Photo Editor",
    tagColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  {
    name: "Pixlr",
    subtitle: "Browser-based editing",
    price: "Free tier, $4.90-14.99/mo",
    bestFor: "Quick edits, background removal, casual use",
    quality: 6, value: 8, api: 1,
    tag: "Most Accessible",
    tagColor: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  },
  {
    name: "Banana/Nano",
    subtitle: "GPU inference platform",
    price: "Per-second GPU billing",
    bestFor: "Custom model deployment, serverless inference",
    quality: 0, value: 8, api: 9,
    tag: "Custom Deploy",
    tagColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
];

const costData: CostRow[] = [
  { platform: "Stable Diffusion (self-hosted)", cost: "~$0.001", freeTier: "Yes (open source)", apiAvailable: "Yes", bestMode: "SDXL/SD3", tier: "green" },
  { platform: "FLUX Schnell (self-hosted)", cost: "~$0.002", freeTier: "Yes (Apache 2.0)", apiAvailable: "Yes", bestMode: "Schnell", tier: "green" },
  { platform: "Google Imagen (ImageFX)", cost: "Free", freeTier: "Yes", apiAvailable: "Yes (Vertex)", bestMode: "Imagen 3", tier: "free" },
  { platform: "Freepik AI", cost: "~$0.02", freeTier: "Yes", apiAvailable: "Limited", bestMode: "Mystic 2.5", tier: "green" },
  { platform: "FLUX Pro (API)", cost: "$0.014-0.06", freeTier: "No", apiAvailable: "Yes", bestMode: "Pro 1.1", tier: "green" },
  { platform: "Stability AI (API)", cost: "$0.002-0.08", freeTier: "No", apiAvailable: "Yes", bestMode: "Ultra", tier: "green" },
  { platform: "Runway", cost: "~$0.02-0.08", freeTier: "Limited", apiAvailable: "Yes", bestMode: "Gen-4", tier: "green" },
  { platform: "DALL-E 3 (API)", cost: "$0.04-0.12", freeTier: "No", apiAvailable: "Yes", bestMode: "HD", tier: "yellow" },
  { platform: "Ideogram (API)", cost: "$0.04-0.10", freeTier: "Yes", apiAvailable: "Yes", bestMode: "Quality", tier: "yellow" },
  { platform: "NightCafe", cost: "~$0.04-0.15", freeTier: "Yes (5/day)", apiAvailable: "No", bestMode: "Multi-model", tier: "yellow" },
  { platform: "Leonardo.ai", cost: "~$0.05", freeTier: "Yes", apiAvailable: "Yes", bestMode: "Phoenix", tier: "yellow" },
  { platform: "Adobe Firefly", cost: "~$0.05-0.20", freeTier: "Yes", apiAvailable: "Limited", bestMode: "Image 3", tier: "yellow" },
  { platform: "Midjourney", cost: "~$0.05-0.60", freeTier: "No", apiAvailable: "No", bestMode: "V7", tier: "red" },
  { platform: "ChatGPT (Plus)", cost: "~$0.10", freeTier: "Limited", apiAvailable: "No", bestMode: "GPT-4o", tier: "yellow" },
  { platform: "Canva AI", cost: "~$0.10", freeTier: "Limited", apiAvailable: "No", bestMode: "Magic Media", tier: "yellow" },
  { platform: "Fotor AI", cost: "~$0.10", freeTier: "Limited", apiAvailable: "No", bestMode: "AI Art", tier: "yellow" },
  { platform: "Pixlr", cost: "~$0.10", freeTier: "Limited", apiAvailable: "No", bestMode: "AI Generate", tier: "yellow" },
];

const decisionMatrix: DecisionRow[] = [
  { useCase: "Product Photography", pick1: "FLUX Pro", pick2: "Midjourney", pick3: "DALL-E 3" },
  { useCase: "Social Media Graphics", pick1: "Canva AI", pick2: "Ideogram", pick3: "DALL-E 3" },
  { useCase: "Logos & Text", pick1: "Ideogram", pick2: "DALL-E 3", pick3: "ChatGPT" },
  { useCase: "Photorealism", pick1: "Midjourney", pick2: "FLUX", pick3: "Google Imagen" },
  { useCase: "Game Assets", pick1: "Leonardo.ai", pick2: "Stability AI", pick3: "FLUX" },
  { useCase: "Marketing Materials", pick1: "DALL-E 3", pick2: "Adobe Firefly", pick3: "Canva AI" },
  { useCase: "Art & Creative", pick1: "Midjourney", pick2: "NightCafe", pick3: "Stability AI" },
  { useCase: "API Automation", pick1: "DALL-E 3", pick2: "FLUX Pro", pick3: "Ideogram" },
  { useCase: "Budget / Free", pick1: "Google Imagen", pick2: "FLUX Schnell", pick3: "Stability AI" },
  { useCase: "Enterprise", pick1: "Adobe Firefly", pick2: "Google Imagen", pick3: "DALL-E 3" },
];

const featureHeaders = ["MJ", "DALL-E", "ChatGPT", "FLUX", "SD", "Ideogram", "Firefly", "Imagen"];

const featureMatrix: FeatureRow[] = [
  { feature: "API Access", values: { MJ: "no", "DALL-E": "yes", ChatGPT: "no", FLUX: "yes", SD: "yes", Ideogram: "yes", Firefly: "limited", Imagen: "yes" } },
  { feature: "Text Rendering", values: { MJ: "fair", "DALL-E": "great", ChatGPT: "great", FLUX: "good", SD: "poor", Ideogram: "best", Firefly: "fair", Imagen: "good" } },
  { feature: "Inpainting", values: { MJ: "no", "DALL-E": "no", ChatGPT: "no", FLUX: "limited", SD: "best", Ideogram: "yes", Firefly: "best", Imagen: "limited" } },
  { feature: "Self-Host", values: { MJ: "no", "DALL-E": "no", ChatGPT: "no", FLUX: "yes", SD: "yes", Ideogram: "no", Firefly: "no", Imagen: "no" } },
  { feature: "Free Tier", values: { MJ: "no", "DALL-E": "no", ChatGPT: "limited", FLUX: "yes", SD: "yes", Ideogram: "yes", Firefly: "yes", Imagen: "yes" } },
  { feature: "Commercial Use", values: { MJ: "limited", "DALL-E": "yes", ChatGPT: "yes", FLUX: "varies", SD: "yes", Ideogram: "limited", Firefly: "yes", Imagen: "yes" } },
  { feature: "Batch Generate", values: { MJ: "no", "DALL-E": "yes", ChatGPT: "no", FLUX: "yes", SD: "yes", Ideogram: "yes", Firefly: "yes", Imagen: "yes" } },
];

const qualityHeaders = ["Midjourney", "FLUX", "DALL-E 3", "Ideogram", "SD", "Firefly"];

const qualityRatings: RatingRow[] = [
  { category: "Photorealism", ratings: { Midjourney: 10, FLUX: 9, "DALL-E 3": 8, Ideogram: 7, SD: 7, Firefly: 8 } },
  { category: "Text Rendering", ratings: { Midjourney: 5, FLUX: 7, "DALL-E 3": 9, Ideogram: 10, SD: 3, Firefly: 5 } },
  { category: "Art / Creative", ratings: { Midjourney: 10, FLUX: 7, "DALL-E 3": 7, Ideogram: 7, SD: 8, Firefly: 6 } },
  { category: "Speed", ratings: { Midjourney: 6, FLUX: 10, "DALL-E 3": 8, Ideogram: 8, SD: 10, Firefly: 7 } },
  { category: "Consistency", ratings: { Midjourney: 9, FLUX: 8, "DALL-E 3": 8, Ideogram: 8, SD: 5, Firefly: 8 } },
];

/* ─── KB Document Index ───────────────────────────────────────────────────── */

type KBSection = { title: string; docs: string[] };

const kbPlatformSections: KBSection[] = [
  { title: "Midjourney", docs: ["Overview & Capabilities", "Pricing & Plans", "Best Practices & Prompting", "Quality Comparison", "Limitations & Workarounds", "Use Case Gallery"] },
  { title: "DALL-E 3 / OpenAI", docs: ["API Reference & Integration", "Pricing Breakdown", "Text Rendering Analysis", "Comparison vs Midjourney", "Enterprise Use Cases", "Prompt Engineering Guide"] },
  { title: "ChatGPT Image Gen (GPT-4o)", docs: ["Conversational Workflow", "Capabilities & Limits", "vs DALL-E 3 Direct API", "Meme & Social Content", "Iterative Design Patterns", "Cost Analysis"] },
  { title: "FLUX (Black Forest Labs)", docs: ["Architecture Deep Dive", "Schnell vs Pro vs Dev", "Self-Hosting Guide", "API Integration", "Benchmark Results", "LoRA & Fine-Tuning"] },
  { title: "Stability AI / Stable Diffusion", docs: ["Model Evolution (SD1.5 to SD3)", "ControlNet & Inpainting", "ComfyUI Workflow Guide", "API Documentation", "Community Ecosystem", "Enterprise Deployment"] },
  { title: "Ideogram", docs: ["Typography Deep Dive", "API & Pricing", "Logo Design Workflow", "vs Midjourney Comparison", "Poster & Print Design", "Brand Asset Creation"] },
  { title: "Adobe Firefly", docs: ["Commercial Safety Analysis", "Photoshop Integration", "Enterprise Features", "Pricing Tiers", "Content Credentials", "Creative Cloud Workflow"] },
  { title: "Google Imagen", docs: ["ImageFX Free Tier", "Vertex AI API", "Photorealism Benchmarks", "Google Cloud Integration", "Safety & Watermarking", "Enterprise Pricing"] },
  { title: "Leonardo.ai", docs: ["Game Asset Pipeline", "Model Selection Guide", "Token Economy", "Character Design Workflow", "Texture Generation", "API Documentation"] },
  { title: "Runway", docs: ["Image to Video Pipeline", "Cinematic Stills", "Gen-4 Capabilities", "Pricing Analysis", "VFX Workflow", "Enterprise Plans"] },
  { title: "Canva AI", docs: ["Magic Media Overview", "Design Workflow Integration", "Team Collaboration", "Pricing vs Alternatives", "Social Media Templates", "Brand Kit Usage"] },
  { title: "Freepik AI", docs: ["Mystic Model Analysis", "Stock Replacement Strategy", "Pricing Comparison", "Marketing Material Workflow", "Quality Assessment", "API Capabilities"] },
  { title: "NightCafe", docs: ["Multi-Model Access", "Style Transfer Guide", "Community Features", "Credit System Analysis", "Artistic Workflows", "Platform Comparison"] },
  { title: "Fotor AI", docs: ["Photo Enhancement Pipeline", "AI Art Generation", "Pricing & Plans", "Beginner Guide", "vs Canva Comparison", "Feature Overview"] },
  { title: "Pixlr", docs: ["Browser-Based Editing", "Background Removal", "AI Generation Features", "Free vs Premium", "Quick Edit Workflows", "Accessibility Analysis"] },
  { title: "Banana/Nano", docs: ["GPU Infrastructure", "Custom Model Deployment", "Per-Second Billing", "Serverless Architecture", "Integration Guide", "Performance Benchmarks"] },
];

const kbCrossPlatform: KBSection[] = [
  { title: "Pricing Analysis", docs: ["Cost-Per-Image Calculator (All Platforms)", "Subscription vs Pay-Per-Use Analysis", "Enterprise Volume Pricing Guide"] },
  { title: "Comparisons", docs: ["16-Platform Feature Matrix", "API Quality Benchmark Suite", "Text Rendering Shootout", "Photorealism Leaderboard", "Speed & Throughput Comparison"] },
  { title: "Guides", docs: ["Choosing the Right Generator for Your Business", "Self-Hosted vs Cloud: Decision Framework", "Multi-Platform Workflow Architecture", "Image Gen for Marketing Teams", "Scaling Image Generation for E-Commerce"] },
  { title: "Prompt Framework", docs: ["Universal Prompt Anatomy", "Platform-Specific Syntax Guide", "Negative Prompting Best Practices", "Style Transfer Prompt Library", "Commercial Photography Prompt Templates"] },
];

/* ─── Helper Components ───────────────────────────────────────────────────── */

function StarRating({ score, max = 10 }: { score: number; max?: number }) {
  const stars = Math.round((score / max) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
        />
      ))}
      <span className="text-xs font-mono text-slate-400 ml-1">{score}/{max}</span>
    </div>
  );
}

function FeatureBadge({ value }: { value: string }) {
  switch (value) {
    case "yes":
      return <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-4 h-4" /> Yes</span>;
    case "no":
      return <span className="inline-flex items-center gap-1 text-red-400"><X className="w-4 h-4" /> No</span>;
    case "limited":
      return <span className="inline-flex items-center gap-1 text-amber-400"><Minus className="w-4 h-4" /> Ltd</span>;
    case "best":
      return <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold"><Star className="w-4 h-4" /> Best</span>;
    case "great":
      return <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-4 h-4" /> Great</span>;
    case "good":
      return <span className="inline-flex items-center gap-1 text-blue-400"><Check className="w-4 h-4" /> Good</span>;
    case "fair":
      return <span className="inline-flex items-center gap-1 text-amber-400"><Minus className="w-4 h-4" /> Fair</span>;
    case "poor":
      return <span className="inline-flex items-center gap-1 text-red-400"><X className="w-4 h-4" /> Poor</span>;
    case "varies":
      return <span className="inline-flex items-center gap-1 text-amber-400"><Minus className="w-4 h-4" /> Varies</span>;
    default:
      return <span className="text-slate-500">{value}</span>;
  }
}

function CostBadge({ tier }: { tier: CostRow["tier"] }) {
  const cls =
    tier === "free" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
    tier === "green" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    tier === "yellow" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
    "bg-red-500/10 text-red-400 border-red-500/20";
  return <span className={`inline-block px-2 py-0.5 text-xs font-mono rounded border ${cls}`}>
    {tier === "free" ? "FREE" : tier === "green" ? "LOW" : tier === "yellow" ? "MID" : "HIGH"}
  </span>;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-900/50 hover:bg-slate-900 transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-white font-semibold">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {open && <div className="px-5 py-4 bg-slate-950">{children}</div>}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function ImageGenComparison() {
  const [showAllKB, setShowAllKB] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            100+ Research Documents &middot; 16 Platforms &middot; Updated March 2026
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            AI Image Generation
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Complete 2026 Guide
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
            Compare 16 major AI image generators: pricing, quality, API access, and best use cases
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/vidgencomparison"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors"
            >
              <Video className="w-4 h-4" />
              Video Gen Comparison
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 pb-24">

        {/* ── Platform Cards Grid ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">16 Platforms Compared</h2>
          <p className="text-slate-400 mb-8">Everything you need to know at a glance.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="group relative border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 p-5 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.subtitle}</p>
                  </div>
                  <span className={`shrink-0 ml-2 inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${p.tagColor}`}>
                    {p.tag}
                  </span>
                </div>

                <div className="text-sm text-slate-300 mb-3">
                  <span className="text-slate-500">Price:</span> {p.price}
                </div>
                <div className="text-sm text-slate-400 mb-4">
                  <span className="text-slate-500">Best for:</span> {p.bestFor}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Quality</span>
                    {p.quality > 0 ? <StarRating score={p.quality} /> : <span className="text-xs text-slate-600">Varies</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Value</span>
                    <StarRating score={p.value} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">API</span>
                    <StarRating score={p.api} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Cost Comparison Table ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl sm:text-3xl font-bold">Cost Comparison</h2>
          </div>
          <p className="text-slate-400 mb-6">Sorted cheapest first. Color-coded by cost tier.</p>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[700px] px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Platform</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Cost / Image</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Free Tier</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">API</th>
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Best Mode</th>
                    <th className="text-center py-3 px-3 text-slate-400 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.map((row, i) => (
                    <tr key={row.platform} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                      <td className="py-3 px-3 text-white font-medium">{row.platform}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{row.cost}</td>
                      <td className="py-3 px-3 text-slate-400">{row.freeTier}</td>
                      <td className="py-3 px-3 text-slate-400">{row.apiAvailable}</td>
                      <td className="py-3 px-3 text-slate-400">{row.bestMode}</td>
                      <td className="py-3 px-3 text-center"><CostBadge tier={row.tier} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Decision Matrix ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl sm:text-3xl font-bold">Which Generator Should I Use?</h2>
          </div>
          <p className="text-slate-400 mb-6">Top picks for every common use case.</p>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[500px] px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Use Case</th>
                    <th className="text-left py-3 px-3 text-amber-400 font-medium">#1 Pick</th>
                    <th className="text-left py-3 px-3 text-slate-300 font-medium">#2 Pick</th>
                    <th className="text-left py-3 px-3 text-amber-700 font-medium">#3 Pick</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionMatrix.map((row, i) => (
                    <tr key={row.useCase} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                      <td className="py-3 px-3 text-white font-medium">{row.useCase}</td>
                      <td className="py-3 px-3 text-amber-300 font-semibold">{row.pick1}</td>
                      <td className="py-3 px-3 text-slate-300">{row.pick2}</td>
                      <td className="py-3 px-3 text-slate-400">{row.pick3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Feature Comparison Matrix ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl sm:text-3xl font-bold">Feature Comparison</h2>
          </div>
          <p className="text-slate-400 mb-6">Key capabilities across the top 8 platforms.</p>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[700px] px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Feature</th>
                    {featureHeaders.map((h) => (
                      <th key={h} className="text-center py-3 px-2 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                      <td className="py-3 px-3 text-white font-medium">{row.feature}</td>
                      {featureHeaders.map((h) => (
                        <td key={h} className="py-3 px-2 text-center">
                          <FeatureBadge value={row.values[h]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Quality Ratings by Category ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl sm:text-3xl font-bold">Quality Ratings by Category</h2>
          </div>
          <p className="text-slate-400 mb-6">Head-to-head quality scores across 5 dimensions.</p>

          <div className="space-y-6">
            {qualityRatings.map((row) => (
              <div key={row.category} className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{row.category}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {qualityHeaders.map((h) => (
                    <div key={h} className="space-y-1">
                      <div className="text-xs text-slate-500 truncate">{h}</div>
                      <StarRating score={row.ratings[h]} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── KB Documents ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl sm:text-3xl font-bold">Research Library</h2>
          </div>
          <p className="text-slate-400 mb-6">
            100+ documents covering every platform, pricing model, and use case.
          </p>

          {/* Cross-platform sections always visible */}
          <div className="space-y-3 mb-6">
            {kbCrossPlatform.map((section) => (
              <CollapsibleSection
                key={section.title}
                title={`${section.title} (${section.docs.length} docs)`}
                icon={<BookOpen className="w-5 h-5 text-indigo-400" />}
                defaultOpen={false}
              >
                <ul className="space-y-2">
                  {section.docs.map((doc) => (
                    <li key={doc} className="flex items-center gap-2 text-sm text-slate-300">
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            ))}
          </div>

          {/* Per-platform sections toggled */}
          <button
            onClick={() => setShowAllKB(!showAllKB)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors mb-4"
          >
            <Image className="w-4 h-4" />
            {showAllKB ? "Hide" : "Show"} Platform-Specific Documents ({kbPlatformSections.length} platforms, {kbPlatformSections.length * 6} docs)
            {showAllKB ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAllKB && (
            <div className="space-y-3">
              {kbPlatformSections.map((section) => (
                <CollapsibleSection
                  key={section.title}
                  title={`${section.title} (${section.docs.length} docs)`}
                  icon={<Image className="w-5 h-5 text-purple-400" />}
                >
                  <ul className="space-y-2">
                    {section.docs.map((doc) => (
                      <li key={doc} className="flex items-center gap-2 text-sm text-slate-300">
                        <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              ))}
            </div>
          )}
        </section>

        {/* ── Footer CTA ─────────────────────────────────────────────────── */}
        <section className="text-center border border-slate-800 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950 p-8 sm:p-12">
          <Zap className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Atlas UX uses this research to power autonomous image creation for your business
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-6">
            Our AI agents select the optimal generator, craft the prompt, and deliver production-ready visuals -- no manual work required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/configure"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/vidgencomparison"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium transition-colors"
            >
              <Video className="w-4 h-4" />
              Video Gen Comparison
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
