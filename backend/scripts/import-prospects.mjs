// Usage: node scripts/import-prospects.mjs "hair salon" 39.1352 -92.0301 50000 "Columbia MO area"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PLACES_API = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELDS = "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri";

const query = process.argv[2];
const lat = parseFloat(process.argv[3]);
const lng = parseFloat(process.argv[4]);
const radius = parseInt(process.argv[5] || "25000", 10);
const label = process.argv[6] || `(${lat}, ${lng})`;

if (!query || isNaN(lat) || isNaN(lng)) {
  console.error('Usage: node import-prospects.mjs "<query>" <lat> <lng> [radius] [label]');
  process.exit(1);
}

async function run() {
  const res = await fetch(PLACES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY || "AIzaSyDO8rs_UsSLOTctSw9X_8Z5nuVwujkZmK4",
      "X-Goog-FieldMask": PLACES_FIELDS,
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
      maxResultCount: 20,
    }),
  });

  const data = await res.json();
  const places = data.places || [];
  console.log("Found", places.length, "places from Google");

  let imported = 0;
  let skipped = 0;
  const newLeads = [];

  for (const p of places) {
    const name = p.displayName?.text;
    const phone = p.nationalPhoneNumber;
    if (!name || !phone) { skipped++; continue; }

    const existing = await prisma.lead.findFirst({ where: { phone } });
    if (existing) { skipped++; continue; }

    const lead = await prisma.lead.create({
      data: {
        name,
        email: "",
        phone,
        businessName: name,
        businessType: query,
        message: [
          p.formattedAddress,
          p.rating ? `Rating: ${p.rating} (${p.userRatingCount || 0} reviews)` : null,
          p.websiteUri ? `Web: ${p.websiteUri}` : null,
        ].filter(Boolean).join(" | "),
        source: "google_places",
      },
    });
    newLeads.push(lead);
    console.log("  +", name, phone);
    imported++;
  }

  console.log(`Done: ${imported} imported, ${skipped} skipped`);

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_LEADS_CHANNEL_ID;
  if (imported > 0 && token && channel) {
    const listing = newLeads
      .map((l) => `  \u2022 *${l.name}* ${l.phone}\n    _${l.message}_`)
      .join("\n");
    const msg = `:mag: *${imported} New ${query.charAt(0).toUpperCase() + query.slice(1)} Prospects Imported*\nSearch: "${query}" near ${label}\n\n${listing}\n\n_${skipped} duplicates skipped_`;

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel, text: msg, username: "Binky", icon_emoji: ":mag:", unfurl_links: false }),
    });
    const slackData = await slackRes.json();
    console.log("Slack:", slackData.ok ? "posted to #leads" : slackData.error);
  }

  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
