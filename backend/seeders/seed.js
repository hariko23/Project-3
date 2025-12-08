/**
 * Database seeding script
 * Populates the database with initial data for development and testing
 * Run with: node seeders/seed.js
 */

const pool = require('../config/database');

/**
 * Seed employees/users table
 */
const seedEmployees = async () => {
  console.log('Seeding employees...');
  
  const employees = [
    { id: 1, username: 'manager1', email: 'manager@bobashop.com', role: 'manager', password: 'hashed_password_1' },
    { id: 2, username: 'cashier1', email: 'cashier1@bobashop.com', role: 'cashier', password: 'hashed_password_2' },
    { id: 3, username: 'cashier2', email: 'cashier2@bobashop.com', role: 'cashier', password: 'hashed_password_3' },
    { id: 4, username: 'barista1', email: 'barista1@bobashop.com', role: 'barista', password: 'hashed_password_4' },
    { id: 5, username: 'admin', email: 'admin@bobashop.com', role: 'admin', password: 'hashed_password_5' }
  ];

  // Clear existing data
  await pool.query('DELETE FROM users');
  await pool.query('ALTER SEQUENCE users_userid_seq RESTART WITH 1');

  // Insert employees
  for (const emp of employees) {
    await pool.query(
      'INSERT INTO users (userid, username, email, role, password) VALUES ($1, $2, $3, $4, $5)',
      [emp.id, emp.username, emp.email, emp.role, emp.password]
    );
  }

  console.log(`Seeded ${employees.length} employees`);
};

/**
 * Seed sample orders for development/testing
 */
const seedOrders = async () => {
  console.log('Seeding sample orders...');
  
  // Clear existing orders
  await pool.query('DELETE FROM orderitems');
  await pool.query('DELETE FROM orders');
  await pool.query('ALTER SEQUENCE orders_orderid_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE orderitems_orderitemid_seq RESTART WITH 1');

  // Sample orders
  const sampleOrders = [
    {
      timeoforder: new Date(Date.now() - 86400000), // 1 day ago
      employeeid: 2,
      totalcost: 12.50,
      orderweek: getCurrentWeek(),
      items: [
        { menuitemid: 1, quantity: 1, size: 'Medium', price: 5.50, toppings: 'boba' },
        { menuitemid: 17, quantity: 1, size: 'Large', price: 7.00, toppings: 'lycheejelly,boba' }
      ]
    },
    {
      timeoforder: new Date(Date.now() - 43200000), // 12 hours ago
      employeeid: 3,
      totalcost: 18.75,
      orderweek: getCurrentWeek(),
      items: [
        { menuitemid: 2, quantity: 2, size: 'Medium', price: 6.00, toppings: 'pudding' },
        { menuitemid: 25, quantity: 1, size: 'Large', price: 6.75, toppings: '' }
      ]
    },
    {
      timeoforder: new Date(Date.now() - 21600000), // 6 hours ago
      employeeid: 2,
      totalcost: 24.25,
      orderweek: getCurrentWeek(),
      items: [
        { menuitemid: 10, quantity: 1, size: 'Large', price: 6.25, toppings: 'aloevera' },
        { menuitemid: 19, quantity: 2, size: 'Medium', price: 6.50, toppings: 'crystalboba' },
        { menuitemid: 27, quantity: 1, size: 'Medium', price: 6.50, toppings: 'boba,redbean' }
      ]
    },
    {
      timeoforder: new Date(Date.now() - 7200000), // 2 hours ago
      employeeid: 4,
      totalcost: 11.50,
      orderweek: getCurrentWeek(),
      items: [
        { menuitemid: 9, quantity: 1, size: 'Medium', price: 5.00, toppings: '' },
        { menuitemid: 6, quantity: 1, size: 'Medium', price: 6.50, toppings: 'taroballs' }
      ]
    },
    {
      timeoforder: new Date(), // Current time
      employeeid: 2,
      totalcost: 15.75,
      orderweek: getCurrentWeek(),
      items: [
        { menuitemid: 3, quantity: 1, size: 'Large', price: 6.44, toppings: 'boba,coconutjelly' },
        { menuitemid: 22, quantity: 1, size: 'Medium', price: 6.25, toppings: 'mangostars' },
        { menuitemid: 30, quantity: 1, size: 'Small', price: 4.04, toppings: '' }
      ]
    }
  ];

  // Insert orders and order items
  for (let i = 0; i < sampleOrders.length; i++) {
    const order = sampleOrders[i];
    
    // Insert order
    const orderResult = await pool.query(
      `INSERT INTO orders (timeoforder, customerid, employeeid, totalcost, orderweek, is_complete) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING orderid`,
      [order.timeoforder, null, order.employeeid, order.totalcost, order.orderweek, Math.random() > 0.3]
    );
    
    const orderId = orderResult.rows[0].orderid;

    // Insert order items
    for (const item of order.items) {
      await pool.query(
        `INSERT INTO orderitems (orderid, menuitemid, quantity, is_complete, size, price, toppings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.menuitemid, item.quantity, Math.random() > 0.4, item.size, item.price, item.toppings]
      );
    }
  }

  console.log(`Seeded ${sampleOrders.length} sample orders`);
};

/**
 * Get current week number
 */
function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * Seed all tables
 */
const seedAll = async () => {
  try {
    console.log('Starting database seeding...');
    
    await seedEmployees();
    await seedOrders();
    
    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log('- 5 employees (1 manager, 2 cashiers, 1 barista, 1 admin)');
    console.log('- 5 sample orders with multiple items');
    console.log('- Orders span across different time periods');
    console.log('- Mix of completed and pending orders');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

/**
 * Clear all data from tables
 */
const clearAll = async () => {
  try {
    console.log('Clearing all data...');
    
    await pool.query('DELETE FROM orderitems');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM users');
    
    // Reset sequences
    await pool.query('ALTER SEQUENCE orders_orderid_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE orderitems_orderitemid_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE users_userid_seq RESTART WITH 1');
    
    console.log('All data cleared successfully!');
    
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Command line interface
const command = process.argv[2];

if (command === 'clear') {
  clearAll();
} else if (command === 'employees') {
  seedEmployees().then(() => pool.end());
} else if (command === 'orders') {
  seedOrders().then(() => pool.end());
} else {
  seedAll();
}

module.exports = {
  seedAll,
  clearAll,
  seedEmployees,
  seedOrders
};