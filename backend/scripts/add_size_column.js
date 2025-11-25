
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.PSQL_HOST,
    user: process.env.PSQL_USER,
    password: process.env.PSQL_PASSWORD,
    database: process.env.PSQL_DATABASE,
    port: process.env.PSQL_PORT || 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        
        console.log('Reading migration file...');
        const migrationPath = path.join(__dirname, '..', 'migrations', 'add_size_to_orderitems.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration...');
        await client.query(migrationSQL);
        
        console.log('✓ Migration completed successfully!');
        console.log('Size column has been added to orderitems table.');
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
