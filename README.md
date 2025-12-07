# Project-3: Boba POS System

A full-stack Point of Sale system for a boba tea shop.

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Authentication**: Clerk

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn
- Clerk account (for authentication)

## Folder Structure

```
Project-3/
├── backend/
│   ├── api/              # API route handlers
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic controllers
│   ├── migrations/       # Database migration scripts
│   ├── routes/           # Express route definitions
│   ├── scripts/          # Utility scripts
│   └── server.js         # Main server file
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── api/          # API client functions
│       ├── components/  # React components
│       ├── contexts/     # React contexts
│       └── lib/          # Utility functions
└── Scrum_meetings/       # Sprint documentation
```

## Environment Variables

### Backend (.env file in `backend/` directory)

```env
# Database Configuration
PSQL_USER=your_database_user
PSQL_HOST=your_database_host
PSQL_DATABASE=your_database_name
PSQL_PASSWORD=your_database_password
PSQL_PORT=5432

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Optional: Session Secret (if using sessions)
SESSION_SECRET=your-secret-key-change-in-production

# Vercel Environment (automatically set by Vercel)
VERCEL=1
VERCEL_ENV=production
```

### Frontend (.env file in `frontend/` directory)

```env
# API Base URL (optional, defaults to http://localhost:3000/api)
VITE_API_BASE_URL=http://localhost:3000/api

# Clerk Authentication (required)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Getting Started

### 1. Database Setup

1. Create a PostgreSQL database
2. Run the migration scripts in order:

```bash
cd backend

# Run migrations using psql or your database client
psql -U your_user -d your_database -f migrations/populate_inventory.sql
psql -U your_user -d your_database -f migrations/populate_menuitems.sql
psql -U your_user -d your_database -f migrations/populate_menuitemingredients.sql
psql -U your_user -d your_database -f migrations/create_users_table.sql
psql -U your_user -d your_database -f migrations/add_size_to_orderitems.sql
psql -U your_user -d your_database -f migrations/add_toppings_to_orderitems.sql
```

Or use the Node.js scripts:

```bash
# Create users table
node scripts/create_users_table.js

# Add size column to orderitems
node scripts/add_size_column.js

# Add toppings column to orderitems
node scripts/add_toppings_column.js
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your database credentials
# (See Environment Variables section above)

# Start the server
npm start
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with your Clerk keys
# (See Environment Variables section above)

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

### Manager View
- **Inventory Management**: View, add, and update raw ingredient inventory
- **Menu Management**: CRUD operations for menu items and ingredients
- **Employee Management**: Add, update, and delete employees
- **Analytics & Reports**:
  - Product usage charts (last 30 days)
  - Sales reports by date range
  - X-Report (hourly sales for current day)
  - Z-Report (end-of-day report)
  - Sales by item reports

### Cashier View
- Order creation and management
- Order item completion tracking
- Real-time inventory updates

### Customer View
- Menu browsing
- Order placement
- Kiosk interface

### Menu Board
- Public display view for customers

## API Endpoints

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add new menu item
- `PUT /api/menu/:id` - Update menu item
- `PUT /api/menu/:id/price` - Update menu item price
- `DELETE /api/menu/:id` - Delete menu item
- `GET /api/menu/:id/ingredients` - Get menu item ingredients
- `POST /api/menu/:id/ingredients` - Add ingredient to menu item
- `PUT /api/menu/:id/ingredients/:ingredientId` - Update ingredient quantity
- `DELETE /api/menu/:id/ingredients/:ingredientId` - Remove ingredient from menu item

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new inventory item
- `PUT /api/inventory/:id/quantity` - Update inventory quantity

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId/items` - Get order items
- `PATCH /api/orders/items/:orderItemId/complete` - Mark order item as complete
- `PATCH /api/orders/:id/status` - Update order status

### Analytics
- `GET /api/analytics/product-usage` - Get product usage data (last 30 days)
- `GET /api/analytics/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get total sales for date range
- `GET /api/analytics/product-usage-chart?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get inventory usage chart
- `GET /api/analytics/x-report` - Get X-Report (current day hourly sales)
- `GET /api/analytics/z-report/last-run` - Get last Z-Report run date
- `POST /api/analytics/z-report` - Generate Z-Report (end of day)
- `GET /api/analytics/sales-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get sales report by item

## Database Schema

### Main Tables
- `menuitems` - Menu items (drinks) with category and price
- `inventory` - Raw ingredients with quantities
- `menuitemingredients` - Menu item to ingredient mappings
- `employees` - Employee information
- `orders` - Order records with timestamps
- `orderitems` - Individual items in orders (with size and toppings)
- `users` - User accounts for authentication
- `z_report_log` - Z-Report execution log

## Development

### Backend
- Server runs on port 3000 (configurable via `PORT` env variable)
- Uses connection pooling for database connections
- CORS enabled for frontend communication
- All queries use parameterized statements to prevent SQL injection

### Frontend
- Development server runs on port 5173
- Hot module replacement enabled
- TypeScript for type safety
- Tailwind CSS for styling

### Key Features
- **Inventory Validation**: Orders validate inventory availability before creation
- **Automatic Inventory Updates**: Inventory is decremented when order items are marked as complete
- **Transaction Safety**: Order creation uses database transactions for data integrity
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

1. **Backend**: Uses serverless functions (configured in `vercel.json`)
2. **Frontend**: Builds to static assets
3. **Environment Variables**: Configure in Vercel dashboard:
   - All backend environment variables
   - Frontend environment variables (prefixed with `VITE_`)

### Build Commands

**Backend**: No build step required (runs as serverless functions)

**Frontend**:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Notes

- Authentication is handled via Clerk (frontend integration)
- Inventory is automatically updated when order items are marked as complete
- All database operations use parameterized queries to prevent SQL injection
- The system supports both real database connections and mock data mode (for development)
- CORS is configured to allow requests from the frontend URL specified in `FRONTEND_URL`

## Troubleshooting

### Database Connection Issues
- Verify all database environment variables are set correctly
- Check that PostgreSQL is running and accessible
- Ensure SSL configuration matches your database provider (required for cloud databases)

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that CORS middleware is properly configured

### Port Conflicts
- Change `PORT` in backend `.env` if port 3000 is in use
- Update `VITE_API_BASE_URL` in frontend `.env` to match


## Contributors

Harrison Ko
Thomas Docog
Nitin Achuta
Aryan Gandhi
Theresa Tran
