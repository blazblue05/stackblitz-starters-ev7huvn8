const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import database and initialize
const { pool, initializeDatabase } = require('./db/db');

// Import routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');

// Initialize Express app
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    name: 'mysession',
    secret: process.env.SESSION_SECRET || 'secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware to log session data for debugging
app.use((req, res, next) => {
    console.log('Session data:', req.session);
    next();
});

// Middleware to require login for protected routes
function requireLogin(req, res, next) {
    console.log('Checking session for user_id:', req.session.user_id);
    if (!req.session.user_id) {
        console.log('User not logged in, redirecting to /login');
        return res.redirect('/login');
    }
    console.log(`User ${req.session.user_id} is authenticated, proceeding to ${req.url}`);
    next();
}

// Routes
app.use('/', authRoutes);
app.use('/', requireLogin, inventoryRoutes);

// Test session route
app.get('/test-session', (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).send('No user_id in session');
    }
    res.send(`User ID: ${req.session.user_id}`);
});

// Start the server
const port = process.env.PORT || 8080;
(async () => {
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
})();