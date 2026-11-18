import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { productInput, productArray, productImage } from '../utils/productInput.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { createProduct, updateProduct } from '../controllers/productController.js';

afterEach(() => mock.restoreAll());

const valid = { name: ' Cinnamon ', description: ' Fresh cinnamon ', category: 'Cinnamon', weight: '100 g', price: '10.25', shippingWeightKg: '0.35', inStock: 'true' };
const optionId = '444444444444444444444444';
test('product fields normalize multipart strings and preserve explicit availability', () => {
    const parsed = productInput({ ...valid, inStock: 'false', certifications: '["Organic"]' });
    assert.equal(parsed.name, 'Cinnamon'); assert.equal(parsed.price, 10.25); assert.equal(parsed.shippingWeightKg, 0.35); assert.equal(parsed.inStock, false); assert.deepEqual(parsed.certifications, ['Organic']);
});
test('invalid required fields, prices, weights and availability are rejected before uploads', () => {
    for (const bad of [{ name: ' ' }, { description: '' }, { price: '' }, { price: 0 }, { price: 1.005 }, { price: {} }, { shippingWeightKg: 0 }, { shippingWeightKg: 71 }, { inStock: 'yes' }, { category: { $ne: null } }]) assert.throws(() => productInput({ ...valid, ...bad }), { status: 400 });
});
test('product options retain existing IDs, prices and individual packed weights', () => {
    const parsed = productInput({ variations: JSON.stringify([{ _id: optionId, label: '250 g', price: '15.50', shippingWeightKg: '0.65', inStock: false }]) }, { partial: true, existingOptionIds: [optionId] });
    assert.deepEqual(parsed.variations, [{ _id: optionId, label: '250 g', price: 15.5, shippingWeightKg: 0.65, inStock: false }]);
});

test('imported variant images and sample flags survive editing and unsafe option URLs are rejected', () => {
    const option = { _id: optionId, label: 'Large', price: 16.5, inStock: true, image: '/products/cinnachew-large.webp' };
    const parsed = productInput({ variations: [option], priceIsSample: 'false', imageIsReference: 'true', shippingWeightEstimated: 'true' }, { partial: true, existingOptionIds: [optionId] });
    assert.equal(parsed.variations[0].image, option.image);
    assert.equal(parsed.priceIsSample, false); assert.equal(parsed.imageIsReference, true); assert.equal(parsed.shippingWeightEstimated, true);
    assert.throws(() => productInput({ variations: [{ ...option, image: 'javascript:alert(1)' }] }, { partial: true, existingOptionIds: [optionId] }), { status: 400 });
});
test('malformed options are not silently discarded and option names and IDs must be unique', () => {
    for (const variations of ['broken json', '{}', [{ label: '', price: 1 }], [{ label: '100g', price: 0 }], [{ label: '100g', price: 2 }, { label: '100G', price: 3 }], [{ _id: optionId, label: '100g', price: 1 }], [{ label: '100g', price: 2, shippingWeightKg: -1 }]]) assert.throws(() => productInput({ ...valid, variations }), { status: 400 });
});
test('partial edits preserve omitted fields and allow clearing optional values', () => {
    assert.deepEqual(productInput({ name: 'New name', intensity: '', variations: '[]', certifications: '[]' }, { partial: true }), { name: 'New name', intensity: undefined, variations: [], certifications: [] });
});
test('cover URLs and gallery removal data reject unsafe or malformed values', () => {
    assert.equal(productImage('https://images.example.test/product.webp'), 'https://images.example.test/product.webp');
    assert.equal(productImage('/uploads/product.webp'), '/uploads/product.webp');
    for (const value of ['javascript:alert(1)', '//example.test/image', 'http://example.test/image', '', {}]) assert.throws(() => productImage(value), { status: 400 });
    assert.throws(() => productArray('invalid', 'Removed images', 6), { status: 400 });
    assert.throws(() => productArray(Array(7).fill('image'), 'Gallery', 6), { status: 400 });
});

test('create controller saves a validated product with options and no fallback image', async () => {
    mock.method(Category, 'exists', async () => true);
    mock.method(Product.prototype, 'save', async function () { return this; });
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; } };
    await createProduct({ body: { ...valid, image: '/cinnamon.webp', variations: JSON.stringify([{ label: '250 g', price: 25, shippingWeightKg: 0.65 }]) } }, response);
    assert.equal(response.statusCode, 201); assert.equal(response.body.price, 10.25);
    assert.equal(response.body.variations[0].shippingWeightKg, 0.65);
    assert.ok(response.body.variations[0]._id);
    await assert.rejects(createProduct({ body: valid }, response), { status: 400 });
});

test('update controller preserves option identity, removes chosen images, and clears intensity', async () => {
    const product = new Product({ ...valid, id: 'test-only', image: '/cover.webp', images: ['/one.webp', '/two.webp'], intensity: 3, variations: [{ _id: optionId, label: '250 g', price: 25, shippingWeightKg: 0.65 }] });
    mock.method(Product, 'findById', async () => product);
    mock.method(Product.prototype, 'save', async function () { return this; });
    let saved;
    await updateProduct({ params: { id: String(product._id) }, body: { intensity: '', removeImages: '["/one.webp"]', variations: JSON.stringify([{ _id: optionId, label: '250 g', price: 26, shippingWeightKg: 0.7, inStock: false }]) } }, { json(value) { saved = value; } });
    assert.equal(saved.name, valid.name); assert.equal(saved.image, '/cover.webp');
    assert.deepEqual([...saved.images], ['/two.webp']); assert.equal(saved.intensity, undefined);
    assert.equal(String(saved.variations[0]._id), optionId); assert.equal(saved.variations[0].shippingWeightKg, 0.7); assert.equal(saved.variations[0].inStock, false);
});
