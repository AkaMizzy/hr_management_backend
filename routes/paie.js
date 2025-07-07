const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * RUBRIQUE_PAIE ROUTES
 * These endpoints handle the payroll components (rubriques)
 */

// Get all rubriques
router.get('/rubriques', async (req, res) => {
  try {
    const [rubriques] = await pool.query(
      'SELECT * FROM rubrique_paie ORDER BY `order`'
    );
    res.json(rubriques);
  } catch (error) {
    console.error('Error fetching rubriques:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific rubrique by ID
router.get('/rubriques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rubriques] = await pool.query(
      'SELECT * FROM rubrique_paie WHERE id = ?',
      [id]
    );
    
    if (rubriques.length === 0) {
      return res.status(404).json({ message: 'Rubrique not found' });
    }
    
    res.json(rubriques[0]);
  } catch (error) {
    console.error('Error fetching rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific rubrique by ID with all details
router.get('/rubriques/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const [rubriques] = await pool.query(
      'SELECT * FROM rubrique_paie WHERE id = ?',
      [id]
    );
    
    if (rubriques.length === 0) {
      return res.status(404).json({ message: 'Rubrique not found' });
    }
    
    res.json(rubriques[0]);
  } catch (error) {
    console.error('Error fetching rubrique details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new rubrique
router.post('/rubriques', async (req, res) => {
  try {
    const { 
      code, 
      intitule, 
      f1, 
      f2, 
      f3, 
      f4, 
      f5, 
      visible, 
      order, 
      obligatoire 
    } = req.body;
    
    // Validate required fields
    if (!code || !intitule) {
      return res.status(400).json({ message: 'Code and intitule are required' });
    }
    
    // Insert new rubrique
    const [result] = await pool.query(
      `INSERT INTO rubrique_paie 
       (code, intitule, f1, f2, f3, f4, f5, visible, \`order\`, obligatoire) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, intitule, f1 || null, f2 || null, f3 || null, f4 || null, f5 || null, 
       visible !== undefined ? visible : 1, 
       order || 0, 
       obligatoire !== undefined ? obligatoire : 0]
    );
    
    res.status(201).json({
      message: 'Rubrique created successfully',
      rubrique_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a rubrique
router.put('/rubriques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      intitule, 
      f1, 
      f2, 
      f3, 
      f4, 
      f5, 
      visible, 
      order, 
      obligatoire 
    } = req.body;
    
    // Check if rubrique exists
    const [existingRubriques] = await pool.query(
      'SELECT * FROM rubrique_paie WHERE id = ?',
      [id]
    );
    
    if (existingRubriques.length === 0) {
      return res.status(404).json({ message: 'Rubrique not found' });
    }
    
    // Update rubrique
    await pool.query(
      `UPDATE rubrique_paie 
       SET code = ?, intitule = ?, f1 = ?, f2 = ?, f3 = ?, f4 = ?, f5 = ?, 
           visible = ?, \`order\` = ?, obligatoire = ?
       WHERE id = ?`,
      [
        code || existingRubriques[0].code,
        intitule || existingRubriques[0].intitule,
        f1 !== undefined ? f1 : existingRubriques[0].f1,
        f2 !== undefined ? f2 : existingRubriques[0].f2,
        f3 !== undefined ? f3 : existingRubriques[0].f3,
        f4 !== undefined ? f4 : existingRubriques[0].f4,
        f5 !== undefined ? f5 : existingRubriques[0].f5,
        visible !== undefined ? visible : existingRubriques[0].visible,
        order !== undefined ? order : existingRubriques[0].order,
        obligatoire !== undefined ? obligatoire : existingRubriques[0].obligatoire,
        id
      ]
    );
    
    res.json({ message: 'Rubrique updated successfully' });
  } catch (error) {
    console.error('Error updating rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a rubrique
router.delete('/rubriques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if rubrique is used in employe_rubrique
    const [employeRubriques] = await pool.query(
      'SELECT COUNT(*) as count FROM employe_rubrique WHERE id_rubrique = ?',
      [id]
    );
    
    if (employeRubriques[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete rubrique because it is assigned to employees' 
      });
    }
    
    // Delete rubrique
    const [result] = await pool.query(
      'DELETE FROM rubrique_paie WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rubrique not found' });
    }
    
    res.json({ message: 'Rubrique deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * EMPLOYE_RUBRIQUE ROUTES
 * These endpoints handle the assignment of rubriques to employees
 */

// Get all rubrique assignments for an employee
router.get('/employe-rubriques/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [employeRubriques] = await pool.query(
      `SELECT er.*, rp.code, rp.intitule 
       FROM employe_rubrique er
       JOIN rubrique_paie rp ON er.id_rubrique = rp.id
       WHERE er.id_employe = ?
       ORDER BY rp.order`,
      [employeId]
    );
    
    res.json(employeRubriques);
  } catch (error) {
    console.error('Error fetching employee rubriques:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active rubrique assignments for an employee (valid for current date)
router.get('/employe-rubriques/:employeId/active', async (req, res) => {
  try {
    const { employeId } = req.params;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const [employeRubriques] = await pool.query(
      `SELECT er.*, rp.code, rp.intitule 
       FROM employe_rubrique er
       JOIN rubrique_paie rp ON er.id_rubrique = rp.id
       WHERE er.id_employe = ?
       AND (er.date_debut <= ? OR er.date_debut IS NULL)
       AND (er.date_fin >= ? OR er.date_fin IS NULL)
       ORDER BY rp.order`,
      [employeId, currentDate, currentDate]
    );
    
    res.json(employeRubriques);
  } catch (error) {
    console.error('Error fetching active employee rubriques:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific employee rubrique by ID
router.get('/employe-rubriques/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [employeRubriques] = await pool.query(
      `SELECT er.*, rp.code, rp.intitule 
       FROM employe_rubrique er
       JOIN rubrique_paie rp ON er.id_rubrique = rp.id
       WHERE er.id = ?`,
      [id]
    );
    
    if (employeRubriques.length === 0) {
      return res.status(404).json({ message: 'Employee rubrique not found' });
    }
    
    res.json(employeRubriques[0]);
  } catch (error) {
    console.error('Error fetching employee rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign a rubrique to an employee
router.post('/employe-rubriques', async (req, res) => {
  try {
    const { 
      id_employe, 
      id_rubrique, 
      date_debut, 
      date_fin, 
      f1, 
      f2, 
      f3, 
      f4, 
      f5 
    } = req.body;
    
    // Validate required fields
    if (!id_employe || !id_rubrique) {
      return res.status(400).json({ message: 'Employee ID and rubrique ID are required' });
    }
    
    // Check if employee exists
    const [employees] = await pool.query(
      'SELECT id FROM employes WHERE id = ?',
      [id_employe]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if rubrique exists
    const [rubriques] = await pool.query(
      'SELECT id FROM rubrique_paie WHERE id = ?',
      [id_rubrique]
    );
    
    if (rubriques.length === 0) {
      return res.status(404).json({ message: 'Rubrique not found' });
    }
    
    // Insert new employee rubrique
    // Note: The trigger will automatically copy f1-f5 if the rubrique is obligatoire
    const [result] = await pool.query(
      `INSERT INTO employe_rubrique 
       (id_employe, id_rubrique, date_debut, date_fin, f1, f2, f3, f4, f5) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_employe, 
        id_rubrique, 
        date_debut || null, 
        date_fin || null, 
        f1 || null, 
        f2 || null, 
        f3 || null, 
        f4 || null, 
        f5 || null
      ]
    );
    
    res.status(201).json({
      message: 'Rubrique assigned to employee successfully',
      employe_rubrique_id: result.insertId
    });
  } catch (error) {
    console.error('Error assigning rubrique to employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an employee rubrique assignment
router.put('/employe-rubriques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date_debut, 
      date_fin, 
      f1, 
      f2, 
      f3, 
      f4, 
      f5 
    } = req.body;
    
    // Check if employee rubrique exists
    const [existingEmployeRubriques] = await pool.query(
      'SELECT * FROM employe_rubrique WHERE id = ?',
      [id]
    );
    
    if (existingEmployeRubriques.length === 0) {
      return res.status(404).json({ message: 'Employee rubrique not found' });
    }
    
    // Update employee rubrique
    await pool.query(
      `UPDATE employe_rubrique 
       SET date_debut = ?, date_fin = ?, f1 = ?, f2 = ?, f3 = ?, f4 = ?, f5 = ?
       WHERE id = ?`,
      [
        date_debut !== undefined ? date_debut : existingEmployeRubriques[0].date_debut,
        date_fin !== undefined ? date_fin : existingEmployeRubriques[0].date_fin,
        f1 !== undefined ? f1 : existingEmployeRubriques[0].f1,
        f2 !== undefined ? f2 : existingEmployeRubriques[0].f2,
        f3 !== undefined ? f3 : existingEmployeRubriques[0].f3,
        f4 !== undefined ? f4 : existingEmployeRubriques[0].f4,
        f5 !== undefined ? f5 : existingEmployeRubriques[0].f5,
        id
      ]
    );
    
    res.json({ message: 'Employee rubrique updated successfully' });
  } catch (error) {
    console.error('Error updating employee rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an employee rubrique assignment
router.delete('/employe-rubriques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the employee rubrique is used in paie_detail
    const [paieDetails] = await pool.query(
      'SELECT COUNT(*) as count FROM paie_detail WHERE employe_rubrique_id = ?',
      [id]
    );
    
    if (paieDetails[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete employee rubrique because it is used in payroll details' 
      });
    }
    
    // Delete employee rubrique
    const [result] = await pool.query(
      'DELETE FROM employe_rubrique WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee rubrique not found' });
    }
    
    res.json({ message: 'Employee rubrique deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee rubrique:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PAIE ROUTES
 * These endpoints handle payroll records
 */

// Get all payroll records
router.get('/records', async (req, res) => {
  try {
    const [paieRecords] = await pool.query(
      `SELECT p.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom 
       FROM paie p
       JOIN employes e ON p.id_employe = e.id
       ORDER BY p.date_debut DESC`
    );
    
    res.json(paieRecords);
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll records for a specific employee
router.get('/records/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [paieRecords] = await pool.query(
      `SELECT * FROM paie 
       WHERE id_employe = ?
       ORDER BY date_debut DESC`,
      [employeId]
    );
    
    res.json(paieRecords);
  } catch (error) {
    console.error('Error fetching employee payroll records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific payroll record by ID
router.get('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [paieRecords] = await pool.query(
      `SELECT p.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom 
       FROM paie p
       JOIN employes e ON p.id_employe = e.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (paieRecords.length === 0) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json(paieRecords[0]);
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new payroll record
router.post('/records', async (req, res) => {
  try {
    const { 
      id_employe, 
      date_debut, 
      date_fin, 
      salaire_base, 
      impot, 
      salaire_net 
    } = req.body;
    
    // Validate required fields
    if (!id_employe || !date_debut || !date_fin) {
      return res.status(400).json({ 
        message: 'Employee ID, start date, and end date are required' 
      });
    }
    
    // Check if employee exists
    const [employees] = await pool.query(
      'SELECT id FROM employes WHERE id = ?',
      [id_employe]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check for overlapping payroll periods for this employee
    const [overlappingRecords] = await pool.query(
      `SELECT * FROM paie 
       WHERE id_employe = ? 
       AND ((date_debut <= ? AND date_fin >= ?) OR 
            (date_debut <= ? AND date_fin >= ?) OR
            (date_debut >= ? AND date_fin <= ?))`,
      [id_employe, date_fin, date_debut, date_fin, date_debut, date_debut, date_fin]
    );
    
    if (overlappingRecords.length > 0) {
      return res.status(400).json({ 
        message: 'Overlapping payroll period exists for this employee' 
      });
    }
    
    // Insert new payroll record
    const [result] = await pool.query(
      `INSERT INTO paie 
       (id_employe, date_debut, date_fin, salaire_base, impot, salaire_net) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_employe, 
        date_debut, 
        date_fin, 
        salaire_base || 0, 
        impot || 0, 
        salaire_net || 0
      ]
    );
    
    res.status(201).json({
      message: 'Payroll record created successfully',
      paie_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a payroll record
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date_debut, 
      date_fin, 
      salaire_base, 
      impot, 
      salaire_net 
    } = req.body;
    
    // Check if payroll record exists
    const [existingRecords] = await pool.query(
      'SELECT * FROM paie WHERE id = ?',
      [id]
    );
    
    if (existingRecords.length === 0) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // If dates are being changed, check for overlaps
    if (date_debut || date_fin) {
      const newDateDebut = date_debut || existingRecords[0].date_debut;
      const newDateFin = date_fin || existingRecords[0].date_fin;
      
      const [overlappingRecords] = await pool.query(
        `SELECT * FROM paie 
         WHERE id_employe = ? 
         AND id != ?
         AND ((date_debut <= ? AND date_fin >= ?) OR 
              (date_debut <= ? AND date_fin >= ?) OR
              (date_debut >= ? AND date_fin <= ?))`,
        [
          existingRecords[0].id_employe, 
          id,
          newDateFin, 
          newDateDebut, 
          newDateFin, 
          newDateDebut, 
          newDateDebut, 
          newDateFin
        ]
      );
      
      if (overlappingRecords.length > 0) {
        return res.status(400).json({ 
          message: 'Overlapping payroll period exists for this employee' 
        });
      }
    }
    
    // Update payroll record
    await pool.query(
      `UPDATE paie 
       SET date_debut = ?, date_fin = ?, salaire_base = ?, impot = ?, salaire_net = ?
       WHERE id = ?`,
      [
        date_debut !== undefined ? date_debut : existingRecords[0].date_debut,
        date_fin !== undefined ? date_fin : existingRecords[0].date_fin,
        salaire_base !== undefined ? salaire_base : existingRecords[0].salaire_base,
        impot !== undefined ? impot : existingRecords[0].impot,
        salaire_net !== undefined ? salaire_net : existingRecords[0].salaire_net,
        id
      ]
    );
    
    res.json({ message: 'Payroll record updated successfully' });
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a payroll record
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the payroll record has details
    const [paieDetails] = await pool.query(
      'SELECT COUNT(*) as count FROM paie_detail WHERE paie_id = ?',
      [id]
    );
    
    if (paieDetails[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete payroll record because it has associated details' 
      });
    }
    
    // Delete payroll record
    const [result] = await pool.query(
      'DELETE FROM paie WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 