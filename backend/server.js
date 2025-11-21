const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const pool = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Get frontend URL from environment or default to localhost
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// No authentication middleware - OAuth removed

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/menu', require('./routes/menu'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/', (req, res) => {
    res.json({ name: 'bobapos', status: 'OK' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

// Export for Vercel serverless functions
module.exports = app;

// Only listen if not in Vercel environment
// Vercel sets VERCEL=1, but we also check for VERCEL_ENV to be safe
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}