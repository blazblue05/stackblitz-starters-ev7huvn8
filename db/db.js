const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // For Supabase, may need adjustment based on SSL requirements
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity >= 0),
                price DOUBLE PRECISION NOT NULL CHECK (price >= 0),
                password TEXT
            )
        `);
        console.log('Items table created or already exists');

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        `);
        console.log('Users table created or already exists');
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

module.exports = { pool, initializeDatabase };