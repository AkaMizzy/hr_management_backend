const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for action file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/actions');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'action-' + uniqueSuffix + ext);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non valide. Seuls JPEG, PNG, GIF, PDF et DOCX sont autorisés.'), false);
  }
};

// Configure upload middleware with 5MB size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Get all tasks (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { manager_id, status } = req.query;
    let query = `
      SELECT t.*, 
             COUNT(DISTINCT te.employe_id) as assigned_employees_count,
             COUNT(DISTINCT a.id) as actions_count
      FROM tache t
      LEFT JOIN tache_employe te ON t.id = te.tache_id
      LEFT JOIN action a ON te.id = a.tache_employe_id
    `;

    const queryParams = [];
    if (manager_id || status) {
      query += ' WHERE';
      if (manager_id) {
        query += ' t.manager_id = ?';
        queryParams.push(manager_id);
      }
      if (status) {
        if (manager_id) query += ' AND';
        query += ' t.status = ?';
        queryParams.push(status);
      }
    }

    query += ' GROUP BY t.id ORDER BY t.ddr DESC';

    const [tasks] = await pool.query(query, queryParams);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks assigned to a specific employee
router.get('/employee/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    const query = `
      SELECT t.*, 
             te.id as assignment_id,
             te.assigned_at,
             COUNT(a.id) as actions_count
      FROM tache t
      JOIN tache_employe te ON t.id = te.tache_id
      LEFT JOIN action a ON te.id = a.tache_employe_id
      WHERE te.employe_id = ?
      GROUP BY t.id, te.id
      ORDER BY t.ddr DESC
    `;
    
    const [tasks] = await pool.query(query, [employeId]);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { intitule, description, ddr, dfr, manager_id } = req.body;

    // Validate required fields
    if (!intitule || !ddr || !dfr || !manager_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO tache (intitule, description, ddr, dfr, status, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
      [intitule, description, ddr, dfr, 'pending', manager_id]
    );

    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign task to employee(s)
router.post('/:taskId/assign', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { employeeIds, manager_id } = req.body;

    // Check if employeeIds is provided and is an array
    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ message: 'Employee IDs must be an array' });
    }

    // Check if task exists and belongs to the manager
    const [taskExists] = await pool.query(
      'SELECT id FROM tache WHERE id = ? AND manager_id = ?', 
      [taskId, manager_id]
    );
    
    if (taskExists.length === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Remove existing assignments
      await connection.query(
        'DELETE FROM tache_employe WHERE tache_id = ?',
        [taskId]
      );

      // Only create new assignments if there are employees to assign
      if (employeeIds.length > 0) {
        const values = employeeIds.map(employeeId => [taskId, employeeId]);
        await connection.query(
          'INSERT INTO tache_employe (tache_id, employe_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      res.status(200).json({ 
        message: employeeIds.length > 0 ? 'Task assigned successfully' : 'All assignments removed successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add action to task with image upload
router.post('/:taskId/actions', upload.single('photo'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { employeId, intitule, detail} = req.body;

    // Validate required fields
    if (!employeId || !intitule || !detail) {
      // If file was uploaded, delete it since we're returning an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get tache_employe id
    const [assignment] = await pool.query(
      'SELECT id FROM tache_employe WHERE tache_id = ? AND employe_id = ?',
      [taskId, employeId]
    );

    if (assignment.length === 0) {
      // If file was uploaded, delete it since we're returning an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Task assignment not found' });
    }

    // Insert action with photo path if a file was uploaded
    const [result] = await pool.query(
      'INSERT INTO action (intitule, detail, photo, tache_employe_id) VALUES (?, ?, ?, ?)',
      [
        intitule, 
        detail || null, 
        req.file ? req.file.path : null, 
        assignment[0].id
      ]
    );

    res.status(201).json({
      message: 'Action added successfully',
      actionId: result.insertId,
      photo: req.file ? req.file.path : null
    });
  } catch (error) {
    // If file was uploaded and there's an error, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error adding action:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task (manager only)
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { intitule, description, ddr, dfr, status, manager_id } = req.body;

    // Validate required fields
    if (!intitule || !ddr || !dfr || !manager_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify manager owns the task
    const [task] = await pool.query(
      'SELECT id FROM tache WHERE id = ? AND manager_id = ?',
      [taskId, manager_id]
    );

    if (task.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to update this task' });
    }

    // If status is provided, verify it's valid
    if (status) {
      const validStatuses = ['pending', 'done', 'forwarded', 'cancel'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
    }

    // Update the task
    await pool.query(
      `UPDATE tache 
       SET intitule = ?, 
           description = ?, 
           ddr = ?, 
           dfr = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [intitule, description, ddr, dfr, status, taskId]
    );

    res.json({ 
      message: 'Task updated successfully',
      taskId: taskId
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status (manager only)
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, manager_id } = req.body;

    if (!status || !manager_id) {
      return res.status(400).json({ message: 'Status and manager_id are required' });
    }

    // Verify valid status
    const validStatuses = ['pending', 'done', 'forwarded', 'cancel'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify manager owns the task
    const [task] = await pool.query(
      'SELECT id FROM tache WHERE id = ? AND manager_id = ?',
      [taskId, manager_id]
    );

    if (task.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to update this task' });
    }

    await pool.query(
      'UPDATE tache SET status = ? WHERE id = ?',
      [status, taskId]
    );

    res.json({ message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task details with actions
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get task details
    const [task] = await pool.query(`
      SELECT * FROM tache WHERE id = ?
    `, [taskId]);

    if (task.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get assignments separately
    const [assignments] = await pool.query(`
      SELECT te.id as assignment_id, te.employe_id, te.assigned_at,
             e.nom, e.prenom, e.email
      FROM tache_employe te
      LEFT JOIN employes e ON te.employe_id = e.id
      WHERE te.tache_id = ?
    `, [taskId]);

    // Get actions for each assignment
    const assignmentsWithActions = await Promise.all(
      assignments.map(async (assignment) => {
        const [actions] = await pool.query(`
          SELECT id, intitule, detail, photo
          FROM action
          WHERE tache_employe_id = ?
        `, [assignment.assignment_id]);

        return {
          ...assignment,
          actions: actions
        };
      })
    );

    // Combine all data
    const taskWithDetails = {
      ...task[0],
      assignments: assignmentsWithActions
    };

    res.json(taskWithDetails);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task (manager only)
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { manager_id } = req.query; // Get manager_id from query params

    if (!manager_id) {
      return res.status(400).json({ message: 'Manager ID is required' });
    }

    // Verify manager owns the task
    const [task] = await pool.query(
      'SELECT id FROM tache WHERE id = ? AND manager_id = ?',
      [taskId, manager_id]
    );

    if (task.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to delete this task or task not found' });
    }

    // Delete the task (cascade will handle related records in tache_employe and action tables)
    await pool.query('DELETE FROM tache WHERE id = ?', [taskId]);

    res.json({ 
      message: 'Task deleted successfully',
      taskId: taskId
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get action file
router.get('/actions/file/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    
    // Get action info
    const [actions] = await pool.query('SELECT photo FROM action WHERE id = ?', [actionId]);
    
    if (actions.length === 0 || !actions[0].photo) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    const filePath = actions[0].photo;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }
    
    // Get file extension and set content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType;
    let disposition = 'inline';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        disposition = 'attachment';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        disposition = 'attachment';
        break;
      default:
        contentType = 'application/octet-stream';
        disposition = 'attachment';
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${path.basename(filePath)}"`);
    
    // Send file
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('Error fetching action file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 