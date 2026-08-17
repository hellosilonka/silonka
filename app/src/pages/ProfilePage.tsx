import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ShoppingBag, Package, CheckCircle, Clock, Truck, ExternalLink, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders } from '@/lib/api';
import SEOHead from '@/components/SEOHead';

interface OrderItem {
    name: string;
    qty: number;
    price: number;
    image: string;
}

interface Order {
    _id: string;
    createdAt: string;
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    totalPrice: number;
    shippingPrice: number;
    itemsPrice: number;
    orderItems: OrderItem[];
    shippingAddress: { country?: string; city?: string };
    dhl?: {
        awbNumber?: string;
        trackingUrl?: string;
        shipmentCreated?: boolean;
        pickupConfirmed?: boolean;
    };
}

function StatusBadge({ order }: { order: Order }) {
    if (order.isDelivered) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle className="w-3 h-3" /> Delivered
            </span>
        );
    }
    if (order.dhl?.shipmentCreated) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Truck className="w-3 h-3" /> Shipped
            </span>
        );
    }
    if (order.isPaid) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
                <Package className="w-3 h-3" /> Processing
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-white/5 text-ivory-muted border border-white/10">
            <Clock className="w-3 h-3" /> Pending Payment
        </span>
    );
}

export default function ProfilePage() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!user) {
            navigate('/login');
            return;
        }
        getMyOrders()
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user, navigate]);

    if (!user) return null;

    const initials = (user.name || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const memberSince = new Date(
        orders.length > 0
            ? Math.min(...orders.map(o => new Date(o.createdAt).getTime()))
            : Date.now()
    );

    return (
        <div className="min-h-screen bg-charcoal pt-20">
            <SEOHead
                title="My Profile — Silonka"
                description="View your Silonka profile, order history, and track your DHL shipments."
                canonicalPath="/profile"
                noIndex
            />

            {/* Hero */}
            <section className="relative py-12 sm:py-16 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
                <div className="relative px-4 sm:px-6 lg:px-[7vw]">
                    <Link to="/" className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    {/* Profile card */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-3xl">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-gold/30" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
                                    <span className="font-display text-2xl text-gold">{initials}</span>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-charcoal" />
                        </div>

                        <div className="flex-1">
                            <h1 className="font-display text-3xl sm:text-4xl text-ivory mb-1">{user.name}</h1>
                            <div className="flex items-center gap-2 text-ivory-muted text-sm mb-3">
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-[11px] font-mono uppercase tracking-wider border border-gold/20">
                                    {orders.length} Orders
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/5 text-ivory-muted text-[11px] font-mono uppercase tracking-wider border border-white/10">
                                    Member since {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => { logoutUser(); navigate('/'); }}
                            className="flex-shrink-0 px-4 py-2 rounded-xl border border-white/10 text-ivory-muted hover:border-red-500/30 hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick links */}
            <section className="py-6 px-4 sm:px-6 lg:px-[7vw] border-b border-white/5">
                <div className="max-w-3xl flex flex-wrap gap-3">
                    <Link
                        to="/track"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold font-mono text-xs uppercase tracking-wider hover:bg-gold/20 transition-colors"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Track My Order
                    </Link>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-ivory-muted font-mono text-xs uppercase tracking-wider hover:border-gold/30 hover:text-ivory transition-colors"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Shop Now
                    </Link>
                </div>
            </section>

            {/* Order history */}
            <section className="py-10 px-4 sm:px-6 lg:px-[7vw] pb-20">
                <div className="max-w-3xl">
                    <h2 className="font-display text-2xl text-ivory mb-6 flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-gold" />
                        Order History
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 p-8 rounded-2xl bg-charcoal-card border border-white/5">
                            <ShoppingBag className="w-12 h-12 text-ivory-muted/20 mx-auto mb-3" />
                            <p className="text-ivory-muted mb-4">You haven't placed any orders yet.</p>
                            <Link to="/shop" className="inline-flex px-6 py-3 bg-gold text-charcoal font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-gold-light transition-colors">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div
                                    key={order._id}
                                    className="rounded-2xl bg-charcoal-card border border-white/5 hover:border-gold/20 transition-colors duration-300 overflow-hidden"
                                >
                                    {/* Order header */}
                                    <button
                                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 text-left"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-ivory-muted/50 uppercase tracking-widest">
                                                    #{String(order._id).slice(-8).toUpperCase()}
                                                </span>
                                                <StatusBadge order={order} />
                                            </div>
                                            <p className="text-ivory-muted/60 text-xs font-mono">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {order.shippingAddress?.city && ` · ${order.shippingAddress.city}, ${order.shippingAddress.country}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className="font-display text-lg text-gold">
                                                USD {order.totalPrice.toFixed(2)}
                                            </span>
                                            <span className={`text-ivory-muted/40 text-xs transition-transform duration-200 ${expandedOrder === order._id ? 'rotate-180' : ''}`}>▾</span>
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {expandedOrder === order._id && (
                                        <div className="border-t border-white/5 p-5 sm:p-6 space-y-5">
                                            {/* Items */}
                                            <div className="space-y-3">
                                                {order.orderItems.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <img
                                                            src={item.image?.startsWith('/uploads') ? `${import.meta.env.PROD ? '' : 'http://localhost:5000'}${item.image}` : item.image}
                                                            alt={item.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-white/5"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-ivory text-sm truncate">{item.name}</p>
                                                            <p className="text-ivory-muted/50 text-xs">Qty: {item.qty}</p>
                                                        </div>
                                                        <span className="font-mono text-sm text-ivory/80">USD {(item.price * item.qty).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pricing breakdown */}
                                            <div className="bg-charcoal rounded-xl p-4 space-y-1.5 text-sm">
                                                <div className="flex justify-between text-ivory-muted">
                                                    <span>Items</span>
                                                    <span className="font-mono">USD {(order.itemsPrice || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-ivory-muted">
                                                    <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> DHL Shipping</span>
                                                    <span className="font-mono">USD {(order.shippingPrice || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-ivory font-medium pt-1.5 border-t border-white/5">
                                                    <span>Total</span>
                                                    <span className="font-mono text-gold">USD {order.totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* DHL Tracking */}
                                            {order.dhl?.awbNumber ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gold/5 border border-gold/20">
                                                    <div>
                                                        <p className="text-gold font-mono text-xs uppercase tracking-wider mb-0.5">DHL Tracking</p>
                                                        <p className="text-ivory font-mono text-sm">{order.dhl.awbNumber}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/track?awb=${order.dhl.awbNumber}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold text-charcoal font-mono text-[11px] uppercase tracking-wider hover:bg-gold-light transition-colors"
                                                        >
                                                            <Search className="w-3 h-3" />
                                                            Track
                                                        </Link>
                                                        {order.dhl.trackingUrl && (
                                                            <a
                                                                href={order.dhl.trackingUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-ivory-muted font-mono text-[11px] uppercase tracking-wider hover:border-gold/30 transition-colors"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                DHL Site
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-white/3 border border-white/8 flex items-center gap-3">
                                                    <Truck className="w-4 h-4 text-ivory-muted/40 flex-shrink-0" />
                                                    <p className="text-ivory-muted/60 text-sm">
                                                        {order.isPaid
                                                            ? 'Your order is being prepared. Tracking details will appear here once dispatched.'
                                                            : 'Awaiting payment confirmation.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
