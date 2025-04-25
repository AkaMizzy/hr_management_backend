const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const employeId = req.params.employeId;
    const dir = path.join(__dirname, `../uploads/${employeId}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original name and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.originalname.replace(ext, '') + '-' + uniqueSuffix + ext);
  }
});

// File filter for document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non valide. Seuls PDF, Word, JPEG et PNG sont autorisés.'), false);
  }
};

// Configure upload middleware with 5MB size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// GET all documents for an employee
router.get('/:employeId', async (req, res) => {
  try {
    const employeId = req.params.employeId;
    
    // Validate employee exists
    const [employe] = await pool.query('SELECT id FROM employes WHERE id = ?', [employeId]);
    if (employe.length === 0) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    
    // Get all documents for the employee
    const [documents] = await pool.query(`
      SELECT id, employe_id, nom_fichier, chemin_fichier, type_fichier, description, date_upload
      FROM documents
      WHERE employe_id = ?
      ORDER BY date_upload DESC
    `, [employeId]);
    
    // Map filenames to include full path and make paths relative for frontend
    const documentsWithPaths = documents.map(doc => {
      return {
        ...doc,
        // Create a web-accessible path from physical path
        file_url: `/uploads/${employeId}/${path.basename(doc.chemin_fichier)}`
      };
    });
    
    res.json(documentsWithPaths);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST upload a new document for an employee
router.post('/upload/:employeId', (req, res) => {
  // Use single with 'document' field name, but allow 'file' as well to be flexible
  const uploadMiddleware = upload.single('document');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Le fichier dépasse la limite de taille de 5 Mo' });
      }
      return res.status(400).json({ message: err.message });
    }
    
    try {
      // Check if file is in req.file (from upload.single('document'))
      // If not, check if it's under a different field name
      if (!req.file) {
        // Frontend might be using 'file' as the field name
        if (req.files && req.files.file) {
          req.file = req.files.file[0];
        } else {
          return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
        }
      }
      
      const employeId = req.params.employeId;
      const description = req.body.description || '';
      
      // Validate employee exists
      const [employe] = await pool.query('SELECT id FROM employes WHERE id = ?', [employeId]);
      if (employe.length === 0) {
        // Remove uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Employé non trouvé' });
      }
      
      // Get file type from mimetype
      let type_fichier;
      switch (req.file.mimetype) {
        case 'application/pdf':
          type_fichier = 'PDF';
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          type_fichier = 'DOCX';
          break;
        case 'image/jpeg':
          type_fichier = 'JPEG';
          break;
        case 'image/png':
          type_fichier = 'PNG';
          break;
        default:
          type_fichier = 'OTHER';
      }
      
      // Save document info to database
      const [result] = await pool.query(`
        INSERT INTO documents (employe_id, nom_fichier, chemin_fichier, type_fichier, description)
        VALUES (?, ?, ?, ?, ?)
      `, [
        employeId,
        req.file.originalname,
        req.file.path,
        type_fichier,
        description
      ]);
      
      res.status(201).json({
        message: 'Document téléchargé avec succès',
        documentId: result.insertId,
        filename: req.file.originalname,
        type: type_fichier
      });
      
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // If file already uploaded, remove it
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: error.message || 'Erreur lors du téléchargement du document' });
    }
  });
});

// GET view a document directly
router.get('/view/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    // Get document info
    const [documents] = await pool.query('SELECT * FROM documents WHERE id = ?', [documentId]);
    
    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    const document = documents[0];
    
    // Check if file exists
    if (!fs.existsSync(document.chemin_fichier)) {
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }
    
    // Determine content-type based on file type
    let contentType;
    switch (document.type_fichier) {
      case 'PDF':
        contentType = 'application/pdf';
        break;
      case 'DOCX':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'JPEG':
        contentType = 'image/jpeg';
        break;
      case 'PNG':
        contentType = 'image/png';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Set appropriate headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${document.nom_fichier}"`);
    
    // Send file
    res.sendFile(path.resolve(document.chemin_fichier));
    
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET download a document
router.get('/download/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    // Get document info
    const [documents] = await pool.query('SELECT * FROM documents WHERE id = ?', [documentId]);
    
    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    const document = documents[0];
    
    // Check if file exists
    if (!fs.existsSync(document.chemin_fichier)) {
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.nom_fichier}"`);
    
    // Send file
    res.download(document.chemin_fichier, document.nom_fichier, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        return res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
      }
    });
    
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE a document
router.delete('/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    // Get document info
    const [documents] = await pool.query('SELECT * FROM documents WHERE id = ?', [documentId]);
    
    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    const document = documents[0];
    
    // Delete file from filesystem if it exists
    if (fs.existsSync(document.chemin_fichier)) {
      fs.unlinkSync(document.chemin_fichier);
    }
    
    // Delete from database
    await pool.query('DELETE FROM documents WHERE id = ?', [documentId]);
    
    res.json({ message: 'Document supprimé avec succès' });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 