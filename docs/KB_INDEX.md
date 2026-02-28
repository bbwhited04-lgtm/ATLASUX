# Atlas UX — Knowledge Base Index by Agent

> Auto-generated Feb 28, 2026. 418+ documents across 31 agents.

---

## How KB Assignment Works

1. **Governance Pack** (always loaded for ALL agents): `atlas-policy-*`, `soul-lock-*`, `audit-*`, `agent-comms-*`
2. **Agent Pack** (loaded per-agent): `agent/{agentId}/*` slug pattern
3. **Relevant Pack** (dynamic per query): title/body text match, max 5 docs
4. **Budget**: 60,000 chars total, 12,000 per doc

---

## GOVERNANCE DOCUMENTS (All 31 Agents)

| Slug | Title | Category |
|------|-------|----------|
| atlas-policy-mission | Company Mission & Vision | governance |
| atlas-policy-governance | Governance & Operating Rules | governance |
| atlas-policy-conduct | Agent Code of Conduct | governance |
| soul-lock-core | SOUL LOCK — Core Identity | governance |
| soul-lock-truth-compliance | SOUL LOCK — Truth Compliance Framework | governance |
| soul-lock-unlock-protocol | SOUL LOCK — Unlock Protocol | governance |
| audit-rules | Audit & Ledger Requirements | governance |
| agent-comms-protocol | Agent Communications Protocol | governance |
| agent-comms-social-channels | Agent Social Media Channel Assignments | governance |

---

## EXECUTIVE TIER

### Atlas (President & CEO)
- **Email:** atlas.ceo@deadapp.info | **Tier:** Executive | **Reports to:** Chairman
- **Workflows:** WF-020, 021, 022, 091, 106, 107, 119
- **KB Docs:**
  - `agent/atlas/definition` — Agent definition & playbook
  - `atlas-ceo-playbook` — CEO operational playbook
  - All governance docs (owns them)

### Binky (Chief Research Officer)
- **Email:** binky.cro@deadapp.info | **Tier:** Executive | **Reports to:** Atlas
- **Workflows:** WF-010, 031, 060, 062
- **KB Docs:**
  - `agent/binky/definition` — Agent definition
  - `binky-cro-playbook` — CRO operational playbook
  - `platform-intel-sweep` — Daily intel sweep (WF-093–105)
  - `daily-morning-brief-workflow` — WF-010 brief
  - `multi-model-routing` — AI model selection
  - `multi-tenancy-explained` — Platform architecture

### Cheryl (Customer Support Specialist)
- **Email:** support@deadapp.info | **Tier:** Executive | **Reports to:** Binky
- **Workflows:** WF-001, 002, 092
- **KB Docs:**
  - `agent/cheryl/definition` — Agent definition
  - `cheryl-support-playbook` — Support operational playbook
  - `customer-support-automation` — Support workflows
  - `customer-onboarding-automation` — Onboarding flows
  - `troubleshooting-faq` — FAQ reference
  - `pricing-tiers` / `subscription-plans` — Billing info
  - `integration-setup-guide` / `integrations-overview` — Setup help

---

## GOVERNOR TIER

### Tina (Chief Financial Officer)
- **Email:** tina.cfo@deadapp.info | **Tier:** Governor | **Reports to:** Atlas
- **Workflows:** WF-073
- **KB Docs:**
  - `agent/tina/definition` — Agent definition
  - `budget-management` — Budget controls
  - `budget-review-workflow` — Review process
  - `financial-compliance-ai` — Compliance rules
  - `saas-metrics` — Financial analysis

### Larry (Corporate Secretary & Auditor)
- **Email:** larry.auditor@deadapp.info | **Tier:** Governor | **Reports to:** Atlas
- **Workflows:** WF-072
- **KB Docs:**
  - `agent/larry/definition` — Agent definition
  - `audit-rules` — Detailed audit requirements
  - Compliance monitoring docs

---

## SPECIALIST TIER

### Jenny (General Counsel)
- **Email:** jenny.clo@deadapp.info | **Tier:** Specialist | **Reports to:** Atlas
- **Workflows:** WF-071
- **KB Docs:**
  - `agent/jenny/definition` — Agent definition
  - `law-corporate-entities` — Corporate law
  - `law-data-privacy` — GDPR/CCPA
  - `law-intellectual-property` — IP law
  - `law-contract-fundamentals` — Contracts
  - `law-ai-regulation` — AI compliance

