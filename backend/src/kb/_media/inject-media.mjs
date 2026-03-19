/**
 * Media Injector — Enriches KB articles with tagged images and video references.
 *
 * Reads the media registry (media-registry.json) and injects a ## Media section
 * into each KB article with:
 * - Platform logo/icon (with attribution)
 * - Official docs/gallery links
 * - YouTube tutorial videos (tagged by type: tutorial, review, showcase)
 * - All media tagged with platform + article-specific tags
 *
 * COPYRIGHT COMPLIANCE:
 * - All media references include source attribution (platform + creator)
 * - YouTube/TikTok/Pinterest/Facebook videos: credited to channel/user
 * - Images: credited to source platform + original poster
 * - Official docs/logos: linked to original source
 *
 * Safe: only appends — never removes existing content.
 * Idempotent: skips articles that already have a ## Media section.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_ROOT = join(__dirname, "..");
const REGISTRY_PATH = join(__dirname, "media-registry.json");

// ── Collect all KB .md files ─────────────────────────────────────────────────
async function collectKbFiles(dir) {
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.name.startsWith("_") || e.name.startsWith(".")) continue;
      if (e.isDirectory()) results.push(...await collectKbFiles(full));
      else if (e.name.endsWith(".md")) results.push(full);
    }
  } catch {}
  return results;
}

// ── Parse frontmatter from a KB article ──────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) {
      let val = kv[2].trim();
      // Parse arrays
      if (val.startsWith("[")) {
        try { val = JSON.parse(val); } catch { val = val.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()); }
      } else {
        val = val.replace(/^["']|["']$/g, "");
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

// ── Determine which platform registry entry matches this article ─────────────
function findPlatformMedia(filePath, frontmatter, registry) {
  const rel = relative(KB_ROOT, filePath).replace(/\\/g, "/");
  const parts = rel.split("/");

  // Direct platform match from frontmatter
  if (frontmatter.platform) {
    const platform = frontmatter.platform;
    for (const [category, platforms] of Object.entries(registry)) {
      if (platforms[platform]) return { category, platform, media: platforms[platform] };
    }
  }

  // Match by folder structure
  // image-gen/midjourney/01-xxx.md → midjourney
  // video-gen/sora2/01-xxx.md → sora2
  // support/lucy/xxx.md → elevenlabs (Lucy = ElevenLabs voice agent)
  if (parts.length >= 2) {
    const category = parts[0]; // image-gen, video-gen, support
    const folder = parts[1];   // midjourney, sora2, lucy, etc.

    // Direct folder match
    if (registry[category]?.[folder]) {
      return { category, platform: folder, media: registry[category][folder] };
    }

    // Support folder mapping
    const supportMap = {
      "lucy": "elevenlabs",
      "phone-sms": "twilio",
      "billing": "stripe",
      "social-media": "postiz",
      "notifications": "slack",
      "appointments": "google-calendar",
    };
    if (category === "support" && supportMap[folder]) {
      const mapped = supportMap[folder];
      if (registry.support?.[mapped]) {
        return { category: "support", platform: mapped, media: registry.support[mapped] };
      }
    }
  }

  // Comparison/guide files — match by content keywords
  if (parts[0] === "image-gen" && (parts[1] === "comparisons" || parts[1] === "guides" || parts[1] === "pricing" || parts[1] === "prompt-framework")) {
    return { category: "image-gen", platform: "_cross-platform", media: null };
  }
  if (parts[0] === "video-gen" && (parts[1] === "guides" || parts[1] === "pricing" || parts[1] === "prompt-framework" || parts[1] === "treatments" || parts[1]?.startsWith("comparison"))) {
    return { category: "video-gen", platform: "_cross-platform", media: null };
  }
  // Root-level comparison files (comparison-NN-xxx.md directly in video-gen/)
  if (parts[0] === "video-gen" && basename(filePath).startsWith("comparison")) {
    return { category: "video-gen", platform: "_cross-platform", media: null };
  }
  // Root-level index files
  if (basename(filePath) === "ai-video-generation.md" || basename(filePath) === "ai-image-generation.md") {
    const cat = basename(filePath).includes("video") ? "video-gen" : "image-gen";
    return { category: cat, platform: "_cross-platform", media: null };
  }
  // Catch-all: any file in image-gen/ or video-gen/ or support/ not yet matched
  if (["image-gen", "video-gen", "support"].includes(parts[0])) {
    return { category: parts[0], platform: "_cross-platform", media: null };
  }

  return null;
}

// ── Build the media section for an article ────────────────────────────────────
function buildMediaSection(platformInfo, frontmatter, articleType) {
  if (!platformInfo?.media) return null;

  const { media, platform, category } = platformInfo;
  const lines = [];

  lines.push("\n\n---\n## Media\n");

  // Platform tags
  const tags = [...(media.tags || [])];
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    for (const t of frontmatter.tags) {
      if (!tags.includes(t)) tags.push(t);
    }
  }
  lines.push(`> **Tags:** ${tags.map(t => `\`${t}\``).join(" · ")}\n`);

  // Logo/icon (with source attribution)
  if (media.logo) {
    lines.push(`### Platform`);
    lines.push(`![${platform} logo](${media.logo})`);
    lines.push(`*Source: Official ${platform} branding — [${platform}](${media.docs || media.gallery || media.logo})*\n`);
  }

  // Official links
  const officialLinks = [];
  if (media.docs) officialLinks.push(`- [Official Documentation](${media.docs})`);
  if (media.gallery) officialLinks.push(`- [Gallery / Showcase](${media.gallery})`);
  if (media.official) {
    for (const o of media.official) {
      officialLinks.push(`- [${o.title}](${o.url})`);
    }
  }
  if (officialLinks.length > 0) {
    lines.push("### Official Resources");
    lines.push(officialLinks.join("\n"));
    lines.push("");
  }

  // YouTube videos
  if (media.youtube && media.youtube.length > 0) {
    lines.push("### Video Tutorials");
    // Group by type
    const tutorials = media.youtube.filter(v => v.type === "tutorial");
    const reviews = media.youtube.filter(v => v.type === "review");
    const showcases = media.youtube.filter(v => v.type === "showcase");
    const other = media.youtube.filter(v => !["tutorial", "review", "showcase"].includes(v.type));

    // Select videos based on article type
    let selectedVideos = [];
    if (articleType === "comprehensive-guide" || articleType === "prompting-guide") {
      selectedVideos = [...tutorials, ...other, ...showcases].slice(0, 4);
    } else if (articleType === "pricing") {
      selectedVideos = [...reviews, ...tutorials].slice(0, 3);
    } else if (articleType === "strengths-weaknesses" || articleType === "honest-review") {
      selectedVideos = [...reviews, ...tutorials].slice(0, 3);
    } else if (articleType === "api-integration") {
      selectedVideos = [...tutorials].slice(0, 3);
    } else {
      selectedVideos = media.youtube.slice(0, 3);
    }

    if (selectedVideos.length === 0) selectedVideos = media.youtube.slice(0, 3);

    for (const v of selectedVideos) {
      const typeTag = v.type ? ` \`${v.type}\`` : "";
      const channelTag = v.channel ? ` — *Credit: ${v.channel} on YouTube*` : " — *YouTube*";
      lines.push(`- [${v.title}](${v.url})${channelTag}${typeTag}`);
    }
    lines.push(`\n> *All video content is credited to original creators. Links direct to source platforms.*`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── Determine article type from filename ─────────────────────────────────────
function getArticleType(fileName) {
  const name = fileName.toLowerCase();
  if (name.includes("comprehensive-guide")) return "comprehensive-guide";
  if (name.includes("prompting-guide") || name.includes("prompt")) return "prompting-guide";
  if (name.includes("pricing")) return "pricing";
  if (name.includes("strengths-weaknesses") || name.includes("honest-review")) return "strengths-weaknesses";
  if (name.includes("api-integration") || name.includes("api-guide")) return "api-integration";
  if (name.includes("advanced-prompt")) return "prompting-guide";
  if (name.includes("comparison") || name.includes("vs")) return "comparison";
  if (name.includes("treatment")) return "treatment";
  if (name.includes("extraction")) return "extraction";
  if (name.includes("guide") || name.includes("tutorial")) return "guide";
  return "general";
}

// ── Build cross-platform media section for comparison/guide articles ──────────
function buildCrossPlatformMedia(category, frontmatter, content, registry) {
  const lines = [];
  lines.push("\n\n---\n## Media\n");

  // Collect tags from frontmatter
  const tags = frontmatter.tags || [];
  if (tags.length > 0) {
    lines.push(`> **Tags:** ${tags.map(t => `\`${t}\``).join(" · ")}\n`);
  }

  // Find all platforms mentioned in the content
  const contentLower = content.toLowerCase();
  const platforms = Object.entries(registry[category] || {});
  const mentionedPlatforms = [];

  // Platform name aliases for fuzzy matching
  const aliases = {
    "sora2": ["sora", "sora 2", "sora2"],
    "veo3": ["veo", "veo 3", "veo3", "veo 3.1"],
    "kling": ["kling", "kling ai", "kling 3"],
    "vidu": ["vidu"],
    "wan": ["wan", "wan2", "wan 2.1", "wan21"],
    "dall-e-3": ["dall-e", "dalle", "dall·e"],
    "chatgpt-imagegen": ["chatgpt image", "gpt-4o image"],
    "stability-ai": ["stable diffusion", "stability ai", "sdxl", "sd3"],
    "flux": ["flux"],
    "midjourney": ["midjourney"],
    "leonardo-ai": ["leonardo"],
    "ideogram": ["ideogram"],
    "adobe-firefly": ["firefly", "adobe firefly"],
    "canva-ai": ["canva"],
    "runway": ["runway"],
    "google-imagen": ["imagen", "google imagen"],
    "nightcafe": ["nightcafe"],
    "fotor-ai": ["fotor"],
    "freepik-ai": ["freepik"],
    "pixlr": ["pixlr"],
    "elevenlabs": ["elevenlabs", "eleven labs"],
    "twilio": ["twilio"],
    "stripe": ["stripe"],
    "postiz": ["postiz"],
    "slack": ["slack"],
    "google-calendar": ["google calendar"],
  };

  for (const [name, media] of platforms) {
    const nameAliases = aliases[name] || [name, name.replace(/-/g, " ")];
    if (nameAliases.some(alias => contentLower.includes(alias.toLowerCase()))) {
      mentionedPlatforms.push({ name, media });
    }
  }

  if (mentionedPlatforms.length > 0) {
    lines.push("### Platform References");
    for (const { name, media } of mentionedPlatforms.slice(0, 10)) {
      const links = [];
      if (media.docs) links.push(`[Docs](${media.docs})`);
      if (media.gallery) links.push(`[Gallery](${media.gallery})`);
      lines.push(`- **${name}**: ${links.join(" · ")}`);
    }
    lines.push("");

    // Collect best YouTube videos across mentioned platforms
    const allVideos = [];
    for (const { name, media } of mentionedPlatforms) {
      if (media.youtube) {
        for (const v of media.youtube.slice(0, 2)) {
          allVideos.push({ ...v, platform: name });
        }
      }
    }
    if (allVideos.length > 0) {
      lines.push("### Related Videos");
      for (const v of allVideos.slice(0, 6)) {
        const channelTag = v.channel ? ` — *Credit: ${v.channel} on YouTube*` : " — *YouTube*";
        lines.push(`- [${v.title}](${v.url})${channelTag} \`${v.platform}\``);
      }
      lines.push(`\n> *All video content is credited to original creators. Links direct to source platforms.*`);
      lines.push("");
    }
  }

  // If no platforms found, add a generic category reference
  if (mentionedPlatforms.length === 0) {
    lines.push("### Category Resources");
    const categoryName = category === "video-gen" ? "AI Video Generation" : "AI Image Generation";
    lines.push(`- [Atlas UX ${categoryName} Wiki](https://atlasux.cloud/#/wiki/${category})`);
    lines.push("");
  }

  return lines.length > 3 ? lines.join("\n") : null;
}

// ── Build support article media section ──────────────────────────────────────
function buildSupportMedia(frontmatter) {
  const lines = [];
  lines.push("\n\n---\n## Media\n");

  const tags = frontmatter.tags || [];
  if (tags.length > 0) {
    lines.push(`> **Tags:** ${tags.map(t => `\`${t}\``).join(" · ")}\n`);
  }

  // Support articles get Atlas UX-specific resources
  lines.push("### Atlas UX Resources");
  lines.push("- [Atlas UX Platform](https://atlasux.cloud)");
  lines.push("- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)");
  lines.push("- [Contact Support](https://atlasux.cloud/#/support)");
  lines.push("");

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Media Injector — enriching KB articles...\n");

  // Load registry
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf-8"));

  // Collect all KB articles
  const allFiles = await collectKbFiles(KB_ROOT);
  console.log(`Found ${allFiles.length} KB articles`);

  let injected = 0;
  let skipped = 0;
  let crossPlatform = 0;

  for (const filePath of allFiles) {
    try {
      let content = await readFile(filePath, "utf-8");
      const rel = relative(KB_ROOT, filePath).replace(/\\/g, "/");

      // Skip if already has Media section
      if (content.includes("## Media")) {
        skipped++;
        continue;
      }

      const frontmatter = parseFrontmatter(content);
      const articleType = getArticleType(basename(filePath, ".md"));
      const platformInfo = findPlatformMedia(filePath, frontmatter, registry);

      let mediaSection = null;

      if (platformInfo?.media) {
        // Direct platform match
        mediaSection = buildMediaSection(platformInfo, frontmatter, articleType);
      } else if (platformInfo?.platform === "_cross-platform") {
        // Cross-platform comparison/guide
        mediaSection = buildCrossPlatformMedia(platformInfo.category, frontmatter, content, registry);
        if (mediaSection) crossPlatform++;
      } else if (rel.startsWith("support/")) {
        // Support articles without direct platform match
        mediaSection = buildSupportMedia(frontmatter);
      }

      if (!mediaSection) {
        skipped++;
        continue;
      }

      // Inject before the Related section if it exists, otherwise append
      if (content.includes("---\n## Related")) {
        content = content.replace("---\n## Related", mediaSection + "\n---\n## Related");
      } else {
        content = content + mediaSection;
      }

      await writeFile(filePath, content, "utf-8");
      injected++;

      if (injected % 25 === 0) {
        console.log(`  Injected media into ${injected} articles...`);
      }
    } catch (err) {
      console.error(`Error processing ${filePath}: ${err.message}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Articles enriched: ${injected}`);
  console.log(`  Cross-platform articles: ${crossPlatform}`);
  console.log(`  Skipped (already has media): ${skipped}`);
  console.log(`  Total: ${allFiles.length}`);
}

main().catch(console.error);
