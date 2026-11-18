import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { getRates } from './dhlService.js';
import { emailField, textField, httpError } from './http.js';

// Catalogue prices and new checkout amounts are stored in USD.
export const ORDER_CURRENCY = 'USD';
export const cents = value => Math.round((value + Number.EPSILON) * 100);
export function shippingAddress(input) {
    if (!input || typeof input !== 'object') throw httpError(400, 'Shipping address is required.');
    const address = Object.fromEntries(['address', 'city', 'postalCode', 'country', 'fullName', 'phone'].map(key => [key, textField(input[key], key, key === 'address' ? 250 : 100)]));
    address.countryCode = textField(input.countryCode, 'country code', 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(address.countryCode) || !/^[+\d\s().-]{7,30}$/.test(address.phone)) throw httpError(400, 'Please check your country and phone number.');
    address.email = emailField(input.email);
    return address;
}
export async function catalogueItems(input) {
    if (!Array.isArray(input) || input.length < 1 || input.length > 50) throw httpError(400, 'Your cart must contain between 1 and 50 items.');
    const requests = input.map(item => {
        if (!item || typeof item !== 'object') throw httpError(400, 'Invalid cart item.');
        const product = item.product || item.id, qty = item.qty ?? item.quantity;
        if (typeof product !== 'string' || !mongoose.isObjectIdOrHexString(product) || !Number.isInteger(qty) || qty < 1 || qty > 99) throw httpError(400, 'Invalid product or quantity.');
        if (item.variationId != null && (typeof item.variationId !== 'string' || !mongoose.isObjectIdOrHexString(item.variationId))) throw httpError(400, 'Invalid product option.');
        return { product, qty, variationId: item.variationId || null };
    });
    const products = await Product.find({ _id: { $in: requests.map(item => item.product) } }).lean();
    const merged = new Map();
    for (const item of requests) {
        const product = products.find(p => String(p._id) === item.product);
        if (!product || !product.inStock) throw httpError(409, 'An item is no longer available. Please update your cart.');
        const variant = item.variationId ? product.variations?.find(v => String(v._id) === item.variationId) : null;
        if (item.variationId && (!variant || !variant.inStock)) throw httpError(409, `The selected option for ${product.name} is unavailable.`);
        const price = variant ? variant.price : product.price, weightKg = variant?.shippingWeightKg ?? product.shippingWeightKg;
        if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(weightKg) || weightKg <= 0) throw httpError(409, `Please contact us to order ${product.name}.`);
        const key = `${item.product}:${item.variationId || ''}`, qty = (merged.get(key)?.qty || 0) + item.qty;
        if (qty > 99) throw httpError(400, 'A maximum of 99 units per product option is allowed.');
        merged.set(key, { ...item, qty, name: product.name, image: variant?.image || product.image, price: cents(price) / 100, variant: variant?.label || product.weight, shippingWeightKg: weightKg });
    }
    return [...merged.values()].sort((a, b) => `${a.product}:${a.variationId}`.localeCompare(`${b.product}:${b.variationId}`));
}
export const checkoutFingerprint = (items, address) => crypto.createHash('sha256').update(JSON.stringify({ items, address })).digest('hex');
export function signQuote(quote) {
    const payload = Buffer.from(JSON.stringify(quote)).toString('base64url');
    return `${payload}.${crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('base64url')}`;
}
export function verifyQuote(token, userId, fingerprint) {
    if (typeof token !== 'string' || token.length > 6000) throw httpError(400, 'Please refresh your shipping quote.');
    const [payload, signature, extra] = token.split('.');
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload || '').digest('base64url');
    if (extra || !/^[A-Za-z0-9_-]{43}$/.test(signature || '') || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw httpError(400, 'Invalid shipping quote. Please refresh it.');
    let quote;
    try { quote = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { throw httpError(400, 'Invalid shipping quote.'); }
    if (quote.currency !== ORDER_CURRENCY || quote.userId !== String(userId) || quote.fingerprint !== fingerprint || !Number.isFinite(quote.expiresAt) || quote.expiresAt <= Date.now()) throw httpError(409, 'Your cart, address or quote has changed. Please refresh your shipping quote.');
    return quote;
}
export async function quoteCheckout(input, userId, rateProvider = getRates) {
    const address = shippingAddress(input.shippingAddress), items = await catalogueItems(input.orderItems);
    const weightKg = Number(items.reduce((sum, item) => sum + item.shippingWeightKg * item.qty, 0).toFixed(3));
    if (weightKg > 70) throw httpError(400, 'Please contact us for shipping orders over 70 kg.');
    let rates;
    try { rates = await rateProvider({ ...address, streetLines: address.address }, { weightKg }); }
    catch { throw httpError(503, 'Shipping is unavailable. Check your address or try again shortly.'); }
    const convertRate = (amount, currency) => {
        if (currency === ORDER_CURRENCY) return amount;
        const rate = Number(process.env[`FX_${currency}_TO_USD`]);
        if (!Number.isFinite(rate) || rate <= 0) throw httpError(503, 'Shipping currency conversion is not configured. Please contact us.');
        return amount * rate;
    };
    const services = (rates.services || []).filter(s => Number.isFinite(s.amount) && s.amount > 0 && /^[A-Z0-9]$/.test(s.serviceType || '')).map(s => ({ ...s, usdCents: cents(convertRate(s.amount, s.currency)) })).sort((a, b) => a.usdCents - b.usdCents);
    if (!services.length) throw httpError(503, 'No shipping service is available for this address. Please contact us.');
    const service = services[0], itemsPrice = items.reduce((sum, item) => sum + cents(item.price) * item.qty, 0) / 100;
    const taxRate = Number(process.env.CHECKOUT_TAX_RATE || 0);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) throw httpError(503, 'Checkout tax configuration is invalid.');
    const quote = { userId: String(userId), fingerprint: checkoutFingerprint(items, address), expiresAt: Date.now() + 15 * 60 * 1000, currency: ORDER_CURRENCY, itemsPrice, shippingPrice: service.usdCents / 100, taxPrice: cents(itemsPrice * taxRate) / 100, productCode: service.serviceType, weightKg, deliveryTime: service.deliveryTime || null };
    quote.totalPrice = (cents(quote.itemsPrice) + cents(quote.shippingPrice) + cents(quote.taxPrice)) / 100;
    return { ...quote, orderItems: items, quoteToken: signQuote(quote) };
}
