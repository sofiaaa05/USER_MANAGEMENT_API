import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Regular Expression untuk memverifikasi format email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// src/controllers/authController.js (Ganti seluruh isi fungsi register)

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // --- BLOK VALIDASI INPUT ---
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields (username, email, password) are required.' });
        }
        
        // 1. Validasi Format Email
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // 2. Validasi Panjang Password
        if (password.length < 6) { 
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        // --- END VALIDASI ---

        const hashed = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email';
        const { rows } = await pool.query(query, [username, email, hashed]);
        
        res.status(201).json({ message: 'User registered', user: rows[0] });
    } catch (err) {
        // Error handling untuk username atau email yang sudah ada (PostgreSQL code 23505)
        if (err.code === '23505') { 
             return res.status(409).json({ message: 'Username or Email already exists.' });
        }
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

