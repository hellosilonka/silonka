import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Truck, Package, CheckCircle, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { trackDHLShipment } from '@/lib/api';
import SEOHead from '@/components/SEOHead';

interface TrackingEvent {
    date: string;
    time: string;
    location: string;
    description: string;
    code: string;
}

interface TrackingResult {
    awbNumber: string;
    status: string;
    shipperRef: string;
    events: TrackingEvent[];
}

function getEventIcon(description: string, code: string) {
    const d = description.toLowerCase();
    const c = code.toUpperCase();
    if (d.includes('delivered') || c === 'OK') return CheckCircle;
    if (d.includes('out for delivery') || d.includes('with delivery')) return Truck;
    if (d.includes('transit') || d.includes('departed') || d.includes('arrived') || d.includes('customs')) return Package;
    if (d.includes('pick') || d.includes('collected')) return MapPin;
    return Clock;
}

function getEventColor(description: string, code: string, isFirst: boolean) {
    const d = description.toLowerCase();
    const c = code.toUpperCase();
    if (d.includes('delivered') || c === 'OK') return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (isFirst) return 'text-gold bg-gold/10 border-gold/30';
    return 'text-ivory-muted bg-white/5 border-white/10';
}

function formatEventDate(date: string, time: string) {
    if (!date) return '';
    // DHL date format: YYYY-MM-DD or YYYYMMDD
    const clean = date.replace(/\//g, '-').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    try {
        const d = new Date(`${clean}T${time || '00:00:00'}`);
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return `${date} ${time}`;
    }
}

