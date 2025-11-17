# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Boba POS System.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to your PostgreSQL database
3. Node.js and npm installed

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in the required information (app name, user support email, developer contact)
     - Add scopes: `profile` and `email`
     - Add test users if in testing mode
   - For application type, choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - `http://localhost:3000` (for backend)
     - Your production frontend URL (if applicable)
     - Your production backend URL (if applicable)
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local development)
     - Your production backend URL + `/api/auth/google/callback` (if applicable)
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

## Step 2: Set Up Database

Run the migration to create the users table:

```bash
# Connect to your PostgreSQL database and run:
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f backend/migrations/create_users_table.sql

# Or manually execute the SQL in the file
```

## Step 3: Configure Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
PSQL_USER=your_postgres_user
PSQL_HOST=your_postgres_host
PSQL_DATABASE=your_database_name
PSQL_PASSWORD=your_postgres_password
PSQL_PORT=5432

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your_random_secret_key_here_minimum_32_characters

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

For production, update these URLs to match your deployed URLs.

## Step 4: Install Dependencies

The OAuth dependencies should already be installed, but if needed:

```bash
cd backend
npm install
```

## Step 5: Start the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## Step 6: Test the Authentication

1. Navigate to `http://localhost:5173`
2. Click on "Manager" or "Cashier" (protected routes)
3. You should be redirected to the login page
4. Click "Sign in with Google"
5. Complete the Google OAuth flow
6. You should be redirected back to the application and logged in

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URI in Google Console exactly matches your callback URL
   - Check that you've added both `http://localhost:3000/api/auth/google/callback` and your production URL

2. **Session not persisting**
   - Ensure `credentials: true` is set in CORS configuration
   - Check that cookies are being sent (check browser DevTools > Network > Cookies)
   - Verify `SESSION_SECRET` is set and is a secure random string

3. **CORS errors**
   - Ensure `FRONTEND_URL` matches your actual frontend URL
   - Check that `credentials: true` is set in both frontend API calls and backend CORS config

4. **Database errors**
   - Verify the users table was created successfully
   - Check database connection credentials
   - Ensure PostgreSQL is running and accessible

5. **"Not authenticated" errors**
   - Check that sessions are being stored (check browser cookies)
   - Verify the session middleware is properly configured
   - Check backend logs for authentication errors

## Production Deployment

For production:

1. Update all URLs in environment variables to production URLs
2. Set `NODE_ENV=production`
3. Use a secure `SESSION_SECRET` (generate with: `openssl rand -base64 32`)
4. Update Google OAuth redirect URIs to production URLs
5. Consider using a session store (like Redis) instead of in-memory sessions
6. Enable HTTPS (required for secure cookies in production)
7. Update CORS origins to only allow your production domain

## Security Notes

- Never commit `.env` files to version control
- Use strong, random `SESSION_SECRET` values
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Cloud Console
- Implement rate limiting for authentication endpoints
- Consider adding additional security measures like CSRF protection

