import "dotenv/config";
const token = process.env.SLACK_BOT_TOKEN;
console.log("Token prefix:", token?.slice(0, 10));
const res = await fetch("https://slack.com/api/conversations.list", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ limit: 200, types: "public_channel,private_channel" }),
});
const data = await res.json();
if (!data.ok) { console.error(data.error); process.exit(1); }
const channels = data.channels.filter(c => /mercer|sales|leads|general|prospect/i.test(c.name));
channels.forEach(c => console.log(c.id, c.name, c.is_member ? "(joined)" : ""));
