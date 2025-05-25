const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL pool with explicit parameters
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '90464978aS$',
    host: process.env.DB_HOST || 'gen-lang-client-0885110548:us-central1:prod',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'prod',
    ssl: { rejectUnauthorized: false } // For Cloud SQL, may need adjustment
});

// Test connection and initialize database tables
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');

        // Create items table
        await client.query(`
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
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        `);
        console.log('Users table created or already exists');

        client.release();
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

module.exports = { pool, initializeDatabase };
