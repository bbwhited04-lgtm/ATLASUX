# Repository Tree (depth 3)

```text
atlasux/
├── Agents/
│   ├── Atlas/
│   │   ├── Executive-Staff/
│   │   │   ├── CHERYL/
│   │   │   ├── IP_COUNSEL_BENNY/
│   │   │   ├── LEGAL_COUNSEL_JENNY/
│   │   │   ├── SECRETARY_LARRY/
│   │   │   └── TREASURER_TINA/
│   │   ├── AGENTS.md
│   │   ├── ATLAS_COMMUNICATION_POLICY.md
│   │   ├── ATLAS_POLICY.md
│   │   ├── MEMORY.md
│   │   ├── SOUL.md
│   │   ├── SOUL_LOCK.md
│   │   ├── TRUTH_COMPLIANCE_CHECK.md
│   │   ├── UNLOCK_PROTOCOL.md
│   │   └── USER.md
│   └── Sub-Agents/
│       ├── ARCHY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── BINKY/
│       │   ├── AGENTS.md
│       │   ├── BINKY_POLICY.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── REPORT_SCHEMA.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── CORNWALL/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── DAILY-INTEL/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── DONNA/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── DWIGHT/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── EMMA/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── FRAN/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── KELLY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── LINK/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── MERCER/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL-LOCK.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── PENNY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── REYNOLDS/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── SUNDAY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── TERRY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── TIMMY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── VENNY/
│       │   ├── AGENTS.md
│       │   ├── MEMORY.md
│       │   ├── POLICY.md
│       │   ├── SOUL.md
│       │   └── SOUL_LOCK.md
│       ├── AGENTS.md
│       ├── POLICY.md
│       ├── SOUL-LOCK.md
│       └── SOUL.md
├── AUTO_DOCS/
├── backend/
│   ├── backend/
│   │   └── src/
│   │       └── core/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20260213112644_init/
│   │   │   ├── 20260220120000_kb/
│   │   │   ├── 20260220161318_kb_chunks/
│   │   │   ├── 20260220201500_metrics_snapshot/
│   │   │   ├── 20260221_baseline/
│   │   │   ├── 20260222140000_governance_metrics/
│   │   │   └── migration_lock.toml
│   │   ├── prisma.js
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── scripts/
│   │   ├── chunkKbDocuments.ts
│   │   ├── copyAssets.mjs
│   │   └── ingestAgentsToKb.ts
│   ├── sql/
│   │   ├── 001_content_jobs.sql
│   │   └── audit_ledger_schema.sql
│   ├── src/
│   │   ├── agents/
│   │   │   └── registry.ts
│   │   ├── config/
│   │   │   └── agentEmails.ts
│   │   ├── core/
│   │   │   ├── engine/
│   │   │   ├── exec/
│   │   │   ├── kb/
│   │   │   └── sgl.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── domain/
│   │   │   ├── audit/
│   │   │   ├── content/
│   │   │   └── ledger/
│   │   ├── integrations/
│   │   │   ├── openai.client.ts
│   │   │   ├── paidFetch.ts
│   │   │   ├── stripe.client.ts
│   │   │   └── tumblr.client.ts
│   │   ├── jobs/
│   │   │   └── queue.ts
│   │   ├── lib/
│   │   │   ├── ledger.ts
│   │   │   ├── llm.ts
│   │   │   ├── paidFetch.ts
│   │   │   ├── prisma.ts
│   │   │   └── requestContext.ts
│   │   ├── plugins/
│   │   │   ├── auditPlugin.ts
│   │   │   ├── auditRequest.ts
│   │   │   ├── authPlugin.ts
│   │   │   ├── requestContext.ts
│   │   │   └── tenantPlugin.ts
│   │   ├── routes/
│   │   │   ├── accountingRoutes.ts
│   │   │   ├── agentsRoutes.ts
│   │   │   ├── assets.ts
│   │   │   ├── audit.ts
│   │   │   ├── auditRoutes.ts
│   │   │   ├── businessManagerRoutes.ts
│   │   │   ├── chatRoutes.ts
│   │   │   ├── commsRoutes.ts
│   │   │   ├── decisionRoutes.ts
│   │   │   ├── distributionRoutes.ts
│   │   │   ├── engineRoutes.ts
│   │   │   ├── growthRoutes.ts
│   │   │   ├── healthRoutes.ts
│   │   │   ├── integrationsRoutes.ts
│   │   │   ├── jobsRoutes.ts
│   │   │   ├── kbRoutes.ts
│   │   │   ├── ledger.ts
│   │   │   ├── metricsRoutes.ts
│   │   │   ├── oauthRoutes.ts
│   │   │   ├── stripeRoutes.ts
│   │   │   ├── systemStateRoutes.ts
│   │   │   ├── tasksRoutes.ts
│   │   │   ├── tenants.ts
│   │   │   ├── v1Stubs.ts
│   │   │   └── workflowsRoutes.ts
│   │   ├── services/
│   │   │   ├── contentJobs.ts
│   │   │   ├── decisionMemos.ts
│   │   │   ├── growthLoop.ts
│   │   │   ├── guardrails.ts
│   │   │   ├── metricsSnapshot.ts
│   │   │   ├── stripeCatalog.ts
│   │   │   └── systemState.ts
│   │   ├── workflows/
│   │   │   ├── n8n/
│   │   │   ├── README_ATLAS.md
│   │   │   └── registry.ts
│   │   ├── ai.ts
│   │   ├── audit.ts
│   │   ├── cors.ts
│   │   ├── env.ts
│   │   ├── index.ts
│   │   ├── jobs.ts
│   │   ├── ledger.ts
│   │   ├── mobile.ts
│   │   ├── oauth.ts
│   │   ├── prisma.ts
│   │   ├── server.ts
│   │   └── supabase.ts
│   ├── AUDIT_ACCOUNTING_SETUP.md
│   ├── backend@1.0.0
│   ├── docker-compose.yml
│   ├── errorlog
│   ├── package-lock.json
│   ├── package.json
│   ├── prisma.config.ts.BAK
│   ├── tsconfig.json
│   └── tsx
├── electron/
│   ├── main.js
│   └── preload.js
├── policies/
│   ├── EXECUTION_CONSTITUTION.md
│   └── SGL.md
├── public/
│   ├── blog/
│   │   └── covers/
│   │       └── default.png
│   ├── 128x128.png
│   ├── 128x128@2x.png
│   ├── 1d98c9a466c5c875d2a239310c5622d83e56444f.png
│   ├── 32x32.png
│   ├── 35d30f28f8b129622d68cf23f3324a107934c4ee.png
│   ├── atlas_hero.png
│   ├── atlas_hero_rgba.png
│   ├── icon.svg
│   ├── Square107x107Logo.png
│   ├── Square142x142Logo.png
│   ├── Square150x150Logo.png
│   ├── Square284x284Logo.png
│   ├── Square30x30Logo.png
│   ├── Square310x310Logo.png
│   ├── Square44x44Logo.png
│   ├── Square71x71Logo.png
│   ├── Square89x89Logo.png
│   └── StoreLogo.png
├── schemas/
│   ├── AUDIT
│   ├── INTENT_SCHEMA.json
│   └── tool-permissions.json
├── src/
│   ├── assets/
│   │   ├── 1d98c9a466c5c875d2a239310c5622d83e56444f.png
│   │   └── 35d30f28f8b129622d68cf23f3324a107934c4ee.png
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogSidebar.tsx
│   │   │   ├── Markdown.tsx
│   │   │   └── RelatedPosts.tsx
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   ├── mobile/
│   │   │   └── MobileConnectionContext.tsx
│   │   ├── premium/
│   │   │   ├── AIModelTraining.tsx
│   │   │   ├── AIProductivity.tsx
│   │   │   ├── BrowserAutomation.tsx
│   │   │   ├── BrowserExtension.tsx
│   │   │   ├── BusinessIntelligence.tsx
│   │   │   ├── CalendarScheduling.tsx
│   │   │   ├── CodeGeneration.tsx
│   │   │   ├── CommunicationSuite.tsx
│   │   │   ├── CreativeTools.tsx
│   │   │   ├── EmailClient.tsx
│   │   │   ├── FinancialManagement.tsx
│   │   │   ├── MediaProcessing.tsx
│   │   │   ├── MemorySystem.tsx
│   │   │   ├── MobileIntegration.tsx
│   │   │   ├── PersonalAnalytics.tsx
│   │   │   ├── PremiumHub.tsx
│   │   │   ├── SecurityCompliance.tsx
│   │   │   ├── SmartAutomation.tsx
│   │   │   ├── SpreadsheetAnalysis.tsx
│   │   │   ├── TeamCollaboration.tsx
│   │   │   ├── VideoConferencing.tsx
│   │   │   ├── VisualWorkflowBuilder.tsx
│   │   │   └── VoiceCommands.tsx
│   │   ├── public/
│   │   │   └── PublicHeader.tsx
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── use-mobile.ts
│   │   │   └── utils.ts
│   │   ├── AgentDeploymentHub.tsx
│   │   ├── AgentsHub.tsx
│   │   ├── Analytics.tsx
│   │   ├── AnalyticsConnectionModal.tsx
│   │   ├── ApiKeyManager.tsx
│   │   ├── AppGate.tsx
│   │   ├── AppsHub.tsx
│   │   ├── business-manager.tsx
│   │   ├── BusinessManager.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── CRM.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DecisionEnginesHub.tsx
│   │   ├── DecisionsInbox.tsx
│   │   ├── FileManagement.tsx
│   │   ├── FirstRunSetup.tsx
│   │   ├── HelpPage.tsx
│   │   ├── HelpSection.tsx
│   │   ├── Integrations.tsx
│   │   ├── JobRunner.tsx
│   │   ├── KnowledgeBaseHub.tsx
│   │   ├── MeetingModals.tsx
│   │   ├── MobileApp.tsx
│   │   ├── MobileCompanionSetup.tsx
│   │   ├── MobileConnectionModal.tsx
│   │   ├── MobileInstallModal.tsx
│   │   ├── MobilePairingIndicator.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── PremiumFeatures.tsx
│   │   ├── ProcessingSettings.tsx
│   │   ├── RootLayout.tsx
│   │   ├── Settings.tsx
│   │   ├── SocialMonitoring.tsx
│   │   ├── SubscriptionManager.tsx
│   │   ├── TaskAutomation.tsx
│   │   ├── ToolsHub.tsx
│   │   └── WorkflowsHub.tsx
│   ├── config/
│   │   ├── emailMap.ts
│   │   └── neptune-personality.ts
│   ├── content/
│   │   └── blog/
│   │       ├── 2026-02-18-blog-standards.md
│   │       ├── 2026-02-19-earendel-workflow.md
│   │       └── 2026-02-20-governed-autonomy.md
│   ├── core/
│   │   ├── agents/
│   │   │   ├── registry.ts
│   │   │   └── source.ts
│   │   ├── audit/
│   │   │   └── audit.ts
│   │   ├── exec/
│   │   │   └── gates.ts
│   │   └── sgl/
│   │       └── sgl.ts
│   ├── electron/
│   │   ├── main.js
│   │   └── preload.js
│   ├── guidelines/
│   │   └── Guidelines.md
│   ├── lib/
│   │   ├── blog/
│   │   │   ├── loadPosts.ts
│   │   │   └── types.ts
│   │   ├── activeTenant.tsx
│   │   ├── api.ts
│   │   ├── clientContext.ts
│   │   ├── org.ts
│   │   ├── premiumActions.ts
│   │   └── utils.ts
│   ├── mocks/
│   │   └── mockAgents.ts
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── BlogCategory.tsx
│   │   │   ├── BlogHome.tsx
│   │   │   └── BlogPost.tsx
│   │   ├── AcceptableUse.tsx
│   │   ├── Landing.tsx
│   │   ├── Payment.tsx
│   │   ├── Privacy.tsx
│   │   ├── Product.tsx
│   │   ├── Store.tsx
│   │   └── Terms.tsx
│   ├── routes/
│   │   ├── engineRoutes.ts
│   │   └── mobile.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── supabase/
│   │   └── functions/
│   │       └── server/
│   ├── utils/
│   │   ├── supabase/
│   │   │   └── info.tsx
│   │   ├── admin-auth.ts
│   │   ├── connections.ts
│   │   └── stripe-checkout.ts
│   ├── workflows/
│   │   └── build.yml
│   ├── App.tsx
│   ├── Attributions.md
│   ├── build-all.bat
│   ├── build-all.sh
│   ├── electron-builder.json
│   ├── icon.svg
│   ├── index.css
│   ├── index.html
│   ├── install-to-f-drive.bat
│   ├── LICENSE.txt
│   ├── main.tsx
│   ├── package.json
│   ├── routes.ts
│   ├── vite-env.d.ts
│   └── vite.config.js
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   │   ├── 128x128.png
│   │   ├── 128x128@2x.png
│   │   ├── 32x32.png
│   │   ├── icon.icns
│   │   ├── icon.ico
│   │   ├── icon.png
│   │   ├── Square107x107Logo.png
│   │   ├── Square142x142Logo.png
│   │   ├── Square150x150Logo.png
│   │   ├── Square284x284Logo.png
│   │   ├── Square30x30Logo.png
│   │   ├── Square310x310Logo.png
│   │   ├── Square44x44Logo.png
│   │   ├── Square71x71Logo.png
│   │   ├── Square89x89Logo.png
│   │   └── StoreLogo.png
│   ├── src/
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── workflows/
│   ├── WF-001_SUPPORT_INTAKE.md
│   ├── WF-002_SUPPORT_ESCALATION.md
│   ├── WF-010_DAILY_EXEC_BRIEF.md
│   ├── WF-020_ENGINE_RUN_SMOKE_TEST.md
│   └── WORKFLOWS.md
├── ALPHA_DEFINITION.md
├── index.html
├── package-lock.json
├── package.json
├── PATCH_NOTES.md
├── postcss.config.js
├── README.md
├── render.yaml
├── RENDER_BACKEND_QUICKSTART.md
├── tailwind.config.js
└── vite.config.js
```
