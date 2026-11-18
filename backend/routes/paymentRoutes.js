import express from 'express';
import { getPaymentConfig, createPayHerePayment, notifyPayHere } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/http.js';
const router = express.Router();
router.get('/config', getPaymentConfig);
router.post('/payhere/create', protect, asyncHandler(createPayHerePayment));
router.post('/payhere/notify', asyncHandler(notifyPayHere));
export default router;
