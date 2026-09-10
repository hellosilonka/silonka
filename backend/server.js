import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bulkOrderRoutes from './routes/bulkOrderRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import dhlRoutes from './routes/dhlRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import { seoPrerender } from './middleware/seoPrerender.js';

const app = express();

// Enable gzip/brotli compression for all responses
app.use(compression());

// CORS — must handle preflight before other middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle CORS preflight for all routes
app.options('*', cors());

// Security headers — allow Google OAuth popup communication
app.use((req, res, next) => {
    // Allow Google's accounts.google.com to post messages back
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

app.use(express.json());
app.use(cookieParser());

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/dhl', dhlRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api', sitemapRoutes);

// Health-check endpoint — used by keep-alive ping and external monitors
app.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — prevents ERR_CONNECTION_RESET from unhandled promise rejections
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ─── Serve frontend in production ────────────────
if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, '../app/dist');
    const publicPath = path.resolve(__dirname, '../app/public');

    // Log which paths are being used (visible in deployment logs)
    console.log('[Static] __dirname:', __dirname);
    console.log('[Static] distPath:', distPath, '| exists:', fs.existsSync(distPath));
    console.log('[Static] publicPath:', publicPath, '| exists:', fs.existsSync(publicPath));

    if (fs.existsSync(distPath)) {
        // List files for debugging
        const files = fs.readdirSync(distPath).filter(f => /\.(jpg|png|mp4|ico|svg)$/i.test(f));
        console.log('[Static] Image files in dist:', files);
    }

    // Primary: serve hashed assets (JS/CSS) from dist/assets with long cache
    if (fs.existsSync(path.join(distPath, 'assets'))) {
        app.use('/assets', express.static(path.join(distPath, 'assets'), {
            maxAge: '1y',
            immutable: true,
            setHeaders: (res, filePath) => {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            },
        }));
    }

    // Serve other dist files with content-type-aware caching
    if (fs.existsSync(distPath)) {
        app.use(express.static(distPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.html')) {
                    // Never cache HTML — SPA must always get latest
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                } else if (/\.(jpg|jpeg|png|webp|avif|gif|svg|ico)$/i.test(filePath)) {
                    // Images: 30-day cache, Vary for WebP negotiation
                    res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
                    res.setHeader('Vary', 'Accept');
                } else if (/\.(mp4|webm|mov)$/i.test(filePath)) {
                    // Videos: 30-day cache
                    res.setHeader('Cache-Control', 'public, max-age=2592000');
                } else if (/\.(woff2?|ttf|eot)$/i.test(filePath)) {
                    // Fonts: 1-year cache
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                } else if (/\.(txt|xml)$/i.test(filePath)) {
                    // llms.txt, robots.txt, sitemap.xml: 1-day cache
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                }
            },
        }));
    }

    // Fallback: also serve from app/public with same caching rules
    if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath, {
            setHeaders: (res, filePath) => {
                if (/\.(jpg|jpeg|png|webp|avif|gif|svg|ico)$/i.test(filePath)) {
                    res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
                    res.setHeader('Vary', 'Accept');
                } else if (/\.(mp4|webm|mov)$/i.test(filePath)) {
                    res.setHeader('Cache-Control', 'public, max-age=2592000');
                } else if (/\.(txt|xml)$/i.test(filePath)) {
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                } else {
                    res.setHeader('Cache-Control', 'public, max-age=604800');
                }
            },
        }));
    }

    // SEO: Pre-render meta tags for search engine bots before SPA fallback
    app.use(seoPrerender(distPath));

    // SPA fallback — serve index.html for client-side routes only
    app.get('*', (req, res) => {
        // Don't serve index.html for API or upload routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return res.status(404).json({ message: 'Not found' });
        }

        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(500).send('Frontend build not found. Run "npm run build" first.');
        }
    });
} else {
    app.get('/', (req, res) => {
        res.send('Silonka API is running...');
    });
}

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        // Seed the fixed categories if they don't exist yet
        import('./models/Category.js').then(({ default: Category }) => {
            const DEFAULT_CATEGORIES = [
                { name: 'Ceylon Cinnamon',    slug: 'ceylon-cinnamon' },
                { name: 'Ceylon Black Pepper', slug: 'ceylon-black-pepper' },
                { name: 'Cloves and Cardamom', slug: 'cloves-and-cardamom' },
                { name: 'Gift Set',            slug: 'gift-set' },
            ];
            Promise.all(
                DEFAULT_CATEGORIES.map(cat =>
                    Category.updateOne({ slug: cat.slug }, { $setOnInsert: cat }, { upsert: true })
                )
            ).then(() => console.log('[seed] Default categories ensured'))
             .catch(err => console.warn('[seed] Category seed error:', err.message));
        });

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            // ── Keep-alive: prevent Render free plan spin-down ──────────────
            // Render shuts down free services after 15 min of inactivity.
            // We ping our own /api/ping endpoint every 14 minutes to stay alive.
            if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
                const keepAliveUrl = `${process.env.RENDER_EXTERNAL_URL}/api/ping`;
                const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

                setInterval(async () => {
                    try {
                        const res = await fetch(keepAliveUrl);
                        console.log(`[keep-alive] Pinged ${keepAliveUrl} — status ${res.status}`);
                    } catch (err) {
                        console.warn(`[keep-alive] Ping failed: ${err.message}`);
                    }
                }, INTERVAL_MS);

                console.log(`[keep-alive] Self-ping active every 14 min → ${keepAliveUrl}`);
            }
        });
    })
    .catch((error) => console.log(`Error connecting to MongoDB: ${error.message}`));

// Prevent server crash from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
