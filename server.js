const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const entitesRoutes = require('./routes/entites');
const { testConnection } = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

testConnection();

app.use('/api', authRoutes);
app.use('/api/entites', entitesRoutes);

app.get('/', (req, res) => {
  res.send('HR Management API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 