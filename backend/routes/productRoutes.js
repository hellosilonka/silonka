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

// Accept 'image' (1 primary) + 'images' (up to 9 gallery) in one multipart request
const productUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 9 },
]);

router.route('/')
    .get(getProducts)
    .post(protect, admin, productUpload, createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, productUpload, updateProduct)
    .delete(protect, admin, deleteProduct);

router.route('/:id/reviews')
    .post(protect, addReview);

router.route('/:id/related')
    .get(getRelatedProducts);

export default router;
