import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.string().optional(),

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

  // Tumblr OAuth 1.0a
  TUMBLR_REQUEST_TOKEN_URL: z.string().optional(),
  TUMBLR_AUTHORIZE_URL: z.string().optional(),
  TUMBLR_ACCESS_TOKEN_URL: z.string().optional(),
  TUMBLR_AUTH_KEY: z.string().optional(),
  TUMBLR_OAUTH_SECRET: z.string().optional(),
  TUMBLR_REDIRECT_URI: z.string().optional(), // full callback URL

  // Stripe (optional here; can be wired later)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional()
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
