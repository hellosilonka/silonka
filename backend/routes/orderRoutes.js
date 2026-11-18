import express from 'express';
import {
    addOrderItems,
    getMyOrders,
    getOrderById,
    getCheckoutQuote,
    updateOrderToDelivered,
    updateOrderDHL,
    getOrders,
    deleteOrder,
    deleteOrdersBulk,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/http.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import Order from '../models/Order.js';

const router = express.Router();
router.get('/summary', protect, admin, asyncHandler(getDashboardSummary));
router.get('/:id/label', protect, admin, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).select('dhl.labelPdf');
    if (!order?.dhl?.labelPdf) return res.status(404).json({ message: 'Shipping label not available.' });
    res.setHeader('Content-Disposition', 'attachment; filename="shipping-label.pdf"');
    res.type('application/pdf').send(Buffer.from(order.dhl.labelPdf, 'base64'));
}));

router.post('/quote', protect, asyncHandler(getCheckoutQuote));
router.route('/')
    .post(protect, asyncHandler(addOrderItems))
    .get(protect, admin, asyncHandler(getOrders))
    .delete(protect, admin, asyncHandler(deleteOrdersBulk));
router.route('/myorders').get(protect, asyncHandler(getMyOrders));
router.route('/:id')
    .get(protect, asyncHandler(getOrderById))
    .delete(protect, admin, asyncHandler(deleteOrder));
router.route('/:id/deliver').put(protect, admin, asyncHandler(updateOrderToDelivered));
router.route('/:id/dhl').put(protect, admin, asyncHandler(updateOrderDHL));

export default router;
