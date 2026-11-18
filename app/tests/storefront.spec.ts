import { test, expect, type Page } from '@playwright/test';

const productId = '333333333333333333333333';
const variantId = '444444444444444444444444';
const orderId = '555555555555555555555555';
const user = { _id: '111111111111111111111111', name: 'Test Customer', email: 'buyer@example.test', isAdmin: false, createdAt: '2026-01-01' };
const product = { _id: productId, id: 'cinnamon', name: 'Ceylon Cinnamon', description: 'Fresh cinnamon', longDescription: 'Pure cinnamon.', price: 10.25, weight: '100g', shippingWeightKg: 1.2, category: 'Ceylon Cinnamon', image: '/cinnamon_signature.webp', inStock: true, images: [], reviews: [], variations: [{ _id: variantId, label: '250g', price: 21.5, inStock: true }] };
const cartItem = { id: productId, name: product.name, price: product.price, image: product.image, quantity: 1, shippingWeightKg: 1.2 };
async function fixtures(page: Page, signedIn = true) {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body: unknown = {};
    if (url.pathname === '/api/auth/profile') { if (!signedIn) return route.fulfill({ status: 401, json: { message: 'Please sign in.' } }); body = user; }
    else if (url.pathname === '/api/auth/login') body = user;
    else if (url.pathname === '/api/products') body = [product];
    else if (url.pathname === '/api/blogs' || url.pathname === '/api/categories') body = [];
    else if (url.pathname.endsWith('/related')) body = [];
    else if (url.pathname.startsWith('/api/products/')) body = product;
    else if (url.pathname === '/api/payment/config') body = { available: true, mode: 'sandbox', currency: 'USD' };
    else if (url.pathname === '/api/orders/quote') body = { quoteToken: 'signed-fixture', currency: 'USD', itemsPrice: 10.25, shippingPrice: 12, taxPrice: 0, totalPrice: 22.25, expiresAt: Date.now() + 60000 };
    else if (url.pathname === '/api/orders' && route.request().method() === 'POST') body = { _id: orderId };
    else if (url.pathname === '/api/payment/payhere/create') body = { action: 'https://sandbox.payhere.lk/pay/checkout', fields: { order_id: orderId, amount: '22.25', currency: 'USD', hash: 'test-checksum' } };
    else if (url.pathname === '/api/orders/myorders') body = [];
    else if (url.pathname === '/api/contact') body = { message: 'Sent' };
    else return route.fulfill({ status: 404, json: { message: 'Missing test fixture' } });
    await route.fulfill({ json: body });
  });
  // Tests never contact identity, email or payment providers.
  await page.route(/https:\/\/(accounts\.google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
}
async function seedCart(page: Page, item = cartItem) {
  await page.addInitScript(({ item }) => {
    if (!localStorage.getItem('silonka_cart_usd_v3')) localStorage.setItem('silonka_cart_usd_v3', JSON.stringify({ items: [item], completedOrders: [] }));
    localStorage.setItem('silonka_cookie_consent', 'declined');
  }, { item });
}
async function address(page: Page) {
  await page.getByLabel('Phone with country code').fill('+441234567890');
  await page.getByLabel('Street address').fill('1 Main Street');
  await page.getByLabel('City', { exact: true }).fill('London');
  await page.getByLabel('Postal code').fill('SW1A 1AA');
  await page.getByLabel('Country', { exact: true }).selectOption('GB');
}
test.beforeEach(async ({ page }) => fixtures(page));

test('cart survives refresh and the drawer supports Escape and accessible quantity controls', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('button', { name: /add to cart/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /increase quantity/i }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await page.goto('/checkout');
  await expect(page.getByText('· Qty 2', { exact: false })).toBeVisible();
});

test('checkout quotes the complete address and redirects with the server payment fields', async ({ page }) => {
  await seedCart(page);
  let submitted = '';
  await page.route('https://sandbox.payhere.lk/pay/checkout', async route => { submitted = route.request().postData() || ''; await route.fulfill({ contentType: 'text/html', body: '<h1>Test payment provider</h1>' }); });
  await page.goto('/checkout'); await address(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your order' })).toBeVisible();
  await page.getByRole('button', { name: /Pay \$22\.25 with PayHere/ }).click();
  await expect(page.getByRole('heading', { name: 'Test payment provider' })).toBeVisible();
  const fields = new URLSearchParams(submitted);
  expect(fields.get('amount')).toBe('22.25'); expect(fields.get('currency')).toBe('USD'); expect(fields.get('order_id')).toBe(orderId);
});

test('shipping failure remains visible and does not allow free checkout', async ({ page }) => {
  await seedCart(page);
  await page.route('**/api/orders/quote', route => route.fulfill({ status: 503, json: { message: 'Shipping unavailable. Please try again.' } }));
  await page.goto('/checkout'); await address(page); await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Shipping unavailable');
  await expect(page.getByRole('button', { name: /with PayHere/ })).toHaveCount(0);
});

test('a verified payment clears only purchased items and repeat returns preserve new purchases', async ({ page }) => {
  await seedCart(page);
  await page.route(`**/api/orders/${orderId}`, route => route.fulfill({ json: { _id: orderId, isPaid: true, paymentStatus: 'paid', currency: 'USD', totalPrice: 22.25, orderItems: [{ product: productId, qty: 1 }] } }));
  await page.goto(`/checkout/result?order=${orderId}`);
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}').items.length)).toBe(0);
  await page.goto('/shop'); await page.getByRole('button', { name: /add to cart/i }).first().click(); await page.keyboard.press('Escape');
  await page.goto(`/checkout/result?order=${orderId}`);
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}').items.length)).toBe(1);
});

