import { test, expect, type Page } from '@playwright/test';

const id = '333333333333333333333333';
const optionId = '444444444444444444444444';
const category = { _id: '777777777777777777777777', name: 'Ceylon Cinnamon', slug: 'cinnamon', description: 'Our cinnamon collection' };
const product = { _id: id, id: 'cinnamon', name: 'Ceylon Cinnamon Quills', description: 'Hand-selected cinnamon from Sri Lanka.', longDescription: 'A delicate, fragrant spice.', price: 12.5, weight: '100 g', shippingWeightKg: 0.35, category: category.name, image: '/cinnamon_signature.webp', images: ['/cinnamon_detail.webp'], inStock: true, origin: 'Sri Lanka', ingredients: 'Cinnamon', shelfLife: '24 months', certifications: [], intensity: 3, variations: [{ _id: optionId, label: '250 g', price: 25, shippingWeightKg: 0.65, inStock: true }] };
const png = { name: 'cinnamon.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=', 'base64') };

async function setup(page: Page) {
  const calls: string[] = [];
  await page.addInitScript(() => localStorage.setItem('silonka_cookie_consent', 'declined'));
  await page.route(/https:\/\/(accounts\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    calls.push(`${route.request().method()} ${path}`);
    let body: unknown;
    if (path === '/api/auth/profile') body = { _id: '111111111111111111111111', name: 'Amaya Perera', email: 'admin@example.test', isAdmin: true };
    else if (path === '/api/orders/summary') body = { totalOrders: 128, pendingOrders: 8, awaitingFulfillment: 5, revenue: 6428.5, products: 24, inStock: 21, bulkOrders: 12, pendingBulk: 3 };
    else if (path === '/api/orders') body = { orders: ['Amelia Lewis', 'James Anderson', 'Sophie Martin', 'Oliver Brown', 'Isla Wilson'].map((name, index) => ({ _id: `${index}55555555555555555555555`, user: { name, email: 'buyer@example.test' }, totalPrice: 28.5 + index * 12, currency: 'USD', isPaid: index !== 2, paymentStatus: index === 2 ? 'pending' : 'paid', isDelivered: false, createdAt: '2026-11-17' })), page: 1, pages: 1 };
    else if (path === '/api/products') body = [product];
    else if (path === '/api/categories') body = [category];
    else if (path === '/api/blogs') body = [];
    else if (path === '/api/auth/users') body = { users: [], page: 1, pages: 1 };
    else if (path === '/api/bulk-orders') body = { orders: [], page: 1, pages: 1 };
    else return route.fulfill({ status: 404, json: { message: 'No fixture' } });
    await route.fulfill({ json: body });
  });
  return calls;
}
async function openNew(page: Page) {
  await page.goto('/admin?tab=products');
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add a new product' })).toBeVisible();
}
async function fillNew(page: Page) {
  await page.getByLabel('Product name', { exact: false }).fill('New Cinnamon');
  await page.getByLabel('Short description', { exact: false }).fill('A warm, fragrant cinnamon for everyday cooking.');
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption(category.name);
  await page.getByLabel('Base price (USD)', { exact: false }).fill('15.50');
  await page.getByLabel('Pack size', { exact: false }).fill('200 g');
  await page.getByLabel('Packed shipping weight (kg)', { exact: false }).fill('0.450');
  await page.getByLabel('Upload cover image', { exact: true }).setInputFiles(png);
}

