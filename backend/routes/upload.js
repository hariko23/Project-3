const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadImage, upload } = require('../controllers/uploadController');

// POST /api/upload - Upload an image
// Error handling for multer errors
router.post('/', (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    // If no error, proceed to uploadImage
    next();
  });
}, uploadImage);

module.exports = router;

