import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowUpRight, Cookie } from 'lucide-react';
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
    { label: 'Bulk Orders', href: '/contact' },
  ],
  support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Returns', href: '/refund-policy' },
    { label: 'FAQ', href: '/contact' },
  ],
};

const socialLinks = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4l16 16M4 20L20 4"/>
        <path d="M4 4h4l12 16h-4z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const { openSettings } = useCookieConsent();
  return (
    <footer className="relative bg-charcoal-light border-t border-white/5" role="contentinfo" aria-label="Site footer">
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />

      <div className="relative px-5 lg:px-[7vw] pt-12 pb-6 lg:pt-20 lg:pb-8">

        {/* ── MOBILE LAYOUT ── */}
        <div className="lg:hidden">

          {/* Brand block — centered */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <img
                src="/logo.png"
                alt="Silonka logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(196,164,105,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(196,164,105,0.5)] transition-all duration-300"
              />
              <span className="font-display text-2xl text-ivory group-hover:text-gold transition-colors">
                Silonka
              </span>
            </Link>

            {/* Email */}
            <a
              href="mailto:hello@silonka.com"
              className="flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors mb-5"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="text-sm">hello@silonka.com</span>
            </a>

            {/* Locations — 2 pills */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <div className="flex items-start gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-left">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-[10px] text-gold uppercase tracking-widest mb-0.5">Corporate Office</p>
                  <span className="text-ivory-muted text-sm">Colombo, Sri Lanka</span>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-left">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-[10px] text-gold uppercase tracking-widest mb-0.5">Processing &amp; Distillation Plant</p>
                  <span className="text-ivory-muted text-sm">Kurundugahahetekma, Southern, Sri Lanka</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mb-8" />

          {/* Social icons row — centered */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="group w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-gold/50 text-ivory-muted hover:text-gold transition-all duration-300 hover:bg-gold/5 hover:shadow-[0_0_10px_rgba(196,164,105,0.15)]"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {social.icon}
                </span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mb-8" />

          {/* Link grid — clean 2 × 3 */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-8">
            {/* Shop */}
            <div>
              <h3 className="font-mono text-[10px] text-gold uppercase tracking-widest mb-4">Shop</h3>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-mono text-[10px] text-gold uppercase tracking-widest mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support — spans full width */}
            <div className="col-span-2 pt-2 border-t border-white/5">
              <h3 className="font-mono text-[10px] text-gold uppercase tracking-widest mb-4">Support</h3>
              <div className="grid grid-cols-2 gap-x-8">
                {footerLinks.support.map((link) => (
                  <Link key={link.label} to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm py-1">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mb-6" />

          {/* Bottom bar — mobile */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-ivory-muted/50 text-xs">© 2026 Silonka. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/privacy-policy" className="text-ivory-muted/60 hover:text-gold transition-colors text-xs">Privacy</Link>
              <Link to="/terms-and-conditions" className="text-ivory-muted/60 hover:text-gold transition-colors text-xs">Terms</Link>
              <Link to="/refund-policy" className="text-ivory-muted/60 hover:text-gold transition-colors text-xs">Refunds</Link>
              <button onClick={openSettings} className="text-ivory-muted/60 hover:text-gold transition-colors text-xs inline-flex items-center gap-1">
                <Cookie className="w-3 h-3" />
                Cookies
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (unchanged) ── */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-6 gap-8 mb-16">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
                <img
                  src="/logo.png"
                  alt="Silonka logo"
                  className="w-9 h-9 object-contain drop-shadow-[0_0_6px_rgba(196,164,105,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(196,164,105,0.5)] transition-all duration-300"
                />
                <span className="font-display text-3xl text-ivory group-hover:text-gold transition-colors">
                  Silonka
                </span>
              </Link>
              <p className="text-ivory-muted leading-relaxed mb-6 max-w-sm text-sm" />

              {/* Contact Info */}
              <address className="flex flex-col space-y-4 not-italic">
                <a
                  href="mailto:hello@silonka.com"
                  className="flex items-center gap-3 text-ivory-muted hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-sm">hello@silonka.com</span>
                </a>

                {/* Corporate Office */}
                <div className="flex items-start gap-3 text-ivory-muted">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-[10px] text-gold uppercase tracking-widest mb-0.5">Corporate Office</p>
                    <span className="text-sm">Colombo, Sri Lanka</span>
                  </div>
                </div>

                {/* Processing Plant */}
                <div className="flex items-start gap-3 text-ivory-muted">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-[10px] text-gold uppercase tracking-widest mb-0.5">Processing &amp; Distillation Plant</p>
                    <span className="text-sm">Kurundugahahetekma, Southern, Sri Lanka</span>
                  </div>
                </div>
              </address>
            </div>

            {/* Link Columns */}
            <div className="col-span-4 grid grid-cols-4 gap-8">
              {/* Shop Links */}
              <div>
                <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-6">Shop</h3>
                <ul className="space-y-3">
                  {footerLinks.shop.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group">
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-6">Company</h3>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group">
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-6">Support</h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-ivory-muted hover:text-ivory transition-colors text-sm inline-flex items-center gap-1 group">
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Beyond Silonka — Social Column */}
              <div>
                <h3 className="font-mono text-label text-gold uppercase tracking-widest mb-6">Beyond Silonka</h3>
                <ul className="space-y-4">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="group inline-flex items-center gap-2.5 text-ivory-muted hover:text-gold transition-all duration-300"
                      >
                        <span className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                          {social.icon}
                        </span>
                        <span className="text-sm group-hover:translate-x-0.5 transition-transform duration-300">
                          {social.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Bottom Bar */}
          <div className="border-t border-white/5 pt-8">
            <div className="flex items-center justify-between">
              <p className="text-ivory-muted/60 text-sm">© 2026 Silonka. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link to="/privacy-policy" className="text-ivory-muted hover:text-gold transition-colors text-sm">Privacy</Link>
                <Link to="/terms-and-conditions" className="text-ivory-muted hover:text-gold transition-colors text-sm">Terms</Link>
                <Link to="/refund-policy" className="text-ivory-muted hover:text-gold transition-colors text-sm">Refunds</Link>
                <button onClick={openSettings} className="text-ivory-muted hover:text-gold transition-colors text-sm inline-flex items-center gap-1.5">
                  <Cookie className="w-3.5 h-3.5" />
                  Cookies
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
