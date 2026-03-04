/**
 * Slack Web API service for inter-agent communication.
 *
 * Uses SLACK_BOT_TOKEN with chat:write.customize so each agent
 * posts with its own display name and emoji avatar.
 * Agents hang out in Slack channels, chat when idle, and
 * every message is recorded in Slack's history.
 *
 * Capabilities:
 *   - Channel messaging (send, read, reply in threads)
 *   - DMs between agents (private channels named dm-{agent1}-{agent2})
 *   - File upload/download/list (share docs, reports, code)
 *   - Workflow creation (automated multi-step Slack workflows)
 */

const SLACK_API = "https://slack.com/api";

// ── Agent display identity (name → emoji avatar) ────────────────────────────

const AGENT_AVATARS: Record<string, string> = {
  chairman: "https://i.imgur.com/7Kq8gZ8.png", // crown
  atlas:    "https://i.imgur.com/5vN8hQK.png", // globe
  binky:    "https://i.imgur.com/3fKj9sL.png", // magnifying glass
  tina:     "https://i.imgur.com/4rM2hPq.png", // chart
  larry:    "https://i.imgur.com/8bQ3vTw.png", // scales
  jenny:    "https://i.imgur.com/6dH4kRm.png", // gavel
  benny:    "https://i.imgur.com/2nP5tYx.png", // shield
  cheryl:   "https://i.imgur.com/9cS6wKf.png", // headset
  sunday:   "https://i.imgur.com/1aV7jEn.png", // pen
  mercer:   "https://i.imgur.com/0bW8iDo.png", // handshake
  petra:    "https://i.imgur.com/3cX9kFp.png", // clipboard
  lucy:     "https://i.imgur.com/4dY0lGq.png", // telephone
  vision:   "https://i.imgur.com/5eZ1mHr.png", // eye
};

const AGENT_EMOJI: Record<string, string> = {
  chairman: ":crown:",
  atlas:    ":earth_americas:",
  binky:    ":mag:",
  tina:     ":chart_with_upwards_trend:",
  larry:    ":scales:",
  jenny:    ":classical_building:",
  benny:    ":shield:",
  cheryl:   ":headphones:",
  sunday:   ":lower_left_fountain_pen:",
  mercer:   ":handshake:",
  petra:    ":clipboard:",
  lucy:     ":telephone_receiver:",
  kelly:    ":bird:",
  donna:    ":speech_balloon:",
  fran:     ":blue_book:",
  link:     ":briefcase:",
  timmy:    ":clapper:",
  terry:    ":art:",
  reynolds: ":newspaper:",
  cornwall: ":pushpin:",
  dwight:   ":thread:",
  emma:     ":busts_in_silhouette:",
  venny:    ":camera:",
  victor:   ":movie_camera:",
  frank:    ":bar_chart:",
  sandy:    ":calendar:",
  claire:   ":date:",
  archy:    ":books:",
  penny:    ":moneybag:",
  "daily-intel": ":satellite:",
  vision:   ":eyes:",
};