test('overview loads only its own data and sections stay cached until refreshed', async ({ page }) => {
  const calls = await setup(page);
  await page.goto('/admin');
  await expect(page.getByText('USD 6428.50', { exact: true })).toBeVisible();
  expect(calls).not.toContain('GET /api/products'); expect(calls).not.toContain('GET /api/auth/users'); expect(calls).not.toContain('GET /api/blogs');
  await page.screenshot({ path: 'test-results/admin-overview-desktop.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('button', { name: 'Products', exact: true }).click();
  await expect(page.getByRole('button', { name: product.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('button', { name: 'Products', exact: true }).click();
  expect(calls.filter(call => call === 'GET /api/products')).toHaveLength(1);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect.poll(() => calls.filter(call => call === 'GET /api/products').length).toBe(2);
});

test('product form validates fields and uploads, retains failed saves, and blocks duplicate submissions', async ({ page }) => {
  await setup(page); await openNew(page);
  await page.getByRole('button', { name: 'Create product', exact: true }).click();
  await expect(page.getByText('Give your product a name.')).toBeVisible();
  await expect(page.getByLabel('Product name', { exact: false })).toBeFocused();
  await page.getByLabel('Upload cover image', { exact: true }).setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByText('Choose a JPG, PNG, WebP or AVIF image.')).toBeVisible();
  await fillNew(page);
  let saves = 0;
  await page.route('**/api/products', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    saves++; await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ status: 503, json: { message: 'Image service is unavailable. Please try again.' } });
  });
  await page.getByRole('button', { name: 'Create product', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert').filter({ hasText: 'Product not saved' })).toBeVisible();
  expect(saves).toBe(1);
  await expect(page.getByLabel('Product name', { exact: false })).toHaveValue('New Cinnamon');
  await expect(page.getByAltText('Cover preview')).toBeVisible();
});

test('deleting a bulk enquiry invalidates cached overview totals', async ({ page }) => {
  const calls = await setup(page);
  let deleted = false;
  await page.route('**/api/bulk-orders**', async route => {
    if (route.request().method() === 'DELETE') {
      deleted = true;
      return route.fulfill({ json: { message: 'Enquiry deleted' } });
    }
    return route.fulfill({ json: { orders: deleted ? [] : [{ _id: '999999999999999999999999', companyName: 'Test Tea House', contactName: 'Sam', email: 'sam@example.test', phone: '', status: 'pending', createdAt: '2026-11-17', products: [] }], page: 1, pages: 1 } });
  });
  await page.goto('/admin');
  await expect(page.getByText('USD 6428.50', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('button', { name: /Bulk enquiries/ }).click();
  await page.getByRole('checkbox', { name: 'Select enquiry from Test Tea House' }).check();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete 1 Selected' }).click();
  await expect(page.getByText('No bulk inquiries yet.', { exact: true })).toBeVisible();
  expect(deleted).toBe(true);
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect.poll(() => calls.filter(call => call === 'GET /api/orders/summary').length).toBe(2);
});

test('new product saves selected options and packed weights without refetching the catalogue', async ({ page }) => {
  const calls = await setup(page); await openNew(page); await fillNew(page);
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByLabel('Option name', { exact: false }).fill('500 g');
  await page.getByLabel('Option price (USD)', { exact: false }).fill('25.50');
  await page.getByLabel('Option packed weight (kg)', { exact: true }).fill('0.850');
  let fields: FormData | undefined;
  await page.route('**/api/products', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    fields = await new Response(route.request().postDataBuffer(), { headers: { 'Content-Type': route.request().headers()['content-type'] } }).formData();
    await route.fulfill({ status: 201, json: { ...product, _id: '888888888888888888888888', name: String(fields.get('name')), price: 15.5 } });
  });
  await page.screenshot({ path: 'test-results/admin-product-editor-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Create product', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New Cinnamon', exact: true })).toBeVisible();
  expect(fields?.get('shippingWeightKg')).toBe('0.450');
  expect(JSON.parse(String(fields?.get('variations')))).toEqual([{ label: '500 g', price: 25.5, shippingWeightKg: 0.85, inStock: true }]);
  expect(calls.filter(call => call === 'GET /api/products')).toHaveLength(1);
});

test('editing preserves option IDs and image removals and can clear optional intensity', async ({ page }) => {
  await setup(page); await page.goto('/admin?tab=products');
  await page.getByRole('button', { name: `Edit ${product.name}`, exact: true }).click();
  await expect(page.getByLabel('Option packed weight (kg)', { exact: true })).toHaveValue('0.65');
  await page.getByRole('button', { name: 'Remove gallery image 1', exact: true }).click();
  await page.getByText('More product information', { exact: false }).click();
  await page.getByLabel('Intensity (1–5)').selectOption('');
  let fields: FormData | undefined;
  await page.route(`**/api/products/${id}`, async route => {
    fields = await new Response(route.request().postDataBuffer(), { headers: { 'Content-Type': route.request().headers()['content-type'] } }).formData();
    await route.fulfill({ json: { ...product, images: [], intensity: undefined } });
  });
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(JSON.parse(String(fields?.get('variations')))[0]._id).toBe(optionId);
  expect(JSON.parse(String(fields?.get('removeImages')))).toEqual(product.images);
  expect(fields?.get('intensity')).toBe('');
});

test('unsaved edits require confirmation before closing and can be kept', async ({ page }) => {
  await setup(page); await openNew(page);
  await page.getByLabel('Product name', { exact: false }).fill('Keep this name');
  await page.getByRole('button', { name: 'Close product editor' }).click();
  await expect(page.getByRole('dialog', { name: 'Discard your changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByLabel('Product name', { exact: false })).toHaveValue('Keep this name');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mobile navigation, catalogue and editor fit the viewport', async ({ page }) => {
  await setup(page); await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog', { name: 'Store navigation' }).getByRole('button', { name: 'Products', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: product.name, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/admin-catalog-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await fillNew(page);
  const bounds = await page.getByRole('dialog', { name: 'Add a new product' }).boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(375);
  await expect(page.getByRole('button', { name: 'Create product', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-product-editor-mobile.png', fullPage: true });
});
