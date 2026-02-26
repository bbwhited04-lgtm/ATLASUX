import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Crown,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  Sparkles,
  ShoppingBag,
  Gift,
  FileText,
  Star,
  Briefcase,
  Brain,
  PenTool,
  Camera,
  Mail,
  Calculator,
  BookOpen,
  Lightbulb,
  Cpu,
  Palette,
  Workflow,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";

/* ─── Digital Products ─────────────────────────────────────────────────────── */

type DigitalProduct = {
  id: string;
  name: string;
  description: string;
  price: number; // 0 = free
  priceLabel: string;
  promptCount: number;
  icon: any;
  color: string;
  badge?: string;
  highlights: string[];
  downloadUrl?: string; // direct download for free items
  paymentLink?: string; // Stripe link for paid items
};

const digitalProducts: DigitalProduct[] = [
  {
    id: "50-chatgpt-free",
    name: "50 ChatGPT Prompts",
    description:
      "Get started with 50 hand-crafted prompts covering content creation, business strategy, marketing, productivity, and learning. Ready to copy-paste.",
    price: 0,
    priceLabel: "FREE",
    promptCount: 50,
    icon: Gift,
    color: "from-emerald-500 to-teal-500",
    badge: "Free Download",
    highlights: [
      "10 content creation prompts",
      "10 business & strategy prompts",
      "10 marketing & growth prompts",
      "10 productivity & personal prompts",
      "10 learning & research prompts",
    ],
    downloadUrl: "/downloads/50-chatgpt-prompts-free.txt",
  },
  {
    id: "100-chatgpt-ai-tools",
    name: "100 ChatGPT & AI Tools Prompts",
    description:
      "Level up with 100 advanced prompts for ChatGPT, Midjourney, DALL-E, and more. Covers coding, data analysis, AI image generation, email automation, and competitive research.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 100,
    icon: Sparkles,
    color: "from-cyan-500 to-blue-500",
    badge: "Best Value",
    highlights: [
      "15 advanced content creation prompts",
      "15 social media mastery prompts",
      "15 coding & development prompts",
      "10 AI image generation prompts",
      "10 data analysis & insights prompts",
      "10 email marketing prompts",
      "10 business automation prompts",
      "10 research & intelligence prompts",
      "5 career & personal brand prompts",
    ],
    paymentLink: "https://buy.stripe.com/28E28s8Xf45F622cfF8IU0e",
    downloadUrl: "/downloads/100-chatgpt-ai-tools-prompts.txt",
  },
  {
    id: "200-ecommerce-pod",
    name: "200 E-commerce & POD Prompts",
    description:
      "The ultimate prompt pack for online sellers. Covers product listings, Print-on-Demand designs, SEO, ad copy, and platform-specific prompts for Etsy, Shopify, and Amazon.",
    price: 1.99,
    priceLabel: "$1.99",
    promptCount: 200,
    icon: ShoppingBag,
    color: "from-purple-500 to-pink-500",
    badge: "Most Popular",
    highlights: [
      "20 product listing optimization prompts",
      "25 Print-on-Demand design idea prompts",
      "20 SEO for e-commerce prompts",
      "20 social media marketing prompts",
      "20 ad copy & paid marketing prompts",
      "15 niche research & validation prompts",
      "15 email marketing for stores prompts",
      "15 customer service & reviews prompts",
      "15 store branding & copywriting prompts",
      "15 Etsy-specific prompts",
      "10 Shopify-specific prompts",
      "10 Amazon-specific prompts",
    ],
    paymentLink: "https://buy.stripe.com/9B67sMc9rau3aiigvV8IU0d",
    downloadUrl: "/downloads/200-ecommerce-pod-prompts.txt",
  },
  {
    id: "50-small-business",
    name: "50 Prompts for Small Business",
    description:
      "AI marketing and content templates built for small business owners. Covers local SEO, email campaigns, sales copy, social media calendars, and customer engagement.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 50,
    icon: Briefcase,
    color: "from-amber-500 to-orange-500",
    highlights: [
      "10 marketing strategy & planning prompts",
      "10 social media content templates",
      "8 email marketing for small business",
      "7 local business & SEO prompts",
      "8 sales copy & conversion prompts",
      "7 content creation shortcuts",
    ],
    paymentLink: "https://buy.stripe.com/7sYbJ26P78lVbmm0wX8IU0f",
    downloadUrl: "/downloads/50-small-business-prompts.txt",
  },
  {
    id: "50-personalize-ai",
    name: "50 Prompts to Personalize AI",
    description:
      "Train AI to match your voice, build custom assistants, and integrate AI into your daily workflow. The guide to making ChatGPT truly yours.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 50,
    icon: Brain,
    color: "from-violet-500 to-indigo-500",
    highlights: [
      "10 teach AI your voice & tone prompts",
      "10 custom AI assistant prompts",
      "8 daily workflow integration prompts",
      "7 personal knowledge management",
      "8 AI-powered personal brand prompts",
      "7 creative & thinking partner prompts",
    ],
    paymentLink: "https://buy.stripe.com/4gMeVe1uN7hR6221B18IU0g",
    downloadUrl: "/downloads/50-personalize-ai-prompts.txt",
  },
  {
    id: "50-marketing-copywriting",
    name: "50 AI Copywriting Prompts",
    description:
      "Professional copy templates for emails, ads, landing pages, and social media. Write high-converting marketing copy in minutes with ChatGPT.",
    price: 1.99,
    priceLabel: "$1.99",
    promptCount: 50,
    icon: PenTool,
    color: "from-rose-500 to-red-500",
    badge: "Pro Copy",
    highlights: [
      "10 email copy templates",
      "10 ad copy & headline prompts",
      "10 landing page copy prompts",
      "10 social media copy prompts",
      "10 sales & conversion copy prompts",
    ],
    paymentLink: "https://buy.stripe.com/5kQ7sMflDeKjgGGa7x8IU0h",
    downloadUrl: "/downloads/50-marketing-copywriting-prompts.txt",
  },
  {
    id: "50-camera-ai-image",
    name: "50 Camera-Inspired AI Image Prompts",
    description:
      "Photorealistic DSLR-style prompts with real camera models, lens specs, and lighting setups. Copy-paste into ChatGPT, Gemini, Grok, Copilot, or Midjourney.",
    price: 1.99,
    priceLabel: "$1.99",
    promptCount: 50,
    icon: Camera,
    color: "from-sky-500 to-blue-600",
    badge: "New",
    highlights: [
      "10 portrait & people photography",
      "10 product & commercial photography",
      "10 landscape & architecture prompts",
      "10 creative & artistic effects",
      "10 DSLR technical style prompts",
    ],
    paymentLink: "https://buy.stripe.com/eVq00k3CVcCb9ee5Rh8IU0i",
    downloadUrl: "/downloads/50-camera-ai-image-prompts.txt",
  },
  {
    id: "50-business-email",
    name: "50 Business Email Prompts",
    description:
      "Professional email templates for every situation — cold outreach, sales, client management, internal comms, HR, and difficult conversations. Send-ready drafts in seconds.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 50,
    icon: Mail,
    color: "from-teal-500 to-emerald-500",
    highlights: [
      "8 cold outreach & prospecting emails",
      "8 sales & negotiation emails",
      "8 internal communication templates",
      "8 client management emails",
      "6 HR & recruiting templates",
      "6 difficult situation emails",
      "6 networking & relationship emails",
    ],
    paymentLink: "https://buy.stripe.com/28E4gA4GZby7duu1B18IU0j",
    downloadUrl: "/downloads/50-business-email-prompts.txt",
  },
  {
    id: "50-accounting-bookkeeper",
    name: "50+ Accounting Prompts for Bookkeepers",
    description:
      "Save hours every week with prompts for bookkeeping tasks, tax season prep, client emails, financial reports, QuickBooks workflows, and business advisory.",
    price: 2.99,
    priceLabel: "$2.99",
    promptCount: 52,
    icon: Calculator,
    color: "from-green-500 to-emerald-600",
    badge: "Premium",
    highlights: [
      "10 bookkeeping & daily task prompts",
      "8 tax season preparation prompts",
      "8 client communication emails",
      "8 financial reports & analysis",
      "6 QuickBooks & software prompts",
      "6 business advisory & strategy",
      "6 practice management prompts",
    ],
    paymentLink: "https://buy.stripe.com/14AcN66P78lV9ee2F58IU0k",
    downloadUrl: "/downloads/50-accounting-bookkeeper-prompts.txt",
  },
  {
    id: "ebook-chatgpt-side-hustles",
    name: "Learning ChatGPT Side Hustles",
    description:
      "20-page PDF ebook covering freelance writing, social media management, copywriting, e-commerce, course creation, and more — all powered by ChatGPT. Includes real prompts, pricing tables, and a step-by-step launch plan.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 16,
    icon: BookOpen,
    color: "from-indigo-500 to-purple-500",
    badge: "Ebook",
    highlights: [
      "16 chapters of actionable content",
      "Real ChatGPT prompts for each hustle",
      "Pricing & income projections",
      "Client acquisition strategies",
      "Scaling from side hustle to business",
    ],
    paymentLink: "https://buy.stripe.com/00w6oI8Xf31Beyy93t8IU0p",
    downloadUrl: "/downloads/chatgpt-side-hustles-ebook.pdf",
  },
  {
    id: "ebook-passive-income-guide",
    name: "Passive Income Guide: 5 Online Side Hustles",
    description:
      "20-page PDF covering digital products, affiliate marketing, content creation, online courses, and print-on-demand. Includes a 30-day launch plan and automation strategies.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 10,
    icon: Lightbulb,
    color: "from-amber-500 to-yellow-500",
    badge: "Ebook",
    highlights: [
      "5 proven passive income models",
      "Platform comparisons & setup guides",
      "30-day beginner launch plan",
      "Automation & scaling strategies",
      "Common mistakes to avoid",
    ],
    paymentLink: "https://buy.stripe.com/14A4gAddv9pZ4XYcfF8IU0o",
    downloadUrl: "/downloads/passive-income-guide-ebook.pdf",
  },
  {
    id: "ebook-master-chatgpt5",
    name: "Master ChatGPT-5.0 Guide",
    description:
      "20-page PDF deep dive into ChatGPT-5.0 — prompt engineering, AI side hustles, automation workflows, digital product creation, and monetization strategies.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 10,
    icon: Cpu,
    color: "from-cyan-500 to-teal-500",
    badge: "Ebook",
    highlights: [
      "ChatGPT-5.0 new features explained",
      "Advanced prompt engineering techniques",
      "10 AI-powered side hustles",
      "Automation with Zapier, Make & n8n",
      "Monetization & scaling playbook",
    ],
    paymentLink: "https://buy.stripe.com/14A14oc9r31B7661B18IU0n",
    downloadUrl: "/downloads/master-chatgpt5-guide-ebook.pdf",
  },
  {
    id: "nano-banana-ai-prompts",
    name: "Nano Banana AI Prompts Guide",
    description:
      "500+ copy-paste prompts for Midjourney, DALL-E, and Stable Diffusion. Covers portraits, landscapes, product photography, fantasy art, architecture, food, fashion, and advanced techniques.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 500,
    icon: Palette,
    color: "from-yellow-400 to-orange-500",
    badge: "500+ Prompts",
    highlights: [
      "500+ image generation prompts",
      "Midjourney, DALL-E & Stable Diffusion",
      "Platform-specific parameters included",
      "10 categories from portraits to abstract",
      "Advanced techniques & style mixing",
    ],
    paymentLink: "https://buy.stripe.com/7sYdRa2yR1Xx4XY5Rh8IU0m",
    downloadUrl: "/downloads/nano-banana-ai-prompts-guide.pdf",
  },
  {
    id: "n8n-automation-templates",
    name: "100+ n8n Automation Templates",
    description:
      "AI agents, OpenAI workflows, and no-code business automation. 100+ templates covering lead gen, content creation, email, social media, e-commerce, customer support, and DevOps.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 100,
    icon: Workflow,
    color: "from-orange-500 to-red-500",
    badge: "No-Code",
    highlights: [
      "100+ ready-to-use n8n templates",
      "AI agent & OpenAI workflows",
      "Lead gen, email & social automation",
      "E-commerce & customer support",
      "Beginner to advanced difficulty levels",
    ],
    paymentLink: "https://buy.stripe.com/14A6oI8Xf45Faii1B18IU0l",
    downloadUrl: "/downloads/n8n-automation-templates-guide.pdf",
  },
  {
    id: "nano-banana-monetize-ai",
    name: "Nano Banana: Monetize AI Images",
    description:
      "20-page PDF guide to making money with AI image editing. Covers Midjourney, DALL-E, Stable Diffusion business ideas — print-on-demand, stock photos, social media agency, custom art, and children's books.",
    price: 0.99,
    priceLabel: "$0.99",
    promptCount: 12,
    icon: ImageIcon,
    color: "from-yellow-400 to-amber-500",
    badge: "Ebook",
    highlights: [
      "5 proven AI image business ideas",
      "Income projections per model",
      "Prompt engineering for images",
      "Editing & upscaling techniques",
      "30-day monetization plan",
    ],
    paymentLink: "https://buy.stripe.com/28E5kE4GZdGf622djJ8IU09",
    downloadUrl: "/downloads/nano-banana-monetize-ai-guide.pdf",
  },
];

