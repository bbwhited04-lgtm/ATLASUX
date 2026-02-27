# Knowledge Base

The Knowledge Base (KB) is where you store documents that your AI agents can reference when performing tasks. Think of it as your company's shared brain -- agents consult KB articles to stay informed and produce better results.

## Opening the Knowledge Base

Click **Knowledge Base** in the sidebar or navigate to `/app/kb`.

## Understanding KB Documents

Each KB document has:

- **Title** -- A descriptive name
- **Slug** -- A URL-friendly identifier (auto-generated from the title if not set)
- **Status** -- Draft, published, or archived
- **Tags** -- Keywords for categorization and search
- **Body** -- The full content of the document

Only published documents are available to agents. Drafts are only visible in the editor.

## Browsing Documents

The left panel shows a searchable list of all KB documents. Each item displays:
- Title
- Status badge (draft, published, archived)
- Tags
- Last updated date

### Searching

Type in the search bar to filter documents by title or content. Results update as you type.

## Creating a New Document

1. Clear the editor by clicking **New Document** (or clear the current selection).
2. Fill in the fields:
   - **Title** -- Give the document a clear, descriptive name
   - **Slug** -- Optional. A URL-friendly ID will be auto-generated if left blank
   - **Status** -- Choose "draft" to save privately, or "published" to make it available to agents
   - **Tags** -- Enter comma-separated keywords (e.g., "marketing, social media, strategy")
   - **Body** -- Write the full document content
3. Click **Create**.

A success notification will confirm the document was saved.

## Editing a Document

1. Click on a document in the left panel to load it into the editor.
2. Make your changes to the title, status, tags, or body.
3. Click **Save** to update the document.

## Archiving a Document

To archive a document, open it in the editor, change the status dropdown to "archived", and save. Archived documents are hidden from agent access but preserved for reference.

## Deleting a Document

Click the **Delete** button while viewing a document to permanently remove it. This action cannot be undone.

## Role-Based Access

Editing KB documents requires one of these roles: CEO, CRO, CAS, or CSS. If your account does not have one of these roles, you will be able to browse documents but not create or modify them.

## How Agents Use the Knowledge Base

When agents run workflows or respond to prompts, they can query the KB for relevant information. For example:
- A social media agent might check KB articles about brand voice guidelines before writing a post.
- A customer support agent might reference product documentation to answer a question.

The more complete and up-to-date your KB is, the better your agents will perform.

## Tips

- Use consistent tags across documents to make search more effective.
- Keep documents focused -- one topic per article works better than long, multi-topic pages.
- Review and update documents regularly to keep agent knowledge current.
- Start with documents about your brand voice, product details, and company policies.

## Related Guides

- [Agents Hub](./agents-hub.md) -- See which agents can access KB content
- [File Management](./file-management.md) -- Upload supporting files alongside KB documents
- [Chat Interface](./chat-interface.md) -- Agents use KB content when responding to your questions
