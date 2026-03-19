import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.string().optional(),

  // Database (AWS Lightsail PostgreSQL — direct connection)
  DATABASE_URL: z.string().optional(),

  // Public app url(s)
  APP_URL: z.string().optional(),          // e.g. https://atlasux.cloud
  BACKEND_URL: z.string().optional(),      // e.g. https://api.atlasux.cloud
  APP_PROTOCOL: z.string().optional(),     // e.g. atlasux://oauth/callback
  ALLOWED_ORIGINS: z.string().optional(),  // comma-separated

  // Self-managed auth
  JWT_SECRET: z.string().optional(),

  // AWS S3 (file storage)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),

  // AI providers (platform-owned keys)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(), // optional override
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),

  // KB Tiered Search
  KB_TIERED_SEARCH_ENABLED: z.string().optional(),
  KB_TIER_WEIGHT_TENANT: z.string().optional(),
  KB_TIER_WEIGHT_INTERNAL: z.string().optional(),
  KB_TIER_WEIGHT_PUBLIC: z.string().optional(),

  // KB Eval + Self-Healing
  KB_EVAL_CRON: z.string().optional(),
  KB_EVAL_ENABLED: z.string().optional(),
  KB_HEAL_MAX_PER_HOUR: z.string().optional(),
  KB_HEAL_COST_CEILING: z.string().optional(),
  KB_HEALTH_ALERT_THRESHOLD: z.string().optional(),
  KB_EVAL_JUDGE_MODEL: z.string().optional(),
  KB_EVAL_GOLDEN_MIN_COVERAGE: z.string().optional(),

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

  // Zoom OAuth2 + Webhook
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_REDIRECT_URI: z.string().optional(),
  ZOOM_WEBHOOK_SECRET: z.string().optional(),

  // TikTok OAuth2 (for Timmy TikTok agent)
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  TIKTOK_REDIRECT_URI: z.string().optional(),

  // Twilio (voice + SMS)
  TWILIO_ACCOUNT_SID:    z.string().optional(),
  TWILIO_AUTH_TOKEN:     z.string().optional(),
  TWILIO_FROM_NUMBER:    z.string().optional(),
  TWILIO_API_KEY_SID:    z.string().optional(),
  TWILIO_API_KEY_SECRET: z.string().optional(),

  // Voice Engine (Lucy)
  GOOGLE_CLOUD_PROJECT_ID:        z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  LUCY_VOICE_ENABLED:             z.string().optional(),
  LUCY_VOICE_NAME:                z.string().optional(),
  LUCY_VOICE_SPEAKING_RATE:       z.string().optional(),
  LUCY_MAX_CONCURRENT_SESSIONS:   z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SUB_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_ANNUAL: z.string().optional(),
  STRIPE_PRICE_BUSINESS_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_STANDARD_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STANDARD_ANNUAL: z.string().optional(),
  STRIPE_PRICE_TEAM_MONTHLY: z.string().optional(),
  STRIPE_PRICE_TEAM_ANNUAL: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().optional(),
  STRIPE_BETA_PROMO: z.string().optional(),

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
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_DEFAULT_CHANNEL_ID: z.string().optional(),

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

  // Security: token encryption at rest (64 hex chars = 32 bytes AES-256 key)
  TOKEN_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).optional(),

  // Security: virus scanning via VirusTotal
  VIRUS_SCAN_ENABLED: z.string().optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),

  // Anthropic (local vision agent)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Notion OAuth2
  NOTION_CLIENT_ID: z.string().optional(),
  NOTION_CLIENT_SECRET: z.string().optional(),
  NOTION_REDIRECT_URI: z.string().optional(),

  // Airtable OAuth2 (PKCE)
  AIRTABLE_CLIENT_ID: z.string().optional(),
  AIRTABLE_CLIENT_SECRET: z.string().optional(),
  AIRTABLE_REDIRECT_URI: z.string().optional(),

  // Dropbox OAuth2
  DROPBOX_APP_KEY: z.string().optional(),
  DROPBOX_APP_SECRET: z.string().optional(),
  DROPBOX_REDIRECT_URI: z.string().optional(),

  // Meetup OAuth2
  MEETUP_CLIENT_ID: z.string().optional(),
  MEETUP_CLIENT_SECRET: z.string().optional(),
  MEETUP_REDIRECT_URI: z.string().optional(),

  // Slack OAuth2 v2 (redirect built from APP_URL at runtime)
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),    // xoxb-* bot token for inter-agent chat
  SLACK_USER_TOKEN: z.string().optional(),   // xoxp-* user token (fallback)
  SLACK_APP_TOKEN: z.string().optional(),    // xoxe-* app-level token
  SLACK_LEADS_CHANNEL_ID: z.string().optional(), // channel ID for inbound lead alerts
  GOOGLE_PLACES_API_KEY: z.string().optional(),  // Google Places API for prospecting

  // PayPal OAuth2
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_REDIRECT_URI: z.string().optional(),

  // Square OAuth2
  SQUARE_APP_ID: z.string().optional(),
  SQUARE_APP_SECRET: z.string().optional(),
  SQUARE_REDIRECT_URI: z.string().optional(),

  // Groq (LPU — ultra-fast inference)
  GROQ_API_KEY: z.string().optional(),

  // NVIDIA NIM (Kimi 2.5 and other NVIDIA-hosted models)
  NVIDIA_API_KEY: z.string().optional(),

  // Swarms.ai (multi-agent orchestration API)
  SWARMS_API_KEY: z.string().optional(),

  // IBM watsonx.ai (Granite, Llama, Mixtral models)
  WATSONX_API_KEY: z.string().optional(),
  WATSONX_PROJECT_ID: z.string().optional(),
  WATSONX_URL: z.string().optional(),  // default: https://us-south.ml.cloud.ibm.com

  // Composio (23 sub-tool search integrations)
  COMPOSIO_API_KEY: z.string().optional(),

  // Stability AI (image generation)
  STABILITY_API_KEY: z.string().optional(),

  // Postiz (social media publishing — used by Timmy for TikTok)
  POSTIZ_API_KEY: z.string().optional(),

  // Moltbook (social network for AI agents — Atlas heartbeat)
  MOLTBOOK_API_KEY: z.string().optional(),

  // Apify (100+ web scrapers — social media, lead gen, search, reviews)
  APIFY_API_KEY: z.string().optional(),

  // Web search providers (multi-provider fallback: You.com → Brave → Exa → Tavily → SerpAPI)
  SERP_API_KEY:          z.string().optional(),
  YOU_COM_API_KEY:       z.string().optional(),
  BRAVE_SEARCH_API_KEY:  z.string().optional(),
  EXA_API_KEY:           z.string().optional(),
  TAVILY_API_KEY:        z.string().optional(),

  // News APIs — used by WF-035 Hourly Signal Tripwire
  NEWSDATA_API_KEY:   z.string().optional(), // NewsData.io
  NYT_API_KEY:        z.string().optional(), // New York Times Article Search + Top Stories
  MEDIASTACK_API_KEY: z.string().optional(), // MediaStack global news

  // ElevenLabs (text-to-speech / voice cloning / conversational AI)
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_WEBHOOK_SECRET: z.string().optional(),

  // Vidu (AI video generation — $10/mo plan, cheapest API at $0.0375/sec)
  VIDU_API_KEY: z.string().optional(),

  // QuickBooks OAuth2
  QUICKBOOKS_CLIENT_ID:          z.string().optional(), // sandbox
  QUICKBOOKS_CLIENT_SECRET:      z.string().optional(), // sandbox
  QUICKBOOKS_PROD_CLIENT_ID:     z.string().optional(), // production
  QUICKBOOKS_PROD_CLIENT_SECRET: z.string().optional(), // production
  QUICKBOOKS_ENVIRONMENT:        z.string().optional(), // "sandbox" | "production"
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
