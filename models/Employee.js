const db = require('../config/db');

class Employee {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM employe');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM employe WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(employeeData) {
    const [result] = await db.query('INSERT INTO employe SET ?', [employeeData]);
    return result.insertId;
  }

  static async update(id, employeeData) {
    const [result] = await db.query('UPDATE employe SET ? WHERE id = ?', [employeeData, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM employe WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Employee; 