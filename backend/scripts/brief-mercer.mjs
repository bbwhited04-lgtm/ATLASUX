import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const leads = await prisma.lead.findMany({
    where: { source: "google_places" },
    orderBy: { createdAt: "desc" },
  });

  // Group by businessType
  const groups = {};
  for (const l of leads) {
    const type = l.businessType || "other";
    if (!groups[type]) groups[type] = [];
    groups[type].push(l);
  }

  const summary = Object.entries(groups)
    .map(([type, list]) => {
      const header = `*${type.charAt(0).toUpperCase() + type.slice(1)}* (${list.length})`;
      const items = list
        .map((l) => `    \u2022 ${l.name} \u2014 ${l.phone}`)
        .join("\n");
      return `${header}\n${items}`;
    })
    .join("\n\n");

  const msg = [
    `:handshake: *Mercer \u2014 New Outreach Assignment*`,
    ``,
    `You\u2019ve got *${leads.length} fresh prospects* across ${Object.keys(groups).length} verticals in the Columbia/Mid-Missouri area. Every one of these businesses answers their own phone or misses calls entirely \u2014 they need Lucy.`,
    ``,
    `*Your mission:* Work through this list. Introduce Lucy as their AI receptionist that picks up every call, books appointments, and never puts anyone on hold. Lead with the missed-call revenue angle \u2014 every missed call is $200-600 walking out the door.`,
    ``,
    `*Talking points:*`,
    `\u2022 "How many calls do you miss during a busy day?"`,
    `\u2022 "What if every call got answered on the first ring, 24/7?"`,
    `\u2022 "Lucy books appointments, answers FAQs, and routes emergencies \u2014 no hold music, no voicemail"`,
    `\u2022 First 50 customers get grandfathered pricing`,
    `\u2022 30-day money-back guarantee, no contracts`,
    ``,
    `---`,
    ``,
    summary,
    ``,
    `---`,
    ``,
    `_Start with the highest-rated businesses \u2014 they care about customer experience and will get it immediately. Go get \u2018em._ :fire:`,
  ].join("\n");

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_LEADS_CHANNEL_ID;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      channel,
      text: msg,
      username: "Atlas",
      icon_emoji: ":earth_americas:",
      unfurl_links: false,
    }),
  });

  const data = await res.json();
  console.log("Slack:", data.ok ? "Mercer briefing posted to #leads" : data.error);

  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
