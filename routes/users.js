const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// Get all users
router.get('/', async (req, res) => {
  try {
    // Check if requester has responsable_rh role
    const { requesterRole } = req.query;
    
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can access user management' });
    }
    
    // Get all users with their employee information
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.employe_id,
             CONCAT(e.prenom, ' ', e.nom) as employe_name
      FROM users u
      LEFT JOIN employes e ON u.employe_id = e.id
      ORDER BY u.name
    `);
    
    // Add calculated active status
    const usersWithStatus = users.map(user => ({
      ...user,
      status: user.role ? 'active' : 'inactive' // If role is null, user is inactive
    }));
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterRole } = req.query;
    
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can access user details' });
    }
    
    // Get user with employee information
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.employe_id,
             CONCAT(e.prenom, ' ', e.nom) as employe_name,
             e.email as employe_email
      FROM users u
      LEFT JOIN employes e ON u.employe_id = e.id
      WHERE u.id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add calculated status
    const user = {
      ...users[0],
      status: users[0].role ? 'active' : 'inactive'
    };
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, employe_id } = req.body;
    const { requesterRole } = req.body; // Role of the user making the request

    // Check if requester has responsable_rh role
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can create user accounts' });
    }
  
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }
    
    // Validate role is one of the allowed values
    const allowedRoles = ['employe', 'manager', 'responsable_rh'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    // Check if email already exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // If employee_id is provided, check if it exists in employes table
    if (employe_id) {
      const [employeeRows] = await pool.query('SELECT id FROM employes WHERE id = ?', [employe_id]);
      if (employeeRows.length === 0) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, employe_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, employe_id || null]
    );
    
    res.status(201).json({ 
      message: 'User account created successfully',
      userId: result.insertId,
      role: role
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an existing user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, employe_id } = req.body;
    const { requesterRole } = req.body;

    // Check if requester has responsable_rh role
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can update user accounts' });
    }

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // If role is provided, validate it's one of the allowed values
    if (role) {
      const allowedRoles = ['employe', 'manager', 'responsable_rh'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
    }

    // Check if user exists
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already exists for another user
    const [emailRows] = await pool.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
    if (emailRows.length > 0) {
      return res.status(400).json({ message: 'Email already exists for another user' });
    }

    // If employee_id is provided, check if it exists in employes table
    if (employe_id) {
      const [employeeRows] = await pool.query('SELECT id FROM employes WHERE id = ?', [employe_id]);
      if (employeeRows.length === 0) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
    }

    // Update user
    await pool.query(
      `UPDATE users 
       SET name = ?, email = ?, role = ?, employe_id = ? 
       WHERE id = ?`,
      [name, email, role, employe_id || null, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user password
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, requesterRole } = req.body;

    // Check if requester has responsable_rh role
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can update user passwords' });
    }

    // Validate input
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Check if user exists
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status (activate/deactivate) - Using role field
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, requesterRole } = req.body;

    // Check if requester has responsable_rh role
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can update user status' });
    }

    // Validate input
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (active/inactive) is required' });
    }

    // Check if user exists
    const [userRows] = await pool.query('SELECT role, name FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];
    
    if (status === 'inactive') {
      // Store the original role in a temporary column or use another method
      // For now, we'll just set role to NULL to disable the account
      await pool.query('UPDATE users SET role = NULL WHERE id = ?', [id]);
      
      res.json({ 
        message: `User ${user.name} deactivated successfully` 
      });
    } else {
      // If we're activating, we need to know the original role - for now, default to 'employe' if unknown
      // A better solution would be to store the original role somewhere
      const defaultRole = 'employe';
      
      await pool.query('UPDATE users SET role = ? WHERE id = ?', 
        [defaultRole, id]);
      
      res.json({ 
        message: `User ${user.name} activated successfully` 
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterRole } = req.query;

    // Check if requester has responsable_rh role
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can delete users' });
    }

    // Check if user exists
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all employees for dropdown
router.get('/employees/list', async (req, res) => {
  try {
    const { requesterRole } = req.query;
    
    if (requesterRole !== 'responsable_rh') {
      return res.status(403).json({ message: 'Unauthorized: Only HR managers can access employee lists' });
    }
    
    // Get all employees who do not already have a user account
    const [employees] = await pool.query(`
      SELECT e.id, e.nom, e.prenom, e.email
      FROM employes e
      LEFT JOIN users u ON e.id = u.employe_id
      WHERE u.id IS NULL OR u.id = ?
      ORDER BY e.nom, e.prenom
    `, [req.query.currentUserId || 0]);
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 