const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const entitesRoutes = require('./routes/entites');
const employesRoutes = require('./routes/employes');
const documentsRoutes = require('./routes/documents');
const infoEmployesRoutes = require('./routes/info-employes');
const employeInfoRoutes = require('./routes/employe-info');
const tachesRoutes = require('./routes/taches');
const usersRoutes = require('./routes/users');
const attestationsRoutes = require('./routes/attestations');
const absencesRoutes = require('./routes/absences');
const congesRoutes = require('./routes/conges');
const noteFraisRoutes = require('./routes/note_frais');
const paieRoutes = require('./routes/paie');
const { testConnection } = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


testConnection();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entites', entitesRoutes);
app.use('/api/employes', employesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/info-employes', infoEmployesRoutes);
app.use('/api/employe-info', employeInfoRoutes);
app.use('/api/taches', tachesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attestations', attestationsRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/conges', congesRoutes);
app.use('/api/note-frais', noteFraisRoutes);
app.use('/api/paie', paieRoutes);

// Serve static files from uploads directory for document viewing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('HR Management API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier est trop volumineux. La taille maximale est de 5MB.' });
    }
    return res.status(400).json({ message: 'Erreur lors de l\'upload du fichier.' });
  }
  
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// 404 route handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 

