import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Entry = { id: string; name: string; image: string; price: number; variations: { label: string; price: number; image?: string }[] };
const source = JSON.parse(readFileSync(new URL('../../backend/data/product-import.json', import.meta.url), 'utf8')) as { products: Entry[] };
const products = source.products.map((product, index) => ({ ...product, _id: (index + 1).toString(16).padStart(24, '0'), reviews: [], variations: product.variations.map((variant, position) => ({ ...variant, _id: (100 + index * 20 + position).toString(16).padStart(24, '0') })) }));
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('silonka_cookie_consent', 'declined'));
  await page.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/auth/profile') return route.fulfill({ status: 401, json: {} });
    if (pathname === '/api/products') return route.fulfill({ json: products });
    if (pathname.endsWith('/related')) return route.fulfill({ json: [] });
    if (pathname.startsWith('/api/products/')) return route.fulfill({ json: products.find(product => pathname.endsWith(product._id)) });
    return route.fulfill({ json: {} });
  });
  await page.route(/https:\/\/(accounts\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
});

test('imported catalogue has nine products, loaded images and unconverted sample USD prices', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.getByText('Showing 9 products')).toBeVisible();
  await expect(page.getByText('Sample price', { exact: true })).toHaveCount(9);
  const powder = page.locator('.group').filter({ has: page.getByRole('link', { name: 'Organic Ceylon Cinnamon Powder', exact: true }) });
  await expect(powder).toContainText('$4.50');
  const images = page.locator('a[href^="/product/"] > img');
  await expect(images).toHaveCount(9);
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('bark oil offers all eight size and strength combinations at sample USD prices', async ({ page }) => {
  const product = products.find(p => p.id === 'silonka-cinnamon-bark-oil')!;
  await page.goto(`/product/${product._id}`);
  await expect(page.getByRole('button', { name: /cinnamaldehyde/ })).toHaveCount(8);
  await page.getByRole('button', { name: /100 ml.*More than 80%/i }).click();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}'));
  expect(cart.items[0]).toMatchObject({ variationId: product.variations[7]._id, price: 99, variant: '100 ml · More than 80% cinnamaldehyde' });
});

test('selecting a pet size updates its image and retains the size in the cart', async ({ page }) => {
  const product = products.find(p => p.id === 'silonka-cinnachew')!;
  await page.goto(`/product/${product._id}`);
  await page.getByRole('button', { name: /^Large/ }).click();
  await expect(page.locator('.product-image-main > div > img')).toHaveAttribute('src', '/products/cinnachew-large.webp');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}'));
  expect(cart.items[0]).toMatchObject({ variationId: product.variations[2]._id, price: 16.5, image: '/products/cinnachew-large.webp', variant: 'Large' });
});