### Benny (IP Counsel)
- **Email:** benny.cto@deadapp.info | **Tier:** Specialist | **Reports to:** Atlas
- **Workflows:** WF-070
- **KB Docs:**
  - `agent/benny/definition` — Agent definition
  - `legal-ip-basics` — IP fundamentals
  - All `law-intellectual-property` docs

---

## RESEARCH & INTELLIGENCE SUBAGENTS

### Daily-Intel (Intel Aggregator)
- **Tier:** Subagent | **Reports to:** Binky
- **Workflows:** WF-033
- **KB Docs:**
  - Intelligence aggregation docs
  - Platform intel reports (consumed from WF-093–105)

### Archy (Research Subagent)
- **Email:** archy.binkypro@deadapp.info | **Tier:** Subagent | **Reports to:** Binky
- **Workflows:** WF-034, 104
- **KB Docs:**
  - `agent/archy/definition` — Agent definition
  - `platform-intel-sweep` — Intel workflow
  - `social-source-verification-protocol` — Research accuracy
  - `multi-model-routing` — Tool selection

### Mercer (Customer Acquisition Strategist)
- **Email:** mercer.teambinky@deadapp.info | **Tier:** Subagent | **Reports to:** Atlas
- **Workflows:** WF-063
- **KB Docs:**
  - `agent/mercer/definition` — Agent definition
  - `mercer-acquisition-playbook` — Acquisition playbook
  - `b2b-lead-generation` — Lead gen strategies
  - `crm-best-practices` — CRM workflows
  - `saas-metrics` — CAC, LTV, churn
  - `small-business-pain-points` — Buyer personas
  - `freelancer-solopreneur-workflows` — Market research

---

## CONTENT & COMMUNICATIONS SUBAGENTS

### Sunday (Technical Document Writer)
- **Email:** sunday.teambinky@deadapp.info | **Tier:** Subagent | **Reports to:** Binky
- **Workflows:** WF-058
- **KB Docs:**
  - `agent/sunday/definition` — Agent definition
  - `sunday-writer-playbook` — Writer playbook
  - `api-overview` / `api-quickstart` — API docs
  - `workflow-system` / `workflow-templates` — Workflow docs
  - `integration-setup-guide` — Setup guides
  - `engine-overview` — Engine architecture
  - `multi-tenancy-explained` — Platform architecture
  - `sgl-governance` — Governance language

### Venny (Image Production Specialist)
- **Email:** venny.videographer@deadapp.info | **Tier:** Subagent | **Reports to:** Sunday
- **Workflows:** WF-059, 105, 110, 111
- **KB Docs:**
  - `agent/venny/definition` — Agent definition
  - `adv-image-creation` — DALL-E/Midjourney/SD pipelines
  - `adv-video-creation` — Video creation guides
  - `social-guidelines-content-quality` — Visual standards

### Victor (Video Production Specialist)
- **Email:** victor.videoproductionspecialist@deadapp.info | **Tier:** Subagent | **Reports to:** Venny
- **Workflows:** WF-089
- **KB Docs:**
  - `agent/victor/definition` — Agent definition
  - `adv-video-creation` — Video pipelines
  - `content-creation-workflow` — Content flow
  - `content-pipeline-lifecycle` — Pipeline management

### Reynolds (Blog & Publisher)
- **Email:** reynolds.blogger@deadapp.info | **Tier:** Subagent | **Reports to:** Sunday
- **Workflows:** WF-041, 102, 108
- **KB Docs:**
  - `agent/reynolds/definition` — Agent definition
  - `blog-seo-content-strategy` — SEO guide
  - `content-marketing-roi` — ROI measurement
  - `content-creation-workflow` — Content flow
  - `content-pipeline-lifecycle` — Pipeline management

---

## SOCIAL MEDIA PUBLISHER SUBAGENTS

### Kelly (X / Twitter)
- **Email:** kelly.x@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-042, 093
- **KB Docs:**
  - `agent/kelly/definition`
  - `x-twitter-best-practices`
  - `social-guidelines-x-twitter`
  - `social-trust-transparency-framework`
  - `social-source-verification-protocol`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Kelly voice)
  - `social-guidelines-content-quality`

### Fran (Facebook)
- **Email:** fran.facebook@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-057, 094
- **KB Docs:**
  - `agent/fran/definition`
  - `facebook-business-strategy`
  - `social-guidelines-facebook`
  - `social-trust-transparency-framework`
  - `social-source-verification-protocol`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Fran voice)
  - `social-guidelines-content-quality`

