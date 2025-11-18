// Vercel serverless function handler
// This file exports the Express app for Vercel's serverless environment
const app = require('../server');

// Export as default handler for Vercel
module.exports = app;

