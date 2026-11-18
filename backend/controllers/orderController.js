import crypto from 'node:crypto';
import Order from '../models/Order.js';
import { catalogueItems, shippingAddress, checkoutFingerprint, verifyQuote, quoteCheckout } from '../utils/checkout.js';
import { httpError, pagination, textField } from '../utils/http.js';
import { payhereConfig } from '../utils/payhere.js';

export const getCheckoutQuote = async (req, res) => res.json(await quoteCheckout(req.body, req.user._id));

export const addOrderItems = async (req, res) => {
    payhereConfig({ forCheckout: true });
    if (req.body.paymentMethod !== 'PayHere') throw httpError(400, 'Please select PayHere.');
    const address = shippingAddress(req.body.shippingAddress);
    const items = await catalogueItems(req.body.orderItems);
    const quote = verifyQuote(req.body.quoteToken, req.user._id, checkoutFingerprint(items, address));
    const checkoutKey = crypto.createHash('sha256').update(String(req.user._id) + req.body.quoteToken).digest('hex');
    let order = await Order.findOne({ checkoutKey });
    if (!order) {
        try {
            order = await Order.create({
                checkoutKey, user: req.user._id, orderItems: items, shippingAddress: address,
                paymentMethod: 'PayHere', currency: quote.currency, paymentExpiresAt: new Date(quote.expiresAt),
                itemsPrice: quote.itemsPrice, shippingPrice: quote.shippingPrice, taxPrice: quote.taxPrice, totalPrice: quote.totalPrice,
                shippingWeightKg: quote.weightKg, shippingProductCode: quote.productCode,
            });
        } catch (err) {
            if (err.code !== 11000) throw err;
            order = await Order.findOne({ checkoutKey });
            if (!order) throw err;
        }
    }
    res.status(201).json(order);
};

export const getOrderById = async (req, res) => {
    const filter = { _id: req.params.id, ...(req.user.isAdmin ? {} : { user: req.user._id }) };
    const order = await Order.findOne(filter).select('-dhl.labelPdf').populate('user', 'name email');
    if (!order) throw httpError(404, 'Order not found.');
    res.json(order);
};

export const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (!order.isPaid || order.paymentStatus === 'chargedback') throw httpError(409, 'Only paid orders can be delivered.');
    if (!order.isDelivered) { order.isDelivered = true; order.deliveredAt = new Date(); await order.save(); }
    res.json(order);
};

export const updateOrderDHL = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (!order.isPaid) throw httpError(409, 'Only paid orders can be shipped.');
    for (const key of ['awbNumber', 'pickupDate', 'pickupConfirmationNumber']) {
        if (req.body[key] !== undefined) order.dhl[key] = textField(req.body[key], key, 100, false);
    }
    if (order.dhl.awbNumber && !/^\d{10}$/.test(order.dhl.awbNumber)) throw httpError(400, 'Enter a valid 10-digit DHL tracking number.');
    if (req.body.trackingUrl !== undefined) {
        let url;
        try { url = new URL(textField(req.body.trackingUrl, 'tracking URL', 1000)); }
        catch { throw httpError(400, 'Use an HTTPS DHL tracking URL.'); }
        if (url.protocol !== 'https:' || url.username || url.password || !(url.hostname === 'dhl.com' || url.hostname.endsWith('.dhl.com'))) throw httpError(400, 'Use an HTTPS DHL tracking URL.');
        order.dhl.trackingUrl = url.href;
    }
    for (const key of ['shipmentCreated', 'pickupConfirmed']) {
        if (req.body[key] !== undefined) {
            if (typeof req.body[key] !== 'boolean') throw httpError(400, 'Invalid shipment status.');
            order.dhl[key] = req.body[key];
        }
    }
    await order.save();
    res.json(order);
};

export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).select('-dhl.labelPdf').sort({ createdAt: -1 }).limit(100).lean();
    res.json(orders);
};
export const getOrders = async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const [count, orders] = await Promise.all([
        Order.countDocuments(),
        Order.find({}).select('-dhl.labelPdf').populate('user', 'name email').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ orders, page, pages: Math.ceil(count / limit), total: count });
};
export const deleteOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found.');
    if (order.isPaid || order.paymentMethod === 'PayHere') throw httpError(409, 'Payment records must be retained for reconciliation.');
    await Order.deleteOne({ _id: order._id, isPaid: false, paymentMethod: { $ne: 'PayHere' } });
    res.json({ message: 'Order removed' });
};
export const deleteOrdersBulk = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) throw httpError(400, 'Provide up to 100 valid order IDs.');
    const protectedRecords = await Order.exists({ _id: { $in: ids }, $or: [{ isPaid: true }, { paymentMethod: 'PayHere' }] });
    if (protectedRecords) throw httpError(409, 'Payment records must be retained for reconciliation.');
    await Order.deleteMany({ _id: { $in: ids }, isPaid: false, paymentMethod: { $ne: 'PayHere' } });
    res.json({ message: 'Orders removed' });
};
