# Atlas UX — Infrastructure (AWS Lightsail)

**Current as of March 2026. All agents and workflows must reference this document for infrastructure context.**

---

## Current Stack

| Layer | Service | Details |
|-------|---------|---------|
| **Frontend** | AWS Lightsail | Static files served from `/home/bitnami/dist/` on `3.94.224.34` |
| **Backend** | AWS Lightsail | Node.js via PM2, same instance |
| **Database** | AWS Lightsail PostgreSQL | Managed PostgreSQL 16 |
| **Voice/Phone** | Twilio | Lucy inbound + Mercer outbound |
| **AI** | OpenAI, DeepSeek, OpenRouter | LLM providers |
| **Social Publishing** | Postiz | Cross-platform social media posting |
| **Domain** | atlasux.cloud | Points to Lightsail instance |

## Deployment

**Frontend:**
```bash
# Build locally
npm run build

# Deploy to Lightsail
scp -i ~/.ssh/lightsail-default.pem -r dist/* bitnami@3.94.224.34:/home/bitnami/dist/
```

**Backend:**
```bash
# SSH into server
ssh -i ~/.ssh/lightsail-default.pem bitnami@3.94.224.34

# Backend managed by PM2
pm2 restart atlas-backend
pm2 logs atlas-backend
```

## Previous Stack (DEPRECATED — DO NOT REFERENCE)

The following services were used previously and are NO LONGER active:
- **Vercel** — Previously hosted frontend. Migrated to Lightsail.
- **Render** — Previously hosted backend (atlas-ux.onrender.com). Migrated to Lightsail.
- **Supabase** — Previously hosted PostgreSQL + Auth. Database migrated to AWS Lightsail PostgreSQL. Auth replaced with self-managed JWT.

**Do not recommend Supabase RLS policies, Render restart strategies, Vercel deployment, or any configuration referencing these services.**

## Key Details

- **SSH Key:** `~/.ssh/lightsail-default.pem`
- **Server IP:** `3.94.224.34`
- **SSH User:** `bitnami`
- **Frontend Path:** `/home/bitnami/dist/`
- **Backend Process:** PM2 managed
- **Database:** Lightsail managed PostgreSQL (connection string in backend/.env as DATABASE_URL)
- **No Supabase Pgbouncer** — Direct PostgreSQL connection only
