import "dotenv/config";
import express from "express";
import { z } from "zod";
import { loadEnv } from "./env";
import { makeCors } from "./cors";
import { runChat } from "./ai";
import { oauthEnabled, buildGoogleAuthUrl, exchangeGoogleCode, buildMetaAuthUrl, exchangeMetaCode, storeTokenVault } from "./oauth";
import { createJob, JobTypeSchema } from "./jobs";
import { makeSupabase } from "./supabase";

const env = loadEnv(process.env);

const app = express();
app.use(makeCors(env));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// -------------------- CHAT --------------------
const ChatBody = z.object({
  provider: z.enum(["openai", "deepseek"]).default("openai"),
  model: z.string().optional(),
  systemPrompt: z.string().nullable().optional(),
  messages: z.array(z.object({
    role: z.enum(["system","user","assistant"]),
    content: z.string()
  })).min(1)
});

app.post("/v1/chat", async (req, res) => {
  try {
    const body = ChatBody.parse(req.body);
    const out = await runChat(body, env);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "chat_failed" });
  }
});

// -------------------- JOBS --------------------
const CreateJobBody = z.object({
  org_id: z.string().min(1),
  user_id: z.string().min(1),
  type: JobTypeSchema,
  payload: z.any().optional()
});

app.post("/v1/jobs", async (req, res) => {
  try {
    const body = CreateJobBody.parse(req.body);
    const job = await createJob(env, body);
    res.json({ job });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "job_create_failed" });
  }
});

// -------------------- OAUTH --------------------
// NOTE: For simplicity, org_id/user_id are passed via query in this scaffold.
// In production, you should derive these from your session/JWT.
app.get("/v1/oauth/google/start", (req, res) => {
  if (!oauthEnabled("google", env)) return res.status(400).send("Google OAuth not configured");
  const org_id = String(req.query.org_id || "");
  const user_id = String(req.query.user_id || "");
  if (!org_id || !user_id) return res.status(400).send("Missing org_id/user_id");
  const state = Buffer.from(JSON.stringify({ org_id, user_id })).toString("base64url");
  const scopes = [
    "openid","email","profile",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/analytics.readonly"
  ];
  res.redirect(buildGoogleAuthUrl(env, state, scopes));
});

app.get("/v1/oauth/google/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) return res.status(400).send("Missing code/state");
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const tok = await exchangeGoogleCode(env, code);
    const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
    await storeTokenVault(env, {
      org_id: decoded.org_id,
      user_id: decoded.user_id,
      provider: "google",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? null,
      expires_at,
      scope: tok.scope ?? null,
      meta: { token_type: tok.token_type }
    });
    const protocol = env.APP_PROTOCOL;
    if (protocol && protocol.startsWith("atlasux://")) {
      // Desktop custom-protocol return
      return res.redirect(`${protocol}?provider=google&status=connected`);
    }
    // Hash-router friendly redirect back to the desktop/web app
    const base = env.APP_URL || "";
    res.redirect(`${base}#/app/integrations?connected=google`);
  } catch (e: any) {
    res.status(400).send(e?.message || "Google callback failed");
  }
});

app.get("/v1/oauth/meta/start", (req, res) => {
  if (!oauthEnabled("meta", env)) return res.status(400).send("Meta OAuth not configured");
  const org_id = String(req.query.org_id || "");
  const user_id = String(req.query.user_id || "");
  if (!org_id || !user_id) return res.status(400).send("Missing org_id/user_id");
  const state = Buffer.from(JSON.stringify({ org_id, user_id })).toString("base64url");
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
    "instagram_basic",
    "instagram_manage_insights"
  ];
  res.redirect(buildMetaAuthUrl(env, state, scopes));
});

app.get("/v1/oauth/meta/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) return res.status(400).send("Missing code/state");
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const tok = await exchangeMetaCode(env, code);
    await storeTokenVault(env, {
      org_id: decoded.org_id,
      user_id: decoded.user_id,
      provider: "meta",
      access_token: tok.access_token,
      refresh_token: null,
      expires_at: tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null,
      scope: null,
      meta: { token_type: tok.token_type }
    });
    const protocol = env.APP_PROTOCOL;
    if (protocol && protocol.startsWith("atlasux://")) {
      // Desktop custom-protocol return
      return res.redirect(`${protocol}?provider=meta&status=connected`);
    }
    // Hash-router friendly redirect back to the desktop/web app
    const base = env.APP_URL || "";
    res.redirect(`${base}#/app/integrations?connected=meta`);
  } catch (e: any) {
    res.status(400).send(e?.message || "Meta callback failed");
  }
});

// -------------------- INTEGRATION ASSET DISCOVERY (META) --------------------
// Minimal “Sprout-style” ownership verification: list what the user actually owns.
app.get("/v1/integrations/meta/assets", async (req, res) => {
  try {
    const org_id = String(req.query.org_id || "");
    const user_id = String(req.query.user_id || "");
    const type = String(req.query.type || "page"); // page | ad_account
    if (!org_id || !user_id) return res.status(400).json({ error: "Missing org_id/user_id" });
    if (type !== "page" && type !== "ad_account") return res.status(400).json({ error: "Unsupported type" });

    const supabase = makeSupabase(env);
    const { data, error } = await supabase
      .from("token_vault")
      .select("access_token")
      .eq("org_id", org_id)
      .eq("user_id", user_id)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    const access_token = (data as any)?.access_token;
    if (!access_token) return res.status(400).json({ error: "Meta not connected" });

    const url =
      type === "page"
        ? `https://graph.facebook.com/v19.0/me/accounts?fields=id,name&access_token=${encodeURIComponent(access_token)}`
        : `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&access_token=${encodeURIComponent(access_token)}`;

    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(400).json({ error: j?.error?.message || "meta_assets_failed" });

    const assets = Array.isArray(j?.data) ? j.data : [];
    res.json({ type, assets });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "meta_assets_failed" });
  }
});

