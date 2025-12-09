const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Migration Runner Script
 * Executes SQL migration files using the app's database configuration
 * Usage: node scripts/run_migration.js <migration-filename>
 */

async function runMigration() {
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
        console.error('❌ Please provide a migration file name');
        console.error('Usage: node scripts/run_migration.js <migration-filename>');
        process.exit(1);
    }

    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    
    try {
        // Check if migration file exists
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found: ${migrationPath}`);
            process.exit(1);
        }

        // Read migration SQL
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📦 Running migration: ${migrationFile}`);
        console.log(`📄 SQL content:\n${migrationSQL}\n`);

        // Execute migration
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(migrationSQL);
            await client.query('COMMIT');
            console.log('✅ Migration completed successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();