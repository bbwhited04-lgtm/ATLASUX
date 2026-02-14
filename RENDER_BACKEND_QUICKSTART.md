# Render backend quickstart (AtlasUX)

## 1) Deploy backend to Render
Use the `backend/` folder as a Render Web Service.
- Build: `npm install && npm run build`
- Start: `npm run start`
- Health check: `/health`

See `backend/README_RENDER.md` for the full env var list.

## 2) Point the frontend to Render
Set `VITE_API_BASE_URL` to your Render service URL.
Example:
- `VITE_API_BASE_URL=https://atlasux-backend.onrender.com`

Then rebuild + redeploy the frontend (Vercel or Render static site).

## 3) Minimal Supabase tables
Create tables `token_vault` and `jobs` as described in `backend/README_RENDER.md`.

## 4) OAuth callback URLs
Use your Render backend URL for callback endpoints:
- Google: `https://<render>/v1/oauth/google/callback`
- Meta:   `https://<render>/v1/oauth/meta/callback`
