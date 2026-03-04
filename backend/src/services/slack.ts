/**
 * Slack Web API service for inter-agent communication.
 *
 * Uses SLACK_BOT_TOKEN with chat:write.customize so each agent
 * posts with its own display name and emoji avatar.
 * Agents hang out in Slack channels, chat when idle, and
 * every message is recorded in Slack's history.
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
