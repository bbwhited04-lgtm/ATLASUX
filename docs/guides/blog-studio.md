# Blog Studio

The Blog Studio lets you write, edit, and publish blog posts directly from Atlas UX. It is embedded within the Business Manager.

## Opening Blog Studio

Navigate to **Business Manager** and click the **Blog** tab. You can also go directly to `/app/business-manager?tab=blog`.

## Layout

The Blog Studio uses a two-pane layout:

- **Left pane (55%)** -- The compose/edit area where you write your post
- **Right pane (45%)** -- A list of existing posts with status badges

## Writing a New Post

1. In the left pane, fill in the following fields:
   - **Title** -- The headline of your post
   - **Category** -- Select from: Updates, Announcements, Case Studies, Governance, Tech, Marketing, Business, or Other
   - **Excerpt** -- A short summary that appears in post listings
   - **Featured Image URL** -- Paste a URL for the hero image (optional)
   - **Body** -- The full content of your post. Markdown formatting is supported.
2. Check the **Publish immediately** toggle if you want the post to go live right away.
3. Click **Create Post**.

A success message will confirm that your post was created.

## Editing an Existing Post

1. In the right pane, click on any post to load it into the editor.
2. The left pane will populate with the post's current title, category, excerpt, body, and image.
3. Make your changes.
4. Click **Save Changes** to update the post.

## Deleting a Post

1. Click the **trash icon** on a post card in the right pane.
2. The post will be removed immediately.

## Post Statuses

Each post card shows a status badge:

| Status | Meaning |
|--------|---------|
| **Published** | Live and visible to readers |
| **Draft** | Saved but not yet published |

## Featured Images

To add a featured image:

1. Paste a direct image URL into the "Featured Image URL" field (e.g., from Unsplash, your file storage, or any public URL).
2. The image will appear as the hero/banner image on the published post.

You can also upload images to the [File Management](./file-management.md) system and use the signed URL.

## Viewing Published Posts

Published posts are visible on your public blog at `/blog`. Each post has its own page at `/blog/{slug}`, where the slug is auto-generated from the title.

## Categories

Posts can be organized by category. Readers can browse posts by category on the public blog at `/blog/category/{category-name}`.

## Tips

- Use markdown in the body field for rich formatting: headings, bold, italic, lists, code blocks, and links.
- Keep excerpts under two sentences for the best display in listings.
- You can ask an AI agent in the Chat Interface to draft a blog post, then paste the content here.

## Related Guides

- [Business Manager](./business-manager.md) -- The parent view that contains Blog Studio
- [File Management](./file-management.md) -- Upload and manage images for blog posts
- [Chat Interface](./chat-interface.md) -- Ask agents to help write content
