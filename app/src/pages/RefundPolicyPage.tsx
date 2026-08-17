import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Package, AlertCircle, Truck, Clock, Mail } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const sections = [
  {
    icon: RefreshCw,
    title: 'Returns',
    content: `We accept returns within 14 days from the date of purchase. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original, sealed packaging. Due to the perishable nature of spices, opened products cannot be returned unless they are damaged or defective upon arrival.`,
  },
  {
    icon: Package,
    title: 'Refunds',
    content: `Once we receive your return and inspect the item, we will notify you of the status of your refund within 3 business days. If your return is approved, we will initiate a refund to your original method of payment within 7 business days. Please note that the refund amount will exclude any shipping charges incurred during the initial purchase.`,
  },
  {
    icon: RefreshCw,
    title: 'Exchanges',
    content: `If you would like to exchange your item for a different product, please contact our customer support team within 14 days of receiving your order at hello@silonka.com. We will provide you with further instructions on how to proceed with the exchange, subject to product availability.`,
  },
  {
    icon: AlertCircle,
    title: 'Non-Returnable Items',
    content: null,
    list: [
      'Opened or used spice products',
      'Gift cards or vouchers',
      'Personalized or custom-labelled orders',
      'Perishable goods past their best-before date',
      'Bulk order quantities (10 kg or more)',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Damaged or Defective Items',
    content: `In the unfortunate event that your item arrives damaged or defective, please contact us immediately at hello@silonka.com with a photo of the item and your order number. We will arrange for a replacement or issue a full refund, depending on your preference and product availability. Reports of damaged or defective items must be made within 48 hours of delivery.`,
  },
  {
    icon: Truck,
    title: 'Return Shipping',
    content: `You will be responsible for paying the shipping costs for returning your item unless the return is due to our error (e.g., wrong item shipped, defective product). In such cases, we will provide you with a prepaid return label or reimburse your shipping costs upon verification.`,
  },
  {
    icon: Clock,
    title: 'Processing Time',
    content: `Refunds and exchanges will be processed within 7 business days after we receive and inspect your returned item. Please note that it may take an additional 3–7 business days for the refund to appear in your account, depending on your bank or payment provider.`,
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: `If you have any questions or concerns regarding our refund policy, please contact our customer support team at hello@silonka.com or call us at +94 76 695 1393. We are here to assist you and ensure your shopping experience with Silonka is enjoyable and hassle-free.`,
  },
];

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Refund Policy — Silonka"
        description="Silonka's refund and return policy for Ceylon spice purchases. Learn about returns, exchanges, damaged items, and refund processing times."
        keywords="Silonka refund policy, spice return policy, refund processing, exchange policy"
        canonicalPath="/refund-policy"
      />
      {/* Hero */}
      <section className="relative py-16 sm:py-24 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="max-w-3xl">
            <span className="font-mono text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              Legal
            </span>
            <h1 className="font-display text-[clamp(36px,5vw,64px)] text-ivory mb-4 leading-tight">
              Refund Policy
            </h1>
            <p className="text-ivory-muted leading-relaxed text-base sm:text-lg">
              Thank you for shopping at Silonka. We value your satisfaction and strive to provide you
              with the finest Ceylon spices. If, for any reason, you are not completely satisfied
              with your purchase, we are here to help.
            </p>
            <p className="text-ivory-muted/50 text-sm mt-4 font-mono">
              Last updated: April 27, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-[7vw]">
        <div className="max-w-3xl space-y-10">
          {sections.map((section, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl bg-charcoal-card border border-white/5 hover:border-gold/20 transition-colors duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-gold" />
                </div>
                <h2 className="font-display text-xl text-ivory">{section.title}</h2>
              </div>
              {section.content && (
                <p className="text-ivory-muted leading-relaxed text-sm sm:text-base">
                  {section.content}
                </p>
              )}
              {section.list && (
                <ul className="space-y-2 mt-2">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-ivory-muted text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="max-w-3xl mt-12 p-5 rounded-xl border border-gold/20 bg-gold/5">
          <p className="text-ivory-muted/70 text-sm italic">
            Note: This Refund Policy applies to retail purchases made through silonka.com. For bulk
            and wholesale orders, separate terms may apply. Please contact us for details.
          </p>
        </div>

        {/* Policy links */}
        <div className="max-w-3xl mt-10 flex flex-wrap gap-4">
          <Link to="/privacy-policy" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Privacy Policy →
          </Link>
          <Link to="/terms-and-conditions" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Terms &amp; Conditions →
          </Link>
        </div>
      </section>
    </div>
  );
}
