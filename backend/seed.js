/**
 * seed.js — Seeds ONLY the admin user.
 * Products are managed through the Admin Dashboard.
 *
 * Usage: node seed.js
 * Warning: This clears ALL users and orders before re-seeding.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        await Order.deleteMany();
        await User.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Silonka@2026', salt);

        await User.insertMany([
            {
                name: 'Admin Silonka',
                email: 'admin@silonka.com',
                password: hashedPassword,
                isAdmin: true,
            }
        ]);

        console.log('✅ Admin user seeded!');
        console.log('   Email:    admin@silonka.com');
        console.log('   Password: Silonka@2026');
        console.log('   → Add products via the Admin Dashboard at /admin');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
