import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

const socials = [
  // Instagram
  { type: "social", platform: "instagram", name: "Billy (Personal)", url: "https://www.instagram.com/billyw6160/" },
  { type: "social", platform: "instagram", name: "Atlas UX", url: "https://www.instagram.com/atlas.ux/" },
  { type: "social", platform: "instagram", name: "BNW Services", url: "https://www.instagram.com/bnwservicesllc/" },
  { type: "social", platform: "instagram", name: "ShortyPro", url: "https://www.instagram.com/shortypro2/" },
  { type: "social", platform: "instagram", name: "BuffaloHerde", url: "https://www.instagram.com/buffaloherde/" },
  { type: "social", platform: "instagram", name: "DeadApp Pro", url: "https://www.instagram.com/deadapppro/" },

  // LinkedIn
  { type: "social", platform: "linkedin", name: "Billy (Profile)", url: "https://www.linkedin.com/in/ruralcowboy/" },
  { type: "social", platform: "linkedin", name: "Company Page #1", url: "https://www.linkedin.com/company/109020222" },
  { type: "social", platform: "linkedin", name: "Company Page #2", url: "https://www.linkedin.com/company/111775077" },

  // Facebook
  { type: "social", platform: "facebook", name: "Billy Whited", url: "https://www.facebook.com/billy.whited" },

  // X / Twitter
  { type: "social", platform: "x", name: "BuffaloHerde", url: "https://x.com/buffaloherde" },
  { type: "social", platform: "x", name: "Atlas UX", url: "https://x.com/atlas_ux" },
  { type: "social", platform: "x", name: "ShortyPro", url: "https://x.com/shortypro2" },

  // TikTok
  { type: "social", platform: "tiktok", name: "BuffaloHerde", url: "https://www.tiktok.com/@buffaloherde" },
  { type: "social", platform: "tiktok", name: "ShortyPro", url: "https://www.tiktok.com/@shortypro2" },
  { type: "social", platform: "tiktok", name: "ViralDead Engine", url: "https://www.tiktok.com/@viraldeadengine" },

  // YouTube
  { type: "social", platform: "youtube", name: "Billy Whited", url: "https://www.youtube.com/@billywhited4442" },
  { type: "social", platform: "youtube", name: "ShortyPro2", url: "https://www.youtube.com/@ShortyPro2" },
  { type: "social", platform: "youtube", name: "ViralDead Engine", url: "https://www.youtube.com/@viraldeadengine" },
  { type: "social", platform: "youtube", name: "BuffaloHerde", url: "https://www.youtube.com/@buffaloherde4170" },
];

let created = 0;
for (const s of socials) {
  // Upsert by URL to avoid duplicates
  const existing = await p.$queryRaw`SELECT id FROM assets WHERE tenant_id = ${TENANT_ID}::uuid AND url = ${s.url} LIMIT 1`;
  if (existing.length === 0) {
    await p.asset.create({
      data: {
        tenantId: TENANT_ID,
        type: s.type,
        name: s.name,
        url: s.url,
        platform: s.platform,
        metrics: {},
      },
    });
    created++;
    console.log(`+ ${s.platform} — ${s.name}`);
  } else {
    console.log(`= ${s.platform} — ${s.name} (exists)`);
  }
}

console.log(`\nDone: ${created} socials added to assets table`);
await p.$disconnect();
