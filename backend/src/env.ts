import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.string().optional(),

  // Database
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  // Public app url(s)
  APP_URL: z.string().optional(),          // e.g. https://atlasux.cloud
  APP_PROTOCOL: z.string().optional(),     // e.g. atlasux://oauth/callback
  ALLOWED_ORIGINS: z.string().optional(),  // comma-separated

  // Supabase (token vault + jobs)
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI providers (platform-owned keys)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(), // optional override
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(), // full callback URL

  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),

  // X (Twitter) OAuth 2.0 (User context) - requires PKCE
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),
  X_REDIRECT_URI: z.string().optional(),
  X_BEARER_TOKEN: z.string().optional(),
  X_ACCESS_TOKEN: z.string().optional(),
  X_ACCESS_TOKEN_SECRET: z.string().optional(),

  // Tumblr OAuth 1.0a
  TUMBLR_REQUEST_TOKEN_URL: z.string().optional(),
  TUMBLR_AUTHORIZE_URL: z.string().optional(),
  TUMBLR_ACCESS_TOKEN_URL: z.string().optional(),
  TUMBLR_AUTH_KEY: z.string().optional(),
  TUMBLR_OAUTH_SECRET: z.string().optional(),
  TUMBLR_REDIRECT_URI: z.string().optional(), // full callback URL

  // Microsoft 365 / Graph API (OAuth2 for M365 tool access)
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),   // "common" for multi-tenant
  MICROSOFT_REDIRECT_URI: z.string().optional(), // full callback URL

  // Reddit OAuth2 (for Donna redditor agent)
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_REDIRECT_URI: z.string().optional(),

  // Pinterest OAuth2
  PINTEREST_APP_ID: z.string().optional(),
  PINTEREST_SECRET_KEY: z.string().optional(),
  PINTEREST_REDIRECT_URI: z.string().optional(),

  // LinkedIn OAuth2
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_REDIRECT_URI: z.string().optional(),

  // Stripe (optional here; can be wired later)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email sending
  OUTBOUND_EMAIL_PROVIDER: z.string().optional(),  // "microsoft" | "resend"
  OUTBOUND_EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MS_TENANT_ID: z.string().optional(),
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_SENDER_UPN: z.string().optional(),

  // Telegram
  BOTFATHERTOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  // Discord
  DISCORD_PUBLIC_KEY: z.string().optional(),

  // Engine + safety
  ENGINE_ENABLED: z.string().optional(),
  ENGINE_TICK_INTERVAL_MS: z.string().optional(),
  AUTO_SPEND_LIMIT_USD: z.string().optional(),
  MAX_ACTIONS_PER_DAY: z.string().optional(),
  CONFIDENCE_AUTO_THRESHOLD: z.string().optional(),

  // Scheduler
  SCHEDULER_ENABLED: z.string().optional(),
  SCHEDULER_POLL_MS: z.string().optional(),
  TENANT_ID: z.string().optional(),

  // Workers
  WORKERS_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(processEnv: NodeJS.ProcessEnv): Env {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${msg}`);
  }
  return parsed.data;
}
