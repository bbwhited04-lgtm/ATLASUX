import * as React from "react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

type KbDoc = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  updatedAt: string;
};

type KbDocFull = KbDoc & {
  body: string;
  createdAt: string;
};

const WRITE_ROLES = new Set(["CEO", "CRO", "CAS", "CSS"]);

function canWrite(role: string | null | undefined) {
  return WRITE_ROLES.has(String(role ?? "").trim().toUpperCase());
}

function authHeaders(tenantId: string) {
  // NOTE: Backend expects Bearer token via Supabase auth. If you're in early private beta
  // without login wired yet, you can still browse the UI but API calls will 401.
  return {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
  } as Record<string, string>;
}

export function KnowledgeBaseHub() {
  const { tenantId: activeTenantId, setTenantId: setActiveTenantId } = useActiveTenant();
  const [tenantId, setTenantId] = React.useState(activeTenantId ?? "");
  const [role, setRole] = React.useState<string | null>(null);

  const [q, setQ] = React.useState("");
  const [docs, setDocs] = React.useState<KbDoc[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [doc, setDoc] = React.useState<KbDocFull | null>(null);

  const [editTitle, setEditTitle] = React.useState("");
  const [editSlug, setEditSlug] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"draft" | "published" | "archived">("draft");
  const [editTags, setEditTags] = React.useState("");
  const [editBody, setEditBody] = React.useState("");

  const canEdit = canWrite(role);

  const loadContext = React.useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_BASE}/v1/kb/context`, {
        headers: authHeaders(tenantId),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) setRole(data.role ?? null);
    } catch {
      // ignore
    }
  }, [tenantId]);

  const loadDocs = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`${API_BASE}/v1/kb/documents?${params.toString()}`, {
        headers: authHeaders(tenantId),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to load KB");
        return;
      }
      setDocs(Array.isArray(data?.documents) ? data.documents : []);
    } finally {
      setLoading(false);
    }
  }, [tenantId, q]);

  const loadDoc = React.useCallback(async (id: string) => {
    if (!tenantId) return;
    setSelectedId(id);
    setDoc(null);
    try {
      const res = await fetch(`${API_BASE}/v1/kb/documents/${id}`, {
        headers: authHeaders(tenantId),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to load document");
        return;
      }
      const d = data?.document as KbDocFull;
      setDoc(d);

      setEditTitle(d.title);
      setEditSlug(d.slug);
      setEditStatus(d.status);
      setEditTags((d.tags ?? []).join(", "));
      setEditBody(d.body ?? "");
    } catch {
      toast.error("Failed to load document");
    }
  }, [tenantId]);

  const createDoc = React.useCallback(async () => {
    if (!tenantId) return;
    const payload = {
      title: editTitle.trim() || "Untitled",
      slug: editSlug.trim() || undefined,
      status: editStatus,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      body: editBody,
    };

    const res = await fetch(`${API_BASE}/v1/kb/documents`, {
      method: "POST",
      headers: authHeaders(tenantId),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to create document");
      return;
    }
    toast.success("KB document created");
    await loadDocs();
    if (data?.id) await loadDoc(String(data.id));
  }, [tenantId, editTitle, editSlug, editStatus, editTags, editBody, loadDocs, loadDoc]);

  const saveDoc = React.useCallback(async () => {
    if (!tenantId || !selectedId) return;
    const payload = {
      title: editTitle.trim() || undefined,
      slug: editSlug.trim() || undefined,
      status: editStatus,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      body: editBody,
    };

    const res = await fetch(`${API_BASE}/v1/kb/documents/${selectedId}`, {
      method: "PATCH",
      headers: authHeaders(tenantId),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to save");
      return;
    }
    toast.success("Saved");
    await loadDocs();
    await loadDoc(selectedId);
  }, [tenantId, selectedId, editTitle, editSlug, editStatus, editTags, editBody, loadDocs, loadDoc]);

  React.useEffect(() => {
    // keep active tenant synced
    if (tenantId && tenantId !== activeTenantId) setActiveTenantId(tenantId);
  }, [tenantId, activeTenantId, setActiveTenantId]);

  React.useEffect(() => {
    loadContext();
  }, [loadContext]);

  React.useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Team KB with audit-friendly CRUD. Write access: CEO / CRO / CAS / CSS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            className="w-56"
            placeholder="Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
          <Badge variant="secondary">{role ? String(role).toUpperCase() : "ROLE: ?"}</Badge>
        </div>
      </div>

      <Card className="border-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Browse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Search title / slug / body..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button onClick={loadDocs} disabled={loading}>
              {loading ? "Loading…" : "Search"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              {docs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No documents yet.</div>
              ) : (
                docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => loadDoc(d.id)}
                    className={`w-full text-left rounded-lg border p-3 hover:bg-muted/40 ${
                      selectedId === d.id ? "border-cyan-500/50" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-800">{d.title}</div>
                      <Badge variant={d.status === "published" ? "default" : "secondary"}>
                        {d.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">/{d.slug}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(d.tags ?? []).slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div>
              <Tabs defaultValue="view">
                <TabsList>
                  <TabsTrigger value="view">View</TabsTrigger>
                  <TabsTrigger value="edit" disabled={!canEdit}>
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="new" disabled={!canEdit}>
                    New
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="mt-3">
                  {!doc ? (
                    <div className="text-sm text-muted-foreground">Select a document.</div>
                  ) : (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <div className="text-xs text-muted-foreground">/{doc.slug}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(doc.tags ?? []).map((t) => (
                            <Badge key={t} variant="outline">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm">{doc.body}</pre>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="edit" className="mt-3">
                  {!doc ? (
                    <div className="text-sm text-muted-foreground">Select a document first.</div>
                  ) : (
                    <Editor
                      title={editTitle}
                      setTitle={setEditTitle}
                      slug={editSlug}
                      setSlug={setEditSlug}
                      status={editStatus}
                      setStatus={setEditStatus}
                      tags={editTags}
                      setTags={setEditTags}
                      body={editBody}
                      setBody={setEditBody}
                      onSave={saveDoc}
                      canWrite={canEdit}
                    />
                  )}
                </TabsContent>

                <TabsContent value="new" className="mt-3">
                  <Editor
                    title={editTitle}
                    setTitle={setEditTitle}
                    slug={editSlug}
                    setSlug={setEditSlug}
                    status={editStatus}
                    setStatus={setEditStatus}
                    tags={editTags}
                    setTags={setEditTags}
                    body={editBody}
                    setBody={setEditBody}
                    onSave={createDoc}
                    canWrite={canEdit}
                    isNew
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Editor(props: {
  title: string;
  setTitle: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  status: "draft" | "published" | "archived";
  setStatus: (v: "draft" | "published" | "archived") => void;
  tags: string;
  setTags: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  onSave: () => void;
  canWrite: boolean;
  isNew?: boolean;
}) {
  const { title, setTitle, slug, setSlug, status, setStatus, tags, setTags, body, setBody, onSave, canWrite, isNew } = props;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{isNew ? "New KB Document" : "Edit KB Document"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Slug</div>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Status</div>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Tags (comma separated)</div>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="governance, onboarding, playbook" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Body (plain text / markdown)</div>
          <Textarea className="min-h-[240px]" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button onClick={onSave} disabled={!canWrite}>
            Save
          </Button>
        </div>

        {!canWrite ? (
          <div className="text-xs text-muted-foreground">
            You are currently in read-only mode (role is not in CEO/CRO/CAS/CSS).
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
