import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { httpError } from '../utils/http.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — file stays in buffer, never touches disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) cb(null, true);
    else cb(httpError(400, 'Upload a JPEG, PNG, WebP or AVIF image.'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 7, fields: 30 } });

/**
 * Upload a single multer file buffer to Cloudinary.
 * Returns the secure URL string.
 */
export const uploadToCloudinary = (file, folder = 'silonka') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
                format: 'webp',
            },
            (error, result) => {
                if (error || !result?.secure_url) reject(httpError(503, 'Image upload failed. Please check the image and try again.'));
                else resolve(result.secure_url);
            }
        );
        stream.end(file.buffer);
    });
};

/**
 * Upload multiple multer files to Cloudinary in parallel.
 * Returns an array of secure URL strings.
 */
export const uploadManyToCloudinary = async (files, folder = 'silonka') => {
    if (!files || files.length === 0) return [];
    return Promise.all(files.map(f => uploadToCloudinary(f, folder)));
};
