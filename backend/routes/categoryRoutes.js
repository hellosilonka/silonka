import { asyncHandler } from '../utils/http.js';
import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(asyncHandler(getCategories)).post(protect, admin, asyncHandler(createCategory));
router.route('/:id').put(protect, admin, asyncHandler(updateCategory)).delete(protect, admin, asyncHandler(deleteCategory));

export default router;
