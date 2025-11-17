const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Script to create the users table in the database
 * Run this with: node scripts/create_users_table.js
 */

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

async function createUsersTable() {
    try {
        console.log('Connecting to database...');
        console.log(`Host: ${process.env.PSQL_HOST}`);
        console.log(`Database: ${process.env.PSQL_DATABASE}`);
        console.log(`User: ${process.env.PSQL_USER}`);
        
        // Read the SQL migration file
        const sqlPath = path.join(__dirname, '../migrations/create_users_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('\nExecuting migration...');
        await pool.query(sql);
        
        console.log('✅ Users table created successfully!');
        
        // Verify the table was created
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Verified: users table exists');
        } else {
            console.log('⚠️  Warning: Could not verify table creation');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating users table:', error.message);
        console.error('Error code:', error.code);
        if (error.code === '42P01') {
            console.error('\nThis might mean the database connection failed.');
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createUsersTable();

