import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, MapPin, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getCheckoutQuote, getPaymentConfig, createOrder, createPayHerePayment, errorMessage, type ShippingAddress, type CheckoutQuote } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';
import { cartKey } from '@/lib/cart';
import SEOHead from '@/components/SEOHead';

const money = (amount: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(amount);
const emptyAddress: ShippingAddress = { fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', country: '', countryCode: '' };
const addressFields = [
  { key: 'fullName', label: 'Full name', type: 'text', auto: 'name', max: 100 },
  { key: 'email', label: 'Email address', type: 'email', auto: 'email', max: 254 },
  { key: 'phone', label: 'Phone with country code', type: 'tel', auto: 'tel', max: 30 },
  { key: 'address', label: 'Street address', type: 'text', auto: 'street-address', max: 250 },
  { key: 'city', label: 'City', type: 'text', auto: 'address-level2', max: 100 },
  { key: 'postalCode', label: 'Postal code', type: 'text', auto: 'postal-code', max: 30 },
] as const;
export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [address, setAddress] = useState<ShippingAddress>(() => {
    try { const saved = JSON.parse(sessionStorage.getItem('silonka_shipping') || '{}'); return Object.fromEntries(Object.keys(emptyAddress).map(key => [key, typeof saved[key] === 'string' ? saved[key] : ''])) as unknown as ShippingAddress; } catch { return emptyAddress; }
  });
  const [review, setReview] = useState<{ quote: CheckoutQuote; cart: string; address: string } | null>(null);
  const [config, setConfig] = useState<{ available: boolean; mode?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState(false);
  const [editedContact, setEditedContact] = useState({ fullName: false, email: false });
  const cart = JSON.stringify(items.map(item => ({ product: item.id, qty: item.quantity, variationId: item.variationId })));
  const effectiveAddress = { ...address, fullName: editedContact.fullName ? address.fullName : address.fullName || user?.name || '', email: editedContact.email ? address.email : address.email || user?.email || '' };
  const addressKey = JSON.stringify(effectiveAddress);
  const validReview = review && review.cart === cart && review.address === addressKey;
  const summaryItems = validReview && review.quote.orderItems ? review.quote.orderItems.map(item => ({ ...item, id: item.product, quantity: item.qty })) : items;
  const pricesChanged = validReview && summaryItems.some(item => items.find(original => cartKey(original) === cartKey(item))?.price !== item.price);
  useEffect(() => {
    let active = true;
    getPaymentConfig().then(data => { if (active) setConfig(data); }).catch(() => { if (active) setConfigError(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { try { sessionStorage.setItem('silonka_shipping', JSON.stringify(address)); } catch { /* optional storage */ } }, [address]);
  const getQuote = async (event: FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const quote = await getCheckoutQuote(JSON.parse(cart), effectiveAddress);
      setReview({ quote, cart, address: addressKey });
      document.getElementById('checkout-title')?.focus();
    } catch (err) { setError(errorMessage(err, 'Could not calculate shipping. Please check your address and try again.')); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const pay = async () => {
    if (!validReview || busyRef.current) return;
    if (review.quote.expiresAt <= Date.now()) { setReview(null); setError('Your quote has expired. Please review your order again.'); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const order = await createOrder({ orderItems: JSON.parse(cart), shippingAddress: effectiveAddress, paymentMethod: 'PayHere', quoteToken: review.quote.quoteToken });
      const payment = await createPayHerePayment(order._id);
      if (!['https://sandbox.payhere.lk/pay/checkout', 'https://www.payhere.lk/pay/checkout'].includes(payment.action)) throw new Error('Invalid payment destination');
      const form = document.createElement('form');
      form.method = 'POST'; form.action = payment.action;
      for (const [name, value] of Object.entries(payment.fields)) { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.appendChild(input); }
      document.body.appendChild(form); form.submit(); form.remove();
    } catch (err) { setError(errorMessage(err, 'Could not open payment. Your cart has been saved. Please try again.')); }
    finally { busyRef.current = false; setBusy(false); }
  };
  if (authLoading) return <div role="status" className="pt-40 min-h-[60vh] text-center text-ivory">Loading checkout…</div>;
  if (!items.length) return <div className="pt-40 pb-20 px-6 min-h-[70vh] text-center"><ShoppingBag className="mx-auto mb-4 text-gold" size={48} /><h1 className="font-display text-3xl text-ivory mb-4">Your cart is empty</h1><Link to="/shop" className="btn-gold inline-block">Browse spices</Link></div>;
  if (!user) return <div className="pt-40 pb-20 px-6 min-h-[70vh] text-center"><h1 className="font-display text-3xl text-ivory mb-4">Sign in to checkout</h1><p className="text-ivory-muted mb-8">Your cart is saved. Sign in to securely place and track your order.</p><Link to="/login?redirect=%2Fcheckout" className="btn-gold inline-block">Sign in</Link><Link to="/signup?redirect=%2Fcheckout" className="block text-gold mt-5">Create an account</Link></div>;
  return <div className="min-h-screen bg-charcoal pt-28 pb-16 px-4">
    <SEOHead title="Secure checkout — Silonka" description="Review your shipping and pay securely with PayHere." canonicalPath="/checkout" noIndex />
    <div className="max-w-5xl mx-auto">
      <Link to="/shop" className="inline-flex gap-2 text-ivory-muted hover:text-gold mb-8"><ArrowLeft size={18} /> Continue shopping</Link>
      <h1 id="checkout-title" tabIndex={-1} className="font-display text-4xl text-ivory mb-3">{validReview ? 'Review your order' : 'Delivery details'}</h1>
      <p className="text-ivory-muted mb-8">1. Delivery <span aria-hidden="true"> → </span> 2. Review <span aria-hidden="true"> → </span> 3. Secure payment</p>
      {error && <div role="alert" className="p-4 mb-6 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20">{error}</div>}
      {(configError || config?.available === false) && <div role="alert" className="p-4 mb-6 rounded-xl border border-gold/30 text-ivory-muted">Online payments are currently unavailable. Please <Link to="/contact" className="text-gold underline">contact us</Link> for assistance.</div>}
      <div className="grid lg:grid-cols-5 gap-8">
        <section className="lg:col-span-3 bg-charcoal-card rounded-2xl p-5 sm:p-8 border border-white/10">
          {validReview ? <div>
            <h2 className="font-display text-xl text-ivory mb-5 flex gap-2"><MapPin className="text-gold" size={22} /> Delivery address</h2>
            <address className="not-italic text-ivory-muted leading-relaxed mb-6">{effectiveAddress.fullName}<br />{effectiveAddress.address}<br />{effectiveAddress.city}, {effectiveAddress.postalCode}<br />{effectiveAddress.country}<br />{effectiveAddress.email}<br />{effectiveAddress.phone}</address>
            <button onClick={() => setReview(null)} disabled={busy} className="text-gold underline mb-6">Edit delivery details</button>
            <div className="p-4 rounded-xl bg-charcoal text-ivory-muted text-sm mb-6"><ShieldCheck className="text-gold mb-2" />You’ll enter payment details on PayHere’s secure page. Your order is confirmed after PayHere verifies payment.</div>
            {config?.mode === 'sandbox' && <p className="text-amber-300 mb-4" role="status">Test checkout: use PayHere sandbox payment details.</p>}
            <p className="text-sm text-ivory-muted mb-5">By placing this order, you agree to our <Link to="/terms-and-conditions" className="text-gold underline">terms</Link> and <Link to="/refund-policy" className="text-gold underline">refund policy</Link>.</p>
            <button onClick={pay} disabled={busy || !config?.available} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}{busy ? 'Opening secure payment…' : `Pay ${money(review.quote.totalPrice)} with PayHere`}</button>
          </div> : <form onSubmit={getQuote} className="grid sm:grid-cols-2 gap-5" aria-busy={busy}>
            {addressFields.map(field => <div key={field.key} className={field.key === 'address' || field.key === 'fullName' ? 'sm:col-span-2' : ''}><label htmlFor={field.key} className="block text-ivory-muted text-sm mb-2">{field.label}</label><input id={field.key} name={field.key} type={field.type} autoComplete={field.auto} maxLength={field.max} required value={effectiveAddress[field.key]} onChange={event => { setAddress(prev => ({ ...prev, [field.key]: event.target.value })); if (field.key === 'fullName' || field.key === 'email') setEditedContact(prev => ({ ...prev, [field.key]: true })); }} className="w-full min-w-0 p-3 rounded-xl bg-charcoal border border-white/15 text-ivory focus:border-gold outline-none" /></div>)}
            <div className="sm:col-span-2"><label htmlFor="country" className="block text-ivory-muted text-sm mb-2">Country</label><select id="country" autoComplete="country" required value={address.countryCode} onChange={event => { const country = COUNTRIES.find(c => c.code === event.target.value); setAddress(prev => ({ ...prev, countryCode: country?.code || '', country: country?.name || '' })); }} className="w-full p-3 rounded-xl bg-charcoal border border-white/15 text-ivory"><option value="">Select delivery country</option>{COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></div>
            <p className="sm:col-span-2 text-sm text-ivory-muted">DHL shipping is calculated for your complete address and cart. Import duties, if applicable, are payable on delivery.</p>
            <button type="submit" disabled={busy || !config?.available} className="sm:col-span-2 btn-gold flex items-center justify-center gap-2 disabled:opacity-50">{busy && <Loader2 className="animate-spin" size={18} />}{busy ? 'Calculating shipping…' : 'Review order'}</button>
          </form>}
        </section>
        <aside className="lg:col-span-2 bg-charcoal-card rounded-2xl p-5 sm:p-6 border border-white/10 self-start">
          <h2 className="font-display text-2xl text-ivory mb-6">Order summary</h2>
          <ul className="space-y-5">{summaryItems.map(item => <li key={cartKey(item)} className="flex gap-3"><img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-charcoal" /><div className="min-w-0 flex-1"><p className="text-ivory break-words">{item.name}</p><p className="text-sm text-ivory-muted">{item.variant} · Qty {item.quantity}</p><p className="text-gold text-sm mt-1">{money(item.price * item.quantity)}</p></div></li>)}</ul>
          {pricesChanged && <p role="status" className="text-sm text-gold mt-5">Product prices have been updated from our catalogue. Please review the current prices before paying.</p>}
          <dl className="border-t border-white/10 pt-5 mt-6 space-y-3 text-ivory-muted">
            <div className="flex justify-between"><dt>Products</dt><dd>{money(validReview ? review.quote.itemsPrice : totalPrice)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex gap-2 items-center"><Truck size={16} /> DHL delivery</dt><dd>{validReview ? money(review.quote.shippingPrice) : 'Calculated next'}</dd></div>
            {validReview && review.quote.taxPrice > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(review.quote.taxPrice)}</dd></div>}
            <div className="flex justify-between pt-3 border-t border-white/10 text-ivory text-xl"><dt>{validReview ? 'Total' : 'Subtotal'}</dt><dd className="text-gold">{money(validReview ? review.quote.totalPrice : totalPrice)}</dd></div>
          </dl>
          <p className="text-xs text-ivory-muted mt-5">All checkout amounts are charged in USD. Other storefront currencies are estimates; your bank may apply conversion fees.</p>
        </aside>
      </div>
    </div>
  </div>;
}
