import { asyncHandler } from '../utils/http.js';
import express from 'express';
import { 
    createBulkOrder, 
    getBulkOrders, 
    updateBulkOrderStatus,
    deleteBulkOrder,
    deleteBulkOrdersBulk
} from '../controllers/bulkOrderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(asyncHandler(createBulkOrder))
    .get(protect, admin, asyncHandler(getBulkOrders))
    .delete(protect, admin, asyncHandler(deleteBulkOrdersBulk));
router.route('/:id')
    .put(protect, admin, asyncHandler(updateBulkOrderStatus))
    .delete(protect, admin, asyncHandler(deleteBulkOrder));

export default router;
