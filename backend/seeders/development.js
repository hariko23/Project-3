/**
 * Development data seeder
 * Adds realistic data for development environment
 */

const pool = require('../config/database');

/**
 * Seed realistic customer data and orders
 */
const seedDevelopmentData = async () => {
  console.log('Seeding development data...');

  // Popular drink combinations for realistic orders
  const popularCombos = [
    { menuitemid: 1, size: 'Medium', toppings: 'boba', price: 6.00 }, // Classic Milk Tea + Boba
    { menuitemid: 2, size: 'Large', toppings: 'pudding', price: 7.25 }, // Taro + Pudding
    { menuitemid: 17, size: 'Medium', toppings: 'lycheejelly', price: 6.50 }, // Mango Slush + Lychee
    { menuitemid: 25, size: 'Medium', toppings: '', price: 4.50 }, // Iced Americano (no toppings)
    { menuitemid: 10, size: 'Large', toppings: 'aloevera,boba', price: 6.75 }, // Mango Green Tea + Aloe + Boba
    { menuitemid: 6, size: 'Medium', toppings: 'taroballs', price: 7.25 }, // Matcha + Taro Balls
    { menuitemid: 19, size: 'Large', toppings: 'crystalboba', price: 7.25 }, // Taro Slush + Crystal Boba
    { menuitemid: 27, size: 'Medium', toppings: 'boba,redbean', price: 7.75 } // Brown Sugar Boba + Red Bean
  ];

  // Generate orders for the past week
  const orders = [];
  const now = new Date();
  
  for (let day = 0; day < 7; day++) {
    const orderDate = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
    const ordersPerDay = Math.floor(Math.random() * 15) + 10; // 10-25 orders per day
    
    for (let i = 0; i < ordersPerDay; i++) {
      // Random time during the day (9 AM - 9 PM)
      const orderTime = new Date(orderDate);
      orderTime.setHours(Math.floor(Math.random() * 12) + 9);
      orderTime.setMinutes(Math.floor(Math.random() * 60));
      
      // Random number of items (1-4)
      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItems = [];
      let totalCost = 0;
      
      for (let j = 0; j < numItems; j++) {
        const combo = popularCombos[Math.floor(Math.random() * popularCombos.length)];
        const quantity = Math.random() > 0.8 ? 2 : 1; // 20% chance of quantity 2
        
        orderItems.push({
          ...combo,
          quantity
        });
        
        totalCost += combo.price * quantity;
      }
      
      orders.push({
        timeoforder: orderTime,
        employeeid: Math.floor(Math.random() * 3) + 2, // cashier1, cashier2, or barista1
        totalcost: Math.round(totalCost * 100) / 100,
        orderweek: getWeekNumber(orderTime),
        items: orderItems,
        isComplete: Math.random() > 0.1 // 90% of orders complete
      });
    }
  }

  // Insert orders
  for (const order of orders) {
    const orderResult = await pool.query(
      `INSERT INTO orders (timeoforder, customerid, employeeid, totalcost, orderweek, is_complete) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING orderid`,
      [order.timeoforder, null, order.employeeid, order.totalcost, order.orderweek, order.isComplete]
    );
    
    const orderId = orderResult.rows[0].orderid;

    // Insert order items
    for (const item of order.items) {
      await pool.query(
        `INSERT INTO orderitems (orderid, menuitemid, quantity, is_complete, size, price, toppings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.menuitemid, item.quantity, order.isComplete, item.size, item.price, item.toppings]
      );
    }
  }

  console.log(`Seeded ${orders.length} development orders for the past week`);
};

/**
 * Seed test customers for future use
 */
const seedTestCustomers = async () => {
  console.log('Seeding test customers...');
  
  // Note: customers table doesn't exist yet, but this prepares for when it does
  const customers = [
    { name: 'John Doe', email: 'john@example.com', phone: '555-0101', loyaltyPoints: 150 },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', loyaltyPoints: 75 },
    { name: 'Mike Johnson', email: 'mike@example.com', phone: '555-0103', loyaltyPoints: 220 },
    { name: 'Sarah Wilson', email: 'sarah@example.com', phone: '555-0104', loyaltyPoints: 50 },
    { name: 'David Brown', email: 'david@example.com', phone: '555-0105', loyaltyPoints: 300 }
  ];
  
  console.log('Test customers prepared (table creation needed):');
  customers.forEach((customer, index) => {
    console.log(`${index + 1}. ${customer.name} - ${customer.loyaltyPoints} points`);
  });
};

/**
 * Get week number of year
 */
function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * Main development seeding function
 */
const seedDevelopment = async () => {
  try {
    console.log('Starting development data seeding...');
    
    await seedDevelopmentData();
    await seedTestCustomers();
    
    console.log('Development seeding completed!');
    console.log('Development data summary:');
    console.log('- Realistic order patterns for past 7 days');
    console.log('- Popular drink combinations');
    console.log('- Varied order times (9 AM - 9 PM)');
    console.log('- Mix of single and multi-item orders');
    console.log('- 90% completion rate');
    
  } catch (error) {
    console.error('Error seeding development data:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  seedDevelopment();
}

module.exports = {
  seedDevelopment,
  seedDevelopmentData,
  seedTestCustomers
};