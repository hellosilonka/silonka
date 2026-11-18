import { asyncHandler } from '../utils/http.js';
import express from 'express';
import {
    getBlogs,
    getBlogBySlug,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
} from '../controllers/blogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', (req, res, next) => req.query.admin === 'true' ? protect(req, res, () => admin(req, res, next)) : next(), asyncHandler(getBlogs));
router.get('/slug/:slug', asyncHandler(getBlogBySlug));

// Admin routes
router.get('/id/:id', protect, admin, asyncHandler(getBlogById));
router.post('/', protect, admin, upload.single('image'), asyncHandler(createBlog));
router.put('/:id', protect, admin, upload.single('image'), asyncHandler(updateBlog));
router.delete('/:id', protect, admin, asyncHandler(deleteBlog));

export default router;
