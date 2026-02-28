/**
 * Read Atlas CEO's M365 inbox using Resource Owner Password Credentials (ROPC).
 * Usage: cd backend && npx tsx src/scripts/readAtlasInbox.ts
 */
import "dotenv/config";

const tenantId = process.env.MS_TENANT_ID!;
const clientId = process.env.MS_CLIENT_ID!;
const clientSecret = process.env.MS_CLIENT_SECRET!;
const atlasEmail = (process.env.AGENT_EMAIL_ATLAS || "atlas.ceo@deadapp.info").trim();
const atlasPassword = (process.env.AGENT_EMAIL_PASWORD_ATLAS || "").trim();

async function main() {
  if (!atlasPassword) {
    console.error("AGENT_EMAIL_PASWORD_ATLAS not set in .env");
    process.exit(1);
  }

  console.log(`Logging in as: ${atlasEmail}`);
  console.log(`Tenant: ${tenantId}`);

  // Try 1: ROPC flow (delegated, user context)
  const ropcParams = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access",
    username: atlasEmail,
    password: atlasPassword,
  });

  let token: string | null = null;

  const ropcRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: ropcParams.toString() },
  );

  const ropcData = (await ropcRes.json()) as any;

  if (ropcRes.ok && ropcData.access_token) {
    console.log("ROPC auth succeeded (delegated user token)\n");
    token = ropcData.access_token;
  } else {
    console.log("ROPC auth failed:", ropcData.error_description || ropcData.error || "unknown");
    console.log("\nTrying app-only (client_credentials) with /users/ endpoint...\n");

    // Try 2: App-only with /users/{email}/messages
    const appParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    });

    const appRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: appParams.toString() },
    );

    const appData = (await appRes.json()) as any;
    if (appRes.ok && appData.access_token) {
      console.log("App-only auth succeeded\n");
      token = appData.access_token;
    } else {
      console.error("Both auth methods failed. App error:", appData.error_description || appData.error);
      process.exit(1);
    }
  }

  // Read inbox — try /me first (ROPC), fall back to /users/{email}
  const endpoints = [
    `https://graph.microsoft.com/v1.0/me/messages?$top=30&$orderby=receivedDateTime desc&$select=subject,from,receivedDateTime,bodyPreview,isRead`,
    `https://graph.microsoft.com/v1.0/users/${atlasEmail}/messages?$top=30&$orderby=receivedDateTime desc&$select=subject,from,receivedDateTime,bodyPreview,isRead`,
  ];

  for (const url of endpoints) {
    const mailRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (mailRes.ok) {
      const mailData = (await mailRes.json()) as any;
      const msgs = mailData.value || [];

      console.log(`=== Atlas CEO Inbox (${msgs.length} messages) ===\n`);

      if (msgs.length === 0) {
        console.log("Inbox is empty.");
        console.log("\nThis means:");
        console.log("  - The scheduler worker hasn't run yet (npm run worker:engine)");
        console.log("  - Or the email sender worker hasn't delivered yet");
        console.log("  - Or no workflows have fired that send emails to Atlas");
      }

      for (const m of msgs) {
        const fromName = m.from?.emailAddress?.name || "";
        const fromAddr = m.from?.emailAddress?.address || "?";
        const date = new Date(m.receivedDateTime).toLocaleString("en-US", {
          timeZone: "America/Chicago",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const unread = m.isRead ? "" : " ** UNREAD **";

        console.log(`From: ${fromName} <${fromAddr}>`);
        console.log(`Date: ${date}${unread}`);
        console.log(`Subj: ${m.subject}`);
        if (m.bodyPreview) console.log(`Preview: ${m.bodyPreview.slice(0, 300)}`);
        console.log("─".repeat(70));
      }
      return;
    }

    const errData = (await mailRes.json().catch(() => ({}))) as any;
    console.log(`Endpoint ${url.includes("/me/") ? "/me" : "/users"} failed: ${errData.error?.message || mailRes.status}`);
  }

  console.error("Could not read inbox from any endpoint.");
}

main().catch(console.error);