### Link (LinkedIn)
- **Email:** link.linkedin@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-045, 099
- **KB Docs:**
  - `agent/link/definition`
  - `linkedin-thought-leadership`
  - `social-guidelines-linkedin`
  - `social-trust-transparency-framework`
  - `social-source-verification-protocol`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Link voice)
  - `social-guidelines-content-quality`

### Donna (Reddit)
- **Email:** donna.redditor@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-051, 052, 053, 101
- **KB Docs:**
  - `agent/donna/definition`
  - `reddit-community-marketing`
  - `social-guidelines-reddit`
  - `social-trust-transparency-framework`
  - `social-source-verification-protocol`
  - `social-agent-content-voice-per-platform` (Donna voice)
  - `social-guidelines-content-quality`

### Cornwall (Pinterest)
- **Email:** cornwall.pinterest@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-048, 098
- **KB Docs:**
  - `agent/cornwall/definition`
  - `pinterest-traffic-strategy`
  - `social-guidelines-pinterest`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Cornwall voice)
  - `social-guidelines-content-quality`

### Timmy (TikTok)
- **Email:** timmy.tiktok@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-054, 096
- **KB Docs:**
  - `agent/timmy/definition`
  - `tiktok-for-business`
  - `social-guidelines-tiktok`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Timmy voice)
  - `social-guidelines-content-quality`

### Dwight (Threads)
- **Email:** dwight.threads@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-055, 095
- **KB Docs:**
  - `agent/dwight/definition`
  - `social-posting-rhythm-calendar`
  - `social-trust-transparency-framework`
  - `social-guidelines-content-quality`

### Terry (Tumblr)
- **Email:** terry.tumblr@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-049, 097
- **KB Docs:**
  - `agent/terry/definition`
  - `blog-seo-content-strategy`
  - `social-posting-rhythm-calendar`
  - `social-agent-content-voice-per-platform` (Terry voice)
  - `social-guidelines-content-quality`

### Penny (Ads & Multi-Platform)
- **Email:** penny.facebook@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-040, 047, 103
- **KB Docs:**
  - `agent/penny/definition`
  - `facebook-business-strategy`
  - `content-marketing-roi`
  - `ecommerce-automation-playbook`
  - `social-guidelines-facebook`
  - `social-guidelines-content-quality`

### Emma (Alignable)
- **Email:** emma.alignable@deadapp.info | **Reports to:** Sunday
- **Workflows:** WF-056, 100
- **KB Docs:**
  - `agent/emma/definition`
  - `emerging-platforms-strategy`
  - `b2b-lead-generation`
  - `crm-best-practices`

---

## OPERATIONS & COORDINATION SUBAGENTS

### Petra (Project Manager)
- **Email:** petra.coordinator@deadapp.info | **Reports to:** Atlas
- **Workflows:** WF-084
- **KB Docs:**
  - `agent/petra/definition`
  - `workflow-system` / `workflow-templates`
  - `engine-overview`
  - `decision-memos`

### Porter (SharePoint Portal Manager)
- **Email:** porter~portalmanager@deadapp.info | **Reports to:** Larry
- **Workflows:** WF-087
- **KB Docs:**
  - `agent/porter/definition`
  - `multi-tenancy-explained`
  - `sgl-governance`
  - `data-security-overview`

### Claire (Calendar Coordinator)
- **Email:** claire@deadapp.info | **Reports to:** Emma
- **Workflows:** WF-088
- **KB Docs:**
  - `agent/claire/definition`
  - `workflow-system`
  - `decision-memos`

### Sandy (Bookings & Appointments)
- **Email:** sandy.bookings@deadapp.info | **Reports to:** Emma
- **Workflows:** WF-085
- **KB Docs:**
  - `agent/sandy/definition`
  - `crm-best-practices`
  - `customer-onboarding-automation`

### Frank (Forms & Data Collection)
- **Email:** frank@deadapp.info | **Reports to:** Binky
- **Workflows:** WF-086
- **KB Docs:**
  - `agent/frank/definition`
  - `workflow-system`
  - `data-security-overview`

### Lucy (Professional Secretary & Receptionist)
- **Email:** lucy@deadapp.info | **Reports to:** Atlas
- **Workflows:** WF-112, 113, 114, 115, 116, 117, 118
- **KB Docs:**
  - `customer-support-automation`
  - `crm-best-practices`
  - `troubleshooting-faq`

---

## SHARED KB DOCUMENT CATEGORIES

