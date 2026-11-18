import Order from '../models/Order.js';
import Product from '../models/Product.js';
import BulkOrder from '../models/BulkOrder.js';
export async function getDashboardSummary(req, res) {
    const [orders, products, inStock, bulkOrders, pendingBulk] = await Promise.all([
        Order.aggregate([{ $group: { _id: null, total: { $sum: 1 }, pending: { $sum: { $cond: ['$isPaid', 0, 1] } }, awaitingFulfillment: { $sum: { $cond: [{ $and: ['$isPaid', { $ne: ['$isDelivered', true] }] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $and: ['$isPaid', { $eq: ['$currency', 'USD'] }] }, '$totalPrice', 0] } } } }]),
        Product.countDocuments(), Product.countDocuments({ inStock: true }),
        BulkOrder.countDocuments(), BulkOrder.countDocuments({ status: 'pending' }),
    ]);
    res.json({ totalOrders: orders[0]?.total || 0, pendingOrders: orders[0]?.pending || 0, awaitingFulfillment: orders[0]?.awaitingFulfillment || 0, revenue: orders[0]?.revenue || 0, products, inStock, bulkOrders, pendingBulk, currency: 'USD' });
}
