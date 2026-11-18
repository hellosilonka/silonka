import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });

const variationSchema = new mongoose.Schema({
    label: { type: String, required: true },      // e.g. "50g", "100g", "250g"
    price: { type: Number, required: true, min: 0.01, max: 100000 },
    shippingWeightKg: { type: Number, min: 0.001, max: 70 },
    image: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: '' },
    price: { type: Number, required: true, min: 0.01, max: 100000 },
    priceIsSample: { type: Boolean, default: false },
    imageIsReference: { type: Boolean, default: false },
    shippingWeightEstimated: { type: Boolean, default: false },
    specifications: [{ label: String, value: String, _id: false }],
    image: { type: String, required: true },
    images: [{ type: String }],                     // additional gallery images
    category: {
        type: String,
        required: true,
        maxlength: 100,
    },
    weight: { type: String, required: true },
    // Gross shipping weight (product + packaging + box) in kg — used for DHL rate calculation.
    // Different from 'weight' which is the net content weight shown on the label.
    shippingWeightKg: { type: Number, default: 1.2, min: 0.001, max: 70 },
    intensity: { type: Number },
    inStock: { type: Boolean, default: true },
    origin: { type: String, default: 'Sri Lanka' },
    ingredients: { type: String, default: '' },
    shelfLife: { type: String, default: '' },
    certifications: [{ type: String }],
    variations: [variationSchema],
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
}, { timestamps: true });

// Recalculate average rating whenever reviews change
productSchema.methods.calcAverageRating = function () {
    if (this.reviews.length === 0) {
        this.averageRating = 0;
        this.numReviews = 0;
    } else {
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        this.averageRating = parseFloat((sum / this.reviews.length).toFixed(1));
        this.numReviews = this.reviews.length;
    }
};

productSchema.index({ category: 1, createdAt: -1 });
const Product = mongoose.model('Product', productSchema);
export default Product;
