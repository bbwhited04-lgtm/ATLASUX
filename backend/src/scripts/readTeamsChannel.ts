/**
 * Read Atlas UC Teams group — General channel messages.
 * Usage: cd backend && npx tsx src/scripts/readTeamsChannel.ts
 */
import "dotenv/config";

const tenantId = process.env.MS_TENANT_ID || "";
const clientId = process.env.MS_CLIENT_ID || "";
const clientSecret = process.env.MS_CLIENT_SECRET || "";

async function main() {
  // Get app token
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() },
  );
  const tokenData = (await tokenRes.json()) as any;
  if (!tokenRes.ok) {
    console.error("Token fail:", tokenData.error_description);
    return;
  }
  const token = tokenData.access_token;

  // List all Teams
  const teamsRes = await fetch(
    `https://graph.microsoft.com/v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const teamsData = (await teamsRes.json()) as any;
  if (!teamsRes.ok) {
    console.error("Teams list fail:", teamsData.error?.message);
    return;
  }

  const teams = teamsData.value || [];
  console.log(`\n=== Teams (${teams.length} found) ===\n`);

  for (const team of teams) {
    console.log(`Team: ${team.displayName} | ${team.id}`);

    // List channels
    const chRes = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${team.id}/channels?$select=id,displayName`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const chData = (await chRes.json()) as any;
    if (!chRes.ok) {
      console.log(`  (channels error: ${chData.error?.message})`);
      continue;
    }

    for (const ch of (chData.value || [])) {
      console.log(`  Channel: ${ch.displayName} | ${ch.id}`);

      // Read recent messages
      const msgRes = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${ch.id}/messages?$top=25`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const msgData = (await msgRes.json()) as any;
      if (!msgRes.ok) {
        console.log(`    (messages error: ${msgData.error?.message})`);
        continue;
      }

      const msgs = msgData.value || [];
      console.log(`    Messages: ${msgs.length}\n`);

      for (const m of msgs) {
        const from = m.from?.user?.displayName || m.from?.application?.displayName || "System";
        const date = new Date(m.createdDateTime).toLocaleString("en-US", {
          timeZone: "America/Chicago",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const bodyText = (m.body?.content || "")
          .replace(/<[^>]*>/g, "") // strip HTML
          .trim()
          .slice(0, 300);

        console.log(`    [${date}] ${from}`);
        if (m.subject) console.log(`    Subject: ${m.subject}`);
        if (bodyText) console.log(`    ${bodyText}`);
        console.log(`    ${"─".repeat(60)}`);
      }
    }
  }
}

main().catch(console.error);
