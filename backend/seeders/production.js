/**
 * Production data seeder
 * Safely adds minimal essential data for production environment
 */

const pool = require('../config/database');

/**
 * Seed essential admin user for production
 */
const seedProductionAdmin = async () => {
  console.log('Seeding production admin user...');
  
  // Check if admin already exists
  const existingAdmin = await pool.query(
    'SELECT userid FROM users WHERE role = $1 LIMIT 1',
    ['admin']
  );
  
  if (existingAdmin.rows.length > 0) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Create admin user
  await pool.query(
    'INSERT INTO users (username, email, role, password) VALUES ($1, $2, $3, $4)',
    ['admin', 'admin@company.com', 'admin', 'CHANGE_THIS_PASSWORD_IMMEDIATELY']
  );
  
  console.log('WARNING: Admin user created with default password');
  console.log('IMPORTANT: Change the admin password immediately!');
};

/**
 * Seed essential employee roles for production
 */
const seedEssentialEmployees = async () => {
  console.log('Seeding essential employee accounts...');
  
  const essentialEmployees = [
    { username: 'manager', email: 'manager@company.com', role: 'manager' },
    { username: 'cashier', email: 'cashier@company.com', role: 'cashier' }
  ];

  for (const emp of essentialEmployees) {
    // Check if employee already exists
    const existing = await pool.query(
      'SELECT userid FROM users WHERE username = $1',
      [emp.username]
    );
    
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, email, role, password) VALUES ($1, $2, $3, $4)',
        [emp.username, emp.email, emp.role, 'CHANGE_THIS_PASSWORD']
      );
      console.log(`Created ${emp.role}: ${emp.username}`);
    } else {
      console.log(`${emp.username} already exists, skipping...`);
    }
  }
  
  console.log('IMPORTANT: Change all default passwords!');
};

/**
 * Verify menu items and inventory exist
 */
const verifyEssentialData = async () => {
  console.log('Verifying essential data...');
  
  // Check menu items
  const menuCount = await pool.query('SELECT COUNT(*) FROM menuitems');
  console.log(`Menu items: ${menuCount.rows[0].count}`);
  
  // Check inventory
  const inventoryCount = await pool.query('SELECT COUNT(*) FROM inventory');
  console.log(`Inventory items: ${inventoryCount.rows[0].count}`);
  
  // Check menu item ingredients mapping
  const ingredientsCount = await pool.query('SELECT COUNT(*) FROM menuitemingredients');
  console.log(`Menu-ingredient mappings: ${ingredientsCount.rows[0].count}`);
  
  if (parseInt(menuCount.rows[0].count) === 0) {
    console.log('WARNING: No menu items found. Run menu migrations first!');
  }
  
  if (parseInt(inventoryCount.rows[0].count) === 0) {
    console.log('WARNING: No inventory items found. Run inventory migrations first!');
  }
};

/**
 * Main production seeding function
 */
const seedProduction = async () => {
  try {
    console.log('Starting production data seeding...');
    console.log('Production mode: Only essential data will be seeded');
    
    await seedProductionAdmin();
    await seedEssentialEmployees();
    await verifyEssentialData();
    
    console.log('Production seeding completed!');
    console.log('Security reminders:');
    console.log('1. Change all default passwords immediately');
    console.log('2. Update email addresses to real company emails');
    console.log('3. Set up proper authentication system');
    console.log('4. Review user permissions');
    
  } catch (error) {
    console.error('Error seeding production data:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

/**
 * Create backup of current data before production seeding
 */
const createDataBackup = async () => {
  console.log('Creating data backup...');
  
  try {
    // Get current data counts
    const tables = ['users', 'orders', 'orderitems'];
    const backup = {};
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      backup[table] = result.rows[0].count;
    }
    
    console.log('Current data backup:', backup);
    
    // In a real production environment, you would export this data
    console.log('In production, export this data before seeding:');
    console.log('pg_dump -h localhost -U username -d database_name > backup.sql');
    
    return backup;
  } catch (error) {
    console.log('Could not create backup (tables might not exist yet)');
    return null;
  }
};

// Command line interface
const command = process.argv[2];

if (command === 'backup') {
  createDataBackup().then(() => pool.end());
} else if (command === 'admin') {
  seedProductionAdmin().then(() => pool.end());
} else if (command === 'employees') {
  seedEssentialEmployees().then(() => pool.end());
} else if (command === 'verify') {
  verifyEssentialData().then(() => pool.end());
} else {
  seedProduction();
}

module.exports = {
  seedProduction,
  seedProductionAdmin,
  seedEssentialEmployees,
  verifyEssentialData,
  createDataBackup
};