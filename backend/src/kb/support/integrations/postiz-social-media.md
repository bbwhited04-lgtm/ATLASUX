---
title: "Postiz Social Media Integration"
category: "Integrations"
tags: ["postiz", "social media", "facebook", "instagram", "linkedin", "posting"]
related:
  - integrations/api-keys
  - troubleshooting/common-errors
  - troubleshooting/getting-help
---

# Postiz Social Media Integration

Atlas UX uses **Postiz** to power all social media posting for your business. Instead of logging into five different apps, you connect your social accounts once through Postiz and Atlas UX handles the rest -- scheduling posts, tracking engagement, and keeping your brand active online.

## What Is Postiz?

Postiz is a social media management platform that connects to Facebook, Instagram, LinkedIn, X (Twitter), and other networks through a single dashboard. Atlas UX integrates directly with Postiz so that your AI team can draft, schedule, and publish content on your behalf.

You do not need to use Postiz separately. Everything runs through your Atlas UX dashboard.

## Connecting Your Postiz Account

1. Log in to your Atlas UX dashboard.
2. Go to **Settings > Integrations**.
3. Find the **Postiz** card and click **Connect**.
4. You will be prompted to enter your Postiz API key. If you do not have one yet, create a free Postiz account at [postiz.com](https://postiz.com) and generate an API key from your Postiz settings.
5. Paste the API key and click **Save**.

Atlas UX encrypts your API key at rest using AES-256-GCM encryption. Your key is never stored in plain text. For more details, see [How We Protect Your Data](../security-privacy/how-we-protect-your-data.md).

## Linking Social Platforms Through Postiz

Once your Postiz account is connected to Atlas UX, you need to link individual social platforms inside Postiz:

1. Log in to your Postiz account at [postiz.com](https://postiz.com).
2. Go to **Integrations** and connect each social account you want Atlas UX to post to (Facebook Page, Instagram Business, LinkedIn, etc.).
3. Authorize each platform when prompted.
4. Return to Atlas UX. Your connected channels will appear automatically under **Social Media > Channels**.

Atlas UX pulls your channel list directly from Postiz, so any platform you connect there becomes available here.

## What Atlas UX Does With Postiz

- **Scheduled posting** -- Your AI agents can draft and schedule posts to go out at optimal times.
- **Multi-platform publishing** -- A single post can go to Facebook, Instagram, and LinkedIn simultaneously.
- **Analytics** -- Atlas UX pulls engagement data (likes, shares, reach) from Postiz so you can see what is working without leaving the dashboard.
- **Content approval** -- Posts can require your approval before going live, so nothing goes out that you have not reviewed.

## Managing the Connection

- **To update your API key:** Go to Settings > Integrations > Postiz and click **Update Key**.
- **To disconnect:** Click **Disconnect** on the Postiz integration card. This stops all social posting but does not delete your Postiz account or linked social profiles.
- **If posting fails:** Check that your Postiz API key is still valid and that your social accounts are still connected inside Postiz. See [Common Errors](../troubleshooting/common-errors.md) for the "Integration not connected" error.

## Frequently Asked Questions

**Do I need a paid Postiz plan?**
Postiz offers free and paid tiers. The free tier works for basic posting. If you need advanced scheduling or more connected accounts, check Postiz's pricing page.

**Can I post manually too?**
Yes. Atlas UX automates posting, but you can always post directly through Postiz or through your social apps. They do not conflict.

**How often does Atlas UX post?**
Posting frequency depends on your configuration. Your AI agents follow daily posting caps to prevent spam. You control the schedule.

If you run into issues, see [Getting Help](../troubleshooting/getting-help.md) for how to reach our support team.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
