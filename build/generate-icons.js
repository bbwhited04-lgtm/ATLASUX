#!/usr/bin/env node
/**
 * Generate app icons from SVG for electron-builder.
 *
 * Requires: npm i -D sharp (or run `npx sharp ...`)
 *
 * Usage:  node build/generate-icons.js
 *
 * Produces:
 *   build/icon.png   (1024x1024 — electron-builder auto-converts to .ico/.icns)
 *   build/icons/16x16.png … 512x512.png  (Linux)
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Atlas wireframe robot as SVG — head + heartbeat core only (works as an icon)
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9"/>
      <stop offset="70%" stop-color="#06b6d4" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="256" cy="256" r="250" fill="url(#bg)" stroke="#06b6d4" stroke-width="4" opacity="0.95"/>

  <!-- Head -->
  <ellipse cx="256" cy="145" rx="90" ry="95" stroke="#06b6d4" stroke-width="5" fill="none" opacity="0.85"/>
  <ellipse cx="256" cy="145" rx="64" ry="70" stroke="#06b6d4" stroke-width="2" fill="none" opacity="0.3"/>

  <!-- Eyes -->
  <line x1="211" y1="132" x2="237" y2="132" stroke="#22d3ee" stroke-width="10" stroke-linecap="round" opacity="0.95"/>
  <line x1="275" y1="132" x2="301" y2="132" stroke="#22d3ee" stroke-width="10" stroke-linecap="round" opacity="0.95"/>
  <circle cx="224" cy="132" r="4" fill="#67e8f9" opacity="0.6"/>
  <circle cx="288" cy="132" r="4" fill="#67e8f9" opacity="0.6"/>

  <!-- Mouth -->
  <path d="M230 170 Q256 185 282 170" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4"/>

  <!-- Neck -->
  <line x1="237" y1="240" x2="237" y2="270" stroke="#06b6d4" stroke-width="4" opacity="0.5"/>
  <line x1="275" y1="240" x2="275" y2="270" stroke="#06b6d4" stroke-width="4" opacity="0.5"/>

  <!-- Torso -->
  <path d="M155 270 L357 270 L370 430 Q256 455 142 430 Z" stroke="#06b6d4" stroke-width="5" fill="none" opacity="0.7"/>
  <path d="M180 285 L332 285 L342 415 Q256 432 170 415 Z" stroke="#06b6d4" stroke-width="2" fill="none" opacity="0.3"/>

  <!-- Shoulders -->
  <path d="M155 270 Q115 275 78 300" stroke="#06b6d4" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M357 270 Q397 275 434 300" stroke="#06b6d4" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6"/>

  <!-- Heartbeat core glow -->
  <circle cx="256" cy="350" r="50" fill="url(#core)"/>
  <!-- Core diamond -->
  <path d="M256 312 L288 350 L256 388 L224 350 Z" stroke="#06b6d4" stroke-width="4" fill="#06b6d4" fill-opacity="0.2"/>
  <!-- Inner dot -->
  <circle cx="256" cy="350" r="12" fill="#06b6d4" opacity="0.9"/>

  <!-- Energy lines from core -->
  <line x1="256" y1="312" x2="256" y2="270" stroke="#06b6d4" stroke-width="2" opacity="0.4" stroke-dasharray="8 8"/>
  <line x1="288" y1="350" x2="340" y2="350" stroke="#06b6d4" stroke-width="2" opacity="0.3" stroke-dasharray="8 8"/>
  <line x1="224" y1="350" x2="172" y2="350" stroke="#06b6d4" stroke-width="2" opacity="0.3" stroke-dasharray="8 8"/>
</svg>`;

// Write the SVG — electron-builder can use it as source for icon conversion
const svgPath = join(__dirname, "icon.svg");
writeFileSync(svgPath, SVG);
console.log(`Wrote ${svgPath}`);

// Try to use sharp if available for PNG conversion
try {
  const { default: sharp } = await import("sharp");
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

  // Main icon (1024x1024)
  await sharp(Buffer.from(SVG)).resize(1024, 1024).png().toFile(join(__dirname, "icon.png"));
  console.log("Wrote build/icon.png (1024x1024)");

  // Linux icons
  for (const s of sizes) {
    await sharp(Buffer.from(SVG)).resize(s, s).png().toFile(join(__dirname, "icons", `${s}x${s}.png`));
  }
  console.log(`Wrote ${sizes.length} Linux icon sizes to build/icons/`);

  console.log("\nDone! electron-builder will auto-convert icon.png to .ico and .icns");
} catch {
  console.log("\nsharp not installed — wrote SVG only.");
  console.log("To generate PNGs: npm i -D sharp && node build/generate-icons.js");
  console.log("Or manually convert build/icon.svg to build/icon.png (1024x1024)");
}
