/**
 * OrgMemory — Organizational Memory dashboard.
 *
 * Browse, search, create, and prune org-level memories.
 * Connects to /v1/org-memory endpoints.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain,
  Search,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Scissors,
  Eye,
  Tag,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

/* ---------- types ---------- */

type OrgMemoryItem = {
  id: string;
  category: string;
  content: string;
  source: string;
  sourceId: string | null;
  confidence: number;
  accessCount: number;
  lastAccessedAt: string | null;
  validUntil: string | null;
  supersededBy: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  total: number;
  byCategory: { category: string; count: number }[];
  topAccessed: {
    id: string;
    category: string;
    preview: string;
    accesses: number;
    source: string;
  }[];
};

/* ---------- constants ---------- */

const CATEGORIES = [
  "preference",
  "insight",
  "pattern",
  "outcome",
  "glossary",
  "relationship",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  preference: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  insight: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pattern: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  outcome: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  glossary: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  relationship: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const PAGE_SIZE = 50;

/* ---------- helpers ---------- */

function headers(tenantId: string): Record<string, string> {
  return { "Content-Type": "application/json", "x-tenant-id": tenantId };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function categoryBadge(cat: string) {
  const cls = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.glossary;
  return (
    <Badge variant="outline" className={`${cls} text-[10px] capitalize`}>
      {cat}
    </Badge>
  );
}

/* ---------- component ---------- */

export function OrgMemory() {
  const { tenantId } = useActiveTenant();

  // stats
  const [stats, setStats] = useState<Stats | null>(null);

  // list
  const [memories, setMemories] = useState<OrgMemoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  // search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrgMemoryItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // filter
  const [filterCategory, setFilterCategory] = useState("all");

  // expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // add form
  const [showAdd, setShowAdd] = useState(false);
  const [addContent, setAddContent] = useState("");
  const [addCategory, setAddCategory] = useState<string>("preference");
  const [addTags, setAddTags] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // prune
  const [pruneLoading, setPruneLoading] = useState(false);
  const [pruneResult, setPruneResult] = useState<number | null>(null);

  /* ---------- data loading ---------- */

  const loadStats = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_BASE}/v1/org-memory/stats`, {
        headers: headers(tenantId),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      /* ignore */
    }
  }, [tenantId]);

  const loadMemories = useCallback(
    async (resetOffset = false) => {
      if (!tenantId) return;
      setListLoading(true);
      const o = resetOffset ? 0 : offset;
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(o),
        });
        if (filterCategory !== "all") params.set("category", filterCategory);

        const res = await fetch(
          `${API_BASE}/v1/org-memory?${params.toString()}`,
          { headers: headers(tenantId) }
        );
        if (res.ok) {
          const data = await res.json();
          const items: OrgMemoryItem[] = data.memories ?? [];
          if (resetOffset) {
            setMemories(items);
            setOffset(0);
          } else if (o === 0) {
            setMemories(items);
          } else {
            setMemories((prev) => [...prev, ...items]);
          }
          setTotal(data.total ?? 0);
        }
      } finally {
        setListLoading(false);
      }
    },
    [tenantId, offset, filterCategory]
  );

  const doSearch = useCallback(
    async (q: string) => {
      if (!tenantId || q.length < 3) {
        setSearchResults(null);
        return;
      }
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (filterCategory !== "all") params.set("category", filterCategory);
        const res = await fetch(
          `${API_BASE}/v1/org-memory/search?${params.toString()}`,
          { headers: headers(tenantId) }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.memories ?? []);
        }
      } finally {
        setSearchLoading(false);
      }
    },
    [tenantId, filterCategory]
  );

  /* debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 3) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, doSearch]);

  /* initial load */
  useEffect(() => {
    loadStats();
    loadMemories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, filterCategory]);

  /* ---------- actions ---------- */

  const handleDelete = async (id: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_BASE}/v1/org-memory/${id}`, {
        method: "DELETE",
        headers: headers(tenantId),
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        if (searchResults) {
          setSearchResults((prev) => prev?.filter((m) => m.id !== id) ?? null);
        }
        setTotal((t) => Math.max(0, t - 1));
        loadStats();
      }
    } catch {
      /* ignore */
    }
  };

  const handleAdd = async () => {
    if (!tenantId || addContent.trim().length < 10) return;
    setAddLoading(true);
    try {
      const body: Record<string, unknown> = {
        content: addContent.trim(),
        category: addCategory,
        source: "manual",
      };
      const tags = addTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) body.tags = tags;

      const res = await fetch(`${API_BASE}/v1/org-memory`, {
        method: "POST",
        headers: headers(tenantId),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAddContent("");
        setAddTags("");
        setAddCategory("preference");
        setShowAdd(false);
        loadMemories(true);
        loadStats();
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handlePrune = async () => {
    if (!tenantId) return;
    setPruneLoading(true);
    setPruneResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/org-memory/prune`, {
        method: "POST",
        headers: headers(tenantId),
      });
      if (res.ok) {
        const data = await res.json();
        setPruneResult(data.pruned ?? 0);
        loadMemories(true);
        loadStats();
      }
    } finally {
      setPruneLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
  };

  // trigger load when offset changes (for "Load More")
  useEffect(() => {
    if (offset > 0) loadMemories(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  /* ---------- derived ---------- */

  const displayItems = searchResults ?? memories;
  const isSearching = searchQuery.length >= 3;
  const hasMore = !isSearching && memories.length < total;

  /* ---------- render ---------- */

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No tenant selected.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-900 min-h-screen text-slate-300">
      {/* ---- header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-semibold text-slate-100">
            Organizational Memory
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrune}
            disabled={pruneLoading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {pruneLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Scissors className="w-3.5 h-3.5 mr-1" />
            )}
            Prune Stale
          </Button>
          {pruneResult !== null && (
            <span className="text-xs text-emerald-400">
              {pruneResult} pruned
            </span>
          )}
        </div>
      </div>

      {/* ---- stats row ---- */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* total */}
          <Card className="bg-slate-800/60 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">
                Total Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-cyan-400">
                {stats.total}
              </span>
            </CardContent>
          </Card>

          {/* by category */}
          <Card className="bg-slate-800/60 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.byCategory.map((bc) => (
                  <div key={bc.category} className="flex items-center gap-1">
                    {categoryBadge(bc.category)}
                    <span className="text-xs text-slate-400">{bc.count}</span>
                  </div>
                ))}
                {stats.byCategory.length === 0 && (
                  <span className="text-xs text-slate-500">None yet</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* top accessed */}
          <Card className="bg-slate-800/60 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">
                Top Accessed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {stats.topAccessed.slice(0, 3).map((ta) => (
                  <li
                    key={ta.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Eye className="w-3 h-3 mt-0.5 text-slate-500 shrink-0" />
                    <span className="text-slate-300 line-clamp-1 flex-1">
                      {ta.preview}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      {ta.accesses}x
                    </span>
                  </li>
                ))}
                {stats.topAccessed.length === 0 && (
                  <li className="text-xs text-slate-500">No data yet</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---- search + filter bar ---- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Semantic search (min 3 chars)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isSearching && searchLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Searching...
        </div>
      )}

      {isSearching && searchResults && !searchLoading && (
        <p className="text-xs text-slate-500">
          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{" "}
          found
        </p>
      )}

      {/* ---- memory cards ---- */}
      <div className="space-y-3">
        {displayItems.length === 0 && !listLoading && (
          <p className="text-center text-slate-500 py-8">
            {isSearching ? "No search results." : "No memories yet."}
          </p>
        )}

        {displayItems.map((mem) => {
          const expanded = expandedId === mem.id;
          const preview =
            mem.content.length > 200 && !expanded
              ? mem.content.slice(0, 200) + "..."
              : mem.content;

          return (
            <Card
              key={mem.id}
              className="bg-slate-800/60 border-slate-700/60 hover:border-cyan-500/30 transition-colors cursor-pointer"
              onClick={() =>
                setExpandedId(expanded ? null : mem.id)
              }
            >
              <CardContent className="pt-4 pb-3 space-y-2">
                {/* top row: category + source + time + delete */}
                <div className="flex items-center gap-2 flex-wrap">
                  {categoryBadge(mem.category)}
                  <Badge
                    variant="outline"
                    className="bg-slate-700/40 text-slate-400 border-slate-600/40 text-[10px]"
                  >
                    {mem.source}
                  </Badge>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {relativeTime(mem.createdAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(mem.id);
                    }}
                    className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* content */}
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {preview}
                </p>
                {mem.content.length > 200 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expanded ? null : mem.id);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> Show more
                      </>
                    )}
                  </button>
                )}

                {/* bottom row: confidence bar + access count + tags */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <div className="flex items-center gap-1.5 min-w-[100px]">
                    <span className="text-[10px] text-slate-500">Conf</span>
                    <Progress
                      value={mem.confidence * 100}
                      className="h-1.5 w-16 bg-slate-700"
                    />
                    <span className="text-[10px] text-slate-500">
                      {Math.round(mem.confidence * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {mem.accessCount}
                  </span>
                  {mem.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-500" />
                      {mem.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-slate-700/30 text-slate-400 border-slate-600/30 text-[9px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {listLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
        )}

        {hasMore && !listLoading && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* ---- add memory section ---- */}
      <div className="border border-slate-700/60 rounded-lg">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/40 transition-colors rounded-lg"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Add Memory
          </span>
          {showAdd ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showAdd && (
          <div className="px-4 pb-4 space-y-3">
            <Textarea
              placeholder="Memory content (min 10 characters)..."
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              rows={3}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger className="w-full sm:w-44 bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Tags (comma-separated)"
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                className="flex-1 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addLoading || addContent.trim().length < 10}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {addLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                Save Memory
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
