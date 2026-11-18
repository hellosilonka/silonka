import Order from '../models/Order.js';
import { payhereConfig, paymentHash, verifyNotification } from '../utils/payhere.js';
import { httpError } from '../utils/http.js';
import { ORDER_CURRENCY } from '../utils/checkout.js';

export const getPaymentConfig = (req, res) => {
    try { const config = payhereConfig({ forCheckout: true }); res.json({ provider: 'PayHere', available: true, mode: config.mode, currency: ORDER_CURRENCY }); }
    catch { res.json({ provider: 'PayHere', available: false, currency: ORDER_CURRENCY }); }
};

export const createPayHerePayment = async (req, res) => {
    const config = payhereConfig({ forCheckout: true });
    if (typeof req.body.orderId !== 'string' || !/^[a-f\d]{24}$/i.test(req.body.orderId)) throw httpError(400, 'Invalid order.');
    const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
    if (!order) throw httpError(404, 'Order not found.');
    if (!['USD', 'EUR'].includes(order.currency)) throw httpError(409, 'This order has no recorded payment currency. Please start a new checkout.');
    if (order.paymentMethod !== 'PayHere' || order.isPaid || ['paid', 'chargedback'].includes(order.paymentStatus)) throw httpError(409, 'This order cannot accept another payment.');
    if (!order.paymentExpiresAt || order.paymentExpiresAt <= new Date()) throw httpError(409, 'This checkout has expired. Please return to your cart for a new quote.');
    const orderId = String(order._id), amount = order.totalPrice.toFixed(2), address = order.shippingAddress;
    const [firstName, ...lastName] = address.fullName.split(' ');
    res.json({
        action: config.mode === 'live' ? 'https://www.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout',
        fields: {
            merchant_id: config.merchantId, order_id: orderId, amount, currency: order.currency,
            hash: paymentHash(config.merchantId, orderId, amount, order.currency, config.secret),
            return_url: `${config.appUrl}/checkout/result?order=${orderId}`,
            cancel_url: `${config.appUrl}/checkout/result?order=${orderId}&cancelled=1`,
            notify_url: `${config.apiUrl}/api/payment/payhere/notify`,
            items: `Silonka order ${orderId.slice(-8).toUpperCase()}`,
            first_name: firstName, last_name: lastName.join(' ') || firstName,
            email: address.email, phone: address.phone, address: address.address, city: address.city, country: address.country,
        },
    });
};

export const notifyPayHere = async (req, res) => {
    const config = payhereConfig(), body = req.body;
    verifyNotification(body, config);
    const order = await Order.findById(body.order_id);
    if (!order || order.paymentMethod !== 'PayHere') throw httpError(404, 'Order not found.');
    if (body.payhere_currency !== order.currency || body.payhere_amount !== order.totalPrice.toFixed(2)) throw httpError(400, 'Payment amount or currency does not match the order.');
    const statuses = { '2': 'paid', '0': 'pending', '-1': 'cancelled', '-2': 'failed', '-3': 'chargedback' };
    const status = statuses[body.status_code];
    // Conditional writes make retries idempotent; late failure/pending callbacks
    // cannot undo a verified payment or a chargeback.
    const filter = { _id: order._id, paymentStatus: { $nin: ['paid', 'chargedback'] }, isPaid: false };
    const update = { paymentStatus: status, paymentResult: { id: body.payment_id, status, update_time: new Date().toISOString() } };
    if (status === 'paid') { update.isPaid = true; update.paidAt = new Date(); }
    if (status === 'chargedback') {
        filter.paymentStatus = { $ne: 'chargedback' };
        delete filter.isPaid;
        if (order.isPaid) filter['paymentResult.id'] = body.payment_id;
        update.isPaid = false;
    }
    await Order.updateOne(filter, { $set: update });
    res.status(200).type('text/plain').send('OK');
};
