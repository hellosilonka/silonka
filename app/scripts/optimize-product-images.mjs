import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sources = path.join(root, 'products');
const destination = path.join(root, 'app/public/products');
const groups = {
  'Cinnamon Wood Natural Bird Chew': 'cinnabeak',
  'Cinnamon Wood Platform Bird Chew Perch': 'cinnaledge',
  'dog chew': 'cinnachew',
  'wood + coco rop': 'cinnatug',
  reference: 'reference',
};
const manifest = [];
await fs.mkdir(destination, { recursive: true });
for (const [folder, slug] of Object.entries(groups)) {
  const counters = new Map();
  async function walk(relative = '') {
    const entries = (await fs.readdir(path.join(sources, folder, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const nested = path.join(relative, entry.name);
      if (entry.isDirectory()) { await walk(nested); continue; }
      if (!/\.(jpe?g|png|webp)$/i.test(entry.name)) continue;
      const stem = slug === 'reference' ? path.parse(entry.name).name : `${slug}-${relative || path.parse(entry.name).name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const number = (counters.get(stem) || 0) + 1;
      counters.set(stem, number);
      const filename = `${stem}${number > 1 ? `-${number}` : ''}.webp`;
      const input = path.join(sources, folder, nested);
      const output = path.join(destination, filename);
      // Preserve framing, orientation and legible size charts; remove bulky metadata.
      const chart = /size chart/i.test(entry.name);
      const info = await sharp(input).rotate().resize({ width: chart ? 1600 : 1200, height: chart ? 1600 : 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: chart ? 88 : 80, effort: 6 }).toFile(output);
      manifest.push({ source: path.relative(root, input).replaceAll('\\', '/'), image: `/products/${filename}`, originalBytes: (await fs.stat(input)).size, optimizedBytes: info.size, width: info.width, height: info.height, reference: slug === 'reference' });
    }
  }
  await walk();
}
await fs.writeFile(path.join(root, 'backend/data/product-images.json'), JSON.stringify(manifest, null, 2) + '\n');
const totals = manifest.reduce((sum, item) => ({ original: sum.original + item.originalBytes, optimized: sum.optimized + item.optimizedBytes }), { original: 0, optimized: 0 });
console.log(JSON.stringify({ images: manifest.length, ...totals, reduction: `${(100 * (1 - totals.optimized / totals.original)).toFixed(1)}%` }));
