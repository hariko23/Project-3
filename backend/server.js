const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const pool = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware - CORS must be first
// Add manual CORS headers first (before any other middleware)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// CORS configuration - allow requests from all origins
// In production, you may want to restrict this to specific domains
const corsOptions = {
  origin: '*', // Allow all origins - change to specific domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Set to true if you need to send cookies
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

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
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}