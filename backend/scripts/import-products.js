import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { productInput, productImage } from '../utils/productInput.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const apply = process.argv.includes('--apply');
const catalog = JSON.parse(await fs.readFile(new URL('../data/product-import.json', import.meta.url), 'utf8'));
try {
  if (catalog.currency !== 'USD') throw new Error('The catalogue import must use USD.');
  const ids = new Set();
  const prepared = [];
  for (const item of catalog.products) {
    if (ids.has(item.id)) throw new Error(`Duplicate product id: ${item.id}`);
    ids.add(item.id);
    const validated = productInput(item);
    if (item.images.length > 6) throw new Error(`Too many gallery images: ${item.name}`);
    for (const image of [item.image, ...item.images, ...item.variations.map(v => v.image)].filter(Boolean)) {
      productImage(image);
      if (!/^\/products\/[a-z0-9-]+\.webp$/.test(image)) throw new Error(`Unexpected import image: ${image}`);
      await fs.access(new URL(`../../app/public${image}`, import.meta.url));
    }
    const product = new Product({ ...item, ...validated });
    await product.validate();
    prepared.push(product);
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'validate only', products: prepared.length, options: prepared.reduce((count, product) => count + product.variations.length, 0), currency: catalog.currency }));
  if (apply) {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false, autoCreate: false });
    let created = 0, retained = 0;
    for (const product of prepared) {
      // Insert-only: rerunning never overwrites finalized prices, reviews or option IDs.
      if (await Product.exists({ $or: [{ id: product.id }, { name: product.name }] })) { retained++; continue; }
      const slug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await Category.updateOne({ name: product.category }, { $setOnInsert: { name: product.category, slug, description: '' } }, { upsert: true });
      await product.save();
      created++;
    }
    console.log(JSON.stringify({ created, retained, totalImported: await Product.countDocuments({ id: { $in: [...ids] } }) }));
  }
} catch (error) {
  // Do not expose connection URLs or credentials in error logs.
  console.error(error instanceof mongoose.Error ? `${error.name}: import failed; check database access and catalogue validation.` : error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
