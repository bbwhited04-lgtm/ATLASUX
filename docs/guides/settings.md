# Settings

The Settings page lets you configure integrations, manage your profile, handle file storage, view audit logs, and customize notification preferences.

## Accessing Settings

Navigate to **Settings** from the sidebar, or use the route: `#/app/settings`.

The Settings page uses a tabbed interface with the following sections.

---

## Profile

The Profile tab displays your account information and lets you update:

- **Display Name** -- how you appear across the platform
- **Avatar URL** -- link to your profile image
- **Email** -- read-only (managed by Supabase Auth)

Changes are saved via `PATCH /v1/me`.

---

## Integrations

The Integrations tab shows all available platform connections and their status. Integrations are grouped into three categories:

### OAuth Providers

Connect third-party services using OAuth:

| Provider   | Scopes Available                                              |
|------------|---------------------------------------------------------------|
| Google     | Gmail, Calendar, Drive, YouTube, Business Profile             |
| Microsoft  | Teams, Outlook, OneDrive, SharePoint                          |
| Meta       | Facebook Pages, Instagram, Ads Manager                        |
| X (Twitter)| Tweet read/write, user profile                                |
| Reddit     | Submit, read, identity                                        |
| Pinterest  | Pins, boards, ads                                             |
| LinkedIn   | Profile, posts, company pages                                 |
| Tumblr     | Blog read/write                                               |

Click **Connect** to start the OAuth flow. After authorization, you are redirected back with a success indicator.

### API Key Providers

For services that use API keys instead of OAuth:

- **OpenAI** -- GPT model access
- **DeepSeek** -- Alternative AI provider
- **Stripe** -- Payment processing
- **Twilio** -- SMS messaging

### Internal Services

- **Supabase** -- Database and storage (configured at the infrastructure level)

---

## Telegram

Configure your Telegram bot connection:

1. Enter your **Chat ID** (obtained from the BotFather bot).
2. Click **Save** to link your Telegram account.
3. Test the connection by sending a message through the Messaging Hub.

---

## Notifications

Configure how and when you receive notifications:

- **Email notifications** -- agent action summaries, approval requests
- **Telegram alerts** -- real-time agent notifications
- **Desktop notifications** -- browser or desktop app push notifications

---

## API Keys

View and manage API keys for programmatic access to Atlas UX:

- Generate new API keys for external integrations
- Revoke existing keys
- View key usage statistics

---

## Audit Log

The Settings page provides a view into the audit trail:

- Filter by action type, entity, or date range
- View detailed metadata for each entry
- Export audit logs for compliance

---

## Theme

Atlas UX uses a dark theme throughout. The design system uses:

- **Background**: `bg-slate-900/50` with `backdrop-blur-xl`
- **Borders**: `border-cyan-500/20`
- **Headings**: White or cyan gradient text
- **Body text**: `text-slate-400`
- **Accent color**: Cyan (`text-cyan-400`, `bg-cyan-500`)

The theme is not user-configurable in the current Alpha release.

---

## File Management

Upload and manage files from the Settings page. Files are stored in Supabase Storage under your tenant's path. See the [File Storage guide](./file-storage.md) for details.

---

## Account Actions

- **Switch Tenant** -- change your active organization
- **Pair Mobile** -- generate a QR code to pair your phone
- **Sign Out** -- end your session
