#!/usr/bin/env node
/**
 * seed-recovered-leads.mjs
 *
 * Imports leads recovered from three Slack canvas sources into the `leads` table:
 *   1. VC Leads        — email-only contacts from a venture capital canvas
 *   2. Chamber Members — Mexico MO Chamber of Commerce businesses
 *   3. Construction    — Missouri construction companies
 *
 * Deduplicates by email (where available) and phone. Uses upsert for idempotency.
 * Run from backend/:
 *   node scripts/seed-recovered-leads.mjs
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391"; // not stored on lead, kept for logging
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAMBER_FILE = resolve(__dirname, "canvas-chamber.json");
const CONSTRUCTION_FILE = resolve(__dirname, "canvas-construction.json");

// ─── COUNTERS ───────────────────────────────────────────────────────────────
let inserted = 0;
let skipped = 0;
let errored = 0;

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Extract the markdown_content from a Slack canvas tool-result JSON file. */
function readCanvasMarkdown(filePath) {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const arr = JSON.parse(raw);
    const inner = JSON.parse(arr[0].text);
    return inner.markdown_content || "";
  } catch (err) {
    console.error(`  ERROR reading ${filePath}: ${err.message}`);
    return "";
  }
}

/** Normalise a phone string to digits only for dedup comparison. */
function normalizePhone(p) {
  if (!p) return "";
  return p.replace(/\D/g, "");
}

/** Insert a lead if no duplicate exists. Dedup by email or phone via findFirst. */
async function upsertLead({ name, email, phone, businessName, businessType, message, source }) {
  const safeEmail = (email || "").trim().toLowerCase();
  const safePhone = (phone || "").trim();
  const safeName = (name || "Unknown").trim();

  // We need at least email or phone for a meaningful record
  if (!safeEmail && !safePhone) {
    console.log(`  SKIP (no email or phone): ${safeName}`);
    skipped++;
    return;
  }

  try {
    // Build dedup conditions
    const orClauses = [];
    if (safeEmail) orClauses.push({ email: safeEmail });
    if (safePhone) orClauses.push({ phone: safePhone });

    // For phone-only leads we use a deterministic placeholder email
    const effectiveEmail = safeEmail || `phone-${normalizePhone(safePhone)}@placeholder.local`;
    if (!safeEmail) orClauses.push({ email: effectiveEmail });

    const existing = await prisma.lead.findFirst({ where: { OR: orClauses } });
    if (existing) {
      skipped++;
      return;
    }

    await prisma.lead.create({
      data: {
        name: safeName,
        email: effectiveEmail,
        phone: safePhone,
        businessName: businessName || null,
        businessType: businessType || null,
        message: message || null,
        source,
      },
    });
    inserted++;
  } catch (err) {
    if (err.code === "P2002") {
      // Unique constraint race condition — treat as duplicate
      skipped++;
      return;
    }
    console.error(`  ERROR inserting ${safeName}: ${err.message}`);
    errored++;
  }
}

// ─── SOURCE 1: VC LEADS ────────────────────────────────────────────────────

