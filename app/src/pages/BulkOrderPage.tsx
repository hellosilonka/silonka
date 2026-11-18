import { errorMessage } from '@/lib/api';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createBulkOrder } from '@/lib/api';
import { Plus, Trash2, ChevronLeft, CheckCircle, Send, Package, Users, Mail, Phone, Building, FileText } from 'lucide-react';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

interface ProductRow {
    productName: string;
    quantity: string;
}

export default function BulkOrderPage() {
    const [form, setForm] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [products, setProducts] = useState<ProductRow[]>([{ productName: '', quantity: '' }]);
    const [submitting, setSubmitting] = useState(false);
    const submitLock = useRef(false);
    const [submitted, setSubmitted] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [error, setError] = useState('');

    const addRow = () => setProducts(previous => previous.length < 50 ? [...previous, { productName: '', quantity: '' }] : previous);
    const removeRow = (i: number) => setProducts(products.filter((_, idx) => idx !== i));
    const updateRow = (i: number, key: keyof ProductRow, value: string) => {
        const updated = [...products];
        updated[i][key] = value;
        setProducts(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLock.current) return;
        setError('');
        const validProducts = products.filter(p => p.productName.trim() || p.quantity.trim());
        if (validProducts.some(p => !p.productName.trim() || !Number.isInteger(Number(p.quantity)) || Number(p.quantity) < 1 || Number(p.quantity) > 100000)) {
            setError('Complete each product row with a name and a whole quantity from 1 to 100,000, or remove the row.');
            return;
        }
        if (validProducts.length === 0) {
            setError('Please add at least one product with a quantity.');
            return;
        }
        submitLock.current = true; setSubmitting(true);
        try {
            const res = await createBulkOrder({
                ...form,
                products: validProducts.map(p => ({ productName: p.productName.trim(), quantity: Number(p.quantity) })),
            });
            setOrderId(res.orderId || '');
            setSubmitted(true);
        } catch (err) {
            setError(errorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            submitLock.current = false; setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center px-4 pt-28 pb-16">
                <div className="max-w-lg w-full text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="font-display text-3xl text-ivory mb-3">Inquiry Received!</h1>
                    {orderId && (
                        <p className="font-mono text-xs text-ivory-muted mb-2 uppercase tracking-widest">
                            Reference: <span className="text-gold">#{orderId.slice(-8).toUpperCase()}</span>
                        </p>
                    )}
                    <p className="text-ivory-muted mb-2 leading-relaxed">
                        Thank you for your bulk order inquiry. We've sent a confirmation email to <span className="text-ivory">{form.email}</span>.
                    </p>
                    <p className="text-ivory-muted text-sm mb-8">Our team will review your request and contact you within <span className="text-gold">2 business days</span>.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to="/shop" className="px-6 py-3 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">
                            Back to Shop
                        </Link>
                        <button onClick={() => { setSubmitted(false); setForm({ companyName: '', contactName: '', email: '', phone: '', notes: '' }); setProducts([{ productName: '', quantity: '' }]); }} className="px-6 py-3 border border-white/15 text-ivory-muted rounded-xl font-mono text-xs uppercase tracking-widest hover:text-ivory hover:border-white/30 transition-colors">
                            New Inquiry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal pt-28 pb-16 px-4">
            <SEOHead
                title="Wholesale & Bulk Spice Orders — Silonka"
                description="Order premium Ceylon spices in bulk. Custom wholesale pricing for businesses, hotels, cafés, and retailers. Minimum quantities apply. Get a quote within 2 business days."
                keywords="bulk spice order, wholesale Ceylon spices, wholesale cinnamon, bulk black pepper, B2B spice supplier, Sri Lanka spice wholesale"
                canonicalPath="/bulk-order"
                jsonLd={breadcrumbSchema([
                    { name: 'Home', url: '/' },
                    { name: 'Shop', url: '/shop' },
                    { name: 'Bulk Order', url: '/bulk-order' },
                ])}
            />
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link to="/shop" className="inline-flex items-center gap-2 text-ivory-muted hover:text-ivory transition-colors font-mono text-xs uppercase tracking-widest mb-6">
                        <ChevronLeft className="w-4 h-4" /> Back to Shop
                    </Link>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <p className="font-mono text-xs uppercase tracking-widest text-ivory-muted mb-1">Silonka Tea</p>
                            <h1 className="font-display text-3xl text-ivory">Bulk Order Inquiry</h1>
                        </div>
                    </div>
                    <p className="text-ivory-muted leading-relaxed ml-16">
                        Wholesale and bulk pricing for businesses, cafés, hotels, and retailers. Fill in the form below and our team will contact you with custom pricing.
                    </p>
                </div>

                <form onSubmit={handleSubmit} aria-busy={submitting}><fieldset disabled={submitting} className="space-y-6">
                    {/* Company Info */}
                    <div className="rounded-2xl border border-white/8 bg-charcoal-card p-6">
                        <h2 className="font-mono text-xs uppercase tracking-widest text-ivory-muted mb-5 flex items-center gap-2">
                            <Building className="w-4 h-4" /> Company Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Company Name', key: 'companyName', icon: <Building className="w-4 h-4" />, placeholder: 'Acme Tea Co.', required: true },
                                { label: 'Contact Person', key: 'contactName', icon: <Users className="w-4 h-4" />, placeholder: 'John Smith', required: true },
                                { label: 'Email Address', key: 'email', icon: <Mail className="w-4 h-4" />, placeholder: 'john@company.com', type: 'email', required: true },
                                { label: 'Phone Number', key: 'phone', icon: <Phone className="w-4 h-4" />, placeholder: '+1 (555) 000-0000', required: true },
                            ].map(field => (
                                <div key={field.key}>
                                    <label htmlFor={`bulk-${field.key}`} className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">{field.label} {field.required && '*'}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-muted">{field.icon}</span>
                                        <input
                                            type={('type' in field ? field.type : 'text') || 'text'}
                                            id={`bulk-${field.key}`}
                                            maxLength={field.key === 'email' ? 254 : field.key === 'companyName' ? 150 : field.key === 'phone' ? 30 : 100}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={form[field.key as keyof typeof form]}
                                            onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                            className="w-full bg-charcoal border border-white/10 text-ivory pl-10 pr-4 py-3 rounded-xl outline-none focus:border-gold/60 transition-colors text-sm placeholder:text-ivory-muted/40"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div className="rounded-2xl border border-white/8 bg-charcoal-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-mono text-xs uppercase tracking-widest text-ivory-muted flex items-center gap-2">
                                <Package className="w-4 h-4" /> Products Required
                            </h2>
                            <button type="button" onClick={addRow} disabled={products.length >= 50} className="flex items-center gap-1.5 text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
                                <Plus className="w-4 h-4" /> Add Row
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-3 mb-1">
                                <div className="col-span-7 font-mono text-[10px] uppercase tracking-widest text-ivory-muted">Product Name</div>
                                <div className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-ivory-muted">Quantity</div>
                            </div>

                            {products.map((row, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-7">
                                        <input
                                            aria-label={`Product ${i + 1} name`} maxLength={150}
                                            placeholder="e.g. Ceylon Cinnamon 100 g"
                                            value={row.productName}
                                            onChange={e => updateRow(i, 'productName', e.target.value)}
                                            className="w-full bg-charcoal border border-white/10 text-ivory px-4 py-2.5 rounded-xl outline-none focus:border-gold/60 transition-colors text-sm placeholder:text-ivory-muted/40"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            min={1} max={100000} step={1} aria-label={`Product ${i + 1} quantity`}
                                            placeholder="1"
                                            value={row.quantity}
                                            onChange={e => updateRow(i, 'quantity', e.target.value)}
                                            className="w-full bg-charcoal border border-white/10 text-ivory px-4 py-2.5 rounded-xl outline-none focus:border-gold/60 transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center">
                                        {products.length > 1 && (
                                            <button type="button" aria-label={`Remove product ${i + 1}`} onClick={() => removeRow(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-ivory-muted hover:text-red-400 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addRow} disabled={products.length >= 50} className="mt-4 w-full py-2.5 border border-dashed border-white/15 rounded-xl font-mono text-xs uppercase tracking-widest text-ivory-muted hover:border-gold/40 hover:text-gold transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Add Another Product
                        </button>
                    </div>

                    {/* Notes */}
                    <div className="rounded-2xl border border-white/8 bg-charcoal-card p-6">
                        <h2 className="font-mono text-xs uppercase tracking-widest text-ivory-muted mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Additional Notes
                        </h2>
                        <textarea
                            rows={4} maxLength={5000} aria-label="Additional notes"
                            placeholder="Delivery timeline, special packaging requirements, frequency of orders, any other relevant information..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            className="w-full bg-charcoal border border-white/10 text-ivory px-4 py-3 rounded-xl outline-none focus:border-gold/60 transition-colors text-sm resize-none placeholder:text-ivory-muted/40"
                        />
                    </div>

                    {error && (
                        <div role="alert" className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gold text-charcoal rounded-xl font-mono text-sm uppercase tracking-widest hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
                    >
                        {submitting ? (
                            <><span className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> Processing...</>
                        ) : (
                            <><Send className="w-4 h-4" /> Place Bulk Order</>
                        )}
                    </button>

                    <p className="text-center font-mono text-xs text-ivory-muted">
                        By submitting, you agree to our terms. We'll contact you within 2 business days.
                    </p>
                </fieldset></form>
            </div>
        </div>
    );
}
