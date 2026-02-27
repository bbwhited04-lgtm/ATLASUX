# OAuth Routes API

Atlas UX supports OAuth integrations with multiple providers. Each provider follows the standard authorize-redirect-callback pattern. Tokens are stored in the `token_vault` table, and integration status is tracked in the `integration` table.

## Base URL

```
/v1/oauth
```

---

## Supported Providers

| Provider   | OAuth Type    | Start Endpoint                   | Callback Endpoint                   |
|------------|---------------|----------------------------------|-------------------------------------|
| Google     | OAuth 2.0     | `GET /v1/oauth/google/start`     | `GET /v1/oauth/google/callback`     |
| Meta       | OAuth 2.0     | `GET /v1/oauth/meta/start`       | `GET /v1/oauth/meta/callback`       |
| X (Twitter)| OAuth 2.0 PKCE| `GET /v1/oauth/x/start`          | `GET /v1/oauth/x/callback`          |
| Microsoft  | OAuth 2.0     | `GET /v1/oauth/microsoft/start`  | `GET /v1/oauth/microsoft/callback`  |
| Reddit     | OAuth 2.0     | `GET /v1/oauth/reddit/start`     | `GET /v1/oauth/reddit/callback`     |
| Pinterest  | OAuth 2.0     | `GET /v1/oauth/pinterest/start`  | `GET /v1/oauth/pinterest/callback`  |
| LinkedIn   | OAuth 2.0     | `GET /v1/oauth/linkedin/start`   | `GET /v1/oauth/linkedin/callback`   |
| Tumblr     | OAuth 1.0a    | `GET /v1/oauth/tumblr/start`     | `GET /v1/oauth/tumblr/callback`     |

---

## Authorization Flow

### 1. Start the Flow

Redirect the user to the provider's start endpoint with tenant and user context:

```
GET /v1/oauth/google/start?org_id=demo-org&user_id=usr_abc
```

**Query Parameters:**

| Param     | Aliases                 | Description              |
|-----------|-------------------------|--------------------------|
| `org_id`  | `orgId`, `tenantId`     | Tenant slug or ID        |
| `user_id` | `userId`                | Current user ID          |

### 2. Provider Authorization

The backend redirects the user to the provider's authorization page with the configured scopes and a CSRF nonce embedded in the state parameter.

### 3. Callback

After the user authorizes, the provider redirects back. The backend:

1. Verifies the CSRF nonce against the database-backed `oauth_state` table.
2. Exchanges the authorization code for tokens.
3. Stores the tokens in `token_vault`.
4. Marks the integration as connected in the `integration` table.
5. Redirects back to the frontend settings page.

**Success redirect:**

```
https://atlasux.cloud#/app/settings?tab=integrations&connected=google&org_id=demo-org
```

**Error redirect:**

```
https://atlasux.cloud#/app/settings?tab=integrations&oauth_error=access_denied
```

---

## Requested Scopes by Provider

**Google:**
```
openid, email, profile, youtube.readonly,
business.manage, calendar.readonly, drive.readonly, gmail.readonly
```

**Meta:**
```
pages_read_engagement, pages_manage_posts,
instagram_basic, instagram_content_publish, ads_read, business_management
```

**X (Twitter):**
```
tweet.read, tweet.write, users.read, offline.access
```

---

## Security

- **CSRF protection**: A random nonce is generated for each flow and stored in the `oauth_state` database table. The nonce is verified on callback before any token exchange.
- **PKCE**: X (Twitter) uses OAuth 2.0 with PKCE (code challenge and code verifier pair).
- **State expiry**: OAuth state entries are pruned every 5 minutes to remove stale data.
- **Stub flows**: If credentials are not configured for a provider, the start endpoint redirects back with an `oauth_not_configured` error rather than failing silently.

---

## Token Storage

Tokens are persisted in the `token_vault` table:

| Column          | Description                          |
|-----------------|--------------------------------------|
| `org_id`        | Tenant identifier                    |
| `user_id`       | User identifier                      |
| `provider`      | Provider name (google, meta, x, etc.)|
| `access_token`  | OAuth access token                   |
| `refresh_token` | Refresh token (when available)       |
| `expires_at`    | Token expiration timestamp           |
| `scope`         | Granted scopes                       |
| `meta`          | Additional metadata (token_type)     |

---

## Environment Variables

| Variable              | Description                     |
|-----------------------|---------------------------------|
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID          |
| `GOOGLE_CLIENT_SECRET`| Google OAuth client secret      |
| `META_APP_ID`         | Meta (Facebook) app ID          |
| `META_APP_SECRET`     | Meta app secret                 |
| `X_CLIENT_ID`         | X (Twitter) OAuth client ID     |
| `X_CLIENT_SECRET`     | X OAuth client secret           |
| `MS_CLIENT_ID`        | Microsoft OAuth client ID       |
| `MS_CLIENT_SECRET`    | Microsoft OAuth client secret   |
| `MS_TENANT_ID`        | Microsoft Azure AD tenant ID    |
| `REDDIT_CLIENT_ID`    | Reddit OAuth client ID          |
| `REDDIT_CLIENT_SECRET`| Reddit OAuth client secret      |
| `FRONTEND_URL`        | Frontend URL for redirect URIs  |

---

## Verification Status

Some providers require additional verification before the OAuth flow works in production:

- **Google Cloud**: Requires a YouTube video demo for OAuth consent screen verification.
- **Meta**: Permission approval in progress.
- **Apple**: Developer app submitted, awaiting approval.
- **TikTok**: Requires similar video verification.
