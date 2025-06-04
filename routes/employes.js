const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id 
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
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id
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

// GET employees by responsable (responsable_id)
router.get('/responsable/:responsableId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id 
      FROM employes 
      WHERE responsable_id = ?
    `, [req.params.responsableId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees by responsable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET employees by entity (entite_id)
router.get('/entity/:entityId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id 
      FROM employes 
      WHERE entite_id = ?
    `, [req.params.entityId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees by entity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET employees without entity
router.get('/without-entity', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id 
      FROM employes 
      WHERE entite_id IS NULL
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees without entity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new employee
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id } = req.body;
    
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

    // Validate responsable_id if provided
    if (responsable_id) {
      const [responsable] = await pool.query('SELECT id FROM employes WHERE id = ?', [responsable_id]);
      if (responsable.length === 0) {
        return res.status(400).json({ message: 'Invalid responsable ID' });
      }
    }

    // Validate entite_id if provided
    if (entite_id) {
      const [entite] = await pool.query('SELECT id FROM entites WHERE id = ?', [entite_id]);
      if (entite.length === 0) {
        return res.status(400).json({ message: 'Invalid entite ID' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO employes (nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id || null, entite_id || null]
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
    const { nom, prenom, genre, date_naissance, email, adresse, telephone, responsable_id, entite_id } = req.body;
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

    // Validate responsable_id if provided
    if (responsable_id !== undefined) {
      // Check for self-assignment as responsable
      if (responsable_id && responsable_id.toString() === employeeId.toString()) {
        return res.status(400).json({ message: 'Employee cannot be their own responsable' });
      }

      // Check if responsable exists
      if (responsable_id) {
        const [responsable] = await pool.query('SELECT id FROM employes WHERE id = ?', [responsable_id]);
        if (responsable.length === 0) {
          return res.status(400).json({ message: 'Invalid responsable ID' });
        }
      }

      // Check for circular references in hierarchy
      if (responsable_id) {
        let currentResponsableId = responsable_id;
        while (currentResponsableId) {
          // If we find the employee ID in the chain, it's a circular reference
          if (currentResponsableId.toString() === employeeId.toString()) {
            return res.status(400).json({ message: 'Circular hierarchy reference detected' });
          }
          
          // Get the responsable's responsable
          const [responsableRow] = await pool.query('SELECT responsable_id FROM employes WHERE id = ?', [currentResponsableId]);
          if (responsableRow.length === 0 || !responsableRow[0].responsable_id) {
            break;
          }
          currentResponsableId = responsableRow[0].responsable_id;
        }
      }
    }

    // Validate entite_id if provided
    if (entite_id !== undefined) {
      if (entite_id !== null) {
        const [entite] = await pool.query('SELECT id FROM entites WHERE id = ?', [entite_id]);
        if (entite.length === 0) {
          return res.status(400).json({ message: 'Invalid entite ID' });
        }
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
           telephone = COALESCE(?, telephone),
           responsable_id = ?,
           entite_id = ?
       WHERE id = ?`,
      [nom, prenom, genre, date_naissance, email, adresse, telephone, 
       responsable_id !== undefined ? responsable_id : null, 
       entite_id !== undefined ? entite_id : null, 
       employeeId]
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

    // Check if any employees have this employee as their responsable
    const [subordinates] = await pool.query('SELECT id FROM employes WHERE responsable_id = ?', [employeeId]);
    if (subordinates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete employee with subordinates. Reassign subordinates first.',
        subordinateCount: subordinates.length
      });
    }

    await pool.query('DELETE FROM employes WHERE id = ?', [employeeId]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET employee hierarchy (all subordinates recursively)
router.get('/:id/hierarchy', async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Check if employee exists
    const [existing] = await pool.query('SELECT id FROM employes WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Use recursive CTE to get the entire hierarchy
    // This requires MySQL 8.0+
    const [rows] = await pool.query(`
      WITH RECURSIVE EmployeeHierarchy AS (
        SELECT id, nom, prenom, email, responsable_id, entite_id, 0 AS level
        FROM employes
        WHERE id = ?
        
        UNION ALL
        
        SELECT e.id, e.nom, e.prenom, e.email, e.responsable_id, e.entite_id, eh.level + 1
        FROM employes e
        JOIN EmployeeHierarchy eh ON e.responsable_id = eh.id
      )
      SELECT id, nom, prenom, email, responsable_id, entite_id, level
      FROM EmployeeHierarchy
      ORDER BY level, nom, prenom
    `, [employeeId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching employee hierarchy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;