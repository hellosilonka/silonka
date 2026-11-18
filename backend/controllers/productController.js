import crypto from 'node:crypto';
import { productInput, productArray, productImage } from '../utils/productInput.js';
import { textField, httpError } from '../utils/http.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadToCloudinary, uploadManyToCloudinary } from '../middleware/upload.js';

// ─── Helper: resolve uploaded files from req ─────────────────────────────────
// Supports both upload.single('image') and upload.fields([{name:'image'},{name:'images'}])
function resolveFiles(req) {
    let primaryFile = null;
    let galleryFiles = [];

    if (req.files && !Array.isArray(req.files)) {
        // upload.fields() — object keyed by field name
        const imgArr = req.files['image'] || [];
        const imgsArr = req.files['images'] || [];
        primaryFile = imgArr[0] || null;
        galleryFiles = imgsArr;
    } else if (req.files && Array.isArray(req.files)) {
        // upload.array() fallback
        primaryFile = req.files[0] || null;
        galleryFiles = req.files.slice(1);
    } else if (req.file) {
        // upload.single() fallback
        primaryFile = req.file;
    }

    return { primaryFile, galleryFiles };
}

// ─── GET /api/products ───────────────────────────────────────────────────────
export const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = {};
        if (category) filter.category = textField(category, 'category', 100);
        if (search) filter.name = { $regex: textField(search, 'search', 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        const products = await Product.find(filter).select('-reviews').sort({ createdAt: -1 }).limit(500).lean();
        res.json(products);
    } catch (error) {
        throw error;
    }
};

// ─── GET /api/products/:id ───────────────────────────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        throw error;
    }
};

// ─── POST /api/products ──────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
    const data = productInput(req.body);
    if (!await Category.exists({ name: data.category })) throw httpError(400, 'Select an existing category.');
    const { primaryFile, galleryFiles } = resolveFiles(req);
    if (!primaryFile && !req.body.image) throw httpError(400, 'Add a cover image before creating the product.');
    if (galleryFiles.length > 6) throw httpError(400, 'Use up to 6 gallery images.');
    const product = new Product({ ...data, id: `prod-${crypto.randomUUID()}`, image: primaryFile ? '/pending-upload' : productImage(req.body.image), images: [] });
    // Reject invalid data before spending upload bandwidth or creating cloud assets.
    await product.validate();
    const [cover, gallery] = await Promise.all([
        primaryFile ? uploadToCloudinary(primaryFile) : product.image,
        uploadManyToCloudinary(galleryFiles),
    ]);
    product.image = cover;
    product.images = gallery;
    res.status(201).json(await product.save());
};

export const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    const data = productInput(req.body, { partial: true, existingOptionIds: product.variations.map(option => String(option._id)) });
    if (data.category !== undefined && !await Category.exists({ name: data.category })) throw httpError(400, 'Select an existing category.');
    const { primaryFile, galleryFiles } = resolveFiles(req);
    const removals = req.body.removeImages === undefined ? [] : productArray(req.body.removeImages, 'Removed images', 100).map(url => textField(url, 'removed image URL', 2000));
    const retained = (product.images || []).filter(url => !removals.includes(url));
    if (retained.length + galleryFiles.length > 6) throw httpError(400, 'Keep up to 6 gallery images. Remove an image before adding another.');
    Object.assign(product, data);
    if (!primaryFile && req.body.image !== undefined) product.image = productImage(req.body.image);
    await product.validate();
    const [cover, gallery] = await Promise.all([
        primaryFile ? uploadToCloudinary(primaryFile) : product.image,
        uploadManyToCloudinary(galleryFiles),
    ]);
    product.image = cover;
    product.images = [...retained, ...gallery];
    res.json(await product.save());
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed' });
    } catch (error) {
        throw error;
    }
};

// ─── POST /api/products/:id/reviews ─────────────────────────────────────────
export const addReview = async (req, res) => {
    try {
        const { rating } = req.body;
        const comment = textField(req.body.comment, 'review', 2000);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Choose a rating from 1 to 5.');
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(
            (r) => r.user?.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        product.reviews.push({
            user: req.user._id,
            userName: req.user.name,
            rating: Number(rating),
            comment,
        });
        product.calcAverageRating();
        await product.save();

        res.status(201).json({ message: 'Review added', averageRating: product.averageRating, numReviews: product.numReviews });
    } catch (error) {
        throw error;
    }
};

// ─── GET /api/products/:id/related ──────────────────────────────────────────
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const related = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
        }).limit(4);

        if (related.length < 4) {
            const excludeIds = [product._id, ...related.map(p => p._id)];
            const more = await Product.find({ _id: { $nin: excludeIds } }).limit(4 - related.length);
            related.push(...more);
        }

        res.json(related);
    } catch (error) {
        throw error;
    }
};
