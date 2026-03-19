---
title: "Connecting Your Social Media Accounts"
category: "Social Media"
tags: ["accounts", "integration", "Postiz", "OAuth", "Instagram", "Facebook", "X", "TikTok", "LinkedIn", "setup"]
related: ["publishing-to-platforms.md", "creating-posts.md", "broadcasting.md", "../integrations/postiz-integration.md", "../getting-started/setup-wizard.md"]
---

# Connecting Your Social Media Accounts

Before Atlas UX can publish posts on your behalf, you need to connect your social media accounts. This is a one-time setup for each platform. Once connected, Atlas can post, schedule, and manage content across all your linked accounts.

## How It Works

Atlas UX connects to your social accounts through Postiz, a secure social media integration platform. When you connect an account, you're authorizing Postiz to post on your behalf -- similar to how you'd connect any app to your Instagram or Facebook account. Atlas UX never stores your social media passwords.

## Step-by-Step: Connecting an Account

### 1. Go to Settings

From your dashboard, navigate to **Settings > Integrations > Social Media**. You'll see a list of supported platforms with "Connect" buttons.

### 2. Click Connect

Click the **Connect** button next to the platform you want to add. A login window for that platform will open.

### 3. Log In and Authorize

Log into your social media account (if you're not already) and approve the connection. Each platform's authorization screen looks a little different, but they all ask you to confirm that you want to allow Atlas UX to post on your behalf.

### 4. Confirm the Connection

After authorizing, you'll be redirected back to Atlas UX. The platform will show a green "Connected" status with the account name or handle displayed.

That's it. You can start posting to that platform immediately.

## Platform-by-Platform Guide

### Instagram

- You need an **Instagram Business** or **Creator** account (not a personal account)
- Instagram Business accounts must be linked to a Facebook Page
- If you have a personal account, convert it to a Business account in Instagram's settings -- it takes about 30 seconds and is free
- After connecting, you can post images, carousels, and Reels

### Facebook

- You can connect a Facebook **Page** (recommended for business use)
- Select which Page to connect if you manage multiple Pages
- Facebook personal profiles have limited API access -- use a Page for best results

### X (Twitter)

- Log in with your X account credentials
- Authorize Atlas UX to read and write on your behalf
- Works with both free and premium X accounts

### TikTok

- Log in with your TikTok account
- Note: TikTok's API requires video content -- you won't be able to post image-only content here
- New posts default to "self only" visibility so you can review them on TikTok before making public

### LinkedIn

- Connect your LinkedIn personal profile or a Company Page you manage
- LinkedIn is excellent for commercial trades, B2B services, and professional content
- Carousel posts (multiple images) are supported

### Reddit

- Log in with your Reddit account
- You'll need to specify subreddits when creating posts
- Best for community engagement and niche trade discussions

### Pinterest

- Connect your Pinterest Business account
- Select or create a board for your posts
- Every pin automatically links back to your website

### YouTube

- Connect your YouTube/Google account
- Select the channel you want to post to
- Video uploads only -- with title, description, and tags

### Other Platforms

Threads, Mastodon, Tumblr, Medium, and others follow the same connect-and-authorize flow. Click Connect, log in, approve, and you're done.

## Managing Connected Accounts

Once your accounts are connected, you can manage them in **Settings > Integrations > Social Media**:

- **View status** -- See which accounts are connected and active
- **Disconnect** -- Remove a connection if you no longer want Atlas to post there
- **Reconnect** -- If a connection expires (some platforms require reauthorization every 60-90 days), click Reconnect to refresh it

### Token Expiration

Some platforms (especially Instagram and Facebook) expire their authorization tokens periodically. When this happens:

- Atlas UX notifies you that a connection needs refreshing
- Posts to that platform will show as "Failed" until you reconnect
- Reconnecting takes about 10 seconds -- just click Reconnect and approve again

**Tip:** If you see posts failing on a specific platform, check your connection status first. A quick reconnect usually fixes it.

## Security and Privacy

- Atlas UX never sees or stores your social media passwords
- Connections use industry-standard OAuth (the same security protocol used by major apps)
- You can revoke access at any time from your Atlas UX settings or from the social platform itself
- Your social media data stays between you and the platform -- Atlas only sends posts you create

## Common Questions

**Can I connect multiple accounts on the same platform?**
Yes. For example, if you run two Facebook Pages for different service areas, you can connect both and choose which one to post to.

**Do I need a business account on every platform?**
Instagram requires a Business or Creator account. Other platforms work with standard accounts, though business accounts often have better analytics.

**What happens to my posts if I disconnect an account?**
Posts already published stay on the platform. Disconnecting just stops Atlas from posting new content to that account. Scheduled posts for that platform will fail.

**Can my team members connect their own accounts?**
Yes. Any team member with access to your Atlas UX settings can add social accounts. All connected accounts are shared across your Atlas UX workspace.

## What's Next?

- Start [Creating Posts](creating-posts.md) for your connected platforms
- Learn about [Publishing to Platforms](publishing-to-platforms.md) and scheduling
- Post everywhere at once with [Broadcasting](broadcasting.md)
- Review [Media Requirements](media-requirements.md) before your first post


---
## Media

> **Tags:** `postiz` · `social-media` · `scheduling` · `publishing` · `analytics` · `open-source`

### Official Resources
- [Official Documentation](https://docs.postiz.com)
- [Postiz Documentation](https://docs.postiz.com)

### Video Tutorials
- [Postiz Social Media Management Tutorial](https://www.youtube.com/results?search_query=postiz+social+media+management+tutorial) — *Credit: Postiz on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
