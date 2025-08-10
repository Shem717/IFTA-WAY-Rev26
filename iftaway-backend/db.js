
const useInMem = process.env.USE_INMEM_DB === 'true';

let pool;

if (useInMem) {
    // Use pg-mem for an in-memory Postgres compatible database in local/dev
    const { newDb } = require('pg-mem');
    const mem = newDb({ autoCreateForeignKeyIndices: true });
    const pg = mem.adapters.createPg();
    const { Pool: MemPool } = pg;
    pool = new MemPool();
} else {
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
}

const initDb = async () => {
    try {
        // Create users table with a minimal structure if it doesn't exist.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Safely drop the obsolete 'password' column if it exists from a previous schema version.
        await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS password;');
        
        // Add the correct 'password_hash' column if it doesn't already exist.
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS trucks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                number VARCHAR(50) NOT NULL,
                make_model VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS fuel_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                truck_number VARCHAR(50) NOT NULL,
                date_time TIMESTAMP NOT NULL,
                odometer NUMERIC NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(10) NOT NULL,
                fuel_type VARCHAR(50) NOT NULL,
                custom_fuel_type VARCHAR(100),
                amount NUMERIC NOT NULL,
                cost NUMERIC NOT NULL,
                receipt_url TEXT,
                is_ignored BOOLEAN DEFAULT FALSE,
                is_demo BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database tables checked/created successfully." + (useInMem ? ' (in-memory)' : ''));
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initDb,
};