const vcEmails = [
  "matty@acp.vc", "rob@asymmetry.vc", "laurie@atoneventures.com",
  "nadav@th-vp.com", "pb@ardent.vc", "andy@argon.vc",
  "viken.douzdjian@argonauticventures.com", "radhesh@arka.vc",
  "john@armorysv.com", "shruti@array.vc", "geoffrey@arringtonxrpcapital.com",
  "matt@betaworks.com", "jennifer@aspectventures.com", "skip@assetman.com",
  "rich@assetman.com", "hendrik@astanor.com", "erigonatti@astellainvest.com",
  "clem@arrowrootcapital.com", "john@arsenalgrowth.com",
  "bwhited4@cox.net", "charlee@jenksproductions.com", "stash759@yahoo.com",
  "ccombs@magiccablepc.com", "sdhale21@tntech.edu", "jrourke@earthlink.net",
  "kygal@tampabay.rr.com", "wflansaas@msn.com", "wade.mcdonald@oa.mo.gov",
  "marjen@emily.net", "j90541@aol.com", "deb.hood@avon.com",
  "ehartwell@ejhartwell.com", "EBusby@webtv.net",
  "bchamberlain@kbtransportation.com", "sbarragan@kbtransportation.com",
  "shortbob29@yahoo.com", "bschneider@vandaliamo.net", "blsses@aol.com",
  "bschneider02@sprintpcs.com", "neal@baypartners.com",
  "susan.lyne@bbgv.com", "buddy@bbq.capital", "heidi.kim@bcgdv.com",
  "geoff@bedrockcap.com", "michael@beepartners.vc", "lkahn@beechwoodcap.com",
  "hiro@beenext.com", "paige@behindgeniusventures.com",
  "karyn.parra@beigene.com", "kate@sep.benfranklin.org",
  "chetan@benchmark.com", "yash@benhamouglobalventures.com",
  "davidtietjwiener@beresfordventures.com", "evgeny@beringcapital.com",
  "wblake@beringea.com", "joky@berkeleycatalystfund.com", "byron@bvp.com",
  "jtemplin@betaspring.com", "rafal@betatron.co", "josh@betaworks.com",
  "tsexton@claritascapital.com", "jhchadwick@claritascapital.com",
  "gregory.beutler@blackstone.com", "jsantoleri@stoneworkcapital.com",
  "mike.brown@bowerycap.com", "nimi@boxgroup.com",
  "jfelker@boxoneventures.com", "ateet@bracketcapital.com",
  "wlese@braemarenergy.com", "paul@bragielbros.com",
  "javierolvera@brainstorm.vc", "krish@brandnewmatter.com",
  "jimmy@brandedstrategic.com", "schatzy@brandedstrategic.com",
  "hayden.williams@brandproject.com", "jeff@bravoscap.com",
  "qipei@brainrobotcap.com", "mary@breadandbutterventures.com",
  "jay@breaktrailventures.com", "pala@breakaway.partners",
  "dbaldwin@breakaway.com", "lindy@breakout.vc",
  "jim@breakthroughenergy.org", "smansour@breakwaterfunds.com",
  "steve.dorsey@sagemount.com", "martha@brewerlane.com",
  "daniel@breyercapital.com", "ran@bridgesisrael.com",
  "georgi.mitov@brightcap.vc", "mike@brightonparkcap.com",
  "david@brightstonevc.com", "morris@brookventure.com",
  "chad@canalpartners.com", "dan@broom.ventures",
  "paul@brownventuregroup.com", "gonzalo@bryantsibel.com",
  "john.fath@btgpactual.com", "benedikt.kronberger@btov.vc",
  "henrik@buckhillcapital.com", "mark.goldstein@builders.vc",
  "allen@buildingventures.com", "jason@bcvp.com", "jready@bulldog.vc",
  "mike@bullish.co", "ann@bullpencap.com",
  "alicia.oconnell@magiclab.co", "amy@buoyant.vc", "wendy@burst.llc",
  "maciej.balsewicz@bvalue.vc", "tommy@byfounders.vc",
  "matt@c2ventures.co", "hazel.naik@c4v.com", "william.kilmer@c5capital.com",
  "krd@cadenza.vc", "rt@caffeinatedcapital.com", "nick@callaiscapital.com",
  "jf@cambercreek.com", "polina@cambridgespg.com",
  "andrew.williamson@cic.vc", "dwarnock@camdenpartners.com",
  "madding@camdenventures.com", "rboyle@canaan.com", "gene@canapi.com",
  "susan@candouventures.com", "micah@canopyboulder.com", "ian@cantos.vc",
  "mike@canvas.vc", "buck.jordan@canyoncreekcapital.com",
  "jbaer@capitalfactory.com", "jaidev.shergill@capitalone.com",
  "brad.cooper@capitalz.com", "acaragan@capitalg.com",
  "cindy@capitalx.vc", "jb@capnamic.com", "willp@capria.vc",
  "jos@capricorn.be", "adrian@caravoc.com",
  "gonzalo@cardumencapital.com", "brianne.gaultiere@carta.com",
  "james@carthonacapital.com", "karan@casaverdecapital.com",
  "robert@cascadeseedfund.com", "matt@castleisland.vc",
  "jlucker@catalio.com", "ryan@catalyst.com", "loh_alison@cat.com",
  "denis.barrier@cathay.fr", "maxim@cats.vc", "bob@causewaymp.com",
  "brett@cavuventures.com", "jennifer@cayugaventures.com",
  "amnon@cedarfund.com", "sudhir@indusage.com", "cj@celticvc.com",
  "ebyunn@centanagrowth.com", "andy@cen.vc",
  "qidong@centregoldcap.com", "na@cerracap.com",
  "neeraj@cervinventures.com", "sunchong@ceyuan.com",
  "kgacevich@fintechvc.us", "luke@chaacventures.com",
  "andris@changeventures.com", "jeff@chapterone.vc", "thanos@charge.vc",
  "bdupont@chartline.com", "daniel@cherry.vc", "andrew@cherubicvc.com",
  "sam@chetritventures.com", "rob@chicagoventures.com",
  "samara@chingona.ventures", "karan@chiratae.com",
  "djones@chrysaliscventures.com", "steve@cidcap.com",
  "slee@cincytechusa.com", "marsha@citibank.com", "tom@citylightcap.com",
  "shahram@civilizationventures.com", "harsh@claremontcreek.com",
  "sbarragan@kbtransporatation.com",
];

