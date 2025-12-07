const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

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
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Convert buffer to stream for Cloudinary
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
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to upload image: ' + error.message 
          });
        }
        
        res.json({
          success: true,
          data: {
            url: result.secure_url, // HTTPS URL
            public_id: result.public_id // For future deletion if needed
          }
        });
      }
    );

    // Pipe the buffer to the upload stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  uploadImage,
  upload: upload.single('image') // Middleware for single file upload
};

