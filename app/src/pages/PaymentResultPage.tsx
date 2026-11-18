import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getOrder, errorMessage, type CustomerOrder } from '@/lib/api';
import SEOHead from '@/components/SEOHead';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  return <PaymentStatus key={`${user?._id || 'guest'}:${params.get('order') || ''}`} />;
}

function PaymentStatus() {
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  const cancelled = params.get('cancelled') === '1';
  const { user, loading: authLoading } = useAuth();
  const { completeOrder } = useCart();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (authLoading || !user || !/^[a-f\d]{24}$/i.test(orderId)) return;
    let active = true, attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const latest = await getOrder(orderId);
        if (!active) return;
        setOrder(latest); setError('');
        if (latest.isPaid && latest.paymentStatus === 'paid') {
          completeOrder(latest._id, latest.orderItems);
          setChecking(false);
        } else if (latest.paymentStatus !== 'pending' || ++attempts >= 15) {
          setChecking(false);
        } else { timer = setTimeout(poll, 3000); }
      } catch (err) { if (active) { setError(errorMessage(err, 'Payment status is unavailable. Please check again shortly.')); setChecking(false); } }
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [authLoading, user, orderId, retry, completeOrder]);
  const paid = order?.isPaid && order.paymentStatus === 'paid';
  const failed = order && ['failed', 'cancelled', 'chargedback'].includes(order.paymentStatus);
  const title = paid ? 'Payment confirmed' : failed ? 'Payment was not completed' : cancelled ? 'Payment not confirmed' : 'Checking your payment';
  const returnPath = `/checkout/result?${params.toString()}`;
  return <div className="min-h-[75vh] pt-36 pb-20 px-5 text-center"><SEOHead title="Payment status — Silonka" description="Check your order payment status." canonicalPath="/checkout/result" noIndex />
    <div className="max-w-lg mx-auto bg-charcoal-card border border-white/10 p-6 sm:p-10 rounded-2xl">
      {paid ? <CheckCircle size={48} className="mx-auto mb-6 text-green-400" /> : failed || error ? <AlertCircle size={48} className="mx-auto mb-6 text-amber-300" /> : <Clock size={48} className="mx-auto mb-6 text-gold" />}
      <h1 className="font-display text-3xl text-ivory mb-4">{title}</h1>
      {!/^[a-f\d]{24}$/i.test(orderId) ? <p role="alert" className="text-ivory-muted">This payment link is invalid. Open your profile to view your orders.</p> : authLoading ? <p role="status" className="text-ivory-muted">Loading your session…</p> : !user ? <><p className="text-ivory-muted mb-5">Sign in to check this order securely.</p><Link className="btn-gold inline-block" to={`/login?redirect=${encodeURIComponent(returnPath)}`}>Sign in</Link></> : <>
        <p className="text-ivory-muted mb-6">{paid ? 'Thank you. We have received your payment and will prepare your order for dispatch.' : failed ? 'Your cart is saved. If your bank shows a charge, contact us with your order reference before paying again.' : 'We have not yet received a verified payment confirmation. This can take a little time. Please check the status before starting another payment.'}</p>
        {error && <p role="alert" className="text-red-300 mb-5">{error}</p>}
        <p className="text-sm font-mono text-gold break-all mb-6">Order: {orderId}</p>
        {!paid && <button disabled={checking} onClick={() => { setChecking(true); setRetry(value => value + 1); }} className="btn-gold w-full mb-4 disabled:opacity-60 flex items-center justify-center gap-2">{checking && <Loader2 size={18} className="animate-spin" />}{checking ? 'Waiting for confirmation…' : 'Check payment status'}</button>}
      </>}
      <div className="flex flex-wrap justify-center gap-5 mt-5"><Link className="text-gold underline" to="/profile">My orders</Link><Link className="text-gold underline" to={paid ? '/shop' : '/checkout'}>{paid ? 'Continue shopping' : 'Return to cart'}</Link><Link className="text-ivory-muted underline" to="/contact">Contact us</Link></div>
    </div>
  </div>;
}
