const sql = require('mssql');
require('dotenv').config();

// Initialize SQL Server connection configuration
const dbConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    port: parseInt(process.env.SQL_PORT, 10),
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false // Set to true if you want to bypass certificate validation (not recommended for production)
    },
    connectionTimeout: 30000 // 30 seconds
};

// Initialize SQL Server connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

// Initialize database tables
async function initializeDatabase() {
    try {
        const pool = await poolPromise;

        // Create items table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'items')
            CREATE TABLE items (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                quantity INT NOT NULL CHECK (quantity >= 0),
                price FLOAT NOT NULL CHECK (price >= 0),
                password NVARCHAR(255)
            )
        `);
        console.log('Items table created or already exists');

        // Create users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
            CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(255) NOT NULL UNIQUE,
                password NVARCHAR(255) NOT NULL
            )
        `);
        console.log('Users table created or already exists');
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

module.exports = { poolPromise, initializeDatabase };
