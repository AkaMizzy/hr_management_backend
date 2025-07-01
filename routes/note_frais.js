const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Create a new expense reimbursement request (Employee)
router.post('/', async (req, res) => {
  try {
    const { date_frais, type_id, description, montant, id_employe } = req.body;
    
    // Validate required fields
    if (!date_frais || !type_id || !montant || !id_employe) {
      return res.status(400).json({ message: 'Date, type, amount, and employee ID are required' });
    }
    
    // Insert new expense request
    const [result] = await pool.query(
      'INSERT INTO demande_note_frais (date_frais, type_id, description, montant, status, id_employe) VALUES (?, ?, ?, ?, ?, ?)',
      [date_frais, type_id, description || null, montant, 'pending', id_employe]
    );
    
    res.status(201).json({
      message: 'Expense reimbursement request submitted successfully',
      note_frais_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating expense request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expense types
router.get('/types', async (req, res) => {
  try {
    const [types] = await pool.query('SELECT * FROM type_note_frais');
    res.json(types);
  } catch (error) {
    console.error('Error fetching expense types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expense reports (RH only)
router.get('/all', async (req, res) => {
  try {
    // Fetch all expense reports with employee information
    const [expenses] = await pool.query(`
      SELECT nf.*, 
             t.intitule as type_nom,
             e.nom as employe_nom, 
             e.prenom as employe_prenom,
             e.email as employe_email
      FROM demande_note_frais nf
      JOIN employes e ON nf.id_employe = e.id
      JOIN type_note_frais t ON nf.type_id = t.id
      ORDER BY nf.date_frais DESC
    `);
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching all expense reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expense requests for an employee
router.get('/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [expenses] = await pool.query(
      `SELECT nf.*, 
              t.intitule as type_nom,
              (SELECT JSON_OBJECT('validator_role', nv.validator_role, 
                                 'is_approved', nv.is_approved, 
                                 'justification', nv.justification, 
                                 'date_validation', nv.date_validation)
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id AND nv.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', nv.validator_role, 
                                 'is_approved', nv.is_approved, 
                                 'justification', nv.justification, 
                                 'date_validation', nv.date_validation)
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id AND nv.validator_role = 'responsable_rh') as hr_validation
       FROM demande_note_frais nf
       JOIN type_note_frais t ON nf.type_id = t.id
       WHERE nf.id_employe = ?
       ORDER BY nf.date_frais DESC`,
      [employeId]
    );
    
    // Parse the validations JSON for each expense request
    const formattedExpenses = expenses.map(expense => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (expense.manager_validation) {
        try {
          managerValidation = JSON.parse(expense.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (expense.hr_validation) {
        try {
          hrValidation = JSON.parse(expense.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...expense,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching employee expense requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense requests for manager validation
router.get('/manager/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Get expense requests from employees under this manager that need validation
    const [expenses] = await pool.query(
      `SELECT nf.*, 
              t.intitule as type_nom,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', nv.validator_role, 
                                 'is_approved', nv.is_approved, 
                                 'justification', nv.justification, 
                                 'date_validation', nv.date_validation)
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id AND nv.validator_role = 'manager') as manager_validation
       FROM demande_note_frais nf
       JOIN employes e ON nf.id_employe = e.id
       JOIN type_note_frais t ON nf.type_id = t.id
       WHERE e.manager_id = ?
       ORDER BY nf.date_frais DESC`,
      [managerId]
    );
    
    // Parse the manager validation JSON for each expense request
    const formattedExpenses = expenses.map(expense => {
      let managerValidation = null;
      if (expense.manager_validation) {
        try {
          managerValidation = JSON.parse(expense.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      return {
        ...expense,
        manager_validation: managerValidation
      };
    });
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching manager expense requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense requests for HR validation (only those approved by managers)
router.get('/hr', async (req, res) => {
  try {
    // Get expense requests that have been approved by managers but not yet by HR
    const [expenses] = await pool.query(
      `SELECT nf.*, 
              t.intitule as type_nom,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', nv.validator_role, 
                                 'is_approved', nv.is_approved, 
                                 'justification', nv.justification, 
                                 'date_validation', nv.date_validation)
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id AND nv.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', nv.validator_role, 
                                 'is_approved', nv.is_approved, 
                                 'justification', nv.justification, 
                                 'date_validation', nv.date_validation)
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id AND nv.validator_role = 'responsable_rh') as hr_validation
       FROM demande_note_frais nf
       JOIN employes e ON nf.id_employe = e.id
       JOIN type_note_frais t ON nf.type_id = t.id
       WHERE EXISTS (SELECT 1 FROM note_frais_validations nv 
                    WHERE nv.id_note_frais = nf.id 
                    AND nv.validator_role = 'manager' 
                    AND nv.is_approved = true)
       ORDER BY nf.date_frais DESC`
    );
    
    // Parse the validations JSON for each expense request
    const formattedExpenses = expenses.map(expense => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (expense.manager_validation) {
        try {
          managerValidation = JSON.parse(expense.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (expense.hr_validation) {
        try {
          hrValidation = JSON.parse(expense.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...expense,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching HR expense requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific expense request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [expenses] = await pool.query(
      `SELECT nf.*,
              t.intitule as type_nom,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', nv.id,
                             'validator_role', nv.validator_role, 
                             'is_approved', nv.is_approved, 
                             'justification', nv.justification, 
                             'date_validation', nv.date_validation))
               FROM note_frais_validations nv 
               WHERE nv.id_note_frais = nf.id) as validations
       FROM demande_note_frais nf
       JOIN employes e ON nf.id_employe = e.id
       JOIN type_note_frais t ON nf.type_id = t.id
       WHERE nf.id = ?`,
      [id]
    );
    
    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense request not found' });
    }
    
    // Parse the validations JSON
    const expense = expenses[0];
    let parsedValidations = [];
    
    if (expense.validations) {
      try {
        parsedValidations = JSON.parse(expense.validations);
      } catch (e) {
        console.error('Error parsing validations:', e);
      }
    }
    
    res.json({
      ...expense,
      validations: parsedValidations || []
    });
  } catch (error) {
    console.error('Error fetching expense request details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager validation of an expense request
router.post('/:id/validate/manager', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, justification, manager_id } = req.body;
    
    // Validate required fields
    if (is_approved === undefined) {
      return res.status(400).json({ message: 'Approval decision is required' });
    }
    
    // If rejecting, justification is required
    if (is_approved === false && !justification) {
      return res.status(400).json({ message: 'Justification is required when rejecting a request' });
    }
    
    // Verify the manager is authorized for this expense request
    const [employees] = await pool.query(
      `SELECT e.manager_id 
       FROM demande_note_frais nf
       JOIN employes e ON nf.id_employe = e.id
       WHERE nf.id = ?`,
      [id]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Expense request not found' });
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
        'SELECT id FROM note_frais_validations WHERE id_note_frais = ? AND validator_role = ?',
        [id, 'manager']
      );
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE note_frais_validations 
           SET is_approved = ?, justification = ?, date_validation = NOW() 
           WHERE id_note_frais = ? AND validator_role = ?`,
          [is_approved, justification || null, id, 'manager']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO note_frais_validations 
           (id_note_frais, validator_role, is_approved, justification, date_validation) 
           VALUES (?, ?, ?, ?, NOW())`,
          [id, 'manager', is_approved, justification || null]
        );
      }
      
      // Update expense request status if rejected
      if (is_approved === false) {
        await connection.query(
          'UPDATE demande_note_frais SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Expense request ${is_approved ? 'approved' : 'rejected'} by manager`,
        note_frais_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating expense request by manager:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR validation of an expense request
router.post('/:id/validate/hr', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, justification } = req.body;
    
    // Validate required fields
    if (is_approved === undefined) {
      return res.status(400).json({ message: 'Approval decision is required' });
    }
    
    // If rejecting, justification is required
    if (is_approved === false && !justification) {
      return res.status(400).json({ message: 'Justification is required when rejecting a request' });
    }
    
    // Verify the expense request has been approved by a manager
    const [validations] = await pool.query(
      `SELECT * FROM note_frais_validations 
       WHERE id_note_frais = ? AND validator_role = ? AND is_approved = ?`,
      [id, 'manager', true]
    );
    
    if (validations.length === 0) {
      return res.status(400).json({ 
        message: 'This expense request has not been approved by a manager yet' 
      });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check if validation already exists
      const [existing] = await connection.query(
        'SELECT id FROM note_frais_validations WHERE id_note_frais = ? AND validator_role = ?',
        [id, 'responsable_rh']
      );
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE note_frais_validations 
           SET is_approved = ?, justification = ?, date_validation = NOW() 
           WHERE id_note_frais = ? AND validator_role = ?`,
          [is_approved, justification || null, id, 'responsable_rh']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO note_frais_validations 
           (id_note_frais, validator_role, is_approved, justification, date_validation) 
           VALUES (?, ?, ?, ?, NOW())`,
          [id, 'responsable_rh', is_approved, justification || null]
        );
      }
      
      // Update expense request status based on HR decision
      if (is_approved) {
        await connection.query(
          'UPDATE demande_note_frais SET status = ? WHERE id = ?',
          ['approved', id]
        );
      } else {
        await connection.query(
          'UPDATE demande_note_frais SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Expense request ${is_approved ? 'approved' : 'rejected'} by HR`,
        note_frais_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating expense request by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 