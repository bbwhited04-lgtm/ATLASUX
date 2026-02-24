/**
 * Atlas UX Workflow Library — n8n Adapter Manifests
 *
 * Every workflow here is an Atlas UX workflow first.
 * The n8n JSON is the execution engine under the hood — the user never sees "n8n".
 *
 * ID convention:
 *   WF-001–019  Reserved — Atlas core (support, escalation)
 *   WF-020–029  Atlas system / bootstrap
 *   WF-030–039  Research & content creation
 *   WF-040–059  Social media publishing & engagement
 *   WF-060–069  Analytics & competitive intelligence
 *   WF-070–079  Legal, compliance & finance (agent-owned)
 *   WF-080–089  Operations — DevOps, HR, healthcare, education
 *   WF-090–099  Customer service automation
 */

export type AtlasWorkflowDef = {
  id: string;           // WF-### — the Atlas UX canonical ID
  name: string;         // Clean, professional Atlas UX name
  description: string;  // One-line purpose
  category: string;     // Domain label shown in UI
  ownerAgent: string;   // Which Atlas agent owns/executes this
  trigger: string;      // How it starts: webhook | cron | email | manual | telegram
  humanInLoop: boolean; // Does it pause for human approval?
  file: string;         // Path to the n8n JSON (repo-relative)
};

