import express from 'express';
import { getRates, createShipment, schedulePickup, trackShipment } from '../utils/dhlService.js';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { asyncHandler, textField, httpError } from '../utils/http.js';
import { shipmentOrderId, pickupDate } from '../utils/shippingInput.js';

const router = express.Router();
const cache = new Map();
const inFlight = new Map();
router.post('/rates', asyncHandler(async (req, res) => {
    const countryCode = textField(req.body.countryCode, 'country code', 2).toUpperCase();
    const city = textField(req.body.city || '', 'city', 100, false), postalCode = textField(req.body.postalCode || '', 'postal code', 30, false), streetLines = textField(req.body.streetLines || '', 'address', 250, false);
    const weightKg = req.body.weightKg ?? 1.2;
    if (!/^[A-Z]{2}$/.test(countryCode) || typeof weightKg !== 'number' || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 70) throw httpError(400, 'Invalid destination or shipping weight.');
    const key = JSON.stringify({ countryCode, city, postalCode, streetLines, weightKg });
    let cached = cache.get(key);
    if (!cached || cached.expires < Date.now()) {
        if (!inFlight.has(key)) {
            const promise = getRates({ countryCode, city, postalCode, streetLines }, { weightKg }).then(result => {
                const data = {
                    currency: result.currency, amount: result.amount, productCode: result.productCode, deliveryTime: result.deliveryTime,
                    services: (result.services || []).map(({ serviceType, serviceName, currency, amount, deliveryTime, cutoffTime, charges }) => ({ serviceType, serviceName, currency, amount, deliveryTime, cutoffTime, charges })),
                };
                if (!data.services.length) throw new Error('No shipping services');
                if (cache.size >= 200) cache.delete(cache.keys().next().value);
                const entry = { expires: Date.now() + 300000, data };
                cache.set(key, entry);
                return entry;
            }).finally(() => inFlight.delete(key));
            inFlight.set(key, promise);
        }
        try { cached = await inFlight.get(key); }
        catch { throw httpError(503, 'Shipping estimate unavailable. Please check your destination or try again.'); }
    }
    res.json(cached.data);
}));

router.get('/track/:awb', asyncHandler(async (req, res) => {
    if (!/^\d{10}$/.test(req.params.awb)) throw httpError(400, 'Enter a valid 10-digit DHL tracking number.');
    try {
        const result = await trackShipment(req.params.awb);
        // Only expose shipment events, never the raw SOAP response.
        const { rawResponse, ...safe } = result;
        res.json(safe);
    } catch { throw httpError(503, 'Tracking is temporarily unavailable. Please try again.'); }
}));

router.post('/create-shipment', protect, admin, asyncHandler(async (req, res) => {
    const orderId = shipmentOrderId(req.body.orderId);
    const order = await Order.findOneAndUpdate(
        { _id: orderId, isPaid: true, 'dhl.shipmentCreated': { $ne: true }, 'dhl.shipmentCreating': { $ne: true } },
        { $set: { 'dhl.shipmentCreating': true } }, { new: true }
    );
    if (!order) throw httpError(409, 'Order is unpaid, already shipped, or shipment creation is in progress.');
    try {
        const weight = order.shippingWeightKg || Number(req.body.weightKg);
        if (!Number.isFinite(weight) || weight <= 0 || weight > 70) throw httpError(400, 'Enter a valid shipping weight.');
        const result = await createShipment(order, weight);
        Object.assign(order.dhl, { awbNumber: result.awbNumber, labelPdf: result.labelPdfBase64, trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${result.awbNumber}`, shipmentCreated: true, shipmentCreating: false, pickupConfirmed: false });
        await order.save();
        res.json({ awbNumber: result.awbNumber, trackingUrl: order.dhl.trackingUrl, hasLabel: !!result.labelPdfBase64 });
    } catch (err) {
        // Keep the claim after a carrier/network error: a timeout may have booked
        // a shipment. An operator must reconcile with DHL before retrying.
        if (err.status === 400) await Order.updateOne({ _id: order._id }, { $set: { 'dhl.shipmentCreating': false } });
        throw httpError(err.status || 503, err.status === 400 ? err.message : 'Shipment response could not be confirmed. Check DHL before retrying.');
    }
}));

router.post('/schedule-pickup', protect, admin, asyncHandler(async (req, res) => {
    const date = pickupDate(req.body.pickupDate);
    const orderId = shipmentOrderId(req.body.orderId);
    const order = await Order.findOneAndUpdate(
        { _id: orderId, isPaid: true, 'dhl.awbNumber': { $regex: '^\\d{10}$' }, 'dhl.shipmentCreated': true, 'dhl.pickupConfirmed': { $ne: true }, 'dhl.pickupCreating': { $ne: true } },
        { $set: { 'dhl.pickupCreating': true } }, { new: true }
    );
    if (!order?.dhl?.awbNumber) throw httpError(409, 'Create a shipment first, or check whether pickup was already requested.');
    try {
        const result = await schedulePickup(order.dhl.awbNumber, date);
        if (!result.confirmationNumber) throw new Error('No pickup confirmation');
        order.dhl.pickupConfirmed = true;
        order.dhl.pickupCreating = false;
        order.dhl.pickupDate = date;
        order.dhl.pickupConfirmationNumber = result.confirmationNumber;
        await order.save();
        res.json({ confirmationNumber: result.confirmationNumber, pickupDate: date });
    } catch { throw httpError(503, 'Pickup response could not be confirmed. Check DHL before retrying.'); }
}));
export default router;
