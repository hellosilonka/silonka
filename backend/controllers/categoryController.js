import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { textField, httpError } from '../utils/http.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        throw error;
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const name = textField(req.body.name, 'category', 100), description = textField(req.body.description || '', 'description', 1000, false);
        const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const category = await Category.create({ name, slug, description });
        res.status(201).json(category);
    } catch (error) {
        throw error;
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        const name = req.body.name === undefined ? undefined : textField(req.body.name, 'category', 100);
        const description = req.body.description === undefined ? undefined : textField(req.body.description, 'description', 1000, false);
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        if (name) {
            if (name !== category.name && await Product.exists({ category: category.name })) throw httpError(409, 'Move products to another category before renaming this category.');
            category.name = name;
            category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        if (description !== undefined) category.description = description;
        const updated = await category.save();
        res.json(updated);
    } catch (error) {
        throw error;
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        if (await Product.exists({ category: category.name })) throw httpError(409, 'Move products out of this category before deleting it.');
        await Category.deleteOne({ _id: category._id });
        res.json({ message: 'Category removed' });
    } catch (error) {
        throw error;
    }
};
