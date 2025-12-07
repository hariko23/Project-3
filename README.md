# Project-3: Boba POS System

A full-stack Point of Sale system for a boba tea shop.

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS

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

## Getting Started

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- Menu management
- Inventory management
- Employee management
- Order processing
- Analytics and reports

## API Endpoints

- `/api/menu` - Menu items
- `/api/inventory` - Inventory management
- `/api/employees` - Employee management
- `/api/orders` - Order processing
- `/api/analytics` - Reports and analytics

