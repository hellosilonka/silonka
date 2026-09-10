import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Terser for better dead-code elimination and console stripping
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    // Warn if any single chunk exceeds 500 KB
    chunkSizeWarningLimit: 500,
    // Target modern browsers — smaller, faster output
    target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React ecosystem — most stable, cache forever
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // GSAP + smooth scroll — large, stable
          if (id.includes('node_modules/gsap/') ||
              id.includes('node_modules/@gsap/') ||
              id.includes('node_modules/lenis/')) {
            return 'vendor-gsap';
          }
          // Radix UI — large but stable
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          // Recharts — only used on admin, very heavy
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          // PayPal SDK — only used on checkout
          if (id.includes('node_modules/@paypal/')) {
            return 'vendor-payments';
          }
          // Auth — only on login/signup
          if (id.includes('node_modules/@react-oauth/') ||
              id.includes('node_modules/jwt-decode/')) {
            return 'vendor-auth';
          }
          // Forms
          if (id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod/')) {
            return 'vendor-forms';
          }
          // HTTP client + utilities (split from main bundle)
          if (id.includes('node_modules/axios/') ||
              id.includes('node_modules/date-fns/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/tailwind-merge/')) {
            return 'vendor-utils';
          }
          // Notification / cookie / misc UI
          if (id.includes('node_modules/sonner/') ||
              id.includes('node_modules/vaul/') ||
              id.includes('node_modules/react-helmet-async/') ||
              id.includes('node_modules/embla-carousel')) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
  server: {
    // Allow Google OAuth popup to postMessage back to the page
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

