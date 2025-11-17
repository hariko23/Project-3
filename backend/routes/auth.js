const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * Authentication routes
 * - GET /api/auth/google - Initiate Google OAuth login
 * - GET /api/auth/google/callback - Handle Google OAuth callback
 * - GET /api/auth/me - Get current authenticated user
 * - POST /api/auth/logout - Logout user
 */

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// User info and logout
router.get('/me', authController.isAuthenticated, authController.getCurrentUser);
router.post('/logout', authController.isAuthenticated, authController.logout);

module.exports = router;

