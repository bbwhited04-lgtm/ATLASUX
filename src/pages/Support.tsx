import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, BookOpen, ChevronRight, ArrowLeft, Mail, MessageSquare,
  Clock, Shield, FileText, ExternalLink, Phone, Calendar, Users,
  Zap, CreditCard, Settings, AlertTriangle, Lock, Share2, Bell,
} from "lucide-react";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";
import { API_BASE } from "../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = { name: string; label: string; count: number };
type ArticleMeta = { slug: string; category: string; title: string; tags: string[]; related: string[] };
type ArticleFull = ArticleMeta & { content: string };
type SearchResult = ArticleMeta & { snippet: string };

// ── Category icons ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  "getting-started": Zap,
  "lucy": Phone,
  "appointments": Calendar,
  "phone-sms": MessageSquare,
  "social-media": Share2,
  "agents": Users,
  "notifications": Bell,
  "billing": CreditCard,
  "account": Settings,
  "integrations": ExternalLink,
  "troubleshooting": AlertTriangle,
  "security-privacy": Lock,
};

// ── API helpers ─────────────────────────────────────────────────────────────

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/v1/support/categories`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchArticles(category?: string): Promise<ArticleMeta[]> {
  const params = category ? `?category=${category}` : "";
  const res = await fetch(`${API_BASE}/v1/support/articles${params}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchArticle(category: string, slug: string): Promise<ArticleFull | null> {
  const res = await fetch(`${API_BASE}/v1/support/articles/${category}/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

async function searchArticles(q: string): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/v1/support/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

// ── Simple markdown renderer ────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links — internal KB links become client navigation
    .replace(/\[(.+?)\]\(([^)]+)\)/g, (_, text, href) => {
      if (href.includes(".md")) {
        // Internal KB link — extract category/slug
        const parts = href.replace(/\.md$/, "").split("/").filter(Boolean);
        const slug = parts[parts.length - 1];
        const cat = parts.length > 1 ? parts[parts.length - 2] : "";
        return `<a href="#" data-kb-link="${cat}/${slug}" class="text-blue-400 hover:text-blue-300 underline">${text}</a>`;
      }
      return `<a href="${href}" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 underline">${text}</a>`;
    })
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-300">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-3 pl-4">$&</ul>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-slate-300">$1</li>')
    // Paragraphs
    .replace(/^(?!<[hulo]|<li)(.+)$/gm, '<p class="text-slate-300 leading-relaxed mb-3">$1</p>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-white/10 my-6" />')
    // Code inline
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-300">$1</code>');
}

// ── Support channels (kept from original) ───────────────────────────────────

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "Reach our support team directly.",
    detail: "support@atlasux.cloud",
    href: "mailto:support@atlasux.cloud",
    linkLabel: "Send Email",
  },
  {
    icon: MessageSquare,
    title: "In-App Chat",
    desc: "Talk to Atlas or Lucy inside the app.",
    detail: "Available in the Atlas UX dashboard under Chat.",
    href: "/#/app/chat",
    linkLabel: "Open Chat",
  },
  {
    icon: Clock,
    title: "Response Times",
    desc: "We aim to respond quickly.",
    detail: "Email: 24hrs • Chat: Immediate (AI) / 4hrs (human) • Critical: 2hrs",
    href: "#",
    linkLabel: "",
  },
];

// ── Component ───────────────────────────────────────────────────────────────

type View = "home" | "category" | "article" | "search";