export default function TrackOrderPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [awbInput, setAwbInput] = useState(searchParams.get('awb') || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TrackingResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        const awb = searchParams.get('awb');
        if (awb) {
            setAwbInput(awb);
            handleTrack(awb);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTrack = async (awb?: string) => {
        const trackingNumber = (awb || awbInput).trim().replace(/\s+/g, '');
        if (!trackingNumber) return;

        // DHL AWB numbers are 10 digits minimum — validate before hitting API
        if (trackingNumber.length < 10) {
            setError('Please enter a valid AWB number (at least 10 digits).');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await trackDHLShipment(trackingNumber);
            setResult(data);
            setSearchParams({ awb: trackingNumber });
        } catch (err: any) {
            const raw: string = err?.response?.data?.message || err?.message || '';

            // Always show a clean, user-friendly message — never expose raw DHL SOAP XML
            let friendlyMsg = 'Shipment not found. Please check your AWB number and try again.';

            if (raw.toLowerCase().includes('econnreset') || raw.toLowerCase().includes('network')) {
                friendlyMsg = 'Could not reach DHL servers. Please try again in a moment.';
            } else if (raw.toLowerCase().includes('not found') || raw.toLowerCase().includes('no shipment')) {
                friendlyMsg = 'No shipment found for this AWB number.';
            }

            setError(friendlyMsg);
        } finally {
            setLoading(false);
        }
    };

    const hasEvents = result && result.events && result.events.length > 0;

    return (
        <div className="min-h-screen bg-charcoal pt-20">
            <SEOHead
                title="Track My Order — Silonka"
                description="Track your Silonka DHL Express shipment in real-time. Enter your AWB number to see delivery status and checkpoints."
                keywords="Silonka order tracking, DHL tracking, Ceylon spice delivery"
                canonicalPath="/track"
            />

            {/* Hero */}
            <section className="relative py-16 sm:py-24 border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
                <div className="relative px-4 sm:px-6 lg:px-[7vw]">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="max-w-2xl">
                        <span className="font-mono text-label text-gold uppercase tracking-[0.2em] mb-4 block">
                            Shipping
                        </span>
                        <h1 className="font-display text-[clamp(36px,5vw,64px)] text-ivory mb-4 leading-tight">
                            Track My Order
                        </h1>
                        <p className="text-ivory-muted leading-relaxed text-base sm:text-lg">
                            Enter your DHL airway bill number (AWB) to get real-time delivery updates
                            for your Silonka spice order shipped from Sri Lanka.
                        </p>
                    </div>
                </div>
            </section>

            {/* Search */}
            <section className="py-10 px-4 sm:px-6 lg:px-[7vw]">
                <div className="max-w-2xl">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted/40 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Enter AWB / Tracking Number (e.g. 1234567890)"
                                value={awbInput}
                                onChange={e => setAwbInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                                className="w-full pl-11 pr-4 py-4 rounded-xl bg-charcoal-card border border-white/10 text-ivory placeholder:text-ivory-muted/30 focus:border-gold/50 focus:outline-none transition-colors text-sm font-mono"
                            />
                        </div>
                        <button
                            onClick={() => handleTrack()}
                            disabled={loading || !awbInput.trim()}
                            className="px-6 py-4 bg-gold text-charcoal font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all flex items-center gap-2 flex-shrink-0"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Track
                        </button>
                    </div>

                    {/* DHL attribution */}
                    <div className="mt-3 flex items-center gap-2 text-ivory-muted/40 text-xs font-mono">
                        <Truck className="w-3.5 h-3.5" />
                        Powered by DHL Express · All Silonka orders ship via DHL from Sri Lanka
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="pb-20 px-4 sm:px-6 lg:px-[7vw]">
                <div className="max-w-2xl">

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                            <p className="text-ivory-muted font-mono text-sm">Contacting DHL Express...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="p-5 rounded-2xl bg-red-500/8 border border-red-500/20 flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-medium mb-1">Tracking failed</p>
                                <p className="text-ivory-muted/70 text-sm">{error}</p>
                                <p className="text-ivory-muted/50 text-xs mt-2">
                                    If your order was placed recently, tracking may not be available yet. Please try again in a few hours.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {result && !loading && (
                        <div className="space-y-6">
                            {/* Shipment header card */}
                            <div className="p-6 rounded-2xl bg-charcoal-card border border-white/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-gold font-mono text-xs uppercase tracking-[0.2em] mb-1">AWB Number</p>
                                        <p className="text-ivory font-display text-2xl">{result.awbNumber}</p>
                                        {result.shipperRef && result.shipperRef !== result.awbNumber && (
                                            <p className="text-ivory-muted/50 text-xs font-mono mt-1">Ref: {result.shipperRef}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/10 border border-gold/20">
                                        <Truck className="w-5 h-5 text-gold" />
                                        <div>
                                            <p className="text-ivory-muted/60 text-[11px] font-mono uppercase tracking-wider">Status</p>
                                            <p className="text-ivory text-sm font-medium">{result.status || 'In Transit'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* DHL link */}
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <a
                                        href={`https://www.dhl.com/en/express/tracking.html?AWB=${result.awbNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-mono text-xs uppercase tracking-wider transition-colors"
                                    >
                                        View on DHL.com ↗
                                    </a>
                                </div>
                            </div>

                            {/* Timeline */}
                            {hasEvents ? (
                                <div>
                                    <h2 className="font-display text-xl text-ivory mb-5 flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-gold" />
                                        Tracking Timeline
                                    </h2>
                                    <div className="relative space-y-0">
                                        {result.events.map((event, i) => {
                                            const Icon = getEventIcon(event.description, event.code);
                                            const colorClass = getEventColor(event.description, event.code, i === 0);
                                            const isLast = i === result.events.length - 1;

                                            return (
                                                <div key={i} className="flex gap-4 relative">
                                                    {/* Timeline line */}
                                                    {!isLast && (
                                                        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/8 z-0" />
                                                    )}
                                                    {/* Icon */}
                                                    <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass} mt-1`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    {/* Content */}
                                                    <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
                                                        <p className="text-ivory text-sm font-medium leading-snug">{event.description || 'Update'}</p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                            {event.location && (
                                                                <span className="text-ivory-muted/60 text-xs flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {event.location}
                                                                </span>
                                                            )}
                                                            <span className="text-ivory-muted/40 text-xs font-mono">
                                                                {formatEventDate(event.date, event.time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 rounded-xl bg-white/3 border border-white/8 flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-ivory-muted/40 flex-shrink-0 mt-0.5" />
                                    <p className="text-ivory-muted/60 text-sm">
                                        No checkpoint events available yet. Your package may still be at the origin facility. Check back in a few hours.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Help text when nothing searched yet */}
                    {!result && !loading && !error && (
                        <div className="py-12 text-center">
                            <Truck className="w-16 h-16 text-ivory-muted/10 mx-auto mb-4" />
                            <p className="text-ivory-muted/40 text-sm">Enter your AWB number above to track your shipment</p>
                            <p className="text-ivory-muted/30 text-xs mt-2 font-mono">
                                Find your AWB number in your order confirmation email or in My Profile → Order
                            </p>
                        </div>
                    )}

                    {/* Profile link */}
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link to="/profile" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
                            My Orders →
                        </Link>
                        <Link to="/shop" className="text-ivory-muted hover:text-ivory font-mono text-xs uppercase tracking-widest transition-colors">
                            Continue Shopping →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
