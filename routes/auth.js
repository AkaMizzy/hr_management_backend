const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Register user
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
  
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    // Check if email already exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = req.file ? req.file.filename : null;
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, profile_image) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, profileImage]
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forget password - verify email
router.post('/forget-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if email exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Email is valid
    res.status(200).json({ 
      message: 'Email verified successfully',
      emailVerified: true
    });
  } catch (error) {
    console.error('Forget password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password after email verification
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;
    
    // Validate input
    if (!email || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    // Check if email exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Password has been reset successfully' });
    } else {
      res.status(400).json({ message: 'Failed to reset password' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 