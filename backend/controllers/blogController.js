import Blog from '../models/Blog.js';
import { uploadToCloudinary } from '../middleware/upload.js';

// GET /api/blogs  — public, returns published only (or all for admin)
export const getBlogs = async (req, res) => {
    try {
        const { admin: isAdmin } = req.query;
        const filter = isAdmin === 'true' ? {} : { published: true };
        const blogs = await Blog.find(filter).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/blogs/:slug  — public
export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, published: true });
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/blogs/id/:id  — admin
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/blogs  — admin only
export const createBlog = async (req, res) => {
    try {
        const { title, excerpt, content, tags, published, author, readTime } = req.body;

        // Auto-generate slug
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        // Ensure uniqueness
        const existing = await Blog.findOne({ slug });
        if (existing) slug = `${slug}-${Date.now()}`;

        const image = req.file ? await uploadToCloudinary(req.file) : (req.body.image || '');

        const blog = await Blog.create({
            title,
            slug,
            excerpt,
            content,
            image,
            tags: tags ? JSON.parse(tags) : [],
            published: published === 'true' || published === true,
            author: author || 'Silonka Team',
            readTime: readTime ? parseInt(readTime) : 5,
        });

        res.status(201).json(blog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PUT /api/blogs/:id  — admin only
export const updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });

        const { title, excerpt, content, tags, published, author, readTime, slug } = req.body;

        blog.title = title ?? blog.title;
        blog.slug = slug ?? blog.slug;
        blog.excerpt = excerpt ?? blog.excerpt;
        blog.content = content ?? blog.content;
        blog.author = author ?? blog.author;
        blog.readTime = readTime ? parseInt(readTime) : blog.readTime;
        blog.published = published !== undefined ? (published === 'true' || published === true) : blog.published;
        blog.tags = tags ? JSON.parse(tags) : blog.tags;

        if (req.file) {
            blog.image = await uploadToCloudinary(req.file);
        }

        const updated = await blog.save();
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/blogs/:id  — admin only
export const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        await blog.deleteOne();
        res.json({ message: 'Blog post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
