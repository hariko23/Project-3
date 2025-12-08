/**
 * Database Seeding Scripts
 * 
 * This directory contains scripts to populate your Boba POS database with sample data
 * for development, testing, and production environments.
 */

## Available Scripts

### 1. Basic Seeding (`seed.js`)
Main seeding script with core functionality:

```bash
# Seed all data (employees + sample orders)
node seeders/seed.js

# Seed only employees
node seeders/seed.js employees

# Seed only orders
node seeders/seed.js orders

# Clear all data
node seeders/seed.js clear
```

**What it seeds:**
- 5 employees (manager, cashiers, barista, admin)
- 5 sample orders with realistic data
- Mix of completed and pending orders

### 2. Development Data (`development.js`)
Realistic data for development environment:

```bash
# Seed development data
node seeders/development.js
```

**What it seeds:**
- 70-175 orders over the past week
- Popular drink combinations
- Realistic order timing (9 AM - 9 PM)
- Varied order sizes (1-4 items)
- 90% completion rate
- Test customer data (prepared for future use)

### 3. Production Data (`production.js`)
Safe minimal data for production:

```bash
# Seed production essentials
node seeders/production.js

# Seed only admin user
node seeders/production.js admin

# Seed only essential employees
node seeders/production.js employees

# Verify existing data
node seeders/production.js verify

# Create data backup info
node seeders/production.js backup
```

**What it seeds:**
- Essential admin user
- Basic manager and cashier accounts
- Verification of menu and inventory data
- Security warnings for password changes

## Usage Examples

### For Development:
```bash
# First time setup
node seeders/seed.js

# Add realistic data for testing
node seeders/development.js
```

### For Production:
```bash
# Create minimal production accounts
node seeders/production.js

# Verify all systems ready
node seeders/production.js verify
```

### For Testing:
```bash
# Clear and reseed between tests
node seeders/seed.js clear
node seeders/seed.js
```

## Prerequisites

Before running seeders, ensure:

1. **Database is set up** and accessible
2. **Tables are created** (run migrations first):
   ```bash
   psql -d your_database -f migrations/populate_menuitems.sql
   psql -d your_database -f migrations/populate_inventory.sql
   psql -d your_database -f migrations/create_users_table.sql
   ```

3. **Environment variables** are configured in `.env`

## Data Generated

### Employees:
- **Admin**: Full system access
- **Manager**: Order management, analytics, inventory
- **Cashiers**: Order creation and management  
- **Barista**: Order fulfillment

### Sample Orders:
- **Time Range**: Past week to current time
- **Order Sizes**: 1-4 items per order
- **Popular Combos**: Realistic drink + topping combinations
- **Completion Status**: Mix of completed and pending
- **Employee Assignment**: Random cashier/barista assignment

### Security Notes:
- **Default passwords** are set for development only
- **Production seeding** includes security warnings
- **Always change default passwords** in production
- **Review user permissions** before deploying

## Troubleshooting

### Common Issues:

1. **Database connection errors**: Check `.env` configuration
2. **Table not found**: Run migrations first
3. **Permission denied**: Verify database user permissions
4. **Duplicate key errors**: Clear existing data first

### Getting Help:

```bash
# Check database connection
node -e "require('./config/database').query('SELECT NOW()')"

# Verify table structure
node seeders/production.js verify
```