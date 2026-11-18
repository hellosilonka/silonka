import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import User from './models/User.js';
import Category from './models/Category.js';
import { emailField } from './utils/http.js';
dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
try {
    const email = emailField(process.env.SEED_ADMIN_EMAIL);
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error('Set SEED_ADMIN_PASSWORD to a unique password of 12–72 bytes.');
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email });
    if (existing) {
        if (!existing.isAdmin) throw new Error('This email belongs to an existing customer. Choose another email.');
        if (process.argv.includes('--reset-admin-password')) { existing.password = password; await existing.save(); }
        console.log('Existing administrator retained. Password changes require --reset-admin-password.');
    } else {
        await User.create({ name: 'Silonka Administrator', email, password, isAdmin: true });
        console.log('Administrator created. No customer data was removed.');
    }
    for (const name of ['Ceylon Cinnamon', 'Ceylon Black Pepper', 'Cloves and Cardamom', 'Gift Set']) {
        await Category.updateOne({ name }, { $setOnInsert: { name, slug: name.toLowerCase().replaceAll(' ', '-') } }, { upsert: true });
    }
} catch (err) {
    console.error(err.message);
    process.exitCode = 1;
} finally { await mongoose.disconnect(); }
