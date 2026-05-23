import Order from '../models/Order.js';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Helper: get PayPal access token
async function getPayPalAccessToken() {
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'Failed to get PayPal token');
    return data.access_token;
}

// @desc    Create PayPal order
// @route   POST /api/payment/create-order
// @access  Private
export const createPayPalOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: order._id.toString(),
                        description: `Silonka Order #${order._id.toString().slice(-8).toUpperCase()}`,
                        amount: {
                            currency_code: 'USD',
                            value: order.totalPrice.toFixed(2),
                        },
                    },
                ],
                application_context: {
                    brand_name: 'Silonka',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                },
            }),
        });

        const paypalOrder = await response.json();
        if (!response.ok) {
            console.error('PayPal create order error:', paypalOrder);
            return res.status(500).json({ message: 'Failed to create PayPal order' });
        }

        res.json({ id: paypalOrder.id });
    } catch (error) {
        console.error('Create PayPal order error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Capture PayPal payment after buyer approval
// @route   POST /api/payment/capture-order
// @access  Private
export const capturePayPalOrder = async (req, res) => {
    try {
        const { paypalOrderId, orderId } = req.body;

        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const captureData = await response.json();
        if (!response.ok) {
            console.error('PayPal capture error:', captureData);
            return res.status(500).json({ message: 'Failed to capture PayPal payment' });
        }

        // Mark order as paid
        const order = await Order.findById(orderId);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: captureData.id,
                status: captureData.status,
                update_time: captureData.update_time || new Date().toISOString(),
                email_address: captureData.payer?.email_address || '',
            };
            await order.save();
        }

        res.json({
            success: true,
            captureData,
        });
    } catch (error) {
        console.error('Capture PayPal order error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Return PayPal client ID to frontend
// @route   GET /api/payment/config
// @access  Public
export const getPayPalConfig = (req, res) => {
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};
