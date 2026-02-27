# Troubleshooting FAQ

## Overview

This document covers common issues users encounter with Atlas UX and provides step-by-step resolution guidance. Issues are organized by category for quick reference.

## Login and Authentication

### I cannot access the app
**Symptom**: The gate code screen appears but my code is not accepted.
**Resolution**:
1. Verify you have the correct gate code (provided during onboarding)
2. The gate code is configured via `VITE_APP_GATE_CODE` environment variable
3. Clear your browser cache and try again
4. If using the Electron desktop app, restart the application

### My session keeps expiring
**Symptom**: I am repeatedly redirected to the login screen.
**Resolution**:
1. JWT tokens have a configured expiration time
2. Check that your browser is not blocking cookies or local storage
3. Verify the backend is running and accessible at the configured `VITE_API_BASE_URL`
4. If using an ad blocker, add an exception for Atlas UX

### Tenant ID required error
**Symptom**: API calls fail with "tenant id required" message.
**Resolution**:
1. Select a business in the Business Manager
2. Ensure the `x-tenant-id` header is being sent with requests
3. The active tenant is stored in `localStorage` under `atlas_active_tenant_id`
4. If the tenant ID is missing, navigate to `/app/business-manager` and select your organization

## Job Failures

### Jobs stuck in "queued" status
**Symptom**: Jobs appear in the Job Runner but never move to "running."
**Resolution**:
1. Verify the engine loop is running (`ENGINE_ENABLED=true`)
2. Check that the engine worker service is active on Render
3. The engine ticks every 5 seconds by default (`ENGINE_TICK_INTERVAL_MS=5000`)
4. Review engine worker logs for startup errors
5. Verify database connectivity from the engine worker

### Jobs failing immediately
**Symptom**: Jobs transition from "queued" to "failed" without executing.
**Resolution**:
1. Check the job error details in the Job Runner UI
2. Common causes: missing environment variables, invalid API credentials, rate limits
3. Review the audit log for the specific failure message
4. Verify the agent assigned to the job has the required tool access
5. Check that the related integration (email, social, etc.) is connected

### Email jobs not processing
**Symptom**: EMAIL_SEND jobs remain queued.
**Resolution**:
1. The email worker is a separate Render service -- verify it is running
2. Check `OUTBOUND_EMAIL_PROVIDER` is set (e.g., "microsoft")
3. Verify Microsoft Graph credentials: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
4. Confirm MS_SENDER_UPN has send permissions in Azure AD
5. Check the email worker service logs on Render

## Agent Issues

### Agent not responding in chat
**Symptom**: Messages sent to an agent in the Chat Interface receive no response.
**Resolution**:
1. Verify the engine is enabled and running
2. Check that the selected agent is active (visible in Agents Hub)
3. Ensure you have a valid tenant selected
4. Review the Agent Watcher for any agent errors
5. Check the daily action cap (`MAX_ACTIONS_PER_DAY`) has not been reached

### Agent Watcher shows no activity
**Symptom**: The Agent Watcher at `/app/watcher` displays an empty feed.
**Resolution**:
1. The watcher polls the audit log every 4 seconds and jobs every 8 seconds
2. If no agents are active, the feed will be empty
3. Trigger a test action (send a chat message, run a job) and check again
4. Verify the backend is returning audit log data (check network tab)
5. Ensure the tenant context is set correctly

### Agent publishes unexpected content
**Symptom**: Social media post contains content that was not reviewed.
**Resolution**:
1. Check the decision memo status for the publishing action
2. Review the approval workflow: was the content auto-approved?
3. Check the confidence threshold setting for the content type
4. Review SGL evaluation logs for the action
5. Adjust auto-approval settings to require manual review for this content type

## Integration Issues

### Microsoft Teams 403 error
**Symptom**: Teams channel messaging fails with a 403 Forbidden response.
**Resolution**:
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Select your Atlas UX app
3. Navigate to API permissions
4. Verify `Group.ReadWrite.All` is listed as an Application permission
5. Click "Grant admin consent for [your organization]"
6. Wait 5-10 minutes for permission propagation
7. Retry the Teams message