function getAgentDisplayName(agentId: string): string {
  const names: Record<string, string> = {
    chairman: "Chairman",
    atlas: "Atlas (President)",
    binky: "Binky (CRO)",
    tina: "Tina (CFO)",
    larry: "Larry (Secretary)",
    jenny: "Jenny (Counsel)",
    benny: "Benny (IP)",
    cheryl: "Cheryl (Support)",
    sunday: "Sunday (Comms)",
    mercer: "Mercer (Acquisition)",
    petra: "Petra (PM)",
    lucy: "Lucy (Reception)",
    kelly: "Kelly (X/Twitter)",
    donna: "Donna (Reddit)",
    fran: "Fran (Facebook)",
    link: "Link (LinkedIn)",
    timmy: "Timmy (TikTok)",
    terry: "Terry (Tumblr)",
    reynolds: "Reynolds (Blog)",
    cornwall: "Cornwall (Pinterest)",
    dwight: "Dwight (Threads)",
    emma: "Emma (Alignable)",
    venny: "Venny (Visual)",
    victor: "Victor (Video)",
    frank: "Frank (Forms)",
    sandy: "Sandy (Bookings)",
    claire: "Claire (Calendar)",
    archy: "Archy (Research)",
    penny: "Penny (Ads)",
    "daily-intel": "Daily-Intel (Briefing)",
    vision: "Vision (Browser)",
  };
  return names[agentId] ?? agentId;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type SlackMessage = {
  ts: string;
  user: string;
  text: string;
  thread_ts?: string;
  bot_id?: string;
  username?: string;
};

export type SlackChannel = {
  id: string;
  name: string;
  is_member: boolean;
  topic?: string;
  purpose?: string;
  num_members?: number;
};

export type SlackPostResult = {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
};

export type SlackFile = {
  id: string;
  name: string;
  title: string;
  mimetype: string;
  size: number;
  url_private: string;
  permalink: string;
  created: number;
  user?: string;
};

export type SlackWorkflowStep = {
  action: "send_message" | "upload_file" | "set_topic" | "add_reaction" | "wait";
  channel?: string;
  agentId?: string;
  text?: string;
  filename?: string;
  content?: string;
  emoji?: string;
  delayMs?: number;
};

// ── Core API helper ─────────────────────────────────────────────────────────

function getBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not configured");
  return token;
}

