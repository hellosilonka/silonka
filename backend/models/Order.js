import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    checkoutKey: { type: String, unique: true, sparse: true },
    // Retain explicit historical currencies; do not assign one to untagged old orders.
    currency: { type: String, enum: ['USD', 'EUR'], default: function () { return this.isNew ? 'USD' : undefined; } },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled', 'chargedback'], default: 'pending' },
    paymentExpiresAt: Date,
    shippingWeightKg: { type: Number, min: 0.001 },
    shippingProductCode: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1, max: 99, validate: Number.isInteger },
        variationId: String,
        variant: String,
        shippingWeightKg: Number,
        image: { type: String, required: true },
        price: { type: Number, required: true, min: 0.01 },
        product: {
            type: String,
            required: true
        }
    }],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        countryCode: { type: String },
        fullName: { type: String },
        phone: { type: String },
        email: { type: String },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String,
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, min: 0.01 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    // DHL Express fields
    dhl: {
        shipmentCreating: { type: Boolean, default: false },
        pickupCreating: { type: Boolean, default: false },
        awbNumber: { type: String },
        trackingUrl: { type: String },
        labelPdf: { type: String },       // base64 encoded PDF label
        shipmentCreated: { type: Boolean, default: false },
        pickupConfirmed: { type: Boolean, default: false },
        pickupDate: { type: String },
        pickupConfirmationNumber: { type: String },
    },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
const Order = mongoose.model('Order', orderSchema);
export default Order;
