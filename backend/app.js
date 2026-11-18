import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import contactRoutes from './routes/contactRoutes.js';
import { seoPrerender } from './middleware/seoPrerender.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0));
    app.use(compression());
    app.use(helmet({
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
        contentSecurityPolicy: { directives: {
            defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://accounts.google.com', 'https://www.gstatic.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
            connectSrc: ["'self'", 'https://accounts.google.com'], frameSrc: ['https://accounts.google.com'],
            formAction: ["'self'", 'https://sandbox.payhere.lk', 'https://www.payhere.lk'],
            objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        } },
        strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    const origins = new Set((process.env.CORS_ORIGINS || process.env.APP_URL || 'http://localhost:5173,http://localhost:3000').split(',').map(value => value.trim()).filter(Boolean));
    app.use(cors({ origin: (origin, cb) => cb(null, !origin || origins.has(origin)), credentials: true, allowedHeaders: ['Content-Type', 'X-Silonka-Request'] }));
    app.use(express.json({ limit: '256kb' }));
    app.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 30 }));
    app.use(cookieParser());
    app.use('/api', (req, res, next) => {
        const unsafe = (value, depth = 0) => {
            if (depth > 20) return true;
            if (!value || typeof value !== 'object') return false;
            return Object.entries(value).some(([key, item]) => key.startsWith('$') || key.includes('.') || ['__proto__', 'constructor', 'prototype'].includes(key) || unsafe(item, depth + 1));
        };
        if (unsafe(req.body) || unsafe(req.query)) return res.status(400).json({ message: 'Invalid request fields.' });
        next();
    });
    app.use('/api', (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        // PayHere authenticates its callback with the merchant signature.
        if (req.path === '/payment/payhere/notify' && req.method === 'POST') return next();
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (req.get('X-Silonka-Request') !== '1' || (req.get('Origin') && !origins.has(req.get('Origin'))))) return res.status(403).json({ message: 'Invalid request origin.' });
        next();
    });
    const limiter = (limit, windowMs = 15 * 60 * 1000) => rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } });
    app.use('/api', (req, res, next) => {
        if (req.path === '/payment/payhere/notify') return next();
        return apiLimit(req, res, next);
    });
    const apiLimit = limiter(500);
    app.use(['/api/auth/login', '/api/auth/register', '/api/auth/google'], limiter(25));
    app.use(['/api/contact', '/api/bulk-orders'], (req, res, next) => req.method === 'POST' ? formLimit(req, res, next) : next());
    const formLimit = limiter(10);
    app.use(['/api/dhl/rates', '/api/dhl/track', '/api/orders/quote', '/api/geo'], limiter(40, 60 * 1000));
    app.use('/uploads', express.static(path.join(dirname, 'uploads'), { dotfiles: 'deny', maxAge: '1d' }));
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/bulk-orders', bulkOrderRoutes);
    app.use('/api/blogs', blogRoutes);
    app.use('/api/dhl', dhlRoutes);
    app.use('/api/geo', geoRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api', sitemapRoutes);
    app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));
    app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
    if (process.env.NODE_ENV === 'production') {
        const dist = path.resolve(dirname, '../app/dist');
        app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
        app.use(seoPrerender(dist));
        app.use(express.static(dist, { index: false, maxAge: '1d', setHeaders: (res, file) => { if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
        app.get('*', (req, res, next) => {
            if (path.extname(req.path) || req.path.startsWith('/uploads/')) return res.status(404).send('Not found');
            res.setHeader('Cache-Control', 'no-cache');
            res.sendFile(path.join(dist, 'index.html'), err => { if (err) next(err); });
        });
    }
    app.use((err, req, res, next) => {
        if (res.headersSent) return next(err);
        let status = err.status || 500, message = err.status && err.status < 500 ? err.message : 'Something went wrong. Please try again.';
        if (err.name === 'CastError' || err.name === 'ValidationError' || err instanceof SyntaxError) { status = 400; message = 'Invalid request data. Please check the fields.'; }
        if (err.code === 11000) { status = 409; message = 'This record already exists.'; }
        if (err.name === 'MulterError') { status = 400; message = 'Upload rejected. Use up to 7 images, each under 5 MB.'; }
        if (err.status === 503) message = err.message;
        if (status >= 500) console.error('Request failed:', req.method, req.path, err.name);
        res.status(status).json({ message });
    });
    return app;
}
