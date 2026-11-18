import Blog from '../models/Blog.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import crypto from 'node:crypto';
import { blogInput } from '../utils/blogInput.js';
import { httpError } from '../utils/http.js';

// GET /api/blogs  — public, returns published only (or all for admin)
export const getBlogs = async (req, res) => {
    try {
        const { admin: isAdmin } = req.query;
        const filter = isAdmin === 'true' ? {} : { published: true };
        const blogs = await Blog.find(filter).select(isAdmin === 'true' ? '' : '-content').sort({ createdAt: -1 }).limit(200).lean();
        res.json(blogs);
    } catch (err) {
        throw err;
    }
};

// GET /api/blogs/:slug  — public
export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, published: true });
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        res.json(blog);
    } catch (err) {
        throw err;
    }
};

// GET /api/blogs/id/:id  — admin
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        res.json(blog);
    } catch (err) {
        throw err;
    }
};

// POST /api/blogs  — admin only
export const createBlog = async (req, res) => {
    const data = blogInput(req.body);
    const base = data.slug || data.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `article-${crypto.randomUUID()}`;
    data.slug = await Blog.exists({ slug: base }) ? `${base}-${crypto.randomUUID().slice(0, 8)}` : base;
    const blog = new Blog(data);
    await blog.validate();
    if (req.file) blog.image = await uploadToCloudinary(req.file);
    res.status(201).json(await blog.save());
};

// PUT /api/blogs/:id - admin only
export const updateBlog = async (req, res) => {
    const data = blogInput(req.body, { partial: true });
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw httpError(404, 'Blog post not found.');
    Object.assign(blog, data);
    await blog.validate();
    if (req.file) blog.image = await uploadToCloudinary(req.file);
    res.json(await blog.save());
};

// DELETE /api/blogs/:id  — admin only
export const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog post not found' });
        await blog.deleteOne();
        res.json({ message: 'Blog post deleted' });
    } catch (err) {
        throw err;
    }
};
