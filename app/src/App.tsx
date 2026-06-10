import { useState, useEffect, lazy, Suspense } from 'react';
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

// Lazy-loaded pages — each becomes its own chunk
const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const OriginsPage = lazy(() => import('@/pages/OriginsPage'));
const CraftPage = lazy(() => import('@/pages/CraftPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const BulkOrderPage = lazy(() => import('@/pages/BulkOrderPage'));
const RefundPolicyPage = lazy(() => import('@/pages/RefundPolicyPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('@/pages/TermsAndConditionsPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));

gsap.registerPlugin(ScrollTrigger);

// Minimal loading fallback for route transitions
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );
}

// Module-level Lenis ref so ScrollToTop can access it
let lenisInstance: Lenis | null = null;

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

    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenisInstance = null;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Stop Lenis to prevent it from fighting the scroll reset
    if (lenisInstance) {
      lenisInstance.stop();
    }

    // Force-reset all scroll positions
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Restart Lenis and refresh ScrollTrigger after the DOM has settled
    requestAnimationFrame(() => {
      if (lenisInstance) {
        lenisInstance.start();
        lenisInstance.scrollTo(0, { immediate: true });
      }
      ScrollTrigger.refresh();
    });
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
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="relative bg-charcoal min-h-screen">
      {/* Admin specific wrapper without the main nav/footer */}
      <Suspense fallback={<RouteLoader />}>
        <Outlet />
      </Suspense>
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

  return (
    <>
      {/* Loading screen renders as OVERLAY on top of real content.
          This lets Lighthouse detect the hero h1/image as LCP behind it. */}
      {isLoading && location.pathname === '/' && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

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
    </>
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

