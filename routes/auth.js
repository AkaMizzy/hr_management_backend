const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');


const router = express.Router();

// Register user
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, confirmPassword, role } = req.body;
  
//     // Validate input
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
    
//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match' });
//     }
    
//     // Check if email already exists
//     const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
//     const existingUser = rows[0];
    
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already exists' });
//     }
    
//     // Create user with role if provided (default to 'employe')
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userRole = role || 'employe';

//     // Validate role is one of the allowed values
//     const allowedRoles = ['employe', 'manager', 'responsable_rh'];
//     if (!allowedRoles.includes(userRole)) {
//       return res.status(400).json({ message: 'Invalid role specified' });
//     }

//     const [result] = await pool.query(
//       'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
//       [name, email, hashedPassword, userRole]
//     );
    
//     res.status(201).json({ 
//       message: 'User registered successfully',
//       userId: result.insertId,
//       role: userRole
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user with role and employe_id
    const [rows] = await pool.query(
      'SELECT users.id, users.name, users.email, users.password, users.role, users.employe_id FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If user is an employee, get additional employee info
    let employeInfo = null;
    if (user.role === 'employe' && user.employe_id) {
      const [employeRows] = await pool.query(
        'SELECT id, nom, prenom, manager_id FROM employes WHERE id = ?',
        [user.employe_id]
      );
      employeInfo = employeRows[0];
    }
    // If user is a manager, get their manager ID
    else if (user.role === 'manager' && user.employe_id) {
      const [managerRows] = await pool.query(
        'SELECT id FROM employes WHERE id = ?',
        [user.employe_id]
      );
      if (managerRows.length > 0) {
        employeInfo = { id: managerRows[0].id };
      }
    }
    
    // Return user data including role and employe_id
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employe_id: user.employe_id,
        employe_info: employeInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user account (for Responsable RH)
// This route has been moved to the users.js route

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

// Google Login
router.post('/auth/google/login', async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    // Validate input
    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    // Check if user exists
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [email, googleId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Register
router.post('/auth/google/register', async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    // Validate input
    if (!email || !name || !googleId) {
      return res.status(400).json({ message: 'Email, name and Google ID are required' });
    }

    // Check if user already exists
    const [existingRows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [email, googleId]
    );
    
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, google_id, picture, auth_provider) VALUES (?, ?, ?, ?, ?)',
      [name, email, googleId, picture, 'google']
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        picture
      }
    });
  } catch (error) {
    console.error('Google registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Routes de callback Google
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  // Échangez le code contre un token d'accès
  // Récupérez les informations de l'utilisateur
  // Créez ou mettez à jour l'utilisateur dans votre base de données
  // Générez un JWT et renvoyez-le
});

router.get('/auth/google/register/callback', async (req, res) => {
  // Similaire au callback de connexion, mais pour l'inscription
});

// Routes de callback Facebook
router.get('/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  // Échangez le code contre un token d'accès
  // Récupérez les informations de l'utilisateur
  // Créez ou mettez à jour l'utilisateur dans votre base de données
  // Générez un JWT et renvoyez-le
});

router.get('/auth/facebook/register/callback', async (req, res) => {
  // Similaire au callback de connexion, mais pour l'inscription
});

module.exports = router; 