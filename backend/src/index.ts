import "dotenv/config";
import express from "express";
import { z } from "zod";
import { loadEnv } from "./env";
import { makeCors } from "./cors";
import { runChat } from "./ai";
import { oauthEnabled, buildGoogleAuthUrl, exchangeGoogleCode, buildMetaAuthUrl, exchangeMetaCode, storeTokenVault } from "./oauth";
import { createJob, JobTypeSchema } from "./jobs";
import { startPair, confirmPair } from "./mobile";
import { makeSupabase } from "./supabase";
import { auditMiddleware, logBusinessEvent } from "./audit";
import { writeLedgerEvent } from "./ledger";

const env = loadEnv(process.env);

const app = express();
app.use(makeCors(env));
app.use(express.json({ limit: "2mb" }));

// Automatic audit trail (safe no-crash if DB tables not created yet)
app.use(auditMiddleware(env));

app.get("/health", (_req, res) => res.json({ ok: true }));

// -------------------- AUDIT LOG --------------------
app.get("/v1/audit/list", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 1000);
    const supabase = makeSupabase(env);
    let q = supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(limit);

    const actor_id = req.query.actor_id ? String(req.query.actor_id) : "";
    const source = req.query.source ? String(req.query.source) : "";
    const action = req.query.action ? String(req.query.action) : "";
    const since = req.query.since ? String(req.query.since) : "";
    const until = req.query.until ? String(req.query.until) : "";

    if (actor_id) q = q.eq("actor_id", actor_id);
    if (source) q = q.eq("source", source);
    if (action) q = q.ilike("action", `%${action}%`);
    if (since) q = q.gte("timestamp", since);
    if (until) q = q.lte("timestamp", until);

    const { data, error } = await q;
    if (error) return res.status(200).json({ ok: false, rows: [], warning: error.message, setup: "/AUDIT_ACCOUNTING_SETUP.md" });
    res.json({ ok: true, rows: data || [] });
  } catch (e: any) {
    res.status(200).json({ ok: false, rows: [], warning: e?.message || "audit_list_failed" });
  }
});

app.get("/v1/audit/export.csv", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 1000), 5000);
    const supabase = makeSupabase(env);
    const { data, error } = await supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(limit);
    if (error) return res.status(200).send(`error,${JSON.stringify(error.message)}`);

    const rows = (data || []).map((r: any) => ({
      timestamp: r.timestamp,
      actor_type: r.actor_type,
      actor_id: r.actor_id,
      org_id: r.org_id,
      device_id: r.device_id,
      source: r.source,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      status: r.status,
      ip_address: r.ip_address,
      request_id: r.request_id
    }));

    const header = Object.keys(rows[0] || { timestamp: "" });
    const lines = [header.join(",")].concat(rows.map((r: any) => header.map(k => JSON.stringify((r as any)[k] ?? "")).join(",")));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit_log.csv\"");
    res.send(lines.join("\n"));
  } catch (e: any) {
    res.status(200).send(`error,${JSON.stringify(e?.message || "export_failed")}`);
  }
});

// -------------------- ACCOUNTING (FOUNDATION) --------------------
app.get("/v1/accounting/summary", async (req, res) => {
  try {
    const supabase = makeSupabase(env);
    // If table doesn't exist yet, Supabase will return an error; handle gracefully.
    const { data, error } = await supabase.from("ledger_events").select("event_type,amount,currency,timestamp").limit(5000);
    if (error) return res.json({ ok: false, totals: { spend: 0, income: 0, refund: 0, payout: 0 }, warning: error.message, setup: "/AUDIT_ACCOUNTING_SETUP.md" });

    const totals: any = { spend: 0, income: 0, refund: 0, payout: 0 };
    for (const r of (data || []) as any[]) {
      const t = String(r.event_type || "");
      const amt = Number(r.amount || 0);
      if (t in totals) totals[t] += amt;
    }
    res.json({ ok: true, totals });
  } catch (e: any) {
    res.json({ ok: false, totals: { spend: 0, income: 0, refund: 0, payout: 0 }, warning: e?.message || "summary_failed" });
  }
});

