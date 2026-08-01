import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Database, Share2, Shield, Cookie, RefreshCw, Mail } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const sections = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: null,
    subsections: [
      {
        label: 'Information you provide directly',
        items: [
          'Personal identification information (name, email address, phone number) provided during registration or checkout.',
          'Shipping and billing address details required to process and deliver your orders.',
          'Payment information, securely handled by our trusted third-party payment processor, PayHere. We do not store your full card details.',
          'Messages or enquiries you send us via contact forms or email.',
        ],
      },
      {
        label: 'Information collected automatically',
        items: [
          'IP address, browser type, device information, and operating system.',
          'Pages visited, time spent on pages, and referring URLs.',
          'Cookie and session data to maintain your cart and preferences.',
        ],
      },
    ],
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    content: null,
    list: [
      'To process, fulfill, and deliver your orders, including sending shipping notifications.',
      'To communicate with you about your purchases, respond to inquiries, and provide customer support.',
      'To personalize your shopping experience and present relevant product recommendations.',
      'To improve our website, products, and services based on feedback and browsing patterns.',
      'To send promotional emails and offers (only if you have opted in; you may unsubscribe at any time).',
      'To detect and prevent fraud, unauthorized activities, and abuse of our platform.',
      'To comply with legal obligations and enforce our Terms & Conditions.',
    ],
  },
  {
    icon: Share2,
    title: 'Information Sharing',
    content: `We respect your privacy and do not sell, trade, or transfer your personal information to third parties without your consent, except in the following circumstances:`,
    list: [
      'Trusted service providers (e.g., shipping carriers, payment processors like PayHere, email marketing platforms) who are contractually obligated to handle your data securely.',
      'Legal compliance: We may disclose your information if required by law or in response to valid legal requests or court orders.',
      'Business transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.',
    ],
  },
  {
    icon: Shield,
    title: 'Data Security',
    content: `We implement industry-standard security measures — including SSL/TLS encryption, secure servers, and access controls — to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Payment transactions are processed through PayHere, a PCI-DSS compliant payment gateway. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    icon: Cookie,
    title: 'Cookies and Tracking Technologies',
    content: `We use cookies and similar technologies to enhance your browsing experience, maintain your shopping cart, analyze website traffic, and gather aggregated analytics. You can control cookie settings through your browser preferences. Disabling certain cookies may limit some features and functionality of our website.`,
  },
  {
    icon: RefreshCw,
    title: 'Changes to This Privacy Policy',
    content: `We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with a revised "Last Updated" date. We encourage you to review this policy periodically. Continued use of our website after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, please contact us at hello@silonka.com or write to us at: Silonka, 193/4 Main Street, Mattegoda, Sri Lanka.`,
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Privacy Policy — Silonka"
        description="Learn how Silonka collects, uses, and protects your personal information. Our privacy policy covers data security, cookies, and your rights."
        keywords="Silonka privacy policy, data protection, personal information, cookies policy"
        canonicalPath="/privacy-policy"
      />
      {/* Hero */}
      <section className="relative py-16 sm:py-24 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
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
              Privacy Policy
            </h1>
            <p className="text-ivory-muted leading-relaxed text-base sm:text-lg">
              At Silonka, we are committed to protecting the privacy and security of our customers'
              personal information. This Privacy Policy outlines how we collect, use, and safeguard
              your data when you visit or make a purchase on our website.
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
          {/* Consent notice */}
          <div className="p-5 rounded-xl border border-gold/30 bg-gold/5">
            <p className="text-ivory-muted text-sm leading-relaxed">
              By using our website, you consent to the collection and use of your information as
              described in this Privacy Policy. If you do not agree with any part of this policy,
              please do not use our website.
            </p>
          </div>

          {sections.map((section, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl bg-charcoal-card border border-white/5 hover:border-gold/20 transition-colors duration-300"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-gold" />
                </div>
                <h2 className="font-display text-xl text-ivory">{section.title}</h2>
              </div>

              {section.content && (
                <p className="text-ivory-muted leading-relaxed text-sm sm:text-base mb-4">
                  {section.content}
                </p>
              )}

              {section.list && (
                <ul className="space-y-2">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-ivory-muted text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.subsections && (
                <div className="space-y-5">
                  {section.subsections.map((sub, j) => (
                    <div key={j}>
                      <p className="text-ivory font-mono text-xs uppercase tracking-wider mb-3">
                        {sub.label}
                      </p>
                      <ul className="space-y-2">
                        {sub.items.map((item, k) => (
                          <li key={k} className="flex items-start gap-3 text-ivory-muted text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="max-w-3xl mt-12 p-5 rounded-xl border border-gold/20 bg-gold/5">
          <p className="text-ivory-muted/70 text-sm italic">
            Note: This Privacy Policy is provided as a general guideline for Silonka's online store
            operations. By using our website you agree to the terms outlined above.
          </p>
        </div>

        <div className="max-w-3xl mt-10 flex flex-wrap gap-4">
          <Link to="/refund-policy" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Refund Policy →
          </Link>
          <Link to="/terms-and-conditions" className="text-gold hover:text-gold/80 font-mono text-xs uppercase tracking-widest transition-colors">
            Terms &amp; Conditions →
          </Link>
        </div>
      </section>
    </div>
  );
}
