require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addToppingsColumn() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '..', 'migrations', 'add_toppings_to_orderitems.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Adding toppings column to orderitems table...');
    await client.query(sql);
    console.log('Successfully added toppings column!');
  } catch (error) {
    console.error('Error adding toppings column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addToppingsColumn();