app.get("/v1/accounting/export.csv", async (_req, res) => {
  try {
    const supabase = makeSupabase(env);
    const { data, error } = await supabase.from("ledger_events").select("*").order("timestamp", { ascending: false }).limit(5000);
    if (error) return res.status(200).send(`error,${JSON.stringify(error.message)}`);

    const rows = (data || []).map((r: any) => ({
      timestamp: r.timestamp,
      event_type: r.event_type,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      provider: r.provider,
      related_job_id: r.related_job_id,
      org_id: r.org_id,
      user_id: r.user_id
    }));

    const header = Object.keys(rows[0] || { timestamp: "" });
    const lines = [header.join(",")].concat(rows.map((r: any) => header.map(k => JSON.stringify((r as any)[k] ?? "")).join(",")));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"ledger_events.csv\"");
    res.send(lines.join("\n"));
  } catch (e: any) {
    res.status(200).send(`error,${JSON.stringify(e?.message || "export_failed")}`);
  }
});

// Optional: record a ledger event (used later by spend/income flows)
const LedgerBody = z.object({
  event_type: z.enum(["spend","income","refund","payout"]),
  amount: z.number(),
  currency: z.string().optional(),
  status: z.string().optional(),
  related_job_id: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  metadata: z.any().optional(),
  org_id: z.string().optional().nullable(),
  user_id: z.string().optional().nullable()
});

app.post("/v1/ledger/event", async (req, res) => {
  try {
    const body = LedgerBody.parse(req.body);
    const out = await writeLedgerEvent(env, body);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "ledger_write_failed" });
  }
});



// -------------------- MOBILE PAIRING (DEV) --------------------
app.post("/v1/mobile/pair/start", (_req, res) => {
  try {
    const appUrl = env.APP_URL || "https://atlasux.cloud";
    const payload = startPair(appUrl);
    await logBusinessEvent(env, req, {
      actor_type: "user",
      action: "mobile.pair.start",
      entity_type: "mobile_pair",
      entity_id: payload.code,
      status: "success",
      metadata: { expires_in_seconds: payload.expires_in_seconds }
    });
    res.json(payload);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "pair_start_failed" });
  }
});

app.post("/v1/mobile/pair/confirm", (req, res) => {
  try {
    const code = String(req.body?.code || "");
    if (!code) return res.status(400).json({ error: "missing_code" });
    const result = confirmPair(code);
    await logBusinessEvent(env, req, {
      actor_type: "user",
      action: result.ok ? "mobile.pair.confirm" : "mobile.pair.confirm_failed",
      entity_type: "mobile_pair",
      entity_id: code,
      status: result.ok ? "success" : "failure",
      metadata: result.ok ? { device: (result as any).device } : { error: (result as any).error }
    });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "pair_confirm_failed" });
  }
});


// Helper: return to the web app (HashRouter) after OAuth completes.
function webReturnTo(connectedProvider: string) {
  const base = env.APP_URL || "https://project435.vercel.app";
  // Deployed web app uses HashRouter: https://.../#/app/...
  // Keep it explicit so redirects work in prod.
  return `${base}/#/app/integrations?connected=${encodeURIComponent(connectedProvider)}`;
}

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
    // High-value business audit event
    await logBusinessEvent(env, req, {
      actor_type: "user",
      action: "job.created",
      entity_type: "job",
      entity_id: String((job as any)?.id || ""),
      status: "success",
      metadata: { type: body.type }
    });
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
    res.redirect(webReturnTo("google"));
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
    res.redirect(webReturnTo("meta"));
  } catch (e: any) {
    res.status(400).send(e?.message || "Meta callback failed");
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

const port = Number(env.PORT || 8787);
app.listen(port, () => {
  console.log(`AtlasUX backend listening on :${port}`);
});
