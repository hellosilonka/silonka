import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { ShoppingBag, ArrowLeft, MapPin, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, createPayPalOrder, capturePayPalOrder } from '@/lib/api';
import SEOHead from '@/components/SEOHead';

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const { format } = useCurrency();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [address, setAddress] = useState({ address: '', city: '', postalCode: '', country: '' });
    const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
    const [dbOrderId, setDbOrderId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [creatingOrder, setCreatingOrder] = useState(false);

    // Create the order in our DB when user proceeds to payment
    const handleProceedToPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;
        if (!user) {
            setErrorMsg('Please log in to complete checkout.');
            return;
        }
        setCreatingOrder(true);
        setErrorMsg('');

        try {
            const order = await createOrder({
                orderItems: items.map(item => ({ ...item, product: item.id })),
                shippingAddress: address,
                paymentMethod: 'PayPal',
                itemsPrice: totalPrice,
                taxPrice: 0,
                shippingPrice: 0,
                totalPrice: totalPrice,
            });
            setDbOrderId(order._id);
            setStep('payment');
        } catch (error: any) {
            const msg = error.response?.data?.message || '';
            if (msg.includes('Not authorized') || msg.includes('no token') || error.response?.status === 401) {
                setErrorMsg('Your session has expired. Please log in again to continue.');
            } else {
                setErrorMsg(msg || 'Failed to create order. Please try again.');
            }
        } finally {
            setCreatingOrder(false);
        }
    };

    if (items.length === 0 && step !== 'success') {
        return (
            <div className="min-h-screen bg-charcoal pt-32 text-center">
                <ShoppingBag className="w-16 h-16 text-ivory-muted/30 mx-auto mb-4" />
                <h2 className="font-display text-3xl text-ivory mb-4">Your cart is empty</h2>
                <button onClick={() => navigate('/shop')} className="text-gold font-mono uppercase text-sm hover:text-gold-light transition-colors">
                    Return to Shop
                </button>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-charcoal pt-32 text-center px-4">
                <SEOHead title="Order Confirmed — Silonka" description="Your order has been placed successfully." canonicalPath="/checkout" noIndex />
                <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-ivory mb-3">Order Confirmed!</h1>
                    <p className="text-ivory-muted mb-8">Thank you for your purchase. Your premium Ceylon spices are on their way.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/shop" className="px-6 py-3 rounded-xl bg-gold text-charcoal font-mono text-xs uppercase tracking-widest hover:bg-gold-light transition-colors">
                            Continue Shopping
                        </Link>
                        <Link to="/" className="px-6 py-3 rounded-xl border border-white/10 text-ivory-muted font-mono text-xs uppercase tracking-widest hover:border-gold/50 hover:text-ivory transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal pt-24 pb-16 px-4">
            <SEOHead title="Checkout — Silonka" description="Complete your order for premium Ceylon spices from Silonka." canonicalPath="/checkout" noIndex />

            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <Link to="/shop" className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shop
                </Link>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-10">
                    {[
                        { label: 'Shipping', icon: MapPin, key: 'shipping' },
                        { label: 'Payment', icon: CreditCard, key: 'payment' },
                    ].map(({ label, icon: Icon, key }, i) => (
                        <div key={key} className="flex items-center gap-3">
                            {i > 0 && <div className={`w-12 h-px ${step === 'payment' ? 'bg-gold' : 'bg-white/10'}`} />}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                                step === key ? 'bg-gold text-charcoal' : step === 'payment' && key === 'shipping' ? 'bg-gold/20 text-gold' : 'bg-charcoal-card text-ivory-muted border border-white/10'
                            }`}>
                                <Icon className="w-4 h-4" />
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {step === 'shipping' && (
                            <form onSubmit={handleProceedToPayment} className="bg-charcoal-card p-6 sm:p-8 rounded-2xl border border-white/5">
                                <h2 className="font-display text-xl text-ivory mb-6 flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-gold" />
                                    Shipping Address
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Street Address" required
                                        value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })}
                                        className="col-span-1 sm:col-span-2 px-4 py-3.5 rounded-xl bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/40 focus:border-gold/50 focus:outline-none transition-colors text-sm"
                                    />
                                    <input
                                        type="text" placeholder="City" required
                                        value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })}
                                        className="px-4 py-3.5 rounded-xl bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/40 focus:border-gold/50 focus:outline-none transition-colors text-sm"
                                    />
                                    <input
                                        type="text" placeholder="Postal Code" required
                                        value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })}
                                        className="px-4 py-3.5 rounded-xl bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/40 focus:border-gold/50 focus:outline-none transition-colors text-sm"
                                    />
                                    <input
                                        type="text" placeholder="Country" required
                                        value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })}
                                        className="col-span-1 sm:col-span-2 px-4 py-3.5 rounded-xl bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/40 focus:border-gold/50 focus:outline-none transition-colors text-sm"
                                    />
                                </div>

                                {errorMsg && (
                                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-3">
                                        <span>{errorMsg}</span>
                                        {errorMsg.includes('session') && (
                                            <Link to="/login" className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-gold text-charcoal font-mono text-[10px] uppercase tracking-widest hover:bg-gold-light transition-colors">
                                                Log In
                                            </Link>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={creatingOrder}
                                    className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-gold text-charcoal font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all"
                                >
                                    {creatingOrder ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating Order...</>
                                    ) : (
                                        <>Proceed to Payment <CreditCard className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        )}

                        {step === 'payment' && dbOrderId && (
                            <div className="bg-charcoal-card p-6 sm:p-8 rounded-2xl border border-white/5">
                                <h2 className="font-display text-xl text-ivory mb-2 flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-gold" />
                                    Payment
                                </h2>
                                <p className="text-ivory-muted text-sm mb-6">Complete your payment securely with PayPal.</p>

                                {errorMsg && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{errorMsg}</div>
                                )}

                                <div className="bg-charcoal rounded-xl p-4 sm:p-6 border border-white/5">
                                    <PayPalButtonWrapper
                                        orderId={dbOrderId}
                                        onSuccess={() => {
                                            clearCart();
                                            setStep('success');
                                        }}
                                        onError={(msg) => setErrorMsg(msg)}
                                    />
                                </div>

                                <button
                                    onClick={() => setStep('shipping')}
                                    className="mt-4 flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest"
                                >
                                    <ArrowLeft className="w-3 h-3" /> Back to Shipping
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-2">
                        <div className="bg-charcoal-card p-6 rounded-2xl border border-white/5 sticky top-28">
                            <h2 className="font-display text-lg text-ivory mb-5 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-gold" />
                                Order Summary
                            </h2>

                            <div className="space-y-3 mb-5">
                                {items.map(item => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <img
                                            src={item.image?.startsWith('/uploads') ? `${import.meta.env.PROD ? '' : 'http://localhost:5000'}${item.image}` : item.image}
                                            alt={item.name}
                                            className="w-12 h-12 rounded-lg object-cover border border-white/5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-ivory text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-ivory-muted/60 text-xs">
                                                {item.variant && <span>{item.variant} · </span>}
                                                Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <span className="font-mono text-sm text-ivory flex-shrink-0">{format(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-ivory-muted">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{format(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-ivory-muted">
                                    <span>Shipping</span>
                                    <span className="font-mono text-green-400">Free</span>
                                </div>
                            </div>

                            <div className="border-t border-white/5 mt-4 pt-4 flex justify-between items-baseline">
                                <span className="font-display text-lg text-ivory">Total</span>
                                <span className="font-display text-2xl text-gold">{format(totalPrice)}</span>
                            </div>

                            {/* Trust */}
                            <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-ivory-muted/50 text-[10px] font-mono uppercase tracking-widest">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Secured by PayPal
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Isolated component for PayPal buttons
function PayPalButtonWrapper({
    orderId,
    onSuccess,
    onError,
}: {
    orderId: string;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const [{ isPending }] = usePayPalScriptReducer();

    if (isPending) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <PayPalButtons
            style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal',
                height: 50,
            }}
            createOrder={async () => {
                try {
                    const data = await createPayPalOrder(orderId);
                    return data.id;
                } catch (err: any) {
                    onError(err?.response?.data?.message || 'Failed to create PayPal order');
                    throw err;
                }
            }}
            onApprove={async (data) => {
                try {
                    await capturePayPalOrder(data.orderID, orderId);
                    onSuccess();
                } catch (err: any) {
                    onError(err?.response?.data?.message || 'Payment capture failed');
                }
            }}
            onError={(err) => {
                console.error('PayPal error:', err);
                onError('Payment failed. Please try again.');
            }}
            onCancel={() => {
                onError('Payment was cancelled.');
            }}
        />
    );
}
