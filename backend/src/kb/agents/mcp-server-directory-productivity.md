# MCP Servers for Productivity & Communication

## Overview

Productivity MCP servers connect AI agents to the tools teams use for communication, scheduling, documentation, and project tracking. These integrations turn AI from a standalone assistant into an embedded team member that can read messages, schedule meetings, update documentation, and manage tasks across your entire productivity stack.

For trade businesses using Atlas UX, these integrations mean Lucy can check calendars before booking appointments, send Slack notifications to the team, and update project boards — all without human intervention.

## Slack MCP Server

**What it does:** Full read-write access to Slack workspaces — search messages, send messages, read channels and threads, manage canvases, and look up user profiles.

**Key tools exposed:**
- `slack_send_message` / `slack_send_message_draft` — post messages to channels
- `slack_schedule_message` — schedule messages for later delivery
- `slack_read_channel` / `slack_read_thread` — read conversation history
- `slack_search_public` / `slack_search_public_and_private` — search across messages
- `slack_search_channels` / `slack_search_users` — find channels and people
- `slack_create_canvas` / `slack_read_canvas` / `slack_update_canvas` — canvas management
- `slack_read_user_profile` — user information lookup

**Permissions needed:** Bot token with scopes: `channels:history`, `channels:read`, `chat:write`, `search:read`, `users:read`, `canvases:write` (plus `groups:history` and `groups:read` for private channels).

**Setup:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/slack-mcp-server"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token",
        "SLACK_TEAM_ID": "T01234567"
      }
    }
  }
}
```

**Use case:** Atlas UX uses Slack notifications to alert trade business owners when Lucy books an appointment or takes a message. With the MCP server, AI agents can also search past conversations for context, post status updates, and draft messages for review before sending.

## Gmail MCP Server

**What it does:** Read, search, and compose emails through Gmail. Supports message reading, thread navigation, label management, and draft creation.

**Key tools exposed:**
- `gmail_search_messages` — search emails with Gmail query syntax
- `gmail_read_message` / `gmail_read_thread` — read specific messages or full threads
- `gmail_create_draft` — compose email drafts (does not send directly)
- `gmail_list_drafts` — view existing drafts
- `gmail_list_labels` — enumerate email labels
- `gmail_get_profile` — account information

**Permissions needed:** Google OAuth2 with Gmail API scopes. The server creates drafts rather than sending directly — a deliberate safety choice that keeps humans in the loop.

**Setup:**
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@anthropic/gmail-mcp-server"],
      "env": {
        "GOOGLE_CLIENT_ID": "<your-client-id>",
        "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
      }
    }
  }
}
```

**Use case:** Customer support workflows. The AI agent searches for a customer's email history, reads the full thread for context, then drafts a response for human review. For Atlas UX, each named agent (Atlas, Binky, etc.) has its own email account, and Gmail MCP enables automated email triage and draft composition.

## Google Calendar MCP Server

**What it does:** Calendar management — view events, find free time, create and modify events, and manage RSVPs across multiple calendars.

**Key tools exposed:**
- `gcal_list_events` — view upcoming events with filters
- `gcal_create_event` — schedule new events with attendees
- `gcal_update_event` / `gcal_delete_event` — modify or cancel events
- `gcal_find_my_free_time` — identify available time slots
- `gcal_find_meeting_times` — find times that work for multiple people
- `gcal_respond_to_event` — accept, decline, or tentatively accept invitations
- `gcal_list_calendars` — enumerate available calendars

**Permissions needed:** Google OAuth2 with Calendar API scopes for read and write access.

**Setup:**
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@anthropic/google-calendar-mcp-server"],
      "env": {
        "GOOGLE_CLIENT_ID": "<your-client-id>",
        "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
      }
    }
  }
}
```

**Use case:** Critical for Lucy's appointment booking workflow. When a caller requests an appointment, Lucy can check the business owner's actual calendar availability, find the next open slot, create the event, and send the calendar invite — all within the phone call.

## Notion MCP Server

**What it does:** Full access to Notion workspaces — search pages, query databases, create and update content, manage views, and handle comments.

**Key tools exposed:**
- `notion-search` — search across all pages and databases
- `notion-create-pages` / `notion-update-page` — page management
- `notion-create-database` / `notion-query-database-view` — database operations
- `notion-create-comment` / `notion-get-comments` — comment threads
- `notion-create-view` / `notion-update-view` — database view management
- `notion-fetch` — retrieve specific pages or blocks
- `notion-get-users` / `notion-get-teams` — workspace member lookup
- `notion-query-meeting-notes` — find meeting documentation

**Permissions needed:** Notion integration token with access to the relevant pages and databases.

**Setup:**
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic/notion-mcp-server"],
      "env": {
        "NOTION_API_TOKEN": "ntn_your-integration-token"
      }
    }
  }
}
```

**Use case:** Knowledge management and documentation. An AI agent can search Notion for existing documentation before answering questions, create new pages from meeting notes, update project databases with status changes, and maintain a living wiki that stays current with team activity.

