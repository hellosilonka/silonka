// Script to convert all JPG/PNG images in public/ to WebP
// Run: node scripts/convert-to-webp.mjs

import sharp from 'sharp';
import { readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

// Images to skip (not worth converting or are UI icons)
const SKIP = new Set(['favicon.png', 'logo.png']);

const files = readdirSync(publicDir).filter(f => {
  const ext = extname(f).toLowerCase();
  return (ext === '.jpg' || ext === '.jpeg' || ext === '.png') && !SKIP.has(f);
});

console.log(`Converting ${files.length} images to WebP...\n`);

for (const file of files) {
  const inputPath = join(publicDir, file);
  const outputName = basename(file, extname(file)) + '.webp';
  const outputPath = join(publicDir, outputName);

  if (existsSync(outputPath)) {
    console.log(`  ✓ Already exists: ${outputName}`);
    continue;
  }

  try {
    const info = await sharp(inputPath)
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);
    
    const { size: inputSize } = await import('fs').then(m => Promise.resolve({ size: m.statSync(inputPath).size }));
    const savings = Math.round((1 - info.size / inputSize) * 100);
    console.log(`  ✓ ${file} → ${outputName} (${Math.round(info.size / 1024)} KB, saved ${savings}%)`);
  } catch (err) {
    console.error(`  ✗ Failed: ${file} — ${err.message}`);
  }
}

console.log('\nDone!');
