const express = require('express');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv').config();
const pool = require('./config/database');
const { passport } = require('./controllers/authController');

const app = express();
const port = process.env.PORT || 3000;

// Get frontend URL from environment or default to localhost
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware - CORS must be first
// Add manual CORS headers first (before any other middleware)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', frontendUrl);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true // Required for sessions
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
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