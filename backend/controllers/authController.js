const pool = require('../config/database');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

/**
 * Configure Google OAuth Strategy
 * This strategy handles the authentication flow with Google
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists in database
        const userQuery = 'SELECT * FROM users WHERE googleid = $1';
        const userResult = await pool.query(userQuery, [profile.id]);

        if (userResult.rows.length > 0) {
            // User exists, return user
            return done(null, userResult.rows[0]);
        } else {
            // Create new user
            const insertQuery = `
                INSERT INTO users (googleid, email, name, picture, createdat)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            `;
            const newUser = await pool.query(insertQuery, [
                profile.id,
                profile.emails[0].value,
                profile.displayName,
                profile.photos[0]?.value || null
            ]);
            return done(null, newUser.rows[0]);
        }
    } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error, null);
    }
}));

/**
 * Serialize user for session
 * Stores user ID in the session
 */
passport.serializeUser((user, done) => {
    done(null, user.userid);
});

/**
 * Deserialize user from session
 * Retrieves full user object from database using stored ID
 */
passport.deserializeUser(async (id, done) => {
    try {
        const query = 'SELECT userid, googleid, email, name, picture, role FROM users WHERE userid = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(null, null);
        }
    } catch (error) {
        console.error('Error deserializing user:', error);
        done(error, null);
    }
});

/**
 * Initiate Google OAuth login
 * @route GET /api/auth/google
 */
const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

/**
 * Handle Google OAuth callback
 * @route GET /api/auth/google/callback
 */
const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            console.error('OAuth error:', err);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=auth_failed&details=${encodeURIComponent(err.message)}`);
        }
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=no_user`);
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=login_failed&details=${encodeURIComponent(err.message)}`);
            }
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/home`);
        });
    })(req, res, next);
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 * @returns {Object} Current user information
 */
const getCurrentUser = async (req, res) => {
    try {
        if (req.user) {
            res.json({ success: true, user: req.user });
        } else {
            res.status(401).json({ success: false, error: 'Not authenticated' });
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @returns {Object} Success message
 */
const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ success: false, error: 'Failed to logout' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ success: false, error: 'Failed to destroy session' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
};

/**
 * Middleware to check if user is authenticated
 * Use this to protect routes that require authentication
 */
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, error: 'Authentication required' });
};

module.exports = {
    googleAuth,
    googleCallback,
    getCurrentUser,
    logout,
    isAuthenticated,
    passport
};

