import Order from '../models/Order.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
    } else {
        const order = new Order({
            orderItems: orderItems.map((x) => ({
                name: x.name,
                qty: x.qty ?? x.quantity,
                image: x.image,
                price: x.price,
                product: x.product || x._id || x.id,
            })),
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice: itemsPrice || 0,
            taxPrice: taxPrice || 0,
            shippingPrice: shippingPrice || 0,
            totalPrice,
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order to paid (Mock)
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order DHL info (admin manually sets AWB after creating DHL shipment)
// @route   PUT /api/orders/:id/dhl
// @access  Private/Admin
export const updateOrderDHL = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { awbNumber, trackingUrl, labelPdf, shipmentCreated, pickupConfirmed, pickupDate, pickupConfirmationNumber } = req.body;

        order.dhl = {
            ...order.dhl,
            ...(awbNumber !== undefined && { awbNumber }),
            ...(trackingUrl !== undefined && { trackingUrl }),
            ...(labelPdf !== undefined && { labelPdf }),
            ...(shipmentCreated !== undefined && { shipmentCreated }),
            ...(pickupConfirmed !== undefined && { pickupConfirmed }),
            ...(pickupDate !== undefined && { pickupDate }),
            ...(pickupConfirmationNumber !== undefined && { pickupConfirmationNumber }),
        };

        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments();
    const orders = await Order.find({})
        .populate('user', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.json({ orders, page, pages: Math.ceil(count / limit), total: count });
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await Order.deleteOne({ _id: order._id });
            res.json({ message: 'Order removed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk delete orders
// @route   DELETE /api/orders
// @access  Private/Admin
export const deleteOrdersBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No valid ids provided' });
        }
        await Order.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Orders removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
