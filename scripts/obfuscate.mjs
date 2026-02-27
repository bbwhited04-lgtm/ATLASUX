#!/usr/bin/env node
/**
 * Post-build obfuscation script.
 * Runs javascript-obfuscator on every .js file in dist/assets/
 * AFTER Vite has finished building — avoids import.meta.glob conflicts.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const ASSETS_DIR = join(process.cwd(), 'dist', 'assets');

// Skip chunks that break under obfuscation (Three.js uses heavy
// dynamic property access / destructuring that gets mangled).
const SKIP_PATTERNS = ['three-vendor', 'react-vendor'];

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayThreshold: 0.5,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

async function main() {
  const files = await readdir(ASSETS_DIR);
  const jsFiles = files.filter((f) => f.endsWith('.js') && !SKIP_PATTERNS.some((p) => f.includes(p)));

  console.log(`Obfuscating ${jsFiles.length} JS files...`);

  for (const file of jsFiles) {
    const filePath = join(ASSETS_DIR, file);
    const code = await readFile(filePath, 'utf-8');
    try {
      const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS);
      await writeFile(filePath, result.getObfuscatedCode(), 'utf-8');
      console.log(`  ✓ ${file}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  console.log('Obfuscation complete.');
}

main().catch((err) => {
  console.error('Obfuscation failed:', err);
  process.exit(1);
});
