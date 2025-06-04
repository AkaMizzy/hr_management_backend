const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * @route   GET /api/employe-info/:employeId
 * @desc    Get all custom info fields for a specific employee
 * @access  Private
 */
router.get('/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    // Validate employee ID
    if (!employeId || isNaN(parseInt(employeId))) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }
    
    const query = `
      SELECT * FROM employe_info 
      WHERE employe_id = ?
    `;
    
    const [employeeInfo] = await pool.query(query, [employeId]);
    
    res.json(employeeInfo);
  } catch (error) {
    console.error('Error fetching employee info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/employe-info
 * @desc    Add a new custom info field for an employee
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { employe_id, intitule, type, obligatoire, valeur } = req.body;
    
    // Validate required fields
    if (!employe_id || !intitule || !type || valeur === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (employe_id, intitule, type, and valeur are required)'
      });
    }
    
    // Check if the field already exists for this employee
    const [existingField] = await pool.query(
      'SELECT * FROM employe_info WHERE employe_id = ? AND intitule = ?',
      [employe_id, intitule]
    );
    
    if (existingField.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This field already exists for the employee'
      });
    }
    
    // Insert new field
    const [result] = await pool.query(
      'INSERT INTO employe_info (employe_id, intitule, type, obligatoire, valeur) VALUES (?, ?, ?, ?, ?)',
      [employe_id, intitule, type, obligatoire ? 1 : 0, valeur]
    );
    
    if (result.affectedRows > 0) {
      res.status(201).json({ 
        success: true, 
        message: 'Employee info field added successfully',
        id: result.insertId
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to add employee info field' });
    }
  } catch (error) {
    console.error('Error adding employee info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add employee info field',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/employe-info/:id
 * @desc    Update an existing custom info field
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valeur } = req.body;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    
    // Validate required fields
    if (valeur === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field (valeur is required)'
      });
    }
    
    // Check if record exists
    const [existingRecord] = await pool.query('SELECT * FROM employe_info WHERE id = ?', [id]);
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    
    // Update only the value field
    const [result] = await pool.query(
      'UPDATE employe_info SET valeur = ? WHERE id = ?',
      [valeur, id]
    );
    
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Employee info field updated successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to update employee info field' });
    }
  } catch (error) {
    console.error('Error updating employee info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update employee info field',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/employe-info/:id
 * @desc    Delete a custom info field
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    
    // Check if record exists
    const [existingRecord] = await pool.query('SELECT * FROM employe_info WHERE id = ?', [id]);
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    
    // Delete the record
    const [result] = await pool.query('DELETE FROM employe_info WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Employee info field deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to delete employee info field' });
    }
  } catch (error) {
    console.error('Error deleting employee info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete employee info field',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 