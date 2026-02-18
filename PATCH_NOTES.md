Atlas UX Patch (frontend + backend)

Targets
- Fix Premium tab not rendering (sidebar links were routing to /premium instead of /app/premium)
- Add Video Conferencing route
- Make "New Task" open a simple prompt-first Create Task dialog (Sprout-style simplicity)
- Make Analytics + Video Conferencing "Connect" buttons route into Integrations (single trusted flow)
- Set safe production defaults for URLs

Production URLs
- Frontend: https://project435.vercel.app
- Backend:  https://atlas-ux.onrender.com

How to apply
1) Unzip this patch at repo root.
2) Copy/merge the included folders into your repo:
   - Copy patch `src/` -> your repo `src/`
   - Copy patch `backend/` -> your repo `backend/`
3) Commit and push.

Frontend env (recommended)
- VITE_BACKEND_URL=https://atlas-ux.onrender.com

Backend env (required)
- APP_URL=https://project435.vercel.app
- ALLOWED_ORIGINS=https://project435.vercel.app,http://localhost:5173
- SUPABASE_URL=...
- SUPABASE_SERVICE_ROLE_KEY=...
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
- META_APP_ID / META_APP_SECRET / META_REDIRECT_URI

Notes
- Backend OAuth callbacks redirect to HashRouter URLs: /#/app/integrations?connected=...
- Video conferencing route is /#/app/video-conferencing
