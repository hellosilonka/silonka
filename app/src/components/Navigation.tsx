import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import AuthModal from './AuthModal';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, setUser, logoutUser } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setIsCurrencyOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Origins', href: '/origins' },
    { label: 'Craft', href: '/craft' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleAuthSuccess = (userData: any) => setUser(userData);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logoutUser();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled || location.pathname !== '/'
            ? 'bg-charcoal/95 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-6 lg:px-12">
          <div className="relative flex items-center justify-between h-20">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 font-display text-2xl lg:text-3xl font-semibold text-ivory tracking-tight hover:text-gold transition-colors group z-10"
            >
              <img
                src="/logo.png"
                alt="Silonka logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(196,164,105,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(196,164,105,0.5)] transition-all duration-300"
              />
              <span className="hidden sm:inline">Silonka</span>
            </Link>

            {/* Desktop nav links — absolutely centered */}
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`font-mono text-label uppercase tracking-widest transition-colors duration-300 ${
                    isActive(link.href) ? 'text-gold' : 'text-ivory-muted hover:text-gold'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right-side actions */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* Profile / Login — desktop only */}
              {user ? (
                <div className="relative hidden sm:block" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 group"
                    aria-label="User profile"
                    id="profile-menu-btn"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt={user.name || 'User'} className="w-9 h-9 rounded-full border-2 border-gold/40 object-cover group-hover:border-gold transition-colors" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gold/20 border-2 border-gold/40 group-hover:border-gold flex items-center justify-center transition-colors">
                        <span className="font-mono text-xs font-bold text-gold leading-none">{getInitials(user.name, user.email)}</span>
                      </div>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-ivory-muted transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-charcoal-card border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-ivory font-mono text-sm font-medium truncate">{user.name || 'User'}</p>
                        {user.email && <p className="text-ivory-muted font-mono text-xs truncate mt-0.5">{user.email}</p>}
                      </div>
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-ivory-muted hover:text-ivory hover:bg-white/5 transition-colors font-mono text-xs uppercase tracking-widest">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span>My Profile</span>
                      </Link>
                      <Link to="/track" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-ivory-muted hover:text-ivory hover:bg-white/5 transition-colors font-mono text-xs uppercase tracking-widest">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span>Track Order</span>
                      </Link>
                      <button onClick={handleLogout} id="logout-btn" className="w-full flex items-center gap-3 px-4 py-3 text-ivory-muted hover:text-red-400 hover:bg-red-500/5 transition-colors font-mono text-xs uppercase tracking-widest">
                        <LogOut className="w-4 h-4" /><span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  id="nav-login-btn"
                  aria-label="Login"
                  className="hidden sm:inline-flex items-center justify-center p-1.5 text-ivory-muted hover:text-ivory transition-colors duration-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
              )}

              {/* Currency selector — desktop only */}
              <div className="relative hidden sm:block" ref={currencyRef}>
                <button
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center justify-center p-1.5 text-ivory-muted hover:text-ivory transition-colors duration-200"
                  aria-label="Select currency"
                  id="currency-selector-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <text x="12" y="16.5" textAnchor="middle" fontSize="9.5" fontWeight="500" fill="currentColor" fontFamily="sans-serif">{currency.symbol}</text>
                  </svg>
                </button>

                {isCurrencyOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-charcoal-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-ivory-muted font-mono text-[10px] uppercase tracking-widest">Currency</p>
                    </div>
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 font-mono text-xs transition-colors ${
                          c.code === currency.code ? 'text-gold bg-gold/5' : 'text-ivory-muted hover:text-ivory hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-gold w-4 text-center">{c.symbol}</span>
                          <span>{c.code}</span>
                        </span>
                        <span className="text-ivory-muted/60 text-[10px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart — always visible */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center p-1.5 text-ivory-muted hover:text-ivory transition-colors duration-200"
                aria-label="Open cart"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]">
                  <path d="M2 3h1.5l1.8 9.5a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 1.97-1.65L18.5 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1.25" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="16" cy="20" r="1.25" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-ivory text-charcoal text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-ivory-muted hover:text-ivory transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-charcoal border-l border-white/5 flex flex-col lg:hidden transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-white/5 shrink-0">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Silonka" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl font-semibold text-ivory">Silonka</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-ivory-muted hover:text-ivory transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-4 py-4 gap-0.5 flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-widest transition-colors ${
                isActive(link.href) ? 'text-gold bg-gold/8' : 'text-ivory-muted hover:text-ivory hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer: currency + auth */}
        <div className="px-5 pb-8 pt-4 border-t border-white/5 flex flex-col gap-5 shrink-0">

          {/* Currency chips */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ivory-muted mb-2.5">Currency</p>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                    c.code === currency.code
                      ? 'border-gold/50 text-gold bg-gold/8'
                      : 'border-white/10 text-ivory-muted hover:border-white/25 hover:text-ivory'
                  }`}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ivory font-mono text-xs font-medium truncate">{user.name || 'User'}</p>
                  {user.email && <p className="text-ivory-muted font-mono text-[10px] truncate">{user.email}</p>}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-red-400 font-mono text-xs uppercase tracking-widest shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />Logout
                </button>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/10 text-ivory-muted hover:text-ivory hover:border-white/25 transition-colors font-mono text-xs uppercase tracking-widest"
                >
                  Profile
                </Link>
                <Link
                  to="/track"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gold/20 text-gold hover:bg-gold/10 transition-colors font-mono text-xs uppercase tracking-widest"
                >
                  Track
                </Link>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 py-3 px-4 rounded-lg border border-white/10 text-ivory-muted hover:text-ivory hover:border-white/25 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-mono text-sm uppercase tracking-widest">Login</span>
            </Link>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
