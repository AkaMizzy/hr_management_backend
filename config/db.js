const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hr_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

module.exports = { pool, testConnection }; 