## Obsidian MCP Server

**What it does:** Access to Obsidian vaults — the local-first, markdown-based knowledge management system. Read, create, and search notes within vaults.

**Key tools exposed:**
- `search_notes` — full-text search across vault
- `read_note` — read specific note contents
- `create_note` / `update_note` — note management
- `list_notes` — enumerate vault contents
- `get_tags` — tag-based organization

**Setup:**
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/vault"
      }
    }
  }
}
```

**Use case:** Personal knowledge retrieval. During research or writing sessions, the AI can search your Obsidian vault for related notes, surface connections you might have missed, and create new notes that link back to existing knowledge — maintaining the bidirectional linking that makes Obsidian powerful.

## Google Drive MCP Server

**What it does:** File management and search across Google Drive — read documents, search files, and manage folders.

**Key tools exposed:**
- `search_files` — find files by name, type, or content
- `read_file` — retrieve file contents
- `list_files` — enumerate directory contents
- `create_file` / `update_file` — file management

**Permissions needed:** Google OAuth2 with Drive API scopes.

**Setup:**
```json
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"],
      "env": {
        "GOOGLE_CLIENT_ID": "<your-client-id>",
        "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
      }
    }
  }
}
```

**Use case:** Document retrieval and reference. The AI can search Drive for relevant documents, read their contents for context, and help synthesize information across multiple files without manual copy-pasting.

## Todoist MCP Server

**What it does:** Task management through Todoist — create, update, complete, and organize tasks and projects.

**Key tools exposed:**
- `create_task` / `update_task` / `complete_task` — task lifecycle
- `list_tasks` — view tasks with filters
- `create_project` / `list_projects` — project management
- `add_comment` — task comments and context

**Setup:**
```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["-y", "mcp-todoist"],
      "env": {
        "TODOIST_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Action item capture. During planning conversations, the AI can create tasks directly in Todoist with due dates, priorities, and project assignments — ensuring nothing discussed falls through the cracks.

## Jira MCP Server

**What it does:** Atlassian Jira integration for enterprise project tracking — manage issues, sprints, boards, and workflows.

**Key tools exposed:**
- `create_issue` / `update_issue` — issue management
- `search_issues` — JQL-powered issue search
- `get_issue` — detailed issue retrieval
- `transition_issue` — move issues through workflows
- `add_comment` — issue comments
- `list_projects` — project enumeration

**Setup:**
```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "mcp-jira"],
      "env": {
        "JIRA_URL": "https://your-org.atlassian.net",
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

**Use case:** Sprint management and issue tracking. The AI can search for related tickets during debugging, create new issues from bug reports, update ticket status as work progresses, and provide sprint summaries by querying across all active issues.

## Confluence MCP Server

**What it does:** Atlassian Confluence wiki access — search, read, and create documentation pages within Confluence spaces.

**Key tools exposed:**
- `search_content` — search across all Confluence spaces
- `get_page` / `get_page_children` — page retrieval and navigation
- `create_page` / `update_page` — content creation and editing
- `list_spaces` — space enumeration

**Setup:**
```json
{
  "mcpServers": {
    "confluence": {
      "command": "npx",
      "args": ["-y", "mcp-confluence"],
      "env": {
        "CONFLUENCE_URL": "https://your-org.atlassian.net/wiki",
        "CONFLUENCE_EMAIL": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

**Use case:** Documentation maintenance. The AI can search Confluence for outdated documentation, update pages after system changes, and create new documentation from conversation context — keeping team knowledge current without manual wiki editing.

## Recommendations for Trade Businesses

For trade businesses using Atlas UX, the highest-impact productivity MCP servers are:

1. **Google Calendar** — essential for Lucy's appointment booking
2. **Slack** — team notifications when calls come in
3. **Gmail** — email follow-ups and customer communication
4. **Todoist or Notion** — tracking customer requests and follow-up tasks

Start with calendar and messaging, then expand to documentation and project management as the team grows.

## Resources

- https://developers.google.com/workspace — Google Workspace APIs documentation (Calendar, Gmail, Drive)
- https://api.slack.com/docs — Slack API documentation and bot setup guides
- https://developers.notion.com/ — Notion API reference for integration development

## Image References

1. Productivity tool ecosystem connected through MCP servers — search: "productivity tools integration AI agent ecosystem"
2. Calendar booking workflow with AI assistant checking availability — search: "AI calendar booking appointment workflow diagram"
3. Slack bot architecture receiving and sending messages — search: "Slack bot message flow architecture diagram"
4. Notion database connected to AI agent for knowledge management — search: "Notion database AI integration knowledge management"
5. Multi-tool productivity dashboard with unified AI access — search: "unified productivity dashboard AI assistant tools"

## Video References

1. https://www.youtube.com/watch?v=gCMKssc3vF4 — "Connect AI to Your Productivity Stack with MCP Servers"
2. https://www.youtube.com/watch?v=E5in0kBL7AI — "Google Calendar + Slack + Gmail: MCP Server Integration Tutorial"
