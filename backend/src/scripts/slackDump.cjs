const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const msgs = await p.slackMessage.findMany({
    where: { isAgent: true },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { username: true, text: true, channelName: true, createdAt: true },
  });

  for (const m of msgs) {
    const d = m.createdAt.toISOString().slice(0, 10);
    console.log("---");
    console.log(`[${d}] #${m.channelName} @${m.username || "unknown"}`);
    console.log(m.text.slice(0, 500));
  }

  await p.$disconnect();
}

main().catch((e) => console.error(e.message));
