import Blog from '../models/Blog.js';
import Product from '../models/Product.js';

const SITE_URL = 'https://www.silonka.co';

/**
 * Bot detection user-agent patterns.
 * When a search engine crawler requests a page, we inject proper meta tags
 * into the served HTML so Google/Bing can read SEO content without needing
 * to execute JavaScript (React).
 */
const BOT_UA_PATTERNS = [
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp',
    'baiduspider', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'whatsapp', 'telegrambot', 'applebot', 'semrushbot', 'ahrefsbot',
];

function isBot(userAgent) {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_UA_PATTERNS.some(bot => ua.includes(bot));
}

/**
 * SEO pre-rendering middleware.
 * For bot requests to SPA routes (blog posts, products, etc.),
 * this middleware injects the correct <title>, <meta>, OG tags,
 * and JSON-LD structured data into the HTML before serving.
 */
export function seoPrerender(distPath) {
    return async (req, res, next) => {
        // Only intercept bots requesting HTML pages (not API, assets, etc.)
        if (!isBot(req.headers['user-agent'])) return next();
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
        if (/\.(js|css|png|jpg|jpeg|svg|ico|webp|mp4|woff2?|ttf|map|json|xml|txt)$/i.test(req.path)) return next();

        try {
            const meta = await getMetaForPath(req.path);
            if (!meta) return next(); // No special meta — let default index.html serve

            // Read the index.html
            const fs = await import('fs');
            const path = await import('path');
            const indexPath = path.default.resolve(distPath, 'index.html');

            if (!fs.default.existsSync(indexPath)) return next();

            let html = fs.default.readFileSync(indexPath, 'utf-8');

            // Replace the default <title> with page-specific title
            html = html.replace(
                /<title>[^<]*<\/title>/,
                `<title>${escapeHtml(meta.title)}</title>`
            );

            // Inject meta description (replace existing or add)
            if (meta.description) {
                html = html.replace(
                    /<meta name="description"[^>]*\/>/,
                    `<meta name="description" content="${escapeAttr(meta.description)}" />`
                );
            }

            // Replace OG tags
            if (meta.title) {
                html = html.replace(
                    /<meta property="og:title"[^>]*\/>/,
                    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`
                );
                html = html.replace(
                    /<meta name="twitter:title"[^>]*\/>/,
                    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`
                );
            }
            if (meta.description) {
                html = html.replace(
                    /<meta property="og:description"[^>]*\/>/,
                    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`
                );
                html = html.replace(
                    /<meta name="twitter:description"[^>]*\/>/,
                    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
                );
            }
            if (meta.image) {
                html = html.replace(
                    /<meta property="og:image"[^>]*\/>/,
                    `<meta property="og:image" content="${escapeAttr(meta.image)}" />`
                );
                html = html.replace(
                    /<meta name="twitter:image"[^>]*\/>/,
                    `<meta name="twitter:image" content="${escapeAttr(meta.image)}" />`
                );
            }

            // Update canonical URL
            const canonicalUrl = `${SITE_URL}${req.path}`;
            html = html.replace(
                /<meta property="og:url"[^>]*\/>/,
                `<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />`
            );
            html = html.replace(
                /<meta name="twitter:url"[^>]*\/>/,
                `<meta name="twitter:url" content="${escapeAttr(canonicalUrl)}" />`
            );

            // Add canonical link tag if not present
            if (!html.includes('rel="canonical"')) {
                html = html.replace(
                    '</head>',
                    `  <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />\n</head>`
                );
            }

            // Inject JSON-LD structured data before </head>
            if (meta.jsonLd) {
                html = html.replace(
                    '</head>',
                    `  <script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>\n</head>`
                );
            }

            // Set OG type for articles
            if (meta.ogType) {
                html = html.replace(
                    /<meta property="og:type"[^>]*\/>/,
                    `<meta property="og:type" content="${escapeAttr(meta.ogType)}" />`
                );
            }

            res.set('Content-Type', 'text/html');
            res.send(html);
        } catch (err) {
            console.error('SEO prerender error:', err.message);
            next(); // Fall through to default SPA handler
        }
    };
}

/**
 * Get meta tags for a given URL path by querying the database.
 */
async function getMetaForPath(urlPath) {
    // Blog post: /blog/:slug
    const blogMatch = urlPath.match(/^\/blog\/([a-z0-9-]+)$/);
    if (blogMatch) {
        const slug = blogMatch[1];
        const blog = await Blog.findOne({ slug, published: true }).lean();
        if (blog) {
            return {
                title: `${blog.title} — Silonka Blog`,
                description: blog.excerpt,
                image: blog.image || `${SITE_URL}/hero_spice_field.jpg`,
                ogType: 'article',
                jsonLd: {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: blog.title,
                    description: blog.excerpt,
                    image: blog.image || `${SITE_URL}/hero_spice_field.jpg`,
                    author: { '@type': 'Person', name: blog.author || 'Silonka Team' },
                    publisher: {
                        '@type': 'Organization',
                        name: 'Silonka',
                        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
                    },
                    datePublished: blog.createdAt,
                    dateModified: blog.updatedAt,
                    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${blog.slug}` },
                    keywords: blog.tags?.join(', '),
                },
            };
        }
    }

    // Product page: /product/:id
    const productMatch = urlPath.match(/^\/product\/([a-f0-9]{24})$/);
    if (productMatch) {
        const id = productMatch[1];
        const product = await Product.findById(id).lean();
        if (product) {
            const schema = {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.name,
                description: product.description,
                image: product.image?.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
                url: `${SITE_URL}/product/${product._id}`,
                brand: { '@type': 'Brand', name: 'Silonka' },
                category: product.category,
                offers: {
                    '@type': 'Offer',
                    price: product.price,
                    priceCurrency: 'USD',
                    availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                },
            };

            if (product.averageRating && product.numReviews > 0) {
                schema.aggregateRating = {
                    '@type': 'AggregateRating',
                    ratingValue: product.averageRating,
                    reviewCount: product.numReviews,
                    bestRating: 5,
                    worstRating: 1,
                };
            }

            return {
                title: `${product.name} — Buy Premium ${product.category} Online | Silonka`,
                description: `${product.description} Single-origin ${product.category} from Sri Lanka. Shop at Silonka.`,
                image: product.image?.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
                jsonLd: schema,
            };
        }
    }

    // Blog index
    if (urlPath === '/blog') {
        return {
            title: 'Blog — Ceylon Spice Insights, Recipes & Health Benefits — Silonka',
            description: "Explore Silonka's blog for expert insights on Ceylon spices, authentic Sri Lankan recipes, health benefits of cinnamon and pepper, and the art of spice cultivation.",
            ogType: 'blog',
        };
    }

    // Shop
    if (urlPath === '/shop') {
        return {
            title: 'Shop Premium Ceylon Spices Online — Silonka',
            description: 'Browse and buy authentic Ceylon cinnamon, black pepper, cloves, and curated spice gift sets. Single-origin, hand-harvested from Sri Lanka.',
        };
    }

    return null; // Not a special page — use default index.html
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
