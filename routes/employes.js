const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone 
      FROM employes
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone 
      FROM employes 
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new employee
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, genre, date_naissance, email, adresse, telephone } = req.body;
    
    // Validate required fields
    if (!nom || !prenom || !genre || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate genre
    if (!['homme', 'femme'].includes(genre)) {
      return res.status(400).json({ message: 'Invalid genre' });
    }

    // Check if email already exists
    const [existingEmail] = await pool.query('SELECT id FROM employes WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO employes (nom, prenom, genre, date_naissance, email, adresse, telephone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, genre, date_naissance, email, adresse, telephone]
    );

    res.status(201).json({ 
      message: 'Employee created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { nom, prenom, genre, date_naissance, email, adresse, telephone } = req.body;
    const employeeId = req.params.id;

    // Check if employee exists
    const [existing] = await pool.query('SELECT id FROM employes WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate genre if provided
    if (genre && !['homme', 'femme'].includes(genre)) {
      return res.status(400).json({ message: 'Invalid genre' });
    }

    // Check if email already exists (excluding current employee)
    if (email) {
      const [existingEmail] = await pool.query(
        'SELECT id FROM employes WHERE email = ? AND id != ?', 
        [email, employeeId]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    await pool.query(
      `UPDATE employes 
       SET nom = COALESCE(?, nom), 
           prenom = COALESCE(?, prenom), 
           genre = COALESCE(?, genre), 
           date_naissance = COALESCE(?, date_naissance), 
           email = COALESCE(?, email), 
           adresse = COALESCE(?, adresse), 
           telephone = COALESCE(?, telephone) 
       WHERE id = ?`,
      [nom, prenom, genre, date_naissance, email, adresse, telephone, employeeId]
    );

    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Check if employee exists
    const [existing] = await pool.query('SELECT id FROM employes WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await pool.query('DELETE FROM employes WHERE id = ?', [employeeId]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 