export const n8nWorkflows: AtlasWorkflowDef[] = [

  // ── Orchestration ─────────────────────────────────────────────────────────
  {
    id: "WF-022",
    name: "Atlas Full Orchestrator",
    description: "Master email-driven orchestration pipeline — reads inbox, routes tasks, dispatches agents.",
    category: "orchestration",
    ownerAgent: "atlas",
    trigger: "email",
    humanInLoop: true,
    file: "workflows/n8n/ATLAS_orchestrator_FULL_email_endpoint.json",
  },

  // ── Research & Content ────────────────────────────────────────────────────
  {
    id: "WF-030",
    name: "YouTube Transcript → Blog Post",
    description: "Pulls a YouTube video transcript and drafts a formatted blog post for Reynolds to publish.",
    category: "content_creation",
    ownerAgent: "reynolds",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/content_creation/youtube2blog.json",
  },
  {
    id: "WF-031",
    name: "Binky Daily Research Digest",
    description: "Aggregates world news, trends, and hashtags into Binky's daily structured JSON summary.",
    category: "research",
    ownerAgent: "binky",
    trigger: "cron",
    humanInLoop: false,
    file: "workflows/n8n/research/Binky-Research.json",
  },
  {
    id: "WF-032",
    name: "Sunday Doc Intake & Draft Reply",
    description: "Reads inbound docs, drafts a reply, and gates on Atlas approval before sending.",
    category: "research",
    ownerAgent: "sunday",
    trigger: "email",
    humanInLoop: true,
    file: "workflows/n8n/research/SUNDAY_workflow.json.json",
  },

  // ── Social Media ──────────────────────────────────────────────────────────
  {
    id: "WF-040",
    name: "Multi-Platform Social Content Creator",
    description: "AI-generated content published across all connected social platforms in one run.",
    category: "social_media",
    ownerAgent: "penny",
    trigger: "manual",
    humanInLoop: true,
    file: "workflows/n8n/social_media/✨🤖Automate Multi-Platform Social Media Content Creation with AI.json",
  },
  {
    id: "WF-041",
    name: "Blog → LinkedIn & X Auto-Post",
    description: "Watches for new blog posts and automatically publishes excerpts to LinkedIn and X.",
    category: "social_media",
    ownerAgent: "reynolds",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/social_media/auto_blogpost_linkedin_twitter.json",
  },
  {
    id: "WF-042",
    name: "Auto-DM New X Followers",
    description: "Sends a personalized welcome DM to every new X (Twitter) follower.",
    category: "social_media",
    ownerAgent: "kelly",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/social_media/auto_dm_twitter_new_follower.json",
  },
  {
    id: "WF-043",
    name: "Article → X, LinkedIn, Reddit & Threads Publisher",
    description: "Repurposes web articles into platform-optimized posts via Gemini AI.",
    category: "social_media",
    ownerAgent: "atlas",
    trigger: "manual",
    humanInLoop: true,
    file: "workflows/n8n/social_media/Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI.json",
  },
  {
    id: "WF-044",
    name: "Instagram Comment Response & DM Tracker",
    description: "Monitors Instagram comments, sends DM replies, and logs activity to Google Sheets.",
    category: "social_media",
    ownerAgent: "archy",
    trigger: "manual",
    humanInLoop: false,
    file: "workflows/n8n/social_media/Automated Instagram comment response with DMs & Google Sheets tracking.json",
  },
  {
    id: "WF-045",
    name: "LinkedIn Scheduled Post Creator",
    description: "Generates GPT-4 copy and DALL-E images for scheduled LinkedIn posts.",
    category: "social_media",
    ownerAgent: "link",
    trigger: "cron",
    humanInLoop: true,
    file: "workflows/n8n/social_media/Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts.json",
  },
  {
    id: "WF-046",
    name: "Bulk Video → Social Publish (AI Copy + Approval)",
    description: "Processes video assets, generates AI copy, routes for client approval, then publishes.",
    category: "social_media",
    ownerAgent: "venny",
    trigger: "manual",
    humanInLoop: true,
    file: "workflows/n8n/social_media/Bulk Auto-Publish Videos to Social Networks with AI Copy and Client Approval.json",
  },
  {
    id: "WF-047",
    name: "Image & Video Multi-Platform Publisher",
    description: "Distributes image and video assets across X, Instagram, Facebook, and more.",
    category: "social_media",
    ownerAgent: "penny",
    trigger: "manual",
    humanInLoop: true,
    file: "workflows/n8n/social_media/multipass.json",
  },
  {
    id: "WF-048",
    name: "Pinterest Asset Publisher",
    description: "Webhook-triggered pipeline that publishes images and boards to Pinterest.",
    category: "social_media",
    ownerAgent: "cornwall",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/social_media/pinterest.json",
  },
  {
    id: "WF-049",
    name: "Tumblr Post Publisher",
    description: "Posts formatted content to the Atlas Tumblr blog with tracking reference ID.",
    category: "social_media",
    ownerAgent: "terry",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/social_media/tumblr_publish.json",
  },
  {
    id: "WF-050",
    name: "Universal Social Content Generator",
    description: "Telegram-triggered AI content generator that outputs to any configured social platform.",
    category: "social_media",
    ownerAgent: "atlas",
    trigger: "telegram",
    humanInLoop: false,
    file: "workflows/n8n/social_media/Universal Social Media Content Generator with AI.json",
  },

  // ── Analytics & Intelligence ───────────────────────────────────────────────
  {
    id: "WF-060",
    name: "Competitor Price Intelligence",
    description: "Scrapes competitor pricing pages and delivers a structured delta report to Binky.",
    category: "analytics",
    ownerAgent: "binky",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/analytics/competitor_price_scrapper.json",
  },
  {
    id: "WF-061",
    name: "Ad Campaign Performance Alert",
    description: "Monitors ad performance thresholds and alerts Atlas when KPIs fall out of range.",
    category: "analytics",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/media/ad_campain_alert.json",
  },
  {
    id: "WF-062",
    name: "TV Rating Trend Report",
    description: "Aggregates TV rating data and surfaces trend analysis for media strategy decisions.",
    category: "analytics",
    ownerAgent: "binky",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/media/tv_rating_trents.json",
  },

  // ── Legal, Compliance & Finance ───────────────────────────────────────────
  {
    id: "WF-070",
    name: "Benny IP Triage & Evidence Pack",
    description: "Routes inbound IP claims to Benny, packages evidence, and gates on legal review.",
    category: "legal",
    ownerAgent: "benny",
    trigger: "webhook",
    humanInLoop: true,
    file: "workflows/n8n/legal/triageevidencepack.json",
  },
  {
    id: "WF-071",
    name: "Jenny CLO Intake & Legal Advisory",
    description: "Receives legal intake emails, drafts CLO advisory responses, and gates on Jenny approval.",
    category: "legal",
    ownerAgent: "jenny",
    trigger: "email",
    humanInLoop: true,
    file: "workflows/n8n/legal/JENNY-CLO-intake.json",
  },
  {
    id: "WF-072",
    name: "Larry Audit Intake & Compliance Gate",
    description: "Processes audit intake emails, runs a compliance stop, and routes findings to Larry.",
    category: "finance",
    ownerAgent: "larry",
    trigger: "email",
    humanInLoop: true,
    file: "workflows/n8n/financial/LARRY-workflow.json",
  },
  {
    id: "WF-073",
    name: "Tina Finance Intake & Risk Gate",
    description: "Reads finance intake emails, evaluates risk tier, and issues CFO advisory reply.",
    category: "finance",
    ownerAgent: "tina",
    trigger: "email",
    humanInLoop: true,
    file: "workflows/n8n/financial/TINA-workflow.json.json",
  },

  // ── Operations ────────────────────────────────────────────────────────────
  {
    id: "WF-080",
    name: "GitHub Commit → Jenkins Build Trigger",
    description: "Listens for GitHub push events and triggers the corresponding Jenkins pipeline.",
    category: "devops",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/devops/github_jenkins.json",
  },
  {
    id: "WF-081",
    name: "Appointment Confirmation Notifier",
    description: "Sends WhatsApp confirmation messages for scheduled healthcare appointments.",
    category: "operations",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/healthcare/appointment_notification.json",
  },
  {
    id: "WF-082",
    name: "Job Application Parser & Router",
    description: "Parses inbound job applications, extracts structured data, and routes to hiring manager.",
    category: "hr",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/hr/job_application_parser.json",
  },
  {
    id: "WF-083",
    name: "Quiz Auto-Grader",
    description: "Automatically grades quiz submissions and returns scored results with feedback.",
    category: "education",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/education/quiz_auto_grader.json",
  },

  // ── Customer Service Automation ───────────────────────────────────────────
  {
    id: "WF-090",
    name: "Atlas Approval Poller",
    description: "Polls for pending DecisionMemo approvals and nudges the human-in-loop controller.",
    category: "customer_service",
    ownerAgent: "atlas",
    trigger: "cron",
    humanInLoop: true,
    file: "workflows/n8n/customer_service/AtlasUX_Approval_Poller_FIXED.json",
  },
  {
    id: "WF-091",
    name: "Atlas Suggestion Generator",
    description: "Generates proactive task and content suggestions based on business context.",
    category: "customer_service",
    ownerAgent: "atlas",
    trigger: "webhook",
    humanInLoop: false,
    file: "workflows/n8n/customer_service/AtlasUX_Suggestion_Generator_FIXED.json",
  },
];

export default n8nWorkflows;
