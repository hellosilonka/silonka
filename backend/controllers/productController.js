import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (search) filter.name = { $regex: search, $options: 'i' };
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, weight, intensity, inStock } = req.body;
        // Image can come from file upload (multer) or URL string
        let image = '/images/sample.jpg';
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const product = new Product({
            name: name || 'Sample name',
            price: Number(price) || 0,
            user: req.user._id,
            image,
            category: category || 'Sample category',
            description: description || 'Sample description',
            weight: weight || '100g',
            intensity: intensity ? Number(intensity) : undefined,
            inStock: inStock !== undefined ? inStock === 'true' || inStock === true : true,
            id: `prod-${Date.now()}`
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { name, price, description, category, weight, intensity, inStock } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.name = name ?? product.name;
        product.price = price !== undefined ? Number(price) : product.price;
        product.description = description ?? product.description;
        product.category = category ?? product.category;
        product.weight = weight ?? product.weight;
        if (intensity !== undefined) product.intensity = Number(intensity);
        if (inStock !== undefined) product.inStock = inStock === 'true' || inStock === true;

        if (req.file) {
            product.image = `/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            product.image = req.body.image;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Check if user already reviewed
        const alreadyReviewed = product.reviews.find(
            (r) => r.user?.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = {
            user: req.user._id,
            userName: req.user.name,
            rating: Number(rating),
            comment,
        };

        product.reviews.push(review);
        product.calcAverageRating();
        await product.save();

        res.status(201).json({ message: 'Review added', averageRating: product.averageRating, numReviews: product.numReviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get related products (same category, excluding current)
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const related = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
        }).limit(4);

        // If not enough same-category products, fill with random others
        if (related.length < 4) {
            const excludeIds = [product._id, ...related.map(p => p._id)];
            const more = await Product.find({ _id: { $nin: excludeIds } })
                .limit(4 - related.length);
            related.push(...more);
        }

        res.json(related);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
