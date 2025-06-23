const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Create a new absence request (Employee)
router.post('/', async (req, res) => {
  try {
    const { date, heure_debut, heure_fin, motif, id_employe } = req.body;
    
    // Validate required fields
    if (!date || !id_employe) {
      return res.status(400).json({ message: 'Date and employee ID are required' });
    }
    
    // Insert new absence request
    const [result] = await pool.query(
      'INSERT INTO demande_absence (date, heure_debut, heure_fin, motif, status, id_employe) VALUES (?, ?, ?, ?, ?, ?)',
      [date, heure_debut || null, heure_fin || null, motif || null, 'pending', id_employe]
    );
    
    res.status(201).json({
      message: 'Absence request submitted successfully',
      absence_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating absence request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all absence requests for an employee
router.get('/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [absences] = await pool.query(
      `SELECT a.*, 
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justifier', av.justifier, 
                                 'annulable', av.annulable)
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id AND av.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justifier', av.justifier, 
                                 'annulable', av.annulable)
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id AND av.validator_role = 'responsable_rh') as hr_validation
       FROM demande_absence a
       WHERE a.id_employe = ?
       ORDER BY a.date DESC`,
      [employeId]
    );
    
    // Parse the validations JSON for each absence
    const formattedAbsences = absences.map(abs => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (abs.manager_validation) {
        try {
          managerValidation = JSON.parse(abs.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (abs.hr_validation) {
        try {
          hrValidation = JSON.parse(abs.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...abs,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedAbsences);
  } catch (error) {
    console.error('Error fetching employee absences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get absence requests for manager validation
router.get('/manager/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Get absences from employees under this manager that are pending or have been validated by the manager
    const [absences] = await pool.query(
      `SELECT a.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justifier', av.justifier, 
                                 'annulable', av.annulable)
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id AND av.validator_role = 'manager') as manager_validation
       FROM demande_absence a
       JOIN employes e ON a.id_employe = e.id
       WHERE e.manager_id = ?
       ORDER BY a.date DESC`,
      [managerId]
    );
    
    // Parse the manager validation JSON for each absence
    const formattedAbsences = absences.map(abs => {
      let managerValidation = null;
      if (abs.manager_validation) {
        try {
          managerValidation = JSON.parse(abs.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      return {
        ...abs,
        manager_validation: managerValidation
      };
    });
    
    res.json(formattedAbsences);
  } catch (error) {
    console.error('Error fetching manager absences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get absence requests for HR validation (only those approved by managers)
router.get('/hr', async (req, res) => {
  try {
    // Get absences that have been approved by managers but not yet by HR
    const [absences] = await pool.query(
      `SELECT a.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justifier', av.justifier, 
                                 'annulable', av.annulable)
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id AND av.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justifier', av.justifier, 
                                 'annulable', av.annulable)
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id AND av.validator_role = 'responsable_rh') as hr_validation
       FROM demande_absence a
       JOIN employes e ON a.id_employe = e.id
       WHERE EXISTS (SELECT 1 FROM absence_validations av 
                    WHERE av.id_demande_absence = a.id 
                    AND av.validator_role = 'manager' 
                    AND av.is_approved = true)
       ORDER BY a.date DESC`
    );
    
    // Parse the validations JSON for each absence
    const formattedAbsences = absences.map(abs => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (abs.manager_validation) {
        try {
          managerValidation = JSON.parse(abs.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (abs.hr_validation) {
        try {
          hrValidation = JSON.parse(abs.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...abs,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedAbsences);
  } catch (error) {
    console.error('Error fetching HR absences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific absence request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [absences] = await pool.query(
      `SELECT a.*, 
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', av.id,
                             'validator_role', av.validator_role, 
                             'is_approved', av.is_approved, 
                             'justifier', av.justifier, 
                             'annulable', av.annulable))
               FROM absence_validations av 
               WHERE av.id_demande_absence = a.id) as validations
       FROM demande_absence a
       JOIN employes e ON a.id_employe = e.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (absences.length === 0) {
      return res.status(404).json({ message: 'Absence request not found' });
    }
    
    // Parse the validations JSONx
    const absence = absences[0];
    let parsedValidations = [];
    
    if (absence.validations) {
      try {
        parsedValidations = JSON.parse(absence.validations);
      } catch (e) {
        console.error('Error parsing validations:', e);
      }
    }
    
    res.json({
      ...absence,
      validations: parsedValidations || []
    });
  } catch (error) {
    console.error('Error fetching absence details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager validation of an absence request
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
    
    // Verify the manager is authorized for this absence
    const [employees] = await pool.query(
      `SELECT e.manager_id 
       FROM demande_absence a
       JOIN employes e ON a.id_employe = e.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Absence request not found' });
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
        'SELECT id FROM absence_validations WHERE id_demande_absence = ? AND validator_role = ?',
        [id, 'manager']
      );
      
      // Use the annulable value from request or default to false if not provided
      const isAnnulable = annulable !== undefined ? annulable : false;
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE absence_validations 
           SET is_approved = ?, justifier = ?, annulable = ? 
           WHERE id_demande_absence = ? AND validator_role = ?`,
          [is_approved, justifier || null, isAnnulable, id, 'manager']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO absence_validations 
           (id_demande_absence, validator_role, is_approved, justifier, annulable) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, 'manager', is_approved, justifier || null, isAnnulable]
        );
      }
      
      // Update absence status if rejected
      if (is_approved === false) {
        await connection.query(
          'UPDATE demande_absence SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Absence request ${is_approved ? 'approved' : 'rejected'} by manager`,
        absence_id: id,
        annulable: isAnnulable
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating absence by manager:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR validation of an absence request
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
    
    // Verify the absence has been approved by a manager
    const [validations] = await pool.query(
      `SELECT * FROM absence_validations 
       WHERE id_demande_absence = ? AND validator_role = ? AND is_approved = ?`,
      [id, 'manager', true]
    );
    
    if (validations.length === 0) {
      return res.status(400).json({ 
        message: 'This absence request has not been approved by a manager yet' 
      });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check if validation already exists
      const [existing] = await connection.query(
        'SELECT id FROM absence_validations WHERE id_demande_absence = ? AND validator_role = ?',
        [id, 'responsable_rh']
      );
      
      // Set annulable to false as the request is now reviewed by HR
      const annulable = false;
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE absence_validations 
           SET is_approved = ?, justifier = ?, annulable = ? 
           WHERE id_demande_absence = ? AND validator_role = ?`,
          [is_approved, justifier || null, annulable, id, 'responsable_rh']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO absence_validations 
           (id_demande_absence, validator_role, is_approved, justifier, annulable) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, 'responsable_rh', is_approved, justifier || null, annulable]
        );
      }
      
      // Update absence status based on HR decision
      if (is_approved) {
        await connection.query(
          'UPDATE demande_absence SET status = ? WHERE id = ?',
          ['approved', id]
        );
      } else {
        await connection.query(
          'UPDATE demande_absence SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Absence request ${is_approved ? 'approved' : 'rejected'} by HR`,
        absence_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating absence by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel an absence request (Employee)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;
    
    // Verify the employee owns this request
    const [absences] = await pool.query(
      'SELECT id, id_employe FROM demande_absence WHERE id = ?',
      [id]
    );
    
    if (absences.length === 0) {
      return res.status(404).json({ message: 'Absence request not found' });
    }
    
    if (absences[0].id_employe != employee_id) {
      return res.status(403).json({ message: 'Unauthorized: Not your absence request' });
    }
    
    // Get all validations
    const [allValidations] = await pool.query(
      `SELECT id, validator_role, annulable 
       FROM absence_validations 
       WHERE id_demande_absence = ?`,
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
        return res.status(400).json({ message: 'This absence request can no longer be canceled' });
      }
    }
    
    // Delete the request and its validations
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete validations first (foreign key constraint)
      await connection.query(
        'DELETE FROM absence_validations WHERE id_demande_absence = ?',
        [id]
      );
      
      // Delete the absence request
      await connection.query(
        'DELETE FROM demande_absence WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      res.json({ message: 'Absence request canceled successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error canceling absence request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate an absence request
router.put('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Status must be either approved or rejected.' });
    }

    const absence = await Absence.findByPk(id);
    
    if (!absence) {
      return res.status(404).json({ message: 'Absence request not found' });
    }

    if (absence.status !== 'pending') {
      return res.status(400).json({ message: 'This absence request has already been processed' });
    }

    absence.status = status;
    absence.managerComment = managerComment;
    
    await absence.save();

    return res.status(200).json({ 
      message: `Absence request ${status} successfully`, 
      absence 
    });
  } catch (error) {
    console.error('Error validating absence request:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 