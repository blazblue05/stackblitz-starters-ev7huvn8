const express = require('express');
const router = express.Router();
const { pool } = require('../db/db');
const hashPassword = async (password) => {
    const argon2 = require('argon2');
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 2
    });
};

// Inventory page
router.get('/', async (req, res) => {
    console.log('Handling request for inventory page');
    try {
        const result = await pool.query('SELECT id, name, quantity, price, password FROM items');
        const items = result.rows.map(item => {
            if (item.password) {
                item.password = '****';
            }
            return item;
        });
        console.log('Rendering inventory page with items:', items.length);
        res.render('index', { items });
    } catch (err) {
        console.error('Error listing items:', err);
        res.status(500).send('Error listing items: ' + err.message);
    }
});

// Add item
router.post('/add', async (req, res) => {
    const { name, quantity, price, password } = req.body;

    if (!name) {
        return res.status(400).send('Item name cannot be empty');
    }
    const qty = parseInt(quantity);
    const prc = parseFloat(price);
    if (qty < 0) {
        return res.status(400).send('Quantity cannot be negative');
    }
    if (prc < 0) {
        return res.status(400).send('Price cannot be negative');
    }

    try {
        const hashedPassword = password ? await hashPassword(password) : null;
        await pool.query(
            'INSERT INTO items (name, quantity, price, password) VALUES ($1, $2, $3, $4)',
            [name, qty, prc, hashedPassword]
        );
        res.redirect('/');
    } catch (err) {
        res.status(400).send('Error adding item: ' + err.message);
    }
});

// Update item form page
router.get('/update/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).send('Item not found');
        }
        const item = result.rows[0];
        if (item.password) {
            item.password = '****';
        }
        res.render('update', { item });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Update item
router.post('/update/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, quantity, price, password } = req.body;

    if (!name) {
        return res.status(400).send('Item name cannot be empty');
    }
    const qty = parseInt(quantity);
    const prc = parseFloat(price);
    if (qty < 0) {
        return res.status(400).send('Quantity cannot be negative');
    }
    if (prc < 0) {
        return res.status(400).send('Price cannot be negative');
    }

    try {
        const hashedPassword = password ? await hashPassword(password) : null;
        const result = await pool.query(
            'UPDATE items SET name = $1, quantity = $2, price = $3, password = $4 WHERE id = $5',
            [name, qty, prc, hashedPassword, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Item not found');
        }
        res.redirect('/');
    } catch (err) {
        res.status(400).send('Error updating item: ' + err.message);
    }
});

// Delete item
router.post('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM items WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Item not found');
        }
        res.redirect('/');
    } catch (err) {
        res.status(400).send('Error deleting item: ' + err.message);
    }
});

module.exports = router;