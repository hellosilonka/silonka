import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
export default function NotFoundPage() {
  return <div className="min-h-[70vh] pt-40 pb-20 px-6 text-center"><SEOHead title="Page not found — Silonka" description="Find your way back to the Silonka shop." canonicalPath="/404" noIndex /><p className="font-mono text-gold mb-4">404</p><h1 className="font-display text-4xl text-ivory mb-4">Page not found</h1><p className="text-ivory-muted mb-8">This page may have moved or the link may be incorrect.</p><Link to="/shop" className="btn-gold inline-block">Browse the shop</Link></div>;
}