/* ─── Subscription Plans ───────────────────────────────────────────────────── */

type BillingCycle = "monthly" | "annual";

type PlanFeature = {
  name: string;
  included: boolean;
};

type PricingPlan = {
  id: "starter" | "professional" | "business" | "enterprise";
  name: string;
  icon: any;
  color: string;
  monthlyPrice: number;
  annualPrice: number;
  seats: number;
  pricePerSeat?: number;
  minSeats?: number;
  popular?: boolean;
  paymentLink: string;
  features: PlanFeature[];
};

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    monthlyPrice: 99,
    annualPrice: 950,
    seats: 1,
    paymentLink: "https://buy.stripe.com/28E5kE4GZdGf622djJ8IU09",
    features: [
      { name: "1 user seat", included: true },
      { name: "AI agent workforce", included: true },
      { name: "Dashboard access", included: true },
      { name: "Email integration", included: true },
      { name: "Basic social posting", included: true },
      { name: "Mobile companion (coming soon)", included: true },
      { name: "Community support", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Crown,
    color: "from-cyan-500 to-blue-500",
    monthlyPrice: 249,
    annualPrice: 2388,
    seats: 5,
    pricePerSeat: 49.8,
    minSeats: 5,
    popular: true,
    paymentLink: "https://buy.stripe.com/aFabJ25L37hR766frR8IU0b",
    features: [
      { name: "5 user seats", included: true },
      { name: "Growing integration library", included: true },
      { name: "Unlimited jobs", included: true },
      { name: "Priority email support", included: true },
      { name: "Mobile companion (coming soon)", included: true },
      { name: "API access", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom integrations (3/year)", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    monthlyPrice: 45,
    annualPrice: 432,
    seats: 10,
    pricePerSeat: 45,
    minSeats: 10,
    paymentLink: "https://buy.stripe.com/28EcN6gpHgSrfCCcfF8IU0a",
    features: [
      { name: "10-49 user seats", included: true },
      { name: "Everything in Professional", included: true },
      { name: "Growing integration library", included: true },
      { name: "Custom integrations (3/year)", included: true },
      { name: "Email support", included: true },
      { name: "Advanced permissions", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    monthlyPrice: 40,
    annualPrice: 384,
    seats: 50,
    pricePerSeat: 40,
    minSeats: 50,
    paymentLink: "https://buy.stripe.com/14A7sM8Xf0Ttbmma7x8IU0c",
    features: [
      { name: "50+ user seats", included: true },
      { name: "Everything in Business", included: true },
      { name: "Custom pricing", included: true },
      { name: "Custom integrations (unlimited)", included: true },
      { name: "Priority support", included: true },
      { name: "Volume discounts available", included: true },
    ],
  },
];

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Store Page ───────────────────────────────────────────────────────────── */

export default function Store() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const subtitle = useMemo(() => {
    return billing === "annual"
      ? "Annual billing (discounted)"
      : "Monthly billing (cancel anytime)";
  }, [billing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            &larr; Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/payment"
              className="text-sm text-slate-300 hover:text-white"
            >
              Payment
            </Link>
            <a
              href="#/app"
              className="text-sm text-slate-300 hover:text-white"
              title="Open the app"
            >
              Open App
            </a>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight">Store</h1>
          <p className="mt-2 text-sm text-slate-400">
            Digital products, prompt packs, and subscription plans. All
            checkout links are live.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        {/* ── Digital Products ──────────────────────────────────────────── */}
        <section>
          {/* Hero banner */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-cyan-500/20">
            <img
              src="/atlas-team.png"
              alt="Atlas UX — AI Agent Workforce"
              className="w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">
              Prompt Packs &amp; Ebooks
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Copy-paste ready prompts, AI image guides, automation templates, and
            PDF ebooks. Instant download — crafted by the Atlas UX AI workforce.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {digitalProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        <section className="mt-14">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Customer Reviews</h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Verified purchase reviews from Trustpilot.
          </p>

          {/* TrustBox widget — Review Collector */}
          <div className="mt-6">
            <TrustpilotWidget />
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="my-14 border-t border-slate-800" />

        {/* ── Subscription Plans ────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Subscription Plans</h2>
              <p className="mt-2 text-sm text-slate-400">
                Same pricing as the in-app Subscription Manager.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/20 px-4 py-3">
              <span
                className={`text-sm ${
                  billing === "monthly" ? "text-white" : "text-slate-400"
                }`}
              >
                Monthly
              </span>
              <Switch
                checked={billing === "annual"}
                onCheckedChange={(v) => setBilling(v ? "annual" : "monthly")}
              />
              <span
                className={`text-sm ${
                  billing === "annual" ? "text-white" : "text-slate-400"
                }`}
              >
                Annual
              </span>
              <Badge className="ml-2 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30">
                Save
              </Badge>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400">{subtitle}</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} billing={billing} />
            ))}
          </div>
        </section>

        {/* ── Already a customer? ──────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">
                Already a customer?
              </div>
              <div className="text-sm text-slate-400">
                Manage seats, billing cycle, and invoices inside the app.
              </div>
            </div>
            <a
              href="#/app/settings"
              className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
            >
              Open Subscription Manager <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-14 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/acceptable-use" className="hover:text-white">
              Acceptable Use
            </Link>
            <Link to="/payment" className="hover:text-white">
              Payment
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Atlas UX &mdash; A product of
            DEAD APP CORP
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ─── Product Card (Digital Products) ──────────────────────────────────────── */

function ProductCard({ product }: { product: DigitalProduct }) {
  const Icon = product.icon;
  const isFree = product.price === 0;

  function handleClick() {
    if (isFree && product.downloadUrl) {
      // Direct download
      const a = document.createElement("a");
      a.href = product.downloadUrl;
      a.download = product.downloadUrl.split("/").pop() ?? "prompts.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (product.paymentLink) {
      window.open(product.paymentLink, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Card className="relative overflow-hidden border border-slate-800 bg-slate-900/20 flex flex-col">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${product.color}`}
      />

      {product.badge && (
        <div className="absolute right-4 top-4">
          <Badge
            className={
              isFree
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
            }
          >
            {product.badge}
          </Badge>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl bg-gradient-to-r ${product.color} p-2.5`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">{product.name}</div>
            <div className="text-xs text-slate-400">
              {product.id.startsWith("ebook-")
                ? `${product.promptCount} chapters`
                : product.id === "n8n-automation-templates"
                  ? `${product.promptCount}+ templates`
                  : `${product.promptCount} prompts`}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                isFree
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {product.priceLabel}
            </span>
            <span className="text-sm text-slate-400">one-time</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {product.description}
        </p>

        {/* Highlights */}
        <div className="mt-5 flex-1 space-y-1.5">
          {product.highlights.map((h) => (
            <div key={h} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="text-slate-300">{h}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Button
            className={`w-full ${
              isFree
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            }`}
            onClick={handleClick}
          >
            {isFree ? (
              <>
                <Download className="mr-2 h-4 w-4" /> Download Free
              </>
            ) : (
              <>
                Buy for {product.priceLabel}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {!isFree && (
            <div className="mt-2 text-center text-xs text-slate-500">
              Instant download after payment
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── Plan Card (Subscriptions) ────────────────────────────────────────────── */

function PlanCard({
  plan,
  billing,
}: {
  plan: PricingPlan;
  billing: BillingCycle;
}) {
  const Icon = plan.icon;

  const headline = formatUSD(
    billing === "annual" ? plan.annualPrice : plan.monthlyPrice,
  );
  const priceLabel =
    plan.id === "starter"
      ? billing === "annual"
        ? "/year"
        : "/month"
      : billing === "annual"
        ? "/seat/year"
        : "/seat/month";

  const minSeats = plan.minSeats ?? plan.seats;

  return (
    <Card className="relative overflow-hidden border border-slate-800 bg-slate-900/20">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${plan.color}`}
      />
      {plan.popular && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-r ${plan.color} p-2`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="text-xs text-slate-400">
              {plan.id === "starter"
                ? "Solo / single seat"
                : `Minimum ${minSeats} seats`}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{headline}</div>
            <div className="text-sm text-slate-400">{priceLabel}</div>
          </div>

          <div className="mt-2 text-sm text-slate-400">
            {plan.id === "starter"
              ? "All core essentials to get running."
              : `Checkout is per-seat. Starts at ${minSeats} seats.`}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {plan.features.map((f) => (
            <div key={f.name} className="flex items-start gap-2 text-sm">
              {f.included ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 text-slate-600" />
              )}
              <span
                className={f.included ? "text-slate-200" : "text-slate-500"}
              >
                {f.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            onClick={() =>
              window.open(plan.paymentLink, "_blank", "noopener,noreferrer")
            }
          >
            Checkout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="mt-3 text-xs text-slate-500">
            By purchasing, you agree to our{" "}
            <Link to="/terms" className="text-slate-300 hover:text-white">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-slate-300 hover:text-white">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Trustpilot Widget ───────────────────────────────────────────────────── */

function TrustpilotWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Trustpilot bootstrap script if not already present
    if (!document.getElementById("trustpilot-bootstrap")) {
      const script = document.createElement("script");
      script.id = "trustpilot-bootstrap";
      script.src =
        "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
      script.async = true;
      script.onload = () => {
        if (ref.current && (window as any).Trustpilot) {
          (window as any).Trustpilot.loadFromElement(ref.current, true);
        }
      };
      document.head.appendChild(script);
    } else if (ref.current && (window as any).Trustpilot) {
      (window as any).Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="69a0ab09ba0e39c0949a765b"
      data-style-height="52px"
      data-style-width="100%"
      data-token="79fff290-9c3f-4fcc-aace-438dc0ad1ba3"
    >
      <a
        href="https://www.trustpilot.com/review/atlasux.cloud"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
