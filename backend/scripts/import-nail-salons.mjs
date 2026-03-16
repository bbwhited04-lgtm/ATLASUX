import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PLACES_API = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELDS = "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri";

async function run() {
  const res = await fetch(PLACES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": "AIzaSyDO8rs_UsSLOTctSw9X_8Z5nuVwujkZmK4",
      "X-Goog-FieldMask": PLACES_FIELDS,
    },
    body: JSON.stringify({
      textQuery: "nail salon",
      locationBias: {
        circle: {
          center: { latitude: 39.1357056, longitude: -91.7828966 },
          radius: 25000,
        },
      },
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
    if (!name || !phone) {
      skipped++;
      continue;
    }

    const existing = await prisma.lead.findFirst({ where: { phone } });
    if (existing) {
      skipped++;
      continue;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email: "",
        phone,
        businessName: name,
        businessType: "nail salon",
        message: [
          p.formattedAddress,
          p.rating ? `Rating: ${p.rating} (${p.userRatingCount || 0} reviews)` : null,
          p.websiteUri ? `Web: ${p.websiteUri}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        source: "google_places",
      },
    });
    newLeads.push(lead);
    console.log("  +", name, phone);
    imported++;
  }

  console.log(`Done: ${imported} imported, ${skipped} skipped`);

  // Post to Slack
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_LEADS_CHANNEL_ID;
  if (imported > 0 && token && channel) {
    const listing = newLeads
      .map((l) => `  \u2022 *${l.name}* ${l.phone}\n    _${l.message}_`)
      .join("\n");
    const msg = `:mag: *${imported} New Nail Salon Prospects Imported*\nSearch: "nail salon" near Mexico/Fulton/Columbia MO\n\n${listing}\n\n_${skipped} duplicates skipped_`;

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        text: msg,
        username: "Binky",
        icon_emoji: ":mag:",
        unfurl_links: false,
      }),
    });
    const slackData = await slackRes.json();
    console.log("Slack:", slackData.ok ? "posted to #leads" : slackData.error);
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
