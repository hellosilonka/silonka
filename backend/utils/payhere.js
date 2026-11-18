import crypto from 'node:crypto';
import { httpError } from './http.js';
import { dhlEndpoint } from './dhlService.js';

export const md5 = value => crypto.createHash('md5').update(value).digest('hex').toUpperCase();
export const paymentHash = (merchantId, orderId, amount, currency, secret) => md5(`${merchantId}${orderId}${amount}${currency}${md5(secret)}`);
export const notificationHash = (body, secret) => md5(`${body.merchant_id}${body.order_id}${body.payhere_amount}${body.payhere_currency}${body.status_code}${md5(secret)}`);

export function payhereConfig({ forCheckout = false } = {}) {
    const merchantId = process.env.PAYHERE_MERCHANT_ID, secret = process.env.PAYHERE_MERCHANT_SECRET, mode = process.env.PAYHERE_MODE;
    if (!merchantId || !secret || !['sandbox', 'live'].includes(mode)) throw httpError(503, 'Online payments are not configured yet. Please contact us.');
    if (forCheckout && mode === 'live') {
        try {
            if (process.env.DHL_MODE !== 'live') throw new Error('Sandbox shipping');
            ['rate', 'shipment', 'pickup', 'track'].forEach(dhlEndpoint);
        } catch { throw httpError(503, 'Live shipping must be configured before accepting payments.'); }
    }
    let appUrl, apiUrl;
    try { appUrl = new URL(process.env.APP_URL); apiUrl = new URL(process.env.PUBLIC_API_URL || process.env.APP_URL); }
    catch { throw httpError(503, 'Payment callback URLs are not configured.'); }
    if ([appUrl, apiUrl].some(url => url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw httpError(503, 'Payments require public HTTPS application and API URLs.');
    return { merchantId, secret, mode, appUrl: appUrl.origin, apiUrl: apiUrl.origin };
}
export function verifyNotification(body, config) {
    const fields = ['merchant_id', 'order_id', 'payment_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig'];
    if (!body || fields.some(key => typeof body[key] !== 'string' || !body[key].length || body[key].length > 200) || !/^[a-f\d]{24}$/i.test(body.order_id) || !/^\d+\.\d{2}$/.test(body.payhere_amount) || !/^(2|0|-1|-2|-3)$/.test(body.status_code) || !/^[a-f\d]{32}$/i.test(body.md5sig)) throw httpError(400, 'Invalid payment notification.');
    const expected = notificationHash(body, config.secret);
    if (body.merchant_id !== config.merchantId || !crypto.timingSafeEqual(Buffer.from(body.md5sig.toUpperCase()), Buffer.from(expected))) throw httpError(400, 'Invalid payment signature.');
}