### Telegram bot not responding
**Symptom**: Messages sent to the Telegram bot receive no response.
**Resolution**:
1. Verify `BOTFATHERTOKEN` is set correctly in environment variables
2. Check that the webhook is registered (visible in backend startup logs)
3. Ensure the backend URL is HTTPS and publicly accessible
4. Send a message to the bot and check backend logs for incoming webhook events
5. Verify a default chat is linked in the Messaging Hub

### Telegram "chat not linked" error
**Symptom**: Agent Telegram notifications fail with "chat not linked."
**Resolution**:
1. Open the Messaging Hub at `/app/messaging`
2. Go to the Telegram tab
3. Send any message to your bot on Telegram
4. Click "Set default" to save the chat ID
5. The chat_id lookup handles both string and numeric types

### Stripe webhook not processing
**Symptom**: Payments succeed in Stripe but events are not reflected in Atlas UX.
**Resolution**:
1. Verify the webhook URL: `https://your-backend/v1/billing/stripe/webhook`
2. Check that `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe dashboard
3. Review Stripe > Developers > Webhooks > Recent events for delivery attempts
4. Check backend logs for HMAC signature verification failures
5. Ensure the webhook endpoint is accessible (not blocked by firewall)

## Data and Display Issues

### Dashboard showing zero values
**Symptom**: Dashboard KPI cards show 0 for jobs, agents, or spend.
**Resolution**:
1. Verify a business/tenant is selected
2. Check that the backend API endpoints are responding (network tab)
3. Dashboard stats are live data from real API endpoints
4. If newly deployed, ensure at least one job has been created

### Business Manager data not loading
**Symptom**: Tabs in Business Manager show loading spinners or empty states.
**Resolution**:
1. Select a business from the business list first
2. All sub-views load data in parallel when a business is selected
3. Check that the `x-tenant-id` header is being sent
4. Review the browser console for API errors
5. Verify backend connectivity

### Knowledge Base search returns no results
**Symptom**: KB search finds nothing despite documents being ingested.
**Resolution**:
1. Verify documents were ingested successfully (check the KB Hub)
2. Ensure documents have `status: published` (draft documents are not searchable)
3. Check that documents have been chunked (`npm run kb:chunk-docs`)
4. Verify the tenant context matches the documents' tenant_id

### Blog posts not appearing on public site
**Symptom**: Published blog posts are not visible at `/blog`.
**Resolution**:
1. Verify the post status is "published" (not "draft")
2. Check the blog slug is valid and unique
3. Clear browser cache and reload the blog page
4. Verify the KB documents endpoint is returning published blog posts

## Performance Issues

### Slow page loads
**Symptom**: Pages take a long time to render.
**Resolution**:
1. Atlas UX uses code splitting -- first load of a page downloads the chunk
2. Subsequent visits should be faster (chunks are cached)
3. If a chunk fails to load (after deployment), the app auto-reloads once
4. Check your network connection speed
5. For the desktop app, ensure Electron is up to date

### Agent responses are slow
**Symptom**: Chat responses or job completions take more than 30 seconds.
**Resolution**:
1. AI provider response times vary by model and load
2. Long-context tasks route to Gemini (90-second timeout)
3. Check the engine tick interval (default 5 seconds)
4. Review the AI provider status pages for outages
5. Consider routing routine tasks to faster providers (Cerebras, DeepSeek)

## Deployment Issues

### Frontend build fails
**Symptom**: `npm run build` fails with errors.
**Resolution**:
1. Run `npm install` to ensure dependencies are current
2. Check for TypeScript errors in the build output
3. Verify environment variables are set in the `.env` file
4. Clear the `dist` directory and rebuild

### Backend build fails
**Symptom**: `npm run build` in the backend directory fails.
**Resolution**:
1. Run `npm install` in the `backend/` directory
2. Check for TypeScript compilation errors
3. Verify Prisma client is generated (`npx prisma generate`)
4. Ensure the `DATABASE_URL` is set for migrations

### Database migration errors
**Symptom**: `npx prisma migrate dev` fails.
**Resolution**:
1. Verify `DATABASE_URL` and `DIRECT_URL` are correct
2. Check database connectivity (Docker for local, Supabase for production)
3. Review the migration file for syntax errors
4. If stuck, check the `_prisma_migrations` table for failed entries

## Getting Help

If your issue is not covered here:
1. Check the audit log for relevant error entries
2. Review backend service logs on Render
3. Use the Help page at `/app/help` for guided assistance
4. Contact support through the Messaging Hub
