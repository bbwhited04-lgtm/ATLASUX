/**
 * filesRoutes.ts — File management via Supabase Storage.
 *
 * Bucket: KB_UPLOAD_BUCKET (default "kb_uploads")
 *
 * Routes:
 *   GET  /v1/files          → list files for tenant
 *   POST /v1/files/upload   → upload a file (multipart/form-data, field "file")
 *   GET  /v1/files/:path    → get a signed download URL
 *   DELETE /v1/files/:path  → delete a file
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import multipart from "@fastify/multipart";
import { meterStorage } from "../lib/usageMeter.js";
import { enforceStorageLimit } from "../lib/seatEnforcement.js";
import { Readable } from "stream";
import { prisma } from "../db/prisma.js";

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "text/plain", "text/csv", "text/markdown",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg", "audio/wav", "audio/ogg",
  "video/mp4", "video/webm",
]);

const MIME_EXT_MAP: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt", ".text", ".log"],
  "text/csv": [".csv"],
  "text/markdown": [".md", ".markdown"],
  "application/json": [".json"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

const BUCKET = process.env.KB_UPLOAD_BUCKET ?? "kb_uploads";
const SIGNED_URL_TTL = 3600; // 1 hour
const MAX_FILES_PER_TENANT = Number(process.env.MAX_FILES_PER_TENANT ?? 500);
const MAX_STORAGE_BYTES_PER_TENANT = Number(process.env.MAX_STORAGE_MB_PER_TENANT ?? 500) * 1024 * 1024;

function makeStorage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

function tenantPrefix(tenantId: string) {
  return `tenants/${tenantId}/`;
}

async function streamToBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

const FilePathQuery = z.object({
  path: z.string().min(1).max(500),
});

export const filesRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB max

  // ── GET /v1/files ──────────────────────────────────────────────────────────
  app.get("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    try {
      const storage = makeStorage();
      const prefix = tenantPrefix(tenantId);
      const { data, error } = await storage.from(BUCKET).list(prefix, {
        limit: 200,
        sortBy: { column: "updated_at", order: "desc" },
      });

      if (error) return reply.code(500).send({ ok: false, error: error.message });

      const files = (data ?? []).map((f) => ({
        name: f.name,
        path: `${prefix}${f.name}`,
        size: f.metadata?.size ?? null,
        contentType: f.metadata?.mimetype ?? null,
        updatedAt: f.updated_at ?? null,
      }));

      return reply.send({ ok: true, files });
    } catch (e: any) {
      return reply.code(500).send({ ok: false, error: e?.message ?? "Storage error" });
    }
  });

  // ── POST /v1/files/upload ─────────────────────────────────────────────────
  app.post("/upload", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    try {
      const userId = (req as any).auth?.userId as string | undefined;

      // Per-tenant quota check
      const storage = makeStorage();
      const prefix = tenantPrefix(tenantId);
      const { data: existing } = await storage.from(BUCKET).list(prefix, { limit: MAX_FILES_PER_TENANT + 1 });
      const fileCount = existing?.length ?? 0;
      if (fileCount >= MAX_FILES_PER_TENANT) {
        return reply.code(429).send({ ok: false, error: `File limit reached (${MAX_FILES_PER_TENANT} files per tenant)` });
      }
      const totalBytes = (existing ?? []).reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);

      const data = await req.file();
      if (!data) return reply.code(400).send({ ok: false, error: "No file in request" });

      // MIME type validation
      if (!ALLOWED_MIME.has(data.mimetype)) {
        return reply.code(415).send({ ok: false, error: `File type '${data.mimetype}' is not allowed` });
      }

      // Extension ↔ MIME consistency check
      const ext = (data.filename.match(/\.[^.]+$/) ?? [""])[0].toLowerCase();
      const allowedExts = MIME_EXT_MAP[data.mimetype];
      if (allowedExts && ext && !allowedExts.includes(ext)) {
        return reply.code(415).send({ ok: false, error: `Extension '${ext}' does not match MIME type '${data.mimetype}'` });
      }

      const buf = await streamToBuffer(data.file as unknown as Readable);

      // Seat-level storage enforcement
      if (userId && tenantId) {
        const storageCheck = await enforceStorageLimit(userId, tenantId, buf.length);
        if (!storageCheck.allowed) {
          return reply.code(429).send({ ok: false, error: storageCheck.reason });
        }
      }

      if (totalBytes + buf.length > MAX_STORAGE_BYTES_PER_TENANT) {
        return reply.code(429).send({ ok: false, error: `Storage quota exceeded (${process.env.MAX_STORAGE_MB_PER_TENANT ?? 500} MB per tenant)` });
      }

      const safeName = data.filename.replace(/[^a-zA-Z0-9._\- ]/g, "_");
      const path = `${tenantPrefix(tenantId)}${Date.now()}_${safeName}`;

      const { error } = await storage.from(BUCKET).upload(path, buf, {
        contentType: data.mimetype,
        upsert: false,
      });

      if (error) return reply.code(500).send({ ok: false, error: error.message });

      // Meter storage usage
      if (userId && tenantId) meterStorage(userId, tenantId, buf.length);

      return reply.code(201).send({
        ok: true,
        file: { name: safeName, path, contentType: data.mimetype, size: buf.length },
      });
    } catch (e: any) {
      return reply.code(500).send({ ok: false, error: e?.message ?? "Upload failed" });
    }
  });

  // ── GET /v1/files/url?path=... ─────────────────────────────────────────────
  app.get("/url", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const parsed = FilePathQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "path query parameter required" });
    const path = parsed.data.path;

    if (!tenantId || !path) return reply.code(400).send({ ok: false, error: "tenantId and path required" });
    // Ensure the path belongs to this tenant (basic auth check)
    if (!path.startsWith(tenantPrefix(tenantId))) {
      return reply.code(403).send({ ok: false, error: "Forbidden" });
    }

    try {
      const storage = makeStorage();
      const { data, error } = await storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
      if (error) return reply.code(500).send({ ok: false, error: error.message });
      return reply.send({ ok: true, url: data?.signedUrl });
    } catch (e: any) {
      return reply.code(500).send({ ok: false, error: e?.message ?? "Signed URL error" });
    }
  });

  // ── DELETE /v1/files?path=... ─────────────────────────────────────────────
  app.delete("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const parsed = FilePathQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "path query parameter required" });
    const path = parsed.data.path;

    if (!tenantId || !path) return reply.code(400).send({ ok: false, error: "tenantId and path required" });
    if (!path.startsWith(tenantPrefix(tenantId))) {
      return reply.code(403).send({ ok: false, error: "Forbidden" });
    }

    try {
      const storage = makeStorage();
      const { error } = await storage.from(BUCKET).remove([path]);
      if (error) return reply.code(500).send({ ok: false, error: error.message });

      await prisma.auditLog.create({
        data: {
          tenantId,
          actorType: "system",
          actorUserId: null,
          actorExternalId: (req as any).auth?.userId ?? null,
          level: "info",
          action: "FILE_DELETED",
          entityType: "file",
          entityId: path.slice(0, 200),
          message: `File deleted: ${path}`,
          meta: { path },
          timestamp: new Date(),
        },
      } as any).catch(() => null);

      return reply.send({ ok: true });
    } catch (e: any) {
      return reply.code(500).send({ ok: false, error: e?.message ?? "Delete failed" });
    }
  });
};