async function seedVcLeads() {
  console.log("\n━━━ SOURCE 1: VC LEADS ━━━");
  // Deduplicate the email list
  const unique = [...new Set(vcEmails.map((e) => e.trim().toLowerCase()))];
  console.log(`  Unique emails: ${unique.length}`);

  for (const email of unique) {
    const namePart = email.split("@")[0].replace(/[._]/g, " ");
    const domain = email.split("@")[1];
    await upsertLead({
      name: namePart,
      email,
      phone: "",
      businessName: domain,
      businessType: "Venture Capital",
      message: "Category: vc-lead | Recovered from Slack canvas: Venture Capitalist Leads",
      source: "slack-canvas",
    });
  }
  console.log(`  VC leads processed.`);
}

// ─── SOURCE 2: CHAMBER OF COMMERCE ─────────────────────────────────────────

function parseChamberMarkdown(md) {
  const leads = [];
  // Split by ### headings
  const blocks = md.split(/(?=^### )/m);

  for (const block of blocks) {
    const headerMatch = block.match(/^### (.+)/);
    if (!headerMatch) continue;

    const bizName = headerMatch[1].trim();
    if (!bizName || bizName === "#") continue;

    const lines = block.split("\n");

    // Extract contact name from **bold**
    let contact = "";
    for (const line of lines) {
      const boldMatch = line.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        contact = boldMatch[1].trim();
        if (contact === "." || contact === "#") contact = "";
        break;
      }
    }

    // Extract first phone number from [phone](tel:...) pattern
    let phone = "";
    for (const line of lines) {
      const phoneMatch = line.match(/\[([^\]]*\d{3}[^\]]*)\]\(tel:/);
      if (phoneMatch) {
        phone = phoneMatch[1].trim();
        break;
      }
    }

    // Extract address: lines with numbers + state abbreviation, not links
    let address = "";
    for (const line of lines) {
      const clean = line.replace(/\*\*/g, "").trim();
      // Match lines that look like addresses (have digits and MO/US)
      if (
        clean.match(/\d/) &&
        clean.match(/MO|Missouri|US/i) &&
        !clean.includes("[") &&
        !clean.includes("tel:") &&
        clean !== headerMatch[0]
      ) {
        address = clean;
        break;
      }
    }

    // Extract website
    let website = "";
    for (const line of lines) {
      const webMatch = line.match(/\[((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][\w.-]+\.\w+[^\]]*)\]\(https?:\/\//);
      if (webMatch) {
        website = webMatch[1].replace(/\\/g, "");
        break;
      }
    }

    const displayName = contact || bizName;

    leads.push({
      name: displayName,
      email: "",
      phone,
      businessName: bizName,
      businessType: "Local Business",
      message: [
        "Category: chamber-member",
        address ? `Address: ${address}` : null,
        website ? `Website: ${website}` : null,
        "Recovered from Slack canvas: Mexico MO Chamber of Commerce",
      ]
        .filter(Boolean)
        .join(" | "),
      source: "slack-canvas",
    });
  }

  return leads;
}

async function seedChamberLeads() {
  console.log("\n━━━ SOURCE 2: CHAMBER OF COMMERCE ━━━");
  const md = readCanvasMarkdown(CHAMBER_FILE);
  if (!md) {
    console.log("  WARN: Could not read chamber file, skipping.");
    return;
  }

  const leads = parseChamberMarkdown(md);
  // Deduplicate by phone within this source
  const seen = new Set();
  const unique = [];
  for (const lead of leads) {
    const key = lead.phone ? normalizePhone(lead.phone) : lead.businessName;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(lead);
  }

  console.log(`  Parsed: ${leads.length}, Unique: ${unique.length}`);

  for (const lead of unique) {
    await upsertLead(lead);
  }
  console.log(`  Chamber leads processed.`);
}

// ─── SOURCE 3: CONSTRUCTION COMPANIES ──────────────────────────────────────

function parseConstructionMarkdown(md) {
  const leads = [];

  // Pattern 1: Bullet-point list items like * ****[Company Name](url) (City): description
  const bulletPattern = /\*\s*\*{0,4}\[([^\]]+)\]\([^)]*\)\s*\(([^)]*)\)[^*\n]*/g;
  let match;
  while ((match = bulletPattern.exec(md)) !== null) {
    const name = match[1].trim();
    const location = match[2].trim();
    if (name && !leads.find((l) => l.businessName === name && l.message?.includes(location))) {
      leads.push({
        name,
        email: "",
        phone: "",
        businessName: name,
        businessType: "Construction",
        message: [
          "Category: construction",
          location ? `Location: ${location}` : null,
          "Recovered from Slack canvas: Construction Companies",
        ]
          .filter(Boolean)
          .join(" | "),
        source: "slack-canvas",
      });
    }
  }

  // Pattern 2: AGC-style table rows |[**Company Name**](url)<br>City, MOZip<br>(phone)<br>[website](url)|
  const tablePattern = /\|\[?\*{0,2}([^*\]|]+?)\*{0,2}\]?\(?[^)]*\)?\s*(?:<br>([^<|]*?))?(?:<br>\(?([\d() -]+)\)?)?(?:<br>\[([^\]]+)\]\([^)]*\))?[^|]*\|/g;
  while ((match = tablePattern.exec(md)) !== null) {
    const name = match[1].trim().replace(/^\*+|\*+$/g, "");
    const locationRaw = (match[2] || "").trim();
    const phone = (match[3] || "").trim();
    const website = (match[4] || "").trim();

    if (!name || name.length < 2 || name === "---") continue;

    // Skip if already captured by bullet pattern
    if (leads.find((l) => l.businessName === name)) continue;

    leads.push({
      name,
      email: "",
      phone,
      businessName: name,
      businessType: "Construction",
      message: [
        "Category: construction",
        locationRaw ? `Location: ${locationRaw}` : null,
        website ? `Website: ${website}` : null,
        "Recovered from Slack canvas: Construction Companies",
      ]
        .filter(Boolean)
        .join(" | "),
      source: "slack-canvas",
    });
  }

  return leads;
}

async function seedConstructionLeads() {
  console.log("\n━━━ SOURCE 3: CONSTRUCTION COMPANIES ━━━");
  const md = readCanvasMarkdown(CONSTRUCTION_FILE);
  if (!md) {
    console.log("  WARN: Could not read construction file, skipping.");
    return;
  }

  const leads = parseConstructionMarkdown(md);
  // Deduplicate by business name within this source
  const seen = new Set();
  const unique = [];
  for (const lead of leads) {
    const key = lead.phone
      ? normalizePhone(lead.phone)
      : lead.businessName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(lead);
  }

  console.log(`  Parsed: ${leads.length}, Unique: ${unique.length}`);

  for (const lead of unique) {
    await upsertLead(lead);
  }
  console.log(`  Construction leads processed.`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  seed-recovered-leads — Import Slack Canvas Data ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Tenant context: ${TENANT_ID}`);

  const before = await prisma.lead.count();
  console.log(`Leads in DB before: ${before}`);

  await seedVcLeads();
  await seedChamberLeads();
  await seedConstructionLeads();

  const after = await prisma.lead.count();

  console.log("\n══════════════════════════════════════");
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errored}`);
  console.log(`  DB before: ${before}`);
  console.log(`  DB after : ${after}`);
  console.log("══════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
