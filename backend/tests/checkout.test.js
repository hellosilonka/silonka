import test, { before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { catalogueItems, shippingAddress, quoteCheckout, verifyQuote, checkoutFingerprint, signQuote } from '../utils/checkout.js';
import { paymentHash, notificationHash, verifyNotification, payhereConfig } from '../utils/payhere.js';
import { dhlEndpoint } from '../utils/dhlService.js';
import { createApp } from '../app.js';

const userId = '111111111111111111111111', otherUser = '222222222222222222222222';
const productId = '333333333333333333333333', variantId = '444444444444444444444444', orderId = '555555555555555555555555';
const address = { fullName: 'Test Customer', email: 'buyer@example.test', phone: '+441234567890', address: '1 Main Street', city: 'London', postalCode: 'SW1A 1AA', country: 'United Kingdom', countryCode: 'GB' };
const product = { _id: productId, name: 'Cinnamon', price: 10.25, image: '/cinnamon.webp', inStock: true, weight: '100g', shippingWeightKg: 1.2, variations: [{ _id: variantId, label: '250g', price: 21.5, inStock: true }] };
const buyer = { _id: userId, name: 'Test Customer', email: address.email, isAdmin: false };
let server, base;
before(async () => {
    Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: 'test-only-secret-with-at-least-32-characters', PAYHERE_MERCHANT_ID: '1234567', PAYHERE_MERCHANT_SECRET: 'test-merchant-secret', PAYHERE_MODE: 'sandbox', APP_URL: 'https://shop.example.test', PUBLIC_API_URL: 'https://api.example.test', FX_EUR_TO_USD: '1.1' });
    server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
afterEach(() => mock.restoreAll());
const products = (list = [product]) => mock.method(Product, 'find', () => ({ lean: async () => structuredClone(list) }));
const auth = (user = buyer) => mock.method(User, 'findById', () => ({ select: async () => user }));
const cookie = () => `jwt=${jwt.sign({ userId }, process.env.JWT_SECRET, { algorithm: 'HS256' })}`;
async function request(path, { method = 'GET', body, authenticated = true, headers = {} } = {}) {
    return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Silonka-Request': '1', ...(authenticated ? { Cookie: cookie() } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const signedBody = (overrides = {}) => {
    const body = { merchant_id: process.env.PAYHERE_MERCHANT_ID, order_id: orderId, payment_id: 'payment-123', payhere_amount: '30.50', payhere_currency: 'USD', status_code: '2', ...overrides };
    return { ...body, md5sig: notificationHash(body, process.env.PAYHERE_MERCHANT_SECRET) };
};
const notify = body => fetch(base + '/api/payment/payhere/notify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });

test('catalogue replaces client prices and merges duplicate product/variant lines', async () => {
    products();
    const items = await catalogueItems([{ product: productId, qty: 2, price: 0.01, name: 'Forged' }, { product: productId, qty: 1 }]);
    assert.equal(items.length, 1); assert.equal(items[0].price, 10.25); assert.equal(items[0].qty, 3); assert.equal(items[0].name, 'Cinnamon');
});
test('selected variant uses its database price and retains its identifier', async () => {
    products();
    const [item] = await catalogueItems([{ product: productId, qty: 1, variationId: variantId }]);
    assert.equal(item.price, 21.5); assert.equal(item.variationId, variantId);
});

test('selected option uses its own packed weight for the delivery quote', async () => {
    products([{ ...product, variations: [{ ...product.variations[0], shippingWeightKg: 0.65 }] }]);
    const quote = await quoteCheckout({ shippingAddress: address, orderItems: [{ product: productId, variationId: variantId, qty: 2 }] }, userId, async (destination, pkg) => {
        assert.equal(pkg.weightKg, 1.3);
        return { services: [{ amount: 10, currency: 'USD', serviceType: 'P' }] };
    });
    assert.equal(quote.weightKg, 1.3); assert.equal(quote.itemsPrice, 43);
});
test('rejects malformed, negative, fractional, huge, empty and selector-injected cart data', async () => {
    products();
    for (const input of [undefined, [], {}, [{ product: { $ne: null }, qty: 1 }], [{ product: productId, qty: -1 }], [{ product: productId, qty: 1.5 }], [{ product: productId, qty: 100 }]]) await assert.rejects(catalogueItems(input), { status: 400 });
    await assert.rejects(catalogueItems([{ product: productId, qty: 60 }, { product: productId, qty: 60 }]), { status: 400 });
});
test('rejects unavailable products, unavailable options and nonexistent options', async () => {
    const stub = products([{ ...product, inStock: false }]);
    await assert.rejects(catalogueItems([{ product: productId, qty: 1 }]), { status: 409 });
    stub.mock.mockImplementation(() => ({ lean: async () => [{ ...product, variations: [{ ...product.variations[0], inStock: false }] }] }));
    await assert.rejects(catalogueItems([{ product: productId, qty: 1, variationId: variantId }]), { status: 409 });
    await assert.rejects(catalogueItems([{ product: productId, qty: 1, variationId: otherUser }]), { status: 409 });
});
test('requires complete shipping contact details and validates field types', () => {
    assert.equal(shippingAddress(address).email, address.email);
    for (const bad of [{ ...address, email: 'bad' }, { ...address, phone: '' }, { ...address, countryCode: { $ne: '' } }, { ...address, address: '' }]) assert.throws(() => shippingAddress(bad), { status: 400 });
});
test('quote totals use integer cents, catalogue weights and configured currency conversion', async () => {
    products();
    const quote = await quoteCheckout({ shippingAddress: address, orderItems: [{ product: productId, qty: 2 }] }, userId, async (destination, pkg) => {
        assert.equal(pkg.weightKg, 2.4); assert.equal(destination.postalCode, address.postalCode);
        return { services: [{ amount: 10, currency: 'EUR', serviceType: 'P' }] };
    });
    assert.equal(quote.itemsPrice, 20.5); assert.equal(quote.shippingPrice, 11); assert.equal(quote.totalPrice, 31.5); assert.equal(quote.currency, 'USD');
    assert.equal(quote.orderItems[0].price, 10.25); assert.equal(quote.orderItems[0].qty, 2);
    assert.equal(verifyQuote(quote.quoteToken, userId, quote.fingerprint).totalPrice, 31.5);
});
test('rejects forged, expired, other-user and changed-address quotes', () => {
    const payload = { userId, currency: 'USD', fingerprint: 'expected', expiresAt: Date.now() + 10000 };
    const token = signQuote(payload);
    assert.throws(() => verifyQuote(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'), userId, 'expected'), { status: 400 });
    assert.throws(() => verifyQuote(token, otherUser, 'expected'), { status: 409 });
    assert.throws(() => verifyQuote(token, userId, 'changed-address'), { status: 409 });
    assert.throws(() => verifyQuote(signQuote({ ...payload, expiresAt: 0 }), userId, 'expected'), { status: 409 });
    assert.throws(() => verifyQuote(signQuote({ ...payload, currency: 'EUR' }), userId, 'expected'), { status: 409 });
});

test('USD shipping is used directly and new orders default to USD without relabelling history', async () => {
    products();
    const quote = await quoteCheckout({ shippingAddress: address, orderItems: [{ product: productId, qty: 1 }] }, userId, async () => ({ services: [{ amount: 8, currency: 'USD', serviceType: 'P' }] }));
    assert.equal(quote.currency, 'USD'); assert.equal(quote.shippingPrice, 8); assert.equal(quote.totalPrice, 18.25);
    assert.equal(new Order().currency, 'USD');
    assert.equal(Order.hydrate({ _id: orderId, currency: 'EUR' }).currency, 'EUR');
    assert.equal(Order.hydrate({ _id: orderId }).currency, undefined);
});
test('shipping failures and unsupported currency do not become free delivery', async () => {
    products();
    const input = { shippingAddress: address, orderItems: [{ product: productId, qty: 1 }] };
    for (const provider of [async () => { throw new Error('private credentials'); }, async () => ({ services: [] }), async () => ({ services: [{ serviceType: 'P', amount: 10, currency: 'XYZ' }] })]) await assert.rejects(quoteCheckout(input, userId, provider), { status: 503 });
});
test('PayHere checksum follows the documented uppercase MD5 concatenation', () => {
    const upper = text => crypto.createHash('md5').update(text).digest('hex').toUpperCase();
    assert.equal(paymentHash('1234567', orderId, '30.50', 'USD', 'secret'), upper('1234567' + orderId + '30.50USD' + upper('secret')));
    assert.doesNotThrow(() => verifyNotification(signedBody(), { merchantId: process.env.PAYHERE_MERCHANT_ID, secret: process.env.PAYHERE_MERCHANT_SECRET }));
});
test('HTTP blocks unauthenticated checkout, cross-origin writes, draft disclosure and removed mock payment', async () => {
    assert.equal((await request('/api/orders', { method: 'POST', authenticated: false, body: {} })).status, 401);
    assert.equal((await request('/api/auth/logout', { method: 'POST', headers: { Origin: 'https://attacker.example' } })).status, 403);
    assert.equal((await request('/api/blogs?admin=true', { authenticated: false })).status, 401);
    assert.equal((await request(`/api/orders/${orderId}/pay`, { method: 'PUT', body: { status: 'paid' } })).status, 404);
});
test('deleted-user sessions are rejected and customer cannot use admin endpoints', async () => {
    const stub = auth(null);
    assert.equal((await request('/api/auth/profile')).status, 401);
    stub.mock.mockImplementation(() => ({ select: async () => buyer }));
    assert.equal((await request('/api/auth/users')).status, 403);
});
test('order lookups include customer ownership in their database filter', async () => {
    auth();
    mock.method(Order, 'findOne', filter => {
        assert.equal(String(filter.user), userId);
        return { select: () => ({ populate: async () => null }) };
    });
    assert.equal((await request(`/api/orders/${orderId}`)).status, 404);
});
test('order creation ignores all submitted totals and reuses a signed quote after a network retry', async () => {
    auth(); products();
    const orderItems = [{ product: productId, qty: 2 }], items = await catalogueItems(orderItems);
    const quoteToken = signQuote({ userId, fingerprint: checkoutFingerprint(items, shippingAddress(address)), expiresAt: Date.now() + 10000, currency: 'USD', itemsPrice: 20.5, shippingPrice: 10, taxPrice: 0, totalPrice: 30.5, weightKg: 2.4, productCode: 'P' });
    let stored, creates = 0;
    mock.method(Order, 'findOne', async () => stored || null);
    mock.method(Order, 'create', async data => { creates++; stored = { ...data, _id: orderId }; return stored; });
    const input = { orderItems, shippingAddress: address, paymentMethod: 'PayHere', quoteToken, totalPrice: 0.01, shippingPrice: -50 };
    for (let i = 0; i < 2; i++) { const response = await request('/api/orders', { method: 'POST', body: input }); assert.equal(response.status, 201); assert.equal((await response.json()).totalPrice, 30.5); }
    assert.equal(creates, 1);
});
test('payment setup binds the checkout to its owner and uses server USD amount', async () => {
    auth();
    mock.method(Order, 'findOne', async filter => { assert.equal(String(filter.user), userId); return { _id: orderId, paymentMethod: 'PayHere', paymentStatus: 'pending', paymentExpiresAt: new Date(Date.now() + 10000), totalPrice: 30.5, currency: 'USD', shippingAddress: address }; });
    const response = await request('/api/payment/payhere/create', { method: 'POST', body: { orderId, amount: 0.01 } });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.fields.amount, '30.50'); assert.equal(data.fields.currency, 'USD');
    assert.equal(data.action, 'https://sandbox.payhere.lk/pay/checkout');
    assert.ok(!JSON.stringify(data).includes(process.env.PAYHERE_MERCHANT_SECRET));
});
test('callback rejects tampering, wrong merchant, mismatched amount and mismatched currency', async () => {
    mock.method(Order, 'findById', async () => ({ _id: orderId, paymentMethod: 'PayHere', totalPrice: 30.5, currency: 'USD' }));
    const updates = mock.method(Order, 'updateOne', async () => assert.fail('Must not update an invalid payment'));
    for (const body of [{ ...signedBody(), md5sig: '0'.repeat(32) }, signedBody({ merchant_id: 'wrong' }), signedBody({ payhere_amount: '0.01' }), signedBody({ payhere_currency: 'EUR' })]) assert.equal((await notify(body)).status, 400);
    assert.equal(updates.mock.calls.length, 0);
});
test('verified callbacks are idempotent, late failures cannot undo payment, and chargebacks are terminal', async () => {
    const state = { _id: orderId, paymentMethod: 'PayHere', totalPrice: 30.5, currency: 'USD', paymentStatus: 'pending', isPaid: false };
    let applied = 0;
    mock.method(Order, 'findById', async () => ({ ...state }));
    mock.method(Order, 'updateOne', async (filter, update) => {
        if (filter.paymentStatus.$nin?.includes(state.paymentStatus) || filter.paymentStatus.$ne === state.paymentStatus || ('isPaid' in filter && filter.isPaid !== state.isPaid) || (filter['paymentResult.id'] && filter['paymentResult.id'] !== state.paymentResult?.id)) return { modifiedCount: 0 };
        Object.assign(state, update.$set); applied++; return { modifiedCount: 1 };
    });
    for (const code of ['2', '2', '0', '-2']) assert.equal((await notify(signedBody({ status_code: code }))).status, 200);
    assert.equal(state.isPaid, true); assert.equal(state.paymentStatus, 'paid'); assert.equal(applied, 1);
    assert.equal((await notify(signedBody({ status_code: '-3' }))).status, 200);
    assert.equal(state.isPaid, false); assert.equal(state.paymentStatus, 'chargedback');
    await notify(signedBody()); assert.equal(state.paymentStatus, 'chargedback');
});
test('unexpected errors do not disclose internals and responses have security headers', async () => {
    mock.method(Product, 'find', () => { throw new Error('database-password-and-stack'); });
    const response = await request('/api/products');
    assert.equal(response.status, 500); assert.ok(!(await response.text()).includes('database-password'));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
});
test('DHL inputs are validated without contacting the carrier', async () => {
    assert.equal((await request('/api/dhl/rates', { method: 'POST', body: { countryCode: 'US', weightKg: -1 } })).status, 400);
    assert.equal((await request('/api/dhl/track/not-a-number')).status, 400);
});

test('live payments require live shipping, while notifications remain available', () => {
    const previous = { DHL_MODE: process.env.DHL_MODE, PAYHERE_MODE: process.env.PAYHERE_MODE, DHL_RATE_ENDPOINT: process.env.DHL_RATE_ENDPOINT };
    try {
        process.env.DHL_MODE = 'sandbox'; process.env.PAYHERE_MODE = 'live';
        assert.throws(() => payhereConfig({ forCheckout: true }), { status: 503 });
        assert.equal(payhereConfig().mode, 'live');
        assert.ok(dhlEndpoint('rate').includes('/sndpt/'));
        process.env.DHL_MODE = 'live';
        delete process.env.DHL_RATE_ENDPOINT;
        assert.throws(() => dhlEndpoint('rate'));
        for (const endpoint of ['http://wsbexpress.dhl.com/rates', 'https://evil.example/rates', 'https://wsbexpress.dhl.com/sndpt/expressRateBook']) {
            process.env.DHL_RATE_ENDPOINT = endpoint;
            assert.throws(() => dhlEndpoint('rate'));
        }
        process.env.DHL_RATE_ENDPOINT = 'https://wsbexpress.dhl.com/test-production-placeholder';
        assert.equal(dhlEndpoint('rate'), process.env.DHL_RATE_ENDPOINT);
    } finally {
        for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    }
});

test('customers cannot download labels or create carrier bookings, and unpaid orders cannot ship', async () => {
    const session = auth();
    assert.equal((await request(`/api/orders/${orderId}/label`)).status, 403);
    assert.equal((await request('/api/dhl/create-shipment', { method: 'POST', body: { orderId } })).status, 403);
    session.mock.mockImplementation(() => ({ select: async () => ({ ...buyer, isAdmin: true }) }));
    mock.method(Order, 'findOneAndUpdate', async filter => { assert.equal(filter.isPaid, true); return null; });
    assert.equal((await request('/api/dhl/create-shipment', { method: 'POST', body: { orderId } })).status, 409);
});
