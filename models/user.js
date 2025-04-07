const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async create(userData) {
    const { name, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    return result.insertId;
  }

  static async updatePassword(email, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User; 