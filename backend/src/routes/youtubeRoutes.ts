/**
 * YouTube routes — scraping, searching, and uploading.
 *
 * Endpoints:
 *   POST /v1/youtube/scrape          — scrape by query/channel → store in KB
 *   GET  /v1/youtube/search          — search YouTube (no KB storage)
 *   POST /v1/youtube/upload          — upload video from OneDrive to YouTube
 *   GET  /v1/youtube/status          — check YouTube connection status
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import {
  searchVideos,
  getChannelVideos,
  getVideoDetails,
  getVideoTranscript,
  uploadVideo,
  setThumbnail,
  buildYouTubeKbBody,
} from "../services/youtube.js";

// ── Token helpers ────────────────────────────────────────────────────────────

async function getGoogleToken(tenantId: string): Promise<string | null> {
  try {
    // Try token_vault (Supabase) first
    const vault = await prisma.$queryRaw<Array<{ access_token: string }>>`
      SELECT access_token FROM token_vault
      WHERE org_id = ${tenantId} AND provider = 'google'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);
    if (vault.length > 0 && vault[0].access_token) return vault[0].access_token;

    // Fallback: Integration table
    const integration = await prisma.integration.findUnique({
      where: { tenantId_provider: { tenantId, provider: "google" } },
      select: { access_token: true, connected: true },
    });
    if (integration?.connected && integration.access_token) return integration.access_token;

    return null;
  } catch {
    return null;
  }
}

// ── Chunking (matches kbRoutes pattern) ──────────────────────────────────────

type KbChunkRow = { idx: number; charStart: number; charEnd: number; content: string };

function makeChunksByChars(body: string, targetSize = 4000, softWindow = 600): KbChunkRow[] {
  const s = body ?? "";
  const len = s.length;
  if (len === 0) return [];
  const chunks: KbChunkRow[] = [];
  let pos = 0;
  let idx = 0;

  while (pos < len) {
    let end = Math.min(pos + targetSize, len);
    if (end < len) {
      const forward = s.indexOf("\n", end);
      if (forward !== -1 && forward - end <= softWindow) {
        end = forward + 1;
      } else {
        const back = s.lastIndexOf("\n", end);
        if (back > pos + 200) end = back + 1;
      }
    }
    if (end <= pos) end = Math.min(pos + targetSize, len);
    chunks.push({ idx, charStart: pos, charEnd: end, content: s.slice(pos, end) });
    idx++;
    pos = end;
  }

  return chunks;
}

// ── Routes ───────────────────────────────────────────────────────────────────

export const youtubeRoutes: FastifyPluginAsync = async (app) => {

  // GET /v1/youtube/status — check if YouTube/Google is connected
  app.get("/status", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    const token = await getGoogleToken(tenantId);
    return reply.send({ ok: true, connected: !!token });
  });

  // GET /v1/youtube/search — search YouTube, return results (no KB storage)
  app.get("/search", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any) ?? {};
    const query = String(q.q ?? "").trim();
    if (!query) return reply.code(400).send({ ok: false, error: "q parameter required" });

    const token = await getGoogleToken(tenantId);
    if (!token) return reply.code(503).send({ ok: false, error: "Google/YouTube not connected" });

    const maxResults = Math.min(Number(q.maxResults ?? 10), 50);
    const results = await searchVideos(token, query, maxResults);
    return reply.send({ ok: true, results });
  });

  // POST /v1/youtube/scrape — scrape videos and store in KB
  app.post("/scrape", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as {
      query?: string;
      channelId?: string;
      channelIds?: string[];
      maxResults?: number;
      includeTranscripts?: boolean;
    };

    if (!body.query && !body.channelId && !body.channelIds?.length) {
      return reply.code(400).send({ ok: false, error: "query or channelId/channelIds required" });
    }

    const token = await getGoogleToken(tenantId);
    if (!token) return reply.code(503).send({ ok: false, error: "Google/YouTube not connected" });

    const maxResults = Math.min(Number(body.maxResults ?? 10), 50);
    const includeTranscripts = body.includeTranscripts !== false;

    // Collect search results from query and channels
    const allResults: Array<{ videoId: string; title: string }> = [];

    if (body.query) {
      const results = await searchVideos(token, body.query, maxResults);
      allResults.push(...results);
    }

    const channelIds = body.channelIds ?? (body.channelId ? [body.channelId] : []);
    for (const chId of channelIds) {
      const results = await getChannelVideos(token, chId, Math.min(maxResults, 10));
      allResults.push(...results);
    }

    // De-duplicate by videoId
    const seen = new Set<string>();
    const unique = allResults.filter(v => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });

    // Process each video: get details + transcript → store in KB
    const storedIds: string[] = [];
    const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000000";

    for (const video of unique) {
      const details = await getVideoDetails(token, video.videoId);
      if (!details) continue;

      const transcript = includeTranscripts ? await getVideoTranscript(video.videoId) : "";
      const kbBody = buildYouTubeKbBody(details, transcript);
      const slug = `youtube-video-${details.videoId}`;

      // Upsert: update if exists, create if new
      const existing = await prisma.kbDocument.findFirst({
        where: { tenantId, slug },
        select: { id: true },
      });

      let docId: string;
      if (existing) {
        await prisma.kbDocument.update({
          where: { id: existing.id },
          data: { title: details.title, body: kbBody, updatedBy: SYSTEM_ACTOR },
        });
        docId = existing.id;
      } else {
        const doc = await prisma.kbDocument.create({
          data: {
            tenantId,
            title: details.title,
            slug,
            body: kbBody,
            status: "published",
            createdBy: SYSTEM_ACTOR,
          },
        });
        docId = doc.id;

        // Tag it
        const tag = await prisma.kbTag.upsert({
          where: { tenantId_name: { tenantId, name: "youtube-video" } },
          create: { tenantId, name: "youtube-video" },
          update: {},
        });
        await prisma.kbTagOnDocument.upsert({
          where: { documentId_tagId: { documentId: docId, tagId: tag.id } },
          create: { documentId: docId, tagId: tag.id },
          update: {},
        });
      }

      // Auto-chunk for retrieval
      const chunks = makeChunksByChars(kbBody);
      if (chunks.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM kb_chunks
          WHERE tenant_id = ${tenantId}::uuid AND document_id = ${docId}::uuid
        `.catch(() => null);

        for (const chunk of chunks) {
          await prisma.$executeRaw`
            INSERT INTO kb_chunks (tenant_id, document_id, idx, content, source_updated_at)
            VALUES (${tenantId}::uuid, ${docId}::uuid, ${chunk.idx}, ${chunk.content}, NOW())
          `.catch(() => null);
        }
      }

      storedIds.push(docId);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: "venny",
        actorType: "agent",
        level: "info",
        action: "YOUTUBE_VIDEOS_SCRAPED",
        entityType: "kb_document",
        entityId: null,
        message: `YouTube scrape: ${storedIds.length} videos stored in KB`,
        meta: {
          query: body.query ?? null,
          channelIds: channelIds.length > 0 ? channelIds : null,
          storedCount: storedIds.length,
          documentIds: storedIds.slice(0, 20),
        },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, scraped: storedIds.length, documentIds: storedIds });
  });

  // POST /v1/youtube/upload — upload video from OneDrive to YouTube
  app.post("/upload", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as {
      oneDriveFileId: string;
      title: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: "public" | "unlisted" | "private";
      thumbnailFileId?: string;
    };

    if (!body.oneDriveFileId || !body.title) {
      return reply.code(400).send({ ok: false, error: "oneDriveFileId and title required" });
    }

    // Get M365 token for OneDrive download
    const m365Token = await prisma.$queryRaw<Array<{ access_token: string }>>`
      SELECT access_token FROM token_vault
      WHERE org_id = ${tenantId} AND provider = 'microsoft'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);

    if (!m365Token.length || !m365Token[0].access_token) {
      return reply.code(503).send({ ok: false, error: "Microsoft 365 not connected" });
    }

    // Get Google/YouTube token for upload
    const googleToken = await getGoogleToken(tenantId);
    if (!googleToken) {
      return reply.code(503).send({ ok: false, error: "Google/YouTube not connected" });
    }

    // Download video from OneDrive
    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${body.oneDriveFileId}/content`,
      { headers: { Authorization: `Bearer ${m365Token[0].access_token}` } },
    );
    if (!driveRes.ok) {
      return reply.code(502).send({ ok: false, error: `OneDrive download failed: ${driveRes.status}` });
    }
    const videoBuffer = Buffer.from(await driveRes.arrayBuffer());

    // Upload to YouTube
    const result = await uploadVideo(googleToken, videoBuffer, {
      title: body.title,
      description: body.description,
      tags: body.tags,
      categoryId: body.categoryId,
      privacyStatus: body.privacyStatus ?? "private",
    });

    if (!result.ok) {
      return reply.code(502).send({ ok: false, error: result.error });
    }

    // Optional: set custom thumbnail
    if (body.thumbnailFileId && result.videoId) {
      const thumbRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${body.thumbnailFileId}/content`,
        { headers: { Authorization: `Bearer ${m365Token[0].access_token}` } },
      );
      if (thumbRes.ok) {
        const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
        await setThumbnail(googleToken, result.videoId, thumbBuffer);
      }
    }

    // Create distribution event
    await prisma.distributionEvent.create({
      data: {
        tenantId,
        agent: "venny",
        channel: "youtube",
        eventType: "video_upload",
        url: result.url ?? null,
        meta: { videoId: result.videoId, title: body.title, tags: body.tags ?? [], privacyStatus: body.privacyStatus ?? "private" },
      } as any,
    }).catch(() => null);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: "venny",
        actorType: "agent",
        level: "info",
        action: "YOUTUBE_VIDEO_UPLOADED",
        entityType: "youtube_video",
        entityId: result.videoId ?? null,
        message: `Venny uploaded "${body.title}" to YouTube`,
        meta: { videoId: result.videoId, url: result.url, title: body.title },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, videoId: result.videoId, url: result.url });
  });
};
