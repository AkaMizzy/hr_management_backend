const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// Allowed types for validation
const ALLOWED_TYPES = ['text', 'number', 'date', 'email', 'telephone', 'gps', 'document', 'boolean'];

// GET all info_employes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, intitule, type, obligatoire
      FROM info_employes
      ORDER BY intitule
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching info_employes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET single info_employes by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, intitule, type, obligatoire
      FROM info_employes
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Champ d\'information non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching info_employe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST create new info_employes
router.post('/', async (req, res) => {
  try {
    const { intitule, type, obligatoire } = req.body;
    
    // Validation
    if (!intitule || intitule.trim() === '') {
      return res.status(400).json({ message: 'Le nom du champ est obligatoire' });
    }
    
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ 
        message: 'Le type doit être l\'une des valeurs suivantes: ' + ALLOWED_TYPES.join(', ')
      });
    }
    
    // Ensure obligatoire is boolean (0 or 1)
    const isObligatoire = obligatoire ? 1 : 0;
    
    // Check for duplicates
    const [existing] = await pool.query('SELECT id FROM info_employes WHERE intitule = ?', [intitule]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Un champ avec ce nom existe déjà' });
    }
    
    // Insert new field
    const [result] = await pool.query(
      'INSERT INTO info_employes (intitule, type, obligatoire) VALUES (?, ?, ?)',
      [intitule, type, isObligatoire]
    );
    
    res.status(201).json({
      message: 'Champ d\'information créé avec succès',
      id: result.insertId,
      intitule,
      type,
      obligatoire: isObligatoire
    });
  } catch (error) {
    console.error('Error creating info_employe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT update info_employes
router.put('/:id', async (req, res) => {
  try {
    const { intitule, type, obligatoire } = req.body;
    const infoId = req.params.id;
    
    // Check if field exists
    const [existing] = await pool.query('SELECT id FROM info_employes WHERE id = ?', [infoId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Champ d\'information non trouvé' });
    }
    
    // Start building the query and parameters
    let updateFields = [];
    let updateParams = [];
    
    // Add parameters if they exist
    if (intitule !== undefined) {
      if (intitule.trim() === '') {
        return res.status(400).json({ message: 'Le nom du champ ne peut pas être vide' });
      }
      
      // Check for duplicates (excluding current ID)
      const [duplicates] = await pool.query(
        'SELECT id FROM info_employes WHERE intitule = ? AND id != ?', 
        [intitule, infoId]
      );
      
      if (duplicates.length > 0) {
        return res.status(400).json({ message: 'Un champ avec ce nom existe déjà' });
      }
      
      updateFields.push('intitule = ?');
      updateParams.push(intitule);
    }
    
    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ 
          message: 'Le type doit être l\'une des valeurs suivantes: ' + ALLOWED_TYPES.join(', ')
        });
      }
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    
    if (obligatoire !== undefined) {
      const isObligatoire = obligatoire ? 1 : 0;
      updateFields.push('obligatoire = ?');
      updateParams.push(isObligatoire);
    }
    
    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }
    
    // Add ID to parameters
    updateParams.push(infoId);
    
    // Execute update
    await pool.query(
      `UPDATE info_employes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Get updated record
    const [updated] = await pool.query('SELECT id, intitule, type, obligatoire FROM info_employes WHERE id = ?', [infoId]);
    
    res.json({
      message: 'Champ d\'information mis à jour avec succès',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating info_employe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE info_employes
router.delete('/:id', async (req, res) => {
  try {
    const infoId = req.params.id;
    console.log(`DELETE request for info-employes with ID: ${infoId}`);

    // Check if the field exists
    console.log('Checking if field exists...');
    const [existing] = await pool.query(
      'SELECT * FROM info_employes WHERE id = ?',
      [infoId]
    );

    if (existing.length === 0) {
      console.log(`Field with ID ${infoId} not found`);
      return res.status(404).json({ message: 'Champ non trouvé' });
    }
    console.log('Field exists:', existing[0]);

    // Delete the field
    console.log('Executing DELETE query...');
    const [deleteResult] = await pool.query(
      'DELETE FROM info_employes WHERE id = ?', 
      [infoId]
    );
    console.log('Delete result:', deleteResult);

    res.json({ 
      message: 'Champ supprimé avec succès',
      affectedRows: deleteResult.affectedRows
    });
  } catch (error) {
    console.error('Error deleting info-employe field:', error);
    // Log more details about the error
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du champ', 
      error: error.message 
    });
  }
});

module.exports = router; 