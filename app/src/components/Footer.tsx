import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, Phone, ArrowUpRight, Cookie } from 'lucide-react';
import { useCookieConsent } from '@/components/CookieConsent';

const footerLinks = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Gift Sets', href: '/shop?category=sets' },
    { label: 'Black Pepper', href: '/shop?category=pepper' },
    { label: 'Ceylon Cinnamon', href: '/shop?category=cinnamon' },
  ],
  company: [
    { label: 'Our Story', href: '/origins' },
    { label: 'The Craft', href: '/craft' },
    { label: 'Blog', href: '/blog' },
    { label: 'Wholesale', href: '/contact' },
  ],
  support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Info', href: '/contact' },
    { label: 'Returns', href: '/refund-policy' },
    { label: 'FAQ', href: '/contact' },
  ],
  legal: [
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  ],
};

export default function Footer() {
  const { openSettings } = useCookieConsent();
  return (
    <footer className="relative bg-charcoal-light border-t border-white/5" role="contentinfo" aria-label="Site footer">
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />

      <div className="relative px-5 lg:px-[7vw] pt-10 pb-6 lg:pt-20 lg:pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-8 mb-10 lg:mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4 lg:mb-6">
              <span className="font-display text-2xl lg:text-3xl text-ivory hover:text-gold transition-colors">
                Silonka
              </span>
            </Link>
            <p className="text-ivory-muted leading-relaxed mb-4 lg:mb-6 max-w-sm text-sm">
              Single-origin spices from Sri Lanka's hill country,
              harvested at peak aroma and delivered fresh to your kitchen.
            </p>

            {/* Contact Info */}
            <address className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-x-0 lg:space-y-3 not-italic">
              <a
                href="mailto:hello@silonka.com"
                className="flex items-center gap-2 lg:gap-3 text-ivory-muted hover:text-gold transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-sm">hello@silonka.com</span>
              </a>
              <a
                href="tel:+94766951393"
                className="flex items-center gap-2 lg:gap-3 text-ivory-muted hover:text-gold transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-sm">+94 76 695 1393</span>
              </a>
              <div className="flex items-center gap-2 lg:gap-3 text-ivory-muted">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm">Colombo, Sri Lanka</span>
              </div>
            </address>
          </div>

          {/* Link Columns — 2x2 grid on mobile, 4 columns on desktop */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Shop Links */}
            <div>
              <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-3 lg:mb-6">
                Shop
              </h3>
              <ul className="space-y-2 lg:space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-3 lg:mb-6">
                Company
              </h3>
              <ul className="space-y-2 lg:space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-3 lg:mb-6">
                Support
              </h3>
              <ul className="space-y-2 lg:space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-3 lg:mb-6">
                Legal
              </h3>
              <ul className="space-y-2 lg:space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 lg:pt-8">
          {/* Mobile: stacked layout / Desktop: single row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ivory-muted/60 text-sm">
              © 2026 Silonka. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:gap-6">
              <a
                href="#"
                className="text-ivory-muted hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <Link
                to="/privacy-policy"
                className="text-ivory-muted hover:text-gold transition-colors text-xs lg:text-sm"
              >
                Privacy
              </Link>
              <Link
                to="/terms-and-conditions"
                className="text-ivory-muted hover:text-gold transition-colors text-xs lg:text-sm"
              >
                Terms
              </Link>
              <Link
                to="/refund-policy"
                className="text-ivory-muted hover:text-gold transition-colors text-xs lg:text-sm"
              >
                Refunds
              </Link>
              <button
                onClick={openSettings}
                className="text-ivory-muted hover:text-gold transition-colors text-xs lg:text-sm inline-flex items-center gap-1.5"
              >
                <Cookie className="w-3.5 h-3.5" />
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
