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

            // Inject noindex for private pages (login, signup, checkout)
            if (meta.noIndex) {
                html = html.replace(
                    /<meta name="robots"[^>]*\/>/,
                    `<meta name="robots" content="noindex, nofollow" />`
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

            // Inject visible semantic content into the body for bots
            // This gives crawlers an H1, description, and word count
            if (meta.h1 || meta.bodyText) {
                const seoBlock = buildSeoBlock(meta);
                html = html.replace(
                    '<div id="root"></div>',
                    `<div id="root">${seoBlock}</div>`
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
 * Build a hidden-but-crawlable semantic HTML block for bots.
 * React will hydrate over this on client-side, but bots get real content.
 */
function buildSeoBlock(meta) {
    let block = '<main>';
    if (meta.h1) block += `<h1>${escapeHtml(meta.h1)}</h1>`;
    if (meta.bodyText) block += `<p>${escapeHtml(meta.bodyText)}</p>`;
    if (meta.extraHtml) block += meta.extraHtml;
    block += '</main>';
    return block;
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
                h1: blog.title,
                bodyText: blog.excerpt,
                extraHtml: blog.content ? `<article>${escapeHtml(blog.content.substring(0, 1500))}</article>` : '',
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
                h1: product.name,
                bodyText: `${product.description} Single-origin ${product.category} from Sri Lanka, hand-harvested and processed in small batches. Shop premium Ceylon spices at Silonka.`,
                jsonLd: schema,
            };
        }
    }

    // ─── Static page meta map ────────────────────────
    const staticPages = {
        '/': {
            title: 'Silonka — Premium Ceylon Cinnamon & Spices from Sri Lanka',
            description: 'Buy authentic Ceylon Cinnamon (Cinnamomum verum), Black Pepper, and Cloves — single-origin, hand-harvested from Sri Lanka\'s misty hill country. True cinnamon with low coumarin, delivered fresh worldwide.',
            h1: 'Silonka Spices',
            bodyText: 'Premium single-origin Ceylon spices — Black Pepper, Cinnamon, Cloves. Harvested at peak aroma from Sri Lanka\'s hill country. The magical harvest born from the mist-veiled highlands of Ceylon. Each spice is hand-selected from smallholder farms and processed in small batches to preserve its essential oils. From the rugged, rolling plains of the Southern and South-Western regions of Sri Lanka, we bring the world cinnamon of quality that is unlike any other.',
        },
        '/shop': {
            title: 'Shop Premium Ceylon Spices Online — Silonka',
            description: 'Browse and buy authentic Ceylon cinnamon, black pepper, cloves, and curated spice gift sets. Single-origin, hand-harvested from Sri Lanka. Free shipping on select orders.',
            h1: 'Shop Silonka Spices',
            bodyText: 'From our partner farms in Sri Lanka to your kitchen. Each spice is harvested at peak potency and sealed for maximum freshness. Browse our collection of premium Ceylon cinnamon, black pepper, cloves, and curated spice gift sets.',
        },
        '/blog': {
            title: 'Ceylon Cinnamon Blog — Health Benefits, Recipes & Spice Guides | Silonka',
            description: "Discover everything about Ceylon Cinnamon — health benefits, recipes, antioxidant properties, diabetes management, and how it compares to Cassia. Expert insights on premium Sri Lankan spices from Silonka.",
            ogType: 'blog',
            h1: 'There is only one true cinnamon. It comes from Sri Lanka.',
            bodyText: "Explore Silonka's blog for expert insights on Ceylon spices, authentic Sri Lankan recipes, health benefits of cinnamon and pepper, and the art of spice cultivation.",
        },
        '/origins': {
            title: 'Our Story — The Origins of Ceylon Spices — Silonka',
            description: "Discover Silonka's story: from ancient spice trade routes through Sri Lanka's hill country to your kitchen. Learn about Ceylon cinnamon, black pepper, and cloves — and the families who cultivate them.",
            h1: 'From Sri Lanka to Your Kitchen',
            bodyText: "For two thousand years, one island kept the world's most treasured secret. Silonka was born from it. Sri Lanka, historically known as Ceylon, has been one of the world's most celebrated sources of Cinnamon for many centuries. Located along the major maritime routes of the Indian Ocean, the island had become a crucial hub very early on in the ancient global spice trade, attracting merchants from Arabia, Persia, and China. Ceylon Cinnamon had achieved status as one of the most prized commodities of global trade long before the arrival of Europeans.",
        },
        '/craft': {
            title: 'Our Craft — How We Harvest & Process Ceylon Spices — Silonka',
            description: "From hand-harvesting at peak ripeness to nitrogen-flushed packaging — learn the 4-step process that makes Silonka's Ceylon spices the freshest in the world.",
            h1: 'The Art of Spice Craft',
            bodyText: "From harvest to your kitchen, every step is designed to preserve the essential oils that make Silonka spices extraordinary. We time harvest to the monsoon season when essential oils are at their peak. Each spice is hand-picked at perfect ripeness, sun-dried naturally, hand-sorted for quality, and packaged in nitrogen-flushed, triple-layer pouches.",
        },
        '/contact': {
            title: 'Contact Silonka — Ceylon Spice Experts',
            description: "Have questions about our Ceylon spices, shipping, or wholesale orders? Get in touch with Silonka. Based in Colombo, Sri Lanka — we respond within 24 hours.",
            h1: 'Contact Us',
            bodyText: "Have questions about our spices, shipping, or wholesale orders? We'd love to hear from you. Our team is based in Colombo, Sri Lanka. We typically respond within 24 hours. Email: hello@silonka.com. Phone: +94 76 695 1393.",
        },
        '/bulk-order': {
            title: 'Wholesale & Bulk Spice Orders — Silonka',
            description: "Order premium Ceylon spices in bulk. Custom wholesale pricing for businesses, hotels, cafés, and retailers. Minimum quantities apply. Get a quote within 2 business days.",
            h1: 'Bulk Order Inquiry',
            bodyText: "Wholesale and bulk pricing for businesses, cafés, hotels, and retailers. Fill in the form and our team will contact you with custom pricing. We offer premium Ceylon cinnamon, black pepper, cloves, and curated spice collections in wholesale quantities.",
        },
        '/refund-policy': {
            title: 'Refund Policy — Silonka',
            description: "Silonka's refund and return policy for Ceylon spice purchases. Learn about returns, exchanges, damaged items, and refund processing times.",
            h1: 'Refund Policy',
            bodyText: "Thank you for shopping at Silonka. We value your satisfaction and strive to provide you with the finest Ceylon spices. We accept returns within 14 days from the date of purchase. Once we receive your return and inspect the item, we will notify you of the status of your refund within 3 business days. If your return is approved, we will initiate a refund to your original method of payment within 7 business days.",
        },
        '/privacy-policy': {
            title: 'Privacy Policy — Silonka',
            description: "Learn how Silonka collects, uses, and protects your personal information. Our privacy policy covers data security, cookies, and your rights.",
            h1: 'Privacy Policy',
            bodyText: "At Silonka, we are committed to protecting the privacy and security of our customers' personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you visit or make a purchase on our website. We implement industry-standard security measures including SSL/TLS encryption, secure servers, and access controls.",
        },
        '/terms-and-conditions': {
            title: 'Terms & Conditions — Silonka',
            description: "Read Silonka's terms and conditions governing website usage, product purchases, shipping, returns, and intellectual property for our Ceylon spice store.",
            h1: 'Terms & Conditions',
            bodyText: "Welcome to Silonka. These Terms and Conditions govern your use of our website and the purchase and sale of our products. By accessing and using our website, you agree to comply with these terms. You must be at least 18 years old to use our website or make purchases.",
        },
        '/login': {
            title: 'Sign In — Silonka',
            description: "Sign in to your Silonka account to track orders, manage your profile, and access exclusive member benefits.",
            noIndex: true,
            h1: 'Sign In',
            bodyText: 'Sign in to your Silonka account to track orders and manage your profile.',
        },
        '/signup': {
            title: 'Create Account — Silonka',
            description: "Create your free Silonka account to shop premium Ceylon spices, track your orders, and enjoy a personalized experience.",
            noIndex: true,
            h1: 'Create Account',
            bodyText: 'Create your free Silonka account to shop premium Ceylon spices and track your orders.',
        },
        '/checkout': {
            title: 'Checkout — Silonka',
            description: "Complete your order for premium Ceylon spices from Silonka.",
            noIndex: true,
            h1: 'Checkout',
            bodyText: 'Complete your order for premium Ceylon spices from Silonka.',
        },
    };

    if (staticPages[urlPath]) {
        return staticPages[urlPath];
    }

    return null;
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
