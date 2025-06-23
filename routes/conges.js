const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Create a new leave (congé) request (Employee)
router.post('/', async (req, res) => {
  try {
    const { date_debut, date_fin, nombre_jours, id_employe } = req.body;
    
    // Validate required fields
    if (!date_debut || !date_fin || !nombre_jours || !id_employe) {
      return res.status(400).json({ message: 'Start date, end date, number of days, and employee ID are required' });
    }
    
    // Insert new leave request
    const [result] = await pool.query(
      'INSERT INTO demande_conge (date_debut, date_fin, nombre_jours, status, id_employe) VALUES (?, ?, ?, ?, ?)',
      [date_debut, date_fin, nombre_jours, 'pending', id_employe]
    );
    
    res.status(201).json({
      message: 'Leave request submitted successfully',
      conge_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave requests for an employee
router.get('/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [conges] = await pool.query(
      `SELECT c.*, 
              (SELECT JSON_OBJECT('validator_role', cv.validator_role, 
                                 'is_approved', cv.is_approved, 
                                 'justifier', cv.justifier, 
                                 'annulable', cv.annulable)
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id AND cv.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', cv.validator_role, 
                                 'is_approved', cv.is_approved, 
                                 'justifier', cv.justifier, 
                                 'annulable', cv.annulable)
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id AND cv.validator_role = 'responsable_rh') as hr_validation
       FROM demande_conge c
       WHERE c.id_employe = ?
       ORDER BY c.date_debut DESC`,
      [employeId]
    );
    
    // Parse the validations JSON for each leave request
    const formattedConges = conges.map(conge => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (conge.manager_validation) {
        try {
          managerValidation = JSON.parse(conge.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (conge.hr_validation) {
        try {
          hrValidation = JSON.parse(conge.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...conge,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedConges);
  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests for manager validation
router.get('/manager/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Get leave requests from employees under this manager that are pending or have been validated by the manager
    const [conges] = await pool.query(
      `SELECT c.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', cv.validator_role, 
                                 'is_approved', cv.is_approved, 
                                 'justifier', cv.justifier, 
                                 'annulable', cv.annulable)
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id AND cv.validator_role = 'manager') as manager_validation
       FROM demande_conge c
       JOIN employes e ON c.id_employe = e.id
       WHERE e.manager_id = ?
       ORDER BY c.date_debut DESC`,
      [managerId]
    );
    
    // Parse the manager validation JSON for each leave request
    const formattedConges = conges.map(conge => {
      let managerValidation = null;
      if (conge.manager_validation) {
        try {
          managerValidation = JSON.parse(conge.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      return {
        ...conge,
        manager_validation: managerValidation
      };
    });
    
    res.json(formattedConges);
  } catch (error) {
    console.error('Error fetching manager leave requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests for HR validation (only those approved by managers)
router.get('/hr', async (req, res) => {
  try {
    // Get leave requests that have been approved by managers but not yet by HR
    const [conges] = await pool.query(
      `SELECT c.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', cv.validator_role, 
                                 'is_approved', cv.is_approved, 
                                 'justifier', cv.justifier, 
                                 'annulable', cv.annulable)
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id AND cv.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', cv.validator_role, 
                                 'is_approved', cv.is_approved, 
                                 'justifier', cv.justifier, 
                                 'annulable', cv.annulable)
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id AND cv.validator_role = 'responsable_rh') as hr_validation
       FROM demande_conge c
       JOIN employes e ON c.id_employe = e.id
       WHERE EXISTS (SELECT 1 FROM conge_validations cv 
                    WHERE cv.id_demande_conge = c.id 
                    AND cv.validator_role = 'manager' 
                    AND cv.is_approved = true)
       ORDER BY c.date_debut DESC`
    );
    
    // Parse the validations JSON for each leave request
    const formattedConges = conges.map(conge => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (conge.manager_validation) {
        try {
          managerValidation = JSON.parse(conge.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (conge.hr_validation) {
        try {
          hrValidation = JSON.parse(conge.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...conge,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedConges);
  } catch (error) {
    console.error('Error fetching HR leave requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific leave request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [conges] = await pool.query(
      `SELECT c.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', cv.id,
                             'validator_role', cv.validator_role, 
                             'is_approved', cv.is_approved, 
                             'justifier', cv.justifier, 
                             'annulable', cv.annulable))
               FROM conge_validations cv 
               WHERE cv.id_demande_conge = c.id) as validations
       FROM demande_conge c
       JOIN employes e ON c.id_employe = e.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (conges.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Parse the validations JSON
    const conge = conges[0];
    let parsedValidations = [];
    
    if (conge.validations) {
      try {
        parsedValidations = JSON.parse(conge.validations);
      } catch (e) {
        console.error('Error parsing validations:', e);
      }
    }
    
    res.json({
      ...conge,
      validations: parsedValidations || []
    });
  } catch (error) {
    console.error('Error fetching leave request details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager validation of a leave request
router.post('/:id/validate/manager', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, justifier, manager_id, annulable } = req.body;
    
    // Validate required fields
    if (is_approved === undefined) {
      return res.status(400).json({ message: 'Approval decision is required' });
    }
    
    // If rejecting, justification is required
    if (is_approved === false && !justifier) {
      return res.status(400).json({ message: 'Justification is required when rejecting a request' });
    }
    
    // Verify the manager is authorized for this leave request
    const [employees] = await pool.query(
      `SELECT e.manager_id 
       FROM demande_conge c
       JOIN employes e ON c.id_employe = e.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    if (employees[0].manager_id != manager_id) {
      return res.status(403).json({ message: 'Unauthorized: Not the manager of this employee' });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check if validation already exists
      const [existing] = await connection.query(
        'SELECT id FROM conge_validations WHERE id_demande_conge = ? AND validator_role = ?',
        [id, 'manager']
      );
      
      // Use the annulable value from request or default to false if not provided
      const isAnnulable = annulable !== undefined ? annulable : false;
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE conge_validations 
           SET is_approved = ?, justifier = ?, annulable = ? 
           WHERE id_demande_conge = ? AND validator_role = ?`,
          [is_approved, justifier || null, isAnnulable, id, 'manager']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO conge_validations 
           (id_demande_conge, validator_role, is_approved, justifier, annulable) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, 'manager', is_approved, justifier || null, isAnnulable]
        );
      }
      
      // Update leave request status if rejected
      if (is_approved === false) {
        await connection.query(
          'UPDATE demande_conge SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Leave request ${is_approved ? 'approved' : 'rejected'} by manager`,
        conge_id: id,
        annulable: isAnnulable
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating leave request by manager:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR validation of a leave request
router.post('/:id/validate/hr', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, justifier } = req.body;
    
    // Validate required fields
    if (is_approved === undefined) {
      return res.status(400).json({ message: 'Approval decision is required' });
    }
    
    // If rejecting, justification is required
    if (is_approved === false && !justifier) {
      return res.status(400).json({ message: 'Justification is required when rejecting a request' });
    }
    
    // Verify the leave request has been approved by a manager
    const [validations] = await pool.query(
      `SELECT * FROM conge_validations 
       WHERE id_demande_conge = ? AND validator_role = ? AND is_approved = ?`,
      [id, 'manager', true]
    );
    
    if (validations.length === 0) {
      return res.status(400).json({ 
        message: 'This leave request has not been approved by a manager yet' 
      });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check if validation already exists
      const [existing] = await connection.query(
        'SELECT id FROM conge_validations WHERE id_demande_conge = ? AND validator_role = ?',
        [id, 'responsable_rh']
      );
      
      // Set annulable to false as the request is now reviewed by HR
      const annulable = false;
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE conge_validations 
           SET is_approved = ?, justifier = ?, annulable = ? 
           WHERE id_demande_conge = ? AND validator_role = ?`,
          [is_approved, justifier || null, annulable, id, 'responsable_rh']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO conge_validations 
           (id_demande_conge, validator_role, is_approved, justifier, annulable) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, 'responsable_rh', is_approved, justifier || null, annulable]
        );
      }
      
      // Update leave request status based on HR decision
      if (is_approved) {
        await connection.query(
          'UPDATE demande_conge SET status = ? WHERE id = ?',
          ['approved', id]
        );
      } else {
        await connection.query(
          'UPDATE demande_conge SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Leave request ${is_approved ? 'approved' : 'rejected'} by HR`,
        conge_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating leave request by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a leave request (Employee)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;
    
    // Verify the employee owns this request
    const [conges] = await pool.query(
      'SELECT id, id_employe FROM demande_conge WHERE id = ?',
      [id]
    );
    
    if (conges.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    if (conges[0].id_employe != employee_id) {
      return res.status(403).json({ message: 'Unauthorized: Not your leave request' });
    }
    
    // Get all validations
    const [allValidations] = await pool.query(
      `SELECT id, validator_role, annulable 
       FROM conge_validations 
       WHERE id_demande_conge = ?`,
      [id]
    );
    
    // Check if there are any validations at all
    if (allValidations.length > 0) {
      // Directly check each validation's annulable field
      for (const validation of allValidations) {
        // Check if annulable is explicitly 1 (true)
        if (validation.annulable === 1 || validation.annulable === '1' || validation.annulable === true || validation.annulable === 'true') {
          continue;
        }
        
        // For all other cases (0, false, null, undefined, etc.), prevent cancellation
        return res.status(400).json({ message: 'This leave request can no longer be canceled' });
      }
    }
    
    // Delete the request and its validations
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete validations first (foreign key constraint)
      await connection.query(
        'DELETE FROM conge_validations WHERE id_demande_conge = ?',
        [id]
      );
      
      // Delete the leave request
      await connection.query(
        'DELETE FROM demande_conge WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      res.json({ message: 'Leave request canceled successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error canceling leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 