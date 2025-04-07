const express = require('express');
const User = require('../models/user');

const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    

    const userId = await User.create({ name, email, password });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    

    const isPasswordValid = await User.verifyPassword(password, user.password);
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


router.post('/forget-password', async (req, res) => {
  try {
    const { email } = req.body;
    

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    

    res.status(200).json({ 
      message: 'Email verified successfully',
      emailVerified: true
    });
  } catch (error) {
    console.error('Forget password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;
    

    if (!email || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    

    const updated = await User.updatePassword(email, newPassword);
    
    if (updated) {
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