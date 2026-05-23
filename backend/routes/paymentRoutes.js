import express from 'express';
import { createPayPalOrder, capturePayPalOrder, getPayPalConfig } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', getPayPalConfig);
router.post('/create-order', protect, createPayPalOrder);
router.post('/capture-order', protect, capturePayPalOrder);

export default router;
