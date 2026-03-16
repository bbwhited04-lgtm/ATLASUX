import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const SITE = "https://atlasux.cloud";

const media = [
  // ── Videos — Demo Reels (high-value, reuse heavily) ──────────────────────
  {
    type: "video", platform: "all", name: "Lucy Animated — Full Demo (40s)",
    url: `${SITE}/videos/Lucyanimated.mp4`,
    metrics: { duration: 40, use: "hero-content", description: "Cinematic Sora-generated video: Lucy answers emergency plumber call, books 8AM appointment, sends SMS, posts Slack, emails plumber. Best asset for cold audiences." },
  },
  {
    type: "video", platform: "all", name: "Lucy Inbound Call Demo",
    url: `${SITE}/videos/lucy-inbound-demo.mp4`,
    metrics: { duration: 28, use: "demo", description: "Screen-capture style demo showing Lucy answering inbound call, booking appointment, SMS confirmation. Good for tutorials and how-it-works posts." },
  },
  {
    type: "video", platform: "all", name: "Mercer Outbound Sales Demo",
    url: `${SITE}/videos/mercer-outbound-demo.mp4`,
    metrics: { duration: 28, use: "demo", description: "Mercer cold-calling leads, qualifying, booking demos. Use for sales/outbound content." },
  },
  {
    type: "video", platform: "all", name: "Slack Integration Demo",
    url: `${SITE}/videos/slack-integration-demo.mp4`,
    metrics: { duration: 26, use: "demo", description: "Real-time Slack notifications, reports, approvals. Use for integration and workflow posts." },
  },
  {
    type: "video", platform: "all", name: "Zoom Integration Demo",
    url: `${SITE}/videos/zoom-integration-demo.mp4`,
    metrics: { duration: 25, use: "demo", description: "AI note-taker with live transcription. Use for meeting and productivity posts." },
  },
  {
    type: "video", platform: "all", name: "Multi-Language Demo",
    url: `${SITE}/videos/multi-language-demo.mp4`,
    metrics: { duration: 26, use: "demo", description: "Lucy auto-detects and responds in English, Spanish, French. Use for multilingual and diversity-of-customer posts." },
  },

  // ── Videos — Sora Scenes (short clips for Reels/Shorts/TikTok) ──────────
  {
    type: "video", platform: "tiktok,instagram,youtube", name: "Sora Scene 1 — Incoming Call",
    url: `${SITE}/videos/sora/scene1-incoming-call.mp4`,
    metrics: { duration: 8, use: "short-clip", description: "Cinematic robot reaching for holographic caller ID. Perfect hook clip for Reels/Shorts." },
  },
  {
    type: "video", platform: "tiktok,instagram,youtube", name: "Sora Scene 2 — Phone Conversation",
    url: `${SITE}/videos/sora/scene2-conversation.mp4`,
    metrics: { duration: 8, use: "short-clip", description: "Close-up of robot on phone call with audio waveform. Good for 'Lucy in action' clips." },
  },
  {
    type: "video", platform: "tiktok,instagram,youtube", name: "Sora Scene 3 — Booking Appointment",
    url: `${SITE}/videos/sora/scene3-booking.mp4`,
    metrics: { duration: 8, use: "short-clip", description: "Robot tapping 8AM on holographic calendar. Best clip for appointment/booking content." },
  },
  {
    type: "video", platform: "tiktok,instagram,youtube", name: "Sora Scene 4 — SMS + Slack",
    url: `${SITE}/videos/sora/scene4-sms-slack.mp4`,
    metrics: { duration: 8, use: "short-clip", description: "Robot orchestrating SMS and Slack dual screens. Use for multi-channel notification posts." },
  },
  {
    type: "video", platform: "tiktok,instagram,youtube", name: "Sora Scene 5 — Email Send",
    url: `${SITE}/videos/sora/scene5-email-send.mp4`,
    metrics: { duration: 8, use: "short-clip", description: "Robot sending emergency email with checkmarks. Good for 'full workflow completed' posts." },
  },

  // ── Images — Brand Art ──────────────────────────────────────────────────
  {
    type: "image", platform: "all", name: "Atlas Hero — Blue Wireframe Robot",
    url: `${SITE}/atlas_hero.png`,
    metrics: { use: "brand-hero", description: "Main brand art: blue wireframe humanoid with glasses at monitor, ATLAS UX text. Use as profile image, hero, or thumbnail background." },
  },
  {
    type: "image", platform: "all", name: "Atlas Hero RGBA (transparent)",
    url: `${SITE}/atlas_hero_rgba.png`,
    metrics: { use: "brand-overlay", description: "Transparent background version of Atlas hero. Use as overlay on custom graphics." },
  },
  {
    type: "image", platform: "all", name: "Atlas Team Composite",
    url: `${SITE}/atlas-team.png`,
    metrics: { use: "team-showcase", description: "All Atlas UX agents team photo/composite. Use for team and about posts." },
  },
  {
    type: "image", platform: "all", name: "Blog Cover — Missed Call Cost",
    url: `${SITE}/blog/covers/missed-call-cost.png`,
    metrics: { use: "blog-social", description: "Blog cover art for missed call revenue loss article. Dark theme, on-brand. Good for resharing blog content." },
  },
];

let created = 0;
for (const m of media) {
  const existing = await p.$queryRaw`SELECT id FROM assets WHERE tenant_id = ${TENANT_ID}::uuid AND url = ${m.url} LIMIT 1`;
  if (existing.length === 0) {
    await p.asset.create({
      data: {
        tenantId: TENANT_ID,
        type: m.type,
        name: m.name,
        url: m.url,
        platform: m.platform,
        metrics: m.metrics,
      },
    });
    created++;
    console.log(`+ ${m.type} — ${m.name}`);
  } else {
    console.log(`= ${m.type} — ${m.name} (exists)`);
  }
}

console.log(`\nDone: ${created} media assets added. Total assets now: ${await p.asset.count({ where: { tenantId: TENANT_ID } })}`);
await p.$disconnect();
