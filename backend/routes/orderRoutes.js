import express from 'express';
import {
    addOrderItems,
    getMyOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    updateOrderDHL,
    getOrders,
    deleteOrder,
    deleteOrdersBulk,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, addOrderItems)
    .get(protect, admin, getOrders)
    .delete(protect, admin, deleteOrdersBulk);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, admin, deleteOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/dhl').put(protect, admin, updateOrderDHL);

export default router;
