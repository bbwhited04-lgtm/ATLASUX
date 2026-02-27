# File Management

File Management lets you upload, organize, download, and delete files stored in your cloud storage (Supabase). Files are organized by tenant and accessible to your AI agents.

## Opening File Management

Go to **Settings > Files** tab, or access it directly within the Settings page.

## Viewing Files

The file browser shows all files stored under your current tenant. Each file displays:

- **File name** -- The original file name
- **Type icon** -- Visual indicator based on file type (document, image, video, code)
- **Size** -- File size in a readable format (KB, MB)
- **Last updated** -- How long ago the file was modified

### View Modes

Toggle between two view modes using the buttons in the top right:
- **Grid view** -- Files displayed as cards in a grid
- **List view** -- Files displayed as rows in a compact list

### Searching

Use the search bar to filter files by name. Results update as you type.

## Uploading Files

1. Click the **Upload** button (or the upload icon).
2. A file picker will open. Select one or more files from your computer.
3. The upload begins immediately. A progress indicator shows the upload status.
4. Once complete, the file appears in your file list.

Files are stored in the Supabase `kb_uploads` bucket under the path `tenants/{your-tenant-id}/`.

### Supported File Types

You can upload any file type. Common types are automatically categorized:

| Category | File Types |
|----------|-----------|
| **Documents** | PDF, DOC, DOCX, TXT, RTF |
| **Images** | PNG, JPG, JPEG, GIF, SVG, WebP |
| **Videos** | MP4, MOV, AVI, WebM |
| **Code** | JS, TS, PY, JSON, YAML, HTML, CSS, SQL, MD |

## Downloading Files

1. Click on a file in the list.
2. Click the **Download** button.
3. The system generates a signed URL that is valid for a limited time.
4. The file will download to your computer.

Signed URLs provide secure, time-limited access to files without exposing your storage credentials.

## Deleting Files

1. Find the file you want to remove.
2. Click the **Delete** (trash) button.
3. Confirm the deletion.

Deleted files are permanently removed from storage and cannot be recovered.

## Starring Files

Click the star icon on a file to mark it as a favorite. Starred files can be quickly found using the filter options.

## Storage Settings

Below the file browser, you will find storage settings:

| Setting | Description |
|---------|------------|
| **Auto Sync** | Automatically sync files across devices |
| **Mobile Access** | Allow file access from the mobile companion app |
| **Auto Backup** | Automatically back up files |
| **Notifications** | Get notified about file changes |
| **Low Power Mode** | Reduce sync frequency to save battery |
| **Cloud Storage** | Enable/disable cloud storage integration |

Toggle these settings on or off based on your preferences.

## How Agents Use Files

AI agents can reference files stored in your tenant's storage when performing tasks. For example:
- The Blog agent can use uploaded images as featured images.
- The Knowledge Base can link to PDF documents.
- The social media team can use uploaded graphics for posts.

## Tips

- Keep files organized by using descriptive file names.
- Upload images you plan to use in blog posts or social media ahead of time.
- Use signed URLs when sharing files externally -- they expire automatically for security.
- All file operations are logged in the audit trail.

## Related Guides

- [Knowledge Base](./knowledge-base.md) -- Reference uploaded documents in KB articles
- [Blog Studio](./blog-studio.md) -- Use uploaded images as featured images
- [Settings](./settings.md) -- File Management lives within the Settings page
