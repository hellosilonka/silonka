import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });

const variationSchema = new mongoose.Schema({
    label: { type: String, required: true },      // e.g. "50g", "100g", "250g"
    price: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    images: [{ type: String }],                     // additional gallery images
    category: { type: String, required: true },
    weight: { type: String, required: true },
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

const Product = mongoose.model('Product', productSchema);
export default Product;