async function slackApi<T = any>(method: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getBotToken()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Slack API ${method} HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  if (!data.ok) {
    throw new Error(`Slack API ${method}: ${data.error ?? "unknown error"}`);
  }
  return data as T;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Post a message to a Slack channel as a specific agent.
 * Uses chat:write.customize to set the agent's display name and emoji.
 */
export async function postAsAgent(
  channelId: string,
  agentId: string,
  text: string,
  options?: { threadTs?: string },
): Promise<SlackPostResult> {
  try {
    const emoji = AGENT_EMOJI[agentId] ?? ":robot_face:";
    const displayName = getAgentDisplayName(agentId);

    const body: Record<string, any> = {
      channel: channelId,
      text,
      username: displayName,
      icon_emoji: emoji,
      unfurl_links: false,
    };

    if (options?.threadTs) {
      body.thread_ts = options.threadTs;
    }

    const data = await slackApi("chat.postMessage", body);
    return { ok: true, ts: data.ts, channel: data.channel };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Read recent messages from a channel.
 */
export async function readHistory(
  channelId: string,
  limit = 20,
  options?: { oldest?: string; threadTs?: string },
): Promise<SlackMessage[]> {
  const method = options?.threadTs ? "conversations.replies" : "conversations.history";
  const body: Record<string, any> = {
    channel: channelId,
    limit,
  };

  if (options?.threadTs) body.ts = options.threadTs;
  if (options?.oldest) body.oldest = options.oldest;

  const data = await slackApi(method, body);
  return (data.messages ?? []) as SlackMessage[];
}

/**
 * List channels the bot can see.
 */
export async function listChannels(limit = 100): Promise<SlackChannel[]> {
  const data = await slackApi("conversations.list", {
    types: "public_channel,private_channel",
    limit,
    exclude_archived: true,
  });

  return (data.channels ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    is_member: c.is_member ?? false,
    topic: c.topic?.value,
    purpose: c.purpose?.value,
    num_members: c.num_members,
  }));
}

/**
 * Join a channel by ID.
 */
export async function joinChannel(channelId: string): Promise<boolean> {
  try {
    await slackApi("conversations.join", { channel: channelId });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find a channel by name and optionally join it.
 */
export async function getChannelByName(name: string, autoJoin = true): Promise<SlackChannel | null> {
  const channels = await listChannels(200);
  const cleaned = name.replace(/^#/, "").toLowerCase();
  const found = channels.find(c => c.name.toLowerCase() === cleaned);

  if (found && autoJoin && !found.is_member) {
    await joinChannel(found.id);
    found.is_member = true;
  }

  return found ?? null;
}

/**
 * Post a threaded reply from one agent to another's message.
 */
export async function replyAsAgent(
  channelId: string,
  agentId: string,
  text: string,
  threadTs: string,
): Promise<SlackPostResult> {
  return postAsAgent(channelId, agentId, text, { threadTs });
}

/**
 * Get the channel IDs for the two primary agent channels.
 * Caches results in memory for the process lifetime.
 */
let _channelCache: { general?: SlackChannel; execs?: SlackChannel } | null = null;

export async function getAgentChannels(): Promise<{
  general: SlackChannel | null;
  execs: SlackChannel | null;
}> {
  if (_channelCache) {
    return {
      general: _channelCache.general ?? null,
      execs: _channelCache.execs ?? null,
    };
  }

  const [general, execs] = await Promise.all([
    getChannelByName("atlas-ux", true),
    getChannelByName("atlas-ux-execs", true),
  ]);

  _channelCache = { general: general ?? undefined, execs: execs ?? undefined };
  return { general, execs };
}

// ── DMs between agents ──────────────────────────────────────────────────────

/**
 * DM channel cache: "atlas:binky" → channel ID.
 * Private channels named dm-{sorted agents} simulate 1:1 DMs
 * where each agent posts with their own identity.
 */
const _dmCache = new Map<string, string>();

function dmChannelName(agentA: string, agentB: string): string {
  const sorted = [agentA, agentB].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

/**
 * Get or create a DM channel between two agents.
 * Creates a private channel named dm-{agent1}-{agent2} (alphabetically sorted).
 */
export async function openDM(agentA: string, agentB: string): Promise<string | null> {
  const key = [agentA, agentB].sort().join(":");
  const cached = _dmCache.get(key);
  if (cached) return cached;

  const name = dmChannelName(agentA, agentB);

  // Check if channel already exists
  const existing = await getChannelByName(name, true);
  if (existing) {
    _dmCache.set(key, existing.id);
    return existing.id;
  }

  // Create a new private channel for this DM pair
  try {
    const data = await slackApi("conversations.create", {
      name,
      is_private: true,
    });
    const channelId = data.channel?.id;
    if (channelId) {
      _dmCache.set(key, channelId);

      // Set channel purpose
      await slackApi("conversations.setPurpose", {
        channel: channelId,
        purpose: `DM between ${getAgentDisplayName(agentA)} and ${getAgentDisplayName(agentB)}`,
      }).catch(() => null);

      return channelId;
    }
  } catch (err) {
    // Channel might already exist with a different case or was just created
    const retry = await getChannelByName(name, true);
    if (retry) {
      _dmCache.set(key, retry.id);
      return retry.id;
    }
  }

  return null;
}

/**
 * Send a DM from one agent to another.
 * Creates the DM channel if it doesn't exist.
 */
export async function sendDM(
  fromAgent: string,
  toAgent: string,
  text: string,
  options?: { threadTs?: string },
): Promise<SlackPostResult> {
  const channelId = await openDM(fromAgent, toAgent);
  if (!channelId) {
    return { ok: false, error: `Could not open DM channel between ${fromAgent} and ${toAgent}` };
  }
  return postAsAgent(channelId, fromAgent, text, options);
}

/**
 * Read DM history between two agents.
 */
export async function readDM(
  agentA: string,
  agentB: string,
  limit = 20,
): Promise<SlackMessage[]> {
  const channelId = await openDM(agentA, agentB);
  if (!channelId) return [];
  return readHistory(channelId, limit);
}

// ── File operations ─────────────────────────────────────────────────────────

/**
 * Upload a file to a Slack channel (or DM channel).
 * Uses files.uploadV2 for the newer API.
 */
export async function uploadFile(
  channelId: string,
  opts: {
    filename: string;
    content: string;
    title?: string;
    agentId?: string;
  },
): Promise<{ ok: boolean; fileId?: string; permalink?: string; error?: string }> {
  try {
    // files.uploadV2 uses multipart, but we can use the content param for text
    const res = await fetch(`${SLACK_API}/files.upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getBotToken()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        channels: channelId,
        filename: opts.filename,
        content: opts.content,
        title: opts.title ?? opts.filename,
        initial_comment: opts.agentId
          ? `${AGENT_EMOJI[opts.agentId] ?? ":robot_face:"} Shared by ${getAgentDisplayName(opts.agentId)}`
          : "",
      }),
    });

    const data = await res.json() as any;
    if (!data.ok) {
      return { ok: false, error: data.error ?? "upload failed" };
    }

    return {
      ok: true,
      fileId: data.file?.id,
      permalink: data.file?.permalink,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * List files in a channel.
 */
export async function listFiles(
  channelId: string,
  limit = 20,
): Promise<SlackFile[]> {
  try {
    const data = await slackApi("files.list", {
      channel: channelId,
      count: limit,
    });
    return (data.files ?? []).map((f: any) => ({
      id: f.id,
      name: f.name,
      title: f.title ?? f.name,
      mimetype: f.mimetype ?? "unknown",
      size: f.size ?? 0,
      url_private: f.url_private ?? "",
      permalink: f.permalink ?? "",
      created: f.created ?? 0,
      user: f.user,
    }));
  } catch {
    return [];
  }
}

/**
 * Get file info by ID.
 */
export async function getFileInfo(fileId: string): Promise<SlackFile | null> {
  try {
    const data = await slackApi("files.info", { file: fileId });
    const f = data.file;
    if (!f) return null;
    return {
      id: f.id,
      name: f.name,
      title: f.title ?? f.name,
      mimetype: f.mimetype ?? "unknown",
      size: f.size ?? 0,
      url_private: f.url_private ?? "",
      permalink: f.permalink ?? "",
      created: f.created ?? 0,
      user: f.user,
    };
  } catch {
    return null;
  }
}

/**
 * Download a file's content (text-based files only).
 */
export async function downloadFile(fileUrl: string): Promise<string | null> {
  try {
    const res = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${getBotToken()}` },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Channel management ──────────────────────────────────────────────────────

/**
 * Create a new channel.
 */
export async function createChannel(
  name: string,
  opts?: { isPrivate?: boolean; purpose?: string; topic?: string },
): Promise<SlackChannel | null> {
  try {
    const data = await slackApi("conversations.create", {
      name: name.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
      is_private: opts?.isPrivate ?? false,
    });

    const ch = data.channel;
    if (!ch) return null;

    const channelId = ch.id;

    if (opts?.purpose) {
      await slackApi("conversations.setPurpose", { channel: channelId, purpose: opts.purpose }).catch(() => null);
    }
    if (opts?.topic) {
      await slackApi("conversations.setTopic", { channel: channelId, topic: opts.topic }).catch(() => null);
    }

    return {
      id: channelId,
      name: ch.name,
      is_member: true,
      purpose: opts?.purpose,
      topic: opts?.topic,
    };
  } catch {
    return null;
  }
}

/**
 * Set channel topic.
 */
export async function setTopic(channelId: string, topic: string): Promise<boolean> {
  try {
    await slackApi("conversations.setTopic", { channel: channelId, topic });
    return true;
  } catch {
    return false;
  }
}

/**
 * Add a reaction to a message.
 */
export async function addReaction(channelId: string, ts: string, emoji: string): Promise<boolean> {
  try {
    await slackApi("reactions.add", {
      channel: channelId,
      timestamp: ts,
      name: emoji.replace(/^:|:$/g, ""),
    });
    return true;
  } catch {
    return false;
  }
}

// ── Workflows (multi-step automated sequences) ─────────────────────────────

/**
 * Execute a workflow — a sequence of Slack actions run in order.
 * Agents use this to automate multi-step processes:
 * send messages, upload files, set topics, add reactions, with delays.
 */
export async function runWorkflow(
  steps: SlackWorkflowStep[],
  defaults?: { channel?: string; agentId?: string },
): Promise<{ ok: boolean; results: { step: number; ok: boolean; error?: string }[] }> {
  const results: { step: number; ok: boolean; error?: string }[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const channelId = step.channel ?? defaults?.channel;
    const agent = step.agentId ?? defaults?.agentId ?? "atlas";

    try {
      switch (step.action) {
        case "send_message": {
          if (!channelId || !step.text) {
            results.push({ step: i, ok: false, error: "Missing channel or text" });
            break;
          }
          const res = await postAsAgent(channelId, agent, step.text);
          results.push({ step: i, ok: res.ok, error: res.error });
          break;
        }

        case "upload_file": {
          if (!channelId || !step.filename || !step.content) {
            results.push({ step: i, ok: false, error: "Missing channel, filename, or content" });
            break;
          }
          const res = await uploadFile(channelId, {
            filename: step.filename,
            content: step.content,
            agentId: agent,
          });
          results.push({ step: i, ok: res.ok, error: res.error });
          break;
        }

        case "set_topic": {
          if (!channelId || !step.text) {
            results.push({ step: i, ok: false, error: "Missing channel or text" });
            break;
          }
          const ok = await setTopic(channelId, step.text);
          results.push({ step: i, ok });
          break;
        }

        case "add_reaction": {
          if (!channelId || !step.emoji) {
            results.push({ step: i, ok: false, error: "Missing channel or emoji" });
            break;
          }
          results.push({ step: i, ok: false, error: "Reactions require a message timestamp — use after send_message" });
          break;
        }

        case "wait": {
          const delay = step.delayMs ?? 1000;
          await new Promise(r => setTimeout(r, Math.min(delay, 10000))); // cap at 10s
          results.push({ step: i, ok: true });
          break;
        }

        default:
          results.push({ step: i, ok: false, error: `Unknown action: ${(step as any).action}` });
      }
    } catch (err) {
      results.push({ step: i, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const allOk = results.every(r => r.ok);
  return { ok: allOk, results };
}

// ── Canvases (collaborative documents in Slack) ─────────────────────────────

/**
 * Create a Slack Canvas (rich document) in a channel.
 * Canvases support markdown-like content that agents can collaborate on.
 */
export async function createCanvas(
  title: string,
  content: string,
  channelId?: string,
  agentId?: string,
): Promise<{ ok: boolean; canvasId?: string; error?: string }> {
  try {
    // Create canvas via canvases.create
    const data = await slackApi("canvases.create", {
      title,
      document_content: {
        type: "markdown",
        markdown: content,
      },
    });

    const canvasId = data.canvas_id;

    // If a channel is specified, share the canvas there
    if (channelId && canvasId) {
      // Post a message with the canvas link
      const displayName = agentId ? getAgentDisplayName(agentId) : "Atlas UX";
      const emoji = agentId ? (AGENT_EMOJI[agentId] ?? ":robot_face:") : ":page_facing_up:";

      await slackApi("chat.postMessage", {
        channel: channelId,
        text: `${emoji} *${displayName}* created a new canvas: *${title}*`,
        username: displayName,
        icon_emoji: emoji,
        unfurl_links: false,
      }).catch(() => null);
    }

    return { ok: true, canvasId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Update (append to) an existing Slack Canvas.
 */
export async function updateCanvas(
  canvasId: string,
  content: string,
  operation: "replace" | "append" = "append",
): Promise<{ ok: boolean; error?: string }> {
  try {
    // canvases.edit supports inserting/replacing sections
    if (operation === "replace") {
      await slackApi("canvases.edit", {
        canvas_id: canvasId,
        changes: [{
          operation: "replace",
          document_content: {
            type: "markdown",
            markdown: content,
          },
        }],
      });
    } else {
      await slackApi("canvases.edit", {
        canvas_id: canvasId,
        changes: [{
          operation: "insert_at_end",
          document_content: {
            type: "markdown",
            markdown: `\n\n${content}`,
          },
        }],
      });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
