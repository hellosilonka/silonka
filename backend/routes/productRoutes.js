import { asyncHandler } from '../utils/http.js';
import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    addReview,
    getRelatedProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// One cover plus up to six gallery images, matching the editor and upload limit.
const productUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 6 },
]);

router.route('/')
    .get(asyncHandler(getProducts))
    .post(protect, admin, productUpload, asyncHandler(createProduct));

router.route('/:id')
    .get(asyncHandler(getProductById))
    .put(protect, admin, productUpload, asyncHandler(updateProduct))
    .delete(protect, admin, asyncHandler(deleteProduct));

router.route('/:id/reviews')
    .post(protect, asyncHandler(addReview));

router.route('/:id/related')
    .get(asyncHandler(getRelatedProducts));

export default router;
