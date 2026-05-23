import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

import LoadingScreen from '@/components/LoadingScreen';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import CookieConsentProvider from '@/components/CookieConsent';

// Pages
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import OriginsPage from '@/pages/OriginsPage';
import CraftPage from '@/pages/CraftPage';
import ContactPage from '@/pages/ContactPage';
import CheckoutPage from '@/pages/CheckoutPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

import AdminDashboard from '@/pages/AdminDashboard';
import AdminLogin from '@/pages/AdminLogin';
import BulkOrderPage from '@/pages/BulkOrderPage';
import RefundPolicyPage from '@/pages/RefundPolicyPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsAndConditionsPage from '@/pages/TermsAndConditionsPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import ProductPage from '@/pages/ProductPage';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll wrapper component
function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}

function MainLayout() {
  return (
    <div className="relative bg-charcoal min-h-screen">
      <div className="noise-overlay" />
      <Navigation />
      <CartDrawer />
      <main className="relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="relative bg-charcoal min-h-screen">
      {/* Admin specific wrapper without the main nav/footer */}
      <Outlet />
    </div>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && isLoading) {
      return;
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, isLoading]);

  if (isLoading && location.pathname === '/') {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <Routes>
      {/* Public Pages with main navigation */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/origins" element={<OriginsPage />} />
        <Route path="/craft" element={<CraftPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/bulk-order" element={<BulkOrderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Route>

      {/* Admin Pages with isolated navigation */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '12345678-placeholder.apps.googleusercontent.com'}>
      <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '', currency: 'USD' }}>
      <AuthProvider>
      <CurrencyProvider>
      <CartProvider>
        <Router>
          <CookieConsentProvider>
          <SmoothScrollProvider>
            <ScrollToTop />
            <AppContent />
          </SmoothScrollProvider>
          </CookieConsentProvider>
        </Router>
      </CartProvider>
      </CurrencyProvider>
      </AuthProvider>
      </PayPalScriptProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
