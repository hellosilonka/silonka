/**
 * clearProducts.js — Run once to wipe all mock products from MongoDB.
 * Usage: node clearProducts.js
 *
 * Keeps Users and Orders intact. Only removes products.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const result = await Product.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} products from the database.`);
        console.log('   You can now add your real products via the Admin Dashboard.');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
