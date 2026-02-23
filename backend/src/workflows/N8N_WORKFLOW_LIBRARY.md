# N8N / Workflow Library (Repository Snapshot)

This doc summarizes workflow JSON artifacts found under `backend/src/workflows/n8n/` and how they map into Atlas native workflow tables (`workflows`, `workflow_steps`, `atlas_workflows`).

## Inventory

| workflow_key | name | kind | category | owner agent_key | nodes/steps | triggers | source file |
|---|---|---|---|---|---:|---|---|
| N8N-ATLAS_orchestrator_FULL_email_endpoint | ATLAS Orchestrator - FULL (Email Endpoint) | n8n | root | atlas | 46 | cron, emailReadImap | workflows/n8n/ATLAS_orchestrator_FULL_email_endpoint.json |
| N8N-analytics_competitor_price_scrapper | Competitor Price Scraper | n8n | analytics | atlas | 12 | webhook | workflows/n8n/analytics/competitor_price_scrapper.json |
| N8N-content_creation_youtube2blog | YouTube Transcript to Blog | n8n | content_creation | atlas | 12 | webhook | workflows/n8n/content_creation/youtube2blog.json |
| N8N-customer_service_AtlasUX_Approval_Poller_FIXED | AtlasUX — Approval Poller | n8n | customer_service | atlas | 11 | cron | workflows/n8n/customer_service/AtlasUX_Approval_Poller_FIXED.json |
| N8N-customer_service_AtlasUX_Suggestion_Generator_FIXED | AtlasUX — Suggestion Generator | n8n | customer_service | atlas | 9 | webhook | workflows/n8n/customer_service/AtlasUX_Suggestion_Generator_FIXED.json |
| N8N-devops_github_jenkins | GitHub Commit Jenkins | n8n | devops | atlas | 12 | webhook | workflows/n8n/devops/github_jenkins.json |
| N8N-education_quiz_auto_grader | Quiz Auto Grader | n8n | education | atlas | 12 | webhook | workflows/n8n/education/quiz_auto_grader.json |
| N8N-healthcare_appointment_notification | Appointment WhatsApp Notify | n8n | healthcare | atlas | 12 | webhook | workflows/n8n/healthcare/appointment_notification.json |
| N8N-hr_job_application_parser | New Job Application Parser | n8n | hr | atlas | 12 | webhook | workflows/n8n/hr/job_application_parser.json |
| N8N-media_ad_campain_alert | Ad Campaign Performance Alert | n8n | media | atlas | 11 | webhook | workflows/n8n/media/ad_campain_alert.json |
| N8N-media_tv_rating_trents | TV Rating Trend Report | n8n | media | atlas | 11 | webhook | workflows/n8n/media/tv_rating_trents.json |
| N8N-orchestrator_atlas_orchestrator | ATLAS Orchestrator - FULL (Email Endpoint) | n8n | orchestrator | atlas | 46 | cron, emailReadImap | workflows/n8n/orchestrator/atlas_orchestrator.json |
| N8N-research_SUNDAY_workflow_json | SUNDAY — Docs Intake + Draft Reply + Approval Gate (Audit-First) | n8n | research | atlas | 11 | emailReadImap | workflows/n8n/research/SUNDAY_workflow.json.json |
| N8N-social_media_#U2728#L01f916Automate_Multi-Platform_Social_Media_Content_Creation_with_AI | ✨🤖Automate Multi-Platform Social Media Content Creation with AI | n8n | social_media | atlas | 57 | — | workflows/n8n/social_media/#U2728#L01f916Automate Multi-Platform Social Media Content Creation with AI.json |
| N8N-social_media_Auto-Publish_Web_Articles_as_Social_Posts_for_X__LinkedIn__Reddit___Threads_with_Gemini_AI | Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI | n8n | social_media | atlas | 12 | manualTrigger | workflows/n8n/social_media/Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI.json |
| N8N-social_media_Automated_Instagram_comment_response_with_DMs___Google_Sheets_tracking | Automated Instagram comment response with DMs & Google Sheets tracking | n8n | social_media | atlas | 12 | manualTrigger | workflows/n8n/social_media/Automated Instagram comment response with DMs & Google Sheets tracking.json |
| N8N-social_media_Automated_LinkedIn_content_creation_with_GPT-4_and_DALL-E_for_scheduled_posts | Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts | n8n | social_media | atlas | 13 | — | workflows/n8n/social_media/Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts.json |
| N8N-social_media_Bulk_Auto-Publish_Videos_to_Social_Networks_with_AI_Copy_and_Client_Approval | My workflow 2 | n8n | social_media | atlas | 34 | — | workflows/n8n/social_media/Bulk Auto-Publish Videos to Social Networks with AI Copy and Client Approval.json |
| N8N-social_media_Bulk_auto-publish_videos_to_social_networks_with_AI_copy_and_client_approval | My workflow 3 | n8n | social_media | atlas | 20 | — | workflows/n8n/social_media/Bulk auto-publish videos to social networks with AI copy and client approval.json |
| N8N-social_media_Publish_image___video_to_multiple_social_media__X__Instagram__Facebook_and_more_ | Publish image & video to multiple social media (X, Instagram, Facebook and more) | n8n | social_media | atlas | 14 | — | workflows/n8n/social_media/Publish image & video to multiple social media (X, Instagram, Facebook and more).json |
| N8N-social_media_Tumblr | Tumblr | n8n | social_media | atlas | 4 | webhook | workflows/n8n/social_media/Tumblr.json |
| N8N-social_media_Tumblr_original | Tumblr | n8n | social_media | atlas | 4 | webhook | workflows/n8n/social_media/Tumblr_original.json |
| N8N-social_media_Universal_Social_Media_Content_Generator_with_AI | Universal Social Media Content Generator with AI | n8n | social_media | atlas | 24 | telegramTrigger | workflows/n8n/social_media/Universal Social Media Content Generator with AI.json |
| N8N-social_media__Automate_Multi-Platform_Social_Media_Content_Creation_with_AI | ✨🤖Automate Multi-Platform Social Media Content Creation with AI | n8n | social_media | atlas | 57 | — | workflows/n8n/social_media/✨🤖Automate Multi-Platform Social Media Content Creation with AI.json |
| N8N-social_media_auto_blogpost_linkedin_twitter | Auto-post Blogs to LinkedIn and Twitter | n8n | social_media | atlas | 12 | webhook | workflows/n8n/social_media/auto_blogpost_linkedin_twitter.json |
| N8N-social_media_auto_dm_twitter_new_follower | Auto-DM New Twitter Followers | n8n | social_media | atlas | 12 | webhook | workflows/n8n/social_media/auto_dm_twitter_new_follower.json |
| N8N-social_media_multipass | Publish image & video to multiple social media (X, Instagram, Facebook and more) | n8n | social_media | atlas | 15 | — | workflows/n8n/social_media/multipass.json |
| N8N-social_media_pinterest | Pinterest Publish - Webhook → Pinterest API (template) | n8n | social_media | atlas | 5 | webhook | workflows/n8n/social_media/pinterest.json |
| N8N-social_media_tumblr_publish | Tumblr Publish (Atlas) | n8n | social_media | atlas | 4 | webhook | workflows/n8n/social_media/tumblr_publish.json |
| N8N-legal_benny_atlas_workflow_v1 | Benny — IP Triage & Evidence Pack | atlas_doc | legal | benny | 0 | http | workflows/n8n/legal/benny_atlas_workflow_v1.json |
| N8N-legal_triageevidencepack | ATLAS -> Benny IP Triage & Evidence Pack (starter) | n8n | legal | benny | 13 | webhook | workflows/n8n/legal/triageevidencepack.json |
| N8N-research_Binky-Research | Binky | other | research | binky | 0 | — | workflows/n8n/research/Binky-Research.json |
| N8N-legal_JENNY-CLO-intake | Jenny — CLO Intake + Advisory Reply | atlas_doc | legal | jenny | 0 | email_received | workflows/n8n/legal/JENNY-CLO-intake.json |
| N8N-financial_LARRY-workflow | LARRY — Audit Intake + Compliance Stop + Audit Reply (Audit-First) | atlas_doc | financial | larry | 0 | email_received | workflows/n8n/financial/LARRY-workflow.json |
| N8N-financial_TINA-workflow_json | TINA — Finance Intake + Risk Gate + Advisory Reply (Audit-First) | n8n | financial | tina | 11 | emailReadImap | workflows/n8n/financial/TINA-workflow.json.json |

## Seeding Supabase

Use `supabase_seed_workflows.sql` (generated alongside this doc) to:
- Create missing tables (idempotent)
- Upsert all workflows into `workflows`
- Store the full JSON into `atlas_workflows.workflow_doc`
- Materialize `workflow_steps`:
  - `kind=n8n`: one step per n8n node (topologically sorted)
  - `kind=atlas_doc`: one step per `steps[]`


## Execution note (why “execute workflow” can error right now)

- Backend has explicit handlers for `WF-###` workflows in `backend/src/workflows/registry.ts`.
- The `N8N-*` workflows are currently *catalog items only* (templates) — no runtime handler dispatch exists for them yet.
- After seeding, you still need an executor that can interpret `workflow_steps` (or an adapter that converts an n8n node list into supported step types).


## Minimal implementation plan

1. Add a generic handler for IDs starting with `N8N-` that:
   - loads `workflow_steps` for `workflow_key`
   - executes supported step types (start with: `webhook`, `httpRequest`, `set`, `function`, `if`, `merge`, `emailSend`)
   - logs each step to `AuditLog`
2. For unsupported nodes, return a *pending/manual* status with a readable error in the audit log.
