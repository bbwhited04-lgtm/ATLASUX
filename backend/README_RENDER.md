# AtlasUX Backend (Render)

This folder contains a lightweight Express backend designed to run on Render.

## 1) Create a Render Web Service
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

## 2) Required environment variables (Render -> Environment)
### Supabase (token vault + jobs)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### App URL + CORS
- `APP_URL` (e.g. https://atlasux.cloud)
- `ALLOWED_ORIGINS` (comma separated, e.g. https://atlasux.cloud,http://localhost:5173)

### AI Provider Keys (platform-owned)
- `OPENAI_API_KEY` (required for OpenAI chat)
- `DEEPSEEK_API_KEY` (optional)

### OAuth (optional until you enable buttons)
Google:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (e.g. https://<YOUR_RENDER_DOMAIN>/v1/oauth/google/callback)

Meta:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI` (e.g. https://<YOUR_RENDER_DOMAIN>/v1/oauth/meta/callback)

## 3) Endpoints
- GET `/health`
- POST `/v1/chat`
- POST `/v1/jobs`
- GET `/v1/oauth/google/start` + `/v1/oauth/google/callback`
- GET `/v1/oauth/meta/start` + `/v1/oauth/meta/callback`

## 4) Supabase tables (minimal)
Create these tables in your Supabase database:

### token_vault
- org_id (text)
- user_id (text)
- provider (text)  // google|meta
- access_token (text)
- refresh_token (text, nullable)
- expires_at (timestamptz, nullable)
- scope (text, nullable)
- meta (jsonb, nullable)
- updated_at (timestamptz)

Unique constraint: (org_id, user_id, provider)

### jobs
- id (uuid, default gen_random_uuid())
- org_id (text)
- user_id (text)
- type (text)
- status (text) // queued|running|done|failed
- payload (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)
