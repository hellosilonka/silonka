import { Component, type ErrorInfo, type ReactNode } from 'react';
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Page failed to load', error.name, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="min-h-screen bg-charcoal text-ivory flex items-center justify-center p-6"><div className="max-w-md text-center"><h1 className="font-display text-3xl mb-4">We couldn’t load this page</h1><p className="text-ivory-muted mb-6">Your saved cart is still available. Please reload to try again.</p><button className="btn-gold" onClick={() => window.location.reload()}>Reload page</button></div></main>;
    return this.props.children;
  }
}