### Social Media Guidelines (all social agents)
| Slug | Title |
|------|-------|
| social-trust-transparency-framework | Trust & Transparency Framework |
| social-source-verification-protocol | Source Verification Protocol |
| social-posting-rhythm-calendar | Posting Rhythm Calendar |
| social-agent-content-voice-per-platform | Per-Agent Voice Profiles |
| social-guidelines-content-quality | Content Quality Standards |
| social-guidelines-x-twitter | X/Twitter Publishing Guide |
| social-guidelines-facebook | Facebook Publishing Guide |
| social-guidelines-linkedin | LinkedIn Publishing Guide |
| social-guidelines-tiktok | TikTok Publishing Guide |
| social-guidelines-instagram | Instagram Publishing Guide |
| social-guidelines-reddit | Reddit Publishing Guide |
| social-guidelines-pinterest | Pinterest Publishing Guide |

### Platform & Architecture (technical agents)
| Slug | Title |
|------|-------|
| what-is-atlasux | What Is Atlas UX |
| engine-overview | Engine Architecture |
| multi-tenancy-explained | Multi-Tenancy |
| sgl-governance | System Governance Language |
| safety-guardrails | Safety Guardrails |
| data-security-overview | Data Security |
| decision-memos | Decision Memo System |

### Workflow & Operations (ops agents)
| Slug | Title |
|------|-------|
| workflow-system | Workflow System |
| workflow-templates | Workflow Templates |
| daily-morning-brief-workflow | Daily Brief (WF-010) |
| platform-intel-sweep | Intel Sweep (WF-093–105) |
| content-pipeline-lifecycle | Content Pipeline |
| content-creation-workflow | Content Creation |
| customer-onboarding-automation | Customer Onboarding |
| incident-response-workflow | Incident Response |

### Business & SaaS (strategy agents)
| Slug | Title |
|------|-------|
| saas-metrics | SaaS Metrics (CAC, LTV, Churn) |
| small-business-pain-points | Small Business Pain Points |
| ai-employee-market-landscape | AI Employee Market |
| ecommerce-automation-playbook | E-Commerce Automation |
| freelancer-solopreneur-workflows | Freelancer Workflows |
| b2b-lead-generation | B2B Lead Generation |
| content-marketing-roi | Content Marketing ROI |
| budget-management | Budget Management |

### Legal (law-* prefix — Jenny, Benny)
| Slug | Title |
|------|-------|
| law-ai-regulation | AI Regulation (EU AI Act) |
| law-antitrust | Antitrust Law |
| law-contract-fundamentals | Contract Fundamentals |
| law-corporate-entities | Corporate Entities |
| law-data-privacy | Data Privacy (GDPR/CCPA) |
| law-dispute-resolution | Dispute Resolution |
| law-employment | Employment Law |
| law-intellectual-property | Intellectual Property |
| law-international-trade | International Trade (OFAC/FCPA) |
| law-internet-digital | Internet & Digital Law |
| law-regulatory-compliance | Regulatory Compliance |
| law-securities-regulation | Securities Regulation |
| law-tax-fundamentals | Tax Fundamentals |

### MBA Education (mba-* prefix — Binky, Tina, Mercer)
| Slug | Title |
|------|-------|
| mba-business-analytics | Business Analytics |
| mba-business-ethics | Business Ethics |
| mba-corporate-finance | Corporate Finance |
| mba-corporate-strategy | Corporate Strategy |
| mba-economics | Economics |
| mba-entrepreneurship | Entrepreneurship |
| mba-financial-accounting | Financial Accounting |
| mba-innovation-technology | Innovation & Technology |
| mba-international-business | International Business |
| mba-marketing-management | Marketing Management |
| mba-mergers-acquisitions | Mergers & Acquisitions |
| mba-negotiation | Negotiation |
| mba-operations-management | Operations Management |
| mba-organizational-behavior | Organizational Behavior |
| mba-supply-chain | Supply Chain Management |

### Education (edu-* prefix — All agents via deep mode)
| Slug | Title |
|------|-------|
| edu-adult-learning | Adult Learning Theory |
| edu-assessment-evaluation | Assessment & Evaluation |
| edu-communication-pedagogy | Communication Pedagogy |
| edu-curriculum-development | Curriculum Development |
| edu-educational-psychology | Educational Psychology |
| edu-educational-technology | Educational Technology |
| edu-instructional-design | Instructional Design |
| edu-knowledge-management | Knowledge Management |
| edu-learning-theory | Learning Theory |
| edu-organizational-learning | Organizational Learning |
| edu-research-methods | Research Methods |
| edu-training-development | Training & Development |

