import express from 'express';
import { getRates, createShipment, schedulePickup, trackShipment } from '../utils/dhlService.js';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── POST /api/dhl/rates ─────────────────────────────────────────────────────
// Public — called by checkout page when user fills in their address.
// Body: { countryCode, city?, postalCode?, weightKg?, items? }
router.post('/rates', async (req, res) => {
    try {
        const { countryCode, city = '', postalCode = '', streetLines = '', weightKg = 0.5 } = req.body;

        if (!countryCode) {
            return res.status(400).json({ message: 'countryCode is required' });
        }

        const result = await getRates(
            { city, postalCode, countryCode, streetLines },
            { weightKg }
        );

        res.json({
            currency: result.currency,
            amount: result.amount,
            productCode: result.productCode,
            deliveryTime: result.deliveryTime,
            // All available shipping options for the customer to choose from
            services: (result.services || []).map(s => ({
                serviceType: s.serviceType,
                serviceName: s.serviceName,
                currency: s.currency,
                amount: s.amount,
                deliveryTime: s.deliveryTime,
                cutoffTime: s.cutoffTime,
                charges: s.charges,
            })),
        });
    } catch (err) {
        console.error('[DHL rates error]', err.message);
        // Return a fallback so checkout doesn't break if DHL is unreachable
        res.status(200).json({
            currency: 'USD',
            amount: 0,
            productCode: 'P',
            deliveryTime: null,
            services: [],
            error: err.message,
        });
    }
});

// ─── GET /api/dhl/track/:awb ─────────────────────────────────────────────────
// Public — tracking page
router.get('/track/:awb', async (req, res) => {
    try {
        const { awb } = req.params;
        const result = await trackShipment(awb);
        res.json(result);
    } catch (err) {
        console.error('[DHL track error]', err.message);
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/dhl/create-shipment ───────────────────────────────────────────
// Admin only — generate DHL label for an existing paid order
// Body: { orderId, weightKg }
router.post('/create-shipment', protect, admin, async (req, res) => {
    try {
        const { orderId, weightKg = 1 } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.dhl?.shipmentCreated) {
            return res.status(400).json({ message: 'Shipment already created for this order' });
        }

        const result = await createShipment(order, weightKg);

        // Save DHL info back to order
        order.dhl = {
            awbNumber: result.awbNumber,
            labelPdf: result.labelPdfBase64,
            trackingUrl: result.awbNumber
                ? `https://www.dhl.com/en/express/tracking.html?AWB=${result.awbNumber}`
                : null,
            shipmentCreated: true,
            pickupConfirmed: false,
        };
        await order.save();

        res.json({
            awbNumber: result.awbNumber,
            trackingUrl: order.dhl.trackingUrl,
            hasLabel: !!result.labelPdfBase64,
        });
    } catch (err) {
        console.error('[DHL create-shipment error]', err.message);
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/dhl/schedule-pickup ───────────────────────────────────────────
// Admin only
// Body: { orderId, pickupDate } — pickupDate: "YYYY-MM-DD"
router.post('/schedule-pickup', protect, admin, async (req, res) => {
    try {
        const { orderId, pickupDate } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.dhl?.awbNumber) {
            return res.status(400).json({ message: 'Create shipment first before scheduling pickup' });
        }
        if (order.dhl.pickupConfirmed) {
            return res.status(400).json({ message: 'Pickup already scheduled for this order' });
        }

        const date = pickupDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const result = await schedulePickup(order.dhl.awbNumber, date);

        order.dhl.pickupConfirmed = true;
        order.dhl.pickupDate = date;
        order.dhl.pickupConfirmationNumber = result.confirmationNumber;
        await order.save();

        res.json({
            confirmationNumber: result.confirmationNumber,
            pickupDate: date,
        });
    } catch (err) {
        console.error('[DHL schedule-pickup error]', err.message);
        res.status(500).json({ message: err.message });
    }
});

export default router;
