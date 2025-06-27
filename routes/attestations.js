const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/attestations');
fs.ensureDirSync(uploadsDir);

// Create a new attestation request (Employee)
router.post('/', async (req, res) => {
  try {
    const { type_id, description, employe_id } = req.body;
    
    // Validate required fields
    if (!type_id || !employe_id) {
      return res.status(400).json({ message: 'Attestation type and employee ID are required' });
    }
    
    // Insert new attestation request
    const [result] = await pool.query(
      'INSERT INTO demande_attestation (type_id, description, employe_id, status) VALUES (?, ?, ?, ?)',
      [type_id, description || null, employe_id, 'pending']
    );
    
    res.status(201).json({
      message: 'Attestation request submitted successfully',
      attestation_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating attestation request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all attestation requests for an employee
router.get('/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    
    const [attestations] = await pool.query(
      `SELECT a.*, 
              t.intitule as type_intitule,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justification', av.justification, 
                                 'date_validation', av.date_validation)
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id AND av.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justification', av.justification, 
                                 'date_validation', av.date_validation)
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id AND av.validator_role = 'responsable_rh') as hr_validation
       FROM demande_attestation a
       JOIN type_attestation t ON a.type_id = t.id
       WHERE a.employe_id = ?
       ORDER BY a.date_demande DESC`,
      [employeId]
    );
    
    // Parse the validations JSON for each attestation
    const formattedAttestations = attestations.map(att => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (att.manager_validation) {
        try {
          managerValidation = JSON.parse(att.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (att.hr_validation) {
        try {
          hrValidation = JSON.parse(att.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...att,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedAttestations);
  } catch (error) {
    console.error('Error fetching employee attestations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attestation requests for manager validation
router.get('/manager/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Get attestations from employees under this manager that are pending or have been validated by the manager
    const [attestations] = await pool.query(
      `SELECT a.*, 
              t.intitule as type_intitule,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justification', av.justification, 
                                 'date_validation', av.date_validation)
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id AND av.validator_role = 'manager') as manager_validation
       FROM demande_attestation a
       JOIN employes e ON a.employe_id = e.id
       JOIN type_attestation t ON a.type_id = t.id
       WHERE e.manager_id = ?
       ORDER BY a.date_demande DESC`,
      [managerId]
    );
    
    // Parse the manager validation JSON for each attestation
    const formattedAttestations = attestations.map(att => {
      let managerValidation = null;
      if (att.manager_validation) {
        try {
          managerValidation = JSON.parse(att.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      return {
        ...att,
        manager_validation: managerValidation
      };
    });
    
    res.json(formattedAttestations);
  } catch (error) {
    console.error('Error fetching manager attestations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attestation requests for HR validation (only those approved by managers)
router.get('/hr', async (req, res) => {
  try {
    // Get attestations that have been approved by managers but not yet by HR
    const [attestations] = await pool.query(
      `SELECT a.*, 
              t.intitule as type_intitule,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justification', av.justification, 
                                 'date_validation', av.date_validation)
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id AND av.validator_role = 'manager') as manager_validation,
              (SELECT JSON_OBJECT('validator_role', av.validator_role, 
                                 'is_approved', av.is_approved, 
                                 'justification', av.justification, 
                                 'date_validation', av.date_validation)
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id AND av.validator_role = 'responsable_rh') as hr_validation
       FROM demande_attestation a
       JOIN employes e ON a.employe_id = e.id
       JOIN type_attestation t ON a.type_id = t.id
       WHERE EXISTS (SELECT 1 FROM attestation_validations av 
                    WHERE av.attestation_id = a.id 
                    AND av.validator_role = 'manager' 
                    AND av.is_approved = true)
       ORDER BY a.date_demande DESC`
    );
    
    // Parse the validations JSON for each attestation
    const formattedAttestations = attestations.map(att => {
      let managerValidation = null;
      let hrValidation = null;
      
      if (att.manager_validation) {
        try {
          managerValidation = JSON.parse(att.manager_validation);
        } catch (e) {
          console.error('Error parsing manager validation:', e);
        }
      }
      
      if (att.hr_validation) {
        try {
          hrValidation = JSON.parse(att.hr_validation);
        } catch (e) {
          console.error('Error parsing HR validation:', e);
        }
      }
      
      return {
        ...att,
        manager_validation: managerValidation,
        hr_validation: hrValidation
      };
    });
    
    res.json(formattedAttestations);
  } catch (error) {
    console.error('Error fetching HR attestations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific attestation request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [attestations] = await pool.query(
      `SELECT a.*, 
              t.intitule as type_intitule,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', av.id,
                             'validator_role', av.validator_role, 
                             'is_approved', av.is_approved, 
                             'justification', av.justification, 
                             'date_validation', av.date_validation))
               FROM attestation_validations av 
               WHERE av.attestation_id = a.id) as validations
       FROM demande_attestation a
       JOIN employes e ON a.employe_id = e.id
       JOIN type_attestation t ON a.type_id = t.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (attestations.length === 0) {
      return res.status(404).json({ message: 'Attestation request not found' });
    }
    
    // Parse the validations JSON
    const attestation = attestations[0];
    let parsedValidations = [];
    
    if (attestation.validations) {
      try {
        parsedValidations = JSON.parse(attestation.validations);
      } catch (e) {
        console.error('Error parsing validations:', e);
      }
    }
    
    res.json({
      ...attestation,
      validations: parsedValidations || []
    });
  } catch (error) {
    console.error('Error fetching attestation details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all attestation types
router.get('/types/all', async (req, res) => {
  try {
    const [types] = await pool.query('SELECT * FROM type_attestation ORDER BY intitule');
    res.json(types);
  } catch (error) {
    console.error('Error fetching attestation types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager validation of an attestation request
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
    
    // Verify the manager is authorized for this attestation
    const [employees] = await pool.query(
      `SELECT e.manager_id 
       FROM demande_attestation a
       JOIN employes e ON a.employe_id = e.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Attestation request not found' });
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
        'SELECT id FROM attestation_validations WHERE attestation_id = ? AND validator_role = ?',
        [id, 'manager']
      );
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE attestation_validations 
           SET is_approved = ?, justification = ?, date_validation = NOW() 
           WHERE attestation_id = ? AND validator_role = ?`,
          [is_approved, justification || null, id, 'manager']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO attestation_validations 
           (attestation_id, validator_role, is_approved, justification, date_validation) 
           VALUES (?, ?, ?, ?, NOW())`,
          [id, 'manager', is_approved, justification || null]
        );
      }
      
      // Update attestation status if rejected
      if (is_approved === false) {
        await connection.query(
          'UPDATE demande_attestation SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Attestation request ${is_approved ? 'approved' : 'rejected'} by manager`,
        attestation_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating attestation by manager:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR validation of an attestation request
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
    
    // Verify the attestation has been approved by a manager
    const [validations] = await pool.query(
      `SELECT * FROM attestation_validations 
       WHERE attestation_id = ? AND validator_role = ? AND is_approved = ?`,
      [id, 'manager', true]
    );
    
    if (validations.length === 0) {
      return res.status(400).json({ 
        message: 'This attestation request has not been approved by a manager yet' 
      });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check if validation already exists
      const [existing] = await connection.query(
        'SELECT id FROM attestation_validations WHERE attestation_id = ? AND validator_role = ?',
        [id, 'responsable_rh']
      );
      
      if (existing.length > 0) {
        // Update existing validation
        await connection.query(
          `UPDATE attestation_validations 
           SET is_approved = ?, justification = ?, date_validation = NOW() 
           WHERE attestation_id = ? AND validator_role = ?`,
          [is_approved, justification || null, id, 'responsable_rh']
        );
      } else {
        // Insert new validation
        await connection.query(
          `INSERT INTO attestation_validations 
           (attestation_id, validator_role, is_approved, justification, date_validation) 
           VALUES (?, ?, ?, ?, NOW())`,
          [id, 'responsable_rh', is_approved, justification || null]
        );
      }
      
      // Update attestation status based on HR decision
      if (is_approved) {
        await connection.query(
          'UPDATE demande_attestation SET status = ? WHERE id = ?',
          ['approved', id]
        );
      } else {
        await connection.query(
          'UPDATE demande_attestation SET status = ? WHERE id = ?',
          ['rejected', id]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        message: `Attestation request ${is_approved ? 'approved' : 'rejected'} by HR`,
        attestation_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error validating attestation by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate PDF for an approved attestation (HR only)
router.post('/:id/generate-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the attestation exists and is approved by both manager and HR
    const [attestations] = await pool.query(
      `SELECT a.*, 
              t.intitule as type_intitule,
              e.nom as employe_nom, 
              e.prenom as employe_prenom,
              e.email as employe_email,
              ent.tituler as entite_nom,
              ent.id as entite_id,
              (SELECT COUNT(*) FROM attestation_validations 
               WHERE attestation_id = a.id 
               AND validator_role = 'manager' 
               AND is_approved = true) as manager_approved,
              (SELECT COUNT(*) FROM attestation_validations 
               WHERE attestation_id = a.id 
               AND validator_role = 'responsable_rh' 
               AND is_approved = true) as hr_approved
       FROM demande_attestation a
       JOIN employes e ON a.employe_id = e.id
       JOIN type_attestation t ON a.type_id = t.id
       LEFT JOIN entites ent ON e.entite_id = ent.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (attestations.length === 0) {
      return res.status(404).json({ message: 'Attestation request not found' });
    }
    
    const attestation = attestations[0];
    
    // Check if both manager and HR have approved
    if (attestation.manager_approved === 0 || attestation.hr_approved === 0) {
      return res.status(400).json({ 
        message: 'This attestation has not been fully approved by both manager and HR' 
      });
    }
    
    // Check if PDF already exists for this attestation
    const [existingDocs] = await pool.query(
      'SELECT * FROM attestation_documents WHERE id_attestation = ?',
      [id]
    );
    
    let filePath;
    let documentId;
    
    if (existingDocs.length > 0) {
      // PDF already exists, return existing info
      filePath = existingDocs[0].file_path;
      documentId = existingDocs[0].id;
    } else {
      // Generate a new PDF
      const fileName = `attestation_${id}_${Date.now()}.pdf`;
      filePath = path.join('uploads/attestations', fileName);
      const fullPath = path.join(__dirname, '..', filePath);
      
      // Generate PDF content
      await generateAttestationPDF(attestation, fullPath);
      
      // Insert record into attestation_documents table
      const [result] = await pool.query(
        'INSERT INTO attestation_documents (id_attestation, file_path) VALUES (?, ?)',
        [id, filePath]
      );
      
      documentId = result.insertId;
    }
    
    res.json({
      message: 'PDF attestation generated successfully',
      document_id: documentId,
      file_path: filePath
    });
  } catch (error) {
    console.error('Error generating attestation PDF:', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
});

// Get PDF for an attestation
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the document record
    const [documents] = await pool.query(
      'SELECT * FROM attestation_documents WHERE id_attestation = ?',
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ message: 'No PDF found for this attestation' });
    }
    
    const document = documents[0];
    const filePath = path.join(__dirname, '..', document.file_path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error retrieving attestation PDF:', error);
    res.status(500).json({ message: 'Server error retrieving PDF' });
  }
});

// Function to generate the PDF
async function generateAttestationPDF(attestation, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      // Pipe the PDF to a file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Add company logo or header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('MuntadaaCom', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('ATTESTATION', { align: 'center' });
      
      doc.moveDown(2);
      
      // Current date
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Fait le ${currentDate}`, { align: 'right' });
      
      doc.moveDown(3);
      
      // Full employee name
      const fullName = `${attestation.employe_prenom} ${attestation.employe_nom}`;
      
      // Department info
      const departmentInfo = attestation.entite_nom ? 
        `travaille dans le département ${attestation.entite_nom}` : 
        'travaille';
      
      // Attestation content - new format
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Nous soussignés, MuntadaaCom, attestons par la présente que M./Mme ${fullName} est employé(e) et ${departmentInfo} au sein de notre société.`, {
           align: 'left',
           paragraphGap: 10,
           lineGap: 4
         });
      
      doc.moveDown();
      
      doc.text(`Cette attestation concerne : ${attestation.type_intitule} et est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.`, {
        align: 'left',
        paragraphGap: 10,
        lineGap: 4
      });
      
      doc.moveDown(2);
      
      doc.text(`Nous restons à disposition pour toute information complémentaire.`, {
        align: 'left',
        paragraphGap: 10,
        lineGap: 4
      });
      
      doc.moveDown(4);
      
      // Signature area
      doc.fontSize(12)
         .text('Signature du responsable RH:', { align: 'right' });
      
      doc.moveDown(2);
      doc.text('_______________________', { align: 'right' });
      
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .text('Ce document est généré automatiquement et ne nécessite pas de signature manuscrite.', { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      
      // Handle stream events
      stream.on('finish', () => {
        resolve();
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router; 