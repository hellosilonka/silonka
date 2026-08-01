import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Tag, ShoppingCart, Truck, RefreshCw, Lock, AlertTriangle, Edit, Mail } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const sections = [
  {
    icon: Globe,
    title: '1. Use of the Website',
    items: [
      'You must be at least 18 years old to use our website or make purchases. By using this site you represent that you meet this requirement.',
      'You are responsible for maintaining the confidentiality of your account credentials, including your email and password.',
      'You agree to provide accurate, current, and complete information during the registration and checkout process.',
      'You may not use our website for any unlawful, fraudulent, or unauthorized purposes, including but not limited to copying content, attempting to gain unauthorized access, or interfering with site operations.',
    ],
  },
  {
    icon: Tag,
    title: '2. Product Information and Pricing',
    items: [
      'We strive to provide accurate product descriptions, imagery, and pricing. However, we do not guarantee the completeness or accuracy of such information.',
      'Prices are displayed in your selected currency and are subject to change without notice.',
      'Promotional discounts and special offers are valid for limited periods and may be subject to additional terms.',
      'Product availability is not guaranteed. We reserve the right to limit quantities or discontinue products at any time.',
    ],
  },
  {
    icon: ShoppingCart,
    title: '3. Orders and Payments',
    items: [
      'By placing an order on our website, you are making an offer to purchase the selected products at the stated price.',
      'We reserve the right to refuse or cancel any order for reasons including product unavailability, pricing errors, or suspected fraudulent activity.',
      'You agree to provide valid payment information and authorize us to charge the total order amount, including applicable taxes and shipping fees.',
      'Payments are processed securely through PayHere, our trusted third-party payment processor. We do not store or access your full payment card details.',
      'You will receive an email confirmation once your order is successfully placed. This confirmation does not guarantee product availability.',
    ],
  },
  {
    icon: Truck,
    title: '4. Shipping and Delivery',
    items: [
      'We will make reasonable efforts to ensure timely processing and dispatch of your orders.',
      'Estimated delivery times vary based on your location, shipping method selected, and factors beyond our control (e.g., customs, courier delays).',
      'Risk of loss and title for products pass to you upon delivery to the designated shipping address.',
      'International orders may be subject to customs duties and import taxes, which are the responsibility of the customer.',
    ],
  },
  {
    icon: RefreshCw,
    title: '5. Returns and Refunds',
    items: [
      'Our Refund Policy governs the process and conditions for returning products and seeking refunds.',
      'Please refer to our Refund Policy page for detailed information.',
      'Returns of opened perishable spice products are generally not accepted unless the item is damaged or defective upon arrival.',
    ],
  },
  {
    icon: Lock,
    title: '6. Intellectual Property',
    items: [
      'All content and materials on Silonka — including text, imagery, logos, product photography, and graphic design — are protected by intellectual property rights and are the property of Silonka or its licensors.',
      'You may not reproduce, distribute, modify, or create derivative works from any content on our website without prior written consent from Silonka.',
      'Unauthorized use of our intellectual property may result in legal action.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '7. Limitation of Liability',
    items: [
      'To the fullest extent permitted by applicable law, Silonka, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or our products.',
      'Our total liability for any claim arising out of or related to these Terms shall not exceed the amount paid by you for the specific order giving rise to the claim.',
      'We make no express or implied warranties regarding the suitability, quality, accuracy, or completeness of the products offered on our website.',
    ],
  },
  {
    icon: Edit,
    title: '8. Amendments and Termination',
    items: [
      'We reserve the right to modify, update, or terminate these Terms and Conditions at any time without prior notice.',
      'Continued use of our website after changes are posted constitutes your acceptance of the revised Terms.',
      'We may suspend or terminate your account or access to our website at our discretion if you violate these Terms.',
    ],
  },
  {
    icon: Mail,
    title: '9. Contact Us',
    items: [
      'If you have any questions or concerns about these Terms and Conditions, please contact us at hello@silonka.com or call +94 76 695 1393.',
      'Silonka operates from 193/4 Main Street, Mattegoda, Sri Lanka. These Terms shall be governed by the laws of Sri Lanka.',
    ],
  },
];

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Terms & Conditions — Silonka"
        description="Read Silonka's terms and conditions governing website usage, product purchases, shipping, returns, and intellectual property for our Ceylon spice store."
        keywords="Silonka terms and conditions, website terms, spice store terms, purchase terms"
        canonicalPath="/terms-and-conditions"
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
          <div className="max-w-3xl">
            <span className="font-mono text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              Legal
            </span>
            <h1 className="font-display text-[clamp(36px,5vw,64px)] text-ivory mb-4 leading-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-ivory-muted leading-relaxed text-base sm:text-lg">
              Welcome to Silonka. These Terms and Conditions govern your use of our website and the
              purchase and sale of our products. By accessing and using our website, you agree to
              comply with these terms. Please read them carefully before proceeding with any
              transactions.
            </p>
            <p className="text-ivory-muted/50 text-sm mt-4 font-mono">
              Last updated: April 27, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 px-4 sm:px-6 lg:px-[7vw] border-b border-white/5">
        <div className="max-w-3xl">
          <p className="font-mono text-xs text-gold uppercase tracking-widest mb-4">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-ivory-muted hover:text-gold text-sm transition-colors font-mono text-xs"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-[7vw]">
        <div className="max-w-3xl space-y-10">
          {sections.map((section, i) => (
            <div
              id={`section-${i}`}
              key={i}
              className="p-6 sm:p-8 rounded-2xl bg-charcoal-card border border-white/5 hover:border-gold/20 transition-colors duration-300 scroll-mt-28"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-gold" />
                </div>
                <h2 className="font-display text-xl text-ivory">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-ivory-muted text-sm leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mt-12 p-5 rounded-xl border border-gold/20 bg-gold/5">
          <p className="text-ivory-muted/70 text-sm italic">
            Note: These Terms and Conditions are provided as a general guideline for Silonka's
            online store. By using our website, you agree to the terms outlined above.
          </p>
        </div>

        <div className="max-w-3xl mt-10 flex flex-wrap gap-4">
          <Link to="/refund-policy" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Refund Policy →
          </Link>
          <Link to="/privacy-policy" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </section>
    </div>
  );
}
