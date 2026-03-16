import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { postAsAgent } from "../services/slack.js";

const PLACES_API = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELDS = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
].join(",");

interface PlacesResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
}

async function notifySlack(
  log: { error: (obj: Record<string, unknown>, msg: string) => void },
  lines: string,
) {
  const ch = process.env.SLACK_LEADS_CHANNEL_ID;
  if (ch && process.env.SLACK_BOT_TOKEN) {
    postAsAgent(ch, "binky", lines).catch((err) => {
      log.error({ err }, "Failed to post lead to Slack");
    });
  }
}

export const leadsRoutes: FastifyPluginAsync = async (app) => {

  // POST /v1/leads — public lead capture from early access form
  app.post("/", async (req, reply) => {
    const { name, email, phone, businessName, businessType, message } =
      req.body as {
        name?: string;
        email?: string;
        phone?: string;
        businessName?: string;
        businessType?: string;
        message?: string;
      };

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return reply
        .code(400)
        .send({ ok: false, error: "name, email, and phone are required" });
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        businessName: businessName?.trim() || null,
        businessType: businessType?.trim() || null,
        message: message?.trim() || null,
        source: "website",
      },
    });

    app.log.info({ leadId: lead.id, email: lead.email }, "New lead captured");

    const lines = [
      `:rotating_light: *New Inbound Lead*`,
      `*Name:* ${lead.name}`,
      `*Email:* ${lead.email}`,
      `*Phone:* ${lead.phone}`,
      lead.businessName ? `*Business:* ${lead.businessName}` : null,
      lead.businessType ? `*Type:* ${lead.businessType}` : null,
      lead.message ? `*Message:* ${lead.message}` : null,
    ].filter(Boolean).join("\n");
    notifySlack(app.log, lines);

    return reply.code(201).send({ ok: true, id: lead.id });
  });

  // POST /v1/leads/prospect — import leads from Google Places search
  app.post("/prospect", async (req, reply) => {
    const adminKey = process.env.GATE_ADMIN_KEY?.trim();
    const header = (req.headers["x-gate-admin-key"] ?? "").toString().trim();
    if (!adminKey || header !== adminKey) {
      return reply.code(403).send({ ok: false, error: "forbidden" });
    }

    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!placesKey) {
      return reply.code(500).send({ ok: false, error: "GOOGLE_PLACES_API_KEY not configured" });
    }

    const { query, lat, lng, radiusMeters = 25000 } = req.body as {
      query: string;
      lat: number;
      lng: number;
      radiusMeters?: number;
    };

    if (!query || lat == null || lng == null) {
      return reply.code(400).send({ ok: false, error: "query, lat, and lng are required" });
    }

    // Fetch from Google Places
    const res = await fetch(PLACES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesKey,
        "X-Goog-FieldMask": PLACES_FIELDS,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
        maxResultCount: 20,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      app.log.error({ status: res.status, body: text }, "Google Places API error");
      return reply.code(502).send({ ok: false, error: "Google Places API failed" });
    }

    const data = (await res.json()) as { places?: PlacesResult[] };
    const places = data.places ?? [];

    // Upsert each place as a lead (skip duplicates by phone)
    let imported = 0;
    let skipped = 0;
    const newLeads: Array<{ name: string; phone: string; address: string }> = [];

    for (const p of places) {
      const name = p.displayName?.text;
      const phone = p.nationalPhoneNumber;
      if (!name || !phone) { skipped++; continue; }

      const existing = await prisma.lead.findFirst({ where: { phone } });
      if (existing) { skipped++; continue; }

      await prisma.lead.create({
        data: {
          name,
          email: "",
          phone,
          businessName: name,
          businessType: query,
          message: [
            p.formattedAddress,
            p.rating ? `Rating: ${p.rating} (${p.userRatingCount ?? 0} reviews)` : null,
            p.websiteUri ? `Web: ${p.websiteUri}` : null,
          ].filter(Boolean).join(" | "),
          source: "google_places",
        },
      });

      newLeads.push({ name, phone, address: p.formattedAddress ?? "" });
      imported++;
    }

    app.log.info({ query, imported, skipped }, "Prospect import complete");

    // Post summary to Slack
    if (imported > 0) {
      const listing = newLeads
        .map((l) => `  - *${l.name}* ${l.phone} — ${l.address}`)
        .join("\n");
      const slackMsg = [
        `:mag: *${imported} New Prospects Imported*`,
        `*Search:* "${query}" near (${lat}, ${lng})`,
        ``,
        listing,
        ``,
        `_${skipped} duplicates skipped_`,
      ].join("\n");
      notifySlack(app.log, slackMsg);
    }

    return { ok: true, imported, skipped, total: places.length };
  });

  // GET /v1/leads — admin list (requires gate admin key)
  app.get("/", async (req, reply) => {
    const key = process.env.GATE_ADMIN_KEY?.trim();
    const header = (req.headers["x-gate-admin-key"] ?? "").toString().trim();
    if (!key || header !== key) {
      return reply.code(403).send({ ok: false, error: "forbidden" });
    }

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return { ok: true, leads };
  });
};
