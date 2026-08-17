import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — file stays in buffer, never touches disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

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
            },
            (error, result) => {
                if (error) reject(error);
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
