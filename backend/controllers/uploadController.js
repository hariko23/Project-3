const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (Cloudinary needs buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Upload image to Cloudinary
 * @route POST /api/upload
 * @returns {Object} Object with success status and image URL
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Wrap Cloudinary callback in a Promise
  const uploadPromise = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'boba-menu-items', // Organize images in a folder
        resource_type: 'auto', // Auto-detect image type
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // Resize if too large
          { quality: 'auto' }, // Auto-optimize quality
          { format: 'auto' } // Auto-optimize format (WebP if supported)
        ]
      },
      (error, result) => {
        if (error) {
          reject(new AppError('Failed to upload image: ' + error.message, 500));
        } else {
          resolve(result);
        }
      }
    );

    // Pipe the buffer to the upload stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);
  });

  const result = await uploadPromise;
  
  res.json({
    success: true,
    data: {
      url: result.secure_url, // HTTPS URL
      public_id: result.public_id // For future deletion if needed
    }
  });
});

module.exports = {
  uploadImage,
  upload: upload.single('image') // Middleware for single file upload
};

