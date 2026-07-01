import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, LogOut, ChevronDown } from 'lucide-react';
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Blog', href: '/blog' },
    { label: 'Origins', href: '/origins' },
    { label: 'Craft', href: '/craft' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logoutUser();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Generate initials or use picture for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
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
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 font-display text-2xl lg:text-3xl font-semibold text-ivory tracking-tight hover:text-gold transition-colors group"
            >
              <img
                src="/logo.png"
                alt="Silonka logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(196,164,105,0.3)] group-hover:drop-shadow-[0_0_10px_rgba(196,164,105,0.5)] transition-all duration-300"
              />
              <span className="hidden sm:inline">Silonka</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`font-mono text-label uppercase tracking-widest transition-colors duration-300 ${
                    isActive(link.href)
                      ? 'text-gold'
                      : 'text-ivory-muted hover:text-gold'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 sm:gap-6">

              {/* Auth section */}
              {user ? (
                /* Logged-in: profile avatar with dropdown */
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 group"
                    aria-label="User profile"
                    id="profile-menu-btn"
                  >
                    {/* Avatar */}
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="w-9 h-9 rounded-full border-2 border-gold/40 object-cover group-hover:border-gold transition-colors"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gold/20 border-2 border-gold/40 group-hover:border-gold flex items-center justify-center transition-colors">
                        <span className="font-mono text-xs font-bold text-gold leading-none">
                          {getInitials(user.name, user.email)}
                        </span>
                      </div>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-ivory-muted transition-transform duration-200 ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-charcoal-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-ivory font-mono text-sm font-medium truncate">
                          {user.name || 'User'}
                        </p>
                        {user.email && (
                          <p className="text-ivory-muted font-mono text-xs truncate mt-0.5">
                            {user.email}
                          </p>
                        )}
                      </div>

                      {/* Logout action */}
                      <button
                        onClick={handleLogout}
                        id="logout-btn"
                        className="w-full flex items-center gap-3 px-4 py-3 text-ivory-muted hover:text-red-400 hover:bg-red-500/5 transition-colors font-mono text-xs uppercase tracking-widest"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged-out: Login button */
                <Link
                  to="/login"
                  id="nav-login-btn"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 border border-gold/40 hover:border-gold text-gold font-mono text-xs uppercase tracking-widest rounded-full transition-all duration-300 hover:bg-gold/5"
                >
                  Login
                </Link>
              )}

            {/* Currency Selector */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-gold/40 text-ivory-muted hover:text-ivory font-mono text-xs uppercase tracking-wider transition-all duration-300"
                  aria-label="Select currency"
                  id="currency-selector-btn"
                >
                  <span className="text-gold">{currency.symbol}</span>
                  <span>{currency.code}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
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
                          c.code === currency.code
                            ? 'text-gold bg-gold/5'
                            : 'text-ivory-muted hover:text-ivory hover:bg-white/5'
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

              {/* Cart button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-ivory hover:text-gold transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-charcoal text-xs font-mono font-medium rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-ivory hover:text-gold transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-30 lg:hidden transition-all duration-500 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div
          className="absolute inset-0 bg-charcoal/98 backdrop-blur-xl"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="relative h-full flex flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <Link
              key={link.label}
              to={link.href}
              className={`font-display text-3xl transition-colors duration-300 ${
                isActive(link.href) ? 'text-gold' : 'text-ivory hover:text-gold'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile auth */}
          <div className="mt-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 font-mono text-sm uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="text-gold font-mono text-sm uppercase tracking-widest border border-gold/40 px-6 py-2 rounded-full hover:bg-gold/5 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
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