### Advanced AI/Technical (adv-* prefix — 47 docs)
| Slug | Title |
|------|-------|
| adv-agent-communication-protocols | Agent Communication Protocols |
| adv-agent-deployment | Agent Deployment |
| adv-agent-evaluation | Agent Evaluation & Benchmarking |
| adv-agentic-coding-dev | Agentic Coding & Dev Workflows |
| adv-agentic-context-memory | Context & Memory Management |
| adv-agentic-design-patterns | Agentic Design Patterns |
| adv-agentic-feedback-eval | Feedback & Eval Pipelines |
| adv-agentic-learning-optimization | Learning & Optimization |
| adv-agentic-orchestration-patterns | Orchestration Patterns |
| adv-agentic-reliability-safety | Reliability & Safety |
| adv-agentic-tool-integration | Tool Integration Patterns |
| adv-agentic-ux-collaboration | UX & Human-AI Collaboration |
| adv-agent-lifecycle | Agent Lifecycle |
| adv-agent-planning-reasoning | Planning & Reasoning |
| adv-agent-reflection-critique | Reflection & Critique |
| adv-agent-scaling | Agent Scaling |
| adv-agent-tool-use-advanced | Advanced Tool Use |
| adv-ai-coding | AI-Driven Coding |
| adv-api-design | API Design Best Practices |
| adv-autonomous-brainstorming | Autonomous Brainstorming |
| adv-code-optimization | Code Optimization |
| adv-cognitive-biases-defense | Cognitive Bias Defense |
| adv-context-engineering | Context Engineering |
| adv-continuous-improvement | Continuous Improvement (Kaizen) |
| adv-creative-problem-solving | Creative Problem Solving |
| adv-data-governance | Data Governance |
| adv-data-privacy-engineering | Privacy Engineering |
| adv-data-quality | Data Quality |
| adv-decision-frameworks | Decision Frameworks |
| adv-devops-automation | DevOps Automation |
| adv-ethical-ai-framework | Ethical AI Framework |
| adv-image-creation | Image Creation (DALL-E/MJ/SD) |
| adv-innovation-pipeline | Innovation Pipeline |
| adv-middleware-connectors | Middleware Connectors |
| adv-multi-agent-orchestration | Multi-Agent Orchestration |
| adv-multi-agent-topologies | Multi-Agent Topologies |
| adv-performance-metrics | Performance Metrics |
| adv-prompt-optimization | Prompt Optimization & A/B |
| adv-prompt-patterns | 20 Elite Prompt Patterns |
| adv-reflection-learning | Reflective Learning |
| adv-responsible-ai-ops | Responsible AI Ops |
| adv-self-evaluation | Self-Evaluation Framework |
| adv-strategic-reasoning | Strategic Reasoning |
| adv-systems-integration | Systems Integration |
| adv-systems-thinking | Systems Thinking |
| adv-tiny-crabs-framework | TINY CRABS Prompt Framework |
| adv-truth-compliance | Truth Compliance |
| adv-video-creation | Video Creation (Runway/Pika/HeyGen) |

### AI Fundamentals (from seedAiKb.ts — 62 embedded docs)
Categories: Prompt Engineering, AI Agents, RAG/Retrieval, LLMOps, AI Marketing, AI CRM, AI Productivity, AI Security, AI Strategy, Data Engineering, Social Media AI

---

## STATISTICS

| Category | Count |
|----------|-------|
| Governance (all agents) | 9 |
| Agent definitions + playbooks | 29 |
| Social media guidelines | 12 |
| Platform & architecture | 7 |
| Workflow & operations | 8 |
| Business & SaaS | 8 |
| Legal (law-*) | 13 |
| MBA education (mba-*) | 15 |
| Education (edu-*) | 12 |
| Advanced AI/technical (adv-*) | 47 |
| AI fundamentals (seedAiKb) | 62 |
| Misc (support, API, etc.) | ~16 |
| **Docs in /docs/kb/ files** | **178** |
| **Embedded in seed scripts** | **~240** |
| **TOTAL** | **418+** |

| Agent Tier | Agents | Avg KB Docs |
|------------|--------|-------------|
| Executive | 3 | 8-12 |
| Governor | 2 | 4-6 |
| Specialist | 2 | 5-6 |
| Subagent (social) | 13 | 6-8 |
| Subagent (ops) | 8 | 3-5 |
| Subagent (research) | 3 | 5-7 |
