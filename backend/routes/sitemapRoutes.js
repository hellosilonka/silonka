import express from 'express';
import Blog from '../models/Blog.js';
import Product from '../models/Product.js';

const router = express.Router();

const SITE_URL = 'https://www.silonka.co';

/**
 * Dynamic sitemap that includes all blog posts and products from the database.
 * Serves at /api/sitemap.xml — Google Search Console can use this alongside
 * the static sitemap.xml in public/.
 */
router.get('/sitemap.xml', async (req, res) => {
    try {
        // Fetch all published blogs
        const blogs = await Blog.find({ published: true })
            .select('slug updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        // Fetch all products
        const products = await Product.find({})
            .select('_id updatedAt name')
            .sort({ createdAt: -1 })
            .lean();

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/shop</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/origins</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/craft</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/bulk-order</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/refund-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy-policy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms-and-conditions</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
`;

        // Blog articles
        for (const blog of blogs) {
            const lastmod = blog.updatedAt
                ? new Date(blog.updatedAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            xml += `  <url>
    <loc>${SITE_URL}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }

        // Product pages
        for (const product of products) {
            const lastmod = product.updatedAt
                ? new Date(product.updatedAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            xml += `  <url>
    <loc>${SITE_URL}/product/${product._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }

        xml += `</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error.message);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
