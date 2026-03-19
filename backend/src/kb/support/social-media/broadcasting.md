---
title: "Broadcasting to Multiple Platforms"
category: "Social Media"
tags: ["broadcasting", "multi-platform", "cross-posting", "channels", "delivery", "scheduling"]
related: ["creating-posts.md", "publishing-to-platforms.md", "connecting-social-accounts.md", "editing-drafts.md", "media-requirements.md"]
---

# Broadcasting to Multiple Platforms

Broadcasting lets you send a single post to multiple social media platforms at once. Instead of creating separate posts for Instagram, Facebook, X, LinkedIn, and TikTok, you create one post and Atlas UX delivers it everywhere -- formatted correctly for each platform.

## How Broadcasting Works

### Step 1: Create Your Post

Start by creating a post as usual (see [Creating Posts](creating-posts.md)). Write your content and add your media.

### Step 2: Select Your Channels

At the bottom of the post editor, you'll see a list of your connected social accounts. Each account is a "channel." Check the ones you want to post to:

- Your Instagram Business account
- Your Facebook Page
- Your X profile
- Your LinkedIn Page
- Your TikTok account
- Any other connected accounts

Select as many or as few as you like. You need at least one channel selected to publish.

### Step 3: Review Platform Formatting

Before publishing, Atlas shows you how the post will look on each selected platform. Pay attention to:

- **Text length** -- Your full caption works on Facebook and LinkedIn, but might be truncated on X (280 characters). Atlas will warn you if your text exceeds a platform's limit.
- **Media format** -- An image post works everywhere, but a video post might need specific dimensions for TikTok vs. YouTube. Atlas handles the resizing.
- **Hashtags** -- Hashtags perform differently across platforms. Instagram loves them; LinkedIn uses fewer. Atlas can adjust hashtag strategy per platform.

### Step 4: Publish or Schedule

Click **Broadcast Now** to publish to all selected channels immediately, or **Schedule Broadcast** to pick a date and time. All channels receive the post at the same time.

## Platform-Specific Customization

Sometimes you want the same general message but with slight tweaks for each platform. Broadcasting supports this:

### Per-Platform Text Overrides

After selecting your channels, click the edit icon next to any platform to customize the text just for that channel. For example:

- **Instagram:** Add more hashtags and a casual tone
- **LinkedIn:** Use a more professional tone, mention certifications
- **X:** Shorten to a punchy one-liner with a link
- **Reddit:** Add context for the subreddit audience

The base post stays the same, but each platform gets its own version.

### Per-Platform Media

If you want different media on different platforms (for example, a vertical video for TikTok and a square image for Instagram), you can override the media per channel. This is optional -- by default, Atlas uses the same media everywhere, resized appropriately.

## Delivery Tracking

After broadcasting, Atlas tracks the delivery status for each channel:

| Status     | Meaning                                           |
|------------|---------------------------------------------------|
| Delivered  | Post is live on the platform                      |
| Pending    | Still uploading or processing                     |
| Failed     | Something went wrong (check the error message)    |
| Retrying   | Atlas is automatically retrying after a failure   |

View delivery results in **Social Media > Published**. Each broadcast shows a summary card with the status of every channel.

### How Atlas Handles Failures

Atlas UX uses a three-tier delivery system to maximize reliability:

1. **Direct API** -- Posts directly to the platform's API if you've connected via OAuth
2. **Postiz integration** -- Falls back to Postiz for platforms connected through Postiz
3. **Retry queue** -- If both fail, the post is queued for automatic retry

If a post fails on one platform, the others are unaffected. You'll get a notification about the failure and can retry manually or let Atlas handle it.

Each delivery attempt is logged with a fault code so you can see exactly what happened. Common failure reasons:

- **Token expired** -- Your account connection needs refreshing (see [Connecting Social Accounts](connecting-social-accounts.md))
- **Media too large** -- Reduce file size or let Atlas auto-compress
- **Content policy** -- The platform flagged something in your post; edit and retry
- **Rate limit** -- You've posted too frequently; wait and retry later

## Best Practices for Broadcasting

**Don't post the exact same content everywhere every time.** While broadcasting is convenient, audiences on different platforms expect different styles. Use per-platform overrides to make each version feel native.

**Stagger when it makes sense.** For big announcements (new service, special offer), posting everywhere at once makes sense. For daily content, consider scheduling different posts for different platforms throughout the day.

**Watch your limits.** Atlas UX enforces a daily posting cap to protect your accounts. Broadcasting to 5 platforms counts as 5 posts against your daily limit. Plan accordingly.

**Start with 2-3 platforms.** If you're new to social media, don't try to maintain a presence on 10 platforms at once. Pick the 2-3 where your customers actually hang out (usually Facebook, Instagram, and one other) and broadcast to those.

## Common Questions

**Can I broadcast to platforms I haven't connected?**
No. You need to connect each platform first in **Settings > Integrations**. See [Connecting Social Accounts](connecting-social-accounts.md).

**What if my post has a video but I selected Instagram (image post)?**
Atlas adapts. If you selected Instagram and attached a video, it posts as a Reel. If you attached images, it posts as a feed image. Platform formatting is handled automatically.

**Can I see analytics for each platform after broadcasting?**
Yes. Your published post history shows engagement metrics per platform once the platforms report them back (usually within a few hours).

**How is broadcasting different from creating separate posts?**
Broadcasting starts with one piece of content and sends it to many places. Creating separate posts gives you full control over each one independently. Broadcasting is faster; separate posts are more customizable. Use whichever fits the situation.

## What's Next?

- Get started with [Creating Posts](creating-posts.md)
- Make sure your media meets the [Requirements](media-requirements.md)
- Review and polish content in [Editing Drafts](editing-drafts.md)
- Keep your phone covered too -- learn about [Missed Call Handling](../phone-sms/missed-call-handling.md)


---
## Media

> **Tags:** `postiz` · `social-media` · `scheduling` · `publishing` · `analytics` · `open-source`

### Official Resources
- [Official Documentation](https://docs.postiz.com)
- [Postiz Documentation](https://docs.postiz.com)

### Video Tutorials
- [Postiz Social Media Management Tutorial](https://www.youtube.com/results?search_query=postiz+social+media+management+tutorial) — *Credit: Postiz on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
