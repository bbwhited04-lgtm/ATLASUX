import "dotenv/config";
import express from "express";
import { z } from "zod";
import { loadEnv } from "./env";
import { makeCors } from "./cors";
import { runChat } from "./ai";
import { oauthEnabled, buildGoogleAuthUrl, exchangeGoogleCode, buildMetaAuthUrl, exchangeMetaCode, storeTokenVault } from "./oauth";
import { createJob, JobTypeSchema } from "./jobs";

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
    res.redirect((env.APP_URL || "/") + "/integrations?connected=google");
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
    res.redirect((env.APP_URL || "/") + "/integrations?connected=meta");
  } catch (e: any) {
    res.status(400).send(e?.message || "Meta callback failed");
  }
});

const port = Number(env.PORT || 8787);
app.listen(port, () => {
  console.log(`AtlasUX backend listening on :${port}`);
});
