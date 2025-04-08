const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// Helper function to build tree structure
const buildTree = (items, parentId = null) => {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
};

// Helper function to check for circular references
const hasCircularReference = async (entiteId, parentId) => {
  if (!parentId) return false;
  
  let currentParentId = parentId;
  const visited = new Set([entiteId]);
  
  while (currentParentId) {
    if (visited.has(currentParentId)) return true;
    visited.add(currentParentId);
    
    const [parent] = await pool.query(
      'SELECT parent_id FROM entites WHERE id = ?',
      [currentParentId]
    );
    currentParentId = parent[0]?.parent_id;
  }
  
  return false;
};

// GET all types
router.get('/types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM types');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all possible parents for an entité (excluding itself and its descendants)
router.get('/:id/possible-parents', async (req, res) => {
  try {
    const entiteId = req.params.id;
    const [rows] = await pool.query(`
      WITH RECURSIVE descendants AS (
        SELECT id FROM entites WHERE id = ?
        UNION ALL
        SELECT e.id FROM entites e
        JOIN descendants d ON e.parent_id = d.id
      )
      SELECT e.*, t.designation as type_name
      FROM entites e
      LEFT JOIN types t ON e.type_id = t.id
      WHERE e.id NOT IN (SELECT id FROM descendants)
    `, [entiteId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching possible parents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all entites (as tree)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, t.designation as type_name 
      FROM entites e 
      LEFT JOIN types t ON e.type_id = t.id
    `);
    const tree = buildTree(rows);
    res.json(tree);
  } catch (error) {
    console.error('Error fetching entites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single entite
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, t.designation as type_name 
      FROM entites e 
      LEFT JOIN types t ON e.type_id = t.id 
      WHERE e.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entite not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching entite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new entite
router.post('/', async (req, res) => {
  try {
    const { tituler, type_id, status, parent_id } = req.body;
    
    // Validate required fields
    if (!tituler || !type_id || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate status
    if (!['active', 'non active'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If parent_id is provided, validate it exists
    if (parent_id) {
      const [parent] = await pool.query('SELECT id FROM entites WHERE id = ?', [parent_id]);
      if (parent.length === 0) {
        return res.status(400).json({ message: 'Invalid parent_id' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO entites (tituler, type_id, status, parent_id) VALUES (?, ?, ?, ?)',
      [tituler, type_id, status, parent_id]
    );

    res.status(201).json({ 
      message: 'Entite created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating entite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update entite
router.put('/:id', async (req, res) => {
  try {
    const { tituler, type_id, status, parent_id } = req.body;
    const entiteId = req.params.id;

    // Check if entite exists
    const [existing] = await pool.query('SELECT id FROM entites WHERE id = ?', [entiteId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Entite not found' });
    }

    // Validate status if provided
    if (status && !['active', 'non active'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If parent_id is provided, validate it exists and isn't the same as the current entite
    if (parent_id) {
      if (parent_id === entiteId) {
        return res.status(400).json({ message: 'An entite cannot be its own parent' });
      }
      
      const [parent] = await pool.query('SELECT id FROM entites WHERE id = ?', [parent_id]);
      if (parent.length === 0) {
        return res.status(400).json({ message: 'Invalid parent_id' });
      }

      // Check for circular references
      const hasCircular = await hasCircularReference(entiteId, parent_id);
      if (hasCircular) {
        return res.status(400).json({ message: 'Circular reference detected in hierarchy' });
      }
    }

    await pool.query(
      'UPDATE entites SET tituler = COALESCE(?, tituler), type_id = COALESCE(?, type_id), status = COALESCE(?, status), parent_id = ? WHERE id = ?',
      [tituler, type_id, status, parent_id, entiteId]
    );

    res.json({ message: 'Entite updated successfully' });
  } catch (error) {
    console.error('Error updating entite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE entite
router.delete('/:id', async (req, res) => {
  try {
    const entiteId = req.params.id;

    // Check if entite exists
    const [existing] = await pool.query('SELECT id FROM entites WHERE id = ?', [entiteId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Entite not found' });
    }

    // Check if entite has children
    const [children] = await pool.query('SELECT id FROM entites WHERE parent_id = ?', [entiteId]);
    if (children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete entite with children. Please reassign or delete children first.' 
      });
    }

    await pool.query('DELETE FROM entites WHERE id = ?', [entiteId]);
    res.json({ message: 'Entite deleted successfully' });
  } catch (error) {
    console.error('Error deleting entite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 