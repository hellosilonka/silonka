import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dirname, '.env') });
const configurationErrors = [];
if (!process.env.MONGO_URI?.trim()) configurationErrors.push('MONGO_URI is missing. Set your MongoDB connection URL.');
if ((process.env.JWT_SECRET || '').trim().length < 32) configurationErrors.push('JWT_SECRET must contain at least 32 characters. Use a securely generated random secret.');
if (configurationErrors.length) {
    console.error(`Cannot start the backend:\n${configurationErrors.map(message => `- ${message}`).join('\n')}\nCheck backend/.env and any environment variables set in your terminal or hosting provider.`);
    process.exit(1);
}
// Load modules after environment configuration (Cloudinary also reads it).
const { createApp } = await import('./app.js');
try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const server = createApp().listen(process.env.PORT || 5000, () => console.log('Silonka server ready'));
    const shutdown = () => server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
} catch {
    console.error('Database connection failed. Check MongoDB configuration and connectivity.');
    process.exit(1);
}
