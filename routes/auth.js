const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const { pool } = require('../db/db');

// Hash password using Argon2id
async function hashPassword(password) {
    try {
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 64 * 1024, // 64 MB
            timeCost: 3,
            parallelism: 2
        });
    } catch (err) {
        throw new Error('Failed to hash password: ' + err.message);
    }
}

// Verify password against stored hash
async function verifyPassword(password, hash) {
    try {
        return await argon2.verify(hash, password);
    } catch (err) {
        console.error('Error verifying password:', err);
        return false;
    }
}

// Login page
router.get('/login', (req, res) => {
    if (req.session.user_id) {
        console.log('User already logged in, redirecting to /');
        return res.redirect('/');
    }
    res.render('login', { error: req.query.error, success: req.query.success });
});

// Handle login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT password FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            console.log('User not found:', username);
            return res.redirect('/login?error=Invalid+username+or+password');
        }

        const storedHash = result.rows[0].password;
        const authenticated = await verifyPassword(password, storedHash);
        if (!authenticated) {
            console.log('Invalid credentials for user:', username);
            return res.redirect('/login?error=Invalid+username+or+password');
        }

        // Set session
        req.session.user_id = username;
        console.log('Setting session user_id to:', username);
        console.log(`User ${username} logged in successfully, redirecting to /`);
        res.redirect('/');
    } catch (err) {
        console.error('Authentication error:', err);
        res.redirect('/login?error=Internal+server+error');
    }
});

// Sign-up page
router.get('/signup', (req, res) => {
    if (req.session.user_id) {
        console.log('User already logged in, redirecting to /');
        return res.redirect('/');
    }
    res.render('signup', { error: req.query.error });
});

// Handle sign-up
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username) {
        return res.redirect('/signup?error=Username+cannot+be+empty');
    }
    if (password.length < 8) {
        return res.redirect('/signup?error=Password+must+be+at+least+8+characters+long');
    }

    try {
        const hashedPassword = await hashPassword(password);
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        console.log(`User ${username} signed up successfully`);
        res.redirect('/login?success=Account+created+successfully.+Please+log+in.');
    } catch (err) {
        if (err.message.includes('unique constraint')) {
            res.redirect(`/signup?error=Username+'${username}'+is+already+taken`);
        } else {
            console.error('Sign-up error:', err);
            res.redirect('/signup?error=Internal+server+error');
        }
    }
});

// Logout
router.get('/logout', (req, res) => {
    console.log('Logging out user:', req.session.user_id);
    req.session.destroy((err) => {
        if (err) {
            console.error('Failed to destroy session:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;