import Product from '../models/Product.js';
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
        if (category) filter.category = category;
        if (search) filter.name = { $regex: search, $options: 'i' };
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET /api/products/:id ───────────────────────────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── POST /api/products ──────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
    try {
        const {
            name, price, description, longDescription,
            category, weight, intensity, inStock,
            origin, ingredients, shelfLife, certifications,
            variations, image: imageUrl,
        } = req.body;

        const { primaryFile, galleryFiles } = resolveFiles(req);

        // Upload primary image
        let image = imageUrl || '/images/sample.jpg';
        if (primaryFile) {
            image = await uploadToCloudinary(primaryFile);
        }

        // Upload gallery images
        const uploadedGallery = await uploadManyToCloudinary(galleryFiles);

        // Parse certifications (may come as JSON string or comma-separated)
        let certs = [];
        if (certifications) {
            try { certs = JSON.parse(certifications); }
            catch { certs = String(certifications).split(',').map(s => s.trim()).filter(Boolean); }
        }

        // Parse variations (JSON array)
        let vars = [];
        if (variations) {
            try { vars = JSON.parse(variations); }
            catch { vars = []; }
        }

        const product = new Product({
            id: `prod-${Date.now()}`,
            name: name || 'New Product',
            price: Number(price) || 0,
            description: description || '',
            longDescription: longDescription || '',
            image,
            images: uploadedGallery,
            category: category || 'Uncategorised',
            weight: weight || '100g',
            intensity: intensity ? Number(intensity) : undefined,
            inStock: inStock !== undefined ? (inStock === 'true' || inStock === true) : true,
            origin: origin || 'Sri Lanka',
            ingredients: ingredients || '',
            shelfLife: shelfLife || '',
            certifications: certs,
            variations: vars,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('[createProduct error]', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── PUT /api/products/:id ───────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const {
            name, price, description, longDescription,
            category, weight, intensity, inStock,
            origin, ingredients, shelfLife, certifications,
            variations, image: imageUrl,
            removeImages,   // JSON array of URL strings to remove from gallery
        } = req.body;

        const { primaryFile, galleryFiles } = resolveFiles(req);

        // Update simple fields
        if (name !== undefined) product.name = name;
        if (price !== undefined) product.price = Number(price);
        if (description !== undefined) product.description = description;
        if (longDescription !== undefined) product.longDescription = longDescription;
        if (category !== undefined) product.category = category;
        if (weight !== undefined) product.weight = weight;
        if (intensity !== undefined) product.intensity = Number(intensity);
        if (inStock !== undefined) product.inStock = inStock === 'true' || inStock === true;
        if (origin !== undefined) product.origin = origin;
        if (ingredients !== undefined) product.ingredients = ingredients;
        if (shelfLife !== undefined) product.shelfLife = shelfLife;

        if (certifications !== undefined) {
            try { product.certifications = JSON.parse(certifications); }
            catch { product.certifications = String(certifications).split(',').map(s => s.trim()).filter(Boolean); }
        }

        if (variations !== undefined) {
            try { product.variations = JSON.parse(variations); }
            catch { /* keep existing */ }
        }

        // Handle primary image
        if (primaryFile) {
            product.image = await uploadToCloudinary(primaryFile);
        } else if (imageUrl && imageUrl !== product.image) {
            product.image = imageUrl;
        }

        // Handle gallery images
        const newGalleryUploads = await uploadManyToCloudinary(galleryFiles);

        // Remove images explicitly requested to be deleted
        let existingGallery = [...(product.images || [])];
        if (removeImages) {
            try {
                const toRemove = JSON.parse(removeImages);
                existingGallery = existingGallery.filter(url => !toRemove.includes(url));
            } catch { /* ignore parse errors */ }
        }

        product.images = [...existingGallery, ...newGalleryUploads];

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        console.error('[updateProduct error]', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── DELETE /api/products/:id ────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── POST /api/products/:id/reviews ─────────────────────────────────────────
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
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
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
    }
};