test('cancelled and forged success URLs never clear the cart or claim payment success', async ({ page }) => {
  await seedCart(page);
  await page.route(`**/api/orders/${orderId}`, route => route.fulfill({ json: { _id: orderId, isPaid: false, paymentStatus: 'cancelled', orderItems: [{ product: productId, qty: 1 }] } }));
  await page.goto(`/checkout/result?order=${orderId}&cancelled=1&paid=true`);
  await expect(page.getByRole('heading', { name: 'Payment was not completed' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}').items.length)).toBe(1);
});

test('mobile checkout has no horizontal overflow and uses labelled fields', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await seedCart(page);
  await page.goto('/checkout'); await address(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByLabel('Full name')).toHaveValue(user.name);
  await page.screenshot({ path: 'test-results/checkout-mobile.png', fullPage: true });
});

test('contact reports delivery failure instead of showing a false success', async ({ page }) => {
  await page.route('**/api/contact', route => route.fulfill({ status: 503, json: { message: 'Email delivery unavailable.' } }));
  await page.goto('/contact');
  await page.getByLabel('Name', { exact: true }).fill('Test Customer');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Subject', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Message', { exact: true }).fill('Please tell me about this product.');
  await page.getByRole('button', { name: 'Send Message' }).click();
  await expect(page.getByRole('alert')).toContainText('Email delivery unavailable');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Please tell me about this product.');
});

test('unknown routes show a usable not-found page', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse the shop' })).toHaveAttribute('href', '/shop');
});

test('product options and selected quantity are retained in the cart', async ({ page }) => {
  await page.goto(`/product/${productId}`);
  await page.getByRole('button', { name: 'Increase product quantity' }).click();
  await page.getByRole('button', { name: 'Increase product quantity' }).click();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem('silonka_cart_usd_v3') || '{}').items);
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ id: productId, variationId: variantId, quantity: 3, price: 21.5 });
});