app.post("/v1/integrations/meta/assets/save", async (req, res) => {
  try {
    const body = z.object({
      org_id: z.string().min(1),
      user_id: z.string().min(1),
      type: z.enum(["page", "ad_account"]),
      selected: z.array(z.object({ id: z.string().min(1), name: z.string().optional() })).default([]),
    }).parse(req.body);

    const supabase = makeSupabase(env);
    const { data, error } = await supabase
      .from("token_vault")
      .select("meta")
      .eq("org_id", body.org_id)
      .eq("user_id", body.user_id)
      .eq("provider", "meta")
      .maybeSingle();
    if (error) return res.status(400).json({ error: error.message });

    const prevMeta = (data as any)?.meta && typeof (data as any).meta === "object" ? (data as any).meta : {};
    const nextMeta = {
      ...prevMeta,
      selected_assets: {
        ...(prevMeta?.selected_assets || {}),
        [body.type]: body.selected,
      },
    };

    const { error: upErr } = await supabase
      .from("token_vault")
      .update({ meta: nextMeta, updated_at: new Date().toISOString() })
      .eq("org_id", body.org_id)
      .eq("user_id", body.user_id)
      .eq("provider", "meta");

    if (upErr) return res.status(400).json({ error: upErr.message });
    res.json({ ok: true, meta: nextMeta });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "meta_assets_save_failed" });
  }
});

// -------------------- INTEGRATIONS STATUS + DISCONNECT --------------------
app.get("/v1/integrations/status", async (req, res) => {
  try {
    const org_id = String(req.query.org_id || "");
    const user_id = String(req.query.user_id || "");
    if (!org_id || !user_id) return res.status(400).json({ error: "Missing org_id/user_id" });

    const supabase = makeSupabase(env);
    const { data, error } = await supabase
      .from("token_vault")
      .select("provider")
      .eq("org_id", org_id)
      .eq("user_id", user_id);

    if (error) return res.status(400).json({ error: error.message });

    const providers = new Set((data ?? []).map((r: any) => r.provider));
    res.json([
      { provider: "google", connected: providers.has("google") },
      { provider: "meta", connected: providers.has("meta") },
    ]);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "status_failed" });
  }
});

app.post("/v1/integrations/:provider/disconnect", async (req, res) => {
  try {
    const provider = String(req.params.provider || "");
    if (provider !== "google" && provider !== "meta") return res.status(400).json({ error: "Unsupported provider" });

    const org_id = String(req.query.org_id || "");
    const user_id = String(req.query.user_id || "");
    if (!org_id || !user_id) return res.status(400).json({ error: "Missing org_id/user_id" });

    const supabase = makeSupabase(env);
    const { error } = await supabase
      .from("token_vault")
      .delete()
      .eq("org_id", org_id)
      .eq("user_id", user_id)
      .eq("provider", provider);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "disconnect_failed" });
  }
});

// -------------------- META ASSET DISCOVERY (PAGES / AD ACCOUNTS) --------------------
// These endpoints support the "verify ownership then import" step (Sprout/Hootsuite style).

app.get("/v1/integrations/meta/assets", async (req, res) => {
  try {
    const org_id = String(req.query.org_id || "");
    const user_id = String(req.query.user_id || "");
    const type = String(req.query.type || "page"); // page | ads
    if (!org_id || !user_id) return res.status(400).json({ error: "Missing org_id/user_id" });
    if (type !== "page" && type !== "ads") return res.status(400).json({ error: "Unsupported type" });

    const supabase = makeSupabase(env);
    const { data, error } = await supabase
      .from("token_vault")
      .select("access_token")
      .eq("org_id", org_id)
      .eq("user_id", user_id)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    const access_token = (data as any)?.access_token;
    if (!access_token) return res.status(400).json({ error: "Meta not connected" });

    const endpoint =
      type === "page"
        ? "https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category"
        : "https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id";

    const r = await fetch(`${endpoint}&access_token=${encodeURIComponent(access_token)}`);
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(400).json({ error: j?.error?.message || "Meta asset fetch failed" });

    const assets = (j?.data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type,
      meta: type === "page" ? { category: a.category } : { account_id: a.account_id }
    }));
    res.json({ assets });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "meta_assets_failed" });
  }
});

app.post("/v1/integrations/meta/assets/save", async (req, res) => {
  try {
    const body = z.object({
      org_id: z.string().min(1),
      user_id: z.string().min(1),
      type: z.enum(["page", "ads"]),
      selected: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
    }).parse(req.body);

    const supabase = makeSupabase(env);
    // Read existing meta row
    const { data: existing, error: readErr } = await supabase
      .from("token_vault")
      .select("meta")
      .eq("org_id", body.org_id)
      .eq("user_id", body.user_id)
      .eq("provider", "meta")
      .maybeSingle();
    if (readErr) return res.status(400).json({ error: readErr.message });

    const prevMeta = (existing as any)?.meta || {};
    const nextMeta = {
      ...prevMeta,
      imported_assets: {
        ...(prevMeta?.imported_assets || {}),
        [body.type]: body.selected,
      },
    };

    const { error: updErr } = await supabase
      .from("token_vault")
      .update({ meta: nextMeta, updated_at: new Date().toISOString() })
      .eq("org_id", body.org_id)
      .eq("user_id", body.user_id)
      .eq("provider", "meta");

    if (updErr) return res.status(400).json({ error: updErr.message });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "meta_assets_save_failed" });
  }
});

const port = Number(env.PORT || 8787);
app.listen(port, () => {
  console.log(`AtlasUX backend listening on :${port}`);
});