export default function Support() {
  const [view, setView] = useState<View>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      if (view === "search") setView("home");
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchArticles(searchQuery);
      setSearchResults(results);
      setView("search");
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCategory = useCallback(async (cat: string) => {
    setLoading(true);
    setActiveCategory(cat);
    const arts = await fetchArticles(cat);
    setArticles(arts);
    setView("category");
    setLoading(false);
  }, []);

  const openArticle = useCallback(async (category: string, slug: string) => {
    setLoading(true);
    const art = await fetchArticle(category, slug);
    setArticle(art);
    setActiveCategory(category);
    setView("article");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goHome = useCallback(() => {
    setView("home");
    setSearchQuery("");
    setArticle(null);
    setActiveCategory("");
  }, []);

  // Handle internal KB link clicks
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-kb-link]") as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      const [cat, slug] = (target.dataset.kbLink ?? "").split("/");
      if (cat && slug) openArticle(cat, slug);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openArticle]);

  const categoryLabel = categories.find(c => c.name === activeCategory)?.label ?? activeCategory;

  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Help Center — Atlas UX"
        description="Find answers, guides, and troubleshooting for Atlas UX. Search our knowledge base or contact support."
        path="support"
        schema={[webPageSchema("Help Center — Atlas UX", "Atlas UX help center — guides, tutorials, and troubleshooting.")]}
      />

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Help Center
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Find answers to your questions about Atlas UX. Search our knowledge base or browse by topic.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles... (e.g., &quot;reset password&quot;, &quot;Lucy not answering&quot;)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); goHome(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {view !== "home" && view !== "search" && (
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <button onClick={goHome} className="hover:text-white transition-colors">Help Center</button>
            <ChevronRight className="w-3.5 h-3.5" />
            {view === "article" && activeCategory ? (
              <>
                <button onClick={() => openCategory(activeCategory)} className="hover:text-white transition-colors">
                  {categoryLabel}
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white">{article?.title}</span>
              </>
            ) : (
              <span className="text-white">{categoryLabel}</span>
            )}
          </nav>
        )}

        {/* Back button for category/article views */}
        {(view === "category" || view === "article") && (
          <button
            onClick={view === "article" ? () => openCategory(activeCategory) : goHome}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {view === "article" ? `Back to ${categoryLabel}` : "Back to Help Center"}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        )}

        {/* HOME VIEW — Category Grid */}
        {!loading && view === "home" && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] ?? BookOpen;
                return (
                  <button
                    key={cat.name}
                    onClick={() => openCategory(cat.name)}
                    className="text-left rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-400/30 hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1">{cat.label}</h3>
                        <p className="text-sm text-slate-500">{cat.count} article{cat.count !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Support Channels */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-center">Still need help?</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {SUPPORT_CHANNELS.map((ch) => (
                  <div
                    key={ch.title}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <ch.icon className="w-7 h-7 text-blue-400 mb-3" />
                    <h3 className="font-semibold mb-1">{ch.title}</h3>
                    <p className="text-sm text-slate-400 mb-2">{ch.desc}</p>
                    <p className="text-xs text-slate-500">{ch.detail}</p>
                    {ch.linkLabel && (
                      <a
                        href={ch.href}
                        className="inline-flex items-center gap-1 mt-3 text-sm text-blue-400 hover:text-blue-300"
                      >
                        {ch.linkLabel} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="text-center text-sm text-slate-500 space-y-2">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link to="/privacy" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Terms of Service
                </Link>
              </div>
            </div>
          </>
        )}

        {/* SEARCH VIEW */}
        {!loading && view === "search" && (
          <div>
            <h2 className="text-xl font-bold mb-6">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No articles found matching your search.</p>
                <p className="text-sm text-slate-500">Try different keywords or <button onClick={goHome} className="text-blue-400 hover:text-blue-300">browse categories</button>.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((r) => (
                  <button
                    key={`${r.category}/${r.slug}`}
                    onClick={() => openArticle(r.category, r.slug)}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-blue-400/30 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        {r.category.replace(/-/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{r.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{r.snippet}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CATEGORY VIEW — Article List */}
        {!loading && view === "category" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{categoryLabel}</h2>
            {articles.length === 0 ? (
              <p className="text-slate-400">No articles in this category yet.</p>
            ) : (
              <div className="space-y-2">
                {articles.map((a) => (
                  <button
                    key={a.slug}
                    onClick={() => openArticle(a.category, a.slug)}
                    className="w-full text-left flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 hover:border-blue-400/30 hover:bg-white/[0.05] transition-all group"
                  >
                    <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {a.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARTICLE VIEW */}
        {!loading && view === "article" && article && (
          <div>
            <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                {categoryLabel}
              </span>
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                  {tag}
                </span>
              ))}
            </div>

            {/* Article content */}
            <div
              className="prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />

            {/* Related articles */}
            {article.related.length > 0 && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {article.related.map((ref) => {
                    const slug = ref.replace(/\.md$/, "");
                    const parts = slug.split("/").filter(Boolean);
                    const articleSlug = parts[parts.length - 1];
                    const refCat = parts.length > 1 ? parts[parts.length - 2] : article.category;
                    const label = articleSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <button
                        key={ref}
                        onClick={() => openArticle(refCat, articleSlug)}
                        className="text-left flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-blue-400/30 transition-all group"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300 group-hover:text-white">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Was this helpful? */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-slate-400 mb-3">Was this article helpful?</p>
              <div className="flex items-center justify-center gap-3">
                <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:border-green-400/30 hover:text-green-400 transition-all">
                  Yes, thanks!
                </button>
                <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:border-orange-400/30 hover:text-orange-400 transition-all">
                  Not quite
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-4">
                Need more help? <a href="mailto:support@atlasux.cloud" className="text-blue-400 hover:text-blue-300">Email support</a> or{" "}
                <a href="/#/app/chat" className="text-blue-400 hover:text-blue-300">chat with Lucy</a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
