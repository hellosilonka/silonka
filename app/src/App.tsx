import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { GeoProvider } from '@/context/GeoContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from '@/components/ErrorBoundary';

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
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage'));
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

gsap.registerPlugin(ScrollTrigger);

// Minimal loading fallback for route transitions
function RouteLoader() {
  return (
    <div role="status" aria-label="Loading page" className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );
}

// Module-level Lenis ref so ScrollToTop can access it
let lenisInstance: Lenis | null = null;

// Smooth scroll wrapper component
function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenisInstance = null;
      gsap.ticker.remove(tick);
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
  const { pathname } = useLocation();
  return (
    <div className="relative bg-charcoal min-h-screen">
      <div className="noise-overlay" />
      <Navigation key={pathname} />
      <CartDrawer />
      <main id="main-content" className="relative overflow-x-clip">
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
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
    <Routes>
      {/* Public Pages with main navigation */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/origins" element={<OriginsPage />} />
        <Route path="/craft" element={<CraftPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/result" element={<PaymentResultPage />} />
        <Route path="/bulk-order" element={<BulkOrderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route path="*" element={<NotFoundPage />} />
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

function OptionalGoogleProvider({ children }: { children: ReactNode }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return clientId ? <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider> : children;
}

function App() {
  return (
    <ErrorBoundary>
      <OptionalGoogleProvider>
        <AuthProvider>
          <GeoProvider>
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
          </GeoProvider>
        </AuthProvider>
      </OptionalGoogleProvider>
    </ErrorBoundary>
  );
}

export default App;

