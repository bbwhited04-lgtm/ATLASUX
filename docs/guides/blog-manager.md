# Blog Manager

The Blog Manager is a two-pane editor for creating, editing, and publishing blog posts directly within Atlas UX. It lives inside the Business Manager and provides a streamlined writing experience with AI-assisted content generation.

## Layout

The Blog Manager uses a split-pane layout:

- **Left pane (55%)** -- Compose area with title, body editor, and publishing controls.
- **Right pane (45%)** -- Post list showing all existing posts with status, date, and quick actions.

This layout lets you write new content while referencing existing posts side-by-side.

## Creating a New Post

1. Navigate to **Business Manager** and select a business entity.
2. Click the **Blog** tab or use the direct route: `#/app/business/:id/blog`.
3. In the left pane, enter your post title and body content.
4. The body editor supports Markdown formatting.
5. Click **Save Draft** to save without publishing, or **Publish** to make the post live.

## Post Fields

| Field      | Description                                      |
|------------|--------------------------------------------------|
| Title      | The post headline (required)                     |
| Slug       | URL-safe identifier (auto-generated from title)  |
| Body       | Post content, supports Markdown                  |
| Status     | `draft`, `published`, or `archived`              |
| Tags       | Categorization tags for the post                 |
| Author     | Defaults to the current user or agent            |

## Editing Existing Posts

Click any post in the right-pane list to load it into the compose area. The title, body, and status fields populate automatically. Make your changes and click **Save** to update.

## AI-Assisted Content

Atlas UX agents (particularly Sunday, the comms/tech doc writer, and Reynolds, the blog specialist) can draft blog content on your behalf. When an agent creates a blog post via the engine:

1. The post appears in your Blog Manager with `draft` status.
2. You review and edit the content.
3. Approve and publish when satisfied.

This human-in-the-loop workflow ensures quality while leveraging AI for first drafts.

## Post Status Lifecycle

```
draft --> published --> archived
```

- **Draft**: Work in progress. Not visible to the public.
- **Published**: Live and accessible.
- **Archived**: Removed from public view but retained in the system.

## Keyboard Shortcuts

| Shortcut          | Action              |
|-------------------|---------------------|
| `Ctrl/Cmd + S`    | Save current post   |
| `Ctrl/Cmd + Enter`| Publish post        |

## API Integration

The Blog Manager interacts with the backend via:

- `GET /v1/blog/posts` -- list posts for the tenant
- `POST /v1/blog/posts` -- create a new post
- `PATCH /v1/blog/posts/:id` -- update a post
- `DELETE /v1/blog/posts/:id` -- delete a post

All requests require the `x-tenant-id` header and use the `useActiveTenant()` hook for tenant context.

## Tips

- Use the right pane to quickly scan your existing content before writing something new.
- Draft posts regularly -- the Blog Manager auto-saves are not yet implemented, so save manually.
- Tags help agents find and reference your content in the Knowledge Base.
- Published posts can be distributed to social channels via the publishing agents (Kelly, Fran, Dwight, etc.).
