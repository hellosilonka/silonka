import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { v2 as cloudinary } from 'cloudinary';
import { createApp } from '../app.js';
import Blog from '../models/Blog.js';
import { createBlog, updateBlog } from '../controllers/blogController.js';
import { blogInput } from '../utils/blogInput.js';
import { shipmentOrderId, pickupDate } from '../utils/shippingInput.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import { updateBulkOrderStatus, deleteBulkOrdersBulk } from '../controllers/bulkOrderController.js';
import { updateOrderDHL } from '../controllers/orderController.js';
import Order from '../models/Order.js';

afterEach(() => mock.restoreAll());
const article = { title: 'Cinnamon guide', excerpt: 'A useful guide.', content: 'How to use cinnamon.' };
const response = () => ({ code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });

test('blog input rejects malformed fields, JSON, boolean coercion and fractional reading times', () => {
    for (const invalid of [{ title: {} }, { title: ' ' }, { tags: 'broken' }, { tags: [null] }, { published: 'yes' }, { readTime: '5minutes' }, { readTime: 1.5 }, { image: 'javascript:alert(1)' }, { slug: '../admin' }]) assert.throws(() => blogInput({ ...article, ...invalid }), { status: 400 });
    assert.deepEqual(blogInput({ tags: '[]', published: 'false', image: '' }, { partial: true }), { tags: [], published: false, image: '' });
});

test('blog creation supports non-Latin titles and saves validated metadata', async () => {
    mock.method(Blog, 'exists', async () => false);
    mock.method(Blog.prototype, 'save', async function () { return this; });
    const res = response();
    await createBlog({ body: { ...article, title: 'සිලෝන්', tags: '["Spices"]', readTime: '3', published: 'true' } }, res);
    assert.equal(res.code, 201); assert.match(res.body.slug, /^article-/);
    assert.equal(res.body.published, true); assert.equal(res.body.readTime, 3);
});

test('editing an article preserves its URL and omitted fields while clearing tags and image', async () => {
    const blog = new Blog({ ...article, slug: 'cinnamon-guide', published: true, tags: ['Spices'], image: '/photo.webp' });
    mock.method(Blog, 'findById', async () => blog);
    mock.method(Blog.prototype, 'save', async function () { return this; });
    const res = response();
    await updateBlog({ params: { id: String(blog._id) }, body: { title: 'Updated guide', tags: '[]', image: '' } }, res);
    assert.equal(res.body.slug, 'cinnamon-guide'); assert.equal(res.body.published, true);
    assert.equal(res.body.image, ''); assert.deepEqual([...res.body.tags], []);
});

test('image provider failures return a safe actionable error without provider details', async () => {
    mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => ({ end() { callback(new Error('PRIVATE_PROVIDER_DETAILS')); } }));
    await assert.rejects(uploadToCloudinary({ buffer: Buffer.from('test-only') }), error => error.status === 503 && !error.message.includes('PRIVATE_PROVIDER_DETAILS'));
});

test('bulk status and deletion inputs reject invalid values before database operations', async () => {
    await assert.rejects(updateBulkOrderStatus({ body: { status: 'anything' }, params: { id: 'invalid' } }, response()), { status: 400 });
    for (const ids of [[{}], ['bad-id'], Array(101).fill('111111111111111111111111')]) {
        const res = response(); await deleteBulkOrdersBulk({ body: { ids } }, res); assert.equal(res.code, 400);
    }
});

test('pickup validation rejects nonexistent dates, past dates and malformed order IDs', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    for (const date of ['2026-02-30', '2026-13-01', '2025-12-31', 'bad', {}]) assert.throws(() => pickupDate(date, now), { status: 400 });
    assert.equal(pickupDate('2028-02-29', now), '2028-02-29');
    assert.equal(pickupDate('2026-01-01', now), '2026-01-01');
    for (const id of [undefined, {}, ['111111111111111111111111'], 'bad']) assert.throws(() => shipmentOrderId(id), { status: 400 });
});

test('manual shipment updates reject malformed tracking URLs without returning internal errors', async () => {
    mock.method(Order, 'findById', async () => ({ isPaid: true, dhl: {} }));
    for (const trackingUrl of ['not a URL', 'https://name:password@dhl.com/track', 'https://dhl.com.evil.test/']) await assert.rejects(updateOrderDHL({ params: { id: 'test' }, body: { trackingUrl } }, response()), { status: 400 });
});

test('malformed geolocation queries are rejected without calling external services', async () => {
    const server = createApp().listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
        for (const query of ['lat=12oops&lng=45', 'lat[]=12&lng=45', 'lat=91&lng=0']) {
            const res = await fetch(`http://127.0.0.1:${server.address().port}/api/geo/reverse?${query}`);
            assert.equal(res.status, 400);
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
});