test('admin shows full summary totals and paid-only shipping actions', async ({ page }) => {
  await page.route('**/api/auth/profile', route => route.fulfill({ json: { ...user, isAdmin: true } }));
  await page.route('**/api/orders/summary', route => route.fulfill({ json: { totalOrders: 42, pendingOrders: 7, revenue: 1234.5, products: 1, inStock: 1, bulkOrders: 0, pendingBulk: 0 } }));
  for (const path of ['/categories', '/blogs?admin=true']) await page.route(`**/api${path}`, route => route.fulfill({ json: [] }));
  for (const path of ['/bulk-orders*', '/auth/users*']) await page.route(`**/api${path}`, route => route.fulfill({ json: { users: [], bulkOrders: [], page: 1, pages: 1 } }));
  await page.route(/\/api\/orders\?/, route => route.fulfill({ json: { orders: [true, false].map((isPaid, index) => ({ _id: index ? '666666666666666666666666' : orderId, user, isPaid, paymentStatus: isPaid ? 'paid' : 'pending', isDelivered: false, currency: 'USD', totalPrice: 22.25, createdAt: '2026-11-17', shippingWeightKg: 1.2, shippingAddress: { fullName: user.name, address: '1 Main Street', city: 'London', country: 'United Kingdom', postalCode: 'SW1A 1AA' }, orderItems: [{ name: product.name, qty: 1, price: 10.25 }], dhl: {} })), page: 1, pages: 1 } }));
  await page.goto('/admin');
  await expect(page.getByText('USD 1234.50', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Orders\b/ }).click();
  await expect(page.getByRole('button', { name: 'Create DHL shipment' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Mark Delivered' })).toHaveCount(1);
  await page.getByText('Order details', { exact: true }).first().click();
  await expect(page.getByText(/1 Main Street, London/).first()).toBeVisible();
});


test('checkout review displays current server prices and allows clearing prefilled contact fields', async ({ page }) => {
  await seedCart(page);
  await page.route('**/api/orders/quote', route => route.fulfill({ json: { quoteToken: 'test', currency: 'USD', itemsPrice: 15, shippingPrice: 12, taxPrice: 0, totalPrice: 27, expiresAt: Date.now() + 60000, orderItems: [{ product: productId, qty: 1, name: product.name, image: product.image, price: 15 }] } }));
  await page.goto('/checkout');
  await page.getByLabel('Full name').fill(''); await expect(page.getByLabel('Full name')).toHaveValue('');
  await page.getByLabel('Full name').fill(user.name); await address(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByText('Product prices have been updated', { exact: false })).toBeVisible();
  await expect(page.locator('aside li')).toContainText('$15.00');
  await expect(page.locator('aside')).not.toContainText('$10.25');
});

test('payment status cannot show the previous order confirmation after navigating to another order', async ({ page }) => {
  const nextOrder = '666666666666666666666666';
  await page.route(`**/api/orders/${orderId}`, route => route.fulfill({ json: { _id: orderId, isPaid: true, paymentStatus: 'paid', orderItems: [] } }));
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/orders/${nextOrder}`, async route => { await pending; await route.fulfill({ json: { _id: nextOrder, isPaid: false, paymentStatus: 'cancelled', orderItems: [] } }); });
  await page.goto(`/checkout/result?order=${orderId}`);
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
  await page.evaluate(url => { history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); }, `/checkout/result?order=${nextOrder}`);
  await expect(page.getByRole('heading', { name: 'Checking your payment' })).toBeVisible();
  release();
  await expect(page.getByRole('heading', { name: 'Payment was not completed' })).toBeVisible();
});

test('a late session check cannot sign out a customer who has just logged in', async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/auth/profile', async route => { await pending; await route.fulfill({ status: 401, json: { message: 'Old unauthenticated request' } }); });
  await seedCart(page); await page.goto('/login?redirect=%2Fcheckout');
  await page.getByLabel('Email', { exact: true }).fill(user.email); await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Delivery details' })).toBeVisible();
  const completed = page.waitForResponse(response => response.url().endsWith('/api/auth/profile'));
  release(); await completed;
  await expect(page.getByRole('heading', { name: 'Delivery details' })).toBeVisible();
});

test('journal failure shows retry and recovers without an empty-success screen', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/blogs', route => route.fulfill(++attempts === 1 ? { status: 503, json: { message: 'Unavailable' } } : { json: [] }));
  await page.goto('/blog');
  await expect(page.getByRole('alert')).toContainText('could not load');
  await page.getByRole('button', { name: 'Retry loading journal' }).click();
  await expect(page.getByText('No articles found', { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test('bulk enquiries reject incomplete rows instead of silently dropping requested products', async ({ page }) => {
  let saves = 0;
  await page.route('**/api/bulk-orders', route => { saves++; return route.fulfill({ status: 503, json: { message: 'Please try again later.' } }); });
  await page.goto('/bulk-order');
  await page.getByLabel('Company Name', { exact: false }).fill('Test Store');
  await page.getByLabel('Contact Person', { exact: false }).fill('Test Buyer');
  await page.getByLabel('Email Address', { exact: false }).fill(user.email);
  await page.getByLabel('Phone Number', { exact: false }).fill('+441234567890');
  await page.getByLabel('Product 1 name', { exact: true }).fill('Cinnamon');
  await page.getByLabel('Product 1 quantity', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Add Another Product' }).click();
  await page.getByLabel('Product 2 name', { exact: true }).fill('Pepper');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole('alert')).toContainText('Complete each product row'); expect(saves).toBe(0);
  await page.getByLabel('Product 2 quantity', { exact: true }).fill('5');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole('alert')).toContainText('Please try again later'); expect(saves).toBe(1);
  await expect(page.getByLabel('Product 2 name', { exact: true })).toHaveValue('Pepper');
});

test('tracking follows browser history and reports service failures accurately', async ({ page }) => {
  await page.route('**/api/dhl/track/1234567890', route => route.fulfill({ status: 503, json: { message: 'Tracking is temporarily unavailable. Please try again.' } }));
  await page.route('**/api/dhl/track/9999999999', route => route.fulfill({ json: { awbNumber: '9999999999', status: 'Delivered', events: [{ date: '2026-11-17', time: '120000', location: 'London', description: 'Delivered', code: 'OK' }] } }));
  await page.goto('/track?awb=1234567890');
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.getByLabel('DHL tracking number').fill('9999999999'); await page.getByRole('button', { name: 'Track', exact: true }).click();
  await expect(page.getByText('London', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  await page.goBack();
  await expect(page.getByLabel('DHL tracking number')).toHaveValue('1234567890');
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
});

test('public routes render without application errors or mobile horizontal overflow', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('silonka_cookie_consent', 'declined'));
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ['/', '/shop', '/origins', '/craft', '/contact', '/blog', '/bulk-order', '/login', '/signup', '/track', '/privacy-policy', '/refund-policy', '/terms-and-conditions']) {
    await page.goto(route);
    await expect(page.locator('h1').first(), route).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
  }
  expect(errors).toEqual([]);
